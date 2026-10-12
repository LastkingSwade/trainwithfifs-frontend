// Visual polish (offline): static checks that each refinement is in place and that the rules the owner set stay true.
const fs = require('fs'); const path = require('path'); const vm = require('vm'); const ts = require('typescript');
const ROOT = path.resolve(__dirname, '..'); const R = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
let passed = 0, failed = 0;
function test(n, f) { try { f(); console.log('  ✓ PASS: ' + n); passed++; } catch (e) { console.log('  ✗ FAIL: ' + n + '\n    -> ' + e.message); failed++; } }
function assert(c, m) { if (!c) throw new Error(m || 'assertion failed'); }
const PAGE = R('src/app/page.tsx'), GCSS = R('src/app/globals.css');
console.log('\n[visual polish]');
test('V1 The brand logo (header, favicon, portal logos) comes from the site itself, not a Google Drive link that can fail', () => {
  assert(!/1EnAqEURi1XIRNdNTooFGY_pvs38ZcBEQ/.test(PAGE), 'the Drive logo link must be gone');
  assert(/id="brand-logo"[^>]*src="\/icons\/icon-192\.png"/.test(PAGE) && /rel="icon" type="image\/png" href="\/icons\/icon-192\.png"/.test(PAGE), 'header logo and favicon use the local emblem');
  assert(fs.existsSync(path.join(ROOT, 'public/icons/icon-192.png')), 'the emblem file exists');
});
test('V2 Fonts are loaded the working way (next/font, served from this site): Rajdhani for headings and labels, Geist for text, Geist Mono for numbers; system fonts stay as fallbacks', () => {
  const L = R('src/app/layout.tsx');
  assert(/from "next\/font\/google"/.test(L) && /Geist\(\{ subsets: \["latin"\], variable: "--font-geist", display: "swap" \}\)/.test(L) && /Geist_Mono\(/.test(L) && /Rajdhani\(\{ subsets: \["latin"\], weight: \["500", "600", "700"\]/.test(L), 'three fonts loaded with next/font');
  assert(/<html lang="en" className=\{`\$\{geist\.variable\} \$\{geistMono\.variable\} \$\{rajdhani\.variable\}`\}>/.test(L), 'the font variables are set on <html>');
  const tail = GCSS.slice(GCSS.indexOf('V2 Typography'));
  assert(/--font-display: var\(--font-rajdhani\), 'Rajdhani', -apple-system/.test(tail) && /--font-body: var\(--font-geist\), 'Geist', -apple-system/.test(tail) && /--font-mono: var\(--font-geist-mono\)/.test(tail), 'the site-wide font variables point at the loaded fonts and keep system fallbacks');
  assert(!/Inter/.test(tail.split('}')[0]), 'Inter is no longer the first choice');
  assert(!/fonts\.googleapis\.com/.test(L), 'no runtime request to Google Fonts from the layout');
});
test('V3 Pressing a button or card squeezes it 2% using the separate scale property (never transform), and only when motion is allowed', () => {
  const t = GCSS.slice(GCSS.indexOf('V3 Physical feel'));
  assert(/@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*:active \{ scale: 0\.98; \}/.test(t), 'press rule inside the motion-allowed media query');
  assert(!/transform:\s*scale/.test(t.split('/* ---- V')[0]), 'it must not use transform, which other rules already use');
  assert(/cubic-bezier\(0\.32, 0\.72, 0, 1\)/.test(t) && !/linear|ease-in-out/.test(t.split('/* ---- V')[0].replace(/\/\*[\s\S]*?\*\//g, '')), 'a weighted spring-like curve, not linear or ease-in-out');
  assert(/:where\(button:not\(:disabled\)/.test(t), 'lowest priority, and disabled buttons never move');
});
test('V5 Cards ease in on scroll with pure CSS: only where supported, only when motion is allowed, opacity and translate only, and never on cards that already animate', () => {
  const t = GCSS.slice(GCSS.indexOf('V5 Scroll-in'));
  assert(/@media \(prefers-reduced-motion: no-preference\) \{\s*@supports \(animation-timeline: view\(\)\)/.test(t), 'inside both the motion-allowed and the supported checks');
  const sel = /\n\s*([^{]+) \{\s*animation: fifs-scroll-in linear both;/.exec(t); assert(sel, 'selector found');
  assert(!/tuition-card|corridor-route-card/.test(sel[1]), 'cards that already have their own entrance animation are left alone');
  assert(/@keyframes fifs-scroll-in \{ from \{ opacity: 0; translate: 0 26px; \} to \{ opacity: 1; translate: 0 0; \} \}/.test(t), 'only opacity and translate change (no layout properties)');
  assert(!/(^|[^-])(top|left|width|height|margin)\s*:/.test(t.split('@keyframes')[1] || ''), 'no layout-triggering properties');
});
test('V6 Home screen icons are consistent thin-line icons (no emoji in the hero), decorative and hidden from screen readers, one stroke weight', () => {
  const ICONS = R('src/ui/HeroIcons.tsx'), hero = PAGE.slice(PAGE.indexOf('className="hero-intro-card"'), PAGE.indexOf('Official Google Reviews'));
  assert(!/\p{Extended_Pictographic}/u.test(hero.replace(/[★•▼]/g, '')), 'no emoji left in the hero block');
  for (const n of ['IconShield', 'IconTarget', 'IconStar', 'IconBolt', 'IconUser', 'IconHelp', 'IconChat']) assert(new RegExp('<' + n + ' />').test(hero) || n === 'IconChat', n + ' used in the hero');
  assert(/aria-hidden="true"/.test(ICONS) && /focusable="false"/.test(ICONS) && /strokeWidth="1\.6"/.test(ICONS) && (ICONS.match(/strokeWidth=/g) || []).length === 1, 'decorative, and a single stroke weight');
  assert(/<IconChat \/>/.test(PAGE.slice(PAGE.indexOf('id="floatingCommPill"'), PAGE.indexOf('id="floatingCommPill"') + 700)), 'the floating chat button uses the same icon');
  assert(/\.fi-ico \{ display: inline-block; vertical-align: -0\.18em;/.test(GCSS), 'icons sit on the text baseline');
});
// ---- V7: emoji become icons everywhere (tested against a small simulated page) ----
const load = (rel, mocks = {}) => { const m = { exports: {} }; const req = (id) => (id in mocks ? mocks[id] : require(id)); vm.runInNewContext(ts.transpileModule(R(rel), { compilerOptions: { target: 'ES2020', module: 'commonjs' } }).outputText, { module: m, exports: m.exports, require: req, RegExp, Array, String, Object, Set, Math, console, window: undefined, document: undefined }); return m.exports; };
const ICS = load('src/ui/iconSet.ts'); const UP = load('src/ui/emojiToIcons.ts', { './iconSet': ICS });
class FText { constructor(v) { this.nodeType = 3; this.nodeValue = v; this.parentNode = null; this.isConnected = true; }
  get parentElement() { return this.parentNode && this.parentNode.nodeType === 1 ? this.parentNode : null; }
  splitText(off) { const t = new FText(this.nodeValue.slice(off)); this.nodeValue = this.nodeValue.slice(0, off); const kids = this.parentNode.childNodes; kids.splice(kids.indexOf(this) + 1, 0, t); t.parentNode = this.parentNode; return t; } }
class FEl { constructor(tag, attrs = {}) { this.nodeType = 1; this.tag = tag; this.attrs = { ...attrs }; this.childNodes = []; this.parentNode = null; this.isConnected = true; }
  get parentElement() { return this.parentNode && this.parentNode.nodeType === 1 ? this.parentNode : null; }
  get textContent() { return this.childNodes.map((c) => (c.nodeType === 3 ? c.nodeValue : c.textContent || '')).join(''); }
  setAttribute(k, v) { this.attrs[k] = String(v); } getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; } appendChild(c) { c.parentNode = this; this.childNodes.push(c); return c; }
  replaceChild(n, o) { const i = this.childNodes.indexOf(o); n.parentNode = this; this.childNodes[i] = n; o.parentNode = null; return o; }
  matches(sel) { return sel.split(',').some((s0) => { const s = s0.trim(); if (s.startsWith('#')) return this.attrs.id === s.slice(1); if (s.startsWith('.')) return (this.attrs.class || '').split(/\s+/).includes(s.slice(1)); const mc = /^\[class\*="(.+)"\]$/.exec(s); if (mc) return (this.attrs.class || '').includes(mc[1]); const ma = /^\[([a-z-]+)(?:="(.*)")?\]$/.exec(s); if (ma) return ma[2] === undefined ? ma[1] in this.attrs : this.attrs[ma[1]] === ma[2]; return this.tag === s; }); }
  closest(sel) { for (let e = this; e; e = e.parentElement) if (e.matches(sel)) return e; return null; } }
const doc = { createElementNS: (_ns, tag) => new FEl(tag), createTreeWalker: (root) => { const all = []; (function w(n) { for (const c of n.childNodes) { if (c.nodeType === 3) all.push(c); else w(c); } })(root); let i = 0; return { nextNode: () => all[i++] || null }; } };
const mk = (tag, text, attrs) => { const e = new FEl(tag, attrs); if (text !== undefined) e.appendChild(new FText(text)); return e; };
const shapeOf = (e) => e.childNodes.map((c) => (c.nodeType === 3 ? JSON.stringify(c.nodeValue) : 'ICON:' + c.attrs['data-icon'])).join(' ');

test('V7 The icon set is complete and tidy: every icon has valid shapes and a spoken label, every emoji points at a real icon, and nothing common is forgotten', () => {
  const names = Object.keys(ICS.ICONS); assert(names.length >= 55, 'expected a full set, got ' + names.length);
  for (const n of names) { const d = ICS.ICONS[n]; assert(d.label && d.label.length >= 3 && d.shapes.length >= 1, n + ' needs a label and shapes'); for (const [tag, attrs] of d.shapes) assert(['path', 'circle', 'rect'].includes(tag) && Object.keys(attrs).length, n + ' shape ' + tag); }
  for (const [e, n] of Object.entries(ICS.EMOJI_TO_ICON)) assert(ICS.ICONS[n], e + ' -> ' + n + ' must exist'); assert(Object.keys(ICS.EMOJI_TO_ICON).every((e) => !/️/.test(e)), 'emoji keys carry no invisible selector');
  const SRC = [R('src/app/page.tsx'), R('public/scripts/TrainWithFIFS_scripts.js')].join('\n'); const counts = {};
  for (const m of SRC.matchAll(new RegExp('[\\u{1F300}-\\u{1FAFF}\\u26A1\\u2B50\\u2705\\u274C\\u2753\\u26A0\\u2708\\u2709\\u2696\\u23F1\\u2699]', 'gu'))) counts[m[0]] = (counts[m[0]] || 0) + 1;
  const KEEP = new Set(['👋', '📟', '🎮', '👍', '💨', '🦅', '🎉', '🔧', '🧰']);
  const missed = Object.entries(counts).filter(([e, c]) => c >= 4 && !ICS.EMOJI_TO_ICON[e] && !KEEP.has(e)).map(([e, c]) => e + c);
  assert(missed.length === 0, 'emoji used 4+ times with no icon: ' + missed.join(' '));
});
test('V7 Splitting is safe: React\'s original text node stays in place (shortened), emoji become icons in order, unmapped emoji and ordinary text are untouched', () => {
  const host = mk('p', undefined); const orig = new FText('Standard, 👑 or 💻 and 👋 ok.'); host.appendChild(orig);
  const n = UP.upgradeTextNode(orig, doc); assert(n === 2, 'two replaced, got ' + n);
  assert(host.childNodes[0] === orig && orig.nodeValue === 'Standard, ', 'the original node is still first and still attached');
  assert(shapeOf(host) === '"Standard, " ICON:crown " or " ICON:laptop " and 👋 ok."', shapeOf(host));
  assert(host.textContent === 'Standard,  or  and 👋 ok.', 'visible text no longer contains the replaced emoji');
  const lead = mk('span', undefined); const t2 = new FText('🎯 START'); lead.appendChild(t2); UP.upgradeTextNode(t2, doc); assert(lead.childNodes[0] === t2 && t2.nodeValue === '' && shapeOf(lead) === '"" ICON:target " START"', 'emoji at the very start: ' + shapeOf(lead));
  const variant = mk('b', undefined); const t3 = new FText('⚠️ Careful ✈️'); variant.appendChild(t3); UP.upgradeTextNode(t3, doc); assert(shapeOf(variant) === '"" ICON:warning " Careful " ICON:plane ""', 'variation selectors handled: ' + shapeOf(variant));
  const joined = mk('i', undefined); const t4 = new FText('A 👨‍👩‍👧 B'); joined.appendChild(t4); UP.upgradeTextNode(t4, doc); assert(shapeOf(joined) === '"A " ICON:user " B"', 'joined emoji become one icon: ' + shapeOf(joined));
  assert(UP.upgradeTextNode(new FText('plain text ★★★★★ ↗ ✔'), doc) === 0, 'stars, arrows and check marks are left as text');
});
test('V7 Protected zones are never touched: scripts, styles, form fields, options, the hero, the boot intro, Hack Detected, and anything marked data-keep-emoji', () => {
  const zones = [mk('script', '👑'), mk('style', '👑'), mk('textarea', '👑'), mk('option', '👑 VIP'), mk('title', '👑'), mk('div', '👑', { id: 'hero-landing' }), mk('div', '👑', { class: 'boot-terminal' }), mk('div', '👑', { class: 'x hack-layer' }), mk('div', '👑', { 'data-keep-emoji': '' })];
  for (const z of zones) { const t = z.childNodes[0]; assert(UP.upgradeTextNode(t, doc) === 0 && t.nodeValue.includes('👑'), 'must skip <' + z.tag + ' ' + JSON.stringify(z.attrs) + '>'); }
  const inner = mk('span', '👑'); const outer = mk('div', undefined, { id: 'hero-landing' }); outer.appendChild(inner); assert(UP.upgradeTextNode(inner.childNodes[0], doc) === 0, 'anything inside a protected area is skipped too');
});
test('V7 An icon-only button still has a name: it gets the icon\'s spoken label unless it already has its own name; buttons with words are left alone', () => {
  const trash = mk('button', '🗑️'); UP.upgradeTextNode(trash.childNodes[0], doc); assert(trash.getAttribute('aria-label') === 'Delete', 'icon-only button named: ' + trash.getAttribute('aria-label'));
  const titled = mk('button', '🗑️', { title: 'Delete student' }); UP.upgradeTextNode(titled.childNodes[0], doc); assert(titled.getAttribute('aria-label') === null, 'a button with a title keeps it');
  const labelled = mk('button', '🗑️', { 'aria-label': 'Remove' }); UP.upgradeTextNode(labelled.childNodes[0], doc); assert(labelled.getAttribute('aria-label') === 'Remove', 'an existing label is kept');
  const words = mk('button', '🗑️ Delete'); UP.upgradeTextNode(words.childNodes[0], doc); assert(words.getAttribute('aria-label') === null, 'a button with words needs no extra label');
  const inLink = mk('a', undefined); const sp = mk('span', '📞'); inLink.appendChild(sp); UP.upgradeTextNode(sp.childNodes[0], doc); assert(inLink.getAttribute('aria-label') === 'Phone', 'an icon-only link inside a span is named too');
});
test('V7 Built icons are decorative SVG: hidden from screen readers, one stroke weight, sized with the text, and a whole tree can be upgraded in one pass', () => {
  const svg = UP.buildIcon(doc, 'crown'); assert(svg.attrs['aria-hidden'] === 'true' && svg.attrs.focusable === 'false' && svg.attrs['stroke-width'] === '1.6' && svg.attrs.width === '1.1em' && /fi-ico-rt/.test(svg.attrs.class) && svg.childNodes.length === ICS.ICONS.crown.shapes.length, 'icon attributes');
  const root = mk('div', undefined); root.appendChild(mk('p', '👑 VIP')); root.appendChild(mk('p', 'no emoji')); root.appendChild(mk('p', '💬 Chat and 📞 call')); assert(UP.upgradeTree(root, doc) === 3, 'three icons in one pass');
});
test('V7 Wiring: starts only after the page has loaded and gone idle, once, with an off switch; the old home screen icons and the stars stay; and the runtime script never uses innerHTML', () => {
  const C = R('src/ui/EmojiIcons.tsx'), UPS = R('src/ui/emojiToIcons.ts'), L = R('src/app/layout.tsx');
  assert(/document\.readyState === 'complete'/.test(C) && /requestIdleCallback/.test(C) && /setTimeout\(\(\) => \{ if \(!cancelled\) installEmojiIcons\(\); \}, 1200\)/.test(C), 'waits for load, then idle, then a pause');
  assert((L.match(/<EmojiIcons \/>/g) || []).length === 1 && L.indexOf('<EmojiIcons />') > L.indexOf('{children}'), 'mounted once, after the page content');
  assert(/__fifsNoEmojiIcons/.test(UPS) && /__fifsEmojiIconsInstalled/.test(UPS) && !/innerHTML|insertAdjacentHTML|outerHTML/.test(UPS), 'off switch, runs once, no HTML strings');
  assert(/#hero-landing/.test(UPS) && /\[class\*="boot-"\]/.test(UPS) && /\.hack-layer/.test(UPS), 'the effects stay untouched');
});
console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
process.exit(failed ? 1 : 0);
