import { createClient } from '@supabase/supabase-js';

function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ufqnmcincwnlyiwsmzcq.supabase.co';
}

// Public Supabase client for token verification and unprivileged operations
export function getPublicClient() {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error('Supabase public credentials (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY) are not configured.');
  }
  return createClient(getSupabaseUrl(), anonKey, {
    auth: { persistSession: false }
  });
}

// Privileged Service Role client - create ONLY after request authorization succeeds
export function getPrivilegedClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) {
    throw new Error('Supabase service role credentials (SUPABASE_SERVICE_ROLE_KEY) are not configured.');
  }
  return createClient(getSupabaseUrl(), serviceKey, {
    auth: { persistSession: false }
  });
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
