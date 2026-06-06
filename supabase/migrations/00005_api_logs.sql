-- Migration: API Logs
-- Tracks every API request for auditing and logging

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

-- Index for fast queries by user
CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON api_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_api_key_id ON api_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at DESC);

-- Enable RLS
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own logs
CREATE POLICY "Users can view their own logs"
  ON api_logs FOR SELECT
  USING (user_id = auth.uid() OR user_id = current_setting('app.user_id')::UUID);
