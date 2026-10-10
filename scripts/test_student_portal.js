// Student Portal extras: class-day card, rebook, receipts, Maryland guide (offline).
const fs = require('fs'); const path = require('path'); const vm = require('vm'); const assert = require('assert'); const ts = require('typescript');
const ROOT = path.resolve(__dirname, '..'); const cache = {};
const load = (rel, extra = {}) => { const key = rel; if (cache[key]) return cache[key]; const m = { exports: {} }; const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const req = (id) => (id === './portalCopy' ? load('src/portal/portalCopy.ts') : id === '@/group/groupCopy' ? load('src/group/groupCopy.ts') : require(id));
  vm.runInNewContext(ts.transpileModule(src, { compilerOptions: { target: 'ES2020', module: 'commonjs' } }).outputText, { module: m, exports: m.exports, require: req, console, Date, Math, Number, String, Array, Promise, Error, RegExp, encodeURIComponent, document: {}, ...extra }); return (cache[key] = m.exports); };
let passed = 0, failed = 0;
async function test(n, f) { try { await f(); console.log('  ✓ PASS: ' + n); passed++; } catch (e) { console.log('  ✗ FAIL: ' + n + '\n    -> ' + e.message); failed++; } }
const ROUTE = fs.readFileSync(path.join(ROOT, 'src/app/api/fifs/route.ts'), 'utf8'), PAGE = fs.readFileSync(path.join(ROOT, 'src/app/page.tsx'), 'utf8');
function memDb(rows) { return { from: () => { const f = []; const q = { select: () => q, eq: (c, v) => { f.push((r) => r[c] === v); return q; }, in: (c, vs) => { f.push((r) => vs.includes(r[c])); return q; }, order: () => q, limit: () => q, then: (res) => res({ data: rows.filter((r) => f.every((x) => x(r))).map((r) => ({ ...r })), error: null }) }; return q; } }; }
(async () => {
  console.log('\n[student portal]');
  const ex = load('src/portal/studentExtras.ts', { window: undefined });
  await test('Countdown: counts whole days to the class date, says tomorrow and today, and stays quiet for past or unreadable dates', () => {
    const now = new Date(2026, 9, 20, 15, 0);
    assert(ex.daysUntil('Oct 25, 2026', now) === 5 && ex.daysUntil('Oct 21, 2026 at 9:00 AM', now) === 1 && ex.daysUntil('Oct 20, 2026', now) === 0 && ex.daysUntil('Oct 1, 2026', now) === -19);
    assert(ex.daysUntil('TBD', now) === null && ex.daysUntil('', now) === null);
    assert(ex.countdownText(5) === 'Your class is in 5 days.' && ex.countdownText(1) === 'Your class is tomorrow.' && ex.countdownText(0) === 'Your class is today.' && ex.countdownText(-3) === '' && ex.countdownText(null) === '');
  });
  await test('The guide is clearly informational, links only to official Maryland State Police pages, and gives no fee or term that can go stale', () => {
    const pc = load('src/portal/portalCopy.ts');
    assert(/Informational only/.test(pc.GUIDE_DISCLAIMER) && /not legal advice/.test(pc.GUIDE_DISCLAIMER) && /confirm on the official/.test(pc.GUIDE_DISCLAIMER));
    for (const g of pc.GUIDE_ITEMS) { assert(/^https:\/\/mdsp\.maryland\.gov\//.test(g.href), 'non-official link: ' + g.href); assert(!/\$\d/.test(g.body), 'a dollar figure can go stale: ' + g.title); }
    assert(pc.GUIDE_ITEMS.length === 3 && /Wear and Carry/.test(pc.GUIDE_ITEMS[1].title) && /HQL/.test(pc.GUIDE_ITEMS[0].title));
  });
  await test('Class-day content is practical: ID, ammo, eye and ear protection, directions to the range; the maps link is https', () => {
    const pc = load('src/portal/portalCopy.ts'); const all = pc.BRING.join(' ') + pc.EXPECT.join(' ');
    for (const k of ['photo ID', 'ammunition', 'hearing protection', '9:00 AM']) assert(all.includes(k), 'missing ' + k);
    assert(/^https:\/\/www\.google\.com\/maps\/search\//.test(pc.MAPS_URL) && pc.MAPS_URL.includes(encodeURIComponent("Cindy's Hot Shots")));
  });
  await test('Receipts: only that student, only paid or deposit-paid, only receipt fields, readable course names', async () => {
    const si = load('src/Lib/server/student-invoices.ts');
    const rows = [{ invoice_number: 'INV-FI-2026-1', student_id: 'FIFS-1', course: 'Maryland CCW — VIP Turnkey ($279.99)', status: 'PAID', total_amount: '297.19', amount_paid: '297.19', balance_due: '0.00', created_at: '2026-10-01T00:00:00Z', email: 'a@x.com', stripe_session_id: 'cs_secret' },
      { invoice_number: 'INV-FI-2026-2', student_id: 'FIFS-1', course: 'Maryland HQL', status: 'DEPOSIT_PAID', total_amount: '106.00', amount_paid: '31.80', balance_due: '74.20', created_at: '2026-10-02T00:00:00Z' },
      { invoice_number: 'INV-FI-2026-3', student_id: 'FIFS-1', course: 'x', status: 'PENDING', total_amount: '1', amount_paid: '0', balance_due: '1', created_at: '2026-10-03T00:00:00Z' },
      { invoice_number: 'INV-FI-2026-4', student_id: 'FIFS-2', course: 'Other person', status: 'PAID', total_amount: '9', amount_paid: '9', balance_due: '0', created_at: '2026-10-04T00:00:00Z' }];
    const out = await si.studentInvoices(memDb(rows), 'FIFS-1');
    assert(out.length === 2 && out[0].course === 'Maryland CCW' && out[0].status === 'Paid in full' && out[1].status === 'Deposit paid' && out[1].balance === 74.2, JSON.stringify(out));
    const txt = JSON.stringify(out); assert(!/a@x\.com|cs_secret|Other person|FIFS-2|Turnkey/.test(txt), 'something that is not a receipt field leaked');
    assert((await si.studentInvoices(memDb(rows), '')).length === 0 && (await si.studentInvoices({ from: () => { throw new Error('db'); } }, 'FIFS-1')).length === 0, 'fails safe');
  });
  await test('Route: receipts need a verified student token and are found only by that token\'s user id; the page mounts the cards', () => {
    const at = ROUTE.indexOf("case 'studentInvoices':"); const body = ROUTE.slice(at, ROUTE.indexOf("case 'studentOnlineClass':", at));
    assert(/getAuthenticatedUser\(req\)/.test(body) && /status: 401/.test(body) && /eq\('user_id', user\.id\)/.test(body) && !/payload\.(studentId|email)/.test(body));
    assert(/id="dash-extras"/.test(PAGE) && /installStudentExtras\(\);/.test(PAGE));
  });
  console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
  process.exit(failed ? 1 : 0);
})();
