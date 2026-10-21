// The "how much do you want to pay now?" choice on the booking review: any whole percent from 30 to 100 of the total.
// Paying 100% when booking takes an extra 5% off tuition. The server (src/Lib/pricing.ts) is the only thing that charges;
// this file only shows the numbers, and its arithmetic mirrors the server to the cent (scripts/test_pay_plan.js proves it).
const w: any = typeof window !== 'undefined' ? window : {};
const MIN = 30, BONUS = 0.05;
const cents = (n: number) => Math.round(n * 100);
const usd = (c: number) => '$' + (c / 100).toFixed(2);
export const cleanPercent = (v: unknown): number => { const n = Number(v); return Number.isFinite(n) ? Math.min(100, Math.max(MIN, Math.round(n))) : MIN; };

export interface Plan { percent: number; payNow: number; balance: number; total: number; bonus: number; attendees: number; subtotal: number; tax: number }
/** `pricing` is what the booking form already computed (the 30% view). Returns dollars for the chosen percent. */
export function planFor(pricing: any, percent: unknown): Plan {
  const pct = cleanPercent(percent); const attendees = Number(pricing?.attendees) || 1;
  // the quiz reward has already been taken off discountedTuition; the 5% is on the tuition before it
  const rawC = cents((Number(pricing?.discountedTuition) || 0) + (Number(pricing?.discountAmount) || 0) + (Number(pricing?.rewardDiscount) || 0));
  const bonusC = pct >= 100 ? Math.round(rawC * BONUS) : 0;
  const subC = cents(Number(pricing?.subtotal) || 0) - bonusC; const taxC = Math.round(subC * 0.06); const totalC = subC + taxC;
  const payC = pct >= 100 ? totalC : Math.round(totalC * (pct / 100));
  return { percent: pct, payNow: payC / 100, balance: (totalC - payC) / 100, total: totalC / 100, bonus: bonusC / 100, attendees, subtotal: subC / 100, tax: taxC / 100 };
}

const PRESETS = [30, 50, 75, 100];
/** The slider and the amounts change colour as the share paid goes up: amber at 30% to cyan at 100% (the two company colours). */
const AMBER = [245, 158, 11], CYAN = [0, 229, 255];
export function shade(pct: number): string { const t = (cleanPercent(pct) - MIN) / (100 - MIN); return 'rgb(' + AMBER.map((a, i) => Math.round(a + (CYAN[i] - a) * t)).join(',') + ')'; }
export function paintSlider(el: HTMLInputElement | null, pct: number): void {
  if (!el) return; const n = cleanPercent(pct); const fill = ((n - MIN) / (100 - MIN)) * 100;
  el.style.setProperty('--pp-fill', fill + '%'); el.style.setProperty('--pp-shade', shade(n));
}
const initialPercent = (): number => cleanPercent(w.__fifsPayPct);
const SLIDER = (id: string, pct: number) => `<div class="pp-slide"><span aria-hidden="true">30%</span><input id="${id}" class="pp-range" type="range" min="30" max="100" step="1" value="${pct}" aria-label="Slide to choose how much to pay today, 30 to 100 percent" style="--pp-fill:${((pct - MIN) / (100 - MIN)) * 100}%;--pp-shade:${shade(pct)}"><span aria-hidden="true">100%</span></div>`;

/** The block the review shows in place of the old fixed 30% box and the two buttons. */
export function payPlanHtml(pricing: any): string {
  const start = initialPercent(); const p = planFor(pricing, start); const full = planFor(pricing, 100);
  const chips = PRESETS.map((n) => `<button type="button" class="pp-chip${n === start ? ' on' : ''}" data-pp="${n}" aria-pressed="${n === start}">${n === 100 ? '💎 100%' : n + '%'}</button>`).join('');
  const label = start >= 100 ? '⚡ Due today (paid in full)' : `⚡ Due today (${start}%)`;
  const go = start >= 100 ? `💎 Confirm &amp; Pay in Full (${usd(Math.round(p.payNow * 100))}) &rarr;` : `⚡ Confirm &amp; Pay <span id="fifs-pp-go-n">${start}</span>% (${usd(Math.round(p.payNow * 100))}) &rarr;`;
  return `<div id="fifs-payplan" class="pp" data-total30="${planFor(pricing, MIN).total}">
    <div class="pp-h">💳 How much would you like to pay today?</div>
    <p class="pp-sub">Reserve your seat with at least <strong>30%</strong>, or pay any amount up to <strong>100%</strong>. The rest is due at class.</p>
    <div class="pp-chips" role="group" aria-label="Choose how much to pay today">${chips}
      <label class="pp-own">Other %<input id="fifs-pp-num" type="number" inputmode="numeric" min="30" max="100" step="1" value="${start}" aria-label="Percent to pay today, 30 to 100"></label></div>
    ${SLIDER('fifs-pp-range', start)}
    <div class="pp-bonus" id="fifs-pp-bonus">🎁 Pay <strong>100%</strong> today and take an <strong>extra 5% off</strong> tuition: you save <strong>${usd(Math.round(full.bonus * 100))}</strong> (total ${usd(Math.round(full.total * 100))}).</div>
    <div class="pp-rows"><div><span>Total course investment</span><strong id="fifs-pp-total">${usd(Math.round(p.total * 100))}</strong></div>
      <div class="pp-now"><span id="fifs-pp-now-l">${label}</span><strong id="fifs-pp-now">${usd(Math.round(p.payNow * 100))}</strong></div>
      <div><span>Remaining balance (due at class)</span><strong id="fifs-pp-bal">${usd(Math.round(p.balance * 100))}</strong></div></div>
    <button type="button" id="btn-confirm-invoice-deposit" class="pp-go" onclick="window.confirmAndFinalizeBooking()">${go}</button>
  </div>`;
}

export function currentPercent(): number { const el = document.getElementById('fifs-pp-num') as HTMLInputElement | null; return cleanPercent(el ? el.value : MIN); }
function refresh(pct: number): void {
  const pricing = w.__fifsCurrentBookingPayload?.pricing; if (!pricing) return; const p = planFor(pricing, pct); w.__fifsPayPct = p.percent;
  const set = (id: string, t: string) => { const e = document.getElementById(id); if (e) e.textContent = t; };
  set('fifs-pp-total', usd(Math.round(p.total * 100))); set('fifs-pp-now', usd(Math.round(p.payNow * 100))); set('fifs-pp-bal', usd(Math.round(p.balance * 100)));
  set('fifs-pp-now-l', p.percent >= 100 ? '⚡ Due today (paid in full)' : `⚡ Due today (${p.percent}%)`); set('fifs-pp-go-n', String(p.percent));
  const go = document.getElementById('btn-confirm-invoice-deposit'); if (go) go.innerHTML = p.percent >= 100 ? `💎 Confirm &amp; Pay in Full (${usd(Math.round(p.payNow * 100))}) &rarr;` : `⚡ Confirm &amp; Pay <span id="fifs-pp-go-n">${p.percent}</span>% (${usd(Math.round(p.payNow * 100))}) &rarr;`;
  document.querySelectorAll('#fifs-payplan .pp-chip').forEach((c) => { const on = Number((c as HTMLElement).dataset.pp) === p.percent; c.classList.toggle('on', on); c.setAttribute('aria-pressed', String(on)); });
  const num = document.getElementById('fifs-pp-num') as HTMLInputElement | null; if (num && document.activeElement !== num) num.value = String(p.percent);
  const rng = document.getElementById('fifs-pp-range') as HTMLInputElement | null; if (rng) { rng.value = String(p.percent); rng.setAttribute('aria-valuetext', p.percent + ' percent, ' + usd(Math.round(p.payNow * 100)) + ' today'); paintSlider(rng, p.percent); }
  const box = document.getElementById('fifs-payplan'); if (box) box.style.setProperty('--pp-shade', shade(p.percent));
  // The itemised lines above the block (script invoice) follow the choice: the 5% pay-in-full discount appears at 100%, and subtotal and tax change with it.
  set('fifs-inv-sub', usd(Math.round(p.subtotal * 100))); set('fifs-inv-tax', '+' + usd(Math.round(p.tax * 100)));
  const br = document.getElementById('fifs-inv-bonusrow'); if (br) { br.style.display = p.bonus > 0 ? 'flex' : 'none'; set('fifs-inv-bonus', '-' + usd(Math.round(p.bonus * 100))); }
}

// ---- The slider on the booking form itself (under the "Required 30% Deposit" line) ----
// The numbers come from the same pricing function the server uses (exposed by the online form code), so what is shown is what is charged.
function formRefresh(): void {
  const host = document.getElementById('formPaySlider'); if (!host) return;
  const course = String((document.getElementById('courseSelection') as HTMLSelectElement | null)?.value || '');
  const calc = w.fifsFormPricing; if (typeof calc !== 'function') return;
  const pct = cleanPercent(w.__fifsPayPct); const rw = w.__fifsQuizReward; const reward = rw && w.__fifsClientPortalRecord && /renewal/i.test(course) ? (/VIP/i.test(course) ? rw.vip : rw.base) : 0;
  const r = calc(pct, reward || 0); if (!r) return;
  if (!host.firstChild) {
    host.innerHTML = `<div class="pp-form-h">🎚️ Want to pay more now? Slide to choose how much to pay today.</div>${SLIDER('formPayRange', pct)}<div class="pp-form-note" id="formPayNote" aria-live="polite"></div>`;
  }
  const rng = document.getElementById('formPayRange') as HTMLInputElement | null; if (rng && document.activeElement !== rng) rng.value = String(pct); paintSlider(rng, pct);
  const set = (id: string, t: string) => { const e = document.getElementById(id); if (e) e.textContent = t; };
  set('formBreakdownTuition', usd(Math.round(r.discountedTuition * 100))); set('formBreakdownTax', '+' + usd(Math.round(r.mdTax * 100)));
  set('formBreakdownTotal', usd(Math.round(r.grandTotal * 100))); set('formBreakdownDeposit', usd(Math.round(r.depositDueNow * 100))); set('formBreakdownBalance', usd(Math.round(r.balanceDueClass * 100)));
  set('formBreakdownDepositLabel', pct >= 100 ? '💎 Paying in Full Today:' : pct > MIN ? `⚡ ${pct}% Deposit (Due Now to Reserve Seat):` : '⚡ Required 30% Deposit (Due Now to Reserve Seat):');
  const shadeNow = shade(pct); const dep = document.getElementById('formBreakdownDeposit'); if (dep) dep.style.color = shadeNow; const lab = document.getElementById('formBreakdownDepositLabel'); if (lab) lab.style.color = shadeNow;
  const row = document.getElementById('formBreakdownDepositRow'); if (row) { row.style.borderColor = shadeNow; }
  const full = calc(100, reward || 0); const save = full ? Math.round((r.grandTotal - full.grandTotal) * 100) : 0;
  const note = document.getElementById('formPayNote'); if (note) note.innerHTML = pct >= 100 ? `🎁 <strong>5% pay-in-full discount applied.</strong> You save ${usd(Math.round(r.fullPayBonus * 100))} on tuition (${usd(Math.round(r.fullPayBonus * 100 * 1.06))} with tax).` : `🎁 Slide all the way to <strong>100%</strong> and take <strong>5% off</strong> tuition${save > 0 ? ' (save about ' + usd(save) + ')' : ''}.`;
}
export function installPayPlan(): void {
  if (w.__fifsPayPlanInstalled) return; w.__fifsPayPlanInstalled = true;
  w.fifsPayPlanHtml = payPlanHtml; w.fifsPayPercent = currentPercent; w.fifsFormSliderRefresh = formRefresh; w.fifsPayPlanRefresh = () => refresh(initialPercent());
  document.addEventListener('input', (e) => { const id = (e.target as HTMLElement | null)?.id; if (id === 'formPayRange') { w.__fifsPayPct = cleanPercent((e.target as HTMLInputElement).value); formRefresh(); } });
  document.addEventListener('click', (e) => { const c = (e.target as HTMLElement | null)?.closest?.('#fifs-payplan [data-pp]') as HTMLElement | null; if (c) { const n = cleanPercent(c.dataset.pp); const num = document.getElementById('fifs-pp-num') as HTMLInputElement | null; if (num) num.value = String(n); refresh(n); } });
  document.addEventListener('input', (e) => {
    const id = (e.target as HTMLElement | null)?.id; if (id === 'fifs-pp-range') refresh(cleanPercent((e.target as HTMLInputElement).value));
    if (id === 'fifs-pp-num') { const v = (e.target as HTMLInputElement).value; if (v !== '' && Number(v) >= MIN) refresh(cleanPercent(v)); }
  });
  document.addEventListener('change', (e) => { if ((e.target as HTMLElement | null)?.id === 'fifs-pp-num') { const n = cleanPercent((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = String(n); refresh(n); } });
  setTimeout(formRefresh, 0);
}
