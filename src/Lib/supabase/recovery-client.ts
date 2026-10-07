import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { resolvePublicSupabaseConfig } from '../config/environment';

// Browser client used only for password recovery (public anon key; never a service-role key).
//
// It keeps its session under its own storage key, so a recovery session can never be picked up by the
// site's main sign-in client or mistaken for a normal login. PKCE is used for links requested from this
// site; hash-fragment links (dashboard-sent recovery emails and invites) are handled by the page itself,
// which is why detectSessionInUrl is off here.
export const RECOVERY_STORAGE_KEY = 'fifs-recovery-auth';

export function createRecoveryClient() {
  const { url, anonKey } = resolvePublicSupabaseConfig();
  return createSupabaseClient(url, anonKey, {
    auth: {
      flowType: 'pkce',
      storageKey: RECOVERY_STORAGE_KEY,
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}
