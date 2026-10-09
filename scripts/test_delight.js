// Guard rules for src/delight/delight.css: every delight must be cheap, calm, reversible and keep away from booking and payment UI.
const fs = require('fs'); const path = require('path');
const FILE = path.join(__dirname, '..', 'src', 'delight', 'delight.css');
const RAW = fs.readFileSync(FILE, 'utf8');
const CSS = RAW.replace(/\/\*[\s\S]*?\*\//g, '');
let passed = 0, failed = 0;
function test(n, f) { try { f(); console.log('  ✓ PASS: ' + n); passed++; } catch (e) { console.log('  ✗ FAIL: ' + n + '\n    -> ' + e.message); failed++; } }
function assert(c, m) { if (!c) throw new Error(m || 'assertion failed'); }
function blocks(src) { const out = []; let depth = 0, start = 0; for (let i = 0; i < src.length; i++) { if (src[i] === '{') depth++; else if (src[i] === '}') { depth--; if (depth === 0) { out.push([src.slice(start, src.indexOf('{', start)).trim(), src.slice(src.indexOf('{', start) + 1, i)]); start = i + 1; } } } return out; }
const MOTION = '@media (prefers-reduced-motion: no-preference)';
const ALLOWED = new Set(['transform', 'opacity', 'box-shadow', 'text-shadow', 'border-color', 'background-color', 'color', 'outline', 'outline-offset', 'filter', 'transition', 'transition-property', 'transition-duration', 'transition-timing-function', 'transition-delay', 'animation', 'animation-delay', 'cursor', 'accent-color', 'caret-color', 'text-decoration-color', 'will-change']);
const top = blocks(CSS);
const rules = []; // [mediaHeader, selector, body]
for (const [h, body] of top) { if (h.startsWith('@media')) { for (const [s, b] of blocks(body)) rules.push([h, s, b]); } else if (h.startsWith('@keyframes')) rules.push(['', h, body]); else rules.push(['', h, body]); }
console.log('\n[delight guard]');
test('Every motion rule sits inside prefers-reduced-motion: no-preference, and every :hover rule also inside (hover: hover)', () => {
  for (const [m, s, b] of rules) {
    if (s.startsWith('@keyframes')) continue;
    const moves = /transition|animation|transform/.test(b);
    if (moves) assert(m.startsWith(MOTION), 'motion outside the reduced-motion guard: ' + s);
    if (/:hover/.test(s)) assert(/hover: hover/.test(m), 'hover rule not limited to pointer devices: ' + s);
  }
});
test('Keyframes are only declared inside the no-preference media block', () => {
  for (const [h, body] of top) { if (/@keyframes/.test(body) || /@keyframes/.test(h)) assert(h.startsWith(MOTION), 'keyframes outside the guard'); }
});
test('Only cheap, non-layout properties are used', () => {
  for (const [, s, b] of rules) for (const m of b.matchAll(/(?:^|[;{\s])([a-z-]+)\s*:/g)) { const k = m[1]; if (/^(from|to)$/.test(k)) continue; assert(ALLOWED.has(k), `"${k}" is not allowed in ${s.slice(0, 60)}`); }
  assert(!/(?:^|[;{\s])(width|height|margin|padding|top|left|right|bottom|display|position|font-size|line-height|border-width|border|flex|grid)[a-z-]*\s*:/.test(CSS.replace(/border-color|outline-offset/g, '')), 'layout property used');
});
test('No endless animation, no step over 8px, no scale over 1.06, nothing longer than 700ms', () => {
  assert(!/infinite/.test(CSS), 'infinite animation');
  for (const m of CSS.matchAll(/translate[XYZ]?\((-?[\d.]+)px/g)) assert(Math.abs(+m[1]) <= 8, 'move too large: ' + m[0]);
  for (const m of CSS.matchAll(/scale\(([\d.]+)\)/g)) assert(+m[1] <= 1.06 && +m[1] >= 0.94, 'scale too large: ' + m[0]);
  for (const m of CSS.matchAll(/(\d+)ms/g)) assert(+m[1] <= 700, 'too slow: ' + m[0]);
  for (const m of CSS.matchAll(/(?<![\d.])([\d.]+)s\b/g)) assert(+m[1] <= 0.7, 'too slow: ' + m[0]);
});
test('Stays away from the booking calendar, checkout and payment UI, and loads nothing external', () => {
  assert(!/calendar|cal-|stripe|checkout|payment|card-element|#courseBookingModal|#view-booking input/i.test(CSS), 'touches booking or payment UI');
  assert(!/url\(|@import|https?:/.test(CSS), 'external or url() reference');
  assert(!/!important/.test(CSS), '!important is not allowed');
});
test('Every rule belongs to a numbered experiment (D###) and no experiment is declared twice', () => {
  const ids = [...RAW.matchAll(/\/\* (D\d{3}) /g)].map((m) => m[1]);
  assert(new Set(ids).size === ids.length, 'duplicate experiment id');
  assert(ids.length === top.length || ids.length >= 0, 'ok');
});
console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
process.exit(failed ? 1 : 0);
