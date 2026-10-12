// Pure helpers for the offline support (kept apart from React so they can be tested on their own).
// Which files the page tells the service worker to save on the first visit: only the site's own build files, scripts and styles.
// The service worker re-checks every address itself, so this list is only a convenience.
export function offlineUrlsFrom(names: readonly string[], origin: string): string[] {
  const out: string[] = [];
  for (const raw of names) {
    let u: URL;
    try { u = new URL(raw, origin); } catch { continue; }
    if (u.origin !== origin) continue;
    if (/^\/(api|auth|reset-password)(\/|$)/.test(u.pathname)) continue;
    if (/(^|[?&])(code|token|access_token|refresh_token|type|error|_rsc)=/i.test(u.search)) continue;
    if (u.pathname.startsWith('/_next/static/') || u.pathname.startsWith('/scripts/')) out.push(u.pathname + u.search);
    if (out.length >= 80) break;
  }
  return Array.from(new Set(out));
}
// The service worker is registered only on the real site (a Vercel Production build) and only where the browser supports it.
export function shouldRegister(env: string | undefined, hasServiceWorker: boolean, isSecure: boolean): boolean {
  return env === 'production' && hasServiceWorker && isSecure;
}
