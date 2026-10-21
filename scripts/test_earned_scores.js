/**
 * TrainWithFIFS - a qualification score exists only when the instructor has recorded one (offline)
 * Every place that creates a student starts with NO score, and the database script removes the old "25/25 (100%)" placeholder only where no score sheet exists.
 */
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const walk = (d) => fs.readdirSync(path.join(ROOT, d), { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : /\.(ts|tsx)$/.test(e.name) ? [path.join(d, e.name)] : []);

(async () => {
  console.log('\n[New students start with no score]');
  await test('every place in the code that creates a student sets the score to null (so the old database placeholder can never appear)', () => {
    const sites = []; 
    for (const f of walk('src')) { const s = read(f); const re = /from\(\s*['"]students['"]\s*\)\s*\.\s*insert\(\{/g; let m; while ((m = re.exec(s))) sites.push([f, s.slice(m.index, m.index + 900)]); }
    assert(sites.length >= 3, 'expected the known student creation sites, found ' + sites.length);
    for (const [f, body] of sites) { const end = body.indexOf('});'); assert(/qualification_score:\s*null/.test(body.slice(0, end > 0 ? end : 900)), f + ' creates a student without qualification_score: null'); }
    const route = read('src/app/api/fifs/route.ts'); const i = route.indexOf("const profileTable = portalType === 'client'"); assert(/qualification_score:\s*null/.test(route.slice(i, i + 1400)), 'the Admin Hub invite creates a student without qualification_score: null');
  });
  await test('no server or page code writes the "25/25 (100%)" placeholder (only the staff-only demo preview in the old script has it)', () => {
    for (const f of walk('src')) assert(!/25\/25 \(100%\)/.test(read(f).replace(/placeholder="[^"]*"/g, '')), f + ' contains the placeholder score (an input hint is fine)');
  });

  console.log('\n[The database script]');
  await test('it removes the default, and clears the placeholder only on rows with no score sheet', () => {
    const q = read('scripts/sql/20261026_students_no_default_score.sql').replace(/--.*$/gm, '');
    assert(/alter column qualification_score drop default/.test(q), 'drops the default');
    assert(/where qualification_score = '25\/25 \(100%\)'/.test(q) && /not exists \(select 1 from public\.student_scoresheets/.test(q), 'only the placeholder, and only without a score sheet');
    assert(!/delete|drop table|truncate|portal_password/i.test(q), 'nothing destructive');
  });

  console.log(`\nEarned scores: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
