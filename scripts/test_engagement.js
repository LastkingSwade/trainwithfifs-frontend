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
  console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`); process.exit(failed ? 1 : 0);
})();
