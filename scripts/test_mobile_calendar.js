/**
 * TrainWithFIFS - mobile booking calendar regression suite (offline)
 *
 * Bug: on phones the booking calendar showed as one tall vertical column instead of a 7-column week grid, because a mobile rule for
 * pop-ups (".goal-modal-box [style*=grid-template-columns] { grid-template-columns: 1fr !important }") stacked every inline grid.
 * The fix is a MORE SPECIFIC rule that keeps the calendar's two grids at 7 columns. These checks read the real stylesheet and page,
 * compare selector specificity, and confirm the markup the rules depend on. (A real-browser measurement at 320-1280 px was also done
 * by hand when the fix was made; this suite keeps the logic from regressing without needing a browser.)
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const CSS = fs.readFileSync(path.join(ROOT, 'src/app/globals.css'), 'utf-8');
const PAGE = fs.readFileSync(path.join(ROOT, 'src/app/page.tsx'), 'utf-8');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ PASS: ${name}`); }
  catch (err) { failed++; console.log(`  ✗ FAIL: ${name}\n    -> ${err.message}`); }
}
function assert(c, m) { if (!c) throw new Error(m); }

/** [ids, classes+attributes+pseudo-classes] for one selector (no commas). */
function specificity(selector) {
  const s = selector.replace(/\[[^\]]*\]/g, ' [a] ').replace(/::?[a-z-]+(\([^)]*\))?/gi, (m) => (m.startsWith('::') ? ' ' : ' :p '));
  const ids = (s.match(/#[\w-]+/g) || []).length;
  const rest = (s.match(/\.[\w-]+/g) || []).length + (s.match(/\[a\]/g) || []).length + (s.match(/ :p /g) || []).length;
  return [ids, rest];
}
const higher = (a, b) => a[0] > b[0] || (a[0] === b[0] && a[1] > b[1]);

/** Every top-level "@media (max-width: 768px) { ... }" block with its start index. */
function mobileBlocks() {
  const blocks = [];
  const re = /@media\s*\(max-width:\s*768px\)\s*\{/g;
  let m;
  while ((m = re.exec(CSS))) {
    let depth = 1, i = re.lastIndex;
    for (; i < CSS.length && depth > 0; i++) { if (CSS[i] === '{') depth++; else if (CSS[i] === '}') depth--; }
    blocks.push({ start: m.index, body: CSS.slice(re.lastIndex, i - 1) });
  }
  return blocks;
}
const rulesOf = (body) => [...body.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selectors: m[1].split(',').map((x) => x.trim()).filter(Boolean), decl: m[2] }));

const blocks = mobileBlocks();
const stacking = blocks.flatMap((b) => rulesOf(b.body).filter((r) => /grid-template-columns:\s*1fr\s*!important/.test(r.decl) && r.selectors.some((s) => /goal-modal-box/.test(s)).valueOf()).map((r) => ({ ...r, start: b.start })));
const overrides = blocks.flatMap((b) => rulesOf(b.body).filter((r) => r.selectors.some((s) => /booking-calendar-card/.test(s))).map((r) => ({ ...r, start: b.start })));

console.log('\n[SECTION A: the stylesheet keeps the calendar at 7 columns on phones]');
test('The pop-up rule that stacks inline grids still exists (this is what the calendar must be protected from)', () => {
  assert(stacking.length >= 1, 'stacking rule not found; if it was removed, re-check that the calendar rules are still needed');
});
test('A phone rule restores 7 equal columns for the calendar with !important', () => {
  const r = overrides.find((x) => /grid-template-columns:\s*repeat\(7,\s*minmax\(0,\s*1fr\)\)\s*!important/.test(x.decl));
  assert(r, 'no calendar rule sets grid-template-columns: repeat(7, minmax(0, 1fr)) !important inside @media (max-width: 768px)');
});
test('The calendar rule is MORE specific than every stacking selector it must beat, and comes after them', () => {
  const calSel = overrides.flatMap((o) => o.selectors).find((s) => /\[style\*="repeat\(7"\]/.test(s));
  assert(calSel, 'calendar selector not found');
  const cal = specificity(calSel);
  for (const rule of stacking) {
    for (const sel of rule.selectors.filter((s) => /goal-modal-box/.test(s))) {
      assert(higher(cal, specificity(sel)), `calendar selector "${calSel}" (${cal}) does not beat "${sel}" (${specificity(sel)})`);
    }
  }
  const calStart = Math.min(...overrides.map((o) => o.start));
  assert(calStart > Math.max(...stacking.map((s) => s.start)), 'the calendar override must come after the stacking rule');
});
test('The days grid has no forced 320px minimum on phones (it made the days wider than the weekday row on 320-360px screens)', () => {
  const r = overrides.find((x) => x.selectors.some((s) => /#bookingCalDaysGrid/.test(s)) && /min-width:\s*0\s*!important/.test(x.decl));
  assert(r, 'no #bookingCalDaysGrid min-width: 0 !important override inside the phone media query');
  const older = blocks.flatMap((b) => rulesOf(b.body)).find((x) => x.selectors.includes('#bookingCalDaysGrid') && /min-width:\s*320px/.test(x.decl));
  if (older) {
    const olderSel = '#bookingCalDaysGrid';
    const ours = overrides.flatMap((o) => o.selectors).find((s) => /#bookingCalDaysGrid/.test(s));
    assert(higher(specificity(ours), specificity(olderSel)), 'the min-width override must beat the older #bookingCalDaysGrid rule');
  }
});
test('The weekday header and the days grid keep a small gap (header none, days 1px)', () => {
  assert(overrides.some((o) => o.selectors.some((s) => /repeat\(7/.test(s)) && /gap:\s*0\s*!important/.test(o.decl)), 'header gap rule missing');
  assert(overrides.some((o) => o.selectors.some((s) => /#bookingCalDaysGrid/.test(s)) && /gap:\s*1px\s*!important/.test(o.decl)), 'days gap rule missing');
});
test('Other pop-up grids still stack on phones (the fix is limited to the calendar)', () => {
  for (const o of overrides) for (const sel of o.selectors) assert(/booking-calendar-card/.test(sel), `override "${sel}" is not limited to the calendar card`);
});

console.log('\n[SECTION B: the markup the rules depend on]');
test('Both calendar grids sit inside .booking-calendar-card and are 7-column inline grids', () => {
  const card = PAGE.indexOf('className="booking-calendar-card"');
  assert(card > 0, 'booking-calendar-card not found');
  const next = PAGE.indexOf('id="bookingCalSelectedDateText"', card);
  const region = PAGE.slice(card, next);
  assert((region.match(/"gridTemplateColumns": "repeat\(7, 1fr\)"/g) || []).length === 2, 'expected exactly two repeat(7, 1fr) grids (weekday header and days) in the calendar card');
  assert(/id="bookingCalDaysGrid"/.test(region), 'bookingCalDaysGrid must be inside the card');
});
test('The calendar lives inside the booking pop-up (.goal-modal-box), which is where the stacking rule applies', () => {
  const modal = PAGE.indexOf('id="courseBookingModal"');
  const card = PAGE.indexOf('className="booking-calendar-card"');
  const box = PAGE.indexOf('goal-modal-box', modal);
  assert(modal > 0 && box > modal && card > box, 'calendar card is not inside the booking pop-up box');
});

console.log('\n================================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
console.log('================================================================');
process.exit(failed > 0 ? 1 : 0);
