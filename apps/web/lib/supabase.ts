import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;
let _serviceRoleClient: SupabaseClient | null = null;

/**
 * Ottiene un client Supabase con la service role key.
 * BYPASSA le RLS policies - usare SOLO per:
 * - Webhook Stripe
 * - Operazioni di autenticazione (signup, login, reset password)
 * - Operazioni admin
 *
 * NON usare per route dashboard (profile, API keys, logs) se non necessario.
 */
export function getServiceRoleClient(): SupabaseClient {
  if (_serviceRoleClient) return _serviceRoleClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      '⚠️ Supabase credentials not found. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local',
    );
  }

  _serviceRoleClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _serviceRoleClient;
}

/**
 * Ottiene un client Supabase con la anon key (pubblica).
 * RISPETTA le RLS policies - usare per:
 * - Route dashboard che leggono dati dell'utente autenticato
 * - Operazioni dove l'utente agisce sui propri dati
 * 
 * NOTA: Per ora molte route usano service_role per compatibilità.
 * La migrazione graduale a questo client è raccomandata.
 */
export function getAnonClient(): SupabaseClient {
  if (_supabase) return _supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      '⚠️ Supabase anon key not found. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local',
    );
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _supabase;
}

/**
 * @deprecated Usa getServiceRoleClient() o getAnonClient() esplicitamente.
 * getSupabaseClient() ora è un alias di getServiceRoleClient() per backward compatibility.
 * TODO: Migrare gradualmente le route a getAnonClient() dove possibile.
 */
export function getSupabaseClient(): SupabaseClient {
  console.warn(
    '⚠️ [DEPRECATED] getSupabaseClient() usa service_role key. ' +
    'Usa esplicitamente getServiceRoleClient() o getAnonClient().',
  );
  return getServiceRoleClient();
}
