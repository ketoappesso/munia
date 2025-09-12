-- MySQL schema for facegate
CREATE TABLE IF NOT EXISTS devices (
  device_id VARCHAR(64) PRIMARY KEY,
  prod_type VARCHAR(32),
  prod_name VARCHAR(64),
  relay_slots INT DEFAULT 0,
  last_seen_ts BIGINT,
  tz VARCHAR(32),
  fw_version VARCHAR(32),
  status TINYINT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS persons (
  phone VARCHAR(20) PRIMARY KEY,
  person_name VARCHAR(128) NOT NULL,
  picture_url TEXT,
  picture_file VARCHAR(255),
  ic_card_id VARCHAR(64),
  idcard_no VARCHAR(32),
  member_level VARCHAR(64),
  member_expiry DATETIME,
  is_ape_lord TINYINT DEFAULT 0,
  pass_plans JSON,
  ext JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS records (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  device_id VARCHAR(64) NOT NULL,
  record_id BIGINT NOT NULL,
  person_phone VARCHAR(20),
  record_time BIGINT,
  record_type INT,
  record_pass INT,
  similarity DECIMAL(5,2),
  qrcode TEXT,
  health_code_color VARCHAR(16),
  record_pic_url TEXT,
  idcard_pic_url TEXT,
  raw JSON,
  UNIQUE KEY uniq_dev_rec (device_id, record_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
