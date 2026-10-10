// Student Portal extras, drawn into #dash-extras once the signed-in dashboard is showing. All text is set with textContent (no HTML from data).
import { BRING, EXPECT, GUIDE_DISCLAIMER, GUIDE_ITEMS, MAPS_URL, RANGE_CITY, RANGE_NAME } from './portalCopy';

// window only exists in the browser; this module is also loaded while the page is rendered on the server.
const w: any = typeof window === 'undefined' ? {} : window;
function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, cls?: string): HTMLElementTagNameMap[K] { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; }
function card(title: string, open?: boolean): { box: HTMLDetailsElement; body: HTMLElement } {
  const box = el('details', undefined, 'pcard') as HTMLDetailsElement; box.open = !!open;
  box.appendChild(el('summary', title));
  const body = el('div', undefined, 'pcard-body'); box.appendChild(body);
  return { box, body };
}
function list(items: readonly string[]): HTMLElement { const ul = el('ul'); for (const i of items) ul.appendChild(el('li', i)); return ul; }
const when = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const money = (n: number) => '$' + n.toFixed(2);

// Whole days from today to the class date (null if the date is not something we can read).
export function daysUntil(text: string, now: Date = new Date()): number | null {
  const t = Date.parse(String(text || '').replace(/\s+at\s+.*$/i, ''));
  if (!Number.isFinite(t)) return null;
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(), b = new Date(new Date(t).getFullYear(), new Date(t).getMonth(), new Date(t).getDate()).getTime();
  return Math.round((b - a) / 86400000);
}
export function countdownText(days: number | null): string {
  if (days === null) return '';
  if (days > 1) return `Your class is in ${days} days.`;
  if (days === 1) return 'Your class is tomorrow.';
  if (days === 0) return 'Your class is today.';
  return '';
}

function classDayCard(): HTMLElement {
  const dateText = document.getElementById('dash-student-date')?.textContent?.trim() || '';
  const { box, body } = card('Class day: what to bring and what to expect', true);
  const cd = countdownText(daysUntil(dateText));
  if (cd) body.appendChild(el('p', cd, 'pcard-strong'));
  body.appendChild(el('h4', 'Bring'));
  body.appendChild(list(BRING));
  body.appendChild(el('h4', 'What to expect'));
  body.appendChild(list(EXPECT));
  const a = el('a', `Directions to ${RANGE_NAME}, ${RANGE_CITY}`, 'pbtn'); a.href = MAPS_URL; a.target = '_blank'; a.rel = 'noopener noreferrer';
  body.appendChild(a);
  return box;
}

function rebookCard(): HTMLElement {
  const { box, body } = card('Book again or renew');
  body.appendChild(el('p', 'Need another class, or a permit coming up for renewal? Start here and your next booking takes a minute.'));
  const row = el('div', undefined, 'prow');
  const mk = (label: string, fn: () => void) => { const b = el('button', label, 'pbtn'); b.type = 'button'; b.addEventListener('click', fn); row.appendChild(b); };
  mk('Book another class', () => w.openAndSwitch?.('booking'));
  mk('Renew my Wear and Carry (8-hour)', () => { if (typeof w.selectCourse === 'function') w.selectCourse('Maryland Wear & Carry (8-Hour Renewal) — Base Track ($149.99)'); else w.openAndSwitch?.('booking'); });
  body.appendChild(row);
  return box;
}

function guideCard(): HTMLElement {
  const { box, body } = card('Maryland requirements guide');
  body.appendChild(el('p', GUIDE_DISCLAIMER, 'pcard-note'));
  for (const g of GUIDE_ITEMS) {
    body.appendChild(el('h4', g.title)); body.appendChild(el('p', g.body));
    const a = el('a', g.link + ' (opens the official page)'); a.href = g.href; a.target = '_blank'; a.rel = 'noopener noreferrer'; body.appendChild(a);
  }
  return box;
}

interface Receipt { invoiceNumber: string; course: string; status: string; total: number; paid: number; balance: number; date: string }
function receiptsCard(rows: Receipt[] | null): HTMLElement {
  const { box, body } = card('Receipts and payments');
  if (rows === null) body.appendChild(el('p', 'Your receipts could not load right now. Please try again in a minute.'));
  else if (rows.length === 0) body.appendChild(el('p', 'No payments yet. When you book and pay, your receipt will show up here.'));
  else for (const r of rows) {
    const line = el('div', undefined, 'preceipt');
    line.appendChild(el('strong', `${r.course} (${r.invoiceNumber})`));
    line.appendChild(el('span', `${when(r.date)} · ${r.status} · paid ${money(r.paid)} of ${money(r.total)}${r.balance > 0 ? ` · ${money(r.balance)} due on class day` : ''}`));
    body.appendChild(line);
  }
  return box;
}

export function installStudentExtras(): void {
  if (w.__fifsStudentExtrasInstalled) return;
  w.__fifsStudentExtrasInstalled = true;
  let busy = false;
  const paint = async () => {
    const dash = document.getElementById('student-active-dashboard'); const host = document.getElementById('dash-extras');
    if (!dash || !host || busy || dash.classList.contains('hidden') || dash.hidden || getComputedStyle(dash).display === 'none') return;
    busy = true;
    let receipts: Receipt[] | null = null;
    try { const d = await w.callFifsBackend('studentInvoices', {}); receipts = (d && d.invoices) || []; } catch { receipts = null; }
    host.textContent = '';
    host.appendChild(classDayCard());
    host.appendChild(rebookCard());
    host.appendChild(receiptsCard(receipts));
    host.appendChild(guideCard());
    host.hidden = false;
    busy = false;
  };
  const dash = document.getElementById('student-active-dashboard');
  if (dash) new MutationObserver(paint).observe(dash, { attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
  paint();
}
