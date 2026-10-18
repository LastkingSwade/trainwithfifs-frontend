/**
 * TrainWithFIFS - "pay my remaining balance" (offline; Stripe, Supabase and the browser are fakes)
 * The amount comes only from the student's own deposit-paid invoice; wrong students, unpaid or fully paid invoices and inconsistent amounts never reach Stripe;
 * repeat taps reuse one checkout; only Stripe's own address is opened; the payment itself is applied only by the webhook (tested in test_stripe_webhook.js).
 */
const fs = require('fs'); const path = require('path'); const Module = require('module');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
let passed = 0, failed = 0;
const test = async (name, fn) => { try { await fn(); passed++; console.log(`  ✓ PASS: ${name}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${name}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);

const state = { user: { id: 'user-1', email: 'sam@student.test' }, tables: {}, stripeCalls: [], stripeFail: false, key: 'sk_test_123' };
const origLoad = Module._load;
Module._load = function (request, parent, ...rest) {
  if (request === 'stripe') return { __esModule: true, default: class Stripe { constructor() { this.checkout = { sessions: { create: async (params, opts) => { state.stripeCalls.push({ params, opts }); if (state.stripeFail) throw new Error('stripe down'); return { id: 'cs_test_bal', url: 'https://checkout.stripe.com/c/pay/cs_test_bal' }; } } }; } } };
  if (/\/supabase-admin$/.test(request)) return {
    getAuthenticatedUser: async () => (state.user ? { user: state.user, error: null } : { user: null, error: 'no token' }), resolveStripeSecretKey: () => state.key,
    getPrivilegedClient: () => ({ from: (t) => { const q = { f: [] }; q.select = () => q; q.eq = (c, v) => { q.f.push([c, v]); return q; }; q.maybeSingle = async () => { const rows = (state.tables[t] || []).filter((r) => q.f.every(([c, v]) => r[c] === v)); return { data: rows[0] || null, error: null }; }; return q; } }),
  };
  if (/\/booking-checkout$/.test(request)) return { STRIPE_API_VERSION: '2023-10-16' };
  return origLoad.call(this, request, parent, ...rest);
};
process.env.NEXT_PUBLIC_SITE_URL = 'https://staging.example.test';
const { createBalanceCheckout } = require(path.join(ROOT, 'src/Lib/server/balance-checkout.ts')); Module._load = origLoad;
const req = { headers: { get: () => 'Bearer x' } };
const reset = (over = {}) => { state.user = { id: 'user-1', email: 'sam@student.test' }; state.stripeCalls = []; state.stripeFail = false; state.key = 'sk_test_123';
  state.tables = { students: [{ user_id: 'user-1', student_id: 'FIFS-1001', email: 'sam@student.test' }, { user_id: 'user-2', student_id: 'FIFS-2002', email: 'lee@student.test' }],
    invoices: [{ invoice_number: 'INV-FI-2026-AAAA1111', student_id: 'FIFS-1001', course: 'Maryland Wear & Carry (CCW) — Base Track', status: 'DEPOSIT_PAID', total_amount: '250.00', amount_paid: '75.00', balance_due: '175.00', email: 'sam@student.test' },
      { invoice_number: 'INV-FI-2026-BBBB2222', student_id: 'FIFS-2002', course: 'HQL', status: 'DEPOSIT_PAID', total_amount: '100.00', amount_paid: '30.00', balance_due: '70.00', email: 'lee@student.test' }] , ...over }; };

(async () => {
  await test('A student with a paid deposit gets a Stripe checkout for exactly the balance on THEIR invoice; the server decides the amount', async () => {
    reset(); const r = await createBalanceCheckout(req, 'INV-FI-2026-AAAA1111'); eq(r.status, 200); eq(r.body.url, 'https://checkout.stripe.com/c/pay/cs_test_bal'); eq(r.body.amount, 175);
    const c = state.stripeCalls[0].params; eq(c.line_items[0].price_data.unit_amount, 17500, 'cents from the invoice'); eq(c.line_items[0].price_data.currency, 'usd'); eq(c.mode, 'payment');
    eq(c.metadata.isBalancePayment, 'true'); eq(c.metadata.invoiceId, 'INV-FI-2026-AAAA1111'); eq(c.metadata.linkedUserId, 'user-1'); eq(c.customer_email, 'sam@student.test');
    assert(/balance_paid=true/.test(c.success_url) && c.success_url.startsWith('https://staging.example.test/') && /balance_cancelled=true/.test(c.cancel_url), 'return addresses are the site\'s own'); assert(c.expires_at > Date.now() / 1000, 'the checkout expires');
  });
  await test('Repeat taps within 30 minutes reuse ONE checkout (same idempotency key), so nobody is asked to pay twice', async () => {
    reset(); await createBalanceCheckout(req, 'INV-FI-2026-AAAA1111'); await createBalanceCheckout(req, 'INV-FI-2026-AAAA1111'); const [a, b] = state.stripeCalls.map((c) => c.opts.idempotencyKey); assert(a && a === b && /17500/.test(a), a + ' vs ' + b);
    reset(); await createBalanceCheckout(req, 'INV-FI-2026-AAAA1111'); state.tables.invoices[0].balance_due = '100.00'; state.tables.invoices[0].amount_paid = '150.00'; await createBalanceCheckout(req, 'INV-FI-2026-AAAA1111'); assert(state.stripeCalls[0].opts.idempotencyKey !== state.stripeCalls[1].opts.idempotencyKey, 'a changed balance is a new checkout');
  });
  await test('Not signed in, no student record, someone else\'s invoice, or a made-up number: nothing reaches Stripe', async () => {
    reset(); state.user = null; eq((await createBalanceCheckout(req, 'INV-FI-2026-AAAA1111')).status, 401);
    reset(); state.user = { id: 'nobody', email: 'x@y.z' }; eq((await createBalanceCheckout(req, 'INV-FI-2026-AAAA1111')).status, 404);
    reset(); eq((await createBalanceCheckout(req, 'INV-FI-2026-BBBB2222')).status, 404, 'another student\'s invoice'); eq((await createBalanceCheckout(req, 'INV-DOES-NOT-EXIST')).status, 404);
    for (const bad of ['', "x'; drop table invoices;--", 'a'.repeat(80), undefined]) eq((await createBalanceCheckout(req, bad)).status, 400, String(bad)); eq((await createBalanceCheckout(req, 12345)).status, 404, 'a number is just not found');
    eq(state.stripeCalls.length, 0, 'no Stripe call');
  });
  await test('Only a deposit-paid invoice can be paid this way: unpaid and fully paid ones are refused with a clear message', async () => {
    for (const [status, code, re] of [['PENDING', 409, /not been confirmed/], ['ABANDONED', 409, /not been confirmed/], ['PAID', 409, /already paid in full/]]) { reset(); state.tables.invoices[0].status = status; const r = await createBalanceCheckout(req, 'INV-FI-2026-AAAA1111'); eq(r.status, code, status); assert(re.test(r.body.error), r.body.error); }
    eq(state.stripeCalls.length, 0, 'no Stripe call');
  });
  await test('Inconsistent or impossible amounts on the invoice never reach Stripe (zero, negative, more than the total, or not adding up)', async () => {
    for (const [paid, bal] of [['250.00', '0.00'], ['75.00', '-5.00'], ['75.00', '300.00'], ['75.00', '100.00'], ['abc', '175.00'], ['75.00', '']]) { reset(); Object.assign(state.tables.invoices[0], { amount_paid: paid, balance_due: bal }); const r = await createBalanceCheckout(req, 'INV-FI-2026-AAAA1111'); eq(r.status, 409, paid + '/' + bal); }
    eq(state.stripeCalls.length, 0, 'no Stripe call');
  });
  await test('Payment problems are reported plainly and safely: Stripe down, no key, no site address', async () => {
    reset(); state.stripeFail = true; let r = await createBalanceCheckout(req, 'INV-FI-2026-AAAA1111'); eq(r.status, 502); assert(!/stripe down/.test(JSON.stringify(r.body)), 'internal error text hidden');
    reset(); state.key = null; r = await createBalanceCheckout(req, 'INV-FI-2026-AAAA1111'); eq(r.status, 503); eq(state.stripeCalls.length, 0);
  });
  await test('Wiring: the route action is student-only through the shared helper and throttled; the page opens only Stripe\'s address; the webhook is the only thing that records the payment', () => {
    const api = read('src/app/api/fifs/route.ts'); const at = api.indexOf("case 'createBalanceCheckout'"); assert(at > 0 && /allowPublicSubmit\(req, 'balance'/.test(api.slice(at, at + 400)) && /createBalanceCheckout\(req, payload\.invoiceNumber\)/.test(api.slice(at, at + 600)), 'route');
    assert(!/amount|price/i.test(api.slice(at, at + 500).replace(/\/\/.*$/gm, '').replace(/Too many attempts[^']*/, '')), 'the route takes no amount from the request');
    const co = read('src/Lib/server/balance-checkout.ts'); assert(!/\.update\(|\.insert\(|\.delete\(/.test(co), 'the checkout request never writes to the database'); assert(/\.eq\('student_id', me\.data\.student_id\)/.test(co) && /status !== 'DEPOSIT_PAID'/.test(co), 'own invoice, deposit-paid only');
    const ui = require(path.join(ROOT, 'src/portal/payBalance.ts'));
    eq(ui.safeCheckoutUrl('https://checkout.stripe.com/c/pay/cs_1'), 'https://checkout.stripe.com/c/pay/cs_1'); for (const bad of ['http://checkout.stripe.com/x', 'https://checkout.stripe.com.evil.com/x', 'https://evil.com/?https://checkout.stripe.com', 'javascript:alert(1)', '', null]) eq(ui.safeCheckoutUrl(bad), null, String(bad));
    const rows = [{ invoiceNumber: 'A', status: 'Deposit paid', balance: 175 }, { invoiceNumber: 'B', status: 'Paid in full', balance: 0 }, { invoiceNumber: 'C', status: 'Deposit paid', balance: 0 }, { invoiceNumber: 'D', status: 'Deposit paid', balance: 20 }];
    eq(ui.payable(rows).map((r) => r.invoiceNumber).join(','), 'A,D'); eq(ui.payable(null).length, 0); eq(ui.money(175), '$175.00');
    const src = read('src/portal/payBalance.ts'); assert(!/innerHTML/.test(src) && /textContent/.test(src) && !/amount/.test(src.match(/callFifsBackend\('createBalanceCheckout'[^)]*\)/)[0]), 'text only; only the invoice number is sent');
    assert(/balanceBanner\(receipts\)/.test(read('src/portal/studentExtras.ts')) && /payButton\(r\)/.test(read('src/portal/studentExtras.ts')) && /installBalanceReturn\(\)/.test(read('src/app/page.tsx')), 'shown in the student portal and handles the return');
    const css = read('src/portal/dashboard.css'); assert(/\.pay-btn \{[^}]*min-height: 48px/.test(css) && /\.pay-close \{[^}]*min-height: 44px/.test(css), '44px+ targets');
    const wh = read('src/app/api/stripe/webhook/route.ts'); assert(/handleBalancePayment/.test(wh) && /isBalancePayment === 'true'/.test(wh), 'webhook applies it');
  });
  console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`); process.exit(failed ? 1 : 0);
})();
