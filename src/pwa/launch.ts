// Deep links into the one-page site. Home-screen shortcuts ("Student Portal", "Client Portal") and the public Permit Center pages (/permits) open the site with ?open=<target>:
// student and client open that portal (their own dashboard if they are signed in, the portal sign-in if not); booking and classes open the existing booking screen (classes scrolls to
// the course catalog); reciprocity opens the existing Reciprocity Hub; renewal opens the existing Permit Renewal Center (information only); login opens the stand-alone My FIFS sign-in. Only these exact words are accepted, nothing
// else is read from the address, and the extra bit is removed afterward. Nothing is stored or sent.
export type LaunchTarget = 'student' | 'client' | 'booking' | 'classes' | 'start' | 'reciprocity' | 'renewal' | 'login' | null;
export const VIEW_FOR: Record<'student' | 'client', string> = { student: 'portal', client: 'fi-portal' };
export const TARGETS: readonly string[] = ['student', 'client', 'booking', 'classes', 'start', 'reciprocity', 'renewal', 'login'];

export function launchTarget(search: string): LaunchTarget {
  try { const v = new URLSearchParams(String(search || '')).get('open'); return v !== null && TARGETS.includes(v) ? (v as LaunchTarget) : null; } catch { return null; }
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
  if (t === 'student' || t === 'client') w.openAndSwitch(VIEW_FOR[t]);
  else if (t === 'booking') w.openAndSwitch('booking');
  else if (t === 'classes') { w.openAndSwitch('booking'); scrollToCatalog(); }
  else if (t === 'start') { w.openAndSwitch('start'); }
  else if (t === 'reciprocity') { if (typeof w.toggleReciprocityHubModal === 'function') w.toggleReciprocityHubModal(true); }
  else if (t === 'renewal') { if (typeof w.openPermitRenewalModal === 'function') w.openPermitRenewalModal(); }
  else if (t === 'login') { if (!document.body.classList.contains('fifs-tabs-on') && typeof w.openMyFifsLogin === 'function') w.openMyFifsLogin(); }
  return true;
}
/** The booking screen starts at the top; "classes" brings the course catalog into view (the same place the site's /#enrollment link goes). */
function scrollToCatalog(): void {
  const go = () => { const el = document.getElementById('course-catalog-section'); if (el) el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); };
  try { requestAnimationFrame(() => requestAnimationFrame(go)); } catch { go(); }
}
