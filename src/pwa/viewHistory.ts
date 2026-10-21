// The Back button. The site is one page that swaps screens (home, portals, booking, FAQ...), so the phone's Back button (and the browser's) used to leave the site or the
// installed app from ANY screen. Each screen change now adds one history step, so Back returns to the screen before, and only Back from the home screen leaves.
// The step carries just the screen's name. Nothing is stored or sent. The existing in-app "Back" button uses the same steps (see navigateBack in the page script).
export const KEY = 'fifsView';
const VIEW = /^[a-z0-9-]{1,40}$/i;
/** The screen named in a history step; anything missing or odd means the home screen. */
export function viewOf(state: unknown): string {
  const v = state && typeof state === 'object' ? (state as Record<string, unknown>)[KEY] : null;
  return typeof v === 'string' && VIEW.test(v) ? v : 'home';
}
/** How many of our steps deep the person is (0 at the screen the page loaded on). */
export function depthOf(state: unknown): number {
  const d = state && typeof state === 'object' ? (state as Record<string, unknown>).fifsDepth : 0;
  return typeof d === 'number' && Number.isInteger(d) && d >= 0 && d < 10000 ? d : 0;
}

const w: any = typeof window === 'undefined' ? {} : window;
export function installViewHistory(): void {
  if (w.__fifsViewHistory || typeof history === 'undefined') return; w.__fifsViewHistory = true;
  let restoring = false; let last = 'home'; let depth = 0;
  const base = (): Record<string, unknown> => (history.state && typeof history.state === 'object' ? { ...history.state } : {}); // keep what the page framework keeps in the step
  try { last = viewOf(history.state); depth = depthOf(history.state); history.replaceState({ ...base(), [KEY]: last, fifsDepth: depth }, '', location.href); } catch { /* history unavailable: the old behaviour */ }
  w.fifsViewChanged = (view: unknown) => {
    if (restoring || typeof view !== 'string' || !VIEW.test(view) || view === last) return;
    last = view; depth += 1;
    try { history.pushState({ ...base(), [KEY]: view, fifsDepth: depth }, '', location.href); } catch { /* the old behaviour */ }
  };
  window.addEventListener('popstate', (e) => {
    const view = viewOf(e.state); depth = depthOf(e.state);
    if (view === last) return; last = view; restoring = true;
    try { if (view === 'home') { if (typeof w.returnToHome === 'function') w.returnToHome(); } else if (typeof w.openAndSwitch === 'function') w.openAndSwitch(view); } finally { restoring = false; }
  });
  w.fifsViewHistory = { canGoBack: () => depth > 0, back: () => history.back() };
}
