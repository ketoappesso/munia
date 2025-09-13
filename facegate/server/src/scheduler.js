function isWithinWindow(startAt, endAt) {
  const now = Date.now();
  const start = new Date(startAt).getTime();
  const end = endAt ? new Date(endAt).getTime() : null;
  return now >= start && (!end || now <= end);
}

function matchCronField(part, val, min, max) {
  if (part === '*') return true;
  if (part.startsWith('*/')) {
    const step = Number(part.slice(2));
    if (!step) return false;
    return (val - min) % step === 0;
  }
  if (part.includes(',')) {
    return part.split(',').some(p => matchCronField(p.trim(), val, min, max));
  }
  const num = Number(part);
  if (Number.isNaN(num)) return false;
  return num === val;
}

function isCronDue(cron, date) {
  try {
    const parts = String(cron).trim().split(/\s+/);
    if (parts.length < 5) return true;
    const [min, hour, dom, mon, dow] = parts;
    const m = date.getMinutes();
    const h = date.getHours();
    const D = date.getDate();
    const M = date.getMonth() + 1;
    const W = date.getDay();
    return (
      matchCronField(min, m, 0, 59) &&
      matchCronField(hour, h, 0, 23) &&
      matchCronField(dom, D, 1, 31) &&
      matchCronField(mon, M, 1, 12) &&
      matchCronField(dow, W, 0, 6)
    );
  } catch {
    return true;
  }
}

function startSchedulers({ db, conns, send, log }) {
  async function createJobsFromSchedules() {
    try {
      const [schedules] = await db.query('SELECT id, start_at, end_at, cron FROM schedules WHERE status IN (0,1) ORDER BY id DESC LIMIT 200');
      if (!Array.isArray(schedules) || schedules.length === 0) return;
      for (const s of schedules) {
        const within = isWithinWindow(s.start_at, s.end_at);
        const cronOk = s.cron ? isCronDue(s.cron, new Date()) : true;
        if (!(within && cronOk)) continue;
        const [targets] = await db.query('SELECT device_id FROM schedule_targets WHERE schedule_id=?', [s.id]);
        if (!targets.length) continue;
        for (const t of targets) {
          if (!s.cron) {
            const [existingAny] = await db.query('SELECT id FROM jobs WHERE schedule_id=? AND device_id=? LIMIT 1', [s.id, t.device_id]);
            if (Array.isArray(existingAny) && existingAny.length) continue;
          } else {
            const since = new Date(Date.now() - 55 * 1000);
            const [recent] = await db.query('SELECT id, state FROM jobs WHERE schedule_id=? AND device_id=? AND updated_at>=? ORDER BY id DESC LIMIT 1', [s.id, t.device_id, since]);
            if (Array.isArray(recent) && recent.length) continue;
            const [pending] = await db.query('SELECT id FROM jobs WHERE schedule_id=? AND device_id=? AND state=\'pending\' LIMIT 1', [s.id, t.device_id]);
            if (Array.isArray(pending) && pending.length) continue;
          }
          await db.execute('INSERT INTO jobs(schedule_id, device_id, state) VALUES(?,?,\'pending\')', [s.id, t.device_id]);
        }
      }
    } catch (e) { log?.error?.('createJobsFromSchedules error:', e); }
  }

  async function dispatchPendingJobs() {
    try {
      const [rows] = await db.query(
        `SELECT j.id as job_id, j.device_id, j.schedule_id,
                s.payload_type, s.image_id,
                i.url as image_url
           FROM jobs j
           JOIN schedules s ON s.id=j.schedule_id
           LEFT JOIN images i ON i.id=s.image_id
          WHERE j.state='pending'
          ORDER BY j.id ASC
          LIMIT 50`
      );
      for (const job of rows) {
        const ws = conns.get(job.device_id);
        if (!ws) continue; // offline
        try {
          const req_id = Date.now() & 0xffffffff;
          if (job.payload_type === 'image') {
            send(ws, { method: 'pushDisplayImage', params: { Url: job.image_url }, req_id });
          } else if (job.payload_type === 'face') {
            send(ws, { method: 'insertPerson', params: {}, req_id });
          } else {
            await db.execute('UPDATE jobs SET state=\'failed\', last_error=? WHERE id=?', ['Unknown payload', job.job_id]);
            continue;
          }
          await db.execute('UPDATE jobs SET state=\'sent\' WHERE id=?', [job.job_id]);
          await db.execute('INSERT INTO logs(type, ref_id, message) VALUES(?,?,?)', ['job', job.job_id, `sent to ${job.device_id}`]);
        } catch (e) {
          log?.error?.('dispatch job error:', e);
          await db.execute('UPDATE jobs SET state=\'failed\', retry_count=retry_count+1, last_error=? WHERE id=?', [e.message || 'send failed', job.job_id]);
        }
      }
    } catch (e) { log?.error?.('dispatchPendingJobs error:', e); }
  }

  async function requeueFailedJobs() {
    try {
      const threshold = new Date(Date.now() - 30 * 1000);
      const [rows] = await db.query('SELECT id, retry_count FROM jobs WHERE state=\'failed\' AND updated_at<? AND retry_count<3 LIMIT 100', [threshold]);
      for (const j of rows) { await db.execute('UPDATE jobs SET state=\'pending\' WHERE id=?', [j.id]); }
    } catch (e) { log?.error?.('requeueFailedJobs error:', e); }
  }

  const timers = [];
  const start = () => {
    timers.push(setInterval(createJobsFromSchedules, 10 * 1000));
    timers.push(setInterval(dispatchPendingJobs, 5 * 1000));
    timers.push(setInterval(requeueFailedJobs, 30 * 1000));
  };
  const stop = () => { timers.forEach(t => clearInterval(t)); };

  return { start, stop };
}

module.exports = { startSchedulers, isWithinWindow, isCronDue };

