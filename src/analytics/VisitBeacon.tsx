'use client';
import { useEffect } from 'react';
import { isStaffDevice } from './staffDevice';

// Tells the server a page was loaded, once per load. A hard refresh loads the page again, so it is counted again. Sends only the page's path (never the query
// string or #fragment), the window width, whether it is a touch screen, and the referring site's name. Nothing else; no cookies or storage. Staff devices send nothing.
export default function VisitBeacon() {
  useEffect(() => {
    const w = window as any;
    if (w.__fifsVisitSent) return; w.__fifsVisitSent = true;
    if (isStaffDevice()) return; // a staff device (Admin Hub alerts on): its visits are not counted and do not trigger alerts
    try {
      let r = ''; try { r = document.referrer ? new URL(document.referrer).hostname : ''; } catch { /* no referrer */ }
      if (r === window.location.hostname) r = ''; // our own site is not a referrer
      const body = JSON.stringify({ p: window.location.pathname, w: window.innerWidth, t: navigator.maxTouchPoints > 0, r });
      if (navigator.sendBeacon) navigator.sendBeacon('/api/visit', new Blob([body], { type: 'application/json' }));
      else void fetch('/api/visit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true });
    } catch { /* never get in the way of the page */ }
  }, []);
  return null;
}
