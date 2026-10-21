// Home-screen shortcuts: long-pressing the installed icon offers "Student Portal" and "Client Portal". Those open the site with ?open=student or ?open=client; this opens the
// matching portal (their own dashboard if they are signed in, the portal sign-in if not) and then removes the extra bit from the address. Nothing is stored or sent.
export type LaunchTarget = 'student' | 'client' | null;
export const VIEW_FOR: Record<'student' | 'client', string> = { student: 'portal', client: 'fi-portal' };

export function launchTarget(search: string): LaunchTarget {
  try { const v = new URLSearchParams(String(search || '')).get('open'); return v === 'student' || v === 'client' ? v : null; } catch { return null; }
}
/** The address without the ?open= part (other parts, and the #hash, are kept). */
export function withoutLaunch(search: string): string {
  try { const p = new URLSearchParams(String(search || '')); p.delete('open'); const s = p.toString(); return s ? '?' + s : ''; } catch { return ''; }
}

const w: any = typeof window === 'undefined' ? {} : window;
/** Runs once the page, its scripts and the boot intro are ready (RestoreSession calls it at that moment). */
export function installLaunchTargets(): boolean {
  if (w.__fifsLaunchRan) return false; w.__fifsLaunchRan = true;
  const t = launchTarget(location.search); if (!t || typeof w.openAndSwitch !== 'function') return false;
  try { history.replaceState(null, '', location.pathname + withoutLaunch(location.search) + location.hash); } catch { /* the address just keeps the extra bit */ }
  w.openAndSwitch(VIEW_FOR[t]); return true;
}
