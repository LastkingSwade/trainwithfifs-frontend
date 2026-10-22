/**
 * TrainWithFIFS - no "34+ states" claim anywhere on the site (offline)
 * The site cannot claim carry across 34+ states: recognition is checked state by state (docs/RECIPROCITY-CHECK.md). The old field guide made that claim and is now out of the public folder
 * (docs/archive). Its entry points are hidden until the guide is reviewed.
 */
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const walk = (d) => fs.readdirSync(path.join(ROOT, d), { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : /\.(ts|tsx|js|html|md)$/.test(e.name) ? [path.join(d, e.name)] : []);

(async () => {
  await test('no page, script or source says "34+ states", "34 states" or "34 state" (the base64 blob in the scripts is not text)', () => {
    const bad = [];
    for (const f of [...walk('src'), ...walk('public/scripts'), ...walk('public').filter((f) => !f.includes('scripts/'))]) {
      if (f.includes('FIFS_MSP_SCORE')) continue; const s = read(f).replace(/[A-Za-z0-9+\/=]{200,}/g, '');
      const withoutPaths = s.replace(/docs\/archive\/FIFS-34-State-Multi-Permit-SOP-Field-Guide\.html/g, '').replace(/FIFS-34-State-Multi-Permit-SOP-Field-Guide\.html/g, ''); if (/34\+|34 states?\b|34-state/i.test(withoutPaths)) bad.push(f);
    }
    assert(bad.length === 0, 'still claims 34 states in: ' + bad.join(', '));
  });
  await test('the old field guide is not served from the public folder; it is kept in docs/archive for the owner', () => {
    assert(!fs.existsSync(path.join(ROOT, 'public/FIFS-34-State-Multi-Permit-SOP-Field-Guide.html')), 'still public'); assert(fs.existsSync(path.join(ROOT, 'docs/archive/FIFS-34-State-Multi-Permit-SOP-Field-Guide.html')), 'archived');
    assert(!/"\/FIFS-34-State/.test(read('src/app/page.tsx')), 'no link to the old public address');
  });
  await test('the two entry cards for the field guide are hidden, and the course card no longer promises a number of states', () => {
    const p = read('src/app/page.tsx');
    const card6 = p.slice(p.indexOf('{/* Card 6:'), p.indexOf('{/* Card 6:') + 1500); assert(/className="portal-feature-launcher-card" onClick=[\s\S]{0,1200}"display": "none"/.test(card6), 'card 6 hidden');
    const card3 = p.slice(p.indexOf('{/* CARD 3: MULTI-PERMIT'), p.indexOf('{/* CARD 3: MULTI-PERMIT') + 1500); assert(/className="fi-feature-card highlight" onClick=[\s\S]{0,1200}"display": "none"/.test(card3), 'card 3 hidden');
    const cc = read('src/portal/courseCards.ts'); assert(/checked state by state/.test(cc) && !/34\+/.test(cc), 'course copy');
  });
  console.log(`\nNo 34-state claim: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
