'use client';

import { useEffect } from 'react';
import { installOrganic } from './organic';

// Mounted once in the root layout. Starts after the page has loaded and the boot intro is over, so it never competes with the page starting up.
export default function OrganicSkin() {
  useEffect(() => {
    let cancelled = false; let t: ReturnType<typeof setTimeout> | undefined;
    const go = async () => { const root = document.documentElement; const end = Date.now() + 20000; while (root.hasAttribute('data-boot') && Date.now() < end) await new Promise((r) => setTimeout(r, 300)); if (!cancelled) installOrganic(); };
    const start = () => { t = setTimeout(go, 600); };
    if (document.readyState === 'complete') start(); else window.addEventListener('load', start, { once: true });
    return () => { cancelled = true; if (t) clearTimeout(t); };
  }, []);
  return null;
}
