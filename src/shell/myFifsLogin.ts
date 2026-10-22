import './myFifsLogin.css';
// The My FIFS button's own sign-in window. One email can only open one portal, so this is the same single sign-in the header uses (email and password, the right portal opens by itself),
// shown on its own instead of the old "pick a portal" screen. It reuses the header's form and all of its rules (same server checks, same messages, password never stored); this file only
// draws the window around it: a labelled dialog that closes with the ✕ button, the Escape key or a tap outside, keeps the keyboard inside while open, and gives focus back when it closes.
const w: any = typeof window === 'undefined' ? {} : window;
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

export function openMyFifsLogin(): void {
  if (typeof document === 'undefined' || document.getElementById('fifsMyLogin')) return;
  const prev = document.activeElement as HTMLElement | null;
  const overlay = el('div', 'fml-overlay'); overlay.id = 'fifsMyLogin'; // the site's glass-styling script leaves this window alone
  const box = el('div', 'fml-box'); box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Sign in to My FIFS');
  const close = el('button', 'fml-close', '✕'); close.type = 'button'; close.setAttribute('aria-label', 'Close sign in');
  const brand = el('p', 'fml-brand', 'My FIFS'); const panel = el('div', 'fml-panel');
  box.append(close, brand, panel); overlay.append(box); document.body.append(overlay);
  const shut = () => { overlay.remove(); document.removeEventListener('keydown', onKey, true); if (prev && prev.isConnected && prev.focus) prev.focus(); };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); shut(); return; }
    if (e.key !== 'Tab') return;
    const f = Array.from(box.querySelectorAll<HTMLElement>('button, input, a[href]')).filter((n) => !n.hasAttribute('disabled') && n.offsetParent !== null); if (!f.length) return;
    const first = f[0], last = f[f.length - 1], a = document.activeElement;
    if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
  };
  document.addEventListener('keydown', onKey, true); close.addEventListener('click', shut); overlay.addEventListener('click', (e) => { if (e.target === overlay) shut(); });
  let first: HTMLElement | null = null;
  if (typeof w.fifsRenderSignInPanel === 'function') first = w.fifsRenderSignInPanel(panel, shut, () => undefined) as HTMLElement | null;
  else { panel.textContent = 'Sign-in is not available right now. Please try again in a moment, or call 443-990-1304.'; }
  (first || close).focus();
}
export function installMyFifsLogin(): void { w.openMyFifsLogin = openMyFifsLogin; }
