/**
 * TrainWithFIFS - FIFS NOIR, stage N4 (offline)
 * Hardening and budgets. The NOIR layer stays small and cheap (size cap, no blur/filter/will-change/images, no animation outside the N3 list), phones get lighter lighting, people who ask for more
 * contrast lose the ambient wash and get stronger borders (still WCAG AA), print drops decoration, and every tab keeps its 44px minimum.
 */
const fs = require('fs'); const path = require('path');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const C = require(path.join(ROOT, 'src/noir/contrast.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const full = read('src/noir/noir.css'); const at = full.indexOf('/* ---- Stage N4'); assert(at > 0, 'stage N4 section present'); const n4 = full.slice(at).replace(/\/\*[\s\S]*?\*\//g, '');
const nocomment = full.replace(/\/\*[\s\S]*?\*\//g, '');
const tok = (name) => { const m = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(full); assert(m, 'token ' + name); return m[1]; };

(async () => {
  await test('performance budget: the NOIR stylesheet stays under 16 KB and uses no blur, filter, backdrop, will-change, images, remote URLs or imports', () => {
    assert(Buffer.byteLength(full) <= 16384, 'noir.css is ' + Buffer.byteLength(full) + ' bytes'); assert(!/blur\(|backdrop-filter|(^|[;{\s])filter\s*:|will-change|url\(|@import|image-set/.test(nocomment), 'expensive or remote feature used');
  });
  await test('the only keyframes are the five N3 moments, and every animation uses one of them (no stray motion)', () => {
    const names = [...nocomment.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]).sort(); assert(JSON.stringify(names) === JSON.stringify(['noir-fade-in', 'noir-gold-ring', 'noir-settle', 'noir-sheet-in', 'noir-vault-in']), 'keyframes: ' + names);
    for (const m of nocomment.matchAll(/animation:\s*(noir-[\w-]+|[\w-]+)/g)) assert(names.includes(m[1]), 'unknown animation ' + m[1]);
  });
  await test('every N4 selector is scoped to [data-noir="on"]', () => {
    const rules = []; const re = /([^{}@][^{}]*)\{([^{}]*)\}/g; let m; while ((m = re.exec(n4))) rules.push(m[1].trim()); assert(rules.length >= 4, 'rules: ' + rules.length); for (const sel of rules) for (const s of sel.split(',')) assert(/^:root\[data-noir="on"\]/.test(s.trim()), 'unscoped: ' + s.trim());
  });
  await test('phones get one gradient instead of two (lighter lighting)', () => {
    const phone = /@media \(max-width: 899px\) \{([^@]*)\}\s*@media/.exec(n4); assert(phone, 'phone block'); assert((phone[1].match(/radial-gradient/g) || []).length === 1, 'one gradient on phones');
  });
  await test('more-contrast mode removes the ambient wash and the stronger border still passes 4.5:1 against every NOIR surface that sits beside it', () => {
    assert(/prefers-contrast: more\) \{[^@]*body\.fifs-tabs-on::before \{ display: none; \}/.test(n4), 'ambient off'); const b = /prefers-contrast: more\) \{[^@]*--noir-border: (#[0-9a-fA-F]{6})/.exec(n4); assert(b, 'stronger border');
    for (const s of ['noir-void', 'noir-obsidian', 'noir-titanium', 'noir-elevated']) assert(C.contrast(b[1], tok(s)) >= 4.5, 'border on ' + s + ' is ' + C.contrast(b[1], tok(s)).toFixed(2));
  });
  await test('print drops the ambient wash and the gold ring', () => { assert(/@media print \{[^@]*::before[^@]*::after \{ display: none; \}/.test(n4), 'print rule'); });
  await test('tabs keep their size: the bars still set 56px-tall tabs with a 44px minimum width in their own stylesheets, and NOIR never overrides it', () => {
    assert(/\.fpn-tab \{[^}]*min-width: 44px; min-height: 56px/.test(read('src/shell/publicNav.css')), 'public tabs'); assert(/\.fts-tab \{[^}]*min-width: 44px; min-height: 56px/.test(read('src/shell/tabShell.css')), 'member tabs');
    assert(!/[;{]\s*min-(width|height)\s*:/.test(nocomment), 'NOIR never sets a minimum tab size');
  });
  console.log(`\nFIFS NOIR stage N4: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
