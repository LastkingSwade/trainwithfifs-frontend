// A small card in the Student and Client dashboards that opens the Range Journal. Text only (textContent). It lives inside each signed-in dashboard, so it only shows after sign-in.
export function installRangeLauncher(): void {
  if (typeof document === 'undefined') return;
  document.querySelectorAll<HTMLElement>('[data-range-journal-launch]').forEach((host) => {
    if (host.childElementCount) return;
    const box = document.createElement('div'); box.className = 'pcard';
    const h = document.createElement('h3'); h.textContent = '📓 Your Range Journal'; box.appendChild(h);
    const p = document.createElement('p'); p.textContent = 'Log your range days, watch your rounds and goals add up, and keep your own training record. Private to you: staff cannot see it.'; box.appendChild(p);
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pbtn'; b.textContent = 'Open my journal';
    b.addEventListener('click', () => (window as any).openRangeJournal?.());
    box.appendChild(b); host.appendChild(box);
  });
}
