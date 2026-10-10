// Live Online Classroom: price rule, eligibility, switches, session checks, seat claims, and checkout wiring (offline).
const fs = require('fs'); const path = require('path'); const vm = require('vm'); const assert = require('assert'); const ts = require('typescript');
const ROOT = path.resolve(__dirname, '..'); const cache = {};
const load = (rel) => { if (cache[rel]) return cache[rel]; const m = { exports: {} }; const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const req = (id) => (id === '@/Lib/pricing' ? load('src/Lib/pricing.ts') : id === '@/Lib/server/supabase-admin' ? { getPrivilegedClient: () => { throw new Error('no db in tests'); } } : require(id));
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
  console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
  process.exit(failed ? 1 : 0);
})();
