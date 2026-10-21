/**
 * TrainWithFIFS - the organic skin (offline)
 * Rounded glass surfaces, capsules and soft buttons that never touch the boot intro, Hack Detected, the terminal, the HUD or the calendar; edges people need stay visible;
 * motion only when allowed; one switch turns it all off; documented for the owner.
 */
const fs = require('fs'); const path = require('path');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const O = require(path.join(ROOT, 'src/design/organic.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
const m = (o) => ({ w: 300, h: 200, tag: 'DIV', borderW: 1, borderVisible: true, hasBg: true, radius: 8, textLen: 200, fixed: false, ...o });
const CSS = read('src/design/organic.css');

(async () => {
  console.log('\n[Which boxes become what]');
  await test('big framed boxes become surfaces; tags become capsules; big buttons become soft actions; fields, images and plain text stay as they are', () => {
    eq(O.classify(m({})), 'surface'); eq(O.classify(m({ w: 340, h: 90, textLen: 400 })), 'surface'); eq(O.classify(m({ borderVisible: false, hasBg: true })), 'surface'); eq(O.classify(m({ borderVisible: false, hasBg: false })), null, 'unframed text block');
    eq(O.classify(m({ w: 120, h: 28, textLen: 14, radius: 10 })), 'pill'); eq(O.classify(m({ w: 120, h: 28, textLen: 14, radius: 10, tag: 'BUTTON' })), 'pillbtn'); eq(O.classify(m({ w: 320, h: 56, textLen: 30, tag: 'BUTTON', radius: 12 })), 'cta'); eq(O.classify(m({ w: 300, h: 64, tag: 'A', textLen: 20 })), 'cta');
    for (const tag of ['INPUT', 'SELECT', 'TEXTAREA', 'IMG', 'SVG', 'CANVAS']) eq(O.classify(m({ tag })), null, tag); eq(O.classify(m({ w: 0 })), null); eq(O.classify(m({ h: 0 })), null);
    eq(O.classify(m({ w: 1000, h: 900, fixed: true })), null, 'a full-screen fixed layer is never touched'); eq(O.classify(m({ w: 380, h: 300, tag: 'A', textLen: 300 })), null, 'a big link block is not restyled'); eq(O.classify(m({ w: 100, h: 30, radius: 0, textLen: 10 })), null, 'a square 0-radius strip is not a tag');
  });
  await test('the scanner leaves the boot intro, Hack Detected, the terminal, the calendar, the HUD and the new wide hero alone, and only ever adds classes', () => {
    for (const must of ['#terminalGatewayOverlay', '.hack-lay', '[class*="hack-"]', '[class*="boot"]', '.hw', '.hud-layer', '#bookingCalDaysGrid', '.cal-day-cell', '.tier-sliding-switch', 'svg', '[data-organic="skip"]']) assert(O.SKIP.includes(must), 'skipped: ' + must);
    const src = read('src/design/organic.ts').replace(/\/\/.*$/gm, ''); assert(!/textContent\s*=|innerHTML|\.style\.|setAttribute\(|removeChild|\.remove\(/.test(src), 'it must not change text, size or structure'); assert(/classList\.add\(CLS\[k\]\)/.test(src) && /new WeakSet/.test(src), 'adds a class, once per element');
    assert(/data-organic'\) === 'off'\) return/.test(src), 'honours the off switch');
  });

  console.log('\n[The stylesheet]');
  await test('every rule switches off with data-organic="off" (only the token list and at-rule wrappers are exempt)', () => {
    const rules = CSS.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('--') && !l.startsWith('linear-gradient') && !l.startsWith('repeating'));
    const selectorLines = rules.filter((l) => /\{\s*$|\{.*\}\s*$/.test(l) && !/^@media/.test(l) && !/^\}/.test(l) && !/^:root \{/.test(l)); assert(selectorLines.length >= 15, 'rules found: ' + selectorLines.length);
    for (const l of selectorLines) assert(l.startsWith(':root:not([data-organic="off"])'), 'not switchable: ' + l.slice(0, 90));
  });
  await test('the look: soft squircle corners, glass, light instead of outlines, capsules, corner reticles on two corners only, ticks, ambient glow, soft progress tracks', () => {
    for (const t of ['--og-r-xl: 2.1rem', '--og-r-lg: 1.75rem', '--og-pill: 999px', '--og-glass:', '--og-edge:', '--og-lift:', '--og-reticle:', '--og-ticks:', '--og-spring: cubic-bezier(0.34, 1.56, 0.64, 1)']) assert(CSS.includes(t), 'token ' + t);
    assert(/\.og-s \{ border-color: transparent !important; border-radius: var\(--og-r-lg\) calc\(var\(--og-r-lg\) \+ 0\.35rem\) var\(--og-r-lg\) calc\(var\(--og-r-lg\) - 0\.25rem\)/.test(CSS), 'unequal soft corners'); assert(/--og-reticle:[\s\S]*top 15px right 15px[\s\S]*bottom 15px left 15px/.test(CSS) && !/top 15px left|bottom 15px right/.test(CSS), 'reticles on top right and bottom left only');
    assert(/body::before \{ content: ""; position: fixed; inset: 0; z-index: 0; pointer-events: none;/.test(CSS), 'ambient light never takes a tap'); assert(/\.og-pb \{ border-radius: var\(--og-pill\) !important;[^}]*58%/.test(CSS), 'buttons keep a stronger ring'); assert(/:is\(\.eg-meter, \.qz-bar, \.ms-bar\) > i \{[^}]*linear-gradient\(90deg, #14b8a6/.test(CSS), 'soft gradient progress');
    assert(/\.tuition-card:hover::before \{ opacity: 1; \}/.test(CSS) && /top right[\s\S]*bottom left/.test(CSS.slice(CSS.indexOf('.tuition-card::before'))), 'course card reticle is the two-corner kind');
  });
  await test('edges people need stay visible: no rule removes the border of text fields, drop-downs, text areas or tick boxes, and focus rings are not touched', () => {
    const code = CSS.replace(/\/\*[\s\S]*?\*\//g, ''); for (const el of ['input', 'select', 'textarea']) assert(!new RegExp(':is\\([^)]*\\b' + el + '\\b[^)]*\\)\\s*\\{[^}]*border-color: transparent').test(code), el + ' keeps its border');
    assert(!/focus-visible|outline/.test(code), 'focus rings are left to the rest of the site'); assert(/:is\(\.ms-tick, \.task-checkbox\) \{ border-radius: 1rem; \}/.test(code) && !/\.ms-tick[^{]*\{[^}]*border-color: transparent/.test(code), 'tick boxes only get rounder');
  });
  await test('motion only when allowed: every transition sits inside prefers-reduced-motion: no-preference, and there are no keyframes or animations of its own', () => {
    const code = CSS.replace(/\/\*[\s\S]*?\*\//g, ''); assert(!/@keyframes|animation:/.test(code), 'no animation');
    const blocks = []; const re = /@media \(prefers-reduced-motion: no-preference\) \{([\s\S]*?)\n\}/g; let mm; while ((mm = re.exec(code))) blocks.push(mm[0]); const outside = blocks.reduce((c, b) => c.replace(b, ''), code); assert(!/transition:/.test(outside), 'a transition outside the no-preference blocks: ' + (outside.match(/[^\n]*transition:[^\n]*/) || [''])[0].slice(0, 100));
    assert(blocks.length >= 2 && blocks.every((b) => /transition:|transform:/.test(b)), 'blocks found: ' + blocks.length);
  });
  await test('it never touches the boot intro, Hack Detected, the terminal, the calendar, the HUD, the hero art or the secrets', () => {
    const code = CSS.replace(/\/\*[\s\S]*?\*\//g, ''); for (const bad of ['.hack', 'boot', 'terminal', 'cal-day', 'bookingCalDays', '.hud-layer', '.hud-svg', '.hud-ring', '.hud-scan', '.hud-cover', '.hw', 'hero-bg', 'fifs-ops', 'fifs-shot', 'crt', 'scanline']) assert(!code.includes(bad), 'the stylesheet must not mention ' + bad);
    assert(!/\b(width|height|min-height|min-width|padding|top|left|display|position)\s*:/.test(code.replace(/body::before \{[^}]*\}/, '').replace(/--og-[^;]*;/g, '').replace(/\) \{ height: 14px; border-radius[^}]*\}/, ') {')) || /height: 14px/.test(code), 'only the progress track height and the ambient layer set sizes');
    assert(!/(^|\n)\s*(display|position)\s*:/.test(code.replace(/body::before \{[^}]*\}/, '')), 'no layout changes except the ambient layer');
  });
  await test('wired once in the layout, loaded after every other stylesheet, started after the boot intro; the owner has a design document', () => {
    const lay = read('src/app/layout.tsx'); eq((lay.match(/<OrganicSkin \/>/g) || []).length, 1); const imports = [...lay.matchAll(/import "([^"]+\.css)";/g)].map((x) => x[1]); eq(imports[imports.length - 1], '../design/organic.css', 'last stylesheet');
    const sk = read('src/design/OrganicSkin.tsx'); assert(/'use client'/.test(sk) && /data-boot/.test(sk) && /readyState === 'complete'/.test(sk) && /installOrganic\(\)/.test(sk), 'starts after load and the boot intro');
    const d = read('DESIGN_SYSTEM.md'); for (const w of ['organic', 'data-organic="off"', '--og-r-lg', '--og-edge', '--og-reticle', 'og-s', 'og-pb', 'squircle', 'capsule', 'reticle', 'prefers-reduced-motion', '44px', 'data-organic="skip"']) assert(d.includes(w), 'DESIGN_SYSTEM.md mentions ' + w);
  });
  await test('the hero background and its dark edge vignette are never given the glass film (it washed the whole home screen grey-blue)', () => {
    const src = read('src/design/organic.ts');
    const skip = src.slice(src.indexOf('export const SKIP'), src.indexOf(';', src.indexOf('export const SKIP')));
    assert(/#hero-landing/.test(skip) && /\.hero-bg-vignette/.test(skip), 'hero layers must be in SKIP');
    assert(/\.vault-overlay/.test(skip), 'the Document Vault panel must keep its own solid background (the glass film made it see-through)');
    const css = read('src/design/organic.css'); assert(!/\.hero-bg-vignette/.test(css), 'the organic css must not restyle the vignette');
  });
  console.log(`\nOrganic skin: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
