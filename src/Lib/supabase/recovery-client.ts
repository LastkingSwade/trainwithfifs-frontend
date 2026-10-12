import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { resolvePublicSupabaseConfig } from '../config/environment';

// Browser client used only for password recovery (public anon key; never a service-role key).
//
// It keeps its session under its own storage key, so a recovery session can never be picked up by the
// site's main sign-in client or mistaken for a normal login. Reset emails use the "implicit" link style:
// the link carries the sign-in tokens in the part of the address after the # (never sent to any server),
// so it works in ANY browser or device. (The earlier PKCE style only worked in the browser that asked for
// the reset, which broke the common case of asking on a phone and reading the email on a computer.)
// The reset page reads those tokens itself, which is why detectSessionInUrl is off here, and it removes
// them from the address bar immediately. Links already sent in the older style still work in the browser
// that requested them, and say so clearly when opened elsewhere.
export const RECOVERY_STORAGE_KEY = 'fifs-recovery-auth';

export function createRecoveryClient() {
  const { url, anonKey } = resolvePublicSupabaseConfig();
  return createSupabaseClient(url, anonKey, {
    auth: {
      flowType: 'implicit',
      storageKey: RECOVERY_STORAGE_KEY,
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}
