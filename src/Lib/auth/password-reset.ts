// Password-recovery logic shared by the /reset-password page and the portal "Forgot password?" links.
//
// Browser-safe and free of side effects: every function takes the Supabase client as an argument, so
// tests can pass a mock and nothing here reaches the network on its own. It never uses a service-role
// key and never reads user_metadata, the email address, or students.is_admin for any decision.

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 72; // bcrypt limit used by Supabase Auth
export const RESET_COOLDOWN_MS = 60_000;
export const RESET_PATH = '/reset-password';
/** localStorage key remembering which portal the person asked from (a screen hint only). */
export const RESET_PORTAL_HINT_KEY = 'fifs-reset-portal';

/** Same text whether or not the address belongs to an account (no account enumeration). */
export const GENERIC_RESET_MESSAGE =
  'If an account exists for that email address, a password reset link is on its way. Check your inbox and spam folder.';

export type PortalKey = 'student' | 'client' | 'staff';
const STAFF_ROLES = ['admin', 'instructor', 'staff'];
const PORTAL_TAB: Record<PortalKey, string> = { student: 'portal', client: 'fi-portal', staff: 'admin' };

export function isPortalKey(value: unknown): value is PortalKey {
  return value === 'student' || value === 'client' || value === 'staff';
}

export function portalTab(portal: PortalKey): string {
  return PORTAL_TAB[portal];
}

/**
 * Which login to show after a successful reset. This only chooses a screen; it grants nothing.
 * A remembered hint from the same browser wins, otherwise the server-set app_metadata.role decides.
 */
export function portalForReset(hint: unknown, appRole: unknown): PortalKey {
  if (isPortalKey(hint)) return hint;
  if (typeof appRole === 'string' && STAFF_ROLES.includes(appRole)) return 'staff';
  return 'student';
}

export function isPlausibleEmail(value: unknown): value is string {
  const email = String(value ?? '').trim();
  return email.length > 3 && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Returns an error message, or null when the new password is acceptable. */
export function validateNewPassword(password: unknown, confirm: unknown): string | null {
  const pw = typeof password === 'string' ? password : '';
  const cf = typeof confirm === 'string' ? confirm : '';
  if (pw.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (pw.length > MAX_PASSWORD_LENGTH) return `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`;
  if (pw !== cf) return 'The two passwords do not match.';
  return null;
}

export interface RecoveryParams {
  /** 'code' = PKCE ?code=, 'tokens' = hash-fragment tokens, 'error' = Supabase reported a bad link, 'none' = nothing in the URL. */
  kind: 'code' | 'tokens' | 'error' | 'none';
  code?: string;
  accessToken?: string;
  refreshToken?: string;
  type?: string;
}

/** Reads a Supabase recovery/invite link from the URL parts. Never throws. */
export function parseRecoveryParams(search: string, hash: string): RecoveryParams {
  const query = new URLSearchParams(String(search || '').replace(/^\?/, ''));
  const frag = new URLSearchParams(String(hash || '').replace(/^#/, ''));

  if (frag.get('error') || frag.get('error_code') || query.get('error') || query.get('error_code')) {
    return { kind: 'error' };
  }
  const accessToken = frag.get('access_token');
  const refreshToken = frag.get('refresh_token');
  if (accessToken && refreshToken) {
    return { kind: 'tokens', accessToken, refreshToken, type: frag.get('type') || undefined };
  }
  const code = query.get('code');
  if (code) return { kind: 'code', code };
  return { kind: 'none' };
}

/** Link types that may set a password. Magic links, signups and email changes are not accepted here. */
const ACCEPTED_LINK_TYPES = ['recovery', 'invite'];

// Structural stand-in for the Supabase client so tests can pass a mock; only `.auth` is used.
type AuthClient = { auth: any };

export type RecoveryOutcome = { state: 'ready'; appRole?: string } | { state: 'invalid'; reason: 'expired' | 'invalid' };

/**
 * Turns the URL (or a recovery session already held by this isolated client) into a ready/invalid state.
 * Nothing else in the page may call updateUser unless this returned 'ready'.
 */
export async function establishRecoverySession(client: AuthClient, params: RecoveryParams): Promise<RecoveryOutcome> {
  try {
    if (params.kind === 'error') return { state: 'invalid', reason: 'expired' };

    if (params.kind === 'code') {
      const { data, error } = await client.auth.exchangeCodeForSession(params.code);
      if (error || !data?.session) return { state: 'invalid', reason: 'expired' };
      return { state: 'ready', appRole: data.session.user?.app_metadata?.role };
    }

    if (params.kind === 'tokens') {
      if (!params.type || !ACCEPTED_LINK_TYPES.includes(params.type)) return { state: 'invalid', reason: 'invalid' };
      const { data, error } = await client.auth.setSession({ access_token: params.accessToken, refresh_token: params.refreshToken });
      if (error || !data?.session) return { state: 'invalid', reason: 'expired' };
      return { state: 'ready', appRole: data.session.user?.app_metadata?.role };
    }

    // No link in the URL: allow a page refresh to continue only if this isolated client still holds
    // the recovery session it established earlier.
    const { data } = await client.auth.getSession();
    if (data?.session) return { state: 'ready', appRole: data.session.user?.app_metadata?.role };
    return { state: 'invalid', reason: 'invalid' };
  } catch {
    return { state: 'invalid', reason: 'invalid' };
  }
}

export type SubmitResult = { ok: true } | { ok: false; error: string };

/**
 * Validates, confirms a recovery session is present, then sets the new password and discards the
 * recovery session. The password is never logged or returned.
 */
export async function submitNewPassword(client: AuthClient, password: string, confirm: string): Promise<SubmitResult> {
  const invalid = validateNewPassword(password, confirm);
  if (invalid) return { ok: false, error: invalid };

  let hasSession = false;
  try {
    const { data } = await client.auth.getSession();
    hasSession = Boolean(data?.session);
  } catch {
    hasSession = false;
  }
  if (!hasSession) return { ok: false, error: 'Your reset link has expired or is no longer valid. Please request a new one.' };

  try {
    const { error } = await client.auth.updateUser({ password });
    if (error) {
      const code = String((error as any).code || '');
      if (code === 'same_password') return { ok: false, error: 'Your new password must be different from your current one.' };
      if (code === 'weak_password') return { ok: false, error: 'That password is too weak. Choose a longer or less common password.' };
      if ((error as any).status === 401 || (error as any).status === 403 || code === 'session_not_found') {
        return { ok: false, error: 'Your reset link has expired or is no longer valid. Please request a new one.' };
      }
      return { ok: false, error: 'We could not update your password. Please try again, or request a new reset link.' };
    }
  } catch {
    return { ok: false, error: 'We could not update your password. Please try again, or request a new reset link.' };
  }

  try {
    await client.auth.signOut({ scope: 'local' });
  } catch {
    // The password is already changed; failing to clear the local recovery session is not fatal.
  }
  return { ok: true };
}

export type RequestResult = { ok: boolean; message: string; cooldown: boolean };

/**
 * Asks Supabase to email a reset link. The message is identical for known and unknown addresses.
 * Only a malformed address, a rate limit, or a transport failure produce a different message, and none
 * of those depend on whether an account exists.
 */
export async function requestPasswordReset(client: AuthClient, email: string, origin: string): Promise<RequestResult> {
  const address = String(email || '').trim();
  if (!isPlausibleEmail(address)) {
    return { ok: false, message: 'Enter the email address for your account first.', cooldown: false };
  }
  try {
    const { error } = await client.auth.resetPasswordForEmail(address, { redirectTo: `${origin}${RESET_PATH}` });
    if (error) {
      const status = (error as any).status;
      const code = String((error as any).code || '');
      if (status === 429 || code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit') {
        return { ok: false, message: 'Please wait a minute before requesting another reset link.', cooldown: true };
      }
      return { ok: false, message: 'We could not send the reset link right now. Please try again in a few minutes.', cooldown: false };
    }
  } catch {
    return { ok: false, message: 'We could not send the reset link right now. Please try again in a few minutes.', cooldown: false };
  }
  return { ok: true, message: GENERIC_RESET_MESSAGE, cooldown: true };
}
