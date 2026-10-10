// Admin payments view: staff-only, read only, safe fields, correct totals, filters and search (offline).
const fs = require('fs'); const path = require('path'); const vm = require('vm'); const assert = require('assert'); const ts = require('typescript');
const ROOT = path.resolve(__dirname, '..');
const load = (rel) => { const m = { exports: {} }; const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const req = (id) => (id === '@/group/groupCopy' ? { cleanCourse: (c) => String(c || '').replace(/\s*[—-]\s*(Base Track|VIP Turnkey).*$/i, '').replace(/\s*\(\$[\d.,/hr]+\)/g, '') } : require(id));
  vm.runInNewContext(ts.transpileModule(src, { compilerOptions: { target: 'ES2020', module: 'commonjs' } }).outputText, { module: m, exports: m.exports, require: req, console, Number, String, Array, Math, Date }); return m.exports; };
let passed = 0, failed = 0;
async function test(n, f) { try { await f(); console.log('  ✓ PASS: ' + n); passed++; } catch (e) { console.log('  ✗ FAIL: ' + n + '\n    -> ' + e.message); failed++; } }
const ROWS = [
  { invoice_number: 'INV-1', email: 'a@x.com', course: 'Maryland CCW — Base Track ($199.99)', status: 'PAID', total_amount: '259.69', amount_paid: '259.69', balance_due: '0.00', created_at: '2026-10-01T10:00:00Z', stripe_session_id: 'cs_live_SECRET', delivery: 'in_person' },
  { invoice_number: 'INV-2', email: 'b@x.com', course: 'Maryland HQL', status: 'DEPOSIT_PAID', total_amount: '100.00', amount_paid: '30.00', balance_due: '70.00', created_at: '2026-10-02T10:00:00Z', delivery: 'live_online' },
  { invoice_number: 'INV-3', email: 'c@x.com', course: 'Maryland HQL', status: 'PENDING', total_amount: '100.00', amount_paid: '0.00', balance_due: '100.00', created_at: '2026-10-03T10:00:00Z' },
  { invoice_number: 'INV-4', email: 'd@x.com', course: 'Maryland HQL', status: 'ABANDONED', total_amount: 'oops', amount_paid: null, balance_due: undefined, created_at: '2026-10-04T10:00:00Z' },
];
const db = (rows, { noDelivery = false, fail = false } = {}) => ({ calls: [], from(t) { const self = this; const f = {}; let cols = ''; const q = { select: (c) => { cols = c; return q; }, order: () => q, limit: () => q, eq: (k, v) => { f[k] = v; return q; },
  then: (res) => { self.calls.push(cols); if (fail) return res({ data: null, error: { code: 'x' } }); if (noDelivery && cols.includes('delivery')) return res({ data: null, error: { code: '42703' } }); return res({ data: rows.filter((r) => !f.status || r.status === f.status).map((r) => { const o = {}; for (const k of cols.split(',').map((s) => s.trim())) o[k] = r[k]; return o; }), error: null }); } }; return q; } });
(async () => {
  const ap = load('src/Lib/server/admin-payments.ts');
  console.log('\n[admin payments]');
  await test('Rows carry only receipt-style fields (never a Stripe id), money is cleaned, and the totals add up', async () => {
    const r = await ap.adminPayments(db(ROWS), 'all', '');
    assert(r.ok && r.rows.length === 4 && !JSON.stringify(r).includes('cs_live') && !JSON.stringify(r).includes('stripe'));
    assert(r.rows[3].total === 0 && r.rows[3].paid === 0 && r.rows[1].delivery === 'Live online' && r.rows[0].delivery === 'In person');
    assert(r.summary.collected === 289.69 && r.summary.outstanding === 70 && r.summary.paidInFull === 1 && r.summary.deposits === 1 && r.summary.pending === 1 && r.summary.other === 1, JSON.stringify(r.summary));
  });
  await test('Filters and search narrow the list; an unknown filter means all; search is capped', async () => {
    assert((await ap.adminPayments(db(ROWS), 'PAID', '')).rows.length === 1);
    assert((await ap.adminPayments(db(ROWS), 'DROP TABLE', '')).rows.length === 4);
    assert((await ap.adminPayments(db(ROWS), 'all', 'B@X.COM')).rows[0].invoiceNumber === 'INV-2');
    assert((await ap.adminPayments(db(ROWS), 'all', 'nobody')).rows.length === 0);
  });
  await test('Still works before the online-classroom script has run (no delivery column); a database error is a clean 503', async () => {
    const r = await ap.adminPayments(db(ROWS, { noDelivery: true }), 'all', ''); assert(r.ok && r.rows.length === 4 && r.rows[0].delivery === 'In person');
    const bad = await ap.adminPayments(db(ROWS, { fail: true }), 'all', ''); assert(!bad.ok && bad.status === 503 && !/code|x/.test(bad.message.replace(/payments|load|could|right|now|not/gi, '')) );
  });
  await test('Route and screen: staff check before any database access; read only; no write calls anywhere', () => {
    const ROUTE = fs.readFileSync(path.join(ROOT, 'src/app/api/fifs/route.ts'), 'utf8'), SRV = fs.readFileSync(path.join(ROOT, 'src/Lib/server/admin-payments.ts'), 'utf8'), UI = fs.readFileSync(path.join(ROOT, 'src/portal/AdminPaymentsPanel.tsx'), 'utf8');
    const at = ROUTE.indexOf("case 'adminPayments':"), body = ROUTE.slice(at, ROUTE.indexOf("case 'studentInvoices':", at));
    assert(body.indexOf('isStaffOrAdmin(user)') > 0 && body.indexOf('isStaffOrAdmin(user)') < body.indexOf('getPrivilegedClient()') && /status: 401/.test(body));
    assert(!/\.(insert|update|upsert|delete)\(/.test(SRV) && !/stripe/i.test(SRV.replace(/Stripe ids and card details/, '')), 'read only');
    assert(/aria-label="Payments"/.test(UI) && /csvCell/.test(UI) && /\[=\+\\-@/.test(UI), 'accessible, CSV cells guarded against spreadsheet formulas');
    assert(/id="btn-admin-payments-hdr"/.test(fs.readFileSync(path.join(ROOT, 'src/app/page.tsx'), 'utf8')) && /AdminPaymentsPanel/.test(fs.readFileSync(path.join(ROOT, 'src/app/layout.tsx'), 'utf8')));
  });
  console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
  process.exit(failed ? 1 : 0);
})();
