// Browser side of the Live Online Classroom option on the booking form. It never decides anything: the server re-checks every rule and
// computes the price. This file shows the 💻 switch next to the 👑 only when the server says the class can be taken online, fills in the
// price lines with the SAME pricing function the server uses, and adds the delivery fields to the booking request.
import { calculatePricingBreakdown, courseKeyFor, onlineEligible, parseAttendeeCount, remoteFeePerPerson } from '@/Lib/pricing';

interface Session { id: string; startsAt: string; seatsLeft: number | null }
interface Options { premiumRate: number; courses: Record<string, { classroom: Session[]; range: Session[] }> }
interface State { options: Options | null; on: boolean; classroomId: string; rangeId: string; ack: boolean; datesText: string; course: string }

const $ = (id: string) => document.getElementById(id);
const money = (n: number) => '$' + n.toFixed(2);

const fmt = (iso: string) => new Date(iso).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const opt = (s: Session) => `${fmt(s.startsAt)}${s.seatsLeft === null ? '' : s.seatsLeft > 0 ? ` (${s.seatsLeft} seat${s.seatsLeft === 1 ? '' : 's'} left)` : ' (full)'}`;

export function installOnlineForm(): void {
  const w = window as any;
  if (w.__fifsOnlineInstalled) return;
  w.__fifsOnlineInstalled = true;
  const state: State = { options: null, on: false, classroomId: '', rangeId: '', ack: false, datesText: '', course: '' };
  w.__fifsOnline = state;

  // The review step replaces the form, so the last course seen on the form is remembered for the request that follows it.
  const courseValue = () => { const v = ($('courseSelection') as HTMLSelectElement | null)?.value; if (v) state.course = v; return state.course; };
  const available = () => { const key = courseKeyFor(courseValue()); return !!(state.options && key && onlineEligible(courseValue()) && state.options.courses[key]); };
  const attendees = () => parseAttendeeCount(($('groupSize') as HTMLSelectElement | null)?.value) || 1;

  const fill = (sel: HTMLSelectElement, sessions: Session[], chosen: string, placeholder: string) => {
    const keep = chosen || sel.value;
    sel.innerHTML = '';
    const first = document.createElement('option'); first.value = ''; first.textContent = placeholder; sel.appendChild(first);
    for (const s of sessions) { const o = document.createElement('option'); o.value = s.id; o.textContent = opt(s); if (s.seatsLeft === 0) o.disabled = true; sel.appendChild(o); }
    sel.value = sessions.some((s) => s.id === keep) ? keep : '';
  };

  const render = () => {
    const box = $('formBoxOnline'), fields = $('formOnlineFields'), badge = $('formOnlineBadge');
    const can = available();
    if (!can) state.on = false;
    if (box) { box.hidden = !can; box.setAttribute('aria-checked', String(state.on)); box.style.borderColor = state.on ? 'var(--accent-cyan)' : 'var(--border-subtle)'; box.style.background = state.on ? 'rgba(0, 229, 255, 0.08)' : '#070b10'; }
    if (badge) { badge.textContent = state.on ? 'ON' : 'OFF'; badge.style.color = state.on ? 'var(--accent-cyan)' : 'var(--text-muted)'; }
    if (fields) fields.hidden = !state.on;
    // While online is on, the dates come from the two sessions below, so the in-person calendar is tucked away (and comes back when it is off).
    for (const sel of ['#bookingCalendarPolicyBanner', '#courseBookingModal .booking-calendar-card']) { const e = document.querySelector<HTMLElement>(sel); if (e) e.style.display = state.on ? 'none' : ''; }
    if (can && state.on) {
      const c = state.options!.courses[courseKeyFor(courseValue()) as string];
      const room = $('onlineClassroomSession') as HTMLSelectElement | null, range = $('onlineRangeSession') as HTMLSelectElement | null, ack = $('onlineDay2Ack') as HTMLInputElement | null;
      if (room) fill(room, c.classroom, state.classroomId, 'Choose a live classroom date');
      if (range) fill(range, c.range, state.rangeId, 'Choose your Day 2 range day (required)');
      if (ack) ack.checked = state.ack;
    }
    applyPrices();
  };

  // Overwrites the price lines with the server's own function. Runs after the page's own price code, so it only ever adds the fee.
  const applyPrices = () => {
    const row = $('formBreakdownRemoteRow');
    if (!state.on || !available()) { if (row) row.style.display = 'none'; return; }
    const sel = courseValue();
    const n = attendees();
    const p = calculatePricingBreakdown(sel, n, false, 'live_online');
    const set = (id: string, text: string) => { const e = $(id); if (e) { e.textContent = text; } };
    set('formBreakdownTuition', money(p.discountedTuition));
    set('formBreakdownRemote', '+' + money(p.remoteFee));
    if (row) row.style.display = 'flex';
    set('formBreakdownTax', '+' + money(p.mdTax));
    set('formBreakdownTotal', money(p.grandTotal));
    set('formBreakdownDeposit', money(p.depositDueNow));
    set('formBreakdownBalance', money(p.balanceDueClass));
    // Per-person price shown on the card and the two track boxes: tuition plus the remote-delivery fee.
    const key = courseKeyFor(sel) as string;
    const base = calculatePricingBreakdown(sel.replace(/VIP/gi, ''), 1, false, 'in_person').baseTuitionPerPerson;
    const vip = calculatePricingBreakdown(sel.replace(/VIP/gi, '') + ' VIP', 1, false, 'in_person').baseTuitionPerPerson;
    set('formPriceBaseVal', money(base + remoteFeePerPerson(base)));
    set('formPriceVipVal', money(vip + remoteFeePerPerson(vip)));
    set('formCardActivePrice', money((p.isVip ? vip : base) + remoteFeePerPerson(p.isVip ? vip : base)));
    void key;
  };

  w.toggleFormOnline = () => {
    if (!available()) return;
    state.on = !state.on;
    const status = $('formOnlineStatus'); if (status) status.textContent = '';
    render();
  };
  document.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement | null;
    if (t && t.id === 'formBoxOnline' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); w.toggleFormOnline(); }
  });
  document.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement | null;
    if (!t) return;
    if (t.id === 'onlineClassroomSession' || t.id === 'onlineRangeSession') {
      if (t.id === 'onlineClassroomSession') state.classroomId = t.value; else state.rangeId = t.value;
      const label = (id: string) => { const s2 = $(id) as HTMLSelectElement | null; return s2 && s2.value ? (s2.options[s2.selectedIndex].textContent || '').replace(/ \(\d+ seats? left\)| \(full\)/, '') : ''; };
      state.datesText = `Live classroom (online): ${label('onlineClassroomSession') || 'TBD'} | Day 2 range day (in person): ${label('onlineRangeSession') || 'TBD'}`;
    }
    else if (t.id === 'onlineDay2Ack') state.ack = t.checked;
    else if (t.id === 'groupSize' || t.id === 'courseSelection') window.setTimeout(render, 0);
  });

  // Run our part after the page's own price display, whichever copy of it is live.
  const origUpdate = w.updateFormPriceDisplay;
  w.updateFormPriceDisplay = function (...args: unknown[]) { const r = typeof origUpdate === 'function' ? origUpdate.apply(this, args) : undefined; render(); return r; };

  // The review step reads this: it must carry the fee so the totals match what the server will charge.
  const origCalc = w.calculateComprehensiveInvoice;
  w.calculateComprehensiveInvoice = function (baseTuition: number, isVip: boolean, groupSizeStr?: string) {
    const out = typeof origCalc === 'function' ? origCalc.apply(this, arguments) : {};
    if (!state.on || !available()) return out;
    const p = calculatePricingBreakdown(courseValue(), parseAttendeeCount(groupSizeStr || '1') || 1, false, 'live_online');
    return { ...out, remoteFee: p.remoteFee, subtotal: p.discountedTuition + p.remoteFee + p.rangeFee, mdTax: p.mdTax, grandTotal: p.grandTotal, total: p.grandTotal, depositDueNow: p.depositDueNow, balanceDueClass: p.balanceDueClass };
  };

  // Delivery fields ride along with the booking request. (The page has two copies of the booking code; this is the one place both pass through.)
  const origFetch = window.fetch.bind(window);
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    try {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
      if (state.on && available() && init && typeof init.body === 'string' && /\/api\/(checkout|fifs)(\?|$)/.test(url)) {
        const body = JSON.parse(init.body);
        if (body && (url.includes('/api/checkout') || body.action === 'submitBooking')) {
          init = { ...init, body: JSON.stringify({ ...body, delivery: 'live_online', classroomSessionId: state.classroomId, rangeSessionId: state.rangeId, day2Ack: state.ack }) };
        }
      }
    } catch { /* leave the request as it is */ }
    return origFetch(input, init);
  } as typeof window.fetch;

  // The booking button opens the review step; it cannot do that until the online choices are complete.
  const origReview = w.showBookingInvoiceModal;
  w.showBookingInvoiceModal = function (...args: unknown[]) {
    if (state.on && available()) {
      const status = $('formOnlineStatus');
      const problem = !state.classroomId ? 'Please choose a live classroom date.' : !state.rangeId ? 'Please choose your Day 2 range day. It is required.' : !state.ack ? 'Please confirm that Day 2 is mandatory, in person, at the range.' : '';
      if (problem) { if (status) status.textContent = problem; ($('formOnlineFields') as HTMLElement | null)?.scrollIntoView?.({ block: 'center' }); return false; }
    }
    return typeof origReview === 'function' ? origReview.apply(this, args) : undefined;
  };

  // Which classes can be taken online right now (switch on AND dates posted). Failure just means the option stays hidden.
  fetch('/api/fifs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'onlineOptions' }) })
    .then((r) => r.json()).then((d) => { if (d && d.success && d.courses) { state.options = { premiumRate: d.premiumRate, courses: d.courses }; render(); } }).catch(() => { /* option stays hidden */ });
}
