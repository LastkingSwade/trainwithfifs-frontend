// The "how much do you want to pay now?" choice on the booking review: any whole percent from 30 to 100 of the total.
// Paying 100% when booking a class for 2 or more people takes an extra 5% off tuition. The server (src/Lib/pricing.ts) is the only thing that charges;
// this file only shows the numbers, and its arithmetic mirrors the server to the cent (scripts/test_pay_plan.js proves it).
const w: any = typeof window !== 'undefined' ? window : {};
const MIN = 30, BONUS = 0.05;
const cents = (n: number) => Math.round(n * 100);
const usd = (c: number) => '$' + (c / 100).toFixed(2);
export const cleanPercent = (v: unknown): number => { const n = Number(v); return Number.isFinite(n) ? Math.min(100, Math.max(MIN, Math.round(n))) : MIN; };

export interface Plan { percent: number; payNow: number; balance: number; total: number; bonus: number; attendees: number }
/** `pricing` is what the booking form already computed (the 30% view). Returns dollars for the chosen percent. */
export function planFor(pricing: any, percent: unknown): Plan {
  const pct = cleanPercent(percent); const attendees = Number(pricing?.attendees) || 1;
  const rawC = cents((Number(pricing?.discountedTuition) || 0) + (Number(pricing?.discountAmount) || 0));
  const bonusC = pct >= 100 && attendees >= 2 ? Math.round(rawC * BONUS) : 0;
  const subC = cents(Number(pricing?.subtotal) || 0) - bonusC; const taxC = Math.round(subC * 0.06); const totalC = subC + taxC;
  const payC = pct >= 100 ? totalC : Math.round(totalC * (pct / 100));
  return { percent: pct, payNow: payC / 100, balance: (totalC - payC) / 100, total: totalC / 100, bonus: bonusC / 100, attendees };
}

const PRESETS = [30, 50, 75, 100];
/** The block the review shows in place of the old fixed 30% box and the two buttons. */
export function payPlanHtml(pricing: any): string {
  const p = planFor(pricing, MIN); const multi = p.attendees >= 2; const full = planFor(pricing, 100);
  const chips = PRESETS.map((n) => `<button type="button" class="pp-chip${n === MIN ? ' on' : ''}" data-pp="${n}" aria-pressed="${n === MIN}">${n === 100 ? '💎 100%' : n + '%'}</button>`).join('');
  return `<div id="fifs-payplan" class="pp" data-total30="${p.total}">
    <div class="pp-h">💳 How much would you like to pay today?</div>
    <p class="pp-sub">Reserve your seat with at least <strong>30%</strong>, or pay any amount up to <strong>100%</strong>. The rest is due at class.</p>
    <div class="pp-chips" role="group" aria-label="Choose how much to pay today">${chips}
      <label class="pp-own">Other %<input id="fifs-pp-num" type="number" inputmode="numeric" min="30" max="100" step="1" value="30" aria-label="Percent to pay today, 30 to 100"></label></div>
    <div class="pp-slide"><span aria-hidden="true">30%</span><input id="fifs-pp-range" type="range" min="30" max="100" step="1" value="30" aria-label="Slide to choose how much to pay today, 30 to 100 percent"><span aria-hidden="true">100%</span></div>
    ${multi ? `<div class="pp-bonus" id="fifs-pp-bonus">🎁 Pay <strong>100%</strong> today and take an <strong>extra 5% off</strong> tuition: you save <strong>${usd(Math.round(full.bonus * 100))}</strong> (total ${usd(Math.round(full.total * 100))}).</div>` : ''}
    <div class="pp-rows"><div><span>Total course investment</span><strong id="fifs-pp-total">${usd(Math.round(p.total * 100))}</strong></div>
      <div class="pp-now"><span id="fifs-pp-now-l">⚡ Due today (30%)</span><strong id="fifs-pp-now">${usd(Math.round(p.payNow * 100))}</strong></div>
      <div><span>Remaining balance (due at class)</span><strong id="fifs-pp-bal">${usd(Math.round(p.balance * 100))}</strong></div></div>
    <button type="button" id="btn-confirm-invoice-deposit" class="pp-go" onclick="window.confirmAndFinalizeBooking()">⚡ Confirm &amp; Pay <span id="fifs-pp-go-n">30</span>% (${usd(Math.round(p.payNow * 100))}) &rarr;</button>
  </div>`;
}

export function currentPercent(): number { const el = document.getElementById('fifs-pp-num') as HTMLInputElement | null; return cleanPercent(el ? el.value : MIN); }
function refresh(pct: number): void {
  const pricing = w.__fifsCurrentBookingPayload?.pricing; if (!pricing) return; const p = planFor(pricing, pct);
  const set = (id: string, t: string) => { const e = document.getElementById(id); if (e) e.textContent = t; };
  set('fifs-pp-total', usd(Math.round(p.total * 100))); set('fifs-pp-now', usd(Math.round(p.payNow * 100))); set('fifs-pp-bal', usd(Math.round(p.balance * 100)));
  set('fifs-pp-now-l', p.percent >= 100 ? '⚡ Due today (paid in full)' : `⚡ Due today (${p.percent}%)`); set('fifs-pp-go-n', String(p.percent));
  const go = document.getElementById('btn-confirm-invoice-deposit'); if (go) go.innerHTML = p.percent >= 100 ? `💎 Confirm &amp; Pay in Full (${usd(Math.round(p.payNow * 100))}) &rarr;` : `⚡ Confirm &amp; Pay <span id="fifs-pp-go-n">${p.percent}</span>% (${usd(Math.round(p.payNow * 100))}) &rarr;`;
  document.querySelectorAll('#fifs-payplan .pp-chip').forEach((c) => { const on = Number((c as HTMLElement).dataset.pp) === p.percent; c.classList.toggle('on', on); c.setAttribute('aria-pressed', String(on)); });
  const num = document.getElementById('fifs-pp-num') as HTMLInputElement | null; if (num && document.activeElement !== num) num.value = String(p.percent);
  const rng = document.getElementById('fifs-pp-range') as HTMLInputElement | null; if (rng) { rng.value = String(p.percent); rng.setAttribute('aria-valuetext', p.percent + ' percent, ' + usd(Math.round(p.payNow * 100)) + ' today'); }
}
export function installPayPlan(): void {
  if (w.__fifsPayPlanInstalled) return; w.__fifsPayPlanInstalled = true;
  w.fifsPayPlanHtml = payPlanHtml; w.fifsPayPercent = currentPercent;
  document.addEventListener('click', (e) => { const c = (e.target as HTMLElement | null)?.closest?.('#fifs-payplan [data-pp]') as HTMLElement | null; if (c) { const n = cleanPercent(c.dataset.pp); const num = document.getElementById('fifs-pp-num') as HTMLInputElement | null; if (num) num.value = String(n); refresh(n); } });
  document.addEventListener('input', (e) => { if ((e.target as HTMLElement | null)?.id === 'fifs-pp-range') refresh(cleanPercent((e.target as HTMLInputElement).value)); if ((e.target as HTMLElement | null)?.id === 'fifs-pp-num') { const v = (e.target as HTMLInputElement).value; if (v !== '' && Number(v) >= MIN) refresh(cleanPercent(v)); } });
  document.addEventListener('change', (e) => { if ((e.target as HTMLElement | null)?.id === 'fifs-pp-num') { const n = cleanPercent((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = String(n); refresh(n); } });
}
