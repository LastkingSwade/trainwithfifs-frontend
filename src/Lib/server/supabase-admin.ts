import { createClient } from '@supabase/supabase-js';
import {
  ConfigurationError,
  assertNonProductionSupabaseKey,
  inspectSupabaseKey,
  isProductionDeployment,
  resolvePublicSupabaseConfig,
  resolveSupabaseUrl
} from '../config/environment';

// Server-only module: the service-role key below must never be imported into browser code.

// Public Supabase client for token verification and unprivileged operations
export function getPublicClient() {
  // Legacy aliases are honored in Production only (see resolvePublicSupabaseConfig).
  const { url, anonKey } = resolvePublicSupabaseConfig({
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY
  });
  return createClient(url, anonKey, {
    auth: { persistSession: false }
  });
}

/**
 * Service-role key. Production keeps the SUPABASE_SERVICE_KEY alias; elsewhere only
 * SUPABASE_SERVICE_ROLE_KEY is accepted, and it must belong to the configured non-Production project.
 */
function resolveServiceRoleKey(url: string): string {
  if (isProductionDeployment()) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    if (!serviceKey) {
      throw new ConfigurationError('Supabase service role credentials (SUPABASE_SERVICE_ROLE_KEY) are not configured.');
    }
    return serviceKey;
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new ConfigurationError('SUPABASE_SERVICE_ROLE_KEY is required outside Production (aliases and Production fallbacks are not used).');
  }
  const info = inspectSupabaseKey(serviceKey);
  if (info.format === 'publishable' || (info.role && info.role !== 'service_role')) {
    throw new ConfigurationError('SUPABASE_SERVICE_ROLE_KEY is not a service-role key.');
  }
  assertNonProductionSupabaseKey(info, url, 'SUPABASE_SERVICE_ROLE_KEY');
  return serviceKey;
}

// Privileged Service Role client - create ONLY after request authorization succeeds
export function getPrivilegedClient() {
  const url = resolveSupabaseUrl(process.env.SUPABASE_URL);
  const serviceKey = resolveServiceRoleKey(url);
  return createClient(url, serviceKey, {
    auth: { persistSession: false }
  });
}

/**
 * Stripe secret key, or null when not configured (callers return 503).
 * Outside Production a live-mode key is refused.
 */
export function resolveStripeSecretKey(): string | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!isProductionDeployment() && /^(sk|rk)_live_/.test(key)) {
    throw new ConfigurationError('STRIPE_SECRET_KEY is a live-mode key and cannot be used outside Production; use a test-mode key.');
  }
  return key;
}

export function hasBearerToken(req: { headers: { get(name: string): string | null } }): boolean {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  return authHeader.toLowerCase().startsWith('bearer ') && authHeader.substring(7).trim().length > 0;
}

// --- Supabase Auth & Zero-Trust Bearer Token Verification ---
export async function getAuthenticatedUser(req: { headers: { get(name: string): string | null } }): Promise<{ user: any; error: string | null }> {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return { user: null, error: 'Unauthorized: Missing or invalid Authorization Bearer header.' };
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return { user: null, error: 'Unauthorized: Missing authentication bearer token.' };
  }

  try {
    // Validates token strictly via public client; does NOT create privileged service-role client
    const publicClient = getPublicClient();
    const { data: { user }, error } = await publicClient.auth.getUser(token);
    if (error || !user) {
      return { user: null, error: error?.message || 'Unauthorized: Invalid or expired authentication token.' };
    }
    return { user, error: null };
  } catch (err: any) {
    return { user: null, error: 'Unauthorized: Failed to verify authentication session.' };
  }
}
