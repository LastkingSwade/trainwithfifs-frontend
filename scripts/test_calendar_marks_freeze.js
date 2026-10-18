/**
 * Regression: the booking-calendar day marks (🏫 / 💻) once froze the whole website for every visitor as soon as the first day was marked in the admin.
 * The page watcher that re-drew the marks reacted to its own marks forever. This guards the two things that fixed it (it is checked in a real browser too).
 */
const fs = require('fs'); const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'src/online/onlineForm.ts'), 'utf8');
let passed = 0, failed = 0;
const test = (name, fn) => { try { fn(); passed++; console.log(`  ✓ PASS: ${name}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${name}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const decorate = src.slice(src.indexOf('const decorate = () => {'), src.indexOf('const render = () => {'));

test('The day-mark watcher is switched off while it draws the marks, then switched back on (even if drawing fails)', () => {
  assert(/const calendarWatcher = new MutationObserver\(\(\) => \{ calendarWatcher\.disconnect\(\); try \{ decorate\(\); \} finally \{ calendarWatcher\.observe\(document\.body, watchOptions\); \} \}\);/.test(src), 'disconnect / decorate / observe in finally');
  assert(/calendarWatcher\.observe\(document\.body, watchOptions\);\s*\n/.test(src), 'it is started once');
  assert(!/new MutationObserver\(\(\) => decorate\(\)\)/.test(src), 'the old self-triggering watcher is gone');
});
test('Marks are reused, not removed and re-added, so redrawing an unchanged calendar changes nothing on the page', () => {
  assert(/const existing = cell\.querySelector\('\.fifs-day-mode'\);/.test(decorate) && /if \(!existing\) cell\.appendChild\(tag\);/.test(decorate), 'reuse');
  assert(!/querySelector\('\.fifs-day-mode'\)\?\.remove\(\);\s*\n\s*cell\.removeAttribute/.test(decorate), 'no unconditional remove before re-adding');
  assert(/if \(!mode\) \{ existing\?\.remove\(\); return; \}/.test(decorate), 'a day that is no longer marked loses its mark');
});
console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`); process.exit(failed ? 1 : 0);
