/**
 * TrainWithFIFS - Reciprocity Hub data: the "honors a Maryland permit" answers that were checked against each state's official page on 2026-10-21 (offline)
 * This locks in what was verified so nobody changes it by accident, and checks the table is complete and well formed. It does not claim the rest of the table (duties, magazine limits, vehicle rules) has been reviewed.
 */
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
const src = read('public/scripts/TrainWithFIFS_scripts.js'); const a = src.indexOf('var RECIPROCITY_STATES_DATA = {'); const b = src.indexOf('};', a) + 2;
const D = vm.runInNewContext('(function(){' + src.slice(a, b) + ' return RECIPROCITY_STATES_DATA; })()');

(async () => {
  await test('the table covers all 50 states plus DC, each with the fields the hub uses', () => {
    eq(Object.keys(D).length, 51); for (const [c, s] of Object.entries(D)) { assert(/^[A-Z]{2}$/.test(c) && s.name, c); for (const k of ['constCarry', 'honorsMD', 'honorsUT', 'honorsFL']) assert(typeof s[k] === 'boolean', c + ' ' + k); for (const k of ['duty', 'mag', 'vehicle', 'notes']) assert(typeof s[k] === 'string' && s[k].length > 3, c + ' ' + k); }
  });
  await test('"honors a Maryland permit" matches each permit-required state\'s official page as checked on 2026-10-21 (CA CO CT DE IL MA MI MN NJ NM NV NY NC PA VA WA WI)', () => {
    const official = { CA: false, CO: false, CT: false, DE: false, IL: false, MA: false, MI: true, MN: true, NJ: false, NM: false, NV: false, NY: false, NC: true, PA: false, VA: true, WA: false, WI: true };
    for (const [c, want] of Object.entries(official)) { assert(D[c].constCarry === false, c + ' needs a permit'); eq(D[c].honorsMD, want, c + ' honorsMD'); }
  });
  await test('Minnesota: honors Maryland, does not recognize Utah or Florida (its official list says so)', () => { eq([D.MN.honorsMD, D.MN.honorsUT, D.MN.honorsFL], [true, false, false]); assert(/Maryland/.test(D.MN.notes) && /not recognized/.test(D.MN.notes), D.MN.notes); });
  await test('Wisconsin honors Maryland and Utah permits for non-residents 21 and older and Florida NON-RESIDENT licenses only', () => { eq([D.WI.honorsMD, D.WI.honorsUT, D.WI.honorsFL], [true, true, true]); assert(/21/.test(D.WI.notes) && /NON-RESIDENT/.test(D.WI.notes), D.WI.notes); });
  await test('Virginia warns about the July 1, 2027 change and the 21+ and photo ID conditions', () => { assert(/July 1, 2027/.test(D.VA.notes) && /21 or older/.test(D.VA.notes) && /photo ID/.test(D.VA.notes), D.VA.notes); });
  await test('Washington\'s note no longer claims there is no reciprocity at all, and the cautious Utah answer is kept with the reason', () => { assert(!/No out-of-state reciprocity/.test(D.WA.notes) && /does not say whether a non-resident Utah permit qualifies/.test(D.WA.notes), D.WA.notes); eq(D.WA.honorsUT, false); });
  await test('states checked for Utah and Florida match their official pages: DE yes/yes, NV yes/yes, NM no/yes, PA no/no, MN no/no', () => {
    for (const [c, ut, fl] of [['DE', true, true], ['NV', true, true], ['NM', false, true], ['PA', false, false], ['MN', false, false], ['WI', true, true]]) eq([D[c].honorsUT, D[c].honorsFL], [ut, fl], c);
  });
  await test('the check is written down: what was verified, what was not, and the open questions', () => {
    const d = read('docs/RECIPROCITY-CHECK.md'); for (const w of [/2026-10-21/, /Minnesota/, /Hawaii/, /Oregon/, /Rhode Island/, /District of Columbia/, /not (yet )?(verified|confirmed)/i, /July 1, 2027/]) assert(w.test(d), String(w));
  });
  console.log(`\nReciprocity data: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
