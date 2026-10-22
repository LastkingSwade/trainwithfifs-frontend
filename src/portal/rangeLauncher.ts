// A prominent card in the Student and Client dashboards that opens the Range Journal. Text only (textContent). It lives inside each signed-in dashboard, so it only shows after sign-in.
export function installRangeLauncher(): void {
  if (typeof document === 'undefined') return;
  document.querySelectorAll<HTMLElement>('[data-range-journal-launch]').forEach((host) => {
    if (host.childElementCount) return;
    const box = document.createElement('div'); box.className = 'pcard rj-launch'; box.setAttribute('data-organic', 'skip');
    const ico = document.createElement('span'); ico.className = 'rj-launch-ico'; ico.setAttribute('aria-hidden', 'true'); ico.textContent = '📓';
    const text = document.createElement('div'); text.className = 'rj-launch-text';
    const h = document.createElement('h3'); h.textContent = 'Your Range Journal'; text.appendChild(h);
    const p = document.createElement('p'); p.textContent = 'Log your range days, watch your rounds and goals add up, and keep your own training record. Private to you: staff cannot see it.'; text.appendChild(p);
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pbtn rj-launch-btn'; b.textContent = 'Open my journal  →';
    b.addEventListener('click', () => (window as any).openRangeJournal?.());
    box.append(ico, text, b); host.appendChild(box);
  });
}
