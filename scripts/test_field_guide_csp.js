/**
 * TrainWithFIFS - Standalone HTML pages vs. the site's Content-Security-Policy (offline)
 *
 * The CSP in next.config.ts applies to every path, including the static pages in public/. This suite checks
 * that the SOP Field Guide loads nothing the CSP would block, and that its styling does not depend on the
 * Tailwind CDN script (which the CSP blocks): every utility class the page uses must have a rule in the
 * compiled CSS embedded in the page. Nothing here uses the network.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const config = fs.readFileSync(path.join(ROOT, 'next.config.ts'), 'utf-8');

let passed = 0, failed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log(`  ✓ PASS: ${name}`); }
  catch (e) { failed++; console.log(`  ✗ FAIL: ${name}\n      ${e.message}`); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

function directive(name) {
  const m = config.match(new RegExp(name + '\\s+([^;]+);'));
  if (!m) throw new Error(`CSP directive not found in next.config.ts: ${name}`);
  return m[1].trim().split(/\s+/);
}
const originOf = (url) => { const u = new URL(url); return u.origin; };
const allowed = (sources, url) => sources.includes(originOf(url)) || sources.includes('https:');

// A known allowance for classes that are not valid Tailwind and so never produced CSS, even with the CDN.
const KNOWN_UNSTYLED = new Set(['bg-crimson-950/40', 'py-0.2']);

async function main() {
  console.log('================================================================');
  console.log('🔒 FIELD GUIDE / CSP COMPLIANCE SUITE (offline)');
  console.log('================================================================\n');

  const htmlFiles = fs.readdirSync(PUBLIC).filter((f) => f.endsWith('.html'));
  assert(htmlFiles.length > 0, 'expected at least one standalone HTML page in public/');
  const scriptSrc = directive('script-src'), styleSrc = directive('style-src'), fontSrc = directive('font-src');

  console.log('[SECTION A: What the pages load]');
  for (const file of htmlFiles) {
    const html = fs.readFileSync(path.join(PUBLIC, file), 'utf-8');
    await test(`${file}: every external script is allowed by the CSP, and no Tailwind CDN or runtime config remains`, async () => {
      const srcs = [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/gi)].map((m) => m[1]).filter((u) => /^https?:\/\//i.test(u));
      for (const u of srcs) assert(allowed(scriptSrc, u), `script ${u} is blocked by script-src (${scriptSrc.join(' ')})`);
      assert(!/cdn\.tailwindcss\.com/i.test(html), 'the Tailwind CDN is referenced');
      assert(!/\btailwind\.config\b/.test(html), 'a Tailwind runtime config is present; it throws once the CDN script is gone');
    });
    await test(`${file}: stylesheets and fonts come only from origins the CSP allows`, async () => {
      const sheets = [...html.matchAll(/<link[^>]*\shref="(https?:[^"]+)"[^>]*rel="stylesheet"|<link[^>]*rel="stylesheet"[^>]*\shref="(https?:[^"]+)"/gi)].map((m) => (m[1] || m[2]).replace(/&amp;/g, '&'));
      for (const u of sheets) assert(allowed(styleSrc, u), `stylesheet ${u} is blocked by style-src`);
      for (const m of html.matchAll(/<link[^>]*rel="preconnect"[^>]*href="(https?:[^"]+)"/gi)) {
        assert(allowed(styleSrc, m[1]) || allowed(fontSrc, m[1]), `preconnect ${m[1]} is to an origin the CSP does not allow for styles or fonts`);
      }
      const sourcesText = html.replace(/<style[\s\S]*?<\/style>/gi, '');
      assert(!/@import\s+url\(\s*['"]?https?:/i.test(sourcesText), 'an @import from another origin is present');
    });
  }

  console.log('\n[SECTION B: Styling does not depend on the blocked script]');
  const guide = fs.readFileSync(path.join(PUBLIC, 'FIFS-34-State-Multi-Permit-SOP-Field-Guide.html'), 'utf-8');
  const styles = [...guide.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]);
  const compiled = styles.find((css) => css.includes('--tw-border-spacing-x') && css.includes('.hidden{display:none}')) || '';
  await test('The compiled Tailwind CSS (preflight, utilities, brand colors, responsive and hover variants) is embedded', async () => {
    assert(compiled.length > 20000, 'the embedded compiled CSS is missing or truncated');
    assert(/\.bg-brand-gold\{/.test(compiled) && /\.text-brand-cyan\{/.test(compiled), 'the custom brand colors are not in the compiled CSS');
    assert(/@media \(min-width: ?640px\)/.test(compiled) && /@media \(min-width: ?1024px\)/.test(compiled), 'responsive rules are missing');
    assert(/\.hover\\:/.test(compiled), 'hover variants are missing');
  });
  await test('Every utility class used in the page markup or its scripts has a rule in the page CSS', async () => {
    const body = guide.slice(guide.indexOf('<body'));
    const markup = body.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
    const used = new Set();
    for (const m of markup.matchAll(/\bclass="([^"]*)"/g)) m[1].split(/\s+/).filter(Boolean).forEach((c) => used.add(c));
    const scripts = [...body.matchAll(/<script>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).join('\n');
    for (const m of scripts.matchAll(/class(?:Name)?\s*=\s*["']([^"']+)["']/g)) m[1].split(/\s+/).forEach((c) => c && used.add(c));
    for (const m of scripts.matchAll(/classList\.\w+\(([^)]*)\)/g)) for (const q of m[1].matchAll(/'([^']+)'/g)) used.add(q[1]);
    const have = new Set();
    for (const css of styles) for (const m of css.matchAll(/\.((?:\\.|[A-Za-z0-9_-])+)/g)) have.add(m[1].replace(/\\(.)/g, '$1'));
    const missing = [...used].filter((c) => !have.has(c) && !KNOWN_UNSTYLED.has(c));
    assert(used.size > 300, `expected the page to use hundreds of classes, found ${used.size}`);
    assert(missing.length === 0, `classes with no CSS rule (they would be unstyled without the CDN): ${missing.join(', ')}`);
  });

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
  console.log('================================================================');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error('Suite crashed:', e && e.stack); process.exit(1); });
