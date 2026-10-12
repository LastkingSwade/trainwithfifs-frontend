// The "Save Train With FIFS to your phone" banner on the student dashboard: stays out of the way once it is no longer useful. It is hidden when the app is already
// installed, and when the student has tapped its X (remembered on this device only, as a convenience). It never blocks anything if storage is unavailable.
const w: any = typeof window === 'undefined' ? {} : window;
export const KEY = 'fifs_pwa_banner_dismissed';
export const shouldHide = (installed: boolean, dismissed: string | null): boolean => installed || dismissed === '1';

export function installPwaBanner(): void {
  if (w.__fifsPwaBannerInstalled) return;
  w.__fifsPwaBannerInstalled = true;
  let installed = false; try { installed = !!(w.matchMedia && w.matchMedia('(display-mode: standalone)').matches) || w.navigator?.standalone === true; } catch { /* unknown means not installed */ }
  let dismissed: string | null = null; try { dismissed = w.localStorage.getItem(KEY); } catch { /* storage unavailable */ }
  const banners = Array.from(document.querySelectorAll<HTMLElement>('.pwa-install-banner'));
  if (shouldHide(installed, dismissed)) banners.forEach((b) => { b.style.display = 'none'; });
  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement | null; const btn = t && t.closest ? t.closest('.pwa-install-banner button') : null;
    if (btn) { try { w.localStorage.setItem(KEY, '1'); } catch { /* storage unavailable */ } }
  });
}
