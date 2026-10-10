// Skeleton loading: gray shimmer rows in the Admin Hub tables while the list is being fetched, so the page never looks empty or frozen.
// Additive only: the rows are single-cell (so the search box ignores them), vanish the moment real rows arrive, and never stay longer than 10 seconds.
const w: any = typeof window === 'undefined' ? {} : window;
const MAX_MS = 10000;

export function skeletonRow(cols: number): HTMLTableRowElement {
  const tr = document.createElement('tr'); tr.className = 'fifs-skel-row'; tr.setAttribute('aria-hidden', 'true');
  const td = document.createElement('td'); td.colSpan = cols;
  const bar = document.createElement('div'); bar.className = 'fifs-skel'; td.appendChild(bar); tr.appendChild(td);
  return tr;
}
function showSkeleton(tbody: HTMLElement, cols: number) {
  if (tbody.querySelector('.fifs-skel-row')) return;
  for (let i = 0; i < 4; i += 1) tbody.appendChild(skeletonRow(cols));
  const stop = () => { obs.disconnect(); window.clearTimeout(timer); tbody.querySelectorAll('.fifs-skel-row').forEach((r) => r.remove()); };
  const obs = new MutationObserver((muts) => { if (muts.some((m) => Array.from(m.addedNodes).some((n) => !(n as HTMLElement).classList?.contains('fifs-skel-row') && !(n as HTMLElement).classList?.contains('admin-empty-row')))) stop(); });
  obs.observe(tbody, { childList: true });
  const timer = window.setTimeout(stop, MAX_MS);
}

export function installSkeletons(): void {
  if (w.__fifsSkeletonsInstalled) return;
  w.__fifsSkeletonsInstalled = true;
  const targets: Array<[string, number]> = [['admin-roster-tbody', 8], ['admin-client-tbody', 8]];
  const run = () => { for (const [id, cols] of targets) { const t = document.getElementById(id); if (t) showSkeleton(t, cols); } };
  // Whenever staff press Refresh, show the placeholders until the new rows land.
  document.addEventListener('click', (e) => { if ((e.target as HTMLElement | null)?.closest?.('#btn-admin-refresh-data')) run(); }, true);
  // First load of an empty table.
  for (const [id, cols] of targets) { const t = document.getElementById(id); if (t && !t.querySelector('tr')) showSkeleton(t, cols); }
}
