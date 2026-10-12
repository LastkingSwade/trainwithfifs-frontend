// Visual polish (offline): static checks that each refinement is in place and that the rules the owner set stay true.
const fs = require('fs'); const path = require('path');
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
console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
process.exit(failed ? 1 : 0);
