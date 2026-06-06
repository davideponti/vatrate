-- VATRate: Email Verification
-- Run this in Supabase SQL Editor

-- Add email verification columns to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_code TEXT,
  ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ;
