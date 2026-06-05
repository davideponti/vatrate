-- VATRate: API Keys & Usage Tracking
-- Run this in Supabase SQL Editor

-- Users table (minimal, auto-created on signup)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro', 'enterprise', 'widget')),
  requests_limit INTEGER NOT NULL DEFAULT 30000, -- free tier: 100/day ~ 3000/month
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL, -- SHA-256 hash of the full key
  key_prefix TEXT NOT NULL, -- first 12 chars (e.g., "vr_live_a1b2c3d4e5f6") for identification
  name TEXT NOT NULL DEFAULT 'Default',
  environment TEXT NOT NULL DEFAULT 'live' CHECK (environment IN ('live', 'test')),
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro', 'enterprise', 'widget')),
  requests_used INTEGER DEFAULT 0,
  requests_limit INTEGER NOT NULL DEFAULT 30000,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

-- Usage logs table
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  country TEXT,
  status INTEGER,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_usage_logs_api_key_date ON usage_logs(api_key_id, created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);

-- Function to increment usage counter by key UUID
CREATE OR REPLACE FUNCTION increment_api_key_usage_by_id(p_key_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE api_keys
  SET requests_used = requests_used + 1,
      last_used_at = NOW()
  WHERE id = p_key_id;
END;
$$;

-- Function to check if key has exceeded limit
CREATE OR REPLACE FUNCTION check_key_rate_limit(p_key_hash TEXT)
RETURNS TABLE(
  is_valid BOOLEAN,
  requests_used INTEGER,
  requests_limit INTEGER,
  plan TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ak.is_active AND (ak.revoked_at IS NULL) AND (ak.expires_at IS NULL OR ak.expires_at > NOW()) AND ak.requests_used < ak.requests_limit AS is_valid,
    ak.requests_used,
    ak.requests_limit,
    ak.plan
  FROM api_keys ak
  WHERE ak.key_hash = p_key_hash;
END;
$$;

-- Enable Row Level Security (optional, for client-side access)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only see their own data
CREATE POLICY user_own_data ON users
  FOR ALL USING (id = auth.uid());

CREATE POLICY user_own_api_keys ON api_keys
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY user_own_usage_logs ON usage_logs
  FOR ALL USING (user_id = auth.uid());
