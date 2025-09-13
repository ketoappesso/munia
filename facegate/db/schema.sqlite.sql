-- SQLite schema for facegate
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS devices (
  device_id TEXT PRIMARY KEY,
  prod_type TEXT,
  prod_name TEXT,
  relay_slots INTEGER DEFAULT 0,
  last_seen_ts INTEGER,
  tz TEXT,
  fw_version TEXT,
  status INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS persons (
  phone TEXT PRIMARY KEY,
  person_name TEXT NOT NULL,
  picture_url TEXT,
  picture_file TEXT,
  ic_card_id TEXT,
  idcard_no TEXT,
  member_level TEXT,
  member_expiry TEXT,
  is_ape_lord INTEGER DEFAULT 0,
  pass_plans TEXT,
  ext TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  record_id INTEGER NOT NULL,
  person_phone TEXT,
  record_time INTEGER,
  record_type INTEGER,
  record_pass INTEGER,
  similarity REAL,
  qrcode TEXT,
  health_code_color TEXT,
  record_pic_url TEXT,
  idcard_pic_url TEXT,
  raw TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_dev_rec ON records(device_id, record_id);

-- Scheduling
CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_phone TEXT,
  url TEXT,
  file_name TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_phone TEXT NOT NULL,
  image_id INTEGER,
  payload_type TEXT DEFAULT 'image',
  start_at TEXT NOT NULL,
  end_at TEXT,
  cron TEXT,
  status INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS schedule_targets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  schedule_id INTEGER NOT NULL,
  device_id TEXT NOT NULL,
  UNIQUE(schedule_id, device_id)
);

CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  schedule_id INTEGER NOT NULL,
  device_id TEXT NOT NULL,
  state TEXT DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sched_dev ON jobs(schedule_id, device_id);

CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  ref_id INTEGER,
  message TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

