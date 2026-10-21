'use client';

import { useEffect } from 'react';
import { offlineUrlsFrom, shouldRegister } from './swPlan';
import { installInstallPrompt } from './installPrompt';
import { dueForCheck, shouldOffer, showUpdateNotice } from './updateNotice';
import './pwa.css';

// Registers /sw.js (offline support for public pages). The "You are offline" banner already exists in src/polish/polish.ts, so none is added here.
// Nothing here stores or sends any personal information.
export default function ServiceWorkerRegister() {
  useEffect(() => { installInstallPrompt(); }, []);
  useEffect(() => {
    const secure = window.isSecureContext;
    if (!shouldRegister(process.env.NEXT_PUBLIC_FIFS_DEPLOYMENT_ENV, 'serviceWorker' in navigator, secure)) return;
    let cancelled = false;
    const start = async () => {
      try {
        const registered = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        // A new version waiting (or arriving while the app stays open): offer it, never force it.
        if (registered.waiting && shouldOffer(!!navigator.serviceWorker.controller, 'waiting')) showUpdateNotice(registered.waiting);
        registered.addEventListener('updatefound', () => { const nw = registered.installing; nw?.addEventListener('statechange', () => { if (nw.state === 'installed' && shouldOffer(!!navigator.serviceWorker.controller, nw.state)) showUpdateNotice(nw); }); });
        let last = Date.now(); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && dueForCheck(last, Date.now())) { last = Date.now(); void registered.update().catch(() => undefined); } });
        const reg = await navigator.serviceWorker.ready;
        if (cancelled || !reg.active) return;
        const loaded = performance.getEntriesByType('resource').map((r) => r.name);
        const urls = offlineUrlsFrom(loaded, window.location.origin);
        if (urls.length) reg.active.postMessage({ type: 'CACHE_URLS', urls });
      } catch { /* the site works the same without it */ }
    };
    if (document.readyState === 'complete') void start(); else window.addEventListener('load', () => void start(), { once: true });
    return () => { cancelled = true; };
  }, []);

  return null;
}
