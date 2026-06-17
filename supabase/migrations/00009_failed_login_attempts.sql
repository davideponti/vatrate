-- VATRate: Add failed login attempts tracking
-- Run this in Supabase SQL Editor

-- Add columns for account lockout functionality
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;