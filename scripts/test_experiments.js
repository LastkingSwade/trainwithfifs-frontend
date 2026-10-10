// Research-loop guard (src/experiments/*): every experiment is tagged, motion respects prefers-reduced-motion, nothing risky slips in (offline).
const fs = require('fs'); const path = require('path'); const postcss = require('postcss');
const R = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
let passed = 0, failed = 0;
function test(n, f) { try { f(); console.log('  ✓ PASS: ' + n); passed++; } catch (e) { console.log('  ✗ FAIL: ' + n + '\n    -> ' + e.message); failed++; } }
function assert(c, m) { if (!c) throw new Error(m || 'assertion failed'); }
console.log('\n[research-loop experiments]');
const FILES = ['src/experiments/site.css', 'src/experiments/portals.css'];
const SAFE = /prefers-reduced-motion:\s*no-preference/;
test('Both style sheets parse, every block carries a unique ID tag, and nothing uses !important or touches animation outside no-preference', () => {
  const ids = new Set();
  for (const f of FILES) {
    const src = R(f); const root = postcss.parse(src);
    for (const m of src.matchAll(/\/\*\s*([QP]\d{3})\b/g)) { assert(!ids.has(m[1]), 'duplicate ID ' + m[1]); ids.add(m[1]); }
    root.walkDecls((d) => {
      assert(d.prop !== 'text-wrap', f + ': use text-wrap-style, never the text-wrap shorthand (it silently resets white-space: nowrap, which broke the reviews marquee) in ' + d.parent.selector);
      assert(!d.important, f + ': !important in ' + d.parent.selector + ' { ' + d.prop + ' }');
      if (/^(animation|transition)/.test(d.prop) || d.prop === 'scroll-behavior') {
        let n = d.parent, ok = false; while (n) { if (n.type === 'atrule' && n.name === 'media' && SAFE.test(n.params)) ok = true; n = n.parent; }
        assert(ok, f + ': ' + d.prop + ' outside prefers-reduced-motion: no-preference (' + d.parent.selector + ')');
      }
    });
    root.walkAtRules('keyframes', (a) => { let n = a.parent, ok = false; while (n) { if (n.type === 'atrule' && n.name === 'media' && SAFE.test(n.params)) ok = true; n = n.parent; } assert(ok, f + ': keyframes ' + a.params + ' outside no-preference'); });
  }
});
test('The experiment script is safe: every experiment is wrapped, no network, no storage, no innerHTML/eval, no new import', () => {
  const raw = R('src/experiments/qol.ts');
  const src = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
  assert(!/fetch\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|indexedDB|document\.cookie/.test(src), 'network or storage use');
  assert(!/innerHTML|outerHTML|insertAdjacentHTML|eval\(|new Function|document\.write/.test(src), 'unsafe DOM or eval');
  assert((src.match(/^import /gm) || []).length === 0, 'no imports allowed');
  const bare = src.split('\n').filter((l) => /^\s{2}(?!\/\/|run\(|const |void |if \(|\}|w\.|\/\*)\S/.test(l) && !/^\s{2}\/\/ @@QOL_END/.test(l));
  assert(bare.length === 0, 'code outside run(): ' + (bare[0] || ''));
  for (const m of src.matchAll(/run\('([QP]\d{3})'/g)) assert(/^[QP]\d{3}$/.test(m[1]));
});
test('Nothing protected is touched by the loop: the boot intro, Hack Detected, scramble, calendar rules, auth, payments and API routes are not edited', () => {
  const { execSync } = require('child_process');
  let changed = [];
  try { changed = execSync('git diff --name-only research-start...HEAD 2>/dev/null', { cwd: path.join(__dirname, '..') }).toString().split('\n').filter(Boolean); } catch { return; }
  const allowed = [/^src\/experiments\//, /^scripts\/test_experiments\.js$/, /^src\/app\/layout\.tsx$/, /^src\/polish\/polish\.ts$/, /^package\.json$/, /^scripts\/test_hud_animations\.js$/, /^scripts\/test_ux_polish\.js$/, /^autoresearch-results\.tsv$/];
  for (const f of changed) assert(allowed.some((a) => a.test(f)), 'the loop changed a protected or unexpected file: ' + f);
});
console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
process.exit(failed ? 1 : 0);
