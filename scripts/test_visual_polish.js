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
  assert(/<html lang="en" data-noir=\{process\.env\.NEXT_PUBLIC_NOIR === "off" \? "off" : "on"\} className=\{`\$\{geist\.variable\} \$\{geistMono\.variable\} \$\{rajdhani\.variable\} \$\{noirDisplay\.variable\}`\}>/.test(L), 'the font variables (the three originals plus the NOIR display font) are set on <html>');
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
test('V5 Cards ease in on scroll with pure CSS: only where supported, only when motion is allowed, opacity and translate only, and never on cards that already animate', () => {
  const t = GCSS.slice(GCSS.indexOf('V5 Scroll-in'));
  assert(/@media \(prefers-reduced-motion: no-preference\) \{\s*@supports \(animation-timeline: view\(\)\)/.test(t), 'inside both the motion-allowed and the supported checks');
  const sel = /\n\s*([^{]+) \{\s*animation: fifs-scroll-in linear both;/.exec(t); assert(sel, 'selector found');
  assert(!/tuition-card|corridor-route-card/.test(sel[1]), 'cards that already have their own entrance animation are left alone');
  assert(/@keyframes fifs-scroll-in \{ from \{ opacity: 0; translate: 0 26px; \} to \{ opacity: 1; translate: 0 0; \} \}/.test(t), 'only opacity and translate change (no layout properties)');
  assert(!/(^|[^-])(top|left|width|height|margin)\s*:/.test(t.split('@keyframes')[1] || ''), 'no layout-triggering properties');
});
test('C1 Colorful emoji are back: the home screen and the floating chat button use real emoji, and no script swaps emoji for icons', () => {
  const hero = PAGE.slice(PAGE.indexOf('className="hero-intro-card"'), PAGE.indexOf('Official Google Reviews'));
  for (const e of ['🛡️', '🎯', '⭐', '⚡', '👤', '❓', '💬']) assert(hero.includes(e), 'hero keeps ' + e);
  assert(!fs.existsSync(path.join(ROOT, 'src/ui/emojiToIcons.ts')) && !fs.existsSync(path.join(ROOT, 'src/ui/EmojiIcons.tsx')) && !/EmojiIcons|fi-ico/.test(R('src/app/layout.tsx') + PAGE), 'the icon swap is gone');
});
test('C2 Text has real color: headings cyan, card titles gold, prices amber, body copy a cool blue-tint instead of gray, and every pair stays at WCAG AA or better', () => {
  const t = GCSS.slice(GCSS.indexOf('C2 Color roles'));
  const tok = {}; for (const m of t.matchAll(/--(ink-[a-z]+|text-muted): (#[0-9a-f]{6});/g)) tok[m[1]] = m[2];
  for (const k of ['ink-head', 'ink-title', 'ink-price', 'ink-body', 'ink-soft', 'text-muted']) assert(tok[k], k + ' defined');
  const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  for (const bg of ['#090d16', '#0d1622', '#101a28']) for (const k of Object.keys(tok)) assert(ratio(tok[k], bg) >= 7, k + ' ' + tok[k] + ' on ' + bg + ' is only ' + ratio(tok[k], bg).toFixed(1) + ':1');
  assert(/\.price-val \{ color: var\(--ink-price\) !important; \}/.test(t) && /\.tuition-title/.test(t) && /var\(--ink-head\) !important/.test(t), 'headings, titles and prices are covered');
  assert(/\.start-journey-btn \.prime-label \{ color: var\(--ink-head\) !important; \}/.test(t), 'the home journey button leads in cyan');
  assert(!/linear-gradient|background-clip: text|-webkit-text-fill/.test(t), 'solid colours, not gradient text');
});
test('C3 Visitors never see the word "Supabase": every message, button, tooltip, confirm box and email in the visitor-facing files says "Future Initiative" instead', () => {
  const files = ['src/app/page.tsx', 'public/scripts/TrainWithFIFS_scripts.js', 'src/app/api/fifs/route.ts', ...fs.readdirSync(path.join(ROOT, 'src/portal')).filter((f) => /\.tsx?$/.test(f)).map((f) => 'src/portal/' + f), ...['online', 'group', 'polish', 'delight'].flatMap((d) => (fs.existsSync(path.join(ROOT, 'src', d)) ? fs.readdirSync(path.join(ROOT, 'src', d)).filter((f) => /\.tsx?$/.test(f)).map((f) => 'src/' + d + '/' + f) : []))];
  const bad = [];
  for (const f of files) R(f).split('\n').forEach((line, i) => {
    if (!/Supabase/.test(line)) return; const t = line.trim();
    if (/^(\/\/|\*|\/\*)/.test(t) || /^\s*(import|export .* from)/.test(line)) return;
    const stripped = line.replace(/[A-Za-z_]Supabase|Supabase[A-Za-z_]/g, ''); // names in code, such as createSupabaseClient
    if (!/Supabase/.test(stripped)) return;
    if (/console\.(log|warn|error|info)\(/.test(line) && !/(alert|showStatus|textContent|innerHTML|setMsg|confirm)\(?/.test(line)) return; // developer logs are not shown to visitors
    bad.push(f + ':' + (i + 1) + ' ' + t.slice(0, 90));
  });
  assert(bad.length === 0, 'visible "Supabase" found: ' + bad.slice(0, 5).join(' | '));
  assert(!/\.supabase\.co/.test(R('src/app/page.tsx')), 'no Supabase web address in the page (it used to show the real project address in an admin form hint)');
  assert(!/supabase\.co/.test(R('public/scripts/TrainWithFIFS_scripts.js')), 'no Supabase web address in the site script either');
  const NC = R('next.config.ts'); assert(/async rewrites\(\)/.test(NC) && /source: "\/files\/:name\(\[A-Za-z0-9_\.-\]\+\\\\\.pdf\)"/.test(NC), 'public PDFs are served from /files/ and only for plain PDF file names');
  assert(/Future Initiative did not return a password setup link\./.test(R('src/app/api/fifs/route.ts')) && /through the Future Initiative secure account recovery flow/.test(R('src/app/api/fifs/route.ts')), 'the setup email and server messages use the new wording');
});
console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
process.exit(failed ? 1 : 0);
