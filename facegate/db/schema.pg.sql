-- PostgreSQL schema for facegate
CREATE TABLE IF NOT EXISTS devices (
  device_id VARCHAR(64) PRIMARY KEY,
  prod_type VARCHAR(32),
  prod_name VARCHAR(64),
  relay_slots INTEGER DEFAULT 0,
  last_seen_ts BIGINT,
  tz VARCHAR(32),
  fw_version VARCHAR(32),
  status SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS persons (
  phone VARCHAR(20) PRIMARY KEY,
  person_name VARCHAR(128) NOT NULL,
  picture_url TEXT,
  picture_file VARCHAR(255),
  ic_card_id VARCHAR(64),
  idcard_no VARCHAR(32),
  member_level VARCHAR(64),
  member_expiry TIMESTAMP WITH TIME ZONE,
  is_ape_lord SMALLINT DEFAULT 0,
  pass_plans JSONB,
  ext JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS records (
  id BIGSERIAL PRIMARY KEY,
  device_id VARCHAR(64) NOT NULL,
  record_id BIGINT NOT NULL,
  person_phone VARCHAR(20),
  record_time BIGINT,
  record_type INT,
  record_pass INT,
  similarity NUMERIC(5,2),
  qrcode TEXT,
  health_code_color VARCHAR(16),
  record_pic_url TEXT,
  idcard_pic_url TEXT,
  raw JSONB
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_dev_rec ON records(device_id, record_id);

-- Scheduling
CREATE TABLE IF NOT EXISTS images (
  id BIGSERIAL PRIMARY KEY,
  user_phone VARCHAR(20),
  url TEXT,
  file_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schedules (
  id BIGSERIAL PRIMARY KEY,
  user_phone VARCHAR(20) NOT NULL,
  image_id BIGINT,
  payload_type VARCHAR(16) DEFAULT 'image',
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE,
  cron VARCHAR(64),
  status SMALLINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schedule_targets (
  id BIGSERIAL PRIMARY KEY,
  schedule_id BIGINT NOT NULL,
  device_id VARCHAR(64) NOT NULL,
  UNIQUE(schedule_id, device_id)
);

CREATE TABLE IF NOT EXISTS jobs (
  id BIGSERIAL PRIMARY KEY,
  schedule_id BIGINT NOT NULL,
  device_id VARCHAR(64) NOT NULL,
  state VARCHAR(16) DEFAULT 'pending',
  retry_count INT DEFAULT 0,
  last_error TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sched_dev ON jobs(schedule_id, device_id);

CREATE TABLE IF NOT EXISTS logs (
  id BIGSERIAL PRIMARY KEY,
  type VARCHAR(32) NOT NULL,
  ref_id BIGINT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

