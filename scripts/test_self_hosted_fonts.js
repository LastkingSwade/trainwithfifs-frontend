/**
 * TrainWithFIFS - fonts come from this project, and the GitHub release check is parked until it is set up (offline)
 * The site no longer downloads fonts from Google when it is built (that failed twice). The font files are kept in src/fonts and loaded by the platform's local font loader.
 * The "Production Deployment Verification" job used to fail on every push (its Vercel secrets were never added); it now runs only once it has been switched on.
 */
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const layout = read('src/app/layout.tsx');
const FILES = ['geist-latin', 'geist-mono-latin', 'rajdhani-500-latin', 'rajdhani-600-latin', 'rajdhani-700-latin', 'cormorant-garamond-latin'];

(async () => {
  await test('every font the site uses is a real font file kept in src/fonts (valid WOFF2, a sensible size) and is the one the layout loads', () => {
    for (const f of FILES) { const buf = fs.readFileSync(path.join(ROOT, 'src/fonts', f + '.woff2')); assert(buf.subarray(0, 4).toString('latin1') === 'wOF2', f + ' is a WOFF2 file'); assert(buf.length > 5000 && buf.length < 120000, f + ' size ' + buf.length); assert(layout.includes(`../fonts/${f}.woff2`), f + ' is loaded by the layout'); }
    assert(fs.readdirSync(path.join(ROOT, 'src/fonts')).filter((x) => /\.woff2$/.test(x)).length === FILES.length, 'no stray or missing font files');
  });
  await test('nothing is fetched from Google for fonts: the layout uses the local loader only, there is no Google link left in the pages, and no font URL points outside the site', () => {
    assert(/from "next\/font\/local"/.test(layout) && !/next\/font\/google/.test(layout), 'local loader only'); const page = read('src/app/page.tsx'); assert(!/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(page + layout), 'no Google font links');
    assert(!/https?:\/\//.test(layout.slice(layout.indexOf('const geist = localFont'), layout.indexOf('export const metadata'))), 'no outside address in the font setup');
  });
  await test('the same four font families and CSS variables are still provided, with system fallbacks (so nothing about the site\'s look changes)', () => {
    for (const v of ['--font-geist"', '--font-geist-mono"', '--font-rajdhani"', '--font-noir-display"']) assert(layout.includes(v), v + ' still set'); assert((layout.match(/weight: "100 900"/g) || []).length === 2 && (layout.match(/display: "swap"/g) || []).length === 4 && /weight: "500 600"/.test(layout), 'same weights and swap behaviour for all four fonts');
    assert((layout.match(/fallback: \["system-ui", "arial"\]/g) || []).length === 2 && /"ui-monospace"/.test(layout) && /"Georgia", "serif"/.test(layout), 'system fallbacks kept (written out, as the font loader requires)');
  });
  await test('the GitHub release check is parked: the secrets-dependent job runs only when RELEASE_GATE_ENABLED is true, the job that tests the gate itself still runs, the check stays fail-closed, and no promotion job exists', () => {
    const y = read('.github/workflows/production-deployment-verification.yml'); assert(/if: github\.event_name == 'repository_dispatch' && vars\.RELEASE_GATE_ENABLED == 'true'/.test(y), 'guarded'); assert(/needs: gate-tests/.test(y), 'still depends on the gate tests'); assert(/gate-tests:[\s\S]*?node scripts\/test_production_deployment_gate\.js/.test(y), 'the gate\'s own tests still run');
    assert(!/promote/i.test(y.replace(/#.*$/gm, '')), 'no promotion job'); assert(/node scripts\/production_deployment_gate\.js/.test(y) && /VERCEL_TOKEN: \$\{\{ secrets\.VERCEL_TOKEN \}\}/.test(y), 'the real check is intact for when it is switched on');
  });
  await test('the runbook says how to switch the check on, and that production was never blocked by it', () => {
    const d = read('docs/vercel-deployment-check-setup.md'); assert(/RELEASE_GATE_ENABLED/.test(d) && /parked until set up/.test(d) && /never blocked/.test(d) && /VERCEL_TOKEN/.test(d), 'documented');
  });
  console.log(`\nSelf-hosted fonts + parked release check: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
