// Stay signed in. Supabase already keeps a saved login in this browser; until now the page ignored it on open, so every launch (especially of the installed app)
// asked students and clients to type their password again. This brings their portal back, using the SAME server routes sign-in uses (each returns only the
// caller's own record, found from the login itself).
//
// Rules (agreed with the owner): a saved login older than 30 days is cleared and ignored; staff logins are never restored; a student on a temporary password
// still goes through the first-login screen; only one portal is restored; any server refusal clears the saved login on this device; nothing new is stored, and
// nothing about the person is logged. In the installed app, their portal then opens by itself; in a normal browser tab it is only made ready (the header
// profile icon shows "Signed in") so the home page is never taken over.
export const MAX_AGE_DAYS = 30;
const DAY = 86400000;
const STAFF_ROLES = ['admin', 'instructor', 'staff'];
export type Portal = 'student' | 'client';
export type Plan = { action: 'none' } | { action: 'clear'; reason: 'too-old' | 'no-date' | 'future' } | { action: 'restore'; order: Portal[] };

export function planRestore(session: any, now: Date): Plan {
  const user = session && session.user; if (!user || !session.access_token) return { action: 'none' };
  const meta = user.app_metadata || {}; const role = String(meta.role || '').toLowerCase();
  if (STAFF_ROLES.includes(role) || meta.is_admin === true) return { action: 'none' }; // staff sign in each time, always
  const t = Date.parse(String(user.last_sign_in_at || ''));
  if (!Number.isFinite(t)) return { action: 'clear', reason: 'no-date' };
  if (t > now.getTime() + 5 * 60000) return { action: 'clear', reason: 'future' };
  if (now.getTime() - t > MAX_AGE_DAYS * DAY) return { action: 'clear', reason: 'too-old' };
  return { action: 'restore', order: role === 'client' ? ['client'] : role === 'student' ? ['student'] : ['student', 'client'] };
}

// What to do with the server's answer for one portal. 401/403: this login is not valid, clear it. 404: not that kind of account, try the next. Anything else
// (offline, server busy): stop quietly and keep the login for next time.
export function classify(status: number): 'ok' | 'clear' | 'next' | 'stop' { return status === 200 ? 'ok' : status === 401 || status === 403 ? 'clear' : status === 404 ? 'next' : 'stop'; }

export interface AutoOpenInput { standalone: boolean; pathname: string; hash: string; search: string; view: string; booting: boolean; hacking: boolean }
// A signed-in person (installed app or normal tab) goes straight to their portal, only from a plain home screen (never over a deep link, a reset link, the boot intro or a visitor already doing something).
export function shouldAutoOpen(i: AutoOpenInput): boolean { return i.pathname === '/' && (!i.hash || i.hash === '#') && !i.search && (i.view === 'home' || i.view === '') && !i.booting && !i.hacking; }

/** The installed app, with nobody signed in (no saved login, an expired one, or a staff one), on a plain home screen: open the portal sign-in, once per launch.
 *  Offline (login kept), "already signed in" and "already asked" never prompt. */
export function shouldPromptSignIn(outcome: string | undefined, i: AutoOpenInput, alreadyPrompted: boolean): boolean {
  return (outcome === 'none' || outcome === 'cleared') && !alreadyPrompted && i.standalone && shouldAutoOpen(i); // only the installed app opens the sign-in by itself; a normal tab shows the home page
}

export interface Deps {
  now: () => Date;
  getSession: () => Promise<any>;
  signOutLocal: () => Promise<void>;
  fetchPortal: (portal: Portal, token: string) => Promise<{ status: number; body: any }>;
  hasPortalRecord: () => boolean;
  apply: (portal: Portal, record: any) => void;
  autoOpen: (portal: Portal) => boolean;
}
export type Outcome = 'restored' | 'opened' | 'none' | 'cleared' | 'skipped' | 'kept';

export async function restoreSession(d: Deps): Promise<Outcome> {
  if (d.hasPortalRecord()) return 'skipped'; // someone already signed in by hand
  let session: any; try { session = await d.getSession(); } catch { return 'none'; }
  const plan = planRestore(session, d.now());
  if (plan.action === 'none') return 'none';
  if (plan.action === 'clear') { try { await d.signOutLocal(); } catch { /* nothing more to do */ } return 'cleared'; }
  for (const portal of plan.order) {
    let r: { status: number; body: any };
    try { r = await d.fetchPortal(portal, String(session.access_token)); } catch { return 'kept'; } // offline: keep the login
    const verdict = classify(r.status);
    if (verdict === 'clear') { try { await d.signOutLocal(); } catch { /* ignore */ } return 'cleared'; }
    if (verdict === 'stop') return 'kept';
    if (verdict === 'next') continue;
    const record = portal === 'student' ? r.body && r.body.student : r.body && r.body.client;
    if (!record || r.body.success !== true) continue;
    if (portal === 'student' && record.mustChangePassword === true) return 'skipped'; // the first-login screen must be passed in person
    if (d.hasPortalRecord()) return 'skipped'; // they signed in by hand while we were asking
    d.apply(portal, record);
    return d.autoOpen(portal) ? 'opened' : 'restored';
  }
  return 'none';
}

const w: any = typeof window === 'undefined' ? {} : window;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function until(cond: () => boolean, ms: number): Promise<boolean> { const end = Date.now() + ms; while (Date.now() < end) { if (cond()) return true; await sleep(250); } return cond(); }

async function runSessionRestore(): Promise<Outcome | undefined> {
  if (w.__fifsSessionRestoreRan || w.__fifsNoRestore) return undefined;
  w.__fifsSessionRestoreRan = true;
  const ready = await until(() => !!w.supabaseClient?.auth && typeof w.renderStudentDashboard === 'function' && typeof w.renderClientDashboard === 'function' && typeof w.fifsSetStudentSession === 'function' && typeof w.fifsSetClientSession === 'function', 12000);
  if (!ready) return undefined;
  const client = w.supabaseClient;
  const standalone = () => { try { return !!(w.matchMedia && w.matchMedia('(display-mode: standalone)').matches) || w.navigator?.standalone === true; } catch { return false; } };
  const outcome = await restoreSession({
    now: () => new Date(),
    getSession: async () => (await client.auth.getSession())?.data?.session || null,
    signOutLocal: async () => { await client.auth.signOut({ scope: 'local' }); },
    fetchPortal: async (portal, token) => {
      const res = await fetch('/api/fifs', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ action: portal === 'student' ? 'getStudentPortalData' : 'getClientPortalData' }) });
      let body: any = null; try { body = await res.json(); } catch { /* not JSON */ }
      return { status: res.status, body };
    },
    hasPortalRecord: () => !!(w.__fifsStudentPortalRecord || w.__fifsClientPortalRecord),
    apply: (portal, record) => { if (portal === 'student') { w.fifsSetStudentSession(record); w.renderStudentDashboard(record); } else { w.fifsSetClientSession(record); w.renderClientDashboard(record); } },
    autoOpen: (portal) => {
      const root = document.documentElement;
      const input: AutoOpenInput = { standalone: standalone(), pathname: location.pathname, hash: location.hash, search: location.search, view: String(w.currentActiveView || 'home'), booting: root.hasAttribute('data-boot') && !root.hasAttribute('data-resume'), hacking: !!document.querySelector('.hack-layer') };
      if (!shouldAutoOpen(input) || typeof w.openAndSwitch !== 'function') return false;
      w.openAndSwitch(portal === 'student' ? 'portal' : 'fi-portal'); return true;
    },
  });
  // Nobody signed in: the installed app opens the portal and its one sign-in box (the header profile menu, which routes by email), once per launch.
  const input2: AutoOpenInput = { standalone: standalone(), pathname: location.pathname, hash: location.hash, search: location.search, view: String(w.currentActiveView || 'home'), booting: document.documentElement.hasAttribute('data-boot'), hacking: !!document.querySelector('.hack-layer, [class*="hack-overlay"]') };
  if (shouldPromptSignIn(outcome, input2, !!w.__fifsSignInPrompted) && typeof w.openAndSwitch === 'function') {
    w.__fifsSignInPrompted = true; w.openAndSwitch('portal');
    setTimeout(() => { const b = document.getElementById('btnNavProfile'); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); }, 500);
  }
  return outcome;
}

/** Runs the restore. Whatever happens, the "Opening your portal" cover (data-resume, set by the page's first script for a returning signed-in person) is taken down afterwards. */
export async function installSessionRestore(): Promise<Outcome | undefined> {
  try { return await runSessionRestore(); } finally { try { document.documentElement.removeAttribute('data-resume'); } catch { /* nothing to remove */ } }
}
