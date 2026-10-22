// The public bottom navigation (phones): Home, Start, Book Now, Permits, My FIFS. Pure decisions live here so they can be tested without a browser.
export type NavKey = 'home' | 'start' | 'book' | 'permits' | 'myfifs';
export interface NavItem { key: NavKey; label: string; href: string; icon: readonly string[] }

// Simple line icons (24px grid), drawn inline so no icon library is needed. Colours come from the stylesheet.
export const ITEMS: readonly NavItem[] = [
  { key: 'home', label: 'Home', href: '/', icon: ['M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z'] },
  { key: 'start', label: 'Start', href: '/?open=start', icon: ['M5 21V4', 'M5 4h11l-2 4 2 4H5', 'M5 13h8'] },
  { key: 'book', label: 'Book Now', href: '/?open=booking', icon: ['M3 5h18v16H3z', 'M3 10h18', 'M8 3v4', 'M16 3v4', 'M9 15l2 2 4-4'] },
  { key: 'permits', label: 'Permits', href: '/permits', icon: ['M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z', 'M9 12l2 2 4-4'] },
  { key: 'myfifs', label: 'My FIFS', href: '/?open=student', icon: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4 21c0-4 3.6-6 8-6s8 2 8 6'] },
];

/** Pages that show the bar: the one-page site and the Permit Center. Payment and password-reset pages never do. */
export const isPublicPath = (p: string): boolean => p === '/' || p === '/permits' || p.startsWith('/permits/');

export interface ShowInput { pathname: string; view: string; dashboardOpen: boolean; booting: boolean }
/** Hidden inside a signed-in dashboard (the signed-in five-tab bar is there instead), in the admin screen, and during the intro. The two bars are never on screen together. */
export const navVisible = (s: ShowInput): boolean => isPublicPath(s.pathname) && !s.dashboardOpen && s.view !== 'admin' && !s.booting;

export interface ActiveInput { pathname: string; view: string }
/** Which tab looks current. Start is the Start Here screen; Book Now is the booking screen. */
export function activeFor(i: ActiveInput): NavKey | null {
  if (i.pathname === '/permits' || i.pathname.startsWith('/permits/')) return 'permits';
  if (i.pathname !== '/') return null;
  if (i.view === 'home' || i.view === '') return 'home';
  if (i.view === 'start') return 'start';
  if (i.view === 'booking') return 'book';
  if (i.view === 'portal' || i.view === 'fi-portal') return 'myfifs';
  return null;
}

const DAY = 86400000;
export const MAX_AGE_DAYS = 30;
type Store = { length: number; key(i: number): string | null; getItem(k: string): string | null };
/** Which portal a saved login belongs to, read from the login Supabase already keeps in this browser (never sent anywhere). Staff, expired, odd or missing logins give null. The server still decides what anyone can see. */
export function savedPortal(store: Store | null | undefined, now: Date): 'student' | 'client' | null {
  try {
    if (!store) return null;
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i); if (!k || !/^sb-.+-auth-token$/.test(k)) continue;
      const v = JSON.parse(String(store.getItem(k))); if (!v || !v.access_token || !v.user) continue;
      const meta = v.user.app_metadata || {}; const role = String(meta.role || '').toLowerCase();
      if (role === 'admin' || role === 'instructor' || role === 'staff' || meta.is_admin === true) return null;
      const t = Date.parse(String(v.user.last_sign_in_at || '')); if (!Number.isFinite(t) || t > now.getTime() + 5 * 60000 || now.getTime() - t > MAX_AGE_DAYS * DAY) return null;
      return role === 'client' ? 'client' : role === 'student' ? 'student' : null;
    }
  } catch { /* an unreadable saved login counts as none */ }
  return null;
}
/** Where "My FIFS" goes when the person is not on the one-page site. A known portal goes straight there; otherwise the site's own portal chooser. */
export const myFifsHref = (p: 'student' | 'client' | null): string => (p === 'client' ? '/?open=client' : '/?open=student');
