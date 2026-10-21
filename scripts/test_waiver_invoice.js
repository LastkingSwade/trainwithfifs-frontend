/**
 * TrainWithFIFS - required safety waiver + invoices sent from the Admin Hub (offline; the database, Stripe and email are fakes)
 * Waiver: really stored, a student reaches only their own, nobody is locked out if storage is missing, nothing is claimed saved when it was not.
 * Invoices: staff only, the server works the amounts (agreed price + 6% tax), the payer only chooses 30-100%, a signed 7-day link, nothing emailed unless saved.
 */
const fs = require('fs'); const path = require('path'); const Module = require('module');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-secret'; process.env.NEXT_PUBLIC_SITE_URL = 'https://trainwithfifs.test';
let currentDb = null; const origLoad = Module._load;
Module._load = function (request, parent, ...rest) { if (/(^|\/)supabase-admin$/.test(request)) return { getPrivilegedClient: () => currentDb, resolveStripeSecretKey: () => process.env.STRIPE_SECRET_KEY || null, getAuthenticatedUser: async () => ({ user: null, error: 'x' }) }; return origLoad.call(this, request, parent, ...rest); };
const S = require(path.join(ROOT, 'src/Lib/server/sent-invoices.ts')); const W = require(path.join(ROOT, 'src/Lib/server/waivers.ts'));
const A = require(path.join(ROOT, 'src/portal/adminInvoice.ts')); const G = require(path.join(ROOT, 'src/portal/waiverGate.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);

function fakeDb(t, o = {}) {
  const db = { t, writes: [] };
  db.from = (table) => { const f = []; let op = 'select', vals = null, lim = null, conflict = null;
    const q = { select: () => q, eq: (c, v) => { f.push((r) => String(r[c]) === String(v)); return q; }, in: (c, vs) => { f.push((r) => vs.includes(r[c])); return q; }, ilike: (c, v) => { f.push((r) => String(r[c]).toLowerCase() === String(v).replace(/\\/g, '').toLowerCase()); return q; }, limit: (n) => { lim = n; return q; },
      insert: (v) => { op = 'insert'; vals = v; return q; }, update: (v) => { op = 'update'; vals = v; return q; }, upsert: (v, opt) => { op = 'upsert'; vals = v; conflict = opt && opt.onConflict; return q; } };
    const run = async () => { if (o.missing === table) return { data: null, error: { code: '42P01', message: `relation "${table}" does not exist` } };
      if (o.fail && o.fail[table] === op) return { data: null, error: { code: 'XX', message: 'boom' } };
      const rows = db.t[table] || (db.t[table] = []);
      if (op === 'insert') { db.writes.push([table, op, vals]); rows.push({ ...vals }); return { data: null, error: null }; }
      if (op === 'upsert') { db.writes.push([table, op, vals]); const i = rows.findIndex((r) => r[conflict] === vals[conflict]); if (i >= 0) rows[i] = { ...rows[i], ...vals }; else rows.push({ ...vals }); return { data: null, error: null }; }
      if (op === 'update') { const hit = rows.filter((r) => f.every((g) => g(r))); hit.forEach((r) => Object.assign(r, vals)); db.writes.push([table, op, vals]); return { data: hit.map((r) => ({ ...r })), error: null }; }
      let hit = rows.filter((r) => f.every((g) => g(r))).map((r) => ({ ...r })); if (lim) hit = hit.slice(0, lim); return { data: hit, error: null }; };
    q.maybeSingle = async () => { const r = await run(); return r.error ? r : { data: (r.data || [])[0] || null, error: null }; }; q.then = (res, rej) => run().then(res, rej); return q; };
  return db;
}
const GUEST = { student_id: 'GUEST-CHECKOUT', email: 'guest-checkout@fifs.invalid' };
const mailbox = []; const sendMail = async (to, mail) => { mailbox.push({ to, ...mail }); return true; };
const T0 = Date.UTC(2026, 9, 24, 15, 0, 0); const DAY = 86400000;
const siteUrl = () => 'https://trainwithfifs.test';
const stripeFake = (log, o = {}) => () => ({ checkout: { sessions: { create: async (a) => { if (o.fail) throw new Error('stripe down'); log.push(a); return { id: 'cs_' + log.length, url: 'https://checkout.stripe.com/c/pay/cs_' + log.length }; }, expire: async (id) => { log.push({ expired: id }); } } } });
const good = { fullName: 'Dana Lee', email: 'Dana@Example.com', phone: '', course: 'Maryland Wear & Carry (CCW)', classDate: '2026-11-14', price: '200' };

(async () => {
  console.log('\n[Invoice amounts]');
  await test('the agreed price gets 6% tax on top, to the cent; bad or huge prices are refused', () => {
    const p = S.priceInvoice(249.99); eq([p.priceCents, p.taxCents, p.totalCents], [24999, 1500, 26499]); eq(S.priceInvoice('$200').totalCents, 21200); eq(S.priceInvoice('1,000.50').totalCents, 106053);
    for (const bad of [0, -5, 'abc', '', null, undefined, 5000.01, NaN, Infinity]) assert(S.priceInvoice(bad).ok === false, String(bad)); assert(S.priceInvoice(5000).ok, 'the limit itself is fine');
  });
  await test('the payer chooses 30 to 100 percent; anything else becomes 30; 100 is exactly the total; the amount is always worked out here', () => {
    eq(S.chargeCents(21200, 30), { percent: 30, cents: 6360 }); eq(S.chargeCents(21200, 50), { percent: 50, cents: 10600 }); eq(S.chargeCents(21200, 100), { percent: 100, cents: 21200 });
    for (const odd of [0, 5, -40, 'x', null, undefined, NaN]) eq(S.chargeCents(21200, odd).percent, 30, String(odd)); eq(S.chargeCents(21200, 250).percent, 100); eq(S.chargeCents(10001, 33).cents, Math.round(10001 * 0.33));
  });

  console.log('\n[The signed pay link]');
  await test('a link works for 7 days, then says it expired; changing the invoice, the name or any character makes it invalid', () => {
    const n = 'INV-FI-2026-ABCD1234', tok = S.makeToken(n, T0, 'Dana Lee');
    eq(S.checkToken(n, tok, T0, 'Dana Lee'), 'ok'); eq(S.checkToken(n, tok, T0 + 6.9 * DAY, 'Dana Lee'), 'ok'); eq(S.checkToken(n, tok, T0 + 7.1 * DAY, 'Dana Lee'), 'expired');
    eq(S.checkToken('INV-FI-2026-ZZZZ9999', tok, T0, 'Dana Lee'), 'bad'); eq(S.checkToken(n, tok, T0, 'Someone Else'), 'bad'); eq(S.checkToken(n, tok.slice(0, -1) + (tok.endsWith('a') ? 'b' : 'a'), T0, 'Dana Lee'), 'bad');
    for (const junk of ['', null, 'abc', '.', 'x.y', tok + 'x', undefined]) eq(S.checkToken(n, junk, T0, 'Dana Lee'), 'bad', String(junk)); eq(S.checkToken('not-an-invoice', tok, T0, 'Dana Lee'), 'bad');
    eq(S.checkToken(n, S.makeToken(n, T0 + 3600000, 'Dana Lee'), T0, 'Dana Lee'), 'bad', 'a link dated in the future is not accepted');
  });

  console.log('\n[Sending an invoice]');
  await test('it saves the invoice with the right amounts, emails a signed link, and puts a new person on the guest record', async () => {
    mailbox.length = 0; currentDb = fakeDb({ students: [GUEST], invoices: [] });
    const r = await S.sendInvoice(good, 'kai@trainwithfifs.com', { supabase: currentDb, now: () => T0, sendMail, siteUrl, newNumber: () => 'INV-FI-2026-AAAA1111' });
    assert(r.ok && r.emailed && r.totalCents === 21200, JSON.stringify(r)); const row = currentDb.t.invoices[0];
    eq([row.invoice_number, row.student_id, row.status, row.total_amount, row.tuition_amount, row.tax_amount, row.amount_paid, row.balance_due, row.deposit_due], ['INV-FI-2026-AAAA1111', 'GUEST-CHECKOUT', 'PENDING', '212.00', '200.00', '12.00', '0.00', '212.00', '63.60']);
    eq(row.email, 'dana@example.com'); eq(row.due_date, 'Saturday, November 14, 2026'); assert(/Invoice emailed by/.test(row.payment_method), 'who sent it');
    eq(mailbox.length, 1); eq(mailbox[0].to, 'dana@example.com'); assert(mailbox[0].html.includes('$212.00') && mailbox[0].html.includes('$12.00') && mailbox[0].html.includes('/pay-invoice?i=INV-FI-2026-AAAA1111&amp;t=') && /Due on receipt|due on receipt/.test(mailbox[0].text), 'email content');
    const u = new URL(r.link); eq(S.checkToken(u.searchParams.get('i'), u.searchParams.get('t'), T0, u.searchParams.get('n')), 'ok'); eq(u.searchParams.get('n'), 'Dana Lee');
  });
  await test('an existing student keeps the invoice on their own record', async () => {
    currentDb = fakeDb({ students: [GUEST, { student_id: 'FIFS-4081', email: 'dana@example.com' }], invoices: [] });
    const r = await S.sendInvoice(good, 'kai', { supabase: currentDb, now: () => T0, sendMail, siteUrl, newNumber: () => 'INV-FI-2026-BBBB2222' }); assert(r.ok, JSON.stringify(r)); eq(currentDb.t.invoices[0].student_id, 'FIFS-4081');
  });
  await test('nothing is emailed when the invoice cannot be saved; bad details are refused before anything is written', async () => {
    mailbox.length = 0; currentDb = fakeDb({ students: [GUEST], invoices: [] }, { fail: { invoices: 'insert' } });
    const r = await S.sendInvoice(good, 'kai', { supabase: currentDb, sendMail, siteUrl }); assert(!r.ok && r.status === 503 && /nothing was sent/i.test(r.error), JSON.stringify(r)); eq(mailbox.length, 0);
    for (const bad of [{ ...good, email: 'nope' }, { ...good, fullName: '' }, { ...good, price: 0 }, { ...good, price: 99999 }, { ...good, course: '' }, { ...good, classDate: '' }]) { currentDb = fakeDb({ students: [GUEST], invoices: [] }); const x = await S.sendInvoice(bad, 'kai', { supabase: currentDb, sendMail, siteUrl }); assert(!x.ok && x.status === 400, JSON.stringify(bad)); eq(currentDb.writes.length, 0, 'no write'); }
    eq(mailbox.length, 0);
  });
  await test('if the email service is down the invoice is kept and staff are told to copy the link', async () => {
    currentDb = fakeDb({ students: [GUEST], invoices: [] }); const r = await S.sendInvoice(good, 'kai', { supabase: currentDb, now: () => T0, sendMail: async () => false, siteUrl }); assert(r.ok && r.emailed === false && /pay-invoice/.test(r.link), JSON.stringify(r));
  });

  console.log('\n[Paying]');
  const open = (extra = {}) => ({ students: [GUEST], invoices: [{ invoice_number: 'INV-FI-2026-AAAA1111', student_id: 'GUEST-CHECKOUT', course: 'Maryland Wear & Carry (CCW)', status: 'PENDING', total_amount: '212.00', tuition_amount: '200.00', tax_amount: '12.00', amount_paid: '0.00', balance_due: '212.00', deposit_due: '63.60', due_date: 'Saturday, November 14, 2026', email: 'dana@example.com', ...extra }] });
  const N = 'INV-FI-2026-AAAA1111'; const tok = (nm = 'Dana Lee') => S.makeToken(N, T0, nm);
  await test('the page gets the invoice facts and never an email or another person\'s data', async () => {
    currentDb = fakeDb(open()); const r = await S.payInfo(N, tok(), { supabase: currentDb, now: () => T0 + DAY }, 'Dana Lee'); assert(r.ok, JSON.stringify(r));
    eq([r.info.total, r.info.price, r.info.tax, r.info.state, r.info.minPercent], [212, 200, 12, 'open', 30]); assert(!/@|dana/i.test(JSON.stringify(r.info)), 'no email in the page data');
    eq((await S.payInfo(N, 'bad', { supabase: currentDb, now: () => T0 }, 'Dana Lee')).status, 404); eq((await S.payInfo(N, tok(), { supabase: currentDb, now: () => T0 + 8 * DAY }, 'Dana Lee')).status, 410);
  });
  await test('50% opens a checkout for exactly half, written on the invoice first; 100% is the full total; the page can never send an amount', async () => {
    for (const [pct, cents, dep] of [[50, 10600, 'true'], [100, 21200, 'false'], [3, 6360, 'true'], ['evil', 6360, 'true']]) {
      currentDb = fakeDb(open()); const log = []; const r = await S.invoiceCheckout(N, tok(), pct, { supabase: currentDb, now: () => T0, siteUrl, stripe: stripeFake(log) }, 'Dana Lee'); assert(r.ok && /^https:\/\/checkout\.stripe\.com\//.test(r.url), JSON.stringify(r));
      const s = log[0]; eq(s.line_items[0].price_data.unit_amount, cents, String(pct)); eq(s.metadata.isDepositPayment, dep); eq(s.metadata.invoiceId, N); eq(s.metadata.fullName, 'Dana Lee'); eq(s.expires_at, Math.floor(T0 / 1000) + 3600); eq(s.client_reference_id, N);
      const row = currentDb.t.invoices[0]; eq(row.deposit_due, (cents / 100).toFixed(2), 'the amount the webhook expects'); eq(row.stripe_session_id, 'cs_1', 'bound to this checkout'); eq(row.total_amount, '212.00', 'the total is untouched');
    }
  });
  await test('the webhook rule matches: a deposit is checked against deposit_due, a full payment against total_amount', () => {
    const src = read('src/app/api/stripe/webhook/route.ts'); assert(/const expectedCents = isDeposit \? toCents\(invoice\.deposit_due\) : totalCents/.test(src), 'webhook compares the paid amount with deposit_due or the total'); assert(/isDeposit = session\.metadata\?\.isDepositPayment === 'true'/.test(src), 'flag');
  });
  await test('a part-paid invoice is finished with the balance only (same rule as the portal balance button)', async () => {
    currentDb = fakeDb(open({ status: 'DEPOSIT_PAID', amount_paid: '63.60', balance_due: '148.40' })); const log = []; const r = await S.invoiceCheckout(N, tok(), 30, { supabase: currentDb, now: () => T0, siteUrl, stripe: stripeFake(log) }, 'Dana Lee'); assert(r.ok, JSON.stringify(r));
    eq(log[0].line_items[0].price_data.unit_amount, 14840); eq(log[0].metadata.isBalancePayment, 'true'); eq(currentDb.t.invoices[0].deposit_due, '63.60', 'nothing on the invoice changes before payment');
    currentDb = fakeDb(open({ status: 'DEPOSIT_PAID', amount_paid: '63.60', balance_due: '999.00' })); eq((await S.invoiceCheckout(N, tok(), 30, { supabase: currentDb, now: () => T0, siteUrl, stripe: stripeFake([]) }, 'Dana Lee')).status, 409);
  });
  await test('a paid, expired, tampered or unknown invoice never opens a checkout', async () => {
    const log = []; const run = (rows, token, now = T0, nm = 'Dana Lee') => { currentDb = fakeDb(rows); return S.invoiceCheckout(N, token, 50, { supabase: currentDb, now: () => now, siteUrl, stripe: stripeFake(log) }, nm); };
    eq((await run(open({ status: 'PAID' }), tok())).status, 409); eq((await run(open(), tok(), T0 + 8 * DAY)).status, 410); eq((await run(open(), 'nope')).status, 404); eq((await run(open(), tok(), T0, 'Other Name')).status, 404); eq((await run({ students: [], invoices: [] }, tok())).status, 404); eq((await run(open({ status: 'VOID' }), tok())).status, 409);
    eq(log.length, 0, 'no checkout was created');
  });
  await test('a failed checkout or a failed bind is reported and no stale checkout is left usable', async () => {
    currentDb = fakeDb(open()); eq((await S.invoiceCheckout(N, tok(), 50, { supabase: currentDb, now: () => T0, siteUrl, stripe: stripeFake([], { fail: true }) }, 'Dana Lee')).status, 502);
    currentDb = fakeDb(open(), { fail: { invoices: 'update' } }); const log = []; eq((await S.invoiceCheckout(N, tok(), 50, { supabase: currentDb, now: () => T0, siteUrl, stripe: stripeFake(log) }, 'Dana Lee')).status, 409); eq(log.length, 0);
  });

  console.log('\n[Waiver]');
  await test('status: signed, not signed, and "unavailable" when the table is not there yet (nobody is locked out)', async () => {
    const st = async (db) => W.waiverStatus(db, 'FIFS-1');
    eq(await st(fakeDb({ student_waivers: [] })), { available: true, signed: false }); const s = await st(fakeDb({ student_waivers: [{ student_id: 'FIFS-1', signed_at: '2026-10-24T10:00:00Z' }] })); eq([s.available, s.signed], [true, true]);
    const m = await st(fakeDb({}, { missing: 'student_waivers' })); eq(m, { available: false, signed: false }); assert(!G.mustSign(m) && !G.mustSign(undefined) && !G.mustSign(null) && !G.mustSign({ success: false }) && !G.mustSign({ available: true, signed: true }), 'never locks without a clear unsigned answer'); assert(G.mustSign({ success: true, available: true, signed: false }), 'locks only when storage works and it is unsigned');
  });
  await test('saving records exactly what was typed (cleaned), for the student only; incomplete forms and storage errors are never reported as saved', async () => {
    const db = fakeDb({ student_waivers: [] }); const r = await W.saveWaiver(db, 'FIFS-1', { studentName: ' Sam Roe ', initials: 'SR', signature: 'Sam Roe', emergencyContact: 'Pat Roe', emergencyRelation: 'Mother', emergencyPhone: '410-555-0100', studentEmail: 's@x.com', studentPhone: '410', under18: false, student_id: 'FIFS-999' }); assert(r.ok, JSON.stringify(r));
    const row = db.t.student_waivers[0]; eq([row.student_id, row.signed_name, row.initials, row.emergency_name, row.waiver_version], ['FIFS-1', 'Sam Roe', 'SR', 'Pat Roe', '2026']); assert(row.signed_at, 'dated');
    await W.saveWaiver(db, 'FIFS-1', { studentName: 'Sam R', initials: 'SR', signature: 'Sam R', emergencyContact: 'Pat', emergencyPhone: '1' }); eq(db.t.student_waivers.length, 1, 'one record per student');
    const bad = await W.saveWaiver(fakeDb({ student_waivers: [] }), 'FIFS-1', { studentName: 'Sam' }); assert(!bad.ok && bad.status === 400, 'incomplete');
    const down = await W.saveWaiver(fakeDb({}, { missing: 'student_waivers' }), 'FIFS-1', { studentName: 'Sam', initials: 'S', signature: 'S', emergencyContact: 'P', emergencyPhone: '1' }); assert(!down.ok && /NOT recorded/.test(down.error), 'a missing table is not reported as saved');
  });

  console.log('\n[Wiring]');
  await test('route: invoices are staff only, the payer actions are rate limited and take no amount, the waiver belongs to the signed-in student, and the old 501 is gone', () => {
    const r = read('src/app/api/fifs/route.ts'); const seg = (a) => { const i = r.indexOf(`case '${a}':`); return r.slice(i, i + 1800); };
    assert(/isStaffOrAdmin\(user\)/.test(seg('adminSendInvoice')) && /401/.test(seg('adminSendInvoice')), 'staff only'); assert(/allowPublicSubmit\(req, 'invoicepay'/.test(seg('invoicePayInfo')) && !/payload\??\.(amount|total|price)/.test(seg('invoicePayInfo')), 'payer: limited, no amount taken');
    const wv = seg('studentWaiverStatus'); assert(/getAuthenticatedUser/.test(wv) && /eq\('user_id', user\.id\)/.test(wv) && /saveWaiver\(supabase, String\(me\.student_id\)/.test(wv) && !/payload\.studentId/.test(wv), 'own record only'); assert(/NOT_IMPLEMENTED_ACTIONS: Record<string, string> = \{\};/.test(r), 'no 501 list entry');
  });
  await test('Admin Hub: the button reads Send Invite / Send Invoice, the window can send either, and its totals use the server rule', () => {
    const p = read('src/app/page.tsx'); assert(/SEND INVITE \/ SEND INVOICE/.test(p) && /installAdminInvoice\(\)/.test(p) && /installWaiverGate\(\)/.test(p), 'wired');
    eq(A.parsePrice('$249.99'), 249.99); eq(A.parsePrice('abc'), null); eq(A.parsePrice('6000'), null); eq(A.quote(200), { price: 200, tax: 12, total: 212 }); eq(A.quote(249.99), { price: 249.99, tax: 15, total: 264.99 }); eq(S.priceInvoice(249.99).totalCents, Math.round(A.quote(249.99).total * 100), 'same arithmetic as the server');
    eq(A.courseName('Maryland Wear & Carry (CCW) — Base Track ($199.99)'), 'Maryland Wear & Carry (CCW)'); eq(A.basePrice('Maryland HQL (Purchase License) — Base Track ($100.00)'), 100); eq(A.basePrice('Mid-Atlantic'), null);
    eq(A.validate({ name: 'A', email: 'a@b.co', course: 'x', classDate: '2026-11-14', price: '10' }), null); assert(A.validate({ name: '', email: 'a@b.co', course: 'x', classDate: 'd', price: '1' }) && A.validate({ name: 'A', email: 'bad', course: 'x', classDate: 'd', price: '1' }) && A.validate({ name: 'A', email: 'a@b.co', course: 'x', classDate: '', price: '1' }) && A.validate({ name: 'A', email: 'a@b.co', course: 'x', classDate: 'd', price: '0' }), 'each missing piece is named');
    const m = read('src/portal/adminInvoice.ts'); assert(!/innerHTML/.test(m), 'built with text, not HTML'); assert(/adminSendInvoice/.test(m) && /min-height:44px/.test(m), 'wired, 44px targets');
  });
  await test('waiver gate: opens by itself, cannot be closed until signed, never blocks payment, and does nothing when storage is missing', () => {
    const g = read('src/portal/waiverGate.ts'); assert(/studentWaiverStatus/.test(g) && /locked/.test(g) && /Escape/.test(g) && /closeFifsWaiverModal/.test(g) && /markWaiverCardComplete/.test(g), 'gate parts'); assert(/forcedPasswordResetModal/.test(g), 'the password step comes first'); assert(!/invoice|pay/i.test(g.replace(/markWaiverCardComplete|\/\/.*$/gm, '')), 'invoices and payments are never touched');
    assert(/catch \{ checkedFor = id;/.test(g), 'a failed check never locks anyone out');
  });
  await test('pay page: private (not indexed), only opens Stripe\'s own checkout, slider from 30 to 100, colorful and 44px', () => {
    const l = read('src/app/pay-invoice/layout.tsx'), p = read('src/app/pay-invoice/page.tsx'); assert(/index: false/.test(l), 'noindex'); assert(/checkout\.stripe\.com/.test(p) && /min=\{info\.minPercent\} max=\{100\}/.test(p) && /minHeight: 48/.test(p) && /🧾/.test(p) && !/localStorage|sessionStorage|document\.cookie/.test(p), 'page rules');
  });
  await test('the waiver table script is server only: row security on, no browser access, one row per student', () => {
    const q = read('scripts/sql/20261024_student_waivers.sql'); assert(/enable row level security/.test(q) && /revoke all on public\.student_waivers from anon, authenticated/.test(q) && /student_id text primary key references public\.students/.test(q) && !/serial|storage/i.test(q.replace(/--.*$/gm, '')), 'sql');
  });
  console.log(`\nWaiver + invoices: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
