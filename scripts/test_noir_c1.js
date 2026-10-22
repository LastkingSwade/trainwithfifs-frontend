/**
 * TrainWithFIFS - FIFS NOIR, main-site cards (offline)
 * The course, FAQ, instructor, target, checklist, chooser and promise cards, the view panels and the tier cards take the NOIR surface. Only the surface changes (never text colour, emoji or accents),
 * the highlighted cards are left alone, the rules are strong enough to beat the site's own card rules and organic skin (checked in a real browser separately), and nothing adds blur or motion.
 */
const fs = require('fs'); const path = require('path');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const C = require(path.join(ROOT, 'src/noir/contrast.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const full = read('src/noir/noir.css'); const at = full.indexOf('/* ---- Stage C1'); assert(at > 0, 'card section present'); const sec = full.slice(at).replace(/\/\*[\s\S]*?\*\//g, '');
const p2a = full.indexOf('/* ---- Stage N2, part 2'); const p2 = full.slice(p2a, full.indexOf('/* ---- Stage N3')).replace(/\/\*[\s\S]*?\*\//g, '');
const rules = (t) => { const o = []; const re = /([^{}@][^{}]*)\{([^{}]*)\}/g; let m; while ((m = re.exec(t))) o.push({ sel: m[1].trim(), body: m[2] }); return o; };
const cardRules = rules(sec); const panelRules = rules(p2);
const tok = (name) => { const m = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(full); assert(m, 'token ' + name); return m[1]; };
// split a selector list on top-level commas only (commas inside :is() or :not() belong to one selector)
const split = (sel) => { const out = []; let d = 0, cur = ''; for (const ch of sel) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && d === 0) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; };
const GATE = ':root[data-noir="on"][data-noir="on"]';

(async () => {
  await test('every card selector repeats the flag attribute (so it outranks the site\'s organic skin and card rules) and every panel selector from the earlier stage does too', () => {
    assert(cardRules.length >= 4, 'card rules: ' + cardRules.length); for (const r of [...cardRules, ...panelRules]) for (const s of split(r.sel)) assert(s.trim().startsWith(GATE), 'weak selector: ' + s.trim());
  });
  await test('cards change surface only: background, border, corner radius, shadow and blur-off; never text colour, font, size, spacing or position', () => {
    for (const r of [...cardRules, ...panelRules]) for (const d of r.body.split(';').map((x) => x.trim()).filter(Boolean)) assert(/^(background|background-color|border|border-color|border-radius|box-shadow|backdrop-filter|-webkit-backdrop-filter)\s*:/.test(d), 'not a surface property: ' + d + ' in ' + r.sel);
    for (const r of [...cardRules, ...panelRules]) for (const d of r.body.split(';')) if (/backdrop-filter/.test(d)) assert(/:\s*none\b/.test(d), 'blur must only be switched off: ' + d);
  });
  await test('the highlighted cards are left alone: featured / combo / VIP course cards are excluded, and the next-step card, amber call-to-action box, gold HUD card and tier-card colours are never targeted', () => {
    const joined = cardRules.map((r) => r.sel).join(' '); for (const r of cardRules) for (const part of r.sel.match(/\.tuition-card(?::not\([^)]*\))*/g) || []) assert(/^\.tuition-card:not\(\.featured\):not\(\.highlight-combo\):not\(\.vip-mode-active\)/.test(part), 'course-card selector without the exclusions: ' + part + ' in ' + r.sel); assert(/\.tuition-card/.test(joined), 'course cards covered'); assert(!/next-step-card|cta-review-box|hud-gold-card|fi-vault-card/.test(joined + panelRules.map((r) => r.sel).join(' ')), 'highlighted card targeted');
    const chip = cardRules.find((r) => /catalog-chip/.test(r.sel)); assert(chip && !/border-color|border:|box-shadow/.test(chip.body), 'tier cards keep their own border colour and glow');
  });
  await test('the course-card group beats the site\'s !important card rules because it also uses !important, and nothing else needs it', () => {
    const grp = cardRules.find((r) => /\.faq-item/.test(r.sel) && /!important/.test(r.body)); assert(grp, 'important group'); for (const p of ['background', 'border', 'border-radius', 'box-shadow']) assert(new RegExp(p + ':[^;]*!important').test(grp.body), p + ' needs !important');
    for (const r of [...panelRules, ...cardRules.filter((x) => /catalog-chip|\.panel/.test(x.sel))]) assert(!/!important/.test(r.body), 'unneeded !important in ' + r.sel);
  });
  await test('the site\'s own text colours stay readable on the new surface: body blue-white, muted grey, cyan and amber all reach 4.5:1 on obsidian', () => {
    const obs = tok('noir-obsidian'); for (const [n, c] of [['body blue-white', '#d3e9f8'], ['muted', '#cbd5e1'], ['cyan', '#00e5ff'], ['amber', '#ffb703'], ['white', '#ffffff']]) assert(C.contrast(c, obs) >= 4.5, n + ' is ' + C.contrast(c, obs).toFixed(2) + ':1');
  });
  await test('no new blur, motion or image is added, and the stylesheet stays under the 16 KB budget', () => {
    assert(!/animation|transition|@keyframes|url\(|blur\(/.test(sec), 'cost or motion in card layer'); assert(Buffer.byteLength(full) <= 16384, 'noir.css is ' + Buffer.byteLength(full) + ' bytes');
  });
  await test('hover only shows where there is a pointer, and uses the amber border', () => {
    assert(/@media \(hover: hover\) \{[^@]*:hover \{ border-color: rgba\(204, 163, 90, 0\.55\) !important; \}/.test(sec), 'hover');
  });
  console.log(`\nFIFS NOIR cards: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
