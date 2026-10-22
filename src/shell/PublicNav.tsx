'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import './publicNav.css';
import { ITEMS, activeFor, myFifsHref, navVisible, savedPortal, type NavItem, type NavKey } from './publicNavLogic';

const w: any = typeof window === 'undefined' ? {} : window;
const shown = (id: string): boolean => { const e = document.getElementById(id); return !!e && e.offsetParent !== null; };
interface Snap { visible: boolean; active: NavKey | null; portal: 'student' | 'client' | null }
const OFF: Snap = { visible: false, active: null, portal: null };

// The public bottom bar for phones. Every tab is a real link, so it works with the keyboard, a long-press and a screen reader; on the one-page site the click is handled in place
// (the same functions the site's own buttons call), on other pages it is an ordinary page load. Nothing is stored or sent; the saved login is only read to pick the right portal.
export default function PublicNav() {
  const pathname = usePathname() || '/';
  const [snap, setSnap] = useState<Snap>(OFF);

  useEffect(() => {
    const read = (): Snap => {
      const root = document.documentElement;
      const view = String(w.currentActiveView || 'home');
      const visible = navVisible({ pathname, view, dashboardOpen: shown('student-active-dashboard') || shown('client-active-dashboard') || document.body.classList.contains('fifs-tabs-on'), booting: root.hasAttribute('data-boot') || root.hasAttribute('data-resume') });
      let portal: Snap['portal'] = null; try { portal = savedPortal(window.localStorage, new Date()); } catch { /* storage blocked: treated as signed out */ }
      return { visible, active: visible ? activeFor({ pathname, view }) : null, portal };
    };
    const update = () => { const n = read(); setSnap((o) => (o.visible === n.visible && o.active === n.active && o.portal === n.portal ? o : n)); };
    update(); const t = window.setInterval(update, 600);
    window.addEventListener('popstate', update); document.addEventListener('visibilitychange', update);
    return () => { window.clearInterval(t); window.removeEventListener('popstate', update); document.removeEventListener('visibilitychange', update); };
  }, [pathname]);

  useEffect(() => { document.body.classList.toggle('fifs-pubnav-on', snap.visible); return () => document.body.classList.remove('fifs-pubnav-on'); }, [snap.visible]);
  if (!snap.visible) return null;

  const onHome = pathname === '/' && typeof w.openAndSwitch === 'function';
  const click = (item: NavItem) => (e: React.MouseEvent) => {
    if (!onHome || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // new tab / modified clicks keep the real link
    if (item.key === 'permits') return; // a real page: let the link load it
    e.preventDefault();
    if (item.key === 'home') { if (typeof w.returnToHome === 'function') w.returnToHome(); else w.openAndSwitch('home'); window.scrollTo({ top: 0 }); }
    else if (item.key === 'start') { w.openAndSwitch('start'); window.scrollTo({ top: 0 }); }
    else if (item.key === 'book') { w.openAndSwitch('booking'); window.scrollTo({ top: 0 }); }
    else if (item.key === 'myfifs') {
      if (snap.portal === 'student') w.openAndSwitch('portal'); else if (snap.portal === 'client') w.openAndSwitch('fi-portal');
      else if (typeof w.openMyFifsLogin === 'function') w.openMyFifsLogin(); else if (typeof w.openPortalSelectionModal === 'function') w.openPortalSelectionModal(); else w.openAndSwitch('portal');
    }
  };

  return (
    <nav className="fpn" aria-label="Main sections" data-organic="skip">
      {ITEMS.map((it) => (
        <a key={it.key} className="fpn-tab" href={it.key === 'myfifs' ? myFifsHref(snap.portal) : it.href} aria-current={snap.active === it.key ? 'page' : undefined} onClick={click(it)}>
          <svg className="fpn-ico" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{it.icon.map((d, i) => <path key={i} d={d} />)}</svg>
          <span className="fpn-lab">{it.label}</span>
        </a>
      ))}
    </nav>
  );
}
