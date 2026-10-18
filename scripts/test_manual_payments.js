/**
 * TrainWithFIFS - payments received in person (cash, check...) recorded by staff (offline; the database is an in-memory fake)
 * A payment can never exceed the balance; only a deposit-paid invoice can take one; the invoice and the ledger always agree (a failure puts everything back);
 * a mistake is voided, not deleted; students see method, amount and date only; only staff can do any of it.
 */
const fs = require('fs'); const path = require('path'); const Module = require('module');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const alerts = []; const origLoad = Module._load;
Module._load = function (request, parent, ...rest) { if (/\/discord$/.test(request)) return { sendDiscordAlert: async (title, desc, fields) => { alerts.push({ title, desc, fields }); return true; } }; return origLoad.call(this, request, parent, ...rest); };
const mp = require(path.join(ROOT, 'src/Lib/server/manual-payments.ts'));
const si = require(path.join(ROOT, 'src/Lib/server/student-invoices.ts'));
Module._load = origLoad;
let passed = 0, failed = 0;
const test = async (name, fn) => { try { await fn(); passed++; console.log(`  ✓ PASS: ${name}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${name}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);

function makeDb(opts = {}) {
  const t = { invoices: [{ invoice_number: 'INV-FI-2026-AAAA1111', student_id: 'FIFS-1001', status: 'DEPOSIT_PAID', total_amount: '250.00', amount_paid: '75.00', balance_due: '175.00', email: 'sam@x.co', course: 'Maryland CCW', created_at: '2026-10-01T10:00:00Z' }], invoice_payments: [] };
  const db = { t, ledgerFail: false, missing: false, invoiceFail: false, beforeInvoiceUpdate: null, calls: [] };
  db.from = (table) => {
    const q = { table, op: 'select', f: [], vals: null, ret: false, lim: null };
    q.select = () => { q.ret = true; return q; }; q.order = () => q; q.limit = (n) => { q.lim = n; return q; };
    q.eq = (c, v) => { q.f.push((r) => String(r[c]) === String(v)); return q; }; q.in = (c, vs) => { q.f.push((r) => vs.includes(r[c])); return q; }; q.is = (c, v) => { q.f.push((r) => (v === null ? r[c] == null : r[c] === v)); return q; };
    q.update = (v) => { q.op = 'update'; q.vals = v; return q; }; q.insert = (v) => { q.op = 'insert'; q.vals = v; return q; };
    const run = async () => {
      db.calls.push(table + ':' + q.op);
      if (table === 'invoice_payments' && db.missing) return { data: null, error: { code: '42P01', message: 'relation "invoice_payments" does not exist' } };
      const rows = db.t[table] || [];
      if (q.op === 'insert') { if (table === 'invoice_payments' && db.ledgerFail) return { data: null, error: { message: 'boom' } }; rows.push({ id: '00000000-0000-4000-8000-' + String(rows.length + 1).padStart(12, '0'), created_at: '2026-10-19T12:00:00Z', voided_at: null, ...q.vals }); return { data: null, error: null }; }
      if (q.op === 'update') {
        if (table === 'invoices') { if (db.invoiceFail) return { data: null, error: { message: 'boom' } }; if (db.beforeInvoiceUpdate) { const h = db.beforeInvoiceUpdate; db.beforeInvoiceUpdate = null; h(db.t); } }
        const hit = rows.filter((r) => q.f.every((f) => f(r))); hit.forEach((r) => Object.assign(r, q.vals)); return { data: q.ret ? hit : null, error: null };
      }
      let hit = rows.filter((r) => q.f.every((f) => f(r))).map((r) => ({ ...r })); if (q.lim) hit = hit.slice(0, q.lim); return { data: hit, error: null }; // copies, like a real database
    };
    q.maybeSingle = async () => { const r = await run(); return r.error ? r : { data: (r.data || [])[0] || null, error: null }; }; q.then = (res, rej) => run().then(res, rej); return q;
  };
  return db;
}
const rec = (db, o = {}) => mp.recordManualPayment(db, { invoiceNumber: 'INV-FI-2026-AAAA1111', amount: '100', method: 'cash', receivedOn: '', note: '', ...o }, 'kai@trainwithfifs.com');
const inv = (db) => db.t.invoices[0];

(async () => {
  await test('Amounts are whole cents and positive; dates are real and not in the future', () => {
    eq(mp.parseAmount('175'), 17500); eq(mp.parseAmount('175.5'), 17550); eq(mp.parseAmount('$1,175.00'), 117500); eq(mp.parseAmount(' 0.01 '), 1);
    for (const bad of ['', '0', '0.00', '-5', '1.234', 'abc', '1e3', '12345678', null, undefined, '175 dollars']) eq(mp.parseAmount(bad), null, String(bad));
    const d = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); eq(mp.cleanDate(''), d); eq(mp.cleanDate(d), d); eq(mp.cleanDate('2099-01-01'), null); eq(mp.cleanDate('2026-13-45'), null); eq(mp.cleanDate('yesterday'), null); eq(mp.cleanDate('2020-01-01'), null);
  });
  await test('A partial in-person payment lowers the balance, keeps "Deposit paid", and is written to the ledger with who/how/when; staff get a Discord note', async () => {
    const db = makeDb(); const r = await rec(db, { amount: '100', method: 'check', note: '  check #1042 ' });
    eq(r.ok, true); eq(r.status, 'DEPOSIT_PAID'); eq(r.paid, 175); eq(r.balance, 75); eq(inv(db).amount_paid, '175.00'); eq(inv(db).balance_due, '75.00'); eq(inv(db).status, 'DEPOSIT_PAID');
    const l = db.t.invoice_payments[0]; eq(l.amount, '100.00'); eq(l.method, 'check'); eq(l.note, 'check #1042'); eq(l.recorded_by, 'kai@trainwithfifs.com'); assert(/^\d{4}-\d{2}-\d{2}$/.test(l.received_on), 'date');
    assert(alerts.some((a) => /Payment recorded in person/.test(a.title) && /\$100\.00/.test(a.desc)), 'discord');
  });
  await test('Paying the whole balance in cash completes the invoice: paid in full, nothing owed, the same totals a card payment would give', async () => {
    const db = makeDb(); const r = await rec(db, { amount: '175.00' }); eq(r.status, 'PAID'); eq(inv(db).status, 'PAID'); eq(inv(db).balance_due, '0.00'); eq(inv(db).amount_paid, '250.00');
  });
  await test('More than the balance, zero, negative, junk, an unknown method or a future date: refused with a clear message and NOTHING changes', async () => {
    for (const o of [{ amount: '175.01' }, { amount: '0' }, { amount: '-5' }, { amount: 'abc' }, { method: 'bitcoin' }, { method: '' }, { receivedOn: '2099-01-01' }, { invoiceNumber: "x'; drop" }]) {
      const db = makeDb(); const r = await rec(db, o); assert(!r.ok && r.status === 400 && r.message, JSON.stringify(o) + ' ' + JSON.stringify(r)); eq(inv(db).amount_paid, '75.00'); eq(db.t.invoice_payments.length, 0);
    }
    const db = makeDb(); const big = await rec(db, { amount: '175.01' }); assert(/more than the balance of \$175\.00/.test(big.message), big.message);
  });
  await test('Only a deposit-paid invoice can take a payment (not unpaid, abandoned or already paid in full); unknown invoice; inconsistent amounts', async () => {
    for (const [status, re] of [['PENDING', /has not been paid online/], ['ABANDONED', /has not been paid online/], ['CANCELLED', /has not been paid online/], ['PAID', /already paid in full/]]) { const db = makeDb(); inv(db).status = status; const r = await rec(db); assert(!r.ok && r.status === 409 && re.test(r.message), status + ' ' + r.message); eq(inv(db).amount_paid, '75.00'); eq(db.t.invoice_payments.length, 0); }
    const none = makeDb(); eq((await rec(none, { invoiceNumber: 'INV-NOPE-0000' })).status, 404);
    for (const [paid, bal] of [['75.00', '100.00'], ['abc', '175.00'], ['75.00', '0.00'], ['75.00', '-1']]) { const db = makeDb(); Object.assign(inv(db), { amount_paid: paid, balance_due: bal }); const r = await rec(db); assert(!r.ok && r.status === 409, paid + '/' + bal); eq(db.t.invoice_payments.length, 0); }
  });
  await test('Before the one-time database step: a clear instruction, and nothing is changed (no money change without its record)', async () => {
    const db = makeDb(); db.missing = true; const r = await rec(db); assert(!r.ok && r.status === 409 && /20261019_invoice_payments\.sql/.test(r.message), r.message); eq(inv(db).amount_paid, '75.00');
    const hist = await mp.listInvoicePayments(db, 'INV-FI-2026-AAAA1111'); eq(hist.ok && hist.setupNeeded, true);
  });
  await test('If the invoice changes while staff are typing (an online payment, another staff member), nothing is written and nothing is double counted', async () => {
    const db = makeDb(); db.beforeInvoiceUpdate = (t) => { t.invoices[0].amount_paid = '250.00'; t.invoices[0].balance_due = '0.00'; t.invoices[0].status = 'PAID'; };
    const r = await rec(db, { amount: '100' }); assert(!r.ok && r.status === 409 && /just changed/.test(r.message), r.message); eq(inv(db).status, 'PAID'); eq(inv(db).amount_paid, '250.00'); eq(db.t.invoice_payments.length, 0);
  });
  await test('If the ledger cannot be written, the invoice is put back exactly as it was; if the invoice cannot be written, nothing is recorded', async () => {
    const a = makeDb(); a.ledgerFail = true; const r = await rec(a, { amount: '175' }); assert(!r.ok && r.status === 503, JSON.stringify(r)); eq(inv(a).status, 'DEPOSIT_PAID'); eq(inv(a).amount_paid, '75.00'); eq(inv(a).balance_due, '175.00'); eq(a.t.invoice_payments.length, 0);
    const b = makeDb(); b.invoiceFail = true; const r2 = await rec(b); assert(!r2.ok && r2.status === 503); eq(b.t.invoice_payments.length, 0); eq(inv(b).amount_paid, '75.00');
  });
  await test('Voiding a mistake gives the amount back to the balance, keeps the row in the history marked void, and cannot be done twice; a reason is required', async () => {
    const db = makeDb(); await rec(db, { amount: '175' }); eq(inv(db).status, 'PAID'); const id = db.t.invoice_payments[0].id;
    eq((await mp.voidManualPayment(db, id, '', 'kai')).status, 400); eq((await mp.voidManualPayment(db, 'nope', 'typo', 'kai')).status, 400); eq(inv(db).status, 'PAID', 'a refused void changes nothing');
    const v = await mp.voidManualPayment(db, id, 'typed the wrong amount', 'kai@x.co'); eq(v.ok, true); eq(inv(db).status, 'DEPOSIT_PAID'); eq(inv(db).amount_paid, '75.00'); eq(inv(db).balance_due, '175.00');
    const row = db.t.invoice_payments[0]; assert(row.voided_at && row.voided_by === 'kai@x.co' && row.void_reason === 'typed the wrong amount', 'the row is kept and marked'); eq(db.t.invoice_payments.length, 1);
    const again = await mp.voidManualPayment(db, id, 'again', 'kai'); assert(!again.ok && again.status === 409 && /already voided/.test(again.message)); eq(inv(db).balance_due, '175.00', 'no double give-back');
    assert(alerts.some((a) => /voided/i.test(a.title)), 'discord');
    const r2 = await rec(db, { amount: '175' }); eq(r2.ok, true, 'the balance can be recorded again after a void');
  });
  await test('Students see method, amount and date only: never the note, who recorded it, or voided entries; the receipt totals come from the invoice', async () => {
    const db = makeDb(); await rec(db, { amount: '100', method: 'cash', note: 'staff only: owes parking' }); await rec(db, { amount: '25', method: 'zelle' }); await mp.voidManualPayment(db, db.t.invoice_payments[1].id, 'wrong student', 'kai');
    const mine = await si.studentInvoices({ from: (t) => { const q = { f: [] }; q.select = () => q; q.eq = (c, v) => { q.f.push((r) => r[c] === v); return q; }; q.in = (c, vs) => { q.f.push((r) => vs.includes(r[c])); return q; }; q.is = (c, v) => { q.f.push((r) => (r[c] ?? null) === v); return q; }; q.order = () => q; q.limit = () => q; q.then = (res) => res({ data: (db.t[t] || []).filter((r) => q.f.every((f) => f(r))), error: null }); return q; } }, 'FIFS-1001');
    eq(mine.length, 1); const s = mine[0]; eq(s.paid, 175); eq(s.balance, 75); eq(s.status, 'Deposit paid'); eq(s.inPerson, [{ amount: 100, method: 'Cash', date: s.inPerson[0].date, recordedAt: s.inPerson[0].recordedAt }]); assert(/^\d{4}-\d{2}-\d{2}T/.test(s.inPerson[0].recordedAt), 'when it was recorded (a time only: never who recorded it)');
    const blob = JSON.stringify(mine); assert(!/staff only|owes parking|kai@|recorded_by|wrong student|voided/i.test(blob), 'private details leaked: ' + blob);
  });
  await test('If the payment records are unavailable the student\'s receipt still shows the right totals (just without the extra lines)', async () => {
    const db = makeDb(); const mine = await si.studentInvoices({ from: (t) => { const q = { f: [] }; q.select = () => q; q.eq = (c, v) => { q.f.push((r) => r[c] === v); return q; }; q.in = () => { if (t === 'invoice_payments') q.err = true; return q; }; q.is = () => q; q.order = () => q; q.limit = () => q; q.then = (res) => res(q.err ? { data: null, error: { message: 'x' } } : { data: (db.t[t] || []).filter((r) => q.f.every((f) => f(r))), error: null }); return q; } }, 'FIFS-1001');
    eq(mine.length, 1); eq(mine[0].balance, 175); eq(mine[0].inPerson, []);
  });
  await test('Wiring: the three actions are staff-only on the server before any database access; the screen offers Record payment / History / Void with a reason; the student receipt shows in-person payments', () => {
    const api = read('src/app/api/fifs/route.ts'); const at = api.indexOf("case 'adminInvoicePayments'"); assert(at > 0, 'cases'); const body = api.slice(at, at + 1400);
    assert(/case 'adminRecordPayment'/.test(body) && /case 'adminVoidPayment'/.test(body), 'all three'); assert(body.indexOf('isStaffOrAdmin(user)') > 0 && body.indexOf('isStaffOrAdmin(user)') < body.indexOf('getPrivilegedClient()') && /status: 401/.test(body), 'staff check first');
    const ui = read('src/portal/AdminPaymentsPanel.tsx'); assert(/Record payment/.test(ui) && /Payment history for/.test(ui) && /Void…/.test(ui) && /voidReason\.trim\(\)\.length < 3/.test(ui) && /VOIDED/.test(ui), 'screen'); assert(/scripts\/sql\/20261019_invoice_payments\.sql/.test(ui), 'setup hint');
    const se = read('src/portal/studentExtras.ts'); assert(/paid in person/.test(se) && /r\.inPerson/.test(se), 'student receipt'); const sql = read('scripts/sql/20261019_invoice_payments.sql'); assert(/enable row level security/.test(sql) && /revoke all on public\.invoice_payments from anon, authenticated/.test(sql) && /references public\.invoices\(invoice_number\)/.test(sql), 'private table');
    const srv = read('src/Lib/server/manual-payments.ts'); assert(!/\.delete\(/.test(srv), 'payments are voided, never deleted');
  });
  console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`); process.exit(failed ? 1 : 0);
})();
