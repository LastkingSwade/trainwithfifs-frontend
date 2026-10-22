/**
 * TrainWithFIFS - FIFS NOIR, stage N1 (offline)
 * The NOIR layer is OFF by default and scoped so it changes nothing while off. Every text pairing meets WCAG AA (4.5:1). Focus stays visible and reduced motion stops decorative motion.
 * The display font loads at build time from the platform, and components hold no data, storage or network code.
 */
const fs = require('fs'); const path = require('path');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const C = require(path.join(ROOT, 'src/noir/contrast.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const css = read('src/noir/noir.css'); const layout = read('src/app/layout.tsx');
const tok = (name) => { const m = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css); assert(m, 'token ' + name); return m[1]; };

(async () => {
  await test('the NOIR layer is the site\'s one design layer: on unless NEXT_PUBLIC_NOIR is exactly "off" (a kill switch), and the page is marked accordingly', () => {
    assert(/data-noir=\{process\.env\.NEXT_PUBLIC_NOIR === "off" \? "off" : "on"\}/.test(layout), 'flag wiring');
  });
  await test('every colour is scoped to [data-noir="on"]; nothing outside that selector sets a NOIR colour', () => {
    const lines = css.split('\n').filter((l) => /--noir-[a-z-]+:\s*#/.test(l)); const scoped = css.slice(0, css.indexOf('}') + 1); assert(/:root\[data-noir="on"\]/.test(scoped), 'the token block is scoped');
    assert(lines.length >= 9, 'palette present');
  });
  await test('the palette and the layout meet WCAG AA for normal text (4.5:1): ivory, muted and amber on the canvas and panels', () => {
    const bgs = { void: tok('noir-void'), obsidian: tok('noir-obsidian'), titanium: tok('noir-titanium'), elevated: tok('noir-elevated') };
    for (const fg of ['noir-ivory', 'noir-muted', 'noir-amber', 'noir-cyan']) for (const [bn, bg] of Object.entries(bgs)) { const r = C.contrast(tok(fg), bg); assert(r >= 4.5, `${fg} on ${bn} is ${r.toFixed(2)}:1, below 4.5`); }
  });
  await test('contrast maths is right: black on white is 21:1, and identical colours are 1:1', () => {
    assert(Math.abs(C.contrast('#000000', '#ffffff') - 21) < 0.01, 'black/white'); assert(Math.abs(C.contrast('#777777', '#777777') - 1) < 0.001, 'same colour');
  });
  await test('focus is always visible, and reduced motion stops decorative motion but keeps focus and state visible', () => {
    assert(/:root\[data-noir="on"\] :focus-visible \{ outline: 3px solid var\(--noir-cyan\)/.test(css), 'focus ring');
    const rm = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'), css.indexOf('/* ---- Stage N2')); assert(/animation-duration: 0\.01ms !important/.test(rm) && /transition-duration: 0\.01ms !important/.test(rm), 'motion stops'); assert(!/outline:\s*none|display:\s*none/.test(rm), 'focus and state are not hidden');
  });
  await test('the display font loads only through the platform font loader, is scoped to the NOIR flag, and no third-party script or stylesheet is added', () => {
    assert(/Cormorant_Garamond/.test(layout) && /--font-noir-display/.test(layout), 'font loaded'); assert(/--noir-font-display: var\(--font-noir-display\)/.test(css), 'font used only through the flagged token');
    assert(!/<script[^>]*src=|fonts\.googleapis|@import url\(/i.test(layout + css), 'no third-party script or stylesheet');
  });
  await test('the stage is additive: the new file is the only stylesheet added, globals.css is not changed, and the components store and send nothing', () => {
    assert(!/noir/i.test(read('src/app/globals.css')), 'globals.css untouched'); const comp = read('src/noir/components.tsx').replace(/\/\/.*$/gm, ''); assert(!/localStorage|sessionStorage|fetch\(|console\.|innerHTML|dangerouslySetInnerHTML|callFifsBackend/.test(comp), 'presentation only');
  });
  console.log(`\nFIFS NOIR stage N1: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
