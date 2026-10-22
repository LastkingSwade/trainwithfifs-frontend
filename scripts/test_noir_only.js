/**
 * TrainWithFIFS - NOIR is the only design layer (offline)
 * The older "organic" skin is gone for good: no stylesheet, script, component, marker or layout wiring. NOIR is on unless the kill switch is set,
 * and the things that must never be restyled (boot intro, CRT look, Hack Detected, calendar) are still wired in.
 */
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
function walk(d, out = []) { for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) { if (['node_modules', '.next', '.git'].includes(e.name)) continue; const rel = d + '/' + e.name; if (e.isDirectory()) walk(rel, out); else if (/\.(ts|tsx|css|js)$/.test(e.name)) out.push(rel); } return out; }

(async () => {
  console.log('\n[the organic skin is retired]');
  await test('its files are gone', () => { for (const f of ['src/design/organic.css', 'src/design/organic.ts', 'src/design/OrganicSkin.tsx']) assert(!fs.existsSync(path.join(ROOT, f)), f + ' still exists'); });
  await test('nothing in the site\'s source refers to it: no import, component, class prefix (og-) in markup, or data-organic marker', () => {
    const hits = walk('src').filter((f) => /organic|OrganicSkin|data-organic|installOrganic/i.test(read(f))); assert(hits.length === 0, 'still mentioned in: ' + hits.join(', '));
    const lay = read('src/app/layout.tsx'); assert(!/design\/organic|OrganicSkin/.test(lay), 'layout wiring');
  });
  await test('no stylesheet restyles the site with the old --og- tokens or og-s / og-p / og-pb / og-c classes', () => {
    const hits = walk('src').filter((f) => /\.css$/.test(f) && /--og-|\.og-(s|p|pb|c)\b/.test(read(f))); assert(hits.length === 0, 'old tokens in: ' + hits.join(', '));
  });
  console.log('\n[NOIR is the standard]');
  await test('NOIR is on for everyone unless NEXT_PUBLIC_NOIR is exactly "off"; its stylesheet and moments are wired in the layout', () => {
    const lay = read('src/app/layout.tsx'); assert(/data-noir=\{process\.env\.NEXT_PUBLIC_NOIR === "off" \? "off" : "on"\}/.test(lay), 'default on'); assert(/import "\.\.\/noir\/noir\.css"/.test(lay), 'stylesheet'); assert(/NEXT_PUBLIC_NOIR !== "off" && <NoirMoments \/>/.test(lay), 'moments');
  });
  await test('every NOIR rule is still scoped to the switch, so the kill switch really turns it all off', () => {
    const css = read('src/noir/noir.css').replace(/\/\*[\s\S]*?\*\//g, ''); const re = /([^{}@][^{}]*)\{[^{}]*\}/g; let m, n = 0;
    const split = (sel) => { const out = []; let d = 0, cur = ''; for (const ch of sel) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && d === 0) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; };
    while ((m = re.exec(css))) { for (const s of split(m[1])) { const t = s.trim(); if (!t || /^(from|to|\d+%)$/.test(t)) continue; n++; assert(/^:root\[data-noir="on"\]/.test(t), 'unscoped: ' + t.slice(0, 80)); } } assert(n > 40, 'rules seen: ' + n);
  });
  console.log('\n[what must never be restyled is still there]');
  await test('the boot intro, CRT look, Hack Detected and calendar pieces are still in the page and untouched by NOIR', () => {
    const page = read('src/app/page.tsx'), css = read('src/noir/noir.css');
    assert(/<HudIntro \/>/.test(page), 'HUD intro'); assert(fs.existsSync(path.join(ROOT, 'src/hack/HackDetected.tsx')) && fs.existsSync(path.join(ROOT, 'src/hack/hack.css')), 'Hack Detected'); assert(/bookingCalDaysGrid/.test(page), 'calendar grid');
    assert(!/#bookingCalDaysGrid|\.cal-day-cell|#terminalGatewayOverlay|\.hack-lay|hack-/.test(css), 'NOIR must not restyle these');
  });
  await test('the owner-facing guide says NOIR is the standard and how to switch it off', () => {
    const d = read('DESIGN_SYSTEM.md'); for (const w of ['NOIR is the standard', 'retired', 'NEXT_PUBLIC_NOIR', 'off', '--noir-amber', '44px', 'reduced motion']) assert(d.includes(w), 'guide misses: ' + w);
  });
  console.log(`\nNOIR only: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
