// Organizer view for group bookings: private-link token, masked emails, status, reminders, and the route's checks (offline).
const fs = require('fs'); const path = require('path'); const vm = require('vm'); const assert = require('assert'); const ts = require('typescript');
const ROOT = path.resolve(__dirname, '..');
const cache = {};
const load = (rel) => { if (cache[rel]) return cache[rel]; const m = { exports: {} }; const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const req = (id) => (id === '@/group/groupCopy' ? load('src/group/groupCopy.ts') : id === '@/Lib/server/group-status' ? load('src/Lib/server/group-status.ts') : require(id));
  vm.runInNewContext(ts.transpileModule(src, { compilerOptions: { target: 'ES2020', module: 'commonjs' } }).outputText, { module: m, exports: m.exports, require: req, process, console, Buffer, encodeURIComponent, String, Number, Array, Set, Promise, Error, Math, Date }); return (cache[rel] = m.exports); };
let passed = 0, failed = 0;
async function test(n, f) { try { await f(); console.log('  ✓ PASS: ' + n); passed++; } catch (e) { console.log('  ✗ FAIL: ' + n + '\n    -> ' + e.message); failed++; } }
const ROUTE = fs.readFileSync(path.join(ROOT, 'src/app/api/fifs/route.ts'), 'utf8');
const CODE = 'FIFS-POD-A1B2';
function fakeDb({ group = { course: 'Maryland CCW — VIP Turnkey ($279.99)', preferred_dates: 'Oct 25', max_seats: 4, claimed_seats: 3, status: 'ACTIVE' }, invoices = [], invoiceError = null, updates = [] } = {}) {
  return { from: (table) => { const q = { table, filters: {} };
    q.select = () => q; q.order = () => q; q.eq = (c, v) => { q.filters[c] = v; return q; };
    q.maybeSingle = async () => ({ data: table === 'booking_groups' && q.filters.invite_code === CODE ? group : null, error: null });
    q.update = (vals) => { q.vals = vals; return q; };
    q.then = (res) => { if (q.vals) { updates.push({ table, vals: q.vals, filters: q.filters }); return res({ error: invoiceError }); } return res(invoiceError ? { data: null, error: invoiceError } : { data: invoices.filter((r) => r.pod_code === q.filters.pod_code), error: null }); };
    return q; } };
}
(async () => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key';
  const gs = load('src/Lib/server/group-status.ts');
  console.log('\n[group organizer view]');
  await test('The link token is made by the server, fits only its own code, and anything else is refused', () => {
    const t = gs.groupLinkToken(CODE);
    assert(t.length === 32 && gs.verifyGroupLinkToken(CODE, t) && gs.verifyGroupLinkToken(CODE.toLowerCase(), t), 'valid token must verify');
    for (const bad of ['', 'x', t.slice(0, 31), t + 'a', t.replace(/.$/, (c) => (c === 'A' ? 'B' : 'A')), null, undefined]) assert(!gs.verifyGroupLinkToken(CODE, bad), 'accepted bad token: ' + bad);
    assert(!gs.verifyGroupLinkToken('FIFS-POD-ZZZZ', t), 'a token must not work for another group');
    assert(!gs.verifyGroupLinkToken('<script>', t), 'a bad code is refused');
    process.env.SUPABASE_SERVICE_ROLE_KEY = ''; assert(gs.groupLinkToken(CODE) === '' && !gs.verifyGroupLinkToken(CODE, ''), 'no secret means no links'); process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key';
    assert(gs.groupManageUrl(CODE).startsWith('https://trainwithfifs.com/?group=FIFS-POD-A1B2&gt='));
  });
  await test('Emails are masked and nothing but the masked address and a payment state is returned', async () => {
    assert(gs.maskEmail('pat.leader@example.com') === 'p***@example.com' && gs.maskEmail('') === 'an email on file');
    const db = fakeDb({ invoices: [{ pod_code: CODE, email: 'lead@x.com', status: 'PAID' }, { pod_code: CODE, email: 'sam@x.com', status: 'PENDING' }, { pod_code: CODE, email: 'gone@x.com', status: 'ABANDONED' }, { pod_code: 'FIFS-POD-OTHR', email: 'other@x.com', status: 'PAID' }] });
    const r = await gs.getGroupStatus(db, CODE);
    assert(r.ok && r.status.seatsTotal === 4 && r.status.seatsTaken === 3 && r.status.seatsOpen === 1 && r.status.course === 'Maryland CCW', JSON.stringify(r));
    assert(r.status.members.length === 2 && r.status.members[0].organizer === true && r.status.members[1].state === 'Started, waiting for payment', JSON.stringify(r.status.members));
    assert(!/lead@|sam@|gone@|other@/.test(JSON.stringify(r.status)), 'a full email or another group\'s row leaked');
  });
  await test('Before the database column exists the view still shows seats and says the list is not available', async () => {
    const r = await gs.getGroupStatus(fakeDb({ invoiceError: { code: '42703', message: 'column pod_code does not exist' } }), CODE);
    assert(r.ok && r.status.members === null && r.status.seatsOpen === 1);
  });
  await test('Unknown group, bad code and database trouble give plain failures', async () => {
    assert((await gs.getGroupStatus(fakeDb(), 'FIFS-POD-ZZZZ')).status === 404 && (await gs.getGroupStatus(fakeDb(), 'nope')).status === 400);
  });
  await test('A reminder goes only to people who started but have not paid (never the organizer), once each, at most 5', async () => {
    const rows = [{ pod_code: CODE, email: 'lead@x.com', status: 'PENDING' }, ...Array.from({ length: 7 }, (_, i) => ({ pod_code: CODE, email: `m${i}@x.com`, status: 'PENDING' })), { pod_code: CODE, email: 'paid@x.com', status: 'PAID' }, { pod_code: CODE, email: 'M0@x.com', status: 'PENDING' }];
    const sent = []; const r = await gs.remindGroup(fakeDb({ invoices: rows }), CODE, async (to, meta) => { sent.push([to, meta.code]); return true; });
    assert(r.ok && r.sent === 5 && sent.length === 5 && !sent.some(([to]) => to === 'lead@x.com' || to === 'paid@x.com'), JSON.stringify(sent));
    assert(new Set(sent.map(([to]) => to)).size === 5, 'duplicate recipients');
  });
  await test('Recording the group code on an invoice is best effort: it never throws and never blocks a booking', async () => {
    const updates = []; assert(await gs.recordPodCodeOnInvoice(fakeDb({ updates }), 'INV-1', CODE) === true && updates[0].vals.pod_code === CODE && updates[0].filters.invoice_number === 'INV-1');
    assert(await gs.recordPodCodeOnInvoice(fakeDb({ invoiceError: { code: '42703', message: 'x' } }), 'INV-1', CODE) === false);
    assert(await gs.recordPodCodeOnInvoice({ from: () => { throw new Error('db down'); } }, 'INV-1', CODE) === false && await gs.recordPodCodeOnInvoice(fakeDb(), 'INV-1', 'bad') === false);
  });
  await test('Route: the token is checked before any database read; failures are generic; tries are throttled; reminders are limited to one round per 6 hours', () => {
    const at = ROUTE.indexOf("case 'groupStatus':"); const body = ROUTE.slice(at, ROUTE.indexOf("case 'handleLeadMagnetSubmission'", at));
    assert(body.indexOf('allowPodCodeAttempt') < body.indexOf('verifyGroupLinkToken') && body.indexOf('verifyGroupLinkToken') < body.indexOf('getPrivilegedClient'), 'order: throttle, verify, then database');
    assert(/status: 403/.test(body) && /This link is not valid/.test(body) && /6 \* 60 \* 60 \* 1000/.test(body) && /status: 429/.test(body));
  });
  console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
  process.exit(failed ? 1 : 0);
})();
