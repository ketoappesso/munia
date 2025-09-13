-- Migration: scheduling and delivery tables
-- Run: mysql -u root -p < db/migrate_schedules.sql

CREATE TABLE IF NOT EXISTS images (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_phone VARCHAR(20) DEFAULT NULL,
  url TEXT,
  file_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS schedules (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_phone VARCHAR(20) NOT NULL,
  image_id BIGINT DEFAULT NULL,
  payload_type ENUM('image','face') DEFAULT 'image',
  start_at DATETIME NOT NULL,
  end_at DATETIME DEFAULT NULL,
  cron VARCHAR(64) DEFAULT NULL,
  status TINYINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_phone (user_phone),
  INDEX idx_start_at (start_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS schedule_targets (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  schedule_id BIGINT NOT NULL,
  device_id VARCHAR(64) NOT NULL,
  UNIQUE KEY uniq_schedule_device (schedule_id, device_id),
  INDEX idx_schedule (schedule_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS jobs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  schedule_id BIGINT NOT NULL,
  device_id VARCHAR(64) NOT NULL,
  state ENUM('pending','sent','failed') DEFAULT 'pending',
  retry_count INT DEFAULT 0,
  last_error TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sched_dev (schedule_id, device_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(32) NOT NULL,
  ref_id BIGINT DEFAULT NULL,
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_type_ref (type, ref_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

