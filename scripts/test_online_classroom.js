// Live Online Classroom: price rule, eligibility, switches, session checks, seat claims, and checkout wiring (offline).
const fs = require('fs'); const path = require('path'); const vm = require('vm'); const assert = require('assert'); const ts = require('typescript');
const ROOT = path.resolve(__dirname, '..'); const cache = {};
const load = (rel) => { if (cache[rel]) return cache[rel]; const m = { exports: {} }; const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const req = (id) => (id === '@/Lib/server/online-email' ? load('src/Lib/server/online-email.ts') : id === '@/group/groupCopy' ? load('src/group/groupCopy.ts') : id === '@/Lib/pricing' ? load('src/Lib/pricing.ts') : id === '@/online/onlineCopy' ? load('src/online/onlineCopy.ts') : id === '@/Lib/server/supabase-admin' ? { getPrivilegedClient: () => { throw new Error('no db in tests'); } } : require(id));
  vm.runInNewContext(ts.transpileModule(src, { compilerOptions: { target: 'ES2020', module: 'commonjs' } }).outputText, { module: m, exports: m.exports, require: req, process, console, Date, Math, Number, String, Array, Map, Set, Promise, Error, JSON, RegExp }); return (cache[rel] = m.exports); };
let passed = 0, failed = 0;
async function test(n, f) { try { await f(); console.log('  ✓ PASS: ' + n); passed++; } catch (e) { console.log('  ✗ FAIL: ' + n + '\n    -> ' + e.message); failed++; } }
const CHECKOUT = fs.readFileSync(path.join(ROOT, 'src/Lib/server/booking-checkout.ts'), 'utf8');
const ROOM = '11111111-1111-4111-8111-111111111111', RANGE = '22222222-2222-4222-8222-222222222222';
const future = new Date(Date.now() + 7 * 864e5).toISOString(), past = new Date(Date.now() - 864e5).toISOString();
function fakeDb({ enabled = ['ccw'], sessions, enrollments = [], rpc = {} } = {}) {
  const S = sessions || [{ id: ROOM, course_key: 'ccw', kind: 'classroom', delivery: 'live_online', starts_at: future, capacity: 0, is_open: true, meeting_url: 'https://zoom.example/secret' }, { id: RANGE, course_key: 'ccw', kind: 'range', delivery: 'in_person', starts_at: future, capacity: 2, is_open: true }];
  const calls = [];
  return { calls, rpc: async (fn, args) => { calls.push([fn, args]); return rpc[fn] ? rpc[fn](args) : { data: true, error: null }; },
    from: (table) => { const q = { f: {} }; q.select = () => q; q.eq = (c, v) => { q.f[c] = v; return q; }; q.gt = () => q; q.order = () => q; q.in = (c, vals) => { q.f[c + ':in'] = vals; return q; };
      q.maybeSingle = async () => ({ data: table === 'course_settings' ? (enabled.includes(q.f.course_key) ? { online_enabled: true } : { online_enabled: false }) : null, error: null });
      q.then = (res) => { if (table === 'course_settings') return res({ data: enabled.map((k) => ({ course_key: k })), error: null }); if (table === 'class_sessions') return res({ data: q.f['id:in'] ? S.filter((r) => q.f['id:in'].includes(r.id)) : S, error: null }); if (table === 'session_enrollments') return res({ data: enrollments, error: null }); return res({ data: [], error: null }); };
      return q; } };
}
(async () => {
  const pr = load('src/Lib/pricing.ts'), oc = load('src/Lib/server/online-classroom.ts');
  console.log('\n[live online classroom]');
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
  await test('Booking rules: needs the course switch ON, the Day 2 box, a live classroom date and an in-person range date', async () => {
    const ok = await oc.validateOnlineBooking(fakeDb(), 'Maryland Wear & Carry (CCW) — Base Track ($199.99)', { classroomSessionId: ROOM, rangeSessionId: RANGE, ack: true });
    assert(ok.ok && ok.courseKey === 'ccw');
    const bad = async (db, sel, course = 'Maryland Wear & Carry (CCW)') => (await oc.validateOnlineBooking(db, course, sel));
    assert(!(await bad(fakeDb(), { classroomSessionId: ROOM, rangeSessionId: RANGE, ack: false })).ok, 'ack required');
    assert(!(await bad(fakeDb(), { classroomSessionId: ROOM, rangeSessionId: '', ack: true })).ok && /Day 2/.test((await bad(fakeDb(), { classroomSessionId: ROOM, rangeSessionId: '', ack: true })).message), 'range date required');
    assert(!(await bad(fakeDb({ enabled: [] }), { classroomSessionId: ROOM, rangeSessionId: RANGE, ack: true })).ok, 'switch off');
    assert(!(await bad(fakeDb(), { classroomSessionId: ROOM, rangeSessionId: RANGE, ack: true }, 'Personal 1-on-1 Coaching')).ok, 'ineligible course');
    assert(!(await bad(fakeDb(), { classroomSessionId: RANGE, rangeSessionId: ROOM, ack: true })).ok, 'kinds swapped');
    const pastDb = fakeDb({ sessions: [{ id: ROOM, course_key: 'ccw', kind: 'classroom', delivery: 'live_online', starts_at: past, is_open: true }, { id: RANGE, course_key: 'ccw', kind: 'range', delivery: 'in_person', starts_at: future, is_open: true }] });
    assert(!(await bad(pastDb, { classroomSessionId: ROOM, rangeSessionId: RANGE, ack: true })).ok, 'past session');
    const otherCourse = fakeDb({ sessions: [{ id: ROOM, course_key: 'hql', kind: 'classroom', delivery: 'live_online', starts_at: future, is_open: true }, { id: RANGE, course_key: 'ccw', kind: 'range', delivery: 'in_person', starts_at: future, is_open: true }] });
    assert(!(await bad(otherCourse, { classroomSessionId: ROOM, rangeSessionId: RANGE, ack: true })).ok, 'a session for another course');
    assert(!(await bad(fakeDb(), { classroomSessionId: 'not-a-uuid', rangeSessionId: RANGE, ack: true })).ok, 'bad id');
  });
  await test('The public option list needs the switch on AND both a live classroom and a range date, and never contains a meeting link', async () => {
    const o = await oc.getOnlineOptions(fakeDb());
    assert(Object.keys(o.courses).join() === 'ccw' && o.courses.ccw.classroom.length === 1 && o.courses.ccw.range[0].seatsLeft === 2 && o.premiumRate === 0.2);
    assert(!JSON.stringify(o).includes('zoom.example') && !JSON.stringify(o).includes('meeting'), 'a meeting link leaked');
    assert(Object.keys((await oc.getOnlineOptions(fakeDb({ enabled: [] }))).courses).length === 0, 'switch off hides it');
    assert(Object.keys((await oc.getOnlineOptions(fakeDb({ sessions: [] }))).courses).length === 0, 'no dates hides it');
    assert(Object.keys((await oc.getOnlineOptions({ from: () => { throw new Error('tables missing'); } })).courses).length === 0, 'missing tables hide it');
  });
  await test('Seats: remote students hold a range seat like everyone else; a full session holds nothing; failures release', async () => {
    const db = fakeDb(); const r = await oc.claimOnlineSeats(db, 'INV-1', { classroomSessionId: ROOM, rangeSessionId: RANGE });
    assert(r.ok && db.calls.map((c) => c[0] + ':' + c[1].p_kind).join() === 'claim_session_seat:range,claim_session_seat:classroom');
    const full = fakeDb({ rpc: { claim_session_seat: (a) => ({ data: a.p_kind === 'range' ? false : true, error: null }) } });
    const f = await oc.claimOnlineSeats(full, 'INV-2', { classroomSessionId: ROOM, rangeSessionId: RANGE });
    assert(!f.ok && /range day just filled up/.test(f.message) && full.calls.some((c) => c[0] === 'release_session_seats'), 'release after a full range day');
    const half = fakeDb({ rpc: { claim_session_seat: (a) => ({ data: a.p_kind === 'range', error: null }) } });
    assert(!(await oc.claimOnlineSeats(half, 'INV-3', { classroomSessionId: ROOM, rangeSessionId: RANGE })).ok && half.calls.some((c) => c[0] === 'release_session_seats'), 'range seat given back if the classroom is full');
  });
  await test('Checkout wiring: rules run before any payment starts, seats are held before Stripe and released on failure, ordinary bookings never touch the new columns', () => {
    const iVal = CHECKOUT.indexOf('validateOnlineBooking('), iPrice = CHECKOUT.indexOf("calculatePricingBreakdown(courseSelection, attendees, isPayFull, online"), iClaim = CHECKOUT.indexOf('claimOnlineSeats('), iStripe = CHECKOUT.indexOf('stripe.checkout.sessions.create');
    assert(iVal > 0 && iVal < iPrice && iPrice < iClaim && iClaim < iStripe, 'order: validate, price, claim seats, then Stripe');
    assert(/online && onlineSeatsClaimed/.test(CHECKOUT) && /releaseOnlineSeats\(invoiceId\)/.test(CHECKOUT), 'seat release missing');
    assert(/\.\.\.\(online \? \{ delivery: 'live_online', day2_ack_at/.test(CHECKOUT), 'new invoice columns must be written only for online bookings');
    assert(/podMember \|\| online \? \{ expires_at/.test(CHECKOUT), 'unpaid online checkouts must expire so seats are returned');
  });
  await test('The booking form: the 💻 switch sits next to the 👑 box, hidden until the server offers the class; wording says Day 2 is in person; the fee is its own line', () => {
    const PAGE = fs.readFileSync(path.join(ROOT, 'src/app/page.tsx'), 'utf8'), FORM = fs.readFileSync(path.join(ROOT, 'src/online/onlineForm.ts'), 'utf8'), COPY = fs.readFileSync(path.join(ROOT, 'src/online/onlineCopy.ts'), 'utf8'), SCRIPT = fs.readFileSync(path.join(ROOT, 'public/scripts/TrainWithFIFS_scripts.js'), 'utf8');
    const vip = PAGE.indexOf('id="formBoxVip"'), on = PAGE.indexOf('id="formBoxOnline"');
    assert(vip > 0 && on > vip && on - vip < 2500 && /formBoxOnline" role="switch" aria-checked="false" tabIndex=\{0\} hidden/.test(PAGE), 'switch must follow the VIP box, hidden and accessible');
    assert(/💻 Live Online Classroom/.test(PAGE) && /id="formBreakdownRemoteRow"/.test(PAGE) && /id="onlineDay2Ack"/.test(PAGE) && /id="onlineRangeSession"/.test(PAGE));
    assert(/Day 2 is the hands-on range day/.test(COPY) && /always in person at the range/.test(COPY) && /I understand Day 2 is mandatory, in person, at the range\./.test(COPY) && /In person: best value/.test(COPY) && /Hybrid: Live Online Classroom \+ In-Person Range Day/.test(COPY));
    assert(/calculatePricingBreakdown\(sel, n, false, 'live_online'\)/.test(FORM), 'the form must use the same pricing function as the server');
    assert(/available\(\)/.test(FORM) && /\/api\/fifs/.test(FORM) && /onlineOptions/.test(FORM), 'shown only when the server says so');
    assert(/window\.__fifsOnline && window\.__fifsOnline\.on/.test(SCRIPT), 'the live booking script must skip the in-person calendar rule when online is on');
    assert(/Remote-delivery fee/.test(PAGE) && /Remote-delivery fee/.test(SCRIPT), 'the review step must list the fee in both copies');
    assert(/installOnlineForm\(\);/.test(PAGE));
  });
  // ---- admin and student sides, with a small in-memory database ----
  function memDb(seed = {}) {
    const t = { course_settings: [], class_sessions: [], session_enrollments: [], invoices: [], ...seed }; let n = 0;
    return { t, from: (table) => { const rows = t[table]; const f = []; let op = 'select', vals = null, ret = false;
      const q = { select: () => { if (op !== 'select') ret = true; return q; }, eq: (c, v) => { f.push((r) => r[c] === v); return q; }, in: (c, vs) => { f.push((r) => vs.includes(r[c])); return q; }, gt: (c, v) => { f.push((r) => r[c] > v); return q; }, lte: (c, v) => { f.push((r) => r[c] <= v); return q; }, order: () => q,
        insert: (v) => { op = 'insert'; vals = v; return q; }, update: (v) => { op = 'update'; vals = v; return q; }, upsert: (v) => { op = 'upsert'; vals = v; return q; },
        maybeSingle: async () => ({ data: rows.filter((r) => f.every((x) => x(r)))[0] || null, error: null }),
        then: (res) => { if (op === 'insert') { const r = { id: `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`, ...vals }; rows.push(r); return res({ data: ret ? [r] : null, error: null }); }
          if (op === 'upsert') { const i = rows.findIndex((r) => r.course_key === vals.course_key); if (i >= 0) Object.assign(rows[i], vals); else rows.push({ ...vals }); return res({ data: null, error: null }); }
          const hit = rows.filter((r) => f.every((x) => x(r))); if (op === 'update') { hit.forEach((r) => Object.assign(r, vals)); return res({ data: ret ? hit.map((r) => ({ ...r })) : null, error: null }); }
          return res({ data: hit.map((r) => ({ ...r })), error: null }); } };
      return q; } };
  }
  await test('Admin: switches only for the five classroom courses; sessions are validated (kind decides delivery, https meeting link, seat limits)', async () => {
    const db = memDb();
    assert((await oc.adminSetCourseOnline(db, 'ccw', true)).ok && db.t.course_settings[0].online_enabled === true);
    for (const bad of [['alumni', true], ['ccw', 'yes'], ['', true]]) assert(!(await oc.adminSetCourseOnline(db, bad[0], bad[1])).ok, 'accepted ' + bad);
    const base = { courseKey: 'ccw', kind: 'classroom', startsAt: future, capacity: 10, meetingUrl: 'https://zoom.us/j/123' };
    const room = await oc.adminSaveSession(db, base); assert(room.ok && db.t.class_sessions[0].delivery === 'live_online' && db.t.class_sessions[0].meeting_url === 'https://zoom.us/j/123');
    const rng = await oc.adminSaveSession(db, { ...base, kind: 'range', meetingUrl: 'https://zoom.us/j/999' }); assert(rng.ok && db.t.class_sessions[1].delivery === 'in_person' && db.t.class_sessions[1].meeting_url === null, 'a range day is always in person and never carries a link');
    for (const bad of [{ courseKey: 'coaching' }, { kind: 'x' }, { startsAt: 'nope' }, { capacity: -1 }, { capacity: 1.5 }, { capacity: 500 }, { meetingUrl: 'http://zoom.us/j/1' }, { meetingUrl: 'javascript:alert(1)' }]) assert(!(await oc.adminSaveSession(db, { ...base, ...bad })).ok, 'accepted ' + JSON.stringify(bad));
    assert((await oc.adminSaveSession(db, { ...base, id: room.id, capacity: 3 })).ok && db.t.class_sessions[0].capacity === 3, 'edit by id');
    assert(!(await oc.adminSaveSession(db, { ...base, id: '00000000-0000-4000-8000-0000000000ff' })).ok, 'unknown id');
  });
  await test('Attendance and roster: only a seat that exists can be marked; the roster lists emails for staff', async () => {
    const db = memDb({ session_enrollments: [{ invoice_number: 'INV-FI-2026-1001', session_id: RANGE, kind: 'range', attended_at: null }], invoices: [{ invoice_number: 'INV-FI-2026-1001', email: 'a@x.com', status: 'PAID' }] });
    assert((await oc.adminMarkAttendance(db, 'INV-FI-2026-1001', 'range', true, 'kai@fifs.test')).ok && db.t.session_enrollments[0].attended_at && db.t.session_enrollments[0].marked_by === 'kai@fifs.test');
    assert((await oc.adminMarkAttendance(db, 'INV-FI-2026-1001', 'range', false, 'kai')).ok && db.t.session_enrollments[0].attended_at === null);
    assert((await oc.adminMarkAttendance(db, 'INV-FI-2026-9999', 'range', true, 'kai')).status === 404 && !(await oc.adminMarkAttendance(db, 'bad', 'range', true, 'k')).ok && !(await oc.adminMarkAttendance(db, 'INV-FI-2026-1001', 'x', true, 'k')).ok);
    const r = await oc.adminSessionRoster(db, RANGE); assert(r.ok && r.people[0].email === 'a@x.com' && !(await oc.adminSessionRoster(db, 'nope')).ok);
  });
  await test('Student view: only that student, only paid bookings, link only when paid; the certificate stays locked until Day 2 attendance is recorded', async () => {
    const mk = (attended) => memDb({
      invoices: [{ invoice_number: 'INV-A', student_id: 'FIFS-1001', status: 'PAID', delivery: 'live_online' }, { invoice_number: 'INV-B', student_id: 'FIFS-1001', status: 'PENDING', delivery: 'live_online' }, { invoice_number: 'INV-C', student_id: 'FIFS-2002', status: 'PAID', delivery: 'live_online' }, { invoice_number: 'INV-D', student_id: 'FIFS-1001', status: 'PAID', delivery: 'in_person' }],
      class_sessions: [{ id: ROOM, starts_at: future, meeting_url: 'https://zoom.us/j/secret' }, { id: RANGE, starts_at: future, meeting_url: null }],
      session_enrollments: [{ invoice_number: 'INV-A', session_id: ROOM, kind: 'classroom', attended_at: null }, { invoice_number: 'INV-A', session_id: RANGE, kind: 'range', attended_at: attended ? future : null }, { invoice_number: 'INV-B', session_id: ROOM, kind: 'classroom', attended_at: null }, { invoice_number: 'INV-C', session_id: ROOM, kind: 'classroom', attended_at: null }] });
    const db = mk(false); const list = await oc.studentOnlineClasses(db, 'FIFS-1001');
    assert(list.length === 1 && list[0].invoiceNumber === 'INV-A' && list[0].classroom.meetingUrl === 'https://zoom.us/j/secret' && list[0].day2Attended === false, JSON.stringify(list));
    assert(!JSON.stringify(list).includes('INV-C') && !JSON.stringify(list).includes('INV-B'), 'another student or an unpaid booking leaked');
    assert(await oc.day2Pending(db, 'FIFS-1001') === true && await oc.day2Pending(mk(true), 'FIFS-1001') === false && await oc.day2Pending(db, 'FIFS-3003') === false, 'lock: pending until attendance is recorded; students with no online booking are never blocked');
  });
  await test('Route wiring: staff-only actions check the role first; the student action uses only the verified token; the certificate lock sits before the save', () => {
    const ROUTE = fs.readFileSync(path.join(ROOT, 'src/app/api/fifs/route.ts'), 'utf8');
    const at = ROUTE.indexOf("case 'adminOnlineOverview':"); const adminBody = ROUTE.slice(at, ROUTE.indexOf("case 'studentOnlineClass':", at));
    assert(adminBody.indexOf('isStaffOrAdmin(user)') > 0 && adminBody.indexOf('isStaffOrAdmin(user)') < adminBody.indexOf('getPrivilegedClient()') && /status: 401/.test(adminBody), 'staff check before any database access');
    const st = ROUTE.slice(ROUTE.indexOf("case 'studentOnlineClass':"), ROUTE.indexOf("case 'groupStatus':")); assert(/eq\('user_id', user\.id\)/.test(st) && !/payload\.(studentId|email)/.test(st), 'student found only by the verified user id');
    const edit = ROUTE.slice(ROUTE.indexOf("case 'adminEditStudent':")); assert(edit.indexOf('day2Pending(') > 0 && edit.indexOf('day2Pending(') < edit.indexOf(".from('students')\n         .update"), 'lock must come before the save');
    assert(/CERTIFICATE_AND_LATER = \['STEP_6_CERTIFIED', 'STEP_7_MSP_PORTAL', 'STEP_8_LICENSED'\]/.test(ROUTE));
  });
  await test('Emails: the confirmation states Day 2 is in person and mandatory, has both dates and the join link; reminders say what to bring; the cron only runs with its secret', () => {
    const em = load('src/Lib/server/online-email.ts');
    const c = em.buildOnlineConfirmation({ name: 'Sam <b>x</b>', course: 'Maryland CCW — VIP Turnkey ($279.99)', classroomAt: future, rangeAt: future, meetingUrl: 'https://zoom.us/j/1' });
    for (const k of ['Hybrid: Live Online Classroom + In-Person Range Day', 'IN PERSON', 'mandatory', 'camera that stays on', 'https://zoom.us/j/1', 'certificate']) assert((c.html + c.text).includes(k), 'confirmation missing ' + k);
    assert(!/Turnkey|\$279/.test(c.html + c.text + c.subject) && !c.html.includes('<b>x</b>'), 'wording/escaping');
    assert(/Day 2 is mandatory and in person/.test(em.buildOnlineReminder({ kind: 'range', course: 'Maryland CCW', rangeAt: future }).text) && /camera that stays on/.test(em.buildOnlineReminder({ kind: 'classroom', course: 'Maryland CCW', classroomAt: future }).text));
    const CRON = fs.readFileSync(path.join(ROOT, 'src/app/api/cron/online-reminders/route.ts'), 'utf8');
    assert(/secret\.length >= 16/.test(CRON) && /timingSafeEqual/.test(CRON) && CRON.indexOf('authorized(req)') < CRON.indexOf('getPrivilegedClient()'), 'cron must refuse before touching the database');
    assert(/"path": "\/api\/cron\/online-reminders"/.test(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8')));
  });
  console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
  process.exit(failed ? 1 : 0);
})();
