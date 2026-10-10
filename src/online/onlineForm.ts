// Browser side of the Live Online Classroom option on the booking form. It never decides anything: the server re-checks every rule and
// computes the price. This file shows the 💻 switch next to the 👑 for classes that can be taken online, fills in the price lines with the
// SAME pricing function the server uses, adds the delivery choice to the booking request, and marks web days and in-person days on the
// booking calendar. Online bookings use the calendar like in-person ones: Day 1 = live online classroom, Day 2 = in-person range day.
import { calculatePricingBreakdown, courseKeyFor, onlineEligible, parseAttendeeCount, remoteFeePerPerson } from '@/Lib/pricing';

type Mode = 'online' | 'in_person';
interface State { on: boolean; ack: boolean; course: string; modes: Record<string, Mode>; modesAt: number }

const $ = (id: string) => document.getElementById(id);
const money = (n: number) => '$' + n.toFixed(2);
const todayET = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
const plusDays = (iso: string, n: number) => new Date(Date.parse(iso + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10);

export function installOnlineForm(): void {
  const w = window as any;
  if (w.__fifsOnlineInstalled) return;
  w.__fifsOnlineInstalled = true;
  const state: State = { on: false, ack: false, course: '', modes: {}, modesAt: 0 };
  w.__fifsOnline = state;

  // The review step replaces the form, so the last course seen on the form is remembered for the request that follows it.
  const courseValue = () => { const v = ($('courseSelection') as HTMLSelectElement | null)?.value; if (v) state.course = v; return state.course; };
  const available = () => onlineEligible(courseValue());
  const attendees = () => parseAttendeeCount(($('groupSize') as HTMLSelectElement | null)?.value) || 1;

  const decorate = () => {
    const grid = $('bookingCalDaysGrid');
    if (!grid) return;
    grid.querySelectorAll<HTMLElement>('[data-date]').forEach((cell) => {
      const mode = state.modes[cell.getAttribute('data-date') || ''];
      cell.querySelector('.fifs-day-mode')?.remove();
      cell.removeAttribute('data-fifs-locked');
      if (!mode) return;
      const locked = !state.on && mode === 'online';          // an in-person booking cannot use a web day
      const tag = document.createElement('span');
      tag.className = 'fifs-day-mode';
      tag.textContent = mode === 'online' ? '💻' : '🏫';
      tag.title = mode === 'online' ? 'Live online classroom day (web day).' + (locked ? ' In-person bookings are not taken on this day.' : '') : 'In-person day. For a live online booking, use it as Day 2 (the range day).';
      tag.style.cssText = 'font-size:0.6rem;line-height:1;margin-top:1px;';
      cell.appendChild(tag);
      if (locked) { cell.setAttribute('data-fifs-locked', '1'); cell.style.opacity = '0.5'; cell.style.cursor = 'not-allowed'; }
    });
    // A short explanation under the calendar, added once.
    const card = grid.closest('.booking-calendar-card')?.parentElement;
    if (card && !$('fifsDayModeNote')) {
      const note = document.createElement('p');
      note.id = 'fifsDayModeNote';
      note.style.cssText = 'font-size:0.74rem;color:var(--text-muted);margin:8px 0 0;line-height:1.4;';
      note.textContent = 'Each class day is either an in-person day (🏫) or a live online web day (💻), set by the first booking for that day. A web day cannot take in-person bookings, and an in-person day cannot be a web classroom day.';
      card.appendChild(note);
    }
  };

  const render = () => {
    const box = $('formBoxOnline'), fields = $('formOnlineFields'), badge = $('formOnlineBadge');
    const can = available();
    if (!can) state.on = false;
    if (box) { box.hidden = !can; box.setAttribute('aria-checked', String(state.on)); box.style.borderColor = state.on ? 'var(--accent-cyan)' : 'var(--border-subtle)'; box.style.background = state.on ? 'rgba(0, 229, 255, 0.08)' : '#070b10'; }
    if (badge) { badge.textContent = state.on ? 'ON' : 'OFF'; badge.style.color = state.on ? 'var(--accent-cyan)' : 'var(--text-muted)'; }
    if (fields) fields.hidden = !state.on;
    const ack = $('onlineDay2Ack') as HTMLInputElement | null; if (ack) ack.checked = state.ack;
    applyPrices();
    decorate();
  };

  // Overwrites the price lines with the server's own function. Runs after the page's own price code, so it only ever adds the fee.
  const applyPrices = () => {
    const row = $('formBreakdownRemoteRow');
    if (!state.on || !available()) { if (row) row.style.display = 'none'; return; }
    const sel = courseValue();
    const p = calculatePricingBreakdown(sel, attendees(), false, 'live_online');
    const set = (id: string, text: string) => { const e = $(id); if (e) e.textContent = text; };
    set('formBreakdownTuition', money(p.discountedTuition));
    set('formBreakdownRemote', '+' + money(p.remoteFee));
    if (row) row.style.display = 'flex';
    set('formBreakdownTax', '+' + money(p.mdTax));
    set('formBreakdownTotal', money(p.grandTotal));
    set('formBreakdownDeposit', money(p.depositDueNow));
    set('formBreakdownBalance', money(p.balanceDueClass));
    // Per-person price shown on the card and the two track boxes: tuition plus the remote-delivery fee.
    const base = calculatePricingBreakdown(sel.replace(/VIP/gi, ''), 1, false, 'in_person').baseTuitionPerPerson;
    const vip = calculatePricingBreakdown(sel.replace(/VIP/gi, '') + ' VIP', 1, false, 'in_person').baseTuitionPerPerson;
    set('formPriceBaseVal', money(base + remoteFeePerPerson(base)));
    set('formPriceVipVal', money(vip + remoteFeePerPerson(vip)));
    set('formCardActivePrice', money((p.isVip ? vip : base) + remoteFeePerPerson(p.isVip ? vip : base)));
  };

  // Which days are web days or in-person days. Refreshed when the form is used (at most once a minute).
  const loadModes = () => {
    if (Date.now() - state.modesAt < 60000) return;
    state.modesAt = Date.now();
    const from = todayET();
    fetch('/api/fifs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'dayModes', from, to: plusDays(from, 400) }) })
      .then((r) => r.json()).then((d) => { if (d && d.success && d.modes) { state.modes = d.modes; decorate(); } }).catch(() => { /* the calendar just shows no day marks */ });
  };

  const origUpdate = w.updateFormPriceDisplay;
  const refreshCalendar = () => { if (typeof origUpdate === 'function') origUpdate.call(w); render(); };
  w.toggleFormOnline = () => {
    if (!available()) return;
    state.on = !state.on;
    const status = $('formOnlineStatus'); if (status) status.textContent = '';
    refreshCalendar();   // the calendar switches between one-date and two-date (Day 1 / Day 2) mode
  };
  document.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement | null;
    if (t && t.id === 'formBoxOnline' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); w.toggleFormOnline(); }
  });
  document.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement | null;
    if (!t) return;
    if (t.id === 'onlineDay2Ack') state.ack = t.checked;
    else if (t.id === 'groupSize' || t.id === 'courseSelection') window.setTimeout(render, 0);
  });
  // A day marked as the wrong kind cannot be picked by an in-person booking (the server enforces this too).
  document.addEventListener('click', (e) => {
    const cell = (e.target as HTMLElement | null)?.closest?.('#bookingCalDaysGrid [data-fifs-locked]');
    if (cell) { e.stopImmediatePropagation(); e.preventDefault(); const st = $('formOnlineStatus'); if (st) st.textContent = ''; }
  }, true);
  new MutationObserver(() => decorate()).observe(document.body, { childList: true, subtree: true, attributeFilter: ['data-date'] });

  // Run our part after the page's own price display, whichever copy of it is live.
  w.updateFormPriceDisplay = function (...args: unknown[]) { const r = typeof origUpdate === 'function' ? origUpdate.apply(this, args) : undefined; loadModes(); render(); return r; };

  // The review step reads this: it must carry the fee so the totals match what the server will charge.
  const origCalc = w.calculateComprehensiveInvoice;
  w.calculateComprehensiveInvoice = function (baseTuition: number, isVip: boolean, groupSizeStr?: string) {
    const out = typeof origCalc === 'function' ? origCalc.apply(this, arguments) : {};
    if (!state.on || !available()) return out;
    const p = calculatePricingBreakdown(courseValue(), parseAttendeeCount(groupSizeStr || '1') || 1, false, 'live_online');
    return { ...out, remoteFee: p.remoteFee, subtotal: p.discountedTuition + p.remoteFee + p.rangeFee, mdTax: p.mdTax, grandTotal: p.grandTotal, total: p.grandTotal, depositDueNow: p.depositDueNow, balanceDueClass: p.balanceDueClass };
  };

  // The booking request carries the delivery choice (the calendar days ride along from the booking code itself).
  const origFetch = window.fetch.bind(window);
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    try {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
      if (state.on && available() && init && typeof init.body === 'string' && /\/api\/(checkout|fifs)(\?|$)/.test(url)) {
        const body = JSON.parse(init.body);
        if (body && (url.includes('/api/checkout') || body.action === 'submitBooking')) init = { ...init, body: JSON.stringify({ ...body, delivery: 'live_online', day2Ack: state.ack }) };
      }
    } catch { /* leave the request as it is */ }
    return origFetch(input, init);
  } as typeof window.fetch;

  // The booking button opens the review step; online needs the Day 2 acknowledgement first (the two calendar days are checked by the booking code).
  const origReview = w.showBookingInvoiceModal;
  w.showBookingInvoiceModal = function (...args: unknown[]) {
    if (state.on && available() && !state.ack) {
      const status = $('formOnlineStatus');
      if (status) status.textContent = 'Please confirm that Day 2 is mandatory, in person, at the range.';
      ($('formOnlineFields') as HTMLElement | null)?.scrollIntoView?.({ block: 'center' });
      return false;
    }
    return typeof origReview === 'function' ? origReview.apply(this, args) : undefined;
  };

  // A class card badge for every class that can be taken online.
  for (const key of ['mastery', 'combo', 'ccw', 'renewal', 'hql']) {
    const card = $('card-course-' + key);
    if (!card || card.querySelector('.online-badge')) continue;
    const badge = document.createElement('div');
    badge.className = 'online-badge';
    badge.textContent = '💻 Live online classroom available. Day 2 range day is always in person.';
    const title = card.querySelector('.tuition-title');
    if (title && title.parentNode) title.parentNode.insertBefore(badge, title.nextSibling); else card.appendChild(badge);
  }
  loadModes();
}
