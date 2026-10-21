/**
 * TrainWithFIFS - "keep people coming back" cards in the Student and Client portals (offline)
 * Help is one tap away; the review ask only goes to people who finished their class; sharing sends only what the person chooses to send; the weekly tip changes
 * each week and is plain safety advice; the class-ready meter is worked out from the student's own record; nothing is stored or tracked.
 */
const fs = require('fs'); const path = require('path');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const L = require(path.join(ROOT, 'src/portal/engageLogic.ts'));
let passed = 0, failed = 0;
const test = async (name, fn) => { try { await fn(); passed++; console.log(`  ✓ PASS: ${name}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${name}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
const PAGE = read('src/app/page.tsx');

(async () => {
  await test('Help: call, text, email and chat for everyone, directions to the range for students; the numbers match the site', () => {
    const s = L.helpLinks('student'), c = L.helpLinks('client');
    eq(s.map((x) => x.label.split(' ')[0]), ['Call', 'Text', 'Email', 'Chat', 'Directions']); eq(c.length, 4, 'clients get no range directions');
    eq(s[0].href, 'tel:+14439901304'); eq(s[1].href, 'sms:+14439901304'); assert(/^mailto:info@trainwithfifs\.com\?subject=/.test(s[2].href), 'mailto'); eq(s[3].action, 'chat'); assert(s[4].external && /google\.com\/maps/.test(s[4].href), 'maps'); eq(L.PHONE, '(443) 990-1304');
    const guide = read('public/FIFS-34-State-Multi-Permit-SOP-Field-Guide.html'); assert(/\(443\) 990-1304/.test(guide) && /info@trainwithfifs\.com/.test(guide), 'same contact details as the Field Guide');
  });
  await test('Wiring: both dashboards have a place for the cards, the greeting reads "Welcome back, Name", it installs once, and nothing is stored or sent', () => {
    assert(/id="eg-student"/.test(PAGE) && /id="eg-client"/.test(PAGE) && /installEngagement\(\)/.test(PAGE), 'hosts + install');
    const st = PAGE.slice(PAGE.indexOf('id="student-active-dashboard"')); assert(st.indexOf('id="eg-student"') > st.indexOf('id="ms-student"'), 'student cards sit at the bottom of the dashboard');
    assert(/Welcome back,\{" "\}\s*\n\s*<span id="dash-student-name"/.test(PAGE) && /Welcome back,\{" "\}\s*\n\s*<span id="dash-client-name"/.test(PAGE), 'space after the comma');
    const src = read('src/portal/engage.ts') + read('src/portal/engageLogic.ts'); assert(!/innerHTML/.test(src) && !/localStorage|sessionStorage|document\.cookie|fetch\(|XMLHttpRequest|sendBeacon/.test(src), 'text only; nothing stored, sent or tracked');
    const css = read('src/portal/dashboard.css'); assert(/\.eg-btn \{[^}]*min-height: 48px/.test(css), '44px+ targets');
  });
  await test('Review ask: students only once they hold their certificate (step 6 on), clients always; the link is the site\'s own Google review link', () => {
    for (const [st, want] of [['PREP_PENDING', false], ['STEP_3_PREPARATION', false], ['STEP_4_CLASSROOM', false], ['LIVE_FIRE_QUALIFICATION', false], ['STEP_6_CERTIFICATE_ISSUED', true], ['MSP_PORTAL_SUBMITTED', true], ['LICENSED_ACTIVE', true], ['COMPLETED', true], ['', false], [undefined, false]]) eq(L.wantsReview('student', st), want, String(st));
    eq(L.wantsReview('client', undefined), true); eq(L.stepFromStatus('whatever'), 1);
    assert(PAGE.includes(L.REVIEW_URL), 'the same review link the website already uses'); eq(L.REVIEW_URL, 'https://share.google/7bGi1FjainNaCUYIl');
    const sc = read('public/scripts/TrainWithFIFS_scripts.js'); const fn = sc.slice(sc.indexOf('function getStepNumberFromStatus')); for (const x of ['STEP_8', 'LICENSED', 'STEP_7', 'CERTIF', 'LIVE_FIRE', 'STEP_3', 'CONFIRM']) assert(fn.slice(0, 700).includes(x) && read('src/portal/engageLogic.ts').includes(x), 'the step rules match the site: ' + x);
  });
  await test('Share: a friendly message with only the website address; sms and email links are encoded; no sender details are added; nothing is sent from the page', () => {
    const s = L.shareLinks(); assert(/^sms:\?&body=/.test(s.sms) && /^mailto:\?subject=/.test(s.email), 'links'); assert(decodeURIComponent(s.sms).includes('https://trainwithfifs.com') && decodeURIComponent(s.email).includes('Coach Kai Wade'), 'content');
    assert(!/[<>"]/.test(s.sms + s.email), 'encoded'); assert(!/discount|free|\$\d/i.test(L.SHARE_TEXT), 'no offers or prices are promised'); assert(!/@/.test(L.SHARE_TEXT), 'no personal details');
    const ui = read('src/portal/engage.ts'); assert(/navigator as any\)\.share/.test(ui) && /clipboard\.writeText/.test(ui), 'native share with copy fallback');
  });
  await test('Tip of the week: the week is the ISO week in Eastern time, the tip changes each Monday and is the same all week, and the tips are plain, unique safety advice with no legal claims', () => {
    const wk = (s) => L.isoWeek(new Date(s)); eq(wk('2026-01-01T17:00:00Z'), { year: 2026, week: 1 }); eq(wk('2026-10-19T17:00:00Z'), { year: 2026, week: 43 }); eq(wk('2026-12-31T17:00:00Z'), { year: 2026, week: 53 }); eq(wk('2027-01-01T17:00:00Z'), { year: 2026, week: 53 }); eq(wk('2027-01-04T17:00:00Z'), { year: 2027, week: 1 });
    const mon = L.tipOfTheWeek(new Date('2026-10-19T14:00:00Z')), sun = L.tipOfTheWeek(new Date('2026-10-25T23:00:00Z')), next = L.tipOfTheWeek(new Date('2026-10-26T14:00:00Z')); eq(mon.tip, sun.tip, 'same all week'); assert(next.tip !== mon.tip, 'a new tip on Monday');
    eq(L.tipOfTheWeek(new Date('2026-10-26T03:59:00Z')).tip, mon.tip, 'still last week before Monday midnight Eastern'); eq(L.tipOfTheWeek(new Date('2026-10-26T04:01:00Z')).tip, next.tip, 'new week right after Monday midnight Eastern');
    eq(new Set(L.TIPS).size, L.TIPS.length, 'unique'); assert(L.TIPS.length >= 20, 'enough that they do not repeat for months'); for (const t of L.TIPS) { assert(t.length > 20 && t.length <= 230 && /[.!]$/.test(t), t); assert(!/felony|illegal|it is a crime|by law|must by|guarantee/i.test(t), 'no legal claims: ' + t); assert(!/serial|where you keep|home storage record/i.test(t), 'no storage record talk: ' + t); }
    const seen = new Set(); for (let i = 0; i < 26; i++) seen.add(L.tipOfTheWeek(new Date(Date.UTC(2026, 0, 5 + i * 7, 15))).index); eq(seen.size, 26, 'a full cycle shows every tip once');
  });
  await test('Class-ready meter: date, preparation checklist, payment (only when there is a booking) and the saved app are worked out from the student\'s own record; shown only before the range day', () => {
    const f = (o) => L.readiness({ classDate: 'Saturday, Nov 7 at 9:00 AM', prepTasks: { transport_law: true, ammo_acquired: true, eye_ear_pro: true, id_ready: true }, balanceOwed: 0, installed: true, ...o });
    let r = f({}); eq(r.done, 4); eq(r.total, 4); eq(r.items.every((i) => i.done), true);
    r = f({ classDate: 'To Be Scheduled' }); eq(r.items[0].done, false); eq(r.done, 3); assert(/Message Coach Kai/.test(r.items[0].hint), 'hint'); for (const d of ['Upcoming Cohort', '', undefined, null, 'TBD']) eq(f({ classDate: d }).items[0].done, false, String(d));
    r = f({ prepTasks: { transport_law: true, ammo_acquired: false, eye_ear_pro: true, id_ready: true } }); eq(r.items[1].done, false); eq(f({ prepTasks: null }).items[1].done, false); eq(f({ prepTasks: {} }).items[1].done, false);
    r = f({ balanceOwed: 74.2 }); eq(r.items.find((i) => i.key === 'payment').done, false); r = f({ balanceOwed: null }); eq(r.total, 3, 'no payment line when there is no booking on record'); assert(!r.items.some((i) => i.key === 'payment'));
    r = f({ installed: false }); eq(r.items.find((i) => i.key === 'app').done, false);
    for (const [st, want] of [['PREP_PENDING', true], ['STEP_2_CONFIRMED', true], ['STEP_4_CLASSROOM', true], ['STEP_5_LIVE_FIRE', false], ['STEP_6_CERTIFICATE', false], ['LICENSED', false]]) eq(L.showReadiness(st), want, st);
    const ui = read('src/portal/engage.ts'); assert(/callFifsBackend\('studentInvoices'/.test(ui) && /display-mode: standalone/.test(ui) && /aria-valuenow/.test(ui), 'built from the record, accessible'); assert(/id="eg-ready"/.test(PAGE), 'host near the top of the student dashboard');
  });
  await test('Payment-received notice: shown for a week after an in-person payment was recorded, says what was received and what is left, and is quiet otherwise', () => {
    const now = new Date('2026-10-21T15:00:00Z'); const row = (o = {}) => ({ invoiceNumber: 'INV-1', status: 'Paid in full', balance: 0, inPerson: [{ amount: 175, method: 'Cash', date: '2026-10-20', recordedAt: '2026-10-20T16:00:00Z' }], ...o });
    let n = L.paymentNotices([row()], now); eq(n.length, 1); assert(/\$175\.00 cash payment \(Oct 20, 2026\) was recorded/.test(n[0].text) && /paid in full/.test(n[0].text), n[0].text);
    n = L.paymentNotices([row({ status: 'Deposit paid', balance: 75 })], now); assert(/remaining balance is \$75\.00/.test(n[0].text), n[0].text);
    eq(L.paymentNotices([row({ inPerson: [{ amount: 175, method: 'Cash', date: '2026-10-01', recordedAt: '2026-10-01T16:00:00Z' }] })], now).length, 0, 'older than a week is quiet'); eq(L.paymentNotices([row({ inPerson: [] })], now).length, 0); eq(L.paymentNotices(null, now).length, 0); eq(L.paymentNotices([row({ inPerson: [{ amount: 1, method: 'Cash', date: '', recordedAt: 'junk' }] })], now).length, 0, 'bad dates are ignored');
    eq(L.paymentNotices([row({ inPerson: [{ amount: 1, method: 'Cash', date: '', recordedAt: '2027-01-01T00:00:00Z' }] })], now).length, 0, 'a future time is ignored');
    const ui = read('src/portal/engage.ts'); assert(/callFifsBackend\('studentInvoices'/.test(ui) && /id="eg-notice"/.test(PAGE) && /role', 'status'/.test(ui), 'wired and announced'); assert(!/localStorage|sessionStorage/.test(ui), 'nothing stored');
  });
  await test('The balance line never says "Paid in full" while money is still owed, and the pay card has no tall empty gap on phones', async () => {
    const f = (o) => L.readiness(Object.assign({ hasDate: true, tasksDone: 0, tasksTotal: 4, balanceOwed: 175, appInstalled: false }, o));
    const owing = f({}).items.find((i) => i.key === 'payment'); assert(owing && owing.done === false && !/^paid in full/i.test(owing.label), 'label says paid while owing: ' + (owing && owing.label));
    assert(/@media \(max-width: 640px\) \{ \.pay-banner \{[^}]*\} \.pay-copy \{ flex: 0 0 auto; \}/.test(read('src/portal/dashboard.css')), 'the stacked pay card must not give its text a 260px height');
  });
  console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`); process.exit(failed ? 1 : 0);
})();
