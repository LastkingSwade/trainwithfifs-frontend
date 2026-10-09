/**
 * TrainWithFIFS - Site audit batch 2 regression suite (offline)
 *
 * Covers: the /register redirect and the hash handler that opens the booking panel, no dead javascript: / "#" links in the
 * page or the script's rendered templates, external-link rel attributes, waiver rule count vs. copy, and the deposit / range fee
 * notice shown before the booking form is submitted.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');
require('./lib/ts-loader');

const ROOT = path.resolve(__dirname, '..');
const PAGE = fs.readFileSync(path.join(ROOT, 'src/app/page.tsx'), 'utf-8');
const SCRIPT = fs.readFileSync(path.join(ROOT, 'public/scripts/TrainWithFIFS_scripts.js'), 'utf-8');
const nextConfigModule = require(path.join(ROOT, 'next.config.ts'));
const nextConfig = nextConfigModule.default || nextConfigModule;

let passed = 0, failed = 0;
const queue = [];
const section = (title) => queue.push({ title });
function test(name, fn) { queue.push({ name, fn }); }
function assert(cond, msg) { if (!cond) throw new Error(msg); }
const lineOf = (src, index) => src.slice(0, index).split('\n').length;
function balanced(src, start) {
  let i = src.indexOf('{', start), depth = 0;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') { const q = c; i++; while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++; } continue; }
    if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); continue; }
    if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return src.slice(start, i + 1);
  }
  throw new Error('unbalanced');
}

section('\n[SECTION A: /register redirect and hash handler]');
test('The /register redirect is a single, non-looping rule to a hash on the home page', () => {
  return Promise.resolve(nextConfig.redirects()).then((r) => {
    const reg = r.filter((x) => x.source === '/register');
    assert(reg.length === 1, 'expected exactly one /register rule, found ' + reg.length);
    assert(reg[0].destination === '/#enrollment', 'destination: ' + reg[0].destination);
    assert(reg[0].permanent === false, 'should be a temporary (307) redirect');
    assert(r.every((x) => x.destination.startsWith('/#') || x.source !== x.destination), 'redirect loop');
  });
});
test('The headers() security policy is still defined (config was not broken)', () => {
  assert(typeof nextConfig.headers === 'function' && nextConfig.reactStrictMode === true, 'headers()/reactStrictMode missing');
});
function runHandler(hash, withOpen = true) {
  const at = PAGE.indexOf('// Deep links such as /#enrollment');
  assert(at >= 0, 'hash handler comment not found');
  const eff = PAGE.indexOf('useEffect(() => {', at);
  const body = balanced(PAGE, eff + 'useEffect(() => '.length);
  const calls = { open: [], scrolled: [], listeners: [] };
  const elements = { 'course-catalog-section': { scrollIntoView: () => calls.scrolled.push('course-catalog-section') }, 'booking-form': { scrollIntoView: () => calls.scrolled.push('booking-form') } };
  const win = {
    location: { hash },
    addEventListener: (n) => calls.listeners.push(n),
    removeEventListener() {},
  };
  if (withOpen) win.openAndSwitch = (tab) => calls.open.push(tab);
  const doc = { getElementById: (id) => elements[id] || null };
  const js = ts.transpileModule(`(function(){ const f = () => ${body}; f(); })()`, { compilerOptions: { target: 'ES2020' } }).outputText;
  vm.runInNewContext(js, { window: win, document: doc, setTimeout: (fn) => fn() });
  return { calls, win };
}
test('Landing on /#enrollment opens the booking panel and scrolls to the catalog', () => {
  const { calls } = runHandler('#enrollment');
  assert(calls.open.join() === 'booking' && calls.scrolled.join() === 'course-catalog-section', JSON.stringify(calls));
  assert(calls.listeners.includes('hashchange'), 'no hashchange listener');
});
test('The #booking-form alias scrolls to the form; unrelated hashes and an empty hash do nothing', () => {
  assert(runHandler('#booking-form').calls.scrolled.join() === 'booking-form', 'booking-form alias');
  for (const h of ['', '#something-else', '#fi-sec-dashboard']) assert(runHandler(h).calls.open.length === 0, 'handled ' + h);
});
test('If the page script has not loaded yet the handler does nothing and the script onLoad re-runs it', () => {
  assert(runHandler('#enrollment', false).calls.open.length === 0, 'opened without openAndSwitch');
  assert(/fifsOpenFromHash/.test(PAGE.slice(PAGE.indexOf('src="/scripts/TrainWithFIFS_scripts.js"'))), 'onLoad does not call fifsOpenFromHash');
});
test('The scroll targets exist in the page', () => {
  assert(/id="course-catalog-section"/.test(PAGE) && /id="booking-form"/.test(PAGE), 'target ids missing');
});

section('\n[SECTION B: dead links]');
test('No javascript: URLs are rendered as links in the page or the script templates', () => {
  const bad = [];
  for (const [name, src] of [['page.tsx', PAGE], ['script', SCRIPT]]) {
    const re = /(href\s*=\s*\\?["']?\s*javascript:|\.href\s*=\s*['"`]javascript:|setAttribute\(\s*['"]href['"]\s*,\s*['"`]javascript:)/gi;
    let m; while ((m = re.exec(src))) bad.push(`${name}:${lineOf(src, m.index)}`);
  }
  assert(bad.length === 0, 'javascript: links remain at ' + bad.join(', '));
});
test('No static href="#" placeholder anchors remain in the page or the script templates', () => {
  const bad = [];
  for (const [name, src] of [['page.tsx', PAGE], ['script', SCRIPT]]) {
    const re = /href=\\?["']#\\?["']/g; let m; while ((m = re.exec(src))) bad.push(`${name}:${lineOf(src, m.index)}`);
    const re2 = /\.href\s*=\s*[^;\n]*:\s*'#'/g; while ((m = re2.exec(src))) bad.push(`${name}:${lineOf(src, m.index)} (assigned '#')`);
  }
  assert(bad.length === 0, 'placeholder "#" links remain at ' + bad.join(', '));
});
test('The former javascript: anchors are real buttons that keep their handlers', () => {
  assert(/<button type="button" data-onclick="switchTab\('booking'\)"/.test(PAGE), 'View Courses is not a button');
  assert(/<button type="button" data-onclick="switchClientAuthTab\('register'\)"/.test(PAGE), 'Create Profile is not a button');
  assert(/<button type="button" onclick="openAdminEditStudentModal\('\$\{id\}'\)"/.test(SCRIPT) && /<button type="button" onclick="openStudentDossierModal\('\$\{id\}'\)"/.test(SCRIPT), 'roster row actions are not buttons');
});
test('Every link that opens a new tab carries rel="noopener noreferrer"', () => {
  const bad = [];
  for (const [name, src] of [['page.tsx', PAGE], ['script', SCRIPT]]) {
    const re = /<a\b[^<>]*?>/gs; let m;
    while ((m = re.exec(src))) {
      const tag = m[0];
      if (/target=\\?["']_blank/.test(tag) && !/rel=\\?["'][^"']*noopener[^"']*noreferrer/.test(tag)) bad.push(`${name}:${lineOf(src, m.index)}`);
    }
  }
  assert(bad.length === 0, 'missing rel at ' + bad.join(', '));
});

section('\n[SECTION C: waiver copy]');
test('The waiver checkbox counts exactly the rules that are listed', () => {
  const start = PAGE.indexOf('MANDATORY TRAINING RULES');
  const prohibited = PAGE.indexOf('STRICTLY PROHIBITED', start);
  const end = PAGE.indexOf('CANCELLATION & DEPOSIT POLICY', prohibited);
  assert(start > 0 && prohibited > start && end > prohibited, 'waiver sections not found');
  const count = (s) => (s.match(/<li>/g) || []).length;
  const mandatory = count(PAGE.slice(start, prohibited)), banned = count(PAGE.slice(prohibited, end));
  const label = PAGE.slice(PAGE.indexOf('htmlFor="waiverRulesSworn"'), PAGE.indexOf('</label>', PAGE.indexOf('htmlFor="waiverRulesSworn"')));
  assert(!/\b16\b/.test(label), 'the waiver still says 16 rules');
  assert(new RegExp(`all ${mandatory} Mandatory Training Rules`).test(label) && new RegExp(`all ${banned} Strictly Prohibited`).test(label), `listed ${mandatory} mandatory + ${banned} prohibited, label: ${label.replace(/\s+/g, ' ').slice(-170)}`);
});

section('\n[SECTION D: deposit and range fee notice]');
test('The booking form shows both required statements before the submit button, inside the form', () => {
  const notice = PAGE.indexOf('id="booking-fee-notice"');
  const submit = PAGE.indexOf('id="btn-booking-submit"');
  const formEnd = PAGE.indexOf('</form>', submit);
  assert(notice > 0 && submit > notice && formEnd > submit, 'notice must sit before the submit button');
  assert(PAGE.lastIndexOf('<form', notice) > PAGE.lastIndexOf('</form>', notice), 'notice is not inside a form');
  const text = PAGE.slice(notice, submit).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  assert(text.includes('30% deposit due today to reserve your seat; remaining balance due at class.'), 'deposit sentence missing');
  assert(text.includes("Base track includes Cindy's Hot Shots range fee ($45/person); VIP turnkey includes all range fees."), 'range fee sentence missing');
});
test('The $45 range fee in the notice matches the server', () => {
  const pricing = fs.readFileSync(path.join(ROOT, 'src/Lib/pricing.ts'), 'utf-8');
  assert(/RANGE_FEE_PER_PERSON = 45\.00/.test(pricing) && /DEPOSIT_RATE = 0\.30/.test(pricing), 'server fee or deposit rate differs from the notice');
});

test('Every VIP range-fee perk quotes the same $45 as the Base fee (no "$25-$35")', () => {
  assert(!/\$25\s*[–-]\s*\$?35/.test(PAGE) && !/\$25\s*[–-]\s*\$?35/.test(SCRIPT), 'a "$25-$35" range fee value is still present');
  const perks = PAGE.match(/range (?:lane )?fee included[^<\n]*|Range Lane Fee Included[^<\n]*/gi) || [];
  assert(perks.length >= 5, 'expected the VIP range fee perks, found ' + perks.length);
  assert(perks.filter((p) => /\$\d/.test(p)).every((p) => /\$45\b/.test(p)), 'a range fee perk quotes a price other than $45: ' + perks.join(' | '));
});

test('The free-guide form posts its name and email to handleLeadMagnetSubmission, which the server now implements', () => {
  const at = SCRIPT.indexOf('function handleLeadMagnetSubmit(');
  const fn = SCRIPT.slice(at, at + 1400);
  assert(/callFifsBackend\('handleLeadMagnetSubmission', \{ fullName: name, email: email,/.test(fn), 'the form no longer sends fullName and email to handleLeadMagnetSubmission');
  const route = fs.readFileSync(path.join(ROOT, 'src/app/api/fifs/route.ts'), 'utf-8');
  const notImplemented = route.slice(route.indexOf('const NOT_IMPLEMENTED_ACTIONS'), route.indexOf('};', route.indexOf('const NOT_IMPLEMENTED_ACTIONS')));
  assert(!/handleLeadMagnetSubmission/.test(notImplemented) && /case 'handleLeadMagnetSubmission'/.test(route), 'the server action must exist and not be listed as not implemented');
});

(async () => {
  for (const item of queue) {
    if (item.title) { console.log(item.title); continue; }
    try { await item.fn(); passed++; console.log(`  ✓ PASS: ${item.name}`); }
    catch (err) { failed++; console.log(`  ✗ FAIL: ${item.name}\n    -> ${err.message}`); }
  }
  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
  console.log('================================================================');
  process.exit(failed > 0 ? 1 : 0);
})();
