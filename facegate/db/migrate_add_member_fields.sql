-- Migration script to add member fields to persons table
-- Run this script if you have an existing database

-- Add member_level column if not exists
ALTER TABLE persons ADD COLUMN IF NOT EXISTS member_level VARCHAR(64) DEFAULT NULL;

-- Add member_expiry column if not exists
ALTER TABLE persons ADD COLUMN IF NOT EXISTS member_expiry DATETIME DEFAULT NULL;

-- Add is_ape_lord column if not exists
ALTER TABLE persons ADD COLUMN IF NOT EXISTS is_ape_lord TINYINT DEFAULT 0;