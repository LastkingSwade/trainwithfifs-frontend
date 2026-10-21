/**
 * TrainWithFIFS - group discounts and how much to pay up front (offline)
 * 4 people take 15% off; a class of 2 or more that pays 100% when booking takes an extra 5% off tuition; the deposit can be any whole percent from 30 to 100
 * (never below 30). The on-screen numbers must match what the server charges, to the cent.
 */
const path = require('path'); const fs = require('fs');
require('./lib/ts-loader');
const ROOT = path.resolve(__dirname, '..');
const pr = require(path.join(ROOT, 'src/Lib/pricing.ts')); const pp = require(path.join(ROOT, 'src/portal/payPlan.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
const C = 'Maryland CCW - Base Track ($199.99)', V = 'Maryland CCW - VIP Track ($279.99)';
const calc = pr.calculatePricingBreakdown;

(async () => {
  await test('group discounts: 1 none, 2 is 5%, 3 is 10%, 4 is 15%, 5 is 15%', () => { eq([1, 2, 3, 4, 5].map((n) => calc(C, n, false).discountPercent), [0, 0.05, 0.10, 0.15, 0.15]); });
  await test('4 people: 15% off tuition ($199.99 x 4 = $799.96 -> $679.97)', () => { eq(calc(C, 4, false).discountedTuition, 679.97); });
  await test('default stays a 30% deposit: unchanged totals for everyone', () => {
    const p = calc(C, 1, false); eq(p.depositPercent, 30); eq(p.chargeCents, p.depositCents); eq(p.depositCents, Math.round(p.grandTotalCents * 0.3)); eq(p.fullPayBonus, 0);
    eq(calc(C, 1, false).grandTotal, calc(C, 1, false, 'in_person', 0, 30).grandTotal);
  });
  await test('pay in full takes an extra 5% off tuition for any class size (2 people: 10% in all)', () => {
    const dep = calc(C, 2, false), full = calc(C, 2, true); eq(dep.fullPayBonus, 0); eq(full.fullPayBonus, 20); eq(full.discountedTuition, 359.98); assert(full.grandTotal < dep.grandTotal, 'no saving');
    eq(full.chargeCents, full.grandTotalCents); eq(full.balanceDueClass, 0); eq(full.payFull, true);
    const alt = calc(C, 2, false, 'in_person', 0, 100); eq(alt.grandTotalCents, full.grandTotalCents, '100% by percent equals pay in full');
  });
  await test('a single person also gets the 5% for paying in full; the range fee is never discounted', () => {
    const one = calc(C, 1, true), dep = calc(C, 1, false); eq(one.fullPayBonus, 10); eq(one.discountedTuition, 189.99); assert(one.grandTotalCents < dep.grandTotalCents, 'no saving');
    eq(calc(C, 1, false, 'in_person', 0, 99).fullPayBonus, 0, 'no bonus below 100'); eq(calc(C, 3, true).rangeFee, 135); eq(calc(V, 3, true).rangeFee, 0);
  });
  await test('any whole percent from 30 to 100 works; the balance is the rest', () => {
    for (const pct of [30, 31, 45, 50, 75, 99]) { const p = calc(C, 2, false, 'in_person', 0, pct); eq(p.chargeCents, Math.round(p.grandTotalCents * pct / 100), String(pct)); eq(p.depositCents + Math.round(p.balanceDueClass * 100), p.grandTotalCents, 'sums ' + pct); eq(p.depositPercent, pct); assert(p.fullPayBonus === 0, 'bonus below 100'); }
  });
  await test('the deposit can never be below 30%, and odd input becomes 30', () => {
    for (const bad of [0, 1, 29, -50, NaN, undefined, null, 'abc', '', {}, [], Infinity * -1]) eq(pr.cleanDepositPercent(bad), 30, String(bad));
    eq(pr.cleanDepositPercent(150), 100); eq(pr.cleanDepositPercent('45'), 45); eq(pr.cleanDepositPercent(44.6), 45); eq(calc(C, 1, false, 'in_person', 0, 5).depositPercent, 30);
    eq(calc(C, 1, false, 'in_person', 0, 5).chargeCents, calc(C, 1, false).chargeCents);
  });
  await test('the quiz reward and the pay-in-full bonus both apply to a renewal paid in full, each off tuition', () => {
    const p = calc('Maryland CCW Renewal - Base Track ($149.99)', 1, true, 'in_person', 0.1); eq(p.rewardDiscount, 15); eq(p.fullPayBonus, 7.5); eq(p.discountedTuition, 127.49);
    eq(calc('Maryland CCW Renewal - Base Track ($149.99)', 1, false, 'in_person', 0.1).fullPayBonus, 0);
  });
  await test('screen numbers equal the server charge to the cent for every course, size and percent', () => {
    const courses = [C, V, 'Maryland HQL - Base Track ($100.00)', 'Maryland Mastery Multi-State - Base Track ($424.99)', 'Maryland CCW Renewal - Base Track ($149.99)'];
    let n = 0;
    for (const course of courses) for (const att of [1, 2, 3, 4, 5]) for (const pct of [30, 33, 50, 61, 75, 99, 100]) {
      const base = calc(course, att, false); const screen = { attendees: att, subtotal: (base.discountedTuition * 100 + base.rangeFee * 100 + base.remoteFee * 100) / 100, discountedTuition: base.discountedTuition, discountAmount: Math.round(base.baseTuitionPerPerson * att * 100) * base.discountPercent / 100 };
      const srv = calc(course, att, false, 'in_person', 0, pct); const plan = pp.planFor(screen, pct);
      eq(Math.round(plan.payNow * 100), srv.chargeCents, `${course} x${att} @${pct} pay now`); eq(Math.round(plan.total * 100), srv.grandTotalCents, `${course} x${att} @${pct} total`); eq(Math.round(plan.balance * 100), srv.grandTotalCents - srv.chargeCents, `${course} x${att} @${pct} balance`); n++;
    }
    assert(n === 175, 'ran ' + n);
  });
  await test('a renewal with a quiz reward: the screen plan equals the server at every percent', () => {
    const course = 'Maryland CCW Renewal - Base Track ($149.99)', quiz = require(path.join(ROOT, 'src/portal/quizCard.ts'));
    for (const f of [0.0327, 0.1, 0.3]) for (const pct of [30, 60, 100]) {
      const b = calc(course, 1, false, 'in_person', 0), sub = Math.round(b.discountedTuition * 100) + Math.round(b.rangeFee * 100);
      const screen = quiz.applyReward({ attendees: 1, subtotal: sub / 100, discountedTuition: b.discountedTuition, discountAmount: 0, mdTax: 0, total: 0 }, b.baseTuitionPerPerson, false, f);
      const srv = calc(course, 1, false, 'in_person', f, pct), plan = pp.planFor(screen, pct);
      eq(Math.round(plan.payNow * 100), srv.chargeCents, `reward ${f} @${pct} now`); eq(Math.round(plan.total * 100), srv.grandTotalCents, `reward ${f} @${pct} total`);
    }
  });
  await test('the checkout reads the chosen percent from the request and records it for the webhook', () => {
    const src = fs.readFileSync(path.join(ROOT, 'src/Lib/server/booking-checkout.ts'), 'utf8');
    assert(/cleanDepositPercent\(input\.depositPercent/.test(src) && /rewardFraction, depositPercent\)/.test(src), 'percent not read'); assert(/isDepositPayment: String\(!pricing\.payFull\)/.test(src), 'metadata');
    assert(/deposit_due: pricing\.depositDueNow/.test(src), 'invoice deposit');
  });
  await test('the booking form shows 15% for 4 people everywhere and no other copy still says 10% for 4', () => {
    const page = fs.readFileSync(path.join(ROOT, 'src/app/page.tsx'), 'utf8'), script = fs.readFileSync(path.join(ROOT, 'public/scripts/TrainWithFIFS_scripts.js'), 'utf8');
    assert(/4 People — Small Group \(15% Discount\)/.test(page), 'option label'); assert(!/4 \(Small Group \/ Family — 10%/.test(page), 'old value'); assert(!/4 People \(10%/.test(script), 'old badge');
    assert(/count === 4 \? 0\.15 : 0\.10/.test(page), 'page calc'); assert(/count = 4;\s*discountPercent = 0\.15;/.test(script), 'script calc');
  });
  await test('the review offers 30, 50, 75, 100 and an own percent, the minimum is 30, and the 5% note is shown for any class size', () => {
    const one = pp.payPlanHtml({ attendees: 1, subtotal: 244.99, discountedTuition: 199.99, discountAmount: 0 }), two = pp.payPlanHtml({ attendees: 2, subtotal: 424.98, discountedTuition: 379.98, discountAmount: 20 });
    for (const n of [30, 50, 75, 100]) assert(one.includes(`data-pp="${n}"`), 'chip ' + n); assert(/min="30" max="100"/.test(one), 'limits'); assert(/extra 5% off/.test(one) && /extra 5% off/.test(two), 'bonus note missing');
    eq(pp.cleanPercent(10), 30); eq(pp.cleanPercent('abc'), 30); eq(pp.cleanPercent(500), 100);
  });
  await test('the review has a slider from 30 to 100 that is kept in step with the chips and the box', () => {
    const h = pp.payPlanHtml({ attendees: 1, subtotal: 244.99, discountedTuition: 199.99, discountAmount: 0 });
    assert(/id="fifs-pp-range" class="pp-range" type="range" min="30" max="100" step="1" value="30"/.test(h), 'slider missing or wrong limits'); assert(/aria-label="Slide to choose/.test(h), 'slider label');
    const src = fs.readFileSync(path.join(ROOT, 'src/portal/payPlan.ts'), 'utf8'); assert(/'fifs-pp-range'\) refresh\(cleanPercent/.test(src) && /rng\.value = String\(p\.percent\)/.test(src), 'slider not wired both ways');
  });
  await test('the booking form has the slider under the deposit line, wired to the server price function, with colours from amber to cyan', () => {
    const page = fs.readFileSync(path.join(ROOT, 'src/app/page.tsx'), 'utf8'), of = fs.readFileSync(path.join(ROOT, 'src/online/onlineForm.ts'), 'utf8');
    assert(/id="formBreakdownDepositLabel"/.test(page) && /id="formPaySlider"/.test(page), 'form host missing'); assert(page.indexOf('id="formPaySlider"') > page.indexOf('id="formBreakdownBalance"'), 'slider not below the deposit');
    assert(/w\.fifsFormPricing = /.test(of) && /fifsFormSliderRefresh/.test(of), 'price function not exposed'); eq(pp.shade(30), 'rgb(245,158,11)'); eq(pp.shade(100), 'rgb(0,229,255)'); assert(pp.shade(65) !== pp.shade(30) && pp.shade(65) !== pp.shade(100), 'no blend');
  });
  console.log(`\nPay plan: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
