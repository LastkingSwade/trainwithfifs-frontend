// Live Online Classroom: price rule, eligibility, switches, session checks, seat claims, and checkout wiring (offline).
const fs = require('fs'); const path = require('path'); const vm = require('vm'); const assert = require('assert'); const ts = require('typescript');
const ROOT = path.resolve(__dirname, '..'); const cache = {};
const load = (rel) => { if (cache[rel]) return cache[rel]; const m = { exports: {} }; const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const req = (id) => (id === '@/Lib/server/online-email' ? load('src/Lib/server/online-email.ts') : id === '@/group/groupCopy' ? load('src/group/groupCopy.ts') : id === '@/Lib/pricing' ? load('src/Lib/pricing.ts') : id === '@/online/onlineCopy' ? load('src/online/onlineCopy.ts') : id === '@/Lib/server/supabase-admin' ? { getPrivilegedClient: () => { throw new Error('no db in tests'); } } : require(id));
  vm.runInNewContext(ts.transpileModule(src, { compilerOptions: { target: 'ES2020', module: 'commonjs' } }).outputText, { module: m, exports: m.exports, require: req, process, console, Date, Math, Number, String, Array, Map, Set, Promise, Error, JSON, RegExp }); return (cache[rel] = m.exports); };
let passed = 0, failed = 0;
async function test(n, f) { try { await f(); console.log('  ✓ PASS: ' + n); passed++; } catch (e) { console.log('  ✗ FAIL: ' + n + '\n    -> ' + e.message); failed++; } }
const CHECKOUT = fs.readFileSync(path.join(ROOT, 'src/Lib/server/booking-checkout.ts'), 'utf8');
const dayAt = (n) => new Date(Date.now() + n * 864e5).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
const CCW = 'Maryland Wear & Carry (CCW) — Base Track ($199.99)';
// A tiny in-memory stand-in for the day tables and the claim function (same rule as the SQL script).
function memDb(seed = {}) {
  const t = { day_claims: [], online_days: [], invoices: [], ...seed }; const rpcCalls = [];
  const rpc = async (fn, a) => { rpcCalls.push(fn);
    if (fn === 'claim_day_mode') { if (t.day_claims.some((c) => c.day === a.p_day && c.mode !== a.p_mode && c.invoice_number !== a.p_invoice)) return { data: false, error: null }; if (!t.day_claims.some((c) => c.day === a.p_day && c.invoice_number === a.p_invoice)) t.day_claims.push({ invoice_number: a.p_invoice, day: a.p_day, mode: a.p_mode, role: a.p_role, attended_at: null, created_at: new Date().toISOString() }); return { data: true, error: null }; }
    if (fn === 'release_day_claims') { t.day_claims = t.day_claims.filter((c) => c.invoice_number !== a.p_invoice || c.attended_at); return { data: null, error: null }; }
    if (fn === 'day_modes') return { data: t.day_claims.filter((c) => c.day >= a.p_from && c.day <= a.p_to).map((c) => ({ day: c.day, mode: c.mode })), error: null };
    return { data: null, error: { message: 'unknown ' + fn } }; };
  const from = (table) => { const rows = () => t[table]; const f = []; let op = 'select', vals = null, ret = false;
    const q = { select: () => { if (op !== 'select') ret = true; return q; }, eq: (c, v) => { f.push((r) => r[c] === v); return q; }, in: (c, vs) => { f.push((r) => vs.includes(r[c])); return q; }, gte: (c, v) => { f.push((r) => r[c] >= v); return q; }, order: () => q,
      update: (v) => { op = 'update'; vals = v; return q; }, upsert: (v) => { op = 'upsert'; vals = v; return q; },
      then: (res) => { if (op === 'upsert') { const i = rows().findIndex((r) => r.day === vals.day); if (i >= 0) Object.assign(rows()[i], vals); else rows().push({ ...vals }); return res({ data: null, error: null }); }
        const hit = rows().filter((r) => f.every((x) => x(r))); if (op === 'update') { hit.forEach((r) => Object.assign(r, vals)); return res({ data: ret ? hit.map((r) => ({ ...r })) : null, error: null }); }
        return res({ data: hit.map((r) => ({ ...r })), error: null }); } };
    return q; };
  return { t, rpcCalls, rpc, from };
}
(async () => {
  const pr = load('src/Lib/pricing.ts'), oc = load('src/Lib/server/online-classroom.ts');
  console.log('\n[live online classroom: always on, calendar days]');
  await test('Price rule: 20% remote-delivery fee, same rate for Standard and VIP, matches the corrected price table to the cent', () => {
    assert(pr.ONLINE_PREMIUM_RATE === 0.20);
    const table = { 'Maryland Multi-State Mastery': [509.99, 713.99], 'Maryland CCW & HQL Combo': [299.99, 419.99], 'Maryland Wear & Carry (CCW)': [239.99, 335.99], 'Maryland Wear & Carry (8-Hour Renewal)': [179.99, 251.99], 'Maryland HQL (Purchase License)': [120.0, 168.0] };
    for (const [name, [std, vip]] of Object.entries(table)) for (const [label, want, track] of [['std', std, ''], ['vip', vip, ' — VIP Turnkey']]) {
      const p = pr.calculatePricingBreakdown(name + track, 1, true, 'live_online');
      assert(p.delivery === 'live_online' && Math.round((p.discountedTuition + p.remoteFee) * 100) === Math.round(want * 100), `${name} ${label}: ${p.discountedTuition} + ${p.remoteFee} != ${want}`);
    }
  });
  await test('In-person prices are exactly as before, and a missing delivery means in person', () => {
    const p = pr.calculatePricingBreakdown('Maryland CCW', 1, false);
    assert(p.grandTotal === 259.69 && p.depositDueNow === 77.91 && p.remoteFee === 0 && p.delivery === 'in_person', JSON.stringify(p));
    assert(JSON.stringify(pr.calculatePricingBreakdown('Maryland CCW', 3, true)) === JSON.stringify(pr.calculatePricingBreakdown('Maryland CCW', 3, true, 'in_person')));
  });
  await test('Courses with no classroom portion never get the fee; groups pay the fee per person and it is not discounted', () => {
    for (const c of ['Personal 1-on-1 Coaching', 'Gun Cleaning & Maintenance', 'FIFS Graduate Alumni Marksmanship Clinic', "Children's Safety Class"]) assert(pr.calculatePricingBreakdown(c, 1, true, 'live_online').remoteFee === 0, c);
    const g = pr.calculatePricingBreakdown('Maryland Wear & Carry (CCW)', 3, true, 'live_online');
    assert(g.remoteFee === 120 && g.discountPercent === 0.10 && g.discountedTuition === 539.97, JSON.stringify(g));
  });
  await test('Always on: all five classes are offered with no admin switch, and nothing else', () => {
    const o = oc.getOnlineOptions();
    assert(o.eligible.slice().sort().join() === 'ccw,combo,hql,mastery,renewal' && o.premiumRate === 0.2, JSON.stringify(o));
  });
  await test('Booking rules: needs the Day 2 box, a Day 1 and a later Day 2 from the calendar, and an eligible class', () => {
    const d1 = dayAt(7), d2 = dayAt(9);
    const ok = oc.planOnlineBooking(CCW, { day1: d1, day2: d2, ack: true }); assert(ok.ok && ok.day1 === d1 && ok.day2 === d2);
    const bad = (sel, course = CCW) => oc.planOnlineBooking(course, sel);
    assert(!bad({ day1: d1, day2: d2, ack: false }).ok, 'ack required');
    assert(!bad({ day1: d1, day2: '', ack: true }).ok && /Day 2/.test(bad({ day1: d1, day2: '', ack: true }).message), 'Day 2 required');
    assert(!bad({ day1: '', day2: d2, ack: true }).ok, 'Day 1 required');
    assert(!bad({ day1: d2, day2: d1, ack: true }).ok && !bad({ day1: d1, day2: d1, ack: true }).ok, 'Day 2 must be after Day 1');
    assert(!bad({ day1: dayAt(-2), day2: dayAt(2), ack: true }).ok, 'past day');
    assert(!bad({ day1: '2026-02-31', day2: d2, ack: true }).ok && !bad({ day1: 'soon', day2: d2, ack: true }).ok, 'impossible or junk dates');
    assert(!bad({ day1: d1, day2: d2, ack: true }, 'Personal 1-on-1 Coaching').ok, 'ineligible course');
  });
  await test('Claims: online = Day 1 web day + Day 2 in-person day; in person = both days in-person; past or junk dates are not claimed', () => {
    assert(JSON.stringify(oc.onlineClaims({ day1: 'A', day2: 'B' })) === JSON.stringify([{ day: 'A', mode: 'online', role: 'day1' }, { day: 'B', mode: 'in_person', role: 'day2' }]));
    const c = oc.inPersonClaims({ day1: dayAt(5), day2: dayAt(6) }); assert(c.length === 2 && c.every((x) => x.mode === 'in_person'));
    assert(oc.inPersonClaims({ day1: dayAt(-5), day2: 'junk' }).length === 0 && oc.inPersonClaims({ day1: dayAt(5), day2: dayAt(5) }).length === 1);
  });
  await test('THE DAY RULE: the first booking decides the day; the other type is refused with a plain message and nothing stays held', async () => {
    const db = memDb(); const d = dayAt(10);
    assert((await oc.claimBookingDays(db, 'INV-1', [{ day: d, mode: 'online', role: 'day1' }], true)).ok, 'first web booking takes the day');
    assert((await oc.claimBookingDays(db, 'INV-2', [{ day: d, mode: 'online', role: 'day1' }], true)).ok, 'a second web booking on a web day is fine');
    const r = await oc.claimBookingDays(db, 'INV-3', [{ day: dayAt(11), mode: 'in_person', role: 'day1' }, { day: d, mode: 'in_person', role: 'day2' }], false);
    assert(!r.ok && r.status === 409 && /live online classroom day, so it cannot be an in-person day/.test(r.message), JSON.stringify(r));
    assert(!db.t.day_claims.some((c) => c.invoice_number === 'INV-3'), 'the earlier claim of a refused booking must be given back');
    const db2 = memDb(); await oc.claimBookingDays(db2, 'INV-A', [{ day: d, mode: 'in_person', role: 'day1' }], false);
    const o = await oc.claimBookingDays(db2, 'INV-B', [{ day: d, mode: 'online', role: 'day1' }], true);
    assert(!o.ok && o.status === 409 && /already an in-person day/.test(o.message), 'an in-person day cannot become a web day');
  });
  await test('Database trouble: online fails closed (503), in person fails open (booking goes on)', async () => {
    const broken = { rpc: async () => ({ data: null, error: { code: '42883', message: 'missing' } }) };
    const w = console.warn; console.warn = () => {};
    try {
      const o = await oc.claimBookingDays(broken, 'INV-9', [{ day: dayAt(3), mode: 'online', role: 'day1' }], true);
      const i = await oc.claimBookingDays(broken, 'INV-9', [{ day: dayAt(3), mode: 'in_person', role: 'day1' }], false);
      assert(!o.ok && o.status === 503 && i.ok, JSON.stringify([o, i]));
    } finally { console.warn = w; }
  });
  await test('Day marks for the calendar: only dates and kinds, junk or oversized ranges return nothing', async () => {
    const db = memDb(); await oc.claimBookingDays(db, 'INV-1', [{ day: dayAt(4), mode: 'online', role: 'day1' }, { day: dayAt(6), mode: 'in_person', role: 'day2' }], true);
    const m = await oc.getDayModes(db, dayAt(0), dayAt(30)); assert(m[dayAt(4)] === 'online' && m[dayAt(6)] === 'in_person' && Object.keys(m).length === 2 && !JSON.stringify(m).includes('INV'));
    assert(Object.keys(await oc.getDayModes(db, 'x', 'y')).length === 0 && Object.keys(await oc.getDayModes(db, dayAt(0), dayAt(900))).length === 0 && Object.keys(await oc.getDayModes({ rpc: () => { throw new Error('down'); } }, dayAt(0), dayAt(5))).length === 0);
  });
  await test('Checkout wiring: rules run before any payment starts, days are held before Stripe and released on failure, ordinary bookings never touch the new columns', () => {
    const iPlan = CHECKOUT.indexOf('planOnlineBooking('), iPrice = CHECKOUT.indexOf("calculatePricingBreakdown(courseSelection, attendees, isPayFull, online"), iClaim = CHECKOUT.indexOf('claimBookingDays('), iStripe = CHECKOUT.indexOf('stripe.checkout.sessions.create');
    assert(iPlan > 0 && iPlan < iPrice && iPrice < iClaim && iClaim < iStripe, 'order: plan, price, claim days, then Stripe');
    assert(/dayClaimsHeld/.test(CHECKOUT) && /releaseDayClaims\(invoiceId\)/.test(CHECKOUT), 'day release missing');
    assert(/\.\.\.\(online \? \{ delivery: 'live_online', day2_ack_at/.test(CHECKOUT), 'new invoice columns must be written only for online bookings');
    assert(/podMember \|\| online \? \{ expires_at/.test(CHECKOUT), 'unpaid online checkouts must expire so days are released');
  });
  await test('The booking form: the 💻 switch sits next to the 👑 box, shown for every eligible class; uses the calendar; Day 2 wording; the fee is its own line', () => {
    const PAGE = fs.readFileSync(path.join(ROOT, 'src/app/page.tsx'), 'utf8'), FORM = fs.readFileSync(path.join(ROOT, 'src/online/onlineForm.ts'), 'utf8'), COPY = fs.readFileSync(path.join(ROOT, 'src/online/onlineCopy.ts'), 'utf8'), SCRIPT = fs.readFileSync(path.join(ROOT, 'public/scripts/TrainWithFIFS_scripts.js'), 'utf8');
    const vip = PAGE.indexOf('id="formBoxVip"'), on = PAGE.indexOf('id="formBoxOnline"');
    assert(vip > 0 && on > vip && on - vip < 2500 && /formBoxOnline" role="switch" aria-checked="false" tabIndex=\{0\} hidden/.test(PAGE), 'switch must follow the VIP box and be accessible');
    assert(/💻 Live Online Classroom/.test(PAGE) && /id="formBreakdownRemoteRow"/.test(PAGE) && /id="onlineDay2Ack"/.test(PAGE) && !/onlineClassroomSession|onlineRangeSession/.test(PAGE), 'no session pickers any more');
    assert(/Day 2 is the hands-on range day/.test(COPY) && /always in person at the range/.test(COPY) && /I understand Day 2 is mandatory, in person, at the range\./.test(COPY) && /In person: best value/.test(COPY) && /Hybrid: Live Online Classroom \+ In-Person Range Day/.test(COPY));
    assert(/calculatePricingBreakdown\(sel, attendees\(\), false, 'live_online'\)/.test(FORM), 'the form must use the same pricing function as the server');
    assert(/onlineEligible\(courseValue\(\)\)/.test(FORM) && /action: 'dayModes'/.test(FORM) && !/onlineOptions|class_sessions/.test(FORM), 'always on: no server switch');
    assert(/window\.__fifsOnline && window\.__fifsOnline\.on/.test(SCRIPT), 'the booking script must use the two-date calendar when online is on');
    assert(/Remote-delivery fee/.test(PAGE) && /Remote-delivery fee/.test(SCRIPT), 'the review step must list the fee in both copies');
    assert(/installOnlineForm\(\);/.test(PAGE));
  });
  await test('Class cards: a 💻 toggle beside Standard / 👑 on the five eligible cards only; priced with the same fee function; starts the form with the matching option', () => {
    const CARDS = fs.readFileSync(path.join(ROOT, 'src/online/onlineCards.ts'), 'utf8'), FORM = fs.readFileSync(path.join(ROOT, 'src/online/onlineForm.ts'), 'utf8');
    assert(/CARD_KEYS = \['mastery', 'combo', 'ccw', 'renewal', 'hql'\]/.test(CARDS) && /remoteFeePerPerson\(base\)/.test(CARDS) && /aria-pressed/.test(CARDS) && /fifsOnlineText/.test(CARDS), 'five cards, shared fee function, accessible, idempotent');
    assert(/installCardToggles\(/.test(FORM) && /onlineEligible\(String\(value\)\)/.test(CARDS), 'selecting from a card sets the form option');
  });
  await test('Admin: meeting link per web day (https only); roster lists emails; attendance only for a booked person', async () => {
    const d = dayAt(8); const db = memDb();
    assert((await oc.adminSetMeetingLink(db, d, 'https://zoom.us/j/123')).ok && db.t.online_days[0].meeting_url === 'https://zoom.us/j/123');
    assert((await oc.adminSetMeetingLink(db, d, '')).ok && db.t.online_days[0].meeting_url === null, 'clearing');
    for (const bad of ['http://zoom.us/j/1', 'javascript:alert(1)', 'zoom.us']) assert(!(await oc.adminSetMeetingLink(db, d, bad)).ok, 'accepted ' + bad);
    assert(!(await oc.adminSetMeetingLink(db, 'nope', 'https://zoom.us/j/1')).ok);
    const db2 = memDb({ day_claims: [{ invoice_number: 'INV-FI-2026-1001', day: d, mode: 'in_person', role: 'day2', attended_at: null, created_at: new Date().toISOString() }], invoices: [{ invoice_number: 'INV-FI-2026-1001', email: 'a@x.com', status: 'PAID' }] });
    assert((await oc.adminMarkAttendance(db2, 'INV-FI-2026-1001', d, true, 'kai@fifs.test')).ok && db2.t.day_claims[0].attended_at && db2.t.day_claims[0].marked_by === 'kai@fifs.test');
    assert((await oc.adminMarkAttendance(db2, 'INV-FI-2026-1001', d, false, 'kai')).ok && db2.t.day_claims[0].attended_at === null);
    assert((await oc.adminMarkAttendance(db2, 'INV-FI-2026-9999', d, true, 'kai')).status === 404 && !(await oc.adminMarkAttendance(db2, 'bad', d, true, 'k')).ok && !(await oc.adminMarkAttendance(db2, 'INV-FI-2026-1001', 'x', true, 'k')).ok && !(await oc.adminMarkAttendance(db2, 'INV-FI-2026-1001', d, 'yes', 'k')).ok);
    const r = await oc.adminDayRoster(db2, d); assert(r.ok && r.people[0].email === 'a@x.com' && !(await oc.adminDayRoster(db2, 'nope')).ok);
    const ov = await oc.adminOnlineOverview(db2); assert(ov.ok && ov.days.length === 1 && ov.days[0].mode === 'in_person' && ov.days[0].bookings === 1);
  });
  await test('Student view: only that student, only paid bookings, link only when paid; the certificate stays locked until Day 2 attendance is recorded', async () => {
    const d1 = dayAt(6), d2 = dayAt(8); const now = new Date().toISOString();
    const mk = (attended) => memDb({
      invoices: [{ invoice_number: 'INV-A', student_id: 'FIFS-1001', status: 'PAID', delivery: 'live_online' }, { invoice_number: 'INV-B', student_id: 'FIFS-1001', status: 'PENDING', delivery: 'live_online' }, { invoice_number: 'INV-C', student_id: 'FIFS-2002', status: 'PAID', delivery: 'live_online' }, { invoice_number: 'INV-D', student_id: 'FIFS-1001', status: 'PAID', delivery: 'in_person' }],
      online_days: [{ day: d1, meeting_url: 'https://zoom.us/j/secret' }],
      day_claims: [{ invoice_number: 'INV-A', day: d1, mode: 'online', role: 'day1', attended_at: null, created_at: now }, { invoice_number: 'INV-A', day: d2, mode: 'in_person', role: 'day2', attended_at: attended ? now : null, created_at: now }, { invoice_number: 'INV-B', day: d1, mode: 'online', role: 'day1', attended_at: null, created_at: now }, { invoice_number: 'INV-C', day: d1, mode: 'online', role: 'day1', attended_at: null, created_at: now }] });
    const db = mk(false); const list = await oc.studentOnlineClasses(db, 'FIFS-1001');
    assert(list.length === 1 && list[0].invoiceNumber === 'INV-A' && list[0].day1.meetingUrl === 'https://zoom.us/j/secret' && list[0].day2.day === d2 && list[0].day2Attended === false, JSON.stringify(list));
    assert(!JSON.stringify(list).includes('INV-C') && !JSON.stringify(list).includes('INV-B'), 'another student or an unpaid booking leaked');
    assert(await oc.day2Pending(db, 'FIFS-1001') === true && await oc.day2Pending(mk(true), 'FIFS-1001') === false && await oc.day2Pending(db, 'FIFS-3003') === false, 'lock: pending until attendance is recorded; students with no online booking are never blocked');
  });
  await test('Route wiring: staff-only actions check the role first; the student action uses only the verified token; day marks are public; the certificate lock sits before the save', () => {
    const ROUTE = fs.readFileSync(path.join(ROOT, 'src/app/api/fifs/route.ts'), 'utf8');
    const at = ROUTE.indexOf("case 'adminOnlineOverview':"); const adminBody = ROUTE.slice(at, ROUTE.indexOf("case 'studentInvoices':", at));
    assert(adminBody.indexOf('isStaffOrAdmin(user)') > 0 && adminBody.indexOf('isStaffOrAdmin(user)') < adminBody.indexOf('getPrivilegedClient()') && /status: 401/.test(adminBody), 'staff check before any database access');
    assert(!/adminSetOnlineCourse|adminSaveSession|adminSessionRoster/.test(ROUTE), 'the old switch and session actions must be gone');
    const st = ROUTE.slice(ROUTE.indexOf("case 'studentOnlineClass':"), ROUTE.indexOf("case 'groupStatus':")); assert(/eq\('user_id', user\.id\)/.test(st) && !/payload\.(studentId|email)/.test(st), 'student found only by the verified user id');
    const edit = ROUTE.slice(ROUTE.indexOf("case 'adminEditStudent':")); assert(edit.indexOf('day2Pending(') > 0 && edit.indexOf('day2Pending(') < edit.indexOf(".from('students')\n         .update"), 'lock must come before the save');
    assert(/CERTIFICATE_AND_LATER = \['STEP_6_CERTIFIED', 'STEP_7_MSP_PORTAL', 'STEP_8_LICENSED'\]/.test(ROUTE));
  });
  await test('The database script: server-only tables, advisory lock per day, no browser access', () => {
    const f = path.join(ROOT, 'docs/supabase/DRAFT-day-modes.sql'); if (!fs.existsSync(f)) return; // local-only file
    const sql = fs.readFileSync(f, 'utf8');
    assert(/pg_advisory_xact_lock/.test(sql) && /enable row level security/i.test(sql) && /revoke all on .*day_claims.* from anon, authenticated/i.test(sql.replace(/\s+/g, ' ')), 'lock and RLS');
  });
  await test('Emails: the confirmation states Day 2 is in person and mandatory, has both dates and the join link; reminders say what to bring; the cron only runs with its secret', () => {
    const em = load('src/Lib/server/online-email.ts'); const d1 = dayAt(6), d2 = dayAt(8);
    const c = em.buildOnlineConfirmation({ name: 'Sam <b>x</b>', course: 'Maryland CCW — VIP Turnkey ($279.99)', day1: d1, day2: d2, meetingUrl: 'https://zoom.us/j/1' });
    for (const k of ['Hybrid: Live Online Classroom + In-Person Range Day', 'IN PERSON', 'mandatory', 'camera that stays on', 'https://zoom.us/j/1', 'certificate']) assert((c.html + c.text).includes(k), 'confirmation missing ' + k);
    assert(!/Turnkey|\$279/.test(c.html + c.text + c.subject) && !c.html.includes('<b>x</b>'), 'wording/escaping');
    assert(/Day 2 is mandatory and in person/.test(em.buildOnlineReminder({ kind: 'range', course: 'Maryland CCW', day2: d2 }).text) && /camera that stays on/.test(em.buildOnlineReminder({ kind: 'classroom', course: 'Maryland CCW', day1: d1 }).text));
    const CRON = fs.readFileSync(path.join(ROOT, 'src/app/api/cron/online-reminders/route.ts'), 'utf8');
    assert(/secret\.length >= 16/.test(CRON) && /timingSafeEqual/.test(CRON) && CRON.indexOf('authorized(req)') < CRON.indexOf('getPrivilegedClient()'), 'cron must refuse before touching the database');
    assert(/"path": "\/api\/cron\/online-reminders"/.test(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8')));
  });
  console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
  process.exit(failed ? 1 : 0);
})();
