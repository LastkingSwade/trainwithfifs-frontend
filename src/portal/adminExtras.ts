// Admin Hub extras: search boxes for the roster and client tables, keyboard shortcuts, and plain empty states.
// Everything is additive: the tables and tabs are the existing ones; this only filters what is already drawn and calls the existing tab switcher.
const w: any = typeof window === 'undefined' ? {} : window;

export const SHORTCUTS: ReadonlyArray<readonly [string, string]> = [
  ['g then r', 'Student roster'], ['g then c', 'Clients'], ['g then m', 'Messages (live chat)'], ['g then t', 'Telemetry'],
  ['/', 'Search the open table'], ['?', 'Show or hide this list'], ['Esc', 'Close this list'],
];
const TABS: Record<string, string> = { r: 'roster', c: 'clients', m: 'chat', t: 'telemetry' };

/** True when a keypress should be treated as a shortcut: not while typing, and not with a modifier held. */
export function isShortcutTarget(el: { tagName?: string; isContentEditable?: boolean } | null, e: { ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean }): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey) return false;
  const tag = String(el?.tagName || '').toUpperCase();
  return !(tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el?.isContentEditable);
}

/** Case-insensitive match of a row's text against a query typed by staff. Empty query matches everything. */
export function rowMatches(rowText: string, query: string): boolean {
  const q = String(query || '').trim().toLowerCase();
  return !q || String(rowText || '').toLowerCase().includes(q);
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, cls?: string): HTMLElementTagNameMap[K] { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; }

function addFilter(tbodyId: string, searchId: string, label: string, emptyText: string) {
  const tbody = document.getElementById(tbodyId); const table = tbody?.closest('table'); const wrap = table?.parentElement;
  if (!tbody || !wrap || document.getElementById(searchId)) return;
  const bar = el('div', undefined, 'admin-filter');
  const input = el('input'); input.type = 'search'; input.id = searchId; input.placeholder = label; input.setAttribute('aria-label', label); input.autocomplete = 'off';
  const count = el('span', '', 'admin-filter-count'); count.setAttribute('role', 'status');
  bar.append(input, count);
  wrap.parentElement?.insertBefore(bar, wrap);
  const apply = () => {
    const rows = Array.from(tbody.querySelectorAll<HTMLTableRowElement>('tr:not(.admin-empty-row)')).filter((r) => r.cells.length > 1);
    let shown = 0;
    for (const r of rows) { const m = rowMatches(r.textContent || '', input.value); r.hidden = !m; if (m) shown += 1; }
    tbody.querySelector('.admin-empty-row')?.remove();
    if (rows.length === 0 || shown === 0) {
      const tr = el('tr', undefined, 'admin-empty-row'); const td = el('td', rows.length === 0 ? emptyText : 'No match. Try a different name, email or course.'); td.colSpan = 12; td.style.padding = '18px'; td.style.textAlign = 'center'; td.style.color = 'var(--text-muted)'; tr.appendChild(td); tbody.appendChild(tr);
    }
    count.textContent = rows.length ? `Showing ${shown} of ${rows.length}` : '';
  };
  input.addEventListener('input', apply);
  new MutationObserver((muts) => { if (muts.some((m) => !(m.target as HTMLElement).classList?.contains('admin-empty-row') && Array.from(m.addedNodes).some((n) => !(n as HTMLElement).classList?.contains('admin-empty-row')))) apply(); }).observe(tbody, { childList: true });
  apply();
}

function helpOverlay(): HTMLElement {
  let box = document.getElementById('admin-shortcuts-help');
  if (box) return box;
  box = el('div', undefined, 'admin-help'); box.id = 'admin-shortcuts-help'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Keyboard shortcuts'); box.hidden = true;
  box.appendChild(el('h3', 'Keyboard shortcuts'));
  const dl = el('dl'); for (const [k, v] of SHORTCUTS) { dl.appendChild(el('dt', k)); dl.appendChild(el('dd', v)); } box.appendChild(dl);
  document.body.appendChild(box);
  return box;
}

export function installAdminExtras(): void {
  if (w.__fifsAdminExtrasInstalled) return;
  w.__fifsAdminExtrasInstalled = true;
  addFilter('admin-roster-tbody', 'admin-roster-search', 'Search students by name, email, ID or course', 'No students yet. New bookings and invites will appear here.');
  addFilter('admin-client-tbody', 'admin-client-search', 'Search clients by name, email or permit', 'No clients yet. Registered clients will appear here.');
  let pendingG = 0;
  document.addEventListener('keydown', (e) => {
    const help = document.getElementById('admin-shortcuts-help');
    if (e.key === 'Escape' && help && !help.hidden) { help.hidden = true; return; }
    const dash = document.getElementById('admin-command-dashboard');
    if (!dash || dash.classList.contains('hidden') || getComputedStyle(dash).display === 'none') return;
    if (!isShortcutTarget(e.target as HTMLElement, e)) return;
    if (e.key === '?') { e.preventDefault(); const h = helpOverlay(); h.hidden = !h.hidden; return; }
    if (e.key === '/') {
      const open = ['admin-roster-search', 'admin-client-search'].map((id) => document.getElementById(id)).find((i) => i && i.offsetParent !== null) as HTMLInputElement | undefined;
      if (open) { e.preventDefault(); open.focus(); }
      return;
    }
    if (pendingG && Date.now() - pendingG < 1500 && TABS[e.key.toLowerCase()]) { pendingG = 0; e.preventDefault(); w.switchAdminTab?.(TABS[e.key.toLowerCase()]); return; }
    pendingG = e.key.toLowerCase() === 'g' ? Date.now() : 0;
  });
  // A small hint next to the header buttons.
  const hdr = document.getElementById('btn-admin-refresh-data');
  if (hdr && !document.getElementById('admin-shortcut-hint')) { const h = el('span', 'Press ? for shortcuts', 'admin-hint'); h.id = 'admin-shortcut-hint'; hdr.parentElement?.appendChild(h); }
}
