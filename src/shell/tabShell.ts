// FIFS ONE tabs: Home, Vault, Armory, Range, States (the Reciprocity Hub) and Hub for a signed-in student or client. On a phone it is a bar along the bottom; on a larger screen it is a rail down the left, under the site header.
// It only appears while a signed-in dashboard is on screen, and it opens things that already exist. All text is set with textContent. Nothing is stored.
import { ARMORY_TEXT, TABS, currentTab, hubItemsFor, roleFrom, type HubItem, type Role, type TabKey } from './tabLogic';
import './tabShell.css';
const w: any = typeof window === 'undefined' ? {} : window;
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const shown = (id: string): boolean => { const e = document.getElementById(id); return !!e && e.offsetParent !== null; };

export function installTabShell(): void {
  if (typeof document === 'undefined' || w.__fifsTabShell) return; w.__fifsTabShell = true;
  const nav = el('nav', 'fts-nav'); nav.id = 'fifs-tabs'; nav.setAttribute('aria-label', 'Main tabs'); nav.setAttribute('data-organic', 'skip'); nav.hidden = true;
  const buttons = new Map<TabKey, HTMLButtonElement>();
  for (const t of TABS) {
    const b = el('button', 'fts-tab'); b.type = 'button'; b.dataset.tab = t.key;
    b.append(el('span', 'fts-ico', t.emoji), el('span', 'fts-lab', t.label)); b.querySelector('.fts-ico')!.setAttribute('aria-hidden', 'true');
    if (t.aria) b.setAttribute('aria-label', t.aria);
    b.addEventListener('click', () => go(t.key)); buttons.set(t.key, b); nav.append(b);
  }
  document.body.append(nav);

  let role: Role | null = null; let sheet: HTMLElement | null = null; let sheetKind: 'hub' | 'armory' | '' = '';

  function closeSheet() { if (sheet) { sheet.remove(); sheet = null; sheetKind = ''; refresh(); } }
  function openSheet(kind: 'hub' | 'armory') {
    closeSheet(); sheetKind = kind;
    const overlay = el('div', 'fts-overlay'); overlay.setAttribute('data-organic', 'skip'); overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSheet(); });
    const box = el('section', 'fts-sheet'); box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
    const head = el('div', 'fts-head'); const title = el('h2', 'fts-title', kind === 'hub' ? '🧭 Hub' : ARMORY_TEXT.title); title.id = 'fts-sheet-title'; box.setAttribute('aria-labelledby', title.id);
    const close = el('button', 'fts-close', '✕'); close.type = 'button'; close.setAttribute('aria-label', 'Close'); close.addEventListener('click', closeSheet); head.append(title, close); box.append(head);
    if (kind === 'armory') { box.append(el('p', 'fts-text', ARMORY_TEXT.body)); const ok = el('button', 'fts-primary', 'Back to my portal'); ok.type = 'button'; ok.addEventListener('click', closeSheet); box.append(ok); }
    else if (role) { const list = el('ul', 'fts-list'); for (const it of hubItemsFor(role)) list.append(hubRow(it)); box.append(list); }
    overlay.append(box); document.body.append(overlay); sheet = overlay; refresh();
    window.setTimeout(() => (box.querySelector('.fts-close') as HTMLElement | null)?.focus(), 30);
  }
  function hubRow(it: HubItem): HTMLElement {
    const li = el('li'); const content = (tag: 'button' | 'a') => { const n = el(tag, 'fts-item'); n.append(el('span', 'fts-item-ico', it.emoji), (() => { const d = el('span', 'fts-item-text'); d.append(el('b', undefined, it.label), el('small', undefined, it.hint)); return d; })()); n.firstElementChild!.setAttribute('aria-hidden', 'true'); return n; };
    if (it.href) { const a = content('a') as HTMLAnchorElement; a.href = it.href; li.append(a); return li; }
    const b = content('button') as HTMLButtonElement; b.type = 'button';
    b.addEventListener('click', () => {
      closeSheet();
      if (it.scrollTo === 'chat') { const h = document.querySelector<HTMLElement>(`[data-portal-chat="${role}"]`); if (h) { h.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' }); window.setTimeout(() => (h.querySelector('textarea') as HTMLElement | null)?.focus(), 350); } return; }
      const fn = it.call ? w[it.call] : null; if (typeof fn === 'function') fn(it.arg);
    });
    li.append(b); return li;
  }

  const reciprocityOpen = (): boolean => { const m = document.getElementById('reciprocityHubModal'); return !!m && getComputedStyle(m).display !== 'none'; };
  function go(key: TabKey) {
    if (key !== 'reciprocity' && reciprocityOpen()) w.toggleReciprocityHubModal?.(false);
    if (key !== 'hub' && key !== 'armory') closeSheet();
    if (key === 'reciprocity') { closeSheet(); document.querySelectorAll<HTMLElement>('.vault-close, .rj-close').forEach((b) => b.click()); w.toggleReciprocityHubModal?.(!reciprocityOpen()); return; }
    if (key === 'home') { w.closeWallet?.(); document.querySelectorAll<HTMLElement>('.vault-close, .rj-close').forEach((b) => b.click()); window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); return; }
    if (key === 'wallet') { document.querySelectorAll<HTMLElement>('.rj-close').forEach((b) => b.click()); w.openWallet?.(); return; }
    if (key === 'range') { document.querySelectorAll<HTMLElement>('.vault-close, .ar-overlay .rj-close').forEach((b) => b.click()); w.openRangeJournal?.(); return; }
    if (key === 'hub') { if (sheetKind === 'hub') closeSheet(); else openSheet('hub'); return; }
    if (key === 'armory') { if (typeof w.openArmory === 'function') { closeSheet(); document.querySelectorAll<HTMLElement>('.vault-close, .rj-overlay:not(.ar-overlay) .rj-close').forEach((b) => b.click()); w.openArmory(); } else if (sheetKind === 'armory') closeSheet(); else openSheet('armory'); }
  }

  function refresh() {
    const now = roleFrom(shown('student-active-dashboard'), shown('client-active-dashboard'));
    if (now !== role) { role = now; if (!role) closeSheet(); }
    const on = !!role; nav.hidden = !on; document.body.classList.toggle('fifs-tabs-on', on);
    if (on) {
      const header = document.querySelector<HTMLElement>('.app-header'); const hb = header ? Math.max(0, Math.round(header.getBoundingClientRect().bottom)) : 0;
      document.documentElement.style.setProperty('--fts-rail-top', Math.min(hb, 160) + 'px');
      const active = currentTab({ journalOpen: !!document.querySelector('.rj-overlay:not(.ar-overlay)'), walletOpen: !!document.querySelector('.vault-overlay'), hubOpen: sheetKind === 'hub', armoryOpen: sheetKind === 'armory' || !!document.querySelector('.ar-overlay'), reciprocityOpen: reciprocityOpen() });
      buttons.forEach((b, k) => { if (k === active) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    }
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sheet) { e.stopPropagation(); closeSheet(); } }, true);
  window.setInterval(refresh, 700); document.addEventListener('visibilitychange', refresh); refresh();
}
