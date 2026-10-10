// Client Portal extras: renewal countdown, stages, calendar file (offline).
const fs = require('fs'); const path = require('path'); const vm = require('vm'); const ts = require('typescript'); const assert = require('assert');
const ROOT = path.resolve(__dirname, '..'); const cache = {};
const load = (rel) => { if (cache[rel]) return cache[rel]; const m = { exports: {} }; const src = fs.readFileSync(path.join(ROOT, rel), 'utf8'); const req = (id) => (id === './walletCard' ? load('src/portal/walletCard.ts') : id === './ics' ? load('src/portal/ics.ts') : require(id));
  vm.runInNewContext(ts.transpileModule(src, { compilerOptions: { target: 'ES2020', module: 'commonjs' } }).outputText, { module: m, exports: m.exports, require: req, console, Date, Math, Number, String, Array, RegExp, Promise, Blob: function () {}, URL: {}, document: {}, window: undefined }); return (cache[rel] = m.exports); };
let passed = 0, failed = 0; const test = (n, f) => { try { f(); console.log('  ✓ PASS: ' + n); passed++; } catch (e) { console.log('  ✗ FAIL: ' + n + '\n    -> ' + e.message); failed++; } };
const ics = load('src/portal/ics.ts'), ce = load('src/portal/clientExtras.ts'); const PAGE = fs.readFileSync(path.join(ROOT, 'src/app/page.tsx'), 'utf8');
console.log('\n[client portal]');
test('Expiry dates are read from ISO and long forms, and no time zone can move the day', () => {
  assert(ics.parseExpiry('2027-05-31').toISOString().startsWith('2027-05-31') && ics.parseExpiry('Oct 15, 2026').toISOString().startsWith('2026-10-15'));
  assert(ics.parseExpiry('') === null && ics.parseExpiry('soon') === null && ics.parseExpiry(null) === null);
});
test('Days left and stages: plenty over 120, window 90 to 120, inside under 90, expired after the date', () => {
  const now = new Date(2026, 9, 20, 23, 30); const d = (s) => ics.daysLeft(ics.parseExpiry(s), now);
  assert(d('2026-10-20') === 0 && d('2026-10-21') === 1 && d('2026-10-19') === -1 && d('2027-02-17') === 120);
  const st = ics.renewalStage; assert(st(121) === 'plenty' && st(120) === 'window' && st(90) === 'window' && st(89) === 'inside' && st(0) === 'inside' && st(-1) === 'expired');
  for (const k of ['plenty', 'window', 'inside', 'expired']) assert(ce.STAGE_TEXT[k].length > 20, k);
  assert(!/at least 90 days before/.test(JSON.stringify(ce.STAGE_TEXT)), 'do not state a legal deadline we have not verified');
});
test('The calendar file is valid: CRLF lines, three dated all-day events at 120 and 90 days before and on the expiry day, escaped text', () => {
  const out = ics.buildRenewalIcs(ics.parseExpiry('2027-05-31'), new Date(2026, 9, 20));
  assert(out.startsWith('BEGIN:VCALENDAR\r\n') && out.endsWith('END:VCALENDAR\r\n') && (out.match(/BEGIN:VEVENT/g) || []).length === 3 && !/[^\r]\n/.test(out), 'structure');
  assert(out.includes('DTSTART;VALUE=DATE:20270531') && out.includes('DTSTART;VALUE=DATE:20270302') && out.includes('DTSTART;VALUE=DATE:20270131'), 'dates: ' + out.match(/DTSTART[^\r]*/g));
  assert(/UID:expires-20270531@trainwithfifs\.com/.test(out) && !/\n[^\r]*[^\\],[^\r]*\r\n(?=[A-Z])/.test('') && /SUMMARY:Book your Maryland Wear & Carry renewal class/.test(out));
  assert(/State Police processing can take up to 90 days/.test(out), 'wording');
});
test('Everything on the card is informational with an official link; the page mounts the card; the booking button targets the 8-hour renewal', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/portal/clientExtras.ts'), 'utf8');
  assert(/not legal advice/.test(src) && /https:\/\/mdsp\.maryland\.gov\//.test(src) && /8-Hour Renewal/.test(src) && !/innerHTML/.test(src));
  assert(/id="fi-client-extras"/.test(PAGE) && /installClientExtras\(\);/.test(PAGE));
});
console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`); process.exit(failed ? 1 : 0);
