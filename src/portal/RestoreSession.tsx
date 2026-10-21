'use client';

import { useEffect } from 'react';
import { installSessionRestore } from './sessionRestore';
import { installLaunchTargets } from '../pwa/launch';

// Brings a signed-in student's or client's portal back when the site (or the installed app) opens, and opens it. Starts only after the page has fully loaded, gone idle,
// and the boot intro is over, so it can never collide with the page starting up (a returning signed-in person skips the intro and starts at once).
export default function RestoreSession() {
  useEffect(() => {
    let cancelled = false; let t: ReturnType<typeof setTimeout> | undefined;
    const go = () => {
      const w = window as any;
      // A returning signed-in person (the first script marked the page data-resume and skipped the intro): start at once so their portal opens straight away.
      if (document.documentElement.hasAttribute('data-resume')) { void installSessionRestore().finally(() => { if (!cancelled) installLaunchTargets(); }); return; }
      const idle = typeof w.requestIdleCallback === 'function' ? (f: () => void) => w.requestIdleCallback(f, { timeout: 4000 }) : (f: () => void) => setTimeout(f, 300);
      idle(() => { t = setTimeout(async () => { if (cancelled) return; const root = document.documentElement; const end = Date.now() + 20000; while (root.hasAttribute('data-boot') && Date.now() < end) await new Promise((r) => setTimeout(r, 300)); if (!cancelled) void installSessionRestore().finally(() => { if (!cancelled) installLaunchTargets(); }); }, 1500); });
    };
    if (document.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true });
    return () => { cancelled = true; if (t) clearTimeout(t); };
  }, []);
  return null;
}
