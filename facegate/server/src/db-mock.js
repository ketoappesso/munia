// Mock database for testing when MySQL is not available
const persons = [];
const devices = [];
const records = [];
const images = [];
const schedules = [];
const schedule_targets = [];
const jobs = [];
const logs = [];

let auto = { image: 1, schedule: 1, job: 1, log: 1 };

module.exports = {
  async query(sql, params) {
    console.log('Mock DB Query:', sql);
    
    if (sql.includes('SELECT * FROM persons')) {
      return [persons];
    }
    if (sql.includes('SELECT * FROM devices')) {
      return [devices];
    }
    if (sql.includes('SELECT * FROM devices')) {
      return [devices];
    }
    if (sql.includes('SELECT * FROM records')) {
      return [records.slice(0, 20)];
    }
    if (sql.includes('SELECT LAST_INSERT_ID()')) {
      // Return last image id for our usage
      return [{ id: auto.image - 1 }];
    }
    if (sql.includes('FROM schedules') && sql.includes('ORDER BY created_at')) {
      const all = [...schedules].sort((a,b)=>b.id-a.id).slice(0,200);
      if (sql.includes('WHERE user_phone=?')) {
        const filtered = all.filter(s => s.user_phone === params[0]);
        return [filtered];
      }
      return [all];
    }
    if (sql.includes('SELECT device_id FROM schedule_targets WHERE schedule_id=?')) {
      const sid = params[0];
      const rows = schedule_targets.filter(t => t.schedule_id === sid).map(t => ({ device_id: t.device_id }));
      return [rows];
    }
    if (sql.includes('SELECT id, start_at, end_at') && sql.includes('FROM schedules')) {
      return [schedules.map(s=>({ id:s.id, start_at:s.start_at, end_at:s.end_at, cron:s.cron }))];
    }
    if (sql.includes('SELECT id FROM jobs WHERE schedule_id=? AND device_id=? AND state=') && sql.includes('pending')) {
      const sid = params[0], did = params[1];
      const row = jobs.find(j => j.schedule_id === sid && j.device_id === did && j.state === 'pending');
      return [row ? [row] : []];
    }
    if (sql.includes('SELECT id FROM jobs WHERE schedule_id=? AND device_id=? LIMIT 1')) {
      const sid = params[0], did = params[1];
      const row = jobs.find(j => j.schedule_id === sid && j.device_id === did);
      return [row ? [row] : []];
    }
    if (sql.includes('SELECT id, state FROM jobs WHERE schedule_id=? AND device_id=? AND updated_at>=')) {
      const sid = params[0], did = params[1], since = new Date(params[2]);
      const row = jobs.find(j => j.schedule_id === sid && j.device_id === did && new Date(j.updated_at) >= since);
      return [row ? [row] : []];
    }
    if (sql.includes('FROM jobs j') && sql.includes('JOIN schedules')) {
      const pending = jobs.filter(j => j.state === 'pending').slice(0,50);
      const rows = pending.map(j => {
        const s = schedules.find(x => x.id === j.schedule_id) || {};
        const i = images.find(x => x.id === s.image_id) || {};
        return { job_id: j.id, device_id: j.device_id, schedule_id: j.schedule_id, payload_type: s.payload_type, image_id: s.image_id, image_url: i.url };
      });
      return [rows];
    }
    if (sql.startsWith('SELECT * FROM jobs WHERE')) {
      let items = [...jobs];
      if (sql.includes('schedule_id=?')) items = items.filter(j => j.schedule_id === Number(params.shift()));
      if (sql.includes('device_id=?')) items = items.filter(j => j.device_id === params.shift());
      if (sql.includes('state=?')) items = items.filter(j => j.state === params.shift());
      items.sort((a,b)=>b.id-a.id);
      return [items.slice(0,200)];
    }
    
    return [[]];
  },
  
  async execute(sql, params) {
    console.log('Mock DB Execute:', sql);
    
    if (sql.includes('INSERT INTO persons')) {
      // params: [phone, person_name, picture_url, picture_file, ic_card_id, idcard_no, ...]
      const person = {
        phone: params[0],
        person_name: params[1],
        picture_url: params[2],
        picture_file: params[3],
        ic_card_id: params[4],
        idcard_no: params[5],
        updated_at: new Date().toISOString()
      };
      
      // Check if person exists
      const existingIndex = persons.findIndex(p => p.phone === person.phone);
      if (existingIndex >= 0) {
        // Update existing
        persons[existingIndex] = { ...persons[existingIndex], ...person };
      } else {
        // Add new
        persons.push(person);
      }
      
      return [{ affectedRows: 1 }];
    }
    
    if (sql.includes('DELETE FROM persons')) {
      const phone = params[0];
      const index = persons.findIndex(p => p.phone === phone);
      if (index >= 0) {
        persons.splice(index, 1);
      }
      return [{ affectedRows: 1 }];
    }
    
    if (sql.includes('UPDATE persons')) {
      // Handle updates
      return [{ affectedRows: 1 }];
    }
    if (sql.includes('INSERT INTO images')) {
      const row = { id: auto.image++, user_phone: params[0] || null, url: params[1], file_name: params[2], created_at: new Date().toISOString() };
      images.push(row);
      return [{ insertId: row.id }];
    }
    if (sql.includes('INSERT INTO schedules')) {
      const row = { id: auto.schedule++, user_phone: params[0], image_id: params[1], payload_type: params[2], start_at: params[3], end_at: params[4], cron: params[5], status: params[6], created_at: new Date().toISOString() };
      schedules.push(row);
      return [{ insertId: row.id }];
    }
    if (sql.startsWith('INSERT IGNORE INTO schedule_targets')) {
      const values = params[0] || [];
      for (const [schedule_id, device_id] of values) {
        if (!schedule_targets.find(t => t.schedule_id === schedule_id && t.device_id === device_id)) {
          schedule_targets.push({ id: schedule_targets.length+1, schedule_id, device_id });
        }
      }
      return [{ affectedRows: values.length }];
    }
    if (sql.includes('DELETE FROM schedule_targets WHERE schedule_id=?')) {
      const sid = params[0];
      for (let i=schedule_targets.length-1;i>=0;i--) if (schedule_targets[i].schedule_id===sid) schedule_targets.splice(i,1);
      return [{ affectedRows: 1 }];
    }
    if (sql.includes('DELETE FROM schedules WHERE id=?')) {
      const sid = params[0];
      const idx = schedules.findIndex(s => s.id === sid);
      if (idx>=0) schedules.splice(idx,1);
      return [{ affectedRows: 1 }];
    }
    if (sql.includes('INSERT INTO jobs')) {
      const row = { id: auto.job++, schedule_id: params[0], device_id: params[1], state: params[2], retry_count: 0, last_error: null, updated_at: new Date().toISOString() };
      jobs.push(row);
      return [{ insertId: row.id }];
    }
    if (sql.includes('UPDATE jobs SET state=\'sent\'')) {
      const id = params[0];
      const j = jobs.find(x => x.id === id); if (j){ j.state='sent'; j.updated_at=new Date().toISOString(); }
      return [{ affectedRows: 1 }];
    }
    if (sql.includes('UPDATE jobs SET state=\'failed\'')) {
      const id = params[1];
      const j = jobs.find(x => x.id === id); if (j){ j.state='failed'; j.retry_count=(j.retry_count||0)+1; j.last_error=params[0]; j.updated_at=new Date().toISOString(); }
      return [{ affectedRows: 1 }];
    }
    if (sql.includes('UPDATE jobs SET state=\'pending\'')) {
      const id = params[0];
      const j = jobs.find(x => x.id === id); if (j){ j.state='pending'; j.updated_at=new Date().toISOString(); }
      return [{ affectedRows: 1 }];
    }
    if (sql.includes('INSERT INTO logs')) {
      const row = { id: auto.log++, type: params[0], ref_id: params[1], message: params[2], created_at: new Date().toISOString() };
      logs.push(row);
      return [{ insertId: row.id }];
    }
    if (sql.includes('INSERT INTO devices')) {
      const device_id = params[0];
      let d = devices.find(x => x.device_id===device_id);
      if (!d) { d = { device_id }; devices.push(d); }
      d.prod_type = params[1]; d.prod_name=params[2]; d.last_seen_ts=params[3];
      return [{ affectedRows: 1 }];
    }
    if (sql.includes('UPDATE devices SET last_seen_ts=')) {
      const ts=params[0], id=params[1];
      const d = devices.find(x=>x.device_id===id); if(d) d.last_seen_ts=ts;
      return [{ affectedRows: 1 }];
    }
    if (sql.includes('INSERT IGNORE INTO records')) {
      // naive append
      records.push({ device_id: params[0], record_id: params[1], person_phone: params[2], record_time: params[3], raw: params[8] });
      return [{ affectedRows: 1 }];
    }
    
    return [{ affectedRows: 0 }];
  }
};
