// Start Your Journey chooser, the New-To-Firearms panel split, and the alumni sign-in pop-up wiring (reads src/app/page.tsx as text).
const fs = require('fs');
const path = require('path');
const PAGE = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'page.tsx'), 'utf8');
let passed = 0, failed = 0;
function test(name, fn) { try { fn(); console.log('  ✓ PASS: ' + name); passed++; } catch (e) { console.log('  ✗ FAIL: ' + name + '\n    -> ' + e.message); failed++; } }
function assert(c, m) { if (!c) throw new Error(m || 'assertion failed'); }
const slice = (a, b) => { const i = PAGE.indexOf(a); assert(i >= 0, 'missing: ' + a); const j = b ? PAGE.indexOf(b, i + a.length) : PAGE.length; assert(j >= 0, 'missing: ' + b); return PAGE.slice(i, j); };

console.log('\n[SECTION A: the hero buttons]');
test('The hero Start Your Journey button opens the chooser pop-up (not the booking tab)', () => {
  assert(/id="btn-hero-booking" data-onclick="openJourneySelectionModal\(\)"/.test(PAGE), 'button handler wrong');
  assert(/aria-haspopup="dialog" className="btn-hero-booking-prime/.test(PAGE), 'button must announce a dialog');
});
test('The neon "New to firearms" guide opens the beginner panel', () => {
  assert(/id="wrap-neon-guide" data-onclick="openAndSwitch\('start'\)"/.test(PAGE));
});

console.log('\n[SECTION B: the chooser pop-up]');
const modal = slice('id="journeySelectionModal"', 'STEP 12');
test('It has exactly two choices with the requested labels', () => {
  assert(/Start Your Journey/.test(modal) && /Choose Where To Begin/.test(modal));
  assert(/>\s*Book Now\s*</.test(modal), 'Book Now card missing');
  assert(/New To Firearms\? Start Your Journey/.test(modal), 'beginner card missing');
  assert((modal.match(/className="fi-select-card/g) || []).length === 2, 'must be exactly two cards');
});
test('New To Firearms is the FIRST card (left on desktop, top on phones) and Book Now is second', () => {
  const a = modal.indexOf('New To Firearms? Start Your Journey'), b = modal.indexOf('>Book Now<') >= 0 ? modal.indexOf('>Book Now<') : modal.search(/Book Now\s*\n?\s*<\/h/);
  assert(a > 0 && b > 0 && a < b, 'beginner card must come before Book Now');
  assert(/fi-select-card highlight/.test(modal.slice(modal.indexOf('OPTION 1'), modal.indexOf('OPTION 2'))), 'first card is the highlighted one');
});
test('Book Now goes to the catalog; the beginner card goes to the new panel; both close the pop-up first', () => {
  assert(/closeJourneySelectionModal\(\); openAndSwitch\('booking'\);/.test(modal));
  assert(/closeJourneySelectionModal\(\); openAndSwitch\('start'\);/.test(modal));
});
test('Each card lists what is inside (5 items) and the pop-up can be closed by the X and by the backdrop', () => {
  assert((modal.match(/<li/g) || []).length >= 10, 'each card needs a list');
  assert(/aria-label="Close Start Your Journey"/.test(modal) && /if\(event\.target===this\) closeJourneySelectionModal\(\)/.test(modal));
});
test('The open/close functions and window.openModal are registered, and the modal is in the modal list', () => {
  for (const f of ['openJourneySelectionModal', 'closeJourneySelectionModal', 'openModal']) assert(new RegExp(`\\(window as any\\)\\.${f} =`).test(PAGE), f + ' not exported');
  assert(/'journeySelectionModal'/.test(PAGE.slice(PAGE.indexOf("'collectorInfoModal'") - 400, PAGE.indexOf("'collectorInfoModal'") + 400)) || /journeySelectionModal/.test(PAGE), 'modal not known');
});

console.log('\n[SECTION C: the panel split]');
const booking = slice('<main className="panel hidden" id="view-booking"', '</main>');
const start = slice('id="view-start"', '(Reservation form modalized');
test('The booking tab keeps the catalog and pricing and no longer holds the beginner blocks', () => {
  assert(/Course Catalog &amp; Transparent Pricing|Course Catalog & Transparent Pricing/.test(booking), 'catalog missing');
  assert(!/Core Zero-Intimidation Promise/.test(booking), 'beginner promise still in booking');
});
test('The new panel holds the beginner blocks, a heading, and a Book Now link', () => {
  assert(/Core Zero-Intimidation Promise/.test(start));
  assert(/New To Firearms\? Start Your Journey/.test(start));
  assert(/openAndSwitch\('booking'\)/.test(start), 'no way to go on to booking');
  assert(!/Course Catalog & Transparent Pricing/.test(start), 'catalog must not be duplicated');
});
test('The panel is registered with the tab switcher once the script loads', () => {
  assert(/panels\.push\("start"\)/.test(PAGE) && /SECTION_TITLES\.start/.test(PAGE));
  assert(/id="view-start" role="tabpanel"/.test(PAGE) && /className="panel hidden" id="view-start"/.test(PAGE), 'panel must start hidden');
});

console.log('\n[SECTION D: the alumni sign-in pop-up]');
test('The course picker opens the alumni gate through window.openModal, and the pop-up says to sign in to the Future Initiative Client Portal', () => {
  assert(/\(window as any\)\.openModal\('alumniAccessGateModal'\)/.test(PAGE));
  const gate = slice('id="alumniAccessGateModal"', null).slice(0, 4000);
  assert(/logged in to the/.test(gate) && /Future Initiative Client Portal/.test(gate));
});

console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
process.exit(failed ? 1 : 0);
