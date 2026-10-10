// UX polish batches (IDs in docs/UX-BACKLOG.md): rules that must keep holding. Offline source checks.
const fs = require('fs'); const path = require('path');
const R = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CSS = R('src/polish/polish.css'), TS = R('src/polish/polish.ts'), PAGE = R('src/app/page.tsx'), LAYOUT = R('src/app/layout.tsx'), PREFS = R('src/portal/prefs.ts');
let passed = 0, failed = 0;
function test(n, f) { try { f(); console.log('  ✓ PASS: ' + n); passed++; } catch (e) { console.log('  ✗ FAIL: ' + n + '\n    -> ' + e.message); failed++; } }
function assert(c, m) { if (!c) throw new Error(m || 'assertion failed'); }
console.log('\n[ux polish]');
test('Batch 1: stable calendar, panel fade, anchor offset, shake, line length, tap targets, reduced motion', () => {
  assert(/#bookingCalDaysGrid \{ min-height: 312px; \}/.test(CSS) && /\[id\^="view-"\]:not\(\.hidden\) \{ animation: fifsPanelIn 180ms/.test(CSS) && /scroll-margin-top: 72px/.test(CSS));
  assert(/user-invalid[^{]*\{ animation: fifsShake 200ms/.test(CSS) && /max-width: 68ch/.test(CSS) && /pointer: coarse\) \{[^}]*min-height: 44px/.test(CSS));
  assert(/prefers-reduced-motion: reduce\) \{[\s\S]*animation-duration: 0\.01ms !important/.test(CSS), 'global reduced-motion rule');
  for (const k of ['fifsPanelIn', 'fifsShake', 'fifsSpin']) { const at = CSS.indexOf('@keyframes ' + k); assert(at > 0, k); assert(/prefers-reduced-motion: no-preference\) \{[^@]*@keyframes/.test(CSS.slice(Math.max(0, at - 200), at + 20)) || CSS.slice(0, at).lastIndexOf('no-preference') > CSS.slice(0, at).lastIndexOf('\n}\n'), k + ' must sit behind no-preference'); }
});
test('Batch 2: focus rings, live regions, text size (remembered, allow-listed), print rules', () => {
  assert(/:where\(a, button, input, select, textarea, summary, \[tabindex\]\):focus-visible \{ outline: 2px solid/.test(CSS));
  assert(/'\.status-msg'/.test(TS) && /aria-live', 'polite'/.test(TS), 'status messages are live regions');
  assert(/textSize: \['normal', 'large', 'larger'\]/.test(PREFS) && /setPref\('textSize'/.test(TS) && /html\[data-text="large"\] body \{ zoom: 1\.12; \}/.test(CSS));
  assert(/@media print/.test(CSS) && /\.floating-comm-bubble/.test(CSS.slice(CSS.indexOf('@media print'))));
});
test('Batch 3: back to top, Book-a-class shortcut (dismissible, once per visit, home only), focus return, offline notice', () => {
  assert(/Back to top/.test(TS) && /1\.5/.test(TS) && /sessionStorage/.test(TS) && /fifs\.stickyBook/.test(TS) && /Hide this shortcut/.test(TS) && /in-home/.test(TS), 'shortcut and back-to-top');
  assert(/try \{[^}]*sessionStorage[^}]*\} catch/.test(TS.replace(/\n/g, ' ')), 'storage in try/catch');
  assert(/o\.focus\(\{ preventScroll: true \}\)/.test(TS) && /goal-modal-overlay/.test(TS), 'focus returns to the opener');
  assert(/fifs-offline/.test(TS) && /role', 'status'/.test(TS), 'offline notice');
  assert(/body\.modal-open \.fifs-float/.test(CSS), 'floating controls hide while a pop-up is open');
});
test('Batch 4: skeleton while receipts load, lazy images, caret color, tap feedback never blocks a click, haptics respect reduced motion', () => {
  assert(/fifs-skel/.test(R('src/portal/studentExtras.ts')), 'student skeleton');
  assert(/caret-color: var\(--accent-cyan/.test(CSS));
  const busy = TS.slice(TS.indexOf('#5 the booking'), TS.indexOf('#44 a tiny tap'));
  assert(/fifs-busy/.test(busy) && !/preventDefault|stopPropagation|disabled|pointer-events/.test(busy), 'the busy spinner must never block or alter the click');
  assert(/reduce\(\) \|\| typeof navigator\.vibrate/.test(TS), 'haptics respect reduced motion');
  assert((PAGE.match(/loading="lazy" decoding="async"/g) || []).length >= 23, 'below-the-fold images are lazy and async');
  const hero = PAGE.slice(PAGE.indexOf('className="hero-bg-artwork"') - 200, PAGE.indexOf('className="hero-bg-artwork"') + 700); assert(!/loading="lazy"/.test(hero), 'the hero image must stay eager (it is the main picture)');
});
test('Weight: the favicon is a small PNG (it was a 4.9 MB picture), the old file is gone, and polish is wired in once', () => {
  assert(fs.existsSync(path.join(__dirname, '..', 'src/app/icon.png')) && !fs.existsSync(path.join(__dirname, '..', 'src/app/icon.ico')));
  assert(fs.statSync(path.join(__dirname, '..', 'src/app/icon.png')).size < 30 * 1024, 'icon must stay under 30 KB');
  assert((PAGE.match(/installPolish\(\);/g) || []).length === 1 && /polish\/polish\.css/.test(LAYOUT));
});
test('No new dependency and no new network call: the polish module imports only the prefs helper', () => {
  assert(/^import [^\n]+ from '\.\.\/portal\/prefs';$/m.test(TS) && (TS.match(/^import /gm) || []).length === 1 && !/fetch\(|XMLHttpRequest|new WebSocket/.test(TS));
  const pkg = JSON.parse(R('package.json')); assert(Object.keys(pkg.dependencies).join() === '@supabase/ssr,@supabase/supabase-js,next,postcss,react,react-dom,stripe', 'dependencies must not change');
});
console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
process.exit(failed ? 1 : 0);
