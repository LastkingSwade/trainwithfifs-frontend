/**
 * TrainWithFIFS - FIFS NOIR, stage N2 (offline)
 * Navigation and component polish. Everything is scoped to the NOIR flag, nothing changes size/position/display (so tab targets and destinations are untouched), the states
 * (current, hover, pressed, focus) all exist, only cheap properties animate, nothing loops, reduced motion and forced colours are handled, and the colours meet WCAG AA.
 */
const fs = require('fs'); const path = require('path');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const C = require(path.join(ROOT, 'src/noir/contrast.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const full = read('src/noir/noir.css'); const n2 = full.slice(full.indexOf('/* ---- Stage N2')); assert(n2.length > 500, 'stage N2 section present');
const tok = (name) => { const m = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(full); assert(m, 'token ' + name); return m[1]; };
// Every rule (including those inside @media blocks) as { sel, body }.
const rules = []; { const n2c = n2.replace(/\/\*[\s\S]*?\*\//g, ''); const re = /([^{}@][^{}]*)\{([^{}]*)\}/g; let m; while ((m = re.exec(n2c))) rules.push({ sel: m[1].trim(), body: m[2] }); }
const blend = (fg, bg, a) => { const h = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16)); const [f, b] = [h(fg), h(bg)]; return '#' + f.map((v, i) => Math.round(v * a + b[i] * (1 - a)).toString(16).padStart(2, '0')).join(''); };

(async () => {
  await test('every N2 selector is scoped to [data-noir="on"], so nothing changes while the flag is off', () => {
    assert(rules.length >= 20, 'rules found: ' + rules.length);
    for (const r of rules) for (const s of r.sel.split(',')) assert(/^\s*:root\[data-noir="on"\]/.test(s), 'unscoped selector: ' + s.trim());
  });
  await test('navigation destinations and size are untouched: no width/height/min-height/padding/margin/display (position: relative only, to anchor the marker)/position/visibility/pointer-events change on tabs, and the nav files are not edited', () => {
    for (const r of rules) if (/\.(fpn|fts)-?(tab|nav)?\b/.test(r.sel) && !/::before/.test(r.sel)) assert(!/(^|;|\s)(width|height|min-height|min-width|padding|margin|display|visibility|pointer-events|position|top|bottom|left|right)\s*:/.test(r.body.replace(/position:\s*relative;?/g, '').replace(/;\s*/g, ';')), 'layout property on: ' + r.sel);
    assert(!/noir/i.test(read('src/shell/publicNav.css') + read('src/shell/tabShell.css') + read('src/shell/PublicNav.tsx') + read('src/shell/tabShell.ts') + read('src/shell/publicNavLogic.ts') + read('src/shell/tabLogic.ts')), 'navigation code and styles are not touched');
  });
  await test('the current tab, hover, pressed and focus states all exist, and the current-tab marker is on the tab itself (no script)', () => {
    assert(/\.fpn-tab\[aria-current="page"\]/.test(n2) && /\.fts-tab\[aria-current="page"\]/.test(n2), 'current');
    assert(/aria-current="page"\]::before/.test(n2), 'marker'); assert(/\.fpn-tab:hover/.test(n2) && /@media \(hover: hover\)/.test(n2), 'hover only with a pointer'); assert(/:active[^{]*\{ transform: scale\(0\.97\)/.test(n2), 'pressed');
    assert(/:focus-visible \{ outline: 3px solid var\(--noir-cyan\)/.test(full), 'focus ring from N1 still applies');
  });
  await test('only cheap properties animate (colour, background, border, opacity, transform), and nothing loops', () => {
    for (const r of rules) { const t = /transition:\s*([^;]+);/.exec(r.body); if (!t) continue; for (const part of t[1].split(',')) { const prop = part.trim().split(/\s+/)[0]; assert(/^(color|background-color|border-color|opacity|transform)$/.test(prop), 'transition on ' + prop + ' in ' + r.sel); } }
    assert(!/infinite|@keyframes|animation\s*:/.test(n2), 'no looping or keyframe animation');
  });
  await test('reduced motion removes the press-scale, and forced-colours mode keeps the current tab marked', () => {
    const rm = n2.slice(n2.indexOf('@media (prefers-reduced-motion: reduce)')); assert(/transform: none/.test(rm), 'press scale removed');
    const fc = n2.slice(n2.indexOf('@media (forced-colors: active)')); assert(/aria-current="page"\][^{]*\{[^}]*outline: 2px solid Highlight/.test(fc), 'forced colours outline');
  });
  await test('colours meet WCAG AA (4.5:1): muted and ivory on the bar, amber on the highlighted current tab, ivory on list rows, dark text on the amber button', () => {
    const obs = tok('noir-obsidian'), tit = tok('noir-titanium'), elev = tok('noir-elevated'), amber = tok('noir-amber'), ivory = tok('noir-ivory'), muted = tok('noir-muted'), void_ = tok('noir-void');
    const cur = blend(amber, obs, 0.1);
    const pairs = [[muted, obs, 'muted on bar'], [ivory, obs, 'ivory hover on bar'], [amber, cur, 'amber on current tab'], [ivory, tit, 'ivory on row'], [muted, tit, 'muted note on row'], [ivory, elev, 'ivory on hovered row'], [muted, elev, 'muted on hovered row'], [void_, amber, 'dark on amber button']];
    for (const [f, b, n] of pairs) assert(C.contrast(f, b) >= 4.5, n + ' is ' + C.contrast(f, b).toFixed(2) + ':1');
  });
  await test('stage N2 adds no script, import or dependency, and globals.css is still untouched', () => {
    assert(!/<script|@import|url\(/i.test(n2), 'CSS only'); assert(!/noir/i.test(read('src/app/globals.css')), 'globals.css untouched');
  });
  console.log(`\nFIFS NOIR stage N2: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
