const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const { createPospalClient } = require('../lib/pospal');

function createApiRouter(ctx) {
  const { db, upload, conns, gateway, env, log } = ctx;
  const { JWT_SECRET, ADMIN_PASSWORD } = env;
  const router = express.Router();

  function auth(req, res, next) {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'No token' });
    try { jwt.verify(token, JWT_SECRET); next(); } catch { return res.status(401).json({ error: 'Invalid token' }); }
  }

  function getUserPhone(req) {
    return (req.headers['x-user-phone'] || req.body?.user_phone || '').toString();
  }

  // login
  router.post('/login', (req, res) => {
    const { password } = req.body || {};
    if (!password) return res.status(400).json({ error: 'Password required' });
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Wrong password' });
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ token });
  });

  // devices
  router.get('/devices', auth, async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM devices ORDER BY last_seen_ts DESC');
      const now = Math.floor(Date.now()/1000);
      const mapped = rows.map(r => ({ ...r, online: r.last_seen_ts ? (now - r.last_seen_ts) < 120 : false }));
      res.json({ items: mapped });
    } catch (e) { log?.error?.(e); res.json({ items: [] }); }
  });

  router.post('/devices/:id/open', auth, async (req, res) => {
    try { gateway.remoteOpenDoor(req.params.id, req.body.devIdx ?? 0); res.json({ ok: true }); }
    catch (e) { res.status(400).json({ error: e.message }); }
  });
  router.post('/devices/:id/relay', auth, async (req, res) => {
    try { gateway.relayOut(req.params.id, req.body.relayIdx ?? 0, req.body.delay ?? 5); res.json({ ok: true }); }
    catch (e) { res.status(400).json({ error: e.message }); }
  });

  // persons
  router.get('/persons', auth, async (req, res) => {
    try { const [rows] = await db.query('SELECT * FROM persons ORDER BY updated_at DESC'); res.json({ items: rows }); }
    catch (e) { log?.error?.(e); res.json({ items: [] }); }
  });

  router.post('/persons', auth, upload.single('photo'), async (req, res) => {
    try {
      const { phone, person_name, ic_card_id, idcard_no } = req.body || {};
      if (!phone || !person_name) return res.status(400).json({ error: 'phone & person_name required' });
      const phoneRegex = /^[0-9]{10,15}$/;
      if (!phoneRegex.test(phone)) return res.status(400).json({ error: 'Invalid phone number format' });
      let picture_file = null; let picture_url = null;
      if (req.file) { picture_file = req.file.filename; picture_url = `/uploads/${req.file.filename}`; }
      if (db.flavor === 'postgres') {
        await db.execute(
          'INSERT INTO persons(phone, person_name, picture_url, picture_file, ic_card_id, idcard_no) VALUES(?,?,?,?,?,?) ON CONFLICT(phone) DO UPDATE SET person_name=EXCLUDED.person_name, picture_url=EXCLUDED.picture_url, picture_file=EXCLUDED.picture_file, ic_card_id=EXCLUDED.ic_card_id, idcard_no=EXCLUDED.idcard_no',
          [phone, person_name, picture_url, picture_file, ic_card_id || null, idcard_no || null]
        );
      } else if (db.flavor === 'sqlite') {
        await db.execute(
          'INSERT INTO persons(phone, person_name, picture_url, picture_file, ic_card_id, idcard_no) VALUES(?,?,?,?,?,?) ON CONFLICT(phone) DO UPDATE SET person_name=excluded.person_name, picture_url=excluded.picture_url, picture_file=excluded.picture_file, ic_card_id=excluded.ic_card_id, idcard_no=excluded.idcard_no',
          [phone, person_name, picture_url, picture_file, ic_card_id || null, idcard_no || null]
        );
      } else {
        await db.execute(
          'INSERT INTO persons(phone, person_name, picture_url, picture_file, ic_card_id, idcard_no) VALUES(?,?,?,?,?,?) ON DUPLICATE KEY UPDATE person_name=?, picture_url=?, picture_file=?, ic_card_id=?, idcard_no=?',
          [phone, person_name, picture_url, picture_file, ic_card_id || null, idcard_no || null, person_name, picture_url, picture_file, ic_card_id || null, idcard_no || null]
        );
      }
      res.json({ ok: true });
    } catch (e) { log?.error?.(e); res.status(500).json({ error: 'Failed to add person' }); }
  });

  // Fetch member info from Pospal API
  router.post('/persons/fetch-member', auth, async (req, res) => {
    try {
      const { phone } = req.body;
      if (!phone) return res.status(400).json({ error: 'Phone number required' });
      const pospalClient = createPospalClient();
      const customer = await pospalClient.queryCustomerByPhone(phone);
      if (!customer) {
        return res.json({ isValid: false, level: '非会员', expiryDate: null, balance: 0, points: 0, isApeLord: false, customerUid: null, name: null, message: `No member found for phone: ${phone}` });
      }
      const expiryDate = customer.expiryDate ? new Date(customer.expiryDate) : null;
      const isValid = customer.enable === 1 && (!expiryDate || expiryDate > new Date());
      const isApeLord = customer.categoryName?.includes('猿佬') || customer.categoryName?.includes('钻石') || customer.categoryName?.includes('至尊') || false;
      const mainBalance = customer.balance || 0;
      const subsidyBalance = customer.extInfo?.subsidyAmount || 0;
      const totalBalance = mainBalance + subsidyBalance;
      await db.execute('UPDATE persons SET member_level=?, member_expiry=?, is_ape_lord=? WHERE phone=?', [customer.categoryName || '普通会员', customer.expiryDate || null, isApeLord ? 1 : 0, phone]);
      res.json({ isValid, level: customer.categoryName || '普通会员', expiryDate: customer.expiryDate || null, balance: totalBalance, points: customer.point || 0, isApeLord, customerUid: customer.customerUid, name: customer.name, discount: customer.discount || 100, phone: customer.phone, daysRemaining: expiryDate ? Math.max(0, Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null });
    } catch (error) {
      log?.error?.('Error fetching member info:', error);
      res.status(500).json({ error: 'Failed to fetch member info: ' + error.message });
    }
  });

  router.put('/persons/:phone', auth, upload.single('photo'), async (req, res) => {
    try {
      const { phone } = req.params; const { person_name, ic_card_id, idcard_no } = req.body || {};
      let updateFields = []; let updateValues = [];
      if (person_name) { updateFields.push('person_name=?'); updateValues.push(person_name); }
      if (req.file) { const picture_file = req.file.filename; const picture_url = `/uploads/${req.file.filename}`; updateFields.push('picture_url=?', 'picture_file=?'); updateValues.push(picture_url, picture_file); }
      if (ic_card_id !== undefined) { updateFields.push('ic_card_id=?'); updateValues.push(ic_card_id || null); }
      if (idcard_no !== undefined) { updateFields.push('idcard_no=?'); updateValues.push(idcard_no || null); }
      if (updateFields.length === 0) return res.status(400).json({ error: 'No fields to update' });
      updateValues.push(phone);
      await db.execute(`UPDATE persons SET ${updateFields.join(', ')} WHERE phone=?`, updateValues);
      res.json({ ok: true });
    } catch (e) { log?.error?.(e); res.status(500).json({ error: 'Failed to update person' }); }
  });

  router.delete('/persons/:phone', auth, async (req, res) => {
    try { await db.execute('DELETE FROM persons WHERE phone=?', [req.params.phone]); res.json({ ok: true }); }
    catch (e) { log?.error?.(e); res.status(500).json({ error: 'Failed to delete person' }); }
  });

  // Sync persons to all devices
  router.post('/persons/sync-devices', auth, async (req, res) => {
    try {
      const { persons } = req.body;
      if (!Array.isArray(persons)) return res.status(400).json({ error: 'Persons array required' });
      let deviceCount = 0, successCount = 0;
      for (const [deviceId, ws] of gateway.conns) {
        deviceCount++;
        try {
          for (const person of persons) {
            const msg = { method: 'insertPerson', params: { DeviceId: deviceId, PersonID: person.phone, PersonName: person.person_name, ICCardID: person.ic_card_id || '', IDCardNo: person.idcard_no || '', PictureUrl: person.picture_url || '', MemberLevel: person.member_level || '', MemberExpiry: person.member_expiry || '', IsApeLord: person.is_ape_lord || false }, req_id: Date.now() };
            gateway.send(ws, msg);
          }
          successCount++;
        } catch (e) { log?.error?.(`Failed to sync to device ${deviceId}:`, e); }
      }
      res.json({ ok: true, deviceCount: successCount, totalDevices: deviceCount, personCount: persons.length });
    } catch (e) { log?.error?.('Error syncing to devices:', e); res.status(500).json({ error: 'Failed to sync to devices' }); }
  });

  // images & schedules
  router.post('/images', auth, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'file required' });
      const user_phone = getUserPhone(req) || null; const file_name = req.file.filename; const url = `/uploads/${file_name}`;
      if (db.flavor === 'postgres') {
        const ret = await db.execute('INSERT INTO images(user_phone, url, file_name) VALUES(?,?,?) RETURNING id', [user_phone, url, file_name]);
        const id = ret.rows && ret.rows[0] ? ret.rows[0].id : null; return res.json({ id, url });
      }
      const ret = await db.execute('INSERT INTO images(user_phone, url, file_name) VALUES(?,?,?)', [user_phone, url, file_name]);
      const id = ret.insertId || ret.lastInsertRowid || null; res.json({ id, url });
    } catch (e) { log?.error?.(e); res.status(500).json({ error: 'Failed to upload image' }); }
  });

  router.post('/schedules', auth, async (req, res) => {
    try {
      const { image_id, start_at, end_at, cron, targets = [], payload_type } = req.body || {};
      const user_phone = getUserPhone(req);
      if (!user_phone) return res.status(400).json({ error: 'user_phone required' });
      if (!image_id && payload_type !== 'face') return res.status(400).json({ error: 'image_id required for image payload' });
      if (!start_at) return res.status(400).json({ error: 'start_at required' });
      const toMySQL = (dt) => { if (!dt) return null; if (typeof dt !== 'string') return dt; let s = dt.replace('T',' '); if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(s)) s += ':00'; return s; };
      const startAt = toMySQL(start_at); const endAt = toMySQL(end_at);
      let scheduleId;
      if (db.flavor === 'postgres') {
        const ret = await db.execute('INSERT INTO schedules(user_phone, image_id, payload_type, start_at, end_at, cron, status) VALUES(?,?,?,?,?,?,?) RETURNING id', [user_phone, image_id || null, payload_type || 'image', startAt, endAt || null, cron || null, 0]);
        scheduleId = ret.rows && ret.rows[0] ? ret.rows[0].id : null;
      } else {
        const ret = await db.execute('INSERT INTO schedules(user_phone, image_id, payload_type, start_at, end_at, cron, status) VALUES(?,?,?,?,?,?,?)', [user_phone, image_id || null, payload_type || 'image', startAt, endAt || null, cron || null, 0]);
        scheduleId = ret.insertId || ret.lastInsertRowid;
      }
      if (Array.isArray(targets) && targets.length) {
        if (db.flavor === 'mysql') {
          const values = targets.map(d => [scheduleId, d]);
          await db.query('INSERT IGNORE INTO schedule_targets(schedule_id, device_id) VALUES ?', [values]);
        } else if (db.flavor === 'postgres') {
          for (const d of targets) await db.execute('INSERT INTO schedule_targets(schedule_id, device_id) VALUES(?,?) ON CONFLICT(schedule_id, device_id) DO NOTHING', [scheduleId, d]);
        } else { // sqlite
          for (const d of targets) await db.execute('INSERT OR IGNORE INTO schedule_targets(schedule_id, device_id) VALUES(?,?)', [scheduleId, d]);
        }
      }
      res.json({ id: scheduleId });
    } catch (e) { log?.error?.(e); res.status(500).json({ error: 'Failed to create schedule' }); }
  });

  router.get('/schedules', auth, async (req, res) => {
    try {
      const user_phone = (req.query.all === '1') ? null : getUserPhone(req);
      let sql = 'SELECT * FROM schedules'; const args = [];
      if (user_phone) { sql += ' WHERE user_phone=?'; args.push(user_phone); }
      sql += ' ORDER BY created_at DESC LIMIT 200';
      const [schedules] = await db.query(sql, args);
      const ids = schedules.map(s => s.id);
      const targets = ids.length ? (await db.query('SELECT schedule_id, device_id FROM schedule_targets WHERE schedule_id IN (?)', [ids]))[0] : [];
      const targetMap = (targets||[]).reduce((m, t) => { (m[t.schedule_id] ||= []).push(t.device_id); return m; }, {});
      const items = schedules.map(s => ({ ...s, targets: targetMap[s.id] || [] }));
      res.json({ items });
    } catch (e) { log?.error?.(e); res.status(500).json({ error: 'Failed to list schedules' }); }
  });

  router.delete('/schedules/:id', auth, async (req, res) => {
    try { const id = Number(req.params.id); await db.execute('DELETE FROM schedule_targets WHERE schedule_id=?', [id]); await db.execute('DELETE FROM schedules WHERE id=?', [id]); res.json({ ok: true }); }
    catch (e) { log?.error?.(e); res.status(500).json({ error: 'Failed to delete schedule' }); }
  });

  router.get('/jobs', auth, async (req, res) => {
    try { const { schedule_id, device_id, state } = req.query || {}; let sql = 'SELECT * FROM jobs WHERE 1=1'; const args = []; if (schedule_id) { sql += ' AND schedule_id=?'; args.push(Number(schedule_id)); } if (device_id) { sql += ' AND device_id=?'; args.push(String(device_id)); } if (state) { sql += ' AND state=?'; args.push(String(state)); } sql += ' ORDER BY id DESC LIMIT 200'; const [items] = await db.query(sql, args); res.json({ items }); }
    catch (e) { log?.error?.(e); res.status(500).json({ error: 'Failed to query jobs' }); }
  });

  // records
  router.get('/records', auth, async (req, res) => {
    try {
      const { deviceId, personId, from, to, page = 1, pageSize = 20 } = req.query;
      let where = 'WHERE 1=1'; const args = [];
      if (deviceId) { where += ' AND device_id=?'; args.push(deviceId); }
      if (personId) { where += ' AND person_phone=?'; args.push(personId); }
      if (from) { where += ' AND record_time>=?'; args.push(Number(from)); }
      if (to) { where += ' AND record_time<=?'; args.push(Number(to)); }
      const limit = Math.min(100, Number(pageSize) || 20);
      const offset = (Math.max(1, Number(page) || 1) - 1) * limit;
      const [rows] = await db.query(`SELECT * FROM records ${where} ORDER BY record_time DESC LIMIT ? OFFSET ?`, args.concat([limit, offset]));
      res.json({ items: rows, page: Number(page)||1, pageSize: limit });
    } catch (e) { log?.error?.(e); res.json({ items: [], page: 1, pageSize: 20 }); }
  });

  return router;
}

module.exports = { createApiRouter };
