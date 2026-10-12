// One sign-in for the header profile button. A person has one email, so they type it (and their password) once and we open the right portal for them.
// Nothing about the account is revealed before the password is right: a wrong email and a wrong password get the same message. After a good password the
// server tells us which portal the login belongs to (the same own-record routes the portals and "stay signed in" already use), and then the portal's OWN
// sign-in runs, so every rule that portal has (first-login password screen, saved-login handling, staff checks) is exactly what it was.
export type Kind = 'student' | 'client' | 'staff';
export type RouteResult = { ok: true; portal: Kind } | { ok: false; message: string };
export const STAFF_ROLES = ['admin', 'instructor', 'staff'];
export const MSG = {
  need: 'Enter your email address and your password.',
  wrong: 'Email or password is incorrect.',
  unavailable: 'Sign-in is not available right now. Please try again in a moment.',
  none: 'We could not find a student or client profile for this email. Please contact FIFS at 443-990-1304 or info@trainwithfifs.com.',
  server: 'We could not reach the server. Please check your connection and try again.',
} as const;

export function validateInput(email: unknown, password: unknown): { email: string; password: string } | { error: string } {
  const e = String(email ?? '').trim().toLowerCase(); const p = String(password ?? '');
  if (!e || !e.includes('@') || !p) return { error: MSG.need };
  return { email: e, password: p }; // the password is used exactly as typed
}

/** Which portals to ask the server about, from the role written on the login. Staff go to the staff sign-in; unknown roles try student first, then client. */
export function routeOrder(session: any): Kind[] | 'staff' {
  const meta = (session && session.user && session.user.app_metadata) || {}; const role = String(meta.role || '').toLowerCase();
  if (STAFF_ROLES.includes(role) || meta.is_admin === true) return 'staff';
  return role === 'client' ? ['client'] : role === 'student' ? ['student'] : ['student', 'client'];
}

export interface Deps {
  signIn: (email: string, password: string) => Promise<any | null>; // the session on success, null when the email or password is wrong
  fetchPortal: (portal: 'student' | 'client', token: string) => Promise<{ status: number; body?: any }>;
  signOutLocal: () => Promise<void>;
}

export async function signInAndRoute(d: Deps, emailIn: unknown, passwordIn: unknown): Promise<RouteResult> {
  const v = validateInput(emailIn, passwordIn); if ('error' in v) return { ok: false, message: v.error };
  let session: any;
  try { session = await d.signIn(v.email, v.password); } catch { return { ok: false, message: MSG.unavailable }; }
  if (!session || !session.access_token) return { ok: false, message: MSG.wrong };
  const order = routeOrder(session);
  if (order === 'staff') return { ok: true, portal: 'staff' };
  for (const portal of order as ('student' | 'client')[]) {
    let r: { status: number; body?: any };
    try { r = await d.fetchPortal(portal, String(session.access_token)); } catch { return { ok: false, message: MSG.server }; }
    if (r.status === 200) return { ok: true, portal };
    if (r.status === 404) continue; // not that kind of account
    if (r.status === 401 || r.status === 403) { try { await d.signOutLocal(); } catch { /* nothing more to do */ } return { ok: false, message: MSG.wrong }; }
    return { ok: false, message: MSG.server };
  }
  try { await d.signOutLocal(); } catch { /* nothing more to do */ }
  return { ok: false, message: MSG.none };
}

/** The tab and the fields of the portal's own sign-in form, used to hand over to it. */
export const HANDOFF: Record<Kind, { tab: string; email: string; password: string; run: string }> = {
  student: { tab: 'portal', email: 'studentAuthInput', password: 'studentAuthPassword', run: 'lookupStudentAccount' },
  client: { tab: 'fi-portal', email: 'clientAuthInput', password: 'clientAuthPassword', run: 'lookupClientAccount' },
  staff: { tab: 'admin', email: 'adminStaffEmail', password: 'adminStaffPassword', run: 'verifyAdminAccess' },
};
