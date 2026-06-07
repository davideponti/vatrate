-- ============================================================
-- 00006: Row Level Security (RLS) Policies
-- 
-- IMPORTANT: Per usare RLS, il client Supabase deve usare l'anon key
-- con supabase.auth.getUser() invece della service_role key.
-- 
-- ATTUALMENTE: Il codice usa SUPABASE_SERVICE_ROLE_KEY che bypassa RLS.
-- Per attivare queste policy, bisogna:
-- 1. Creare un utente Supabase Auth per ogni signup
-- 2. Usare supabase.auth.getUser() per autenticare
-- 3. Usare anon key per il client
-- 4. Lasciare service_role SOLO per webhook Stripe
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;
-- I codici di verifica email sono salvati nella tabella `users` (colonne verification_code, verification_expires_at)
-- ALTER TABLE email_verification_codes ENABLE ROW LEVEL SECURITY; -- tabella non più usata

-- ─── USERS ───────────────────────────────────────────────────

-- Users can read their own data
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own data (but not sensitive fields)
CREATE POLICY "Users can update own non-sensitive data"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert only their own row (signup handled server-side)
CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ─── API KEYS ───────────────────────────────────────────────

-- Users can read their own API keys
CREATE POLICY "Users can read own API keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create API keys (for themselves only)
CREATE POLICY "Users can create own API keys"
  ON api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update (revoke) their own API keys
CREATE POLICY "Users can update own API keys"
  ON api_keys FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── SESSIONS ───────────────────────────────────────────────

-- Users can read their own sessions
CREATE POLICY "Users can read own sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can delete their own sessions (logout)
CREATE POLICY "Users can delete own sessions"
  ON sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ─── PASSWORD RESET TOKENS ─────────────────────────────────

-- Server-side only (users never query this directly)
-- Only service_role should access this table

-- ─── USAGE LOGS ─────────────────────────────────────────────

-- Users can read their own usage logs
CREATE POLICY "Users can read own usage logs"
  ON usage_logs FOR SELECT
  USING (auth.uid() = user_id);

-- ─── API LOGS ───────────────────────────────────────────────

-- Users can read their own API logs
CREATE POLICY "Users can read own API logs"
  ON api_logs FOR SELECT
  USING (auth.uid() = user_id);

-- ─── EMAIL VERIFICATION CODES ──────────────────────────────

-- Server-side only (users never query this directly)

-- ─── SERVICE ROLE ACCESS ────────────────────────────────────
-- NOTA: Queste policy permettono al service_role di bypassare RLS
-- (default per Supabase). Le route che usano service_role key
-- continueranno a funzionare come prima.

-- Indici per migliorare performance con RLS
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id_rls ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id_rls ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id_rls ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_user_id_rls ON api_logs(user_id);
