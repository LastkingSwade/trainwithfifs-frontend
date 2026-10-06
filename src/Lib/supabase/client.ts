import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { resolvePublicSupabaseConfig } from '../config/environment';

// Browser client: public anon key only. Outside Production this throws instead of falling back
// to the Production project, and it never accepts a service-role key.
export function createClient() {
  const { url: supabaseUrl, anonKey: supabaseAnonKey } = resolvePublicSupabaseConfig();
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  });
}
