-- VATRate: OAuth Login Support (GitHub, Google)
-- Run this in Supabase SQL Editor

-- Add OAuth columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Allow email to be nullable for OAuth-only users (if they don't provide email)
-- But we keep it NOT NULL for now since GitHub/Google always provide email

-- Index for looking up users by OAuth provider + ID
CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_id);

-- Add unique constraint for (oauth_provider, oauth_id) to prevent duplicate accounts
-- Only applies when both are not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oauth_unique ON users(oauth_provider, oauth_id) WHERE oauth_provider IS NOT NULL AND oauth_id IS NOT NULL;
