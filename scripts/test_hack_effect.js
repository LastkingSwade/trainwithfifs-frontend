// Guard rules for the homepage "Hack Detected" event (src/hack/*).
const fs = require('fs'); const path = require('path');
const R = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CFG = R('src/hack/hackConfig.ts'), COMP = R('src/hack/HackDetected.tsx'), CSS = R('src/hack/hack.css').replace(/\/\*[\s\S]*?\*\//g, ''), LAYOUT = R('src/app/layout.tsx');
let passed = 0, failed = 0;
function test(n, f) { try { f(); console.log('  ✓ PASS: ' + n); passed++; } catch (e) { console.log('  ✗ FAIL: ' + n + '\n    -> ' + e.message); failed++; } }
function assert(c, m) { if (!c) throw new Error(m || 'assertion failed'); }
const num = (k) => Number((CFG.match(new RegExp(k + ':\\s*([\\d* ]+),')) || [])[1].split('*').reduce((a, b) => a * Number(b), 1));
console.log('\n[hack detected]');
test('Schedule and switches are constants: first run 1 minute after the boot, then every 1 minute, with an env off switch', () => {
  assert(num('firstDelayMs') === 60000 && num('intervalMs') === 60000, 'schedule is not 1 minute');
  assert(/NEXT_PUBLIC_HACK_EFFECT !== 'off'/.test(CFG) && /ENABLED/.test(COMP), 'on/off switch missing');
  assert(/started = true/.test(COMP) && /fifs:boot-complete/.test(COMP), 'clock must start only after the boot intro');
});
test('Sequence timings: message after the scramble, 3 seconds, then the wash, then the all-clear message, then restore', () => {
  assert(num('messageHoldMs') === 3000, 'must hold the message for 3 seconds before the flash');
  assert(/HACK DETECTED\/\/\/\//.test(CFG) && /COUNTERMEASURES EFFECTIVE\/\//.test(CFG), 'messages wrong');
  assert(/hidden\.forEach\(\(el\) => el\.classList\.remove\('hack-hide'\)\)/.test(COMP) && /layer\.remove\(\); flash\.remove\(\); msg\.remove\(\)/.test(COMP), 'restore step missing');
});
test('The flash is a soft brand-colour wash under 3 per second (two slow pulses), with low peak opacity', () => {
  const kf = CSS.match(/@keyframes hackWash \{([\s\S]*?)\}\s*\}/)[1];
  const peaks = [...kf.matchAll(/opacity:\s*([\d.]+)/g)].map((m) => Number(m[1]));
  assert(Math.max(...peaks) <= 0.3, 'wash too strong');
  const pulses = peaks.filter((v, i) => v > 0.1 && (i === 0 || peaks[i - 1] <= 0.1)).length;
  assert(pulses === 2 && num('flashMs') >= 1000, 'pulse count/length: ' + pulses + ' in ' + num('flashMs') + 'ms (limit under 3 per second)');
  assert(/var\(--accent-cyan/.test(CSS) && /var\(--accent-amber/.test(CSS), 'brand colours not used');
});
test('Reduced motion disables it entirely (script never runs, CSS hides it)', () => {
  assert(/prefers-reduced-motion: reduce\)'\)/.test(COMP) && /if \(reduced\.matches\) return;/.test(COMP));
  assert(/prefers-reduced-motion: reduce\) \{[^}]*display: none !important/.test(CSS));
});
test('Never touches inputs, buttons, forms, nav or clickable things; never runs with a modal, a focused field, another page, the boot or a hidden tab', () => {
  for (const k of ['a, button, input, textarea, select, label, nav, form', '[data-onclick]', '.reviews-marquee-box']) assert(COMP.includes(k), 'exclusion missing: ' + k);
  for (const k of ['modalOpen()', 'fieldFocused()', 'homeVisible()', "data-boot", "visibilityState"]) assert(COMP.includes(k), 'guard missing: ' + k);
  assert(/\[role="dialog"\]/.test(COMP), 'dialogs must block it');
});
test('Ends at once on click, tap, Escape, scroll, resize, focusing a field, a modal opening or the tab hiding', () => {
  for (const k of ["'pointerdown', finish", "e.key === 'Escape'", "'scroll', finish", "'resize', finish", "'focusin', onFocus", "'visibilitychange', onVis"]) assert(COMP.includes(k), 'end trigger missing: ' + k);
  assert(!/preventDefault|stopPropagation/.test(COMP), 'must never swallow a click or key');
});
test('The real text is never edited: only a decorative aria-hidden layer is drawn and originals are hidden by colour; a live region explains it', () => {
  assert(!/\.textContent\s*=[^;]*node|node\.textContent\s*=|nodeValue\s*=|innerHTML\s*=/.test(COMP), 'real text must not be rewritten');
  assert(/layer\.setAttribute\('aria-hidden', 'true'\)/.test(COMP) && /role="status" aria-live="polite"/.test(COMP) && /Nothing is wrong with this site/.test(CFG));
  assert(/color: transparent !important/.test(CSS) && !/(^|[;{\s])(display|width|height|margin|padding|font-size|position)\s*:[^;]*;?\s*\}?[^{]*hack-hide/.test(CSS), 'hiding must be by colour only');
});
test('It is styled as a stylized terminal effect and says it is only a visual effect (no browser or OS warning look)', () => {
  assert(/visual effect only/.test(CFG) && /var\(--font-mono/.test(CSS));
  assert(!/virus|infected|malware|your device|call |windows|microsoft|chrome/i.test(CFG + CSS), 'must not look like a real security warning');
});
test('Mounted once in the root layout and only runs on the home page', () => {
  assert((LAYOUT.match(/<HackDetected \/>/g) || []).length === 1);
  assert(/window\.location\.pathname !== '\/'/.test(COMP));
});
console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
process.exit(failed ? 1 : 0);
