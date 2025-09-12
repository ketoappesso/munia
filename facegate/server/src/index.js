const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const { WebSocketServer } = require('ws');
const pino = require('pino');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createPospalClient } = require('./lib/pospal');

const log = pino({ level: 'info' });

// ----------- ENV -----------
const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 7001;
const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'facegate';
const JWT_SECRET = process.env.JWT_SECRET || 'change_me_secret';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// ----------- DB -----------
let db;
let useMockDB = false;

(async () => {
  try {
    db = await mysql.createPool({
      host: DB_HOST, user: DB_USER, password: DB_PASSWORD, database: DB_NAME,
      waitForConnections: true, connectionLimit: 10
    });
    // Test connection
    await db.query('SELECT 1');
    log.info('MySQL pool ready');
  } catch (e) {
    log.warn('MySQL connection failed, using mock database:', e.message);
    useMockDB = true;
    db = require('./db-mock');
    log.info('Mock database ready');
  }
})();

// ----------- WS -----------
const conns = new Map(); // deviceId -> ws

function send(ws, msg) {
  try {
    ws.send(JSON.stringify(msg));
  } catch (e) { log.error(e); }
}
function ok(method, req_id, params = {}) {
  return { method, params, result: 0, errMsg: 'Success', req_id };
}
function err(method, req_id, code, msg) {
  return { method, result: code, errMsg: msg || 'Error', req_id };
}

async function handleMessage(ws, data) {
  let msg;
  try { msg = JSON.parse(data.toString()); } catch {
    return send(ws, err('invalid', 0, 100, 'Bad JSON'));
  }
  const { method, params = {}, req_id } = msg || {};
  try {
    switch (method) {
      case 'registerDevice': {
        const { DeviceId, ProdType, ProdName } = params;
        if (!DeviceId) return send(ws, err(method, req_id, 100, 'DeviceId required'));
        ws.deviceId = DeviceId;
        conns.set(DeviceId, ws);
        await db.execute(
          'INSERT INTO devices(device_id,prod_type,prod_name,last_seen_ts) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE prod_type=?, prod_name=?, last_seen_ts=?',
          [DeviceId, ProdType, ProdName, Math.floor(Date.now()/1000), ProdType, ProdName, Math.floor(Date.now()/1000)]
        );
        return send(ws, ok(method, req_id, { Timestamp: Math.floor(Date.now()/1000) }));
      }
      case 'heartBeat': {
        const { DeviceId } = params;
        if (DeviceId) {
          await db.execute('UPDATE devices SET last_seen_ts=? WHERE device_id=?', [Math.floor(Date.now()/1000), DeviceId]);
        }
        return send(ws, ok(method, req_id));
      }
      case 'uploadRecords': {
        const { DeviceId, Records } = params;
        if (!DeviceId || !Array.isArray(Records)) return send(ws, err(method, req_id, 100, 'Bad params'));
        for (const r of Records) {
          await db.execute(
            'INSERT IGNORE INTO records(device_id,record_id,person_id,record_time,record_type,record_pass,similarity,qrcode,raw) VALUES(?,?,?,?,?,?,?,?,?)',
            [DeviceId, r.RecordID, r.PersonID, r.RecordTime, r.RecordType, r.RecordPass, r.Similarity || null, r.QRCode || null, JSON.stringify(r)]
          );
        }
        return send(ws, ok(method, req_id));
      }
      case 'insertPerson':
      case 'updatePerson':
      case 'removePerson': {
        return send(ws, ok(method, req_id));
      }
      default:
        return send(ws, err(method || 'unknown', req_id || 0, 105, 'Not supported'));
    }
  } catch (e) {
    log.error(e);
    return send(ws, err(method || 'unknown', req_id || 0, 900, 'Internal'));
  }
}

// Create WebSocket server
const wss = new WebSocketServer({ port: WS_PORT, maxPayload: 32 * 1024 * 1024 });
wss.on('connection', (ws) => {
  ws.on('message', (data) => handleMessage(ws, data));
  ws.on('close', () => { if (ws.deviceId) conns.delete(ws.deviceId); });
});
log.info(`WS gateway listening on :${WS_PORT}`);

// helpers to call device
function remoteOpenDoor(deviceId, devIdx = 0) {
  const ws = conns.get(deviceId);
  if (!ws) throw new Error('Device offline');
  const req_id = Date.now() & 0xffffffff;
  ws.send(JSON.stringify({ method: 'pushRemoteOpenDoor', params: { DevIdx: devIdx }, req_id }));
}
function relayOut(deviceId, relayIdx = 0, delaySec = 5) {
  const ws = conns.get(deviceId);
  if (!ws) throw new Error('Device offline');
  const req_id = Date.now() & 0xffffffff;
  ws.send(JSON.stringify({ method: 'pushRelayOut', params: { RelayIdx: relayIdx, Delay: delaySec }, req_id }));
}

// ----------- FILE UPLOAD -----------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)){
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'person-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// ----------- REST API -----------
const app = express();
// Configure CORS with explicit settings
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = CORS_ORIGIN.split(',').map(s => s.trim());
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins for development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// auth middleware
function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// login (single password, no username)
app.post('/api/login', (req, res) => {
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'Password required' });
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Wrong password' });
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token });
});

// devices
app.get('/api/devices', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM devices ORDER BY last_seen_ts DESC');
    const now = Math.floor(Date.now()/1000);
    const mapped = rows.map(r => ({ 
      ...r, 
      online: r.last_seen_ts ? (now - r.last_seen_ts) < 120 : false 
    }));
    res.json({ items: mapped });
  } catch (e) {
    log.error(e);
    res.json({ items: [] });
  }
});

app.post('/api/devices/:id/open', auth, async (req, res) => {
  try {
    remoteOpenDoor(req.params.id, req.body.devIdx ?? 0);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/devices/:id/relay', auth, async (req, res) => {
  try {
    relayOut(req.params.id, req.body.relayIdx ?? 0, req.body.delay ?? 5);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// persons (updated to use phone as primary key)
app.get('/api/persons', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM persons ORDER BY updated_at DESC');
    res.json({ items: rows });
  } catch (e) {
    log.error(e);
    res.json({ items: [] });
  }
});

// Add new person with photo upload
app.post('/api/persons', auth, upload.single('photo'), async (req, res) => {
  try {
    const { phone, person_name, ic_card_id, idcard_no } = req.body || {};
    if (!phone || !person_name) {
      return res.status(400).json({ error: 'phone & person_name required' });
    }
    
    // Validate phone format (basic validation)
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }
    
    let picture_file = null;
    let picture_url = null;
    
    if (req.file) {
      picture_file = req.file.filename;
      picture_url = `/uploads/${req.file.filename}`;
    }
    
    await db.execute(
      'INSERT INTO persons(phone, person_name, picture_url, picture_file, ic_card_id, idcard_no) VALUES(?,?,?,?,?,?) ON DUPLICATE KEY UPDATE person_name=?, picture_url=?, picture_file=?, ic_card_id=?, idcard_no=?',
      [phone, person_name, picture_url, picture_file, ic_card_id || null, idcard_no || null, 
       person_name, picture_url, picture_file, ic_card_id || null, idcard_no || null]
    );
    res.json({ ok: true });
  } catch (e) {
    log.error(e);
    res.status(500).json({ error: 'Failed to add person' });
  }
});

// Update person with optional photo upload
app.put('/api/persons/:phone', auth, upload.single('photo'), async (req, res) => {
  try {
    const { phone } = req.params;
    const { person_name, ic_card_id, idcard_no } = req.body || {};
    
    let updateFields = [];
    let updateValues = [];
    
    if (person_name) {
      updateFields.push('person_name=?');
      updateValues.push(person_name);
    }
    
    if (req.file) {
      const picture_file = req.file.filename;
      const picture_url = `/uploads/${req.file.filename}`;
      updateFields.push('picture_url=?', 'picture_file=?');
      updateValues.push(picture_url, picture_file);
    }
    
    if (ic_card_id !== undefined) {
      updateFields.push('ic_card_id=?');
      updateValues.push(ic_card_id || null);
    }
    
    if (idcard_no !== undefined) {
      updateFields.push('idcard_no=?');
      updateValues.push(idcard_no || null);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updateValues.push(phone);
    await db.execute(
      `UPDATE persons SET ${updateFields.join(', ')} WHERE phone=?`,
      updateValues
    );
    
    res.json({ ok: true });
  } catch (e) {
    log.error(e);
    res.status(500).json({ error: 'Failed to update person' });
  }
});

app.delete('/api/persons/:phone', auth, async (req, res) => {
  try {
    await db.execute('DELETE FROM persons WHERE phone=?', [req.params.phone]);
    res.json({ ok: true });
  } catch (e) {
    log.error(e);
    res.status(500).json({ error: 'Failed to delete person' });
  }
});

// Fetch member info from Pospal API
app.post('/api/persons/fetch-member', auth, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number required' });
    }
    
    const pospalClient = createPospalClient();
    const customer = await pospalClient.queryCustomerByPhone(phone);
    
    if (!customer) {
      return res.json({
        isValid: false,
        level: '非会员',
        expiryDate: null,
        balance: 0,
        points: 0,
        isApeLord: false,
        customerUid: null,
        name: null,
        message: `No member found for phone: ${phone}`
      });
    }
    
    const expiryDate = customer.expiryDate ? new Date(customer.expiryDate) : null;
    const isValid = customer.enable === 1 && (!expiryDate || expiryDate > new Date());
    const isApeLord = customer.categoryName?.includes('猿佬') || 
                     customer.categoryName?.includes('钻石') ||
                     customer.categoryName?.includes('至尊') ||
                     false;
    
    const mainBalance = customer.balance || 0;
    const subsidyBalance = customer.extInfo?.subsidyAmount || 0;
    const totalBalance = mainBalance + subsidyBalance;
    
    // Update person record with member info
    await db.execute(
      'UPDATE persons SET member_level=?, member_expiry=?, is_ape_lord=? WHERE phone=?',
      [customer.categoryName || '普通会员', customer.expiryDate || null, isApeLord ? 1 : 0, phone]
    );
    
    res.json({
      isValid,
      level: customer.categoryName || '普通会员',
      expiryDate: customer.expiryDate || null,
      balance: totalBalance,
      points: customer.point || 0,
      isApeLord,
      customerUid: customer.customerUid,
      name: customer.name,
      discount: customer.discount || 100,
      phone: customer.phone,
      daysRemaining: expiryDate 
        ? Math.max(0, Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null
    });
  } catch (error) {
    log.error('Error fetching member info:', error);
    res.status(500).json({ error: 'Failed to fetch member info: ' + error.message });
  }
});

// Sync persons to all devices
app.post('/api/persons/sync-devices', auth, async (req, res) => {
  try {
    const { persons } = req.body;
    if (!Array.isArray(persons)) {
      return res.status(400).json({ error: 'Persons array required' });
    }
    
    let deviceCount = 0;
    let successCount = 0;
    
    // Get all connected devices
    for (const [deviceId, ws] of conns) {
      deviceCount++;
      try {
        // Send each person to the device
        for (const person of persons) {
          const msg = {
            method: 'insertPerson',
            params: {
              DeviceId: deviceId,
              PersonID: person.phone,
              PersonName: person.person_name,
              ICCardID: person.ic_card_id || '',
              IDCardNo: person.idcard_no || '',
              PictureUrl: person.picture_url || '',
              MemberLevel: person.member_level || '',
              MemberExpiry: person.member_expiry || '',
              IsApeLord: person.is_ape_lord || false
            },
            req_id: Date.now()
          };
          send(ws, msg);
        }
        successCount++;
      } catch (e) {
        log.error(`Failed to sync to device ${deviceId}:`, e);
      }
    }
    
    res.json({ 
      ok: true, 
      deviceCount: successCount,
      totalDevices: deviceCount,
      personCount: persons.length 
    });
  } catch (e) {
    log.error('Error syncing to devices:', e);
    res.status(500).json({ error: 'Failed to sync to devices' });
  }
});

// records
app.get('/api/records', auth, async (req, res) => {
  try {
    const { deviceId, personId, from, to, page = 1, pageSize = 20 } = req.query;
    let where = 'WHERE 1=1';
    const args = [];
    if (deviceId) { where += ' AND device_id=?'; args.push(deviceId); }
    if (personId) { where += ' AND person_phone=?'; args.push(personId); }
    if (from) { where += ' AND record_time>=?'; args.push(Number(from)); }
    if (to) { where += ' AND record_time<=?'; args.push(Number(to)); }
    const limit = Math.min(100, Number(pageSize) || 20);
    const offset = (Math.max(1, Number(page) || 1) - 1) * limit;
    const [rows] = await db.query(`SELECT * FROM records ${where} ORDER BY record_time DESC LIMIT ? OFFSET ?`, args.concat([limit, offset]));
    res.json({ items: rows, page: Number(page)||1, pageSize: limit });
  } catch (e) {
    log.error(e);
    res.json({ items: [], page: 1, pageSize: 20 });
  }
});

app.listen(PORT, () => log.info(`REST API listening on :${PORT}`));
