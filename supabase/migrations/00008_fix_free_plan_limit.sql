-- VATRate: Fix free plan request limit from 30000 to 100
-- Run this in Supabase SQL Editor after existing migrations

-- Update default for future users
ALTER TABLE users 
  ALTER COLUMN requests_limit SET DEFAULT 100;

-- Update default for future API keys
ALTER TABLE api_keys 
  ALTER COLUMN requests_limit SET DEFAULT 100;

-- Fix existing users on free plan who have the old 30000 default
UPDATE users
SET requests_limit = 100
WHERE plan = 'free' AND requests_limit > 100;

-- Fix existing API keys on free plan with old limit
UPDATE api_keys
SET requests_limit = 100
WHERE plan = 'free' AND requests_limit > 100;
