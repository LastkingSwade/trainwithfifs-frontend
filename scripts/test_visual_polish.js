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
console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
process.exit(failed ? 1 : 0);
