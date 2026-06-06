-- ============================================================
-- VATRate: Run ALL pending migrations
-- Esegui questo script nel Supabase SQL Editor (una volta sola)
-- ============================================================

-- 1. Email Verification (00004)
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_code TEXT,
  ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ;

-- 2. API Logs table (00005)
CREATE TABLE IF NOT EXISTS api_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  api_key_id    UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  method        TEXT NOT NULL,
  path          TEXT NOT NULL,
  query_params  JSONB,
  status_code   INTEGER NOT NULL,
  ip_address    TEXT,
  user_agent    TEXT,
  response_time_ms INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON api_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_api_key_id ON api_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at DESC);

-- Row Level Security
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see their own logs
DROP POLICY IF EXISTS "Users can view their own logs" ON api_logs;
CREATE POLICY "Users can view their own logs"
  ON api_logs FOR SELECT
  USING (user_id = auth.uid() OR user_id = current_setting('app.user_id')::UUID);

-- 3. Aggiorna utenti esistenti: set email_verified = true per chi ha già fatto login
-- (opzionale, per non bloccare gli utenti esistenti)
UPDATE users SET email_verified = true WHERE email_verified IS NULL;

-- 4. Fix: imposta requests_limit a 3000 per utenti free (se era rimasto 30000)
UPDATE users SET requests_limit = 3000 WHERE plan = 'free' AND requests_limit > 3000;
UPDATE api_keys SET requests_limit = 3000 WHERE plan = 'free' AND requests_limit > 3000;
