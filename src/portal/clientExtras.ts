// Client Portal extras, drawn into #fi-client-extras once the signed-in client dashboard is showing. Text only (textContent).
import { buildRenewalIcs, daysLeft, parseExpiry, renewalStage } from './ics';
import type { Stage } from './ics';

const w: any = typeof window === 'undefined' ? {} : window;
function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, cls?: string): HTMLElementTagNameMap[K] { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; }

export const STAGE_TEXT: Record<Stage, string> = {
  plenty: 'You have time. Renewal classes are best booked about 120 days before your permit expires.',
  window: 'Book your 8-hour renewal class now. The State Police can take up to 90 days to process an application, so apply early.',
  inside: 'Your permit expires in under 90 days, and processing can take that long. Book your renewal class this week and apply as soon as you can.',
  expired: 'The date on your permit has passed. Check the official MSP page for what applies to you, and call us at 443-990-1304 so we can point you to the right class.',
};
export const CHECKLIST = ['An 8-hour refresher class', 'A 25-round live-fire qualification (70% or better to pass)', 'Your signed MSP 29-14 score sheet, which we give you after the range'] as const;
const OFFICIAL = 'https://mdsp.maryland.gov/firearms-permits-professional-licenses/wear-carry-permit';

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function renewalCard(expiryText: string): HTMLElement {
  const box = el('details', undefined, 'pcard') as HTMLDetailsElement; box.open = true;
  box.appendChild(el('summary', 'Permit renewal countdown'));
  const body = el('div', undefined, 'pcard-body'); box.appendChild(body);
  const expiry = parseExpiry(expiryText);
  if (!expiry) { body.appendChild(el('p', 'Add your permit expiration date in your profile and your countdown and reminders will appear here.')); return box; }
  const d = daysLeft(expiry);
  const stage = renewalStage(d);
  body.appendChild(el('p', d >= 0 ? `${d} day${d === 1 ? '' : 's'} until your permit expires.` : `Your permit date passed ${-d} day${d === -1 ? '' : 's'} ago.`, 'pcard-strong'));
  body.appendChild(el('p', STAGE_TEXT[stage]));
  body.appendChild(el('h4', 'What a renewal takes'));
  const ul = el('ul'); for (const c of CHECKLIST) ul.appendChild(el('li', c)); body.appendChild(ul);
  const row = el('div', undefined, 'prow');
  const book = el('button', 'Book my 8-hour renewal', 'pbtn'); book.type = 'button';
  book.addEventListener('click', () => { if (typeof w.selectCourse === 'function') w.selectCourse('Maryland Wear & Carry (8-Hour Renewal) — Base Track ($149.99)'); else w.openAndSwitch?.('booking'); });
  row.appendChild(book);
  if (d >= 0) { const ics = el('button', 'Add reminders to my calendar', 'pbtn'); ics.type = 'button'; ics.addEventListener('click', () => download('permit-renewal-reminders.ics', buildRenewalIcs(expiry))); row.appendChild(ics); }
  body.appendChild(row);
  body.appendChild(el('p', 'Informational only, not legal advice. Confirm the current steps on the official page.', 'pcard-note'));
  const a = el('a', 'MSP: Wear & Carry Permit (opens the official page)'); a.href = OFFICIAL; a.target = '_blank'; a.rel = 'noopener noreferrer'; body.appendChild(a);
  return box;
}

export function installClientExtras(): void {
  if (w.__fifsClientExtrasInstalled) return;
  w.__fifsClientExtrasInstalled = true;
  const paint = () => {
    const dash = document.getElementById('client-active-dashboard'); const host = document.getElementById('fi-client-extras');
    if (!dash || !host || dash.classList.contains('hidden') || getComputedStyle(dash).display === 'none') return;
    const badge = document.getElementById('dash-client-exp-badge')?.textContent || '';
    const exp = /Expiration:\s*(.+)$/i.exec(badge.trim())?.[1] || '';
    host.textContent = '';
    host.appendChild(renewalCard(exp));
    host.hidden = false;
  };
  const dash = document.getElementById('client-active-dashboard');
  if (dash) new MutationObserver(paint).observe(dash, { attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
  const badge = document.getElementById('dash-client-exp-badge');
  if (badge) new MutationObserver(paint).observe(badge, { childList: true, characterData: true, subtree: true });
  paint();
}
