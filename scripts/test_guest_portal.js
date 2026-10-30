// Staff create the Student Portal for a paying guest after a payment recorded by hand: only a paid invoice still on the guest record, the invoice's own email, never a second account,
// the throw-away password never shown or emailed, staff-only on the server, and the Payments screen offers it only where it applies (offline; the database is an in-memory fake).
const fs = require('fs'); const path = require('path'); const Module = require('module'); const assert = require('assert');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const alerts = []; const origLoad = Module._load;
Module._load = function (request, parent, ...rest) {
  if (/\/discord$/.test(request)) return { sendDiscordAlert: async (title, desc) => { alerts.push({ title, desc }); return true; } };
  if (/\/online-email$/.test(request)) return { sendOnlineEmail: async () => { throw new Error('the test must inject its own mailer'); } };
  return origLoad.call(this, request, parent, ...rest);
};
const gp = require(path.join(ROOT, 'src/Lib/server/guest-portal.ts')); const ap = require(path.join(ROOT, 'src/Lib/server/admin-payments.ts'));
Module._load = origLoad;
let passed = 0, failed = 0;
async function test(n, f) { try { await f(); console.log('  ✓ PASS: ' + n); passed++; } catch (e) { console.log('  ✗ FAIL: ' + n + '\n    -> ' + e.message); failed++; } }
function mem({ status = 'PAID', studentId = 'GUEST-CHECKOUT', email = 'Josh.B@Example.com', students = [], clients = [], authExists = false, loadFails = false, studentInsertFails = false } = {}) {
  const t = { students: [...students], clients: [...clients], invoices: [{ invoice_number: 'INV-FI-2026-0162EFD1', status, student_id: studentId, email, course: 'Mid-Atlantic Multi-State Mastery', due_date: '2026-11-14' }] }; const log = { created: [], deleted: [], links: 0 };
  return { t, log, from(table) { const f = []; let op = 'select', vals = null;
    const q = { select: () => q, eq: (c, v) => { f.push((r) => r[c] === v); return q; }, ilike: (c, v) => { f.push((r) => String(r[c]).toLowerCase() === String(v).replace(/\\/g, '').toLowerCase()); return q; }, limit: () => q, insert: (v) => { op = 'insert'; vals = v; return q; }, update: (v) => { op = 'update'; vals = v; return q; },
      maybeSingle: async () => { if (loadFails && table === 'invoices') return { data: null, error: { code: 'x' } }; const r = t[table].filter((x) => f.every((g) => g(x)))[0]; return { data: r ? { ...r } : null, error: null }; },
      then: (res) => { if (op === 'insert') { if (studentInsertFails) return res({ error: { code: 'x' } }); t[table].push({ ...vals }); return res({ error: null }); } if (op === 'update') { t[table].filter((x) => f.every((g) => g(x))).forEach((x) => Object.assign(x, vals)); return res({ error: null }); }
        return res({ data: t[table].filter((x) => f.every((g) => g(x))).map((x) => ({ ...x })), error: null }); } }; return q; },
    auth: { admin: { createUser: async (a) => { if (authExists) return { data: null, error: { message: 'already been registered', code: 'email_exists' } }; log.created.push(a); return { data: { user: { id: 'uuid-josh' } }, error: null }; }, deleteUser: async (id) => { log.deleted.push(id); return {}; }, generateLink: async () => { log.links++; return { data: { properties: { action_link: 'https://trainwithfifs.com/auth?type=recovery&token=abc' } }, error: null }; } } } };
}
const mailer = () => { const sent = []; return { sent, deps: { sendMail: async (to, m) => { sent.push([to, m]); return true; }, siteUrl: () => 'https://trainwithfifs.com' } }; };
const go = (db, o = {}, deps) => gp.createPortalForGuestInvoice(db, { invoiceNumber: 'INV-FI-2026-0162EFD1', fullName: 'Joshua Bowers', phone: '', ...o }, 'kai@trainwithfifs.com', deps);

(async () => {
  console.log('\n[creating the portal for a paying guest]');
  await test('A paid guest invoice gets a sign-in and a Confirmed student record with the name staff typed, the invoice moves onto the student, and the setup link goes to the invoice\'s email (never the password)', async () => {
    const db = mem(); const m = mailer(); const r = await go(db, { phone: '410-555-0100' }, m.deps); assert(r.ok, JSON.stringify(r)); assert(/emailed to josh\.b@example\.com/.test(r.message), r.message);
    const s = db.t.students[0]; assert(s.status === 'CONFIRMED' && s.full_name === 'Joshua Bowers' && s.email === 'josh.b@example.com' && s.phone === '410-555-0100' && s.preferred_dates === '2026-11-14' && /Multi-State/.test(s.course_name) && s.user_id === 'uuid-josh', 'record');
    assert(db.t.invoices[0].student_id === s.student_id && s.student_id !== 'GUEST-CHECKOUT', 'receipt moved to the student'); assert(db.log.created.length === 1 && db.log.created[0].app_metadata.role === 'student' && db.log.created[0].email === 'josh.b@example.com');
    assert(m.sent.length === 1 && m.sent[0][0] === 'josh.b@example.com' && m.sent[0][1].text.includes('type=recovery') && !JSON.stringify(m.sent).includes(db.log.created[0].password), 'link emailed, password never');
    assert(alerts.some((a) => /portal created by hand/i.test(a.title) && /INV-FI-2026-0162EFD1/.test(a.desc) && !/josh\.b/i.test(a.desc)), 'staff note without the email');
  });
  await test('It can only be done once: after it worked the invoice is on a student record, so a second try creates nothing', async () => {
    const db = mem(); const m = mailer(); assert((await go(db, {}, m.deps)).ok); const again = await go(db, {}, m.deps); assert(!again.ok && again.status === 409 && /already on a student/.test(again.message), again.message); assert(db.log.created.length === 1 && db.t.students.length === 1 && m.sent.length === 1);
  });
  await test('Nothing is created for an unpaid invoice (Not paid yet, Issued, Abandoned, Cancelled) or one already on a student record', async () => {
    for (const status of ['PENDING', 'ISSUED', 'ABANDONED', 'CANCELLED']) { const db = mem({ status }); const r = await go(db, {}, mailer().deps); assert(!r.ok && r.status === 409 && /Record the payment first/.test(r.message), status); assert(db.log.created.length === 0 && db.t.students.length === 0); }
    const own = mem({ studentId: 'FIFS-1234' }); const r = await go(own, {}, mailer().deps); assert(!r.ok && r.status === 409 && own.log.created.length === 0);
  });
  await test('Anyone who already has a student record, a client record or a sign-in is left completely alone: no second account, no email', async () => {
    const m = mailer(); for (const db of [mem({ students: [{ id: '1', email: 'JOSH.B@example.com' }] }), mem({ clients: [{ id: '1', email: 'josh.b@example.com' }] }), mem({ authExists: true })]) {
      const r = await go(db, {}, m.deps); assert(!r.ok && r.status === 409 && /already has/.test(r.message), r.message); assert(db.log.created.length === 0 && db.t.invoices[0].student_id === 'GUEST-CHECKOUT'); }
    assert(m.sent.length === 0);
  });
  await test('Bad input is refused before anything is touched: invoice number, a missing or markup name, a junk phone; and the email always comes from the invoice, never from the request', async () => {
    const db = mem(); for (const o of [{ invoiceNumber: 'nope' }, { invoiceNumber: '' }, { fullName: '' }, { fullName: 'J' }, { fullName: '1234' }, { fullName: '<<>>' }, { phone: 'call me' }]) { const r = await go(db, o, mailer().deps); assert(!r.ok && r.status === 400, JSON.stringify(o)); }
    assert(db.log.created.length === 0); const m = mailer(); await go(db, { fullName: 'Joshua <b>Bowers</b>', email: 'attacker@example.com', customer_email: 'attacker@example.com' }, m.deps); assert(m.sent.length === 1 && m.sent[0][0] === 'josh.b@example.com' && db.t.students[0].full_name === 'Joshua b Bowers /b' && !/[<>]/.test(db.t.students[0].full_name), 'name cleaned: ' + db.t.students[0].full_name);
    const none = await go(mem(), { invoiceNumber: 'INV-NOPE-0000' }, mailer().deps); assert(!none.ok && none.status === 404);
  });
  await test('Failures leave nothing half done: a record that cannot be saved removes the sign-in; a database problem creates nothing', async () => {
    const w = console.warn; console.warn = () => {}; try {
      const a = mem({ studentInsertFails: true }); const r = await go(a, {}, mailer().deps); assert(!r.ok && r.status === 503 && a.log.deleted.join() === 'uuid-josh' && a.t.invoices[0].student_id === 'GUEST-CHECKOUT', 'sign-in removed');
      const b = mem({ loadFails: true }); const r2 = await go(b, {}, mailer().deps); assert(!r2.ok && r2.status === 503 && b.log.created.length === 0);
    } finally { console.warn = w; }
  });
  console.log('\n[the screen and the server]');
  await test('The Payments list marks guest bookings, and the screen offers "Create student portal" only on a paid guest booking, with a name field and clear words', () => {
    const rows = ['GUEST-CHECKOUT', 'FIFS-1001', ''].map((id) => ({ guest: id === 'GUEST-CHECKOUT' })); assert(rows[0].guest && !rows[1].guest);
    const src = read('src/Lib/server/admin-payments.ts'); assert(/student_id, email/.test(src) && /guest: String\(r\.student_id \|\| ''\) === 'GUEST-CHECKOUT'/.test(src), 'list marks guests');
    const ui = read('src/portal/AdminPaymentsPanel.tsx'); assert(/detail\.guest && isPaid\(detail\)/.test(ui) && /Create student portal/.test(ui) && /Student full name/.test(ui) && /'adminCreateStudentPortal'/.test(ui) && /gpName\.trim\(\)\.length < 2/.test(ui), 'screen');
    assert(!/innerHTML|dangerouslySetInnerHTML/.test(ui), 'text only'); assert(!/supabase/i.test(ui.split('\n').filter((l) => /portal|Portal/.test(l)).join('\n')), 'visitors never see that word');
  });
  await test('The action is staff-only on the server before the database is touched, rate-limited, and takes the invoice number and the typed name and phone (never an email)', () => {
    const api = read('src/app/api/fifs/route.ts'); const a = api.indexOf("case 'adminCreateStudentPortal':"); assert(a > 0, 'case'); const seg = api.slice(a, a + 1300);
    assert(seg.indexOf('isStaffOrAdmin(user)') > 0 && seg.indexOf('isStaffOrAdmin(user)') < seg.indexOf('getPrivilegedClient()') && /status: 401/.test(seg), 'staff check first'); assert(/allowPublicSubmit\(req, 'guestPortal'/.test(seg), 'rate limit');
    assert(/invoiceNumber: payload\?\.invoiceNumber, fullName: payload\?\.fullName, phone: payload\?\.phone/.test(seg) && !/email/i.test(seg.replace(/String\(user\?\.email/g, '')), 'no email from the request');
  });
  console.log(`\nGuest portal: ${passed} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
})();
