import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { resolvePublicSupabaseConfig } from '../config/environment';

export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = resolvePublicSupabaseConfig();

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Can be ignored if called from a Server Component
          }
        },
      },
    }
  );
}
