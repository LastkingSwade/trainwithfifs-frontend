// Student Portal password after payment (offline): created only after a recorded payment, never for anyone who already has a record or login,
// the booking form no longer asks for a password, no password travels in the booking request, and nothing here can fail a payment.
const fs = require('fs'); const path = require('path'); const vm = require('vm'); const assert = require('assert'); const ts = require('typescript');
const ROOT = path.resolve(__dirname, '..'); const R = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const load = (rel) => { const m = { exports: {} };
  const req = (id) => (id === '@/Lib/config/environment' ? { resolveSiteUrl: () => 'https://trainwithfifs.com' } : id === '@/Lib/server/online-email' ? { sendOnlineEmail: async () => true } : id === '@/group/groupCopy' ? { cleanCourse: (c) => String(c || '').replace(/\s*[—-]\s*(Base Track|VIP Turnkey).*$/i, '') } : require(id));
  vm.runInNewContext(ts.transpileModule(R(rel), { compilerOptions: { target: 'ES2020', module: 'commonjs', esModuleInterop: true } }).outputText, { module: m, exports: m.exports, require: req, process, console, Date, Object, Array, String, Number, Math, Promise, JSON, URL, RegExp }); return m.exports; };
let passed = 0, failed = 0;
async function test(n, f) { try { await f(); console.log('  ✓ PASS: ' + n); passed++; } catch (e) { console.log('  ✗ FAIL: ' + n + '\n    -> ' + e.message); failed++; } }
function mem({ students = [], clients = [], status = 'PAID', authExists = false, studentInsertFails = false, linkFails = false, lookupFails = false } = {}) {
  const t = { students: [...students], clients: [...clients], invoices: [{ invoice_number: 'INV-FI-2026-ABCD', status, student_id: 'GUEST-CHECKOUT' }] }; const log = { created: [], deleted: [], links: 0, insertAttempts: 0 };
  return { t, log,
    from(table) { const f = []; let op = 'select', vals = null; const q = { select: () => q, eq: (c, v) => { f.push((r) => r[c] === v); return q; }, ilike: (c, v) => { f.push((r) => String(r[c]).toLowerCase() === String(v).replace(/\\/g, '').toLowerCase()); return q; }, limit: () => q, insert: (v) => { op = 'insert'; vals = v; return q; }, update: (v) => { op = 'update'; vals = v; return q; },
      maybeSingle: async () => { const r = t[table].filter((x) => f.every((g) => g(x)))[0]; return { data: r ? { ...r } : null, error: null }; },
      then: (res) => { if (lookupFails && table !== 'invoices') return res({ data: null, error: { code: 'x' } });
        if (op === 'insert') { log.insertAttempts++; if (studentInsertFails) return res({ error: { code: '23505' } }); t[table].push({ ...vals }); return res({ error: null }); }
        if (op === 'update') { t[table].filter((x) => f.every((g) => g(x))).forEach((x) => Object.assign(x, vals)); return res({ error: null }); }
        return res({ data: t[table].filter((x) => f.every((g) => g(x))).map((x) => ({ ...x })), error: null }); } }; return q; },
    auth: { admin: { createUser: async (a) => { if (authExists) return { data: null, error: { message: 'A user with this email address has already been registered', code: 'email_exists' } }; log.created.push(a); return { data: { user: { id: 'uuid-new' } }, error: null }; }, deleteUser: async (id) => { log.deleted.push(id); return { error: null }; }, generateLink: async () => { log.links++; return linkFails ? { data: null, error: { message: 'x' } } : { data: { properties: { action_link: 'https://x.supabase.co/auth/v1/verify?token=abc&type=recovery' } }, error: null }; } } } };
}
const session = (over = {}) => ({ customer_email: 'New.Student@Example.com', metadata: { invoiceId: 'INV-FI-2026-ABCD', fullName: 'Sam <b>Lee</b>', phone: '555', courseSelection: 'Maryland CCW — Base Track ($199.99)', preferredDates: 'Sat', ...over } });
(async () => {
  const pa = load('src/Lib/server/portal-access.ts');
  console.log('\n[student portal password after payment]');
  await test('A paid guest gets a sign-in and a student record, the receipt moves to them, and a setup email with a secure link is sent (never the password)', async () => {
    const db = mem(); const sent = []; const r = await pa.ensurePortalAccessAfterPayment(db, session(), { sendMail: async (to, m) => { sent.push([to, m]); return true; }, siteUrl: () => 'https://trainwithfifs.com' });
    assert(r === 'created' && db.log.created.length === 1 && db.log.created[0].email === 'new.student@example.com' && db.log.created[0].email_confirm === true && db.log.created[0].app_metadata.role === 'student');
    const s = db.t.students[0]; assert(s.user_id === 'uuid-new' && /^FIFS-\d{4}$/.test(s.student_id) && s.status === 'CONFIRMED' && s.email === 'new.student@example.com' && s.must_change_password === true);
    assert(db.t.invoices[0].student_id === s.student_id, 'receipt moved from the guest record');
    const [to, mail] = sent[0]; assert(to === 'new.student@example.com' && mail.text.includes('type=recovery') && mail.html.includes('Create my portal password') && !mail.html.includes('<b>Lee</b>'), 'link in the email, name escaped');
    assert(!JSON.stringify(sent).includes(db.log.created[0].password), 'the throw-away password is never emailed');
    assert(db.log.created[0].password.length >= 24, 'strong throw-away password');
  });
  await test('Nothing is created before payment or without a recorded invoice', async () => {
    for (const status of ['PENDING', 'ABANDONED', 'CANCELLED']) { const db = mem({ status }); assert(await pa.ensurePortalAccessAfterPayment(db, session(), { sendMail: async () => true }) === 'skipped-not-paid' && db.log.created.length === 0 && db.t.students.length === 0, status); }
    const db2 = mem(); assert(await pa.ensurePortalAccessAfterPayment(db2, session({ invoiceId: 'INV-FI-2026-ZZZZ' }), {}) === 'skipped-not-paid' && db2.log.created.length === 0);
    assert(await pa.ensurePortalAccessAfterPayment(mem(), session({ invoiceId: 'bad' }), {}) === 'skipped-no-email');
  });
  await test('Anyone who already has a login or a record is left completely alone (no second account, no password change, no email)', async () => {
    const sent = []; const deps = { sendMail: async (...a) => { sent.push(a); return true; } };
    assert(await pa.ensurePortalAccessAfterPayment(mem(), session({ linkedUserId: 'uuid-1' }), deps) === 'skipped-linked');
    const withStudent = mem({ students: [{ id: '1', email: 'NEW.student@example.com' }] }); assert(await pa.ensurePortalAccessAfterPayment(withStudent, session(), deps) === 'skipped-existing' && withStudent.log.created.length === 0);
    const withClient = mem({ clients: [{ id: '1', email: 'new.student@example.com' }] }); assert(await pa.ensurePortalAccessAfterPayment(withClient, session(), deps) === 'skipped-existing' && withClient.log.created.length === 0);
    const withAuth = mem({ authExists: true }); assert(await pa.ensurePortalAccessAfterPayment(withAuth, session(), deps) === 'skipped-existing' && withAuth.t.students.length === 0);
    assert(sent.length === 0, 'no email to people who already have access');
  });
  await test('Failures never leave half an account: no record means the sign-in is removed; a lookup problem creates nothing; a missing link or email still reports created for staff to use Setup link', async () => {
    const w = console.warn; console.warn = () => {};
    try {
      const a = mem({ studentInsertFails: true }); assert(await pa.ensurePortalAccessAfterPayment(a, session(), { sendMail: async () => true }) === 'failed' && a.log.deleted.join() === 'uuid-new', 'sign-in removed');
      const b = mem({ lookupFails: true }); assert(await pa.ensurePortalAccessAfterPayment(b, session(), {}) === 'failed' && b.log.created.length === 0);
      const c = mem({ linkFails: true }); assert(await pa.ensurePortalAccessAfterPayment(c, session(), { sendMail: async () => true }) === 'created' && c.t.students.length === 1);
      const d = mem(); assert(await pa.ensurePortalAccessAfterPayment(d, session(), { sendMail: async () => false }) === 'created');
      assert(await pa.ensurePortalAccessAfterPayment({ from() { throw new Error('down'); } }, session(), {}) === 'failed', 'never throws');
      assert(await pa.ensurePortalAccessAfterPayment(mem(), { customer_email: '', metadata: {} }, {}) === 'skipped-no-email');
    } finally { console.warn = w; }
  });
  await test('The booking form no longer asks for a password, explains the email step, and no password is sent with the booking', () => {
    const PAGE = R('src/app/page.tsx'), JS = R('public/scripts/TrainWithFIFS_scripts.js'), WH = R('src/app/api/stripe/webhook/route.ts');
    assert(!/id="bookingPortalPassword"/.test(PAGE) && !/Optional — or create upon first login/.test(PAGE), 'password box gone');
    assert(/id="bookingPortalNote"/.test(PAGE) && /secure link to create your Student Portal password/.test(PAGE), 'explanation shown');
    assert(!/portalPassword/.test(JS) && !/password: p\.password/.test(JS) && !/bookingPortalPassword/.test(JS), 'no password read or sent by the booking script');
    assert(/ensurePortalAccessAfterPayment\(supabase, session as any\)/.test(WH) && WH.indexOf('sendOnlineConfirmation(supabase, session)') < WH.indexOf('ensurePortalAccessAfterPayment(supabase') && /try \{ await ensurePortalAccessAfterPayment/.test(WH), 'runs after payment is applied, inside try/catch');
  });
  console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
  process.exit(failed ? 1 : 0);
})();
