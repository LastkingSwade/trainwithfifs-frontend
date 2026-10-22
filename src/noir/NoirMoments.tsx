'use client';

import { useEffect } from 'react';
import { ARRIVE_KEY, ARRIVE_MS, shouldArrive } from './momentsLogic';

// The one-time arrival moment. It only sets a short-lived attribute on the page; the motion itself is CSS in noir.css, so nothing waits for it and every control works straight away.
// It reads no member data and sends nothing. The only thing stored is a flag in this tab's session so the settle does not repeat on every screen.
export default function NoirMoments() {
  useEffect(() => {
    const root = document.documentElement; let timer = 0; let done = false;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const check = () => {
      if (done) return;
      let already = false; try { already = window.sessionStorage.getItem(ARRIVE_KEY) === '1'; } catch { /* storage blocked: play at most once per page load */ }
      if (!document.body.classList.contains('fifs-tabs-on')) return;
      done = true; obs.disconnect();
      if (!shouldArrive({ flagOn: root.getAttribute('data-noir') === 'on', reducedMotion: reduced.matches, alreadyArrived: already, tabsOn: true, booting: root.hasAttribute('data-boot') || root.hasAttribute('data-resume') })) return;
      try { window.sessionStorage.setItem(ARRIVE_KEY, '1'); } catch { /* ignore */ }
      root.setAttribute('data-noir-arrive', ''); timer = window.setTimeout(() => root.removeAttribute('data-noir-arrive'), ARRIVE_MS);
    };
    const obs = new MutationObserver(check); obs.observe(document.body, { attributes: true, attributeFilter: ['class'] }); check();
    return () => { obs.disconnect(); window.clearTimeout(timer); root.removeAttribute('data-noir-arrive'); };
  }, []);
  return null;
}
