// Admin hub: the "Needs attention" panel. It asks the server (staff only) what needs a person next and draws it at the top of the hub.
// Read only: nothing here changes any record. All text is set with textContent (names and notes come from stored data).
const w: any = typeof window === 'undefined' ? {} : window;

export type Tone = 'urgent' | 'soon' | 'info';
export interface Item { ref: string; title: string; detail: string; tone: Tone }
export interface Group { key: string; title: string; hint: string; action: 'chat' | 'payments' | 'roster' | 'clients'; count: number; items: Item[] }
export interface Attention { generatedAt: string; total: number; groups: Group[]; unavailable: string[] }

const TAB_FOR: Record<string, string> = { chat: 'chat', roster: 'roster', clients: 'clients' };
const SEARCH_FOR: Record<string, string> = { roster: 'admin-roster-search', clients: 'admin-client-search' };
const NAME_FOR: Record<string, string> = { chats: 'chats', balance: 'balances', unpaid: 'bookings', scoresheets: 'score sheets', renewals: 'permits', confirm: 'new students' };

export const headline = (total: number) => (total === 0 ? 'All clear' : total === 1 ? '1 thing needs you' : `${total} things need you`);
export const worstTone = (items: readonly Item[]): Tone => (items.some((i) => i.tone === 'urgent') ? 'urgent' : items.some((i) => i.tone === 'soon') ? 'soon' : 'info');
// The chat card is one summary line standing for several conversations, so it never says "more not shown".
export const moreText = (g: Pick<Group, 'count' | 'items' | 'action'>) => (g.action !== 'chat' && g.count > g.items.length ? `+${g.count - g.items.length} more` : '');
const isAttention = (d: any): d is Attention => !!d && Array.isArray(d.groups) && typeof d.total === 'number';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, cls?: string): HTMLElementTagNameMap[K] { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; }

// Takes the admin to the right place. For people and clients it also fills that tab's search box with the reference, so the one row is shown.
export function openFor(action: Group['action'], ref: string): void {
  if (action === 'payments') { if (typeof w.openAdminPayments === 'function') w.openAdminPayments(); return; }
  const tab = TAB_FOR[action]; if (tab && typeof w.switchAdminTab === 'function') w.switchAdminTab(tab);
  const box = SEARCH_FOR[action];
  if (box && ref) setTimeout(() => { const i = document.getElementById(box) as HTMLInputElement | null; if (i) { i.value = ref; i.dispatchEvent(new Event('input', { bubbles: true })); try { i.focus(); } catch { /* ignore */ } } }, 60);
}

export function paint(host: HTMLElement, data: Attention, stamp: string, onRefresh: () => void): void {
  host.textContent = '';
  const head = el('div', undefined, 'an-head');
  const tt = el('div'); tt.append(el('h3', 'Needs attention', 'an-title'), el('p', headline(data.total) + (stamp ? ' · updated ' + stamp : ''), 'an-sub'));
  const rf = el('button', 'Refresh', 'an-refresh'); rf.type = 'button'; rf.setAttribute('aria-label', 'Refresh the needs attention list'); rf.addEventListener('click', onRefresh);
  head.append(tt, rf); host.appendChild(head);
  if (data.groups.length === 0) { const ok = el('p', 'Nothing needs you right now. New bookings, balances and renewals will show up here.', 'an-clear'); ok.setAttribute('role', 'status'); host.appendChild(ok); }
  const list = el('div', undefined, 'an-groups');
  for (const g of data.groups) {
    const d = el('details', undefined, 'an-group an-' + worstTone(g.items)); d.open = worstTone(g.items) === 'urgent';
    const s = el('summary', undefined, 'an-summary'); s.append(el('span', String(g.count), 'an-count'), el('span', g.title, 'an-gtitle'), el('span', g.hint, 'an-hint')); d.appendChild(s);
    const ul = el('ul', undefined, 'an-items');
    for (const it of g.items) {
      const li = el('li', undefined, 'an-item an-' + it.tone); const tx = el('div', undefined, 'an-text'); tx.append(el('strong', it.title), el('span', it.detail));
      const b = el('button', 'Open', 'an-open'); b.type = 'button'; b.setAttribute('aria-label', 'Open: ' + it.title); b.addEventListener('click', () => openFor(g.action, it.ref));
      li.append(tx, b); ul.appendChild(li);
    }
    const more = moreText(g);
    if (more) { const li = el('li', undefined, 'an-item an-more'); li.appendChild(el('span', more + ' ' + (NAME_FOR[g.key] || 'items') + ' not shown')); const b = el('button', g.action === 'payments' ? 'Open payments' : 'Open list', 'an-open'); b.type = 'button'; b.addEventListener('click', () => openFor(g.action, '')); li.appendChild(b); ul.appendChild(li); }
    d.appendChild(ul); list.appendChild(d);
  }
  host.appendChild(list);
  if (data.unavailable.length) { const n = el('p', 'Could not check: ' + Array.from(new Set(data.unavailable.map((k) => NAME_FOR[k] || k))).join(', ') + '. Try Refresh in a minute.', 'an-note'); n.setAttribute('role', 'status'); host.appendChild(n); }
}

function paintLoading(host: HTMLElement): void {
  host.textContent = ''; host.setAttribute('aria-busy', 'true');
  const head = el('div', undefined, 'an-head'); head.appendChild(el('h3', 'Needs attention', 'an-title')); host.appendChild(head);
  for (let i = 0; i < 3; i += 1) { const sk = el('div', undefined, 'an-skel'); sk.setAttribute('aria-hidden', 'true'); host.appendChild(sk); }
}
function paintError(host: HTMLElement, onRetry: () => void): void {
  host.textContent = ''; host.removeAttribute('aria-busy');
  const head = el('div', undefined, 'an-head'); head.appendChild(el('h3', 'Needs attention', 'an-title')); host.appendChild(head);
  const p = el('p', 'The list could not load right now. Nothing was changed.', 'an-note'); p.setAttribute('role', 'status'); host.appendChild(p);
  const b = el('button', 'Try again', 'an-refresh'); b.type = 'button'; b.addEventListener('click', onRetry); host.appendChild(b);
}

export function installAdminAttention(): void {
  if (w.__fifsAttentionInstalled) return;
  const host = document.getElementById('an-host'); const dash = document.getElementById('admin-command-dashboard');
  if (!host || !dash) return;
  w.__fifsAttentionInstalled = true;
  let busy = false, lastAt = 0;
  const shown = () => !dash.classList.contains('hidden') && !(dash as any).hidden && getComputedStyle(dash).display !== 'none';
  const load = async () => {
    if (busy) return; busy = true; paintLoading(host);
    try {
      const d = await w.callFifsBackend('adminNeedsAttention', {});
      const a = d && d.attention; if (!isAttention(a)) throw new Error('bad answer');
      host.removeAttribute('aria-busy'); lastAt = Date.now();
      paint(host, a, new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), () => void load());
    } catch { host.removeAttribute('aria-busy'); paintError(host, () => void load()); }
    busy = false;
  };
  new MutationObserver(() => { if (shown() && !busy && Date.now() - lastAt > 120000) void load(); }).observe(dash, { attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && shown() && !busy && Date.now() - lastAt > 300000) void load(); });
  if (shown()) void load();
}
