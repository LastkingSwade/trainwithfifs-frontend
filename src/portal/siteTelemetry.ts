// Admin "Website Telemetry": fills the existing panel with the REAL visit counts kept by the server (every page load, including hard refreshes, from every
// visitor's device) instead of the counters that only lived in the admin's own browser tab. Staff only (the server checks). Text only (textContent).
const w: any = typeof window === 'undefined' ? {} : window;
export interface Tel { ready: boolean; visits30?: number; unique30?: number; devices?: Record<string, number>; recent?: { at: string; device: string; browser: string; os: string; place: string; path: string; from: string }[] }

/** Puts the server's numbers where the existing dashboard reads them. */
export function applyTelemetry(t: Tel, store: { setItem(k: string, v: string): void }): boolean {
  if (!t || t.ready !== true) return false;
  store.setItem('fifs_pageviews_count', String(Math.max(0, Number(t.visits30) || 0)));
  store.setItem('fifs_unique_visitors_count', String(Math.max(0, Number(t.unique30) || 0)));
  store.setItem('fifs_device_counts', JSON.stringify(t.devices || {}));
  return true;
}

function note(container: HTMLElement, t: Tel | null) {
  container.querySelectorAll('#fifs-live-visits').forEach((n) => n.remove());
  const box = document.createElement('section'); box.id = 'fifs-live-visits'; box.setAttribute('aria-label', 'Latest visits');
  box.style.cssText = 'margin-top:18px;padding:16px 18px;border-radius:14px;background:#0d121a;border:1px solid rgba(0,229,255,0.35)';
  const h = document.createElement('div'); h.style.cssText = 'font-family:var(--font-display);font-weight:800;color:#19e6ff;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px'; box.appendChild(h);
  if (!t || t.ready !== true) {
    h.textContent = '📡 Live visit counting'; const p = document.createElement('p'); p.style.cssText = 'margin:0;color:#aac3d6';
    p.textContent = t ? 'Visits are not being saved yet. One-time step: run scripts/sql/20261012_site_visits.sql in the SQL editor of your database, then reload this panel.' : 'Could not load live visit numbers right now. The figures above only cover this browser tab.';
    box.appendChild(p);
  } else {
    h.textContent = '📡 Latest visits (last 30 days: ' + (t.visits30 || 0) + ' page loads, ' + (t.unique30 || 0) + ' unique visitors by day)';
    const ul = document.createElement('ul'); ul.style.cssText = 'list-style:none;margin:0;padding:0;display:grid;gap:6px';
    if (!(t.recent || []).length) { const li = document.createElement('li'); li.style.color = '#aac3d6'; li.textContent = 'No visits recorded yet.'; ul.appendChild(li); }
    for (const v of t.recent || []) {
      const li = document.createElement('li'); li.style.cssText = 'color:#d3e9f8;font-size:0.88rem;border-top:1px solid rgba(255,255,255,0.07);padding-top:6px';
      const when = new Date(v.at); li.textContent = (isNaN(when.getTime()) ? '' : when.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' · ') + v.device + ' · ' + v.browser + ' on ' + v.os + ' · ' + v.place + ' · ' + v.path + ' · from ' + v.from;
      ul.appendChild(li);
    }
    box.appendChild(ul);
  }
  container.appendChild(box);
}

/** Where the panel is shown; the live refresh only runs while it is on screen. */
const panelOf = (): HTMLElement | null => document.getElementById('admin-analytics-dashboard-container');
const panelShown = (el: HTMLElement | null): boolean => !!el && el.getClientRects().length > 0;
const REFRESH_MS = 30000;

export function installSiteTelemetry(): void {
  if (typeof document === 'undefined' || w.__fifsSiteTelemetryInstalled) return;
  const redraw = w.renderAdminAnalyticsDashboard; if (typeof redraw !== 'function') return;
  w.__fifsSiteTelemetryInstalled = true;
  let busy = false;

  /** Fetch the server's real numbers, put them where the panel reads them, redraw, then add the latest-visits list. */
  const load = (): Promise<void> => {
    const c = panelOf();
    if (busy || !c || typeof w.callFifsBackend !== 'function' || !w._fifsMemStorage) return Promise.resolve();
    busy = true;
    return Promise.resolve(w.callFifsBackend('getSiteTelemetry', {})).then((r: any) => {
      const t: Tel | null = r && r.telemetry ? r.telemetry : null;
      if (t && applyTelemetry(t, w._fifsMemStorage)) redraw.call(w, {});
      const now = panelOf(); if (now) note(now, t);
    }).catch(() => { const now = panelOf(); if (now) note(now, null); }).finally(() => { busy = false; });
  };

  // The page's own redraw (it reads the stored numbers), then the server refresh.
  w.renderAdminAnalyticsDashboard = function (...args: any[]) {
    const out = redraw.apply(this, args);
    void load();
    return out;
  };
  // The admin tab calls this when the Telemetry tab is opened.
  w.refreshAdminTelemetry = () => { void load(); };
  // While the panel is on screen, keep it current.
  window.setInterval(() => { if (document.visibilityState === 'visible' && panelShown(panelOf())) void load(); }, REFRESH_MS);
}
