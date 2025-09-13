const { WebSocketServer } = require('ws');

function send(ws, msg) {
  try { ws.send(JSON.stringify(msg)); } catch (_) {}
}
function ok(method, req_id, params = {}) {
  return { method, params, result: 0, errMsg: 'Success', req_id };
}
function err(method, req_id, code, msg) {
  return { method, result: code, errMsg: msg || 'Error', req_id };
}

function createGateway({ db, log }) {
  const conns = new Map(); // deviceId -> ws

  async function handleMessage(ws, data) {
    let msg;
    try { msg = JSON.parse(data.toString()); } catch { return send(ws, err('invalid', 0, 100, 'Bad JSON')); }
    const { method, params = {}, req_id } = msg || {};
    try {
      switch (method) {
        case 'registerDevice': {
          const { DeviceId, ProdType, ProdName } = params;
          if (!DeviceId) return send(ws, err(method, req_id, 100, 'DeviceId required'));
          ws.deviceId = DeviceId;
          conns.set(DeviceId, ws);
          const nowTs = Math.floor(Date.now()/1000);
          if (db.flavor === 'postgres') {
            await db.execute(
              'INSERT INTO devices(device_id,prod_type,prod_name,last_seen_ts) VALUES(?,?,?,?) ON CONFLICT(device_id) DO UPDATE SET prod_type=EXCLUDED.prod_type, prod_name=EXCLUDED.prod_name, last_seen_ts=EXCLUDED.last_seen_ts',
              [DeviceId, ProdType, ProdName, nowTs]
            );
          } else if (db.flavor === 'sqlite') {
            await db.execute(
              'INSERT INTO devices(device_id,prod_type,prod_name,last_seen_ts) VALUES(?,?,?,?) ON CONFLICT(device_id) DO UPDATE SET prod_type=excluded.prod_type, prod_name=excluded.prod_name, last_seen_ts=excluded.last_seen_ts',
              [DeviceId, ProdType, ProdName, nowTs]
            );
          } else {
            await db.execute(
              'INSERT INTO devices(device_id,prod_type,prod_name,last_seen_ts) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE prod_type=?, prod_name=?, last_seen_ts=?',
              [DeviceId, ProdType, ProdName, nowTs, ProdType, ProdName, nowTs]
            );
          }
          return send(ws, ok(method, req_id, { Timestamp: nowTs }));
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
            if (db.flavor === 'postgres') {
              await db.execute(
                'INSERT INTO records(device_id,record_id,person_phone,record_time,record_type,record_pass,similarity,qrcode,raw) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(device_id,record_id) DO NOTHING',
                [DeviceId, r.RecordID, r.PersonID, r.RecordTime, r.RecordType, r.RecordPass, r.Similarity || null, r.QRCode || null, JSON.stringify(r)]
              );
            } else if (db.flavor === 'sqlite') {
              await db.execute(
                'INSERT OR IGNORE INTO records(device_id,record_id,person_phone,record_time,record_type,record_pass,similarity,qrcode,raw) VALUES(?,?,?,?,?,?,?,?,?)',
                [DeviceId, r.RecordID, r.PersonID, r.RecordTime, r.RecordType, r.RecordPass, r.Similarity || null, r.QRCode || null, JSON.stringify(r)]
              );
            } else {
              await db.execute(
                'INSERT IGNORE INTO records(device_id,record_id,person_phone,record_time,record_type,record_pass,similarity,qrcode,raw) VALUES(?,?,?,?,?,?,?,?,?)',
                [DeviceId, r.RecordID, r.PersonID, r.RecordTime, r.RecordType, r.RecordPass, r.Similarity || null, r.QRCode || null, JSON.stringify(r)]
              );
            }
          }
          return send(ws, ok(method, req_id));
        }
        case 'insertPerson':
        case 'updatePerson':
        case 'removePerson':
          return send(ws, ok(method, req_id));
        default:
          return send(ws, err(method || 'unknown', req_id || 0, 105, 'Not supported'));
      }
    } catch (e) {
      log?.error?.(e);
      return send(ws, err(method || 'unknown', req_id || 0, 900, 'Internal'));
    }
  }

  function attachToServer(server, { path = '/ws' } = {}) {
    const wss = new WebSocketServer({ server, path, maxPayload: 32 * 1024 * 1024 });
    wss.on('connection', (ws) => {
      ws.on('message', (data) => handleMessage(ws, data));
      ws.on('close', () => { if (ws.deviceId) conns.delete(ws.deviceId); });
    });
    return wss;
  }

  function attachToPort({ port, host = '0.0.0.0', path } = {}) {
    const wss = new WebSocketServer({ port, host, path, maxPayload: 32 * 1024 * 1024 });
    wss.on('connection', (ws) => {
      ws.on('message', (data) => handleMessage(ws, data));
      ws.on('close', () => { if (ws.deviceId) conns.delete(ws.deviceId); });
    });
    return wss;
  }

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
    // Keep param name 'Delay' for backward compatibility with existing devices
    ws.send(JSON.stringify({ method: 'pushRelayOut', params: { RelayIdx: relayIdx, Delay: delaySec }, req_id }));
  }

  return { conns, send, ok, err, handleMessage, attachToServer, attachToPort, remoteOpenDoor, relayOut };
}

module.exports = { createGateway };
