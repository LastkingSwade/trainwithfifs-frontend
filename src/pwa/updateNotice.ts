// "A new version is ready". The service worker waits until every tab of the site is closed before it takes over, so an old and a new copy never mix mid-visit. In an installed app that
// can mean days, so when a new version is waiting this shows a small notice; the person chooses when to reload (nothing reloads by itself, so a half-filled form is never lost).
export function shouldOffer(hasController: boolean, state: string): boolean { return hasController && (state === 'installed' || state === 'waiting'); }
/** At most one check for a new version every 30 minutes while the app is in use. */
export const CHECK_EVERY_MS = 30 * 60 * 1000;
export function dueForCheck(lastCheck: number, now: number): boolean { return !Number.isFinite(lastCheck) || now - lastCheck >= CHECK_EVERY_MS; }

let shown = false;
export function showUpdateNotice(worker: { postMessage: (m: unknown) => void }): void {
  if (shown || typeof document === 'undefined') return; shown = true;
  const bar = document.createElement('div'); bar.id = 'fifs-update'; bar.className = 'fifs-update'; bar.setAttribute('role', 'status');
  const msg = document.createElement('span'); msg.textContent = '🔄 A new version of the app is ready.';
  const go = document.createElement('button'); go.type = 'button'; go.className = 'fifs-update-go'; go.textContent = 'Reload now';
  const later = document.createElement('button'); later.type = 'button'; later.className = 'fifs-update-later'; later.textContent = 'Later';
  go.addEventListener('click', () => {
    go.disabled = true; go.textContent = 'Updating…';
    navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
    worker.postMessage({ type: 'SKIP_WAITING' });
  });
  later.addEventListener('click', () => bar.remove());
  bar.append(msg, go, later); document.body.appendChild(bar);
}
