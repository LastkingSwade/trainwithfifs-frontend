// The Daily Range Quiz card in the Client Portal, and the matching price line when the client books their renewal class. One question a day; the questions and answers
// stay on the server (this file never sees an answer until the server has graded the one the client chose). Text only (textContent).
const w: any = typeof window === 'undefined' ? {} : window;
function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, cls?: string): HTMLElementTagNameMap[K] { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; }
const usd = (n: number) => '$' + Number(n).toFixed(2);
const pct = (n: number) => (Math.round(n * 100) / 100).toString().replace(/\.0+$/, '') + '%';

export interface RewardView { fraction: number; fractionVip: number; percent: number; dollarsBase: number; dollarsVip: number; capBase: number; capVip: number; reserved: boolean }
export interface QuizView { setupNeeded: boolean; points: number; level: number; levels: number; perLevel: number; totalPoints: number; reward: RewardView; today: { state: 'question'; id: string; level: number; number: number; text: string; options: string[] } | { state: 'answered'; correct: boolean } | { state: 'done' } }
export interface AnswerView { correct: boolean; pointsEarned: number; correctText: string; why: string; points: number; reward: RewardView }

function rewardBlock(r: RewardView): HTMLElement {
  const box = el('div', undefined, 'qz-reward');
  const share = r.capBase > 0 ? Math.min(100, (r.percent / r.capBase) * 100) : 0;
  box.appendChild(el('strong', r.percent > 0 ? `🎁 Your renewal reward: ${pct(r.percent)} off tuition (about ${usd(r.dollarsBase)} on the Base class)` : '🎁 Your renewal reward starts at your first correct answer'));
  const bar = el('div', undefined, 'qz-bar'); bar.setAttribute('role', 'progressbar'); bar.setAttribute('aria-valuemin', '0'); bar.setAttribute('aria-valuemax', '100'); bar.setAttribute('aria-valuenow', String(Math.round(share))); bar.setAttribute('aria-label', `Reward earned: ${pct(r.percent)} of a possible ${pct(r.capBase)}`);
  const fill = el('i'); fill.style.width = share + '%'; bar.appendChild(fill); box.appendChild(bar);
  box.appendChild(el('span', `Up to ${pct(r.capBase)} off tuition on the Base renewal class and ${pct(r.capVip)} on VIP. Not on the range fee or tax.`, 'qz-small'));
  if (r.reserved) box.appendChild(el('span', 'Your reward is applied to a renewal booking you started. If that booking is not completed it comes back to you.', 'qz-small'));
  return box;
}

export function renderQuiz(host: HTMLElement, v: QuizView, onAnswer: (id: string, choice: number) => Promise<AnswerView | string>): void {
  host.textContent = '';
  const head = el('header', undefined, 'qz-head'); head.appendChild(el('span', '🎯', 'qz-ico')).setAttribute('aria-hidden', 'true');
  const hc = el('div'); hc.appendChild(el('span', 'Daily Range Quiz', 'qz-eyebrow')); hc.appendChild(el('h3', `Level ${v.level} of ${v.levels} · ${v.points} point${v.points === 1 ? '' : 's'}`)); head.appendChild(hc); host.appendChild(head);
  host.appendChild(rewardBlock(v.reward));
  const live = el('div', undefined, 'qz-live'); live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite'); live.hidden = true;
  const body = el('div', undefined, 'qz-body'); host.appendChild(body);
  if (v.today.state === 'question') {
    const t = v.today; body.appendChild(el('p', `Today's question (${t.number} of ${v.perLevel} at Level ${t.level})`, 'qz-q-meta')); body.appendChild(el('p', t.text, 'qz-q'));
    const list = el('div', undefined, 'qz-options'); list.setAttribute('role', 'group'); list.setAttribute('aria-label', 'Answer choices');
    t.options.forEach((o, i) => { const b = el('button', o, 'qz-opt'); b.type = 'button'; b.addEventListener('click', async () => {
      list.querySelectorAll('button').forEach((x) => { (x as HTMLButtonElement).disabled = true; }); live.hidden = true;
      const r = await onAnswer(t.id, i);
      if (typeof r === 'string') { live.hidden = false; live.classList.add('bad'); live.textContent = r; list.querySelectorAll('button').forEach((x) => { (x as HTMLButtonElement).disabled = false; }); return; }
      const res = el('div', undefined, 'qz-result ' + (r.correct ? 'ok' : 'no')); res.setAttribute('role', 'status');
      res.appendChild(el('strong', r.correct ? `✅ Correct! +${r.pointsEarned} point${r.pointsEarned === 1 ? '' : 's'}` : '❌ Not quite.'));
      if (!r.correct) res.appendChild(el('p', `The right answer: ${r.correctText}`)); res.appendChild(el('p', r.why)); res.appendChild(el('p', 'Come back tomorrow for the next question.', 'qz-small'));
      body.textContent = ''; body.appendChild(res);
      const rb = host.querySelector('.qz-reward'); if (rb) rb.replaceWith(rewardBlock(r.reward)); const h = host.querySelector('.qz-head h3'); if (h) h.textContent = `Level ${v.level} of ${v.levels} · ${r.points} point${r.points === 1 ? '' : 's'}`;
    }); list.appendChild(b); });
    body.appendChild(list); body.appendChild(live);
  } else if (v.today.state === 'answered') { body.appendChild(el('p', v.today.correct ? '✅ You answered today\'s question correctly. Come back tomorrow for a new one!' : 'You have answered today\'s question. Come back tomorrow for a new one!', 'qz-q')); }
  else body.appendChild(el('p', 'You have answered every question we have so far. New ones are on the way, so check back soon!', 'qz-q'));
  host.appendChild(el('p', 'One question a day, and the questions are about safe handling, range etiquette and what we teach in class. Your reward comes off the tuition of your renewal class automatically when you book it while signed in here (single seat). It starts over after you book. It has no cash value, and FIFS may change the program.', 'qz-small'));
}

export function installQuizCard(): void {
  if (w.__fifsQuizInstalled) return; w.__fifsQuizInstalled = true;
  let busy = false;
  const dash = () => document.getElementById('client-active-dashboard'); const host = () => document.getElementById('qz-client');
  const shown = () => { const d = dash(); return !!d && !d.classList.contains('hidden') && getComputedStyle(d).display !== 'none'; };
  const refresh = async () => {
    const h = host(); if (!h) return; if (!shown()) { h.hidden = true; return; } if (busy || typeof w.callFifsBackend !== 'function') return; busy = true;
    try {
      const v: QuizView = await w.callFifsBackend('quizToday', {});
      if (!v || v.setupNeeded) { h.hidden = true; h.textContent = ''; return; }
      w.__fifsQuizReward = { base: v.reward.fraction, vip: v.reward.fractionVip };
      renderQuiz(h, v, async (id, choice) => { try { const r: any = await w.callFifsBackend('quizAnswer', { questionId: id, choice }); w.__fifsQuizReward = { base: r.reward.fraction, vip: r.reward.fractionVip }; return r as AnswerView; } catch (e: any) { return String((e && e.message) || 'Could not save your answer. Please try again.'); } });
      h.hidden = false;
    } catch { h.hidden = true; } finally { busy = false; }
  };
  const d = dash(); if (d) new MutationObserver(() => { void refresh(); }).observe(d, { attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
  void refresh();
}

// ---- The booking review shows the same reward the server will apply, so the total on screen matches the charge ----
const cents = (n: number) => Math.round(n * 100);
/** Mirrors the server's pricing for ONE renewal seat: the reward comes off tuition, then range fee and fees are added, then 6% tax, and the deposit is 30% of the total. */
export function applyReward(out: any, baseTuition: number, isVip: boolean, fraction: number): any {
  if (!out || !(fraction > 0) || fraction > 0.3 || !(baseTuition > 0)) return out;
  const reward = cents(baseTuition) * fraction; const rewardC = Math.round(reward);
  const subtotalC = cents(out.subtotal) - rewardC; const taxC = Math.round(subtotalC * 0.06); const totalC = subtotalC + taxC; const depositC = Math.round(totalC * 0.3);
  return { ...out, rewardDiscount: rewardC / 100, rewardPercent: Math.round(fraction * 10000) / 100, discountedTuition: out.discountedTuition - rewardC / 100, subtotal: subtotalC / 100, mdTax: taxC / 100, total: totalC / 100, grandTotal: totalC / 100, depositDueNow: depositC / 100, balanceDueClass: (totalC - depositC) / 100 };
}
export function installQuizPricing(): void {
  if (w.__fifsQuizPricingInstalled) return; w.__fifsQuizPricingInstalled = true;
  const orig = w.calculateComprehensiveInvoice; if (typeof orig !== 'function') return;
  w.calculateComprehensiveInvoice = function (baseTuition: number, isVip: boolean, groupSizeStr?: string) {
    const out = orig.apply(this, arguments);
    try {
      const rw = w.__fifsQuizReward; const course = String((document.getElementById('courseSelection') as HTMLSelectElement | null)?.value || '');
      if (!rw || !w.__fifsClientPortalRecord || !/renewal/i.test(course) || !(out && out.attendees === 1)) return out;
      return applyReward(out, baseTuition, isVip, isVip ? rw.vip : rw.base);
    } catch { return out; }
  };
}
