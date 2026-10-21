// An "Install the app" button at the bottom of the page, shown only when the browser can actually install it and the app is not installed yet:
//   Android and desktop Chrome/Edge: the browser's own install prompt (captured from `beforeinstallprompt`), one tap.
//   iPhone and iPad: Apple has no install prompt, so the button shows the two taps (Share, then Add to Home Screen).
// Nothing is stored or sent.
export type Offer = 'none' | 'prompt' | 'ios';
export function installOffer(i: { standalone: boolean; hasPrompt: boolean; ios: boolean }): Offer {
  if (i.standalone) return 'none';
  if (i.hasPrompt) return 'prompt';
  return i.ios ? 'ios' : 'none';
}
/** iPhone, iPod, iPad, and iPads that call themselves a Mac (they have a touch screen). */
export function isIos(ua: string, platform: string, touchPoints: number): boolean {
  return /iPhone|iPad|iPod/.test(String(ua || '')) || (String(platform || '') === 'MacIntel' && Number(touchPoints) > 1);
}
export const IOS_STEPS: readonly string[] = ['Tap the Share button (the square with the arrow) at the bottom or top of your browser.', 'Scroll down and tap “Add to Home Screen”.', 'Tap “Add”. The FIFS icon appears with your apps.'];

const w: any = typeof window === 'undefined' ? {} : window;
let deferred: any = null;
const standalone = (): boolean => { try { return !!(w.matchMedia && w.matchMedia('(display-mode: standalone)').matches) || w.navigator?.standalone === true; } catch { return false; } };

function render(): void {
  const foot = document.getElementById('fifs-foot'); if (!foot) return;
  const offer = installOffer({ standalone: standalone(), hasPrompt: !!deferred, ios: isIos(navigator.userAgent, navigator.platform, navigator.maxTouchPoints || 0) });
  let btn = document.getElementById('fifs-install') as HTMLButtonElement | null;
  if (offer === 'none') { btn?.remove(); document.getElementById('fifs-install-help')?.remove(); return; }
  if (!btn) {
    btn = document.createElement('button'); btn.type = 'button'; btn.id = 'fifs-install'; btn.className = 'fifs-install';
    btn.addEventListener('click', onClick); foot.appendChild(btn);
  }
  btn.textContent = offer === 'ios' ? '📲 Add to Home Screen' : '📲 Install the app';
  btn.dataset.offer = offer;
}
async function onClick(): Promise<void> {
  if (deferred) {
    const p = deferred; deferred = null;
    try { await p.prompt(); await p.userChoice; } catch { /* the person closed it or the browser refused */ }
    render(); return;
  }
  const existing = document.getElementById('fifs-install-help'); if (existing) { existing.remove(); return; }
  const help = document.createElement('div'); help.id = 'fifs-install-help'; help.className = 'fifs-install-help'; help.setAttribute('role', 'dialog'); help.setAttribute('aria-label', 'How to add the app to your home screen');
  const h = document.createElement('strong'); h.textContent = '📲 Add FIFS to your home screen'; const ol = document.createElement('ol');
  for (const s of IOS_STEPS) { const li = document.createElement('li'); li.textContent = s; ol.appendChild(li); }
  const close = document.createElement('button'); close.type = 'button'; close.textContent = 'Got it'; close.addEventListener('click', () => help.remove());
  help.append(h, ol, close); document.getElementById('fifs-foot')?.appendChild(help); close.focus();
  help.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Escape') help.remove(); });
}

export function installInstallPrompt(): void {
  if (w.__fifsInstallPrompt || typeof window === 'undefined') return; w.__fifsInstallPrompt = true;
  window.addEventListener('beforeinstallprompt', (e: Event) => { e.preventDefault(); deferred = e; render(); });
  window.addEventListener('appinstalled', () => { deferred = null; render(); });
  render(); setTimeout(render, 1500); // the footer is drawn just before this runs; a second look covers a slow start
}
