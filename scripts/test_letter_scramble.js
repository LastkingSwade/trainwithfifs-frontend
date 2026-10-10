// Guard rules for the homepage letter scramble (src/scramble/*): schedule, safety, reduced motion, no interference with Hack Detected (offline).
const fs = require('fs'); const path = require('path');
const R = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CFG = R('src/scramble/scrambleConfig.ts'), COMP = R('src/scramble/LetterScramble.tsx'), CSS = R('src/scramble/scramble.css').replace(/\/\*[\s\S]*?\*\//g, ''), LAYOUT = R('src/app/layout.tsx'), HACK = R('src/hack/HackDetected.tsx');
let passed = 0, failed = 0;
function test(n, f) { try { f(); console.log('  ✓ PASS: ' + n); passed++; } catch (e) { console.log('  ✗ FAIL: ' + n + '\n    -> ' + e.message); failed++; } }
function assert(c, m) { if (!c) throw new Error(m || 'assertion failed'); }
const num = (k) => Number((CFG.match(new RegExp(k + ':\\s*([\\d.* ]+),')) || [])[1].split('*').reduce((a, b) => a * Number(b), 1));
console.log('\n[letter scramble]');
test('Schedule: plays after 10 seconds of inactivity, lasts 1 second, repeats every 10 seconds while the visitor stays idle, tunable constants, shared off switch', () => {
  assert(num('idleMs') === 10000 && num('repeatMs') === 10000 && num('durationMs') === 1000, 'schedule');
  assert(num('tickMs') >= 50 && num('tickMs') <= 120 && num('share') > 0 && num('share') < 1, 'speed or share');
  assert(/NEXT_PUBLIC_HACK_EFFECT !== 'off'/.test(CFG) && /SCRAMBLE\.ENABLED/.test(COMP), 'off switch');
  assert(!/\b\d{4,5}\b/.test(COMP), 'no loose timing numbers in the component');
});
test('Inactivity: any touch, click, key, wheel, scroll or mouse move restarts the quiet period, and a touch, click, key or scroll cancels a playing scramble at once', () => {
  for (const k of ['pointerdown', 'touchstart', 'keydown', 'wheel', 'scroll']) { assert(new RegExp("CANCEL = \\[[^\\]]*'" + k + "'").test(COMP), 'cancel on ' + k); assert(new RegExp("ACTIVITY = \\[[^\\]]*'" + k + "'").test(COMP), 'activity ' + k); }
  assert(/ACTIVITY = \[[^\]]*'pointermove'/.test(COMP) && !/CANCEL = \[[^\]]*'pointermove'/.test(COMP), 'mouse movement counts as activity but does not cancel');
  assert(/now - lastActivity < SCRAMBLE\.idleMs/.test(COMP) && /for \(const ev of CANCEL\) window\.addEventListener\(ev, stop/.test(COMP));
});
test('Starts only after the boot intro, counts only while the tab is visible, and plays on the home page only', () => {
  assert(/started = true/.test(COMP) && /fifs:boot-complete/.test(COMP) && /document\.visibilityState !== 'visible'/.test(COMP) && /pathname !== '\/'/.test(COMP) && /homeVisible\(\)/.test(COMP));
});
test('Random: a random share of the words, different each time, always at least one; only letters and digits change, punctuation stays', () => {
  assert(/Math\.random\(\) < SCRAMBLE\.share/.test(COMP) && /chosen\.push\(found\[Math\.floor\(Math\.random\(\) \* found\.length\)\]\)/.test(COMP));
  assert(/replace\(\/\[A-Za-z0-9\]\/g/.test(COMP));
});
test('Hiding a block by colour never loses words: every word of a touched block is redrawn, only the chosen ones scrambled', () => {
  assert(/parents\.has\(w\.parent\)/.test(COMP) && /live \? scrambleText\(w\.text\) : w\.text/.test(COMP) && /if \(w\.live\)/.test(COMP));
});
test('Styles are copied as plain text while collecting (a live computed style would report the hidden colour)', () => {
  assert(/css: `font:/.test(COMP) && !/\bcs: CSSStyleDeclaration\b/.test(COMP));
});
test('A focused field blocks the effect only when it is really showing', () => {
  assert(/a\.matches\(FIELDS\) && isShown\(a\)/.test(COMP));
});
test('Safe: never touches controls, forms, links or pop-ups; stops on click, key, scroll, resize, focus in a field or a hidden tab; the page text itself never changes', () => {
  for (const k of ['a, button, input, textarea, select, label, nav, form', '[data-onclick]', '.hack-layer', '.boot-intro']) assert(COMP.includes(k), 'INTERACTIVE missing ' + k);
  for (const k of ["'pointerdown'", "'keydown'", "'scroll'", "'resize'", "'visibilitychange'"]) assert(COMP.includes(k), 'stop trigger ' + k);
  assert(/modalOpen\(\) \|\| fieldFocused\(\)/.test(COMP) && /aria-hidden', 'true'/.test(COMP), 'pop-ups, fields, hidden from assistive tech');
  assert(!/\.textContent\s*=\s*(?!scrambleText)[^;]*(parent|node)/.test(COMP) && /classList\.add\('scr-hide'\)/.test(COMP) && /classList\.remove\('scr-hide'\)/.test(COMP), 'originals are hidden by colour only and restored');
});
test('Reduced motion: it never runs and the layer is hidden by CSS', () => {
  assert(/prefers-reduced-motion: reduce\)'\)\.matches\) return;/.test(COMP) && /prefers-reduced-motion: reduce\) \{ \.scr-layer \{ display: none !important; \} \}/.test(CSS));
});
test('Hack Detected and the scramble never overlap: each waits while the other is on screen', () => {
  assert(/querySelector\('\.hack-layer'\)/.test(COMP) && /querySelector\('\.scr-layer'\)/.test(HACK));
});
test('Mounted once in the layout, pointer events pass through the layer', () => {
  assert((LAYOUT.match(/<LetterScramble \/>/g) || []).length === 1 && /pointer-events: none/.test(CSS.split('.scr-word')[0]) && /\.scr-word \{[^}]*pointer-events: none/.test(CSS));
});
console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
process.exit(failed ? 1 : 0);
