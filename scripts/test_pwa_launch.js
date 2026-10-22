/**
 * TrainWithFIFS - installed app: opens to the portal sign-in (or straight to the person's portal), home-screen shortcuts, store screenshots, hero kept offline (offline checks)
 * Rules: only the installed app, only from a plain home screen, once per launch; offline or "already signed in" never prompt; shortcuts open only the two portals; nothing is stored.
 */
const fs = require('fs'); const path = require('path');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const SR = require(path.join(ROOT, 'src/portal/sessionRestore.ts')); const LA = require(path.join(ROOT, 'src/pwa/launch.ts')); const PLAN = require(path.join(ROOT, 'src/pwa/swPlan.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
const home = { standalone: true, pathname: '/', hash: '', search: '', view: 'home', booting: false, hacking: false };

(async () => {
  console.log('\n[Signed-out launch of the installed app]');
  await test('nobody signed in (none, or an expired login cleared) on a plain home screen of the installed app: the sign-in opens', () => {
    assert(SR.shouldPromptSignIn('none', home, false) && SR.shouldPromptSignIn('cleared', home, false), 'prompts');
  });
  await test('it never prompts when someone is signed in, when offline (login kept), a portal was restored or opened, it already asked this launch, or the page is not a plain installed home screen', () => {
    for (const o of ['restored', 'opened', 'skipped', 'kept', undefined]) assert(!SR.shouldPromptSignIn(o, home, false), 'outcome ' + o);
    assert(!SR.shouldPromptSignIn('none', home, true), 'already asked');
    for (const bad of [{ standalone: false }, { pathname: '/reset-password' }, { hash: '#enrollment' }, { search: '?code=abc' }, { view: 'booking' }, { booting: true }, { hacking: true }]) assert(!SR.shouldPromptSignIn('none', { ...home, ...bad }, false), JSON.stringify(bad));
  });
  await test('wiring: it opens the student portal view and the one header sign-in box, once per launch (a page variable, nothing stored), and the existing "stored nothing" rule still holds', () => {
    const src = read('src/portal/sessionRestore.ts'); assert(/shouldPromptSignIn\(outcome, input2, !!w\.__fifsSignInPrompted\)/.test(src) && /w\.__fifsSignInPrompted = true; w\.openAndSwitch\('portal'\)/.test(src) && /getElementById\('btnNavProfile'\)/.test(src), 'prompt wiring');
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''); assert(!/localStorage|sessionStorage|document\.cookie|indexedDB|console\./.test(code), 'nothing stored or logged');
  });

  console.log('\n[Home-screen shortcuts]');
  await test('?open=student and ?open=client are recognised; anything else is ignored; the extra bit is removed and the rest of the address kept', () => {
    eq(LA.launchTarget('?open=student'), 'student'); eq(LA.launchTarget('?x=1&open=client'), 'client'); for (const bad of ['', '?open=admin', '?open=', '?open=student%20', '?open=staff', '?open=Booking', '?open=booking%20', '?open=__proto__', '?open=constructor', null, undefined, '?OPEN=student']) eq(LA.launchTarget(bad), null, String(bad));
    eq(LA.withoutLaunch('?open=student'), ''); eq(LA.withoutLaunch('?a=1&open=client&b=2'), '?a=1&b=2'); eq(LA.withoutLaunch('?a=1'), '?a=1'); eq(LA.VIEW_FOR, { student: 'portal', client: 'fi-portal' });
  });
  await test('the public Permit Center deep links are recognised by exact word only: booking, classes, reciprocity, renewal, start, login (the stand-alone My FIFS sign-in); the list is exactly these words', () => {
    for (const t of ['booking', 'classes', 'reciprocity', 'renewal']) { eq(LA.launchTarget('?open=' + t), t); eq(LA.launchTarget('?a=1&open=' + t + '&b=2'), t); eq(LA.withoutLaunch('?a=1&open=' + t + '&b=2'), '?a=1&b=2'); }
    eq([...LA.TARGETS].sort(), ['booking', 'classes', 'client', 'login', 'reciprocity', 'renewal', 'start', 'student']);
  });
  await test('each deep link calls the matching existing function once, only when it exists, cleans the address, and "classes" scrolls the catalog into view without animation when motion is reduced', () => {
    const src = read('src/pwa/launch.ts'); assert(/t === 'booking'\) w\.openAndSwitch\('booking'\)/.test(src) && /t === 'classes'\) \{ w\.openAndSwitch\('booking'\); scrollToCatalog\(\)/.test(src) && /t === 'start'\) \{ w\.openAndSwitch\('start'\)/.test(src), 'booking, classes and start'); assert(/typeof w\.toggleReciprocityHubModal === 'function'\) w\.toggleReciprocityHubModal\(true\)/.test(src) && /typeof w\.openPermitRenewalModal === 'function'\) w\.openPermitRenewalModal\(\)/.test(src), 'hub and renewal, guarded');
    assert(/course-catalog-section/.test(src) && /prefers-reduced-motion: reduce/.test(src), 'catalog scroll honours reduced motion'); assert(/id="course-catalog-section"/.test(read('src/app/page.tsx')), 'the catalog anchor exists on the page');
    const page = read('src/app/page.tsx') + read('public/scripts/TrainWithFIFS_scripts.js'); assert(/window\.toggleReciprocityHubModal =/.test(page) && /openPermitRenewalModal = function/.test(page) && /window\.openAndSwitch = openAndSwitch/.test(page), 'the functions it calls exist');
  });
  await test('shortcuts open only the portals and public screens (never admin), run once the page is ready, after the saved login is restored', () => {
    const src = read('src/pwa/launch.ts'), rs = read('src/portal/RestoreSession.tsx'); assert(!/admin|staff/.test(src.replace(/\/\/.*$/gm, '')), 'no staff route'); assert(/installSessionRestore\(\)\.finally\(\(\) => \{ if \(!cancelled\) installLaunchTargets\(\); \}\)/.test(rs), 'after the restore');
    assert(/__fifsLaunchRan/.test(src) && /history\.replaceState/.test(src) && !/localStorage|sessionStorage|fetch\(/.test(src), 'once, cleans the address, stores and sends nothing');
  });
  await test('the manifest offers Book a class, Student Portal and Client Portal shortcuts that point at real routes', () => {
    const m = read('src/app/manifest.ts'); for (const [name, url] of [['Book a class', '/#enrollment'], ['Student Portal', '/?open=student'], ['Client Portal', '/?open=client']]) assert(new RegExp(`name: '${name}'[^}]*url: '${url.replace(/[?#/]/g, '\\$&')}'`).test(m), name);
    assert(/'#enrollment'/.test(read('src/app/page.tsx')), 'the booking hash route exists');
  });

  console.log('\n[Install screenshots and offline hero]');
  await test('the install sheet has a wide and a narrow screenshot: real files, the sizes the manifest claims, small', () => {
    const m = read('src/app/manifest.ts');
    for (const [f, w, h, ff] of [['public/pwa/screenshot-wide.webp', 1280, 720, 'wide'], ['public/pwa/screenshot-narrow.webp', 390, 844, 'narrow']]) {
      const b = fs.readFileSync(path.join(ROOT, f)); assert(b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP', f + ' is not WebP'); assert(b.length < 150 * 1024, f + ' too big');
      assert(new RegExp(`src: '/${f.replace('public/', '')}', sizes: '${w}x${h}', type: 'image/webp', form_factor: '${ff}'`).test(m), 'manifest entry for ' + f);
      const wh = b.readUInt16LE(26) & 0x3fff, hh = b.readUInt16LE(28) & 0x3fff; assert(wh === w && hh === h, `${f} is ${wh}x${hh}`);
    }
  });
  await test('the wide hero picture is saved for offline use (service worker and the first-visit list), and the worker still never touches private addresses', () => {
    const sw = read('public/sw.js'); assert(/p\.startsWith\('\/hero\/'\)/.test(sw), 'sw caches /hero/'); assert(/\/api\/|\/reset-password|\/auth/.test(sw.slice(sw.indexOf('function isSensitive'), sw.indexOf('function isBuildAsset'))), 'sensitive paths still excluded');
    eq(PLAN.offlineUrlsFrom(['https://x.test/hero/fifs-hero-wide.webp', 'https://x.test/api/fifs', 'https://other.test/hero/a.webp'], 'https://x.test'), ['/hero/fifs-hero-wide.webp']);
  });
  console.log(`\nPWA launch: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
