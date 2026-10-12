// Header profile icon: a small menu that shows whether you are signed in to the Student or Client portal and takes you straight to that
// portal's sign-in (or dashboard). Staff sign-in is not offered here. Names are set with textContent only; nothing is stored or sent.
const w: any = typeof window === 'undefined' ? {} : window;

export interface PortalState { key: 'portal' | 'fi-portal'; label: string; signedIn: boolean; name: string }

const parse = (raw: unknown): any => { try { return typeof raw === 'string' && raw ? JSON.parse(raw) : null; } catch { return null; } };
const firstName = (v: unknown): string => String(v || '').trim().split(/\s+/)[0].slice(0, 30);

export function portalStates(getStudent?: () => unknown, getClient?: () => unknown): PortalState[] {
  const s = parse(typeof getStudent === 'function' ? getStudent() : null), c = parse(typeof getClient === 'function' ? getClient() : null);
  return [
    { key: 'portal', label: 'Student portal', signedIn: !!s, name: firstName(s && (s.fullName || s.name)) },
    { key: 'fi-portal', label: 'Client portal', signedIn: !!c, name: firstName(c && (c.fullName || c.name)) },
  ];
}
// One email signs in to one portal at a time, so the menu shows one account. If both records happen to be saved, the portal whose dashboard is open wins.
export function activePortal(st: PortalState[], visibleKey?: string): PortalState | null {
  const on = st.filter((x) => x.signedIn); if (!on.length) return null;
  return on.find((x) => x.key === visibleKey) || on[0];
}
export const profileLabel = (st: PortalState[]): string => {
  const on = st.filter((x) => x.signedIn);
  return on.length ? 'Your profile. Signed in to the ' + on.map((x) => x.label.toLowerCase()).join(' and the ') + '.' : 'Your profile. Not signed in. Choose a portal to sign in.';
};

export function installHeaderProfile(): void {
  if (w.__fifsHeaderProfileInstalled) return;
  const btn = document.getElementById('btnNavProfile') as HTMLButtonElement | null, menu = document.getElementById('hbProfileMenu') as HTMLElement | null, dot = document.getElementById('hbProfileDot') as HTMLElement | null;
  if (!btn || !menu) return;
  w.__fifsHeaderProfileInstalled = true;
  const states = () => portalStates(w.fifsGetStudentSession, w.fifsGetClientSession);
  const refreshBadge = () => { const st = states(); btn.setAttribute('aria-label', profileLabel(st)); if (dot) dot.style.display = st.some((x) => x.signedIn) ? 'block' : 'none'; };
  const visibleKey = () => { const c = document.getElementById('view-fi-portal'); return c && !c.classList.contains('hidden') ? 'fi-portal' : 'portal'; };
  const close = (focusBtn = false) => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (focusBtn) btn.focus(); };
  const build = () => {
    menu.textContent = '';
    const st = states(); const on = activePortal(st, visibleKey());
    const mk = (cls: string, title: string, sub: string, run: () => void) => {
      const item = document.createElement('button'); item.type = 'button'; item.className = 'hb-item ' + cls; item.setAttribute('role', 'menuitem');
      const t = document.createElement('span'); t.className = 'hb-item-t'; t.textContent = title; item.appendChild(t);
      if (sub) { const x = document.createElement('span'); x.className = 'hb-item-s'; x.textContent = sub; item.appendChild(x); }
      item.addEventListener('click', () => { close(); run(); setTimeout(refreshBadge, 300); }); return item;
    };
    const head = document.createElement('div'); head.className = 'hb-head'; head.setAttribute('role', 'none');
    const av = document.createElement('span'); av.className = 'hb-avatar'; av.setAttribute('aria-hidden', 'true'); av.textContent = on ? (on.name.charAt(0) || '👤').toUpperCase() : '👤';
    const who = document.createElement('span'); who.className = 'hb-who';
    const nm = document.createElement('strong'); nm.textContent = on ? (on.name || 'Signed in') : 'Not signed in';
    const pl = document.createElement('span'); pl.className = 'hb-portal' + (on ? ' on' : ''); pl.textContent = on ? (on.key === 'portal' ? '🎓 ' : '🛡️ ') + 'Signed in to the ' + on.label : 'Choose a portal to sign in';
    who.append(nm, pl); head.append(av, who); menu.appendChild(head);
    if (on) {
      const key = on.key;
      menu.appendChild(mk('hb-open', 'Open my ' + on.label.toLowerCase(), '', () => { if (typeof w.openAndSwitch === 'function') w.openAndSwitch(key); }));
      menu.appendChild(mk('hb-pw', '🔑 Change password', '', () => { if (typeof w.openChangePasswordModal === 'function') w.openChangePasswordModal(key === 'portal' ? 'student' : 'client'); }));
      // Always a way out: "Not you? Sign out" signs out of this portal and clears the saved login on this device.
      menu.appendChild(mk('hb-out', 'Not you? Sign out', '', () => { const fn = key === 'portal' ? w.logoutStudent : w.fiLogoutClient; if (typeof fn === 'function') fn(); }));
    } else {
      for (const p of st) menu.appendChild(mk('hb-signin', (p.key === 'portal' ? '🎓 ' : '🛡️ ') + p.label, 'Sign in', () => { if (typeof w.openAndSwitch === 'function') w.openAndSwitch(p.key); }));
    }
  };
  const open = () => { build(); menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); (menu.querySelector('.hb-item') as HTMLElement | null)?.focus(); };
  btn.addEventListener('click', (e) => { e.stopPropagation(); if (menu.hidden) open(); else close(); });
  document.addEventListener('click', (e) => { if (!menu.hidden && !(e.target as Node && document.getElementById('hbProfileWrap')?.contains(e.target as Node))) close(); });
  document.addEventListener('keydown', (e) => { if (!menu.hidden && e.key === 'Escape') { e.preventDefault(); close(true); } });
  menu.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const items = Array.from(menu.querySelectorAll<HTMLElement>('.hb-item')); const i = items.indexOf(document.activeElement as HTMLElement);
    e.preventDefault(); items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length]?.focus();
  });
  refreshBadge(); setInterval(refreshBadge, 4000);
}
