// Small quality-of-life behaviours (backlog IDs in docs/UX-BACKLOG.md). Additive: nothing here changes a handler, a price or a booking rule.
// Storage is touched only through src/portal/prefs.ts (try/catch, allow-list) or sessionStorage inside try/catch.
import { getPref, setPref } from '../portal/prefs';
import { installQol } from '../experiments/qol';

const w: any = typeof window === 'undefined' ? {} : window;
const reduce = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const SIZES = ['normal', 'large', 'larger'] as const;
const SIZE_LABEL: Record<string, string> = { normal: 'Normal text size', large: 'Large text size', larger: 'Largest text size' };

function floatBtn(id: string, text: string, label: string): HTMLButtonElement {
  const b = document.createElement('button'); b.type = 'button'; b.id = id; b.className = 'fifs-float'; b.textContent = text; b.setAttribute('aria-label', label); b.title = label; b.hidden = true;
  document.body.appendChild(b); return b;
}
const modalOpen = () => document.body.classList.contains('modal-open') || !!document.querySelector('.goal-modal-overlay.active');


// Back button: one step back closes only the front-most pop-up (an edit window over the roster window, for example) and shows what was behind it.
// Only when no pop-up is open does it go to the previous page, as before. (It used to close every pop-up at once and then jump to the home screen.)
const OVERLAYS = '.goal-modal-overlay, .fi-portal-modal-overlay, #adminSubpanelModalOverlay, [id$="Modal"][style], [role="dialog"]';
const CLOSERS: Record<string, string> = { adminSubpanelModalOverlay: 'closeAdminSubpanelModal', adminEditStudentModal: 'closeAdminEditStudentModal', courseBookingModal: 'closeCourseBookingModal' };
function isOpen(el: HTMLElement): boolean {
  const cs = getComputedStyle(el);
  return cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0 && el.getClientRects().length > 0;
}
export function frontOverlay(): HTMLElement | null {
  const all = Array.from(document.querySelectorAll<HTMLElement>(OVERLAYS)).filter((el) => el.id && isOpen(el));
  let best: HTMLElement | null = null, bestZ = -Infinity;
  for (const el of all) {
    if (el.id === 'floatingCommPill' || el.classList.contains('boot-intro')) continue;
    const z = parseInt(getComputedStyle(el).zIndex, 10); const zz = Number.isFinite(z) ? z : 0;
    if (zz >= bestZ) { best = el; bestZ = zz; }   // equal z-index: the later one in the page is in front
  }
  return best;
}
function closeOverlay(el: HTMLElement) {
  const fn = CLOSERS[el.id] && w[CLOSERS[el.id]];
  if (typeof fn === 'function') fn(); else { el.classList.remove('active', 'open'); el.style.setProperty('display', 'none', 'important'); el.style.setProperty('opacity', '0', 'important'); el.style.setProperty('visibility', 'hidden', 'important'); }
  if (!frontOverlay()) { document.body.classList.remove('modal-open'); document.body.style.overflow = ''; }
}
export function installBackStep(): void {
  const original = w.navigateBack;
  if (typeof original !== 'function' || original.__fifsStep) return;
  const wrapped = function (this: unknown, ...args: unknown[]) {
    const front = frontOverlay();
    if (front) { closeOverlay(front); return; }
    return original.apply(this, args);
  };
  (wrapped as any).__fifsStep = true;
  w.navigateBack = wrapped;
}


// Chat bubble: closing it hides it for this visit only (it used to vanish forever, and a stranded red ✕ could be left on screen).
// Visitors who closed it before get it back; the old permanent flag is cleared.
const CHAT_FLAG = 'fifs_chat_bubble_dismissed';
export function installChatBubble(): void {
  try { window.localStorage.removeItem(CHAT_FLAG); } catch { /* ignore */ }
  const wrap = document.getElementById('floatingCommWrapper');
  let dismissed = false;
  try { dismissed = window.sessionStorage.getItem('fifs.chatDismissed') === '1'; } catch { /* shown as usual */ }
  if (wrap) { if (dismissed) wrap.style.setProperty('display', 'none', 'important'); else wrap.style.setProperty('display', 'flex'); }
  const original = w.dismissFloatingChat;
  w.dismissFloatingChat = function (this: unknown, ...args: unknown[]) {
    if (typeof original === 'function') original.apply(this, args);
    try { window.localStorage.removeItem(CHAT_FLAG); } catch { /* ignore */ }
    try { window.sessionStorage.setItem('fifs.chatDismissed', '1'); } catch { /* ignore */ }
  };
}

export function installPolish(): void {
  if (w.__fifsPolishInstalled) return;
  w.__fifsPolishInstalled = true;

  installBackStep();
  installChatBubble();
  installQol();

  // #80 status messages are announced by screen readers
  document.querySelectorAll<HTMLElement>('.status-msg').forEach((el) => { if (!el.getAttribute('role')) { el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); } });

  // #57 the 👑 buttons say what they do
  document.querySelectorAll<HTMLElement>('.btn-vip-side').forEach((el) => { if (!el.title) el.title = 'VIP: range fee included, any-day scheduling, loaner firearm and more'; });

  // #62 text size, remembered per device
  const size = getPref('textSize', 'normal');
  const applySize = (s: string) => { document.documentElement.setAttribute('data-text', s); };
  applySize(size);
  const sizeBtn = floatBtn('fifs-textsize', 'Aa', SIZE_LABEL[size]);
  sizeBtn.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-text') || 'normal';
    const next = SIZES[(SIZES.indexOf(cur as (typeof SIZES)[number]) + 1) % SIZES.length];
    applySize(next); setPref('textSize', next); sizeBtn.setAttribute('aria-label', SIZE_LABEL[next]); sizeBtn.title = SIZE_LABEL[next];
  });

  // #22 back to top after about a screen and a half
  const top = floatBtn('fifs-top', '↑', 'Back to top');
  top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduce() ? 'auto' : 'smooth' }));

  // #21 a "Book a class" shortcut on the home page after the first scroll, and on the About, FAQ and Reviews pages. Closing it hides it for the rest of this visit.
  let dismissed = false;
  try { dismissed = window.sessionStorage.getItem('fifs.stickyBook') === 'x'; } catch { /* shown as usual */ }
  const book = floatBtn('fifs-sticky-book', '📅 Book a class →', 'Book a class');
  const close = document.createElement('button'); close.type = 'button'; close.className = 'fifs-x'; close.textContent = '✕'; close.setAttribute('aria-label', 'Hide this shortcut');
  book.appendChild(close);
  book.addEventListener('click', (e) => {
    if (e.target === close) { dismissed = true; try { window.sessionStorage.setItem('fifs.stickyBook', 'x'); } catch { /* ignore */ } book.hidden = true; return; }
    if (typeof w.openAndSwitch === 'function') w.openAndSwitch('booking');
  });

  let ticking = false;
  const update = () => {
    ticking = false;
    const y = window.scrollY || 0, hidden = modalOpen();
    const inHome = document.body.classList.contains('in-home'), inApp = document.body.classList.contains('in-app');
    const reading = ['about', 'faq', 'testimonial'].includes(String(w.currentActiveView));   // pages people read; a booking shortcut helps there
    sizeBtn.hidden = hidden || !inApp;                                                       // the home screen is already large and one screen tall
    top.hidden = hidden || y < window.innerHeight * 1.5;
    book.hidden = dismissed || hidden || !((inHome && y > 600) || (inApp && reading && y > 300));
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } }, { passive: true });
  new MutationObserver(update).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  update();

  // #20 an offline notice
  const off = document.createElement('div'); off.id = 'fifs-offline'; off.setAttribute('role', 'status'); off.hidden = true; off.textContent = 'You are offline. Some things will not work until you are back online.';
  document.body.appendChild(off);
  const net = () => { off.hidden = navigator.onLine !== false; };
  window.addEventListener('online', net); window.addEventListener('offline', net); net();

  // #31 closing a pop-up returns focus to the control that opened it
  const openers = new WeakMap<Element, HTMLElement>();
  const visible = (el: HTMLElement) => getComputedStyle(el).display !== 'none' && !el.classList.contains('hidden');
  const state = new WeakMap<Element, boolean>();
  document.querySelectorAll<HTMLElement>('.goal-modal-overlay').forEach((el) => {
    state.set(el, visible(el));
    new MutationObserver(() => {
      const now = visible(el), was = !!state.get(el);
      if (now && !was) { const a = document.activeElement as HTMLElement | null; if (a && a !== document.body) openers.set(el, a); }
      if (!now && was) { const o = openers.get(el); if (o && o.isConnected) window.setTimeout(() => { try { o.focus({ preventScroll: true }); } catch { /* ignore */ } }, 0); }
      state.set(el, now);
    }).observe(el, { attributes: true, attributeFilter: ['class', 'style'] });
  });

  // #5 the booking and pay buttons show a small spinner for a moment after a tap. Visual only: the click is never blocked and no handler is changed.
  document.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement | null)?.closest?.('#btn-booking-submit, #btn-confirm-invoice-deposit, #btn-confirm-invoice-full') as HTMLElement | null;
    if (!b) return;
    b.classList.add('fifs-busy'); b.setAttribute('aria-busy', 'true');
    window.setTimeout(() => { b.classList.remove('fifs-busy'); b.removeAttribute('aria-busy'); }, 3000);
  });

  // #44 a tiny tap on phones for the main toggles and buttons (never with reduced motion, and only where the phone supports it)
  document.addEventListener('click', (e) => {
    if (reduce() || typeof navigator.vibrate !== 'function' || !window.matchMedia('(pointer: coarse)').matches) return;
    if ((e.target as HTMLElement | null)?.closest?.('.tier-option-btn, .tier-online-btn, .btn-select-course, .btn-spark')) navigator.vibrate(10);
  }, { passive: true });
}
