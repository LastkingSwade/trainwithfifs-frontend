// Permit-expiry reminder emails: the reminder dates, the email wording and escaping, and the cron's safety rules (offline).
const fs = require('fs'); const path = require('path'); const vm = require('vm'); const assert = require('assert'); const ts = require('typescript');
const ROOT = path.resolve(__dirname, '..'); const cache = {};
const load = (rel, mocks = {}) => { const m = { exports: {} }; const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const req = (id) => (mocks[id] ? mocks[id] : id === '@/group/groupCopy' ? { RANGE_LOCATION: "Cindy's Hot Shots" } : require(id));
  vm.runInNewContext(ts.transpileModule(src, { compilerOptions: { target: 'ES2020', module: 'commonjs', esModuleInterop: true } }).outputText, { module: m, exports: m.exports, require: req, process, console, Date, Math, Number, String, Array, Map, Set, Promise, Error, JSON, RegExp, Buffer }); return m.exports; };
let passed = 0, failed = 0;
async function test(n, f) { try { await f(); console.log('  ✓ PASS: ' + n); passed++; } catch (e) { console.log('  ✗ FAIL: ' + n + '\n    -> ' + e.message); failed++; } }
(async () => {
  console.log('\n[permit-expiry reminders]');
  const pe = load('src/Lib/server/permit-email.ts');
  await test('Reminders go out 120, 90, 30 and 7 days before expiry, and date math has no off-by-one across month and year ends', () => {
    assert(pe.REMINDER_DAYS.join() === '120,90,30,7');
    assert(pe.addDays('2026-12-25', 7) === '2027-01-01' && pe.addDays('2026-02-20', 10) === '2026-03-02' && pe.addDays('2028-02-20', 10) === '2028-03-01' && pe.addDays('2026-10-09', 0) === '2026-10-09');
  });
  await test('The email names the date and days left, links the official page, says how to stop, and escapes names', () => {
    for (const n of [120, 90, 30, 7]) {
      const m = pe.buildPermitReminder({ name: 'Sam <b>x</b> Lee', expiresOn: '2027-02-05', daysLeft: n });
      const all = m.html + m.text + m.subject;
      assert(all.includes('February 5, 2027') && all.includes(String(n)) && m.text.includes('mdsp.maryland.gov') && /turn off reminders/.test(m.text) && m.text.startsWith('Hi Sam,'), 'day ' + n);
      assert(!m.html.includes('<b>x</b>'), 'escaping');
      assert(!/guarantee|legally required|you must renew/i.test(all), 'no legal promises');
    }
    assert(pe.buildPermitReminder({ expiresOn: '2027-02-05', daysLeft: 30 }).text.startsWith('Hi,'));
  });
  await test('The daily job refuses without the secret before touching the database, only emails opted-in clients on a reminder date, and never repeats', async () => {
    const src = fs.readFileSync(path.join(ROOT, 'src/app/api/cron/permit-reminders/route.ts'), 'utf8');
    assert(/secret\.length >= 16/.test(src) && /timingSafeEqual/.test(src) && src.indexOf('authorized(req)') < src.indexOf('getPrivilegedClient()'));
    assert(/\.eq\('opt_in_reminder', true\)/.test(src) && /\.eq\('expiration_date', day\)/.test(src), 'opted-in and exact date only');
    const sentTo = []; const queries = [];
    const mk = (rows) => ({ getPrivilegedClient: () => ({ from: () => { const f = {}; const q = { select: () => q, eq: (c, v) => { f[c] = v; return q; }, then: (res) => { queries.push({ ...f }); return res({ data: rows.filter((r) => r.expiration_date === f.expiration_date && r.opt_in_reminder === f.opt_in_reminder), error: null }); } }; return q; } }) });
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    const rows = [{ email: 'a@x.com', full_name: 'A', expiration_date: pe.addDays(today, 30), opt_in_reminder: true }, { email: 'b@x.com', full_name: 'B', expiration_date: pe.addDays(today, 30), opt_in_reminder: false }, { email: 'c@x.com', full_name: 'C', expiration_date: pe.addDays(today, 31), opt_in_reminder: true }, { email: '', full_name: 'D', expiration_date: pe.addDays(today, 7), opt_in_reminder: true }, { email: 'e@x.com', full_name: 'E', expiration_date: pe.addDays(today, 90), opt_in_reminder: true }];
    const route = load('src/app/api/cron/permit-reminders/route.ts', { 'next/server': { NextResponse: { json: (b, i) => ({ body: b, status: (i && i.status) || 200 }) } }, '@/Lib/server/supabase-admin': mk(rows), '@/Lib/server/online-email': { sendOnlineEmail: async (to) => { sentTo.push(to); return true; } }, '@/Lib/server/permit-email': pe, crypto: require('crypto') });
    process.env.CRON_SECRET = 'x'.repeat(24);
    const call = (auth) => route.GET({ headers: { get: (k) => (k === 'authorization' ? auth : null) } });
    assert((await call('Bearer wrong')).status === 401 && (await call('')).status === 401 && sentTo.length === 0 && queries.length === 0, 'refused without the secret');
    const ok = await call('Bearer ' + 'x'.repeat(24));
    assert(ok.status === 200 && ok.body.sent === 2 && sentTo.sort().join() === 'a@x.com,e@x.com', JSON.stringify([ok.body, sentTo]));
    assert(queries.length === 4, 'one query per reminder date');
  });
  await test('Schedule is registered and no database change is needed', () => {
    const v = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
    assert(v.crons.some((c) => c.path === '/api/cron/permit-reminders') && v.crons.some((c) => c.path === '/api/cron/online-reminders'));
  });
  console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
  process.exit(failed ? 1 : 0);
})();
