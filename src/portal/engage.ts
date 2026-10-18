// Cards at the bottom of the Student and Client dashboards that give people a reason to come back and make it easy to get help. Text only (textContent).
import { REVIEW_URL, SHARE_TEXT, SHARE_TITLE, SITE, helpLinks, paymentNotices, readiness, shareLinks, showReadiness, tipOfTheWeek, wantsReview, type Which } from './engageLogic';

const w: any = typeof window === 'undefined' ? {} : window;
function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, cls?: string): HTMLElementTagNameMap[K] { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; }

export function card(emoji: string, title: string, intro: string): { box: HTMLElement; body: HTMLElement } {
  const box = el('section', undefined, 'eg-card'); box.setAttribute('aria-label', title);
  const h = el('h3'); const e = el('span', emoji, 'eg-emoji'); e.setAttribute('aria-hidden', 'true'); h.append(e, document.createTextNode(' ' + title)); box.appendChild(h);
  if (intro) box.appendChild(el('p', intro, 'eg-intro'));
  const body = el('div', undefined, 'eg-body'); box.appendChild(body); return { box, body };
}

function helpCard(which: Which): HTMLElement {
  const { box, body } = card('🙋', 'Need a hand? Coach Kai is a tap away', 'Questions about your class, your paperwork or your permit are always welcome. There is no wrong question.');
  const row = el('div', undefined, 'eg-actions');
  for (const l of helpLinks(which)) {
    if (l.action === 'chat') { const b = el('button', `${l.emoji} ${l.label}`, 'eg-btn'); b.type = 'button'; b.addEventListener('click', () => w.openContactWidgetModal?.()); row.appendChild(b); }
    else { const a = el('a', `${l.emoji} ${l.label}`, 'eg-btn'); a.href = l.href || '#'; if (l.external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; } row.appendChild(a); }
  }
  body.appendChild(row); return box;
}

function reviewCard(which: Which): HTMLElement | null {
  const rec = which === 'student' ? w.__fifsStudentPortalRecord : w.__fifsClientPortalRecord;
  if (!wantsReview(which, rec && (rec.trainingStatus || rec.status))) return null;
  const { box, body } = card('⭐', 'Enjoyed your training? Tell others', 'A short Google review helps other Marylanders find calm, patient, one-on-one instruction. It takes about a minute and means a lot to a small business.');
  const a = el('a', '⭐ Leave a Google review', 'eg-btn primary'); a.href = REVIEW_URL; a.target = '_blank'; a.rel = 'noopener noreferrer'; body.appendChild(a); return box;
}

function shareCard(): HTMLElement {
  const { box, body } = card('🤝', 'Know someone who should train too?', 'Send a friend or family member the link. You choose who gets it and you can change the message before you send it.');
  const row = el('div', undefined, 'eg-actions'); const links = shareLinks(); const live = el('div', undefined, 'eg-live'); live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite');
  if (typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function') { const b = el('button', '📤 Share…', 'eg-btn primary'); b.type = 'button'; b.addEventListener('click', async () => { try { await (navigator as any).share({ title: SHARE_TITLE, text: SHARE_TEXT, url: SITE }); } catch { /* cancelled */ } }); row.appendChild(b); }
  const sms = el('a', '💬 Text it', 'eg-btn'); sms.href = links.sms; const mail = el('a', '✉️ Email it', 'eg-btn'); mail.href = links.email;
  const copy = el('button', '📋 Copy the message', 'eg-btn'); copy.type = 'button'; copy.addEventListener('click', async () => { try { await navigator.clipboard.writeText(links.text); live.textContent = 'Copied. Paste it wherever you like.'; } catch { live.textContent = 'Could not copy. Select the text and copy it by hand.'; } });
  row.append(sms, mail, copy); body.append(row, live); return box;
}

function tipCard(): HTMLElement {
  const t = tipOfTheWeek(); const { box, body } = card('💡', 'Tip of the week', '');
  body.appendChild(el('p', t.tip, 'eg-tip')); body.appendChild(el('p', 'A new tip every Monday. General safety information, not legal advice.', 'eg-intro')); return box;
}

/** The student's own class-ready meter: four things that make class day smooth. Built from their record and what the browser reports; nothing is stored. */
async function readyCard(): Promise<HTMLElement | null> {
  const rec = w.__fifsStudentPortalRecord; if (!rec || !showReadiness(rec.trainingStatus || rec.status)) return null;
  let owed: number | null = null;
  try { const d = await w.callFifsBackend('studentInvoices', {}); const rows: any[] = (d && d.invoices) || []; if (rows.length) owed = rows.reduce((n, r) => n + (r.status === 'Deposit paid' ? Number(r.balance) || 0 : 0), 0); } catch { owed = null; }
  let installed = false; try { installed = !!(w.matchMedia && w.matchMedia('(display-mode: standalone)').matches) || w.navigator?.standalone === true; } catch { /* unknown */ }
  const r = readiness({ classDate: rec.assignedDate, prepTasks: rec.prepTasks, balanceOwed: owed, installed });
  const { box, body } = card('🎯', `Class-ready: ${r.done} of ${r.total}`, r.done === r.total ? 'You are all set for class day. See you at the range!' : 'A few quick things that make class day smooth.');
  const bar = el('div', undefined, 'eg-meter'); bar.setAttribute('role', 'progressbar'); bar.setAttribute('aria-valuemin', '0'); bar.setAttribute('aria-valuemax', String(r.total)); bar.setAttribute('aria-valuenow', String(r.done)); bar.setAttribute('aria-label', `${r.done} of ${r.total} class-ready items done`);
  const fill = el('i'); fill.style.width = Math.round((r.done / r.total) * 100) + '%'; bar.appendChild(fill); body.appendChild(bar);
  const ul = el('ul', undefined, 'eg-list'); for (const i of r.items) { const li = el('li', undefined, i.done ? 'done' : ''); li.appendChild(el('span', i.done ? '✅' : i.emoji)); li.appendChild(el('span', i.done ? i.label : `${i.label}. ${i.hint}`)); ul.appendChild(li); } body.appendChild(ul);
  if (!r.items.find((i) => i.key === 'date')!.done) { const b = el('button', '🗨️ Message Coach Kai about my date', 'eg-btn'); b.type = 'button'; b.addEventListener('click', () => w.openContactWidgetModal?.()); body.appendChild(b); }
  return box;
}

/** Shown at the top of the student dashboard for a week after Coach Kai records an in-person payment. Hiding it lasts until the page is reloaded (nothing is stored). */
async function noticeCard(): Promise<HTMLElement | null> {
  let rows: any[] | null = null; try { const d = await w.callFifsBackend('studentInvoices', {}); rows = (d && d.invoices) || []; } catch { rows = null; }
  const list = paymentNotices(rows); if (!list.length) return null;
  const box = el('section', undefined, 'eg-notice'); box.setAttribute('role', 'status'); box.setAttribute('aria-label', 'Payment received');
  const t = el('div', undefined, 'eg-notice-t'); for (const n of list) t.appendChild(el('p', n.text)); box.appendChild(t);
  const b = el('button', 'Got it', 'eg-btn'); b.type = 'button'; b.addEventListener('click', () => { const h = document.getElementById('eg-notice'); if (h) { h.textContent = ''; h.hidden = true; } }); box.appendChild(b); return box;
}

const HOSTS: Record<Which, { dash: string; host: string }> = { student: { dash: 'student-active-dashboard', host: 'eg-student' }, client: { dash: 'client-active-dashboard', host: 'eg-client' } };
const BUILDERS: Array<(which: Which) => HTMLElement | null> = [() => tipCard(), reviewCard, () => shareCard(), helpCard];

export function installEngagement(): void {
  if (w.__fifsEngageInstalled) return; w.__fifsEngageInstalled = true;
  for (const which of ['student', 'client'] as Which[]) {
    const ids = HOSTS[which]; let painted = false;
    const paint = () => {
      const d = document.getElementById(ids.dash), h = document.getElementById(ids.host); if (!d || !h) return;
      const visible = !d.classList.contains('hidden') && getComputedStyle(d).display !== 'none';
      if (!visible) { painted = false; return; } if (painted) return; painted = true;
      h.textContent = ''; for (const b of BUILDERS) { const c = b(which); if (c) h.appendChild(c); } h.hidden = false;
    };
    const d = document.getElementById(ids.dash); if (d) new MutationObserver(paint).observe(d, { attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
    paint();
  }
  const nd = document.getElementById('student-active-dashboard'); let ndone = false;
  const paintNotice = async () => { const h = document.getElementById('eg-notice'); if (!nd || !h) return; const vis = !nd.classList.contains('hidden') && getComputedStyle(nd).display !== 'none'; if (!vis) { ndone = false; return; } if (ndone) return; ndone = true; const c = await noticeCard(); h.textContent = ''; if (c) { h.appendChild(c); h.hidden = false; } else h.hidden = true; };
  if (nd) new MutationObserver(() => { void paintNotice(); }).observe(nd, { attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
  void paintNotice();
  // The class-ready meter sits near the top of the student dashboard.
  const rd = document.getElementById('student-active-dashboard'); let rdone = false;
  const paintReady = async () => { const h = document.getElementById('eg-ready'); if (!rd || !h) return; const vis = !rd.classList.contains('hidden') && getComputedStyle(rd).display !== 'none'; if (!vis) { rdone = false; return; } if (rdone) return; rdone = true; const c = await readyCard(); h.textContent = ''; if (c) { h.appendChild(c); h.hidden = false; } else h.hidden = true; };
  if (rd) new MutationObserver(() => { void paintReady(); }).observe(rd, { attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
  void paintReady();
}
