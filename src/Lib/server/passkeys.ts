import crypto from 'crypto';
import { generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse } from '@simplewebauthn/server';

// Passkeys: sign in with Face ID, Touch ID or a fingerprint (tables: scripts/sql/20261031_passkeys.sql). The phone keeps the private key; the server keeps only the PUBLIC key.
// Rules (all enforced here, on the server):
//  - the phone must verify the person (biometric or phone PIN): a bare tap is refused;
//  - every request is bound to a one-time challenge that lives 5 minutes and is deleted the moment it is used, so nothing captured can be replayed;
//  - the site address is fixed (the domain the site is served from), so a passkey made for another site does not work here and vice versa;
//  - adding a passkey needs a RECENT sign-in (15 minutes), so a stolen open session cannot quietly add one;
//  - at most 5 per person, each with a name the person chose; a person can list and remove only their own;
//  - every failure to sign in gives the same plain message, so nobody can learn whether an account exists;
//  - a successful sign-in starts the session the standard way (a one-time sign-in token that the browser exchanges), so every existing sign-in rule still applies afterwards.
// Nothing here logs keys, challenges or tokens.
export const MAX_PASSKEYS = 5, CHALLENGE_TTL_MS = 5 * 60 * 1000, RECENT_SIGNIN_MS = 15 * 60 * 1000;
export const PASSKEY_ALGS = [-7, -257]; // ES256 and RS256: what phones, computers and security keys all support
export type PResult<T = {}> = ({ ok: true } & T) | { ok: false; status: number; message: string };
export interface Rp { id: string; name: string; origin: string }
export interface PasskeyInfo { id: string; name: string; createdAt: string; lastUsedAt: string | null; backedUp: boolean }

export const SIGN_IN_FAILED = 'That sign-in did not work. Please use your password, or try again.';
const NOT_READY = 'Face ID and fingerprint sign-in is not set up yet. Please use your password.';
const FAIL = 'That could not be done right now. Nothing was changed.';
const b64u = (v: Uint8Array | Buffer) => Buffer.from(v).toString('base64url');
const fromB64u = (s: string) => new Uint8Array(Buffer.from(s, 'base64url'));
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const missing = (e: any) => !!e && (e.code === '42P01' || e.code === 'PGRST205' || /does not exist|schema cache/i.test(String(e.message || '')));
const cleanName = (v: unknown) => String(v ?? '').replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40) || 'This device';

/** The relying party (who the passkey is for) comes only from the site's own address, never from the request. */
export function rpFromSite(siteUrl: string): Rp { const u = new URL(siteUrl); return { id: u.hostname, name: 'Train With FIFS', origin: u.origin }; }

/** True when the access token says the person signed in within the last 15 minutes. The token was already verified by the route; this only reads when they signed in. */
export function recentSignIn(accessToken: string, now: number = Date.now(), windowMs = RECENT_SIGNIN_MS): boolean {
  try {
    const part = String(accessToken || '').split('.')[1]; if (!part) return false;
    const p = JSON.parse(Buffer.from(part, 'base64url').toString('utf8')); const amr = Array.isArray(p?.amr) ? p.amr : [];
    const latest = amr.reduce((m: number, a: any) => (typeof a?.timestamp === 'number' && a.timestamp > m ? a.timestamp : m), 0);
    return latest > 0 && now - latest * 1000 <= windowMs && latest * 1000 <= now + 60000;
  } catch { return false; }
}

async function newChallenge(sb: any, purpose: 'register' | 'login', userId: string | null, challenge: string, now: number): Promise<string | null> {
  try { await sb.from('passkey_challenges').delete().lt('expires_at', new Date(now).toISOString()); } catch { /* clearing old requests is best-effort */ }
  const id = crypto.randomUUID();
  const r = await sb.from('passkey_challenges').insert({ id, challenge, purpose, user_id: userId, created_at: new Date(now).toISOString(), expires_at: new Date(now + CHALLENGE_TTL_MS).toISOString() });
  return r.error ? (missing(r.error) ? 'missing' : null) : id;
}
/** Takes the challenge and deletes it in one step: it can be used once, and only while it is still fresh. */
async function takeChallenge(sb: any, id: unknown, purpose: 'register' | 'login', now: number): Promise<{ challenge: string; userId: string | null } | null> {
  if (typeof id !== 'string' || !UUID.test(id)) return null;
  const r = await sb.from('passkey_challenges').delete().eq('id', id).eq('purpose', purpose).select('challenge, user_id, expires_at');
  const row = !r.error && Array.isArray(r.data) ? r.data[0] : null; if (!row) return null;
  return Date.parse(String(row.expires_at)) >= now ? { challenge: String(row.challenge), userId: row.user_id ? String(row.user_id) : null } : null;
}

export async function passkeyList(sb: any, userId: string): Promise<PResult<{ passkeys: PasskeyInfo[] }>> {
  try {
    const r = await sb.from('passkeys').select('id, device_name, created_at, last_used_at, backed_up').eq('user_id', userId).order('created_at', { ascending: true }).limit(MAX_PASSKEYS + 5);
    if (r.error) return missing(r.error) ? { ok: true, passkeys: [] } : { ok: false, status: 503, message: FAIL };
    return { ok: true, passkeys: (r.data || []).map((x: any) => ({ id: String(x.id), name: String(x.device_name || 'This device'), createdAt: String(x.created_at || ''), lastUsedAt: x.last_used_at ? String(x.last_used_at) : null, backedUp: !!x.backed_up })) };
  } catch { return { ok: false, status: 503, message: FAIL }; }
}

export async function passkeyRemove(sb: any, userId: string, id: unknown): Promise<PResult> {
  if (typeof id !== 'string' || !UUID.test(id)) return { ok: false, status: 404, message: 'That passkey was not found.' };
  try {
    const r = await sb.from('passkeys').delete().eq('id', id).eq('user_id', userId).select('id');
    if (r.error) return { ok: false, status: 503, message: FAIL }; return Array.isArray(r.data) && r.data.length ? { ok: true } : { ok: false, status: 404, message: 'That passkey was not found.' };
  } catch { return { ok: false, status: 503, message: FAIL }; }
}

export async function registerOptions(sb: any, user: { id: string; email?: string | null }, token: string, rp: Rp, now: number = Date.now()): Promise<PResult<{ options: any; challengeId: string }>> {
  if (!recentSignIn(token, now)) return { ok: false, status: 403, message: 'For your security, please sign in again, then add Face ID or your fingerprint right away.' };
  try {
    const have = await sb.from('passkeys').select('credential_id, transports').eq('user_id', user.id).limit(MAX_PASSKEYS + 1);
    if (have.error) return { ok: false, status: 503, message: missing(have.error) ? NOT_READY : FAIL };
    const rows = have.data || []; if (rows.length >= MAX_PASSKEYS) return { ok: false, status: 409, message: `You can keep up to ${MAX_PASSKEYS} devices. Remove one first.` };
    const options = await generateRegistrationOptions({ rpName: rp.name, rpID: rp.id, userName: String(user.email || user.id), userDisplayName: String(user.email || 'Member'), userID: new Uint8Array(Buffer.from(user.id, 'utf8')), attestationType: 'none', supportedAlgorithmIDs: PASSKEY_ALGS,
      excludeCredentials: rows.map((x: any) => ({ id: String(x.credential_id), transports: Array.isArray(x.transports) ? x.transports : undefined })), authenticatorSelection: { residentKey: 'required', requireResidentKey: true, userVerification: 'required' }, timeout: 120000 });
    const id = await newChallenge(sb, 'register', user.id, options.challenge, now); if (id === 'missing') return { ok: false, status: 503, message: NOT_READY }; if (!id) return { ok: false, status: 503, message: FAIL };
    return { ok: true, options, challengeId: id };
  } catch { return { ok: false, status: 503, message: FAIL }; }
}

export async function registerVerify(sb: any, user: { id: string }, input: { challengeId?: unknown; response?: any; deviceName?: unknown }, rp: Rp, now: number = Date.now()): Promise<PResult<{ passkeys: PasskeyInfo[] }>> {
  const BAD = { ok: false as const, status: 400, message: 'That did not work. Please try adding it again.' };
  try {
    const ch = await takeChallenge(sb, input.challengeId, 'register', now); if (!ch || ch.userId !== user.id) return BAD;
    const v = await verifyRegistrationResponse({ response: input.response, expectedChallenge: ch.challenge, expectedOrigin: rp.origin, expectedRPID: rp.id, requireUserVerification: true, supportedAlgorithmIDs: PASSKEY_ALGS });
    if (!v.verified || !v.registrationInfo) return BAD;
    const c = v.registrationInfo.credential;
    const have = await sb.from('passkeys').select('id').eq('user_id', user.id).limit(MAX_PASSKEYS + 1); if (have.error) return { ok: false, status: 503, message: FAIL };
    if ((have.data || []).length >= MAX_PASSKEYS) return { ok: false, status: 409, message: `You can keep up to ${MAX_PASSKEYS} devices. Remove one first.` };
    const ins = await sb.from('passkeys').insert({ user_id: user.id, credential_id: c.id, public_key: b64u(c.publicKey), counter: c.counter || 0, transports: Array.isArray(c.transports) ? c.transports : null, device_name: cleanName(input.deviceName), backed_up: !!v.registrationInfo.credentialBackedUp });
    if (ins.error) return ins.error.code === '23505' ? { ok: false, status: 409, message: 'That device is already added.' } : { ok: false, status: 503, message: FAIL };
    const l = await passkeyList(sb, user.id); return l.ok ? { ok: true, passkeys: l.passkeys } : { ok: true, passkeys: [] };
  } catch { return BAD; }
}

/** Nobody is signed in yet, so the request is not tied to a person: the phone offers the passkeys it holds for this site. */
export async function loginOptions(sb: any, rp: Rp, now: number = Date.now()): Promise<PResult<{ options: any; challengeId: string }>> {
  try {
    const options = await generateAuthenticationOptions({ rpID: rp.id, userVerification: 'required', timeout: 120000 });
    const id = await newChallenge(sb, 'login', null, options.challenge, now); if (id === 'missing') return { ok: false, status: 503, message: NOT_READY }; if (!id) return { ok: false, status: 503, message: FAIL };
    return { ok: true, options, challengeId: id };
  } catch { return { ok: false, status: 503, message: FAIL }; }
}

export interface AuthAdmin { getUserById(id: string): Promise<any>; generateLink(a: { type: 'magiclink'; email: string }): Promise<any> }
/** Proves the passkey, then hands back a one-time sign-in token the browser exchanges for a normal session. Every failure is the same plain message. */
export async function loginVerify(sb: any, authAdmin: AuthAdmin, input: { challengeId?: unknown; response?: any }, rp: Rp, now: number = Date.now()): Promise<PResult<{ tokenHash: string }>> {
  const NO = { ok: false as const, status: 401, message: SIGN_IN_FAILED };
  try {
    const ch = await takeChallenge(sb, input.challengeId, 'login', now); if (!ch) return NO;
    const credId = typeof input.response?.id === 'string' ? input.response.id : ''; if (credId.length < 8 || credId.length > 1400) return NO;
    const f = await sb.from('passkeys').select('id, user_id, credential_id, public_key, counter, transports').eq('credential_id', credId).maybeSingle(); if (f.error || !f.data) return NO;
    const pk = f.data;
    const v = await verifyAuthenticationResponse({ response: input.response, expectedChallenge: ch.challenge, expectedOrigin: rp.origin, expectedRPID: rp.id, requireUserVerification: true,
      credential: { id: String(pk.credential_id), publicKey: fromB64u(String(pk.public_key)), counter: Number(pk.counter) || 0, transports: Array.isArray(pk.transports) ? pk.transports : undefined } });
    if (!v.verified) return NO;
    const u = await authAdmin.getUserById(String(pk.user_id)); const user = u?.data?.user; const email = String(user?.email || '').trim();
    if (u?.error || !user || !email || (user.banned_until && Date.parse(user.banned_until) > now)) return NO;
    const link = await authAdmin.generateLink({ type: 'magiclink', email }); const tokenHash = link?.data?.properties?.hashed_token;
    if (link?.error || typeof tokenHash !== 'string' || !tokenHash) return NO;
    // Only after everything succeeded: remember the counter and when it was used. A failure here never blocks the sign-in.
    try { await sb.from('passkeys').update({ counter: v.authenticationInfo.newCounter, last_used_at: new Date(now).toISOString() }).eq('id', String(pk.id)); } catch { /* the sign-in still stands */ }
    return { ok: true, tokenHash };
  } catch { return NO; }
}
