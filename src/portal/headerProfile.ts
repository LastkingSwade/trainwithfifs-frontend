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
  const close = (focusBtn = false) => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (focusBtn) btn.focus(); };
  const build = () => {
    menu.textContent = '';
    for (const st of states()) {
      const item = document.createElement('button'); item.type = 'button'; item.className = 'hb-item'; item.setAttribute('role', 'menuitem');
      const t = document.createElement('span'); t.className = 'hb-item-t'; t.textContent = st.label;
      const sub = document.createElement('span'); sub.className = 'hb-item-s' + (st.signedIn ? ' on' : ''); sub.textContent = st.signedIn ? (st.name ? 'Signed in as ' + st.name + '. Open it' : 'Signed in. Open it') : 'Sign in';
      item.append(t, sub);
      item.addEventListener('click', () => { close(); if (typeof w.openAndSwitch === 'function') w.openAndSwitch(st.key); });
      menu.appendChild(item);
      if (st.signedIn) {
        // Always a way out: "Not you? Sign out" signs out of this portal and clears the saved login on this device.
        const out = document.createElement('button'); out.type = 'button'; out.className = 'hb-item hb-out'; out.setAttribute('role', 'menuitem');
        const ot = document.createElement('span'); ot.className = 'hb-item-t'; ot.textContent = 'Not you? Sign out';
        const os = document.createElement('span'); os.className = 'hb-item-s'; os.textContent = st.label;
        out.append(ot, os);
        out.addEventListener('click', () => { close(); const fn = st.key === 'portal' ? w.logoutStudent : w.fiLogoutClient; if (typeof fn === 'function') fn(); setTimeout(refreshBadge, 300); });
        menu.appendChild(out);
      }
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
