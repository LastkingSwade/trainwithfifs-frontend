/**
 * TrainWithFIFS - Course catalog labels & booking window text regression suite (offline)
 *
 * Covers: every course card's "Select Base (...)" button shows the same price as the card and as the server's price list,
 * the page's and the script's tier tables agree with the server prices, and the booking window / form card never print
 * the word "undefined" (the script file's tier tables carry prices only, no titles, badges or descriptions).
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');
require('./lib/ts-loader');

const ROOT = path.resolve(__dirname, '..');
const PAGE = fs.readFileSync(path.join(ROOT, 'src/app/page.tsx'), 'utf-8');
const SCRIPT = fs.readFileSync(path.join(ROOT, 'public/scripts/TrainWithFIFS_scripts.js'), 'utf-8');
const { COURSE_PRICING } = require(path.join(ROOT, 'src/Lib/pricing.ts'));

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ PASS: ${name}`); }
  catch (err) { failed++; console.log(`  ✗ FAIL: ${name}\n    -> ${err.message}`); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

/** Returns the source from `start` (an index at or before the opening brace) through its matching closing brace. */
function balanced(src, start, open = '{', close = '}') {
  let i = src.indexOf(open, start), depth = 0;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') { const q = c; i++; while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++; } continue; }
    if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); continue; }
    if (c === open) depth++;
    else if (c === close && --depth === 0) return src.slice(start, i + 1);
  }
  throw new Error('unbalanced');
}
const priceNumber = (text) => Number(String(text).replace(/[^0-9.]/g, ''));
const literalAfter = (src, marker) => new Function('return ' + balanced(src, src.indexOf('{', src.indexOf(marker)))).call(null);

const KEYS = Object.keys(COURSE_PRICING);
const pageTiers = literalAfter(PAGE, 'const COURSE_TIER_CONFIG: Record<string, any> =');
const scriptTierMarkers = [];
for (let at = SCRIPT.indexOf('var COURSE_TIER_CONFIG = {'); at >= 0; at = SCRIPT.indexOf('var COURSE_TIER_CONFIG = {', at + 10)) scriptTierMarkers.push(at);
const scriptTiers = scriptTierMarkers.map((at) => new Function('return ' + balanced(SCRIPT, SCRIPT.indexOf('{', at))).call(null));

console.log('================================================================');
console.log('🔒 COURSE CATALOG LABELS & BOOKING WINDOW TEXT REGRESSION SUITE (offline)');
console.log('================================================================\n');

console.log('[SECTION A: Prices agree everywhere]');
test('The page defines a button for every course, and each says "Select Base" with the server price', () => {
  assert(KEYS.length === 9, 'expected 9 courses in the server price list, got ' + KEYS.length);
  for (const key of KEYS) {
    const at = PAGE.indexOf(`id="btn-select-course-${key}"`);
    assert(at >= 0, 'missing card button for ' + key);
    const label = PAGE.slice(at, PAGE.indexOf('</button>', at)).match(/Select Base \(\$([0-9.]+)(?:\/hr)?\) (?:&|&amp;) Reserve Seat/);
    assert(label, 'no "Select Base (price)" label found for ' + key);
    assert(Number(label[1]) === COURSE_PRICING[key].base, `${key}: the button says $${label[1]} but the server charges $${COURSE_PRICING[key].base}`);
  }
});
test('The CCW + HQL combo button no longer says $199.99', () => {
  const at = PAGE.indexOf('id="btn-select-course-combo"');
  const seg = PAGE.slice(at, PAGE.indexOf('</button>', at));
  assert(/Select Base \(\$249\.99\) & Reserve Seat/.test(seg) && !/199\.99/.test(seg.replace(/selectCourse\([^)]*\)/g, '')), 'combo button text: ' + seg.replace(/\s+/g, ' ').slice(-120));
});
test('Each card\'s displayed price matches its button', () => {
  for (const key of KEYS) {
    const at = PAGE.indexOf(`id="price-course-${key}"`);
    assert(at >= 0, 'missing price element for ' + key);
    const shown = PAGE.slice(at, at + 1200).match(/>\s*\$([0-9]+(?:\.[0-9]+)?)\s*</);
    assert(shown && Number(shown[1]) === COURSE_PRICING[key].base, `${key}: the card shows $${shown && shown[1]} but the server charges $${COURSE_PRICING[key].base}`);
  }
});
test('The page\'s tier table matches the server price list (base and VIP) and the option text', () => {
  for (const key of KEYS) {
    const t = pageTiers[key];
    assert(t, 'page tier table missing ' + key);
    assert(priceNumber(t.basePrice) === COURSE_PRICING[key].base && priceNumber(t.vipPrice) === COURSE_PRICING[key].vip, `${key} prices differ from the server`);
    assert(priceNumber(t.baseValue.match(/\(\$([0-9.]+)/)[1]) === COURSE_PRICING[key].base && priceNumber(t.vipValue.match(/\(\$([0-9.]+)/)[1]) === COURSE_PRICING[key].vip, `${key} option text prices differ from the server`);
  }
});
test('Every copy of the tier table in the script file matches the server price list', () => {
  assert(scriptTiers.length >= 1, 'no tier table found in the script');
  scriptTiers.forEach((tiers, n) => {
    for (const key of KEYS) {
      const t = tiers[key];
      assert(t, `script copy ${n + 1} missing ${key}`);
      assert(priceNumber(t.basePrice) === COURSE_PRICING[key].base && priceNumber(t.vipPrice) === COURSE_PRICING[key].vip, `script copy ${n + 1}: ${key} prices differ from the server`);
      assert(priceNumber(t.baseValue.match(/\(\$([0-9.]+)/)[1]) === COURSE_PRICING[key].base, `script copy ${n + 1}: ${key} option text price differs`);
    }
  });
});

console.log('\n[SECTION B: The booking window and form card never print "undefined"]');
function recorder(selectedValue) {
  const writes = [];
  const elements = {};
  const make = (id) => {
    const el = { id, value: '', style: { setProperty() {} }, classList: { add() {}, remove() {} } };
    for (const prop of ['textContent', 'innerHTML', 'innerText']) {
      let v = '';
      Object.defineProperty(el, prop, { get: () => v, set: (x) => { v = String(x); writes.push({ id, prop, value: v }); } });
    }
    return el;
  };
  const get = (id) => (elements[id] || (elements[id] = make(id)));
  get('courseSelection').value = selectedValue;
  get('groupSize').value = '1';
  return { writes, document: { getElementById: get, querySelector: () => null, querySelectorAll: () => [], body: { classList: { add() {}, remove() {} }, style: {} } }, elements };
}
const invoice = () => ({ discountedTuition: 1, rangeFee: 1, mdTax: 1, grandTotal: 1, depositDueNow: 1, balanceDueClass: 1 });

// The page's version: extracted from page.tsx and compiled the same way the app compiles it.
function pageFormFunction() {
  const start = PAGE.indexOf('(window as any).updateFormPriceDisplay = function() {');
  assert(start >= 0, 'page updateFormPriceDisplay not found');
  const fnSrc = PAGE.slice(start, PAGE.indexOf('};', start + balanced(PAGE, start).length - 1) + 2);
  return ts.transpileModule(fnSrc, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None } }).outputText;
}
function runPage(selectedValue, tiers) {
  const r = recorder(selectedValue);
  const win = { calculateComprehensiveInvoice: invoice, COURSE_TIER_CONFIG: tiers };
  const ctx = vm.createContext({ window: win, document: r.document, console });
  vm.runInContext(pageFormFunction(), ctx);
  win.updateFormPriceDisplay();
  return r;
}
// The script's version: the real function from the script file, with the script's own (prices-only) tier table in scope.
function runScript(selectedValue, tiers) {
  const r = recorder(selectedValue);
  const at = SCRIPT.indexOf('function updateFormPriceDisplay() {');
  assert(at >= 0 && SCRIPT.indexOf('function updateFormPriceDisplay() {', at + 10) < 0, 'expected exactly one script updateFormPriceDisplay');
  const fnSrc = balanced(SCRIPT, at);
  const ctx = vm.createContext({ window: {}, document: r.document, console, COURSE_TIER_CONFIG: tiers });
  if (tiers === undefined) delete ctx.COURSE_TIER_CONFIG;
  vm.runInContext(fnSrc + '\nupdateFormPriceDisplay();', ctx);
  return r;
}
const options = [];
for (const key of KEYS) { options.push([key, 'base', pageTiers[key].baseValue]); options.push([key, 'vip', pageTiers[key].vipValue]); }
const courseNameOf = (value) => value.split('—')[0].trim();
const noBadWords = (r, label) => {
  const bad = r.writes.filter((w) => /undefined|\bnull\b|NaN/.test(w.value));
  assert(bad.length === 0, `${label}: printed ${bad.map((b) => b.id + '="' + b.value + '"').join('; ')}`);
};
const titleOf = (r) => (r.writes.filter((w) => w.id === 'bookingModalTitle').pop() || {}).value;

for (const [name, run] of [['page.tsx', runPage], ['script file', runScript]]) {
  test(`${name}: with the script's prices-only tier table, the Reserve title uses the course name and nothing prints "undefined" (all 18 options)`, () => {
    for (const [key, tier, value] of options) {
      const r = run(value, scriptTiers[scriptTiers.length - 1]);
      noBadWords(r, `${key} ${tier}`);
      const expected = tier === 'vip' ? `Reserve 👑 VIP ${courseNameOf(value)}` : `Reserve ${courseNameOf(value)}`;
      assert(titleOf(r) === expected, `${key} ${tier}: expected "${expected}", got "${titleOf(r)}"`);
    }
  });
  test(`${name}: with the complete tier table, the Reserve title uses the full course title (all 18 options)`, () => {
    for (const [key, tier, value] of options) {
      const r = run(value, pageTiers);
      noBadWords(r, `${key} ${tier}`);
      const expected = tier === 'vip' ? `Reserve 👑 VIP ${pageTiers[key].baseTitle}` : `Reserve ${pageTiers[key].baseTitle}`;
      assert(titleOf(r) === expected, `${key} ${tier}: expected "${expected}", got "${titleOf(r)}"`);
    }
  });
  test(`${name}: with no tier table at all, nothing prints "undefined" (all 18 options)`, () => {
    for (const [key, tier, value] of options) {
      const r = run(value, undefined);
      noBadWords(r, `${key} ${tier}`);
      assert(/^Reserve /.test(titleOf(r) || ''), `${key} ${tier}: no Reserve title was written`);
    }
  });
}
test('The two reported cases read exactly "Reserve Maryland CCW & HQL Combo" and "Reserve 👑 VIP Maryland CCW & HQL Combo" with the script table', () => {
  const base = runScript('Maryland CCW & HQL Combo — Base Track ($249.99)', scriptTiers[0]);
  const vip = runScript('Maryland CCW & HQL Combo — VIP Turnkey ($349.99)', scriptTiers[0]);
  assert(titleOf(base) === 'Reserve Maryland CCW & HQL Combo', titleOf(base));
  assert(titleOf(vip) === 'Reserve 👑 VIP Maryland CCW & HQL Combo', titleOf(vip));
});
test('The form card shows the correct combo prices ($249.99 base, $349.99 VIP)', () => {
  const r = runScript('Maryland CCW & HQL Combo — Base Track ($249.99)', scriptTiers[0]);
  const last = (id) => (r.writes.filter((w) => w.id === id).pop() || {}).value;
  assert(last('formCardActivePrice') === '$249.99' && last('formPriceBaseVal') === '$249.99' && last('formPriceVipVal') === '$349.99', JSON.stringify([last('formCardActivePrice'), last('formPriceBaseVal'), last('formPriceVipVal')]));
});
test('Source check: no raw template still builds "Reserve ${config.baseTitle}", and the script card-title write is guarded', () => {
  assert(!/Reserve (👑 VIP )?\$\{config\.baseTitle\}/.test(PAGE) && !/'Reserve (👑 VIP )?' \+ config\.baseTitle/.test(SCRIPT), 'a raw config.baseTitle reserve title is still present');
  assert(/if \(titleElem && \(config\.vipTitle \|\| config\.baseTitle\)\)/.test(SCRIPT), 'the script setCardTier title write must be guarded');
});

console.log('\n[SECTION C: every VIP price is exactly 40% above its base price]');
const cents = (n) => Math.round(n * 100);
const vipOf = (base) => cents(base * 1.4);
test('Server price list: each VIP price is the base price x 1.4 (to the cent)', () => {
  for (const key of KEYS) assert(cents(COURSE_PRICING[key].vip) === vipOf(COURSE_PRICING[key].base), `${key}: base ${COURSE_PRICING[key].base}, VIP ${COURSE_PRICING[key].vip}, expected ${vipOf(COURSE_PRICING[key].base) / 100}`);
});
function scanPairs(label, src, re) {
  const found = [...src.matchAll(re)];
  found.forEach((m) => assert(vipOf(Number(m[1])) === cents(Number(m[2])), `${label}: base $${m[1]} / VIP $${m[2]} is not +40% (${m[0].replace(/\s+/g, ' ').slice(0, 90)})`));
  return found.length;
}
const PAIR_PATTERNS = [
  ['unitBase/unitVip', /unitBase = ([0-9.]+);\s*unitVip = ([0-9.]+)/g],
  ['basePrice/vipPrice', /basePrice: "\$([0-9.]+)[^"]*",\s*vipPrice: "\$([0-9.]+)/g],
  ['base/vip form table', /base: "\$([0-9.]+)(?:\/hr)?",\s*vip: "\$([0-9.]+)/g],
  ['Base / VIP text', /\$([0-9.]+) Base \/ \$([0-9.]+)(?:\/hr)? VIP/g],
  ['Base / VIP markup', /\$([0-9.]+) <span[^>]*>Base<\/span> \/ \$([0-9.]+) <span[^>]*>VIP/g]
];
test('Page: every base/VIP pair written in page.tsx is +40%', () => {
  let n = 0;
  for (const [label, re] of PAIR_PATTERNS) n += scanPairs('page ' + label, PAGE, re);
  assert(n >= 25, 'expected to find many price pairs in the page, found ' + n);
});
test('Script file: every base/VIP pair written in the script is +40%', () => {
  let n = 0;
  for (const [label, re] of PAIR_PATTERNS) n += scanPairs('script ' + label, SCRIPT, re);
  assert(n >= 60, 'expected to find many price pairs in the script, found ' + n);
});
test('The option labels in the page agree with the server for every course (Base and VIP)', () => {
  const names = { mastery: 'Mid-Atlantic Multi-State Mastery', combo: 'Maryland CCW & HQL Combo', ccw: 'Maryland Wear & Carry (CCW)', renewal: 'Maryland Wear & Carry (8-Hour Renewal)', hql: 'Maryland HQL (Purchase License)', coaching: 'Personal 1-on-1 Coaching', cleaning: 'Gun Cleaning & Maintenance', children: "Children's Safety Class", alumni: 'FIFS Graduate Alumni Marksmanship Clinic' };
  for (const key of KEYS) {
    const esc = names[key].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    for (const src of [PAGE, SCRIPT]) {
      for (const m of src.matchAll(new RegExp(esc + ' — VIP Turnkey \\(\\$([0-9.]+)', 'g'))) assert(cents(Number(m[1])) === cents(COURSE_PRICING[key].vip), `${key}: option text VIP $${m[1]} != server ${COURSE_PRICING[key].vip}`);
      for (const m of src.matchAll(new RegExp(esc + ' — Base Track \\(\\$([0-9.]+)', 'g'))) assert(cents(Number(m[1])) === cents(COURSE_PRICING[key].base), `${key}: option text Base $${m[1]} != server ${COURSE_PRICING[key].base}`);
    }
  }
});
test('Checkout total for a VIP combo is charged at $349.99 per person (server-authoritative)', () => {
  const { calculatePricingBreakdown } = require(path.join(ROOT, 'src/Lib/pricing.ts'));
  const r = calculatePricingBreakdown('Maryland CCW & HQL Combo — VIP Turnkey', 1, true);
  assert(r.baseTuitionPerPerson === 349.99 && r.isVip, JSON.stringify(r));
});

console.log('\n================================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
console.log('================================================================');
process.exit(failed > 0 ? 1 : 0);
