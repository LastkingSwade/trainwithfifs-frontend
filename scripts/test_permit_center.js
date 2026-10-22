/**
 * TrainWithFIFS - Permit Center: guides, publishing rules, routes, sitemap (offline)
 * Only a guide whose every fact has a check date and an official source can reach the public; drafts never show in production; five routes and nothing else; links valid; no legal advice wording.
 */
const fs = require('fs'); const path = require('path');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const G = require(path.join(ROOT, 'src/permits/guides.ts')); const L = require(path.join(ROOT, 'src/permits/logic.ts')); const LA = require(path.join(ROOT, 'src/pwa/launch.ts')); const P = require(path.join(ROOT, 'src/Lib/pricing.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
const clone = (x) => JSON.parse(JSON.stringify(x));
const walk = (d) => fs.readdirSync(path.join(ROOT, d), { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : /\.(ts|tsx|css)$/.test(e.name) ? [path.join(d, e.name)] : []);
const textOf = (g) => JSON.stringify(g);

(async () => {
  console.log('\n[The five guides]');
  await test('exactly five guides: Maryland, Virginia, Florida, Arizona, Pennsylvania, each with its own slug, and a guide is found by slug only', () => {
    eq(G.GUIDES.map((g) => g.code), ['MD', 'VA', 'FL', 'AZ', 'PA']); eq([...G.SLUGS], ['maryland', 'virginia', 'florida', 'arizona', 'pennsylvania']); eq(new Set(G.SLUGS).size, 5); for (const s of G.SLUGS) assert(G.guideFor(s).slug === s, s); for (const bad of ['', 'texas', 'MD', 'maryland/', '../maryland', 'Maryland', undefined]) eq(G.guideFor(bad), null, String(bad));
  });
  await test('Maryland is published and passes every publishing rule; the four others are drafts', () => {
    const md = G.guideFor('maryland'); eq(md.status, 'published'); eq(L.publishable(md), { ok: true, problems: [] }); for (const s of ['virginia', 'florida', 'arizona', 'pennsylvania']) eq(G.guideFor(s).status, 'draft', s);
  });

  console.log('\n[Nothing unverified reaches the public]');
  await test('a draft can never be published by accident: without check dates it fails the publishing rule, and even a guide marked "published" shows as "in review" if it fails', () => {
    for (const s of ['virginia', 'florida', 'arizona', 'pennsylvania']) { const g = G.guideFor(s); const r = L.publishable(g); assert(!r.ok && r.problems.length >= 1, s + ' must not be publishable'); const lie = clone(g); lie.status = 'published'; eq(G.viewFor(lie, false), 'in-review', s + ' marked published but unverified'); eq(G.viewFor(lie, true), 'draft-preview', s + ' preview'); }
    const bad = clone(G.guideFor('maryland')); bad.permit.verifiedOn = null; eq(G.viewFor(bad, false), 'in-review', 'one missing date is enough'); const bad2 = clone(G.guideFor('maryland')); bad2.fees[0].source.url = 'https://example.com/fees'; eq(G.viewFor(bad2, false), 'in-review', 'a non-official source'); const bad3 = clone(G.guideFor('maryland')); bad3.reciprocity.verifiedOn = undefined; eq(G.viewFor(bad3, false), 'in-review', 'a reciprocity claim without a date');
  });
  await test('production never shows a draft; previews and local work do, under a draft banner; a published guide always shows', () => {
    eq(G.draftsVisible('production'), false); eq(G.draftsVisible('preview'), true); eq(G.draftsVisible('development'), true); eq(G.draftsVisible(undefined), true);
    const md = G.guideFor('maryland'), va = G.guideFor('virginia'); eq(G.viewFor(md, false), 'published'); eq(G.viewFor(md, true), 'published'); eq(G.viewFor(va, false), 'in-review'); eq(G.viewFor(va, true), 'draft-preview');
  });
  await test('a source must be an official government page over https: look-alikes, plain http, other suffixes and junk are refused', () => {
    for (const ok of ['https://mdsp.maryland.gov/x', 'https://www.fdacs.gov/a', 'https://vsp.virginia.gov/']) assert(L.isOfficialUrl(ok), ok);
    for (const bad of ['http://mdsp.maryland.gov/x', 'https://maryland.gov.evil.com/', 'https://evilgov/', 'https://mdsp-maryland.com', 'javascript:alert(1)', 'mdsp.maryland.gov', '', 'https://gov.example.org/']) assert(!L.isOfficialUrl(bad), bad);
    for (const g of G.GUIDES) { for (const l of g.links) assert(L.isOfficialUrl(l.url), g.slug + ' ' + l.url); for (const f of L.allFacts(g)) assert(L.isOfficialUrl(f.source.url), g.slug + ' fact ' + f.source.url); }
  });
  await test('no guide says a permit is "legal to carry" or "allowed", promises a result, or claims nationwide coverage; a recognition claim always says it is not permission to carry', () => {
    for (const g of G.GUIDES) for (const re of L.BANNED_PHRASES) assert(!re.test(textOf(g)), g.slug + ' ' + re);
    const view = read('src/permits/StateGuideView.tsx'); assert(/not permission to carry anywhere/.test(view) && /Check the official source before you travel armed/.test(view), 'the warning is on every guide'); assert(/Information, not legal advice/.test(read('src/permits/PermitChrome.tsx')), 'footer');
  });
  await test('reciprocity: Maryland, Virginia and Pennsylvania carry a source and date; Florida and Arizona say "not yet reviewed" and make no claim', () => {
    for (const s of ['maryland', 'virginia', 'pennsylvania']) { const r = G.guideFor(s).reciprocity; eq(r.status, 'verified', s); assert(r.source && L.isOfficialUrl(r.source.url) && /^\d{4}-\d{2}-\d{2}$/.test(r.verifiedOn), s); }
    for (const s of ['florida', 'arizona']) { const r = G.guideFor(s).reciprocity; eq(r.status, 'unverified', s); assert(/Not yet reviewed/.test(r.line) && !r.source && !r.verifiedOn, s); }
  });

  console.log('\n[Maryland: what was checked against the official pages]');
  await test('the verified Maryland numbers are locked in so nobody changes them by accident: fees, times, hours and validity', () => {
    const t = textOf(G.guideFor('maryland')); for (const s of ['$125', '$75', '$50', '$20', '90 days', '30 days', '16-hour', '8-hour', '4-hour', '10 years', '14 days', '15 yards', '2 years', '3 years', 'MSP 29-14', 'Licensing Portal', 'eMDSP', 'Qualified Handgun Instructor']) assert(t.includes(s), 'missing ' + s);
    assert(!/\b14 to 30 days\b|\b45 to 90 days\b|completely suspended|175\/250/.test(t), 'the site text the official pages contradict is not repeated');
  });
  await test('what the official page does not say is shown as unavailable, never guessed: residency; no statute, case or jury-instruction text; no fingerprint fee number', () => {
    const md = G.guideFor('maryland'); assert(!Array.isArray(md.residency) && /does not state a residency rule/.test(md.residency.unavailable), 'residency gap'); assert(!/§|\bCOMAR\b|Criminal Law Article|Public Safety Article|\bv\. State\b|MPJI/.test(textOf(md)), 'no legal text');
    assert(/do not include fingerprint fees|do not include fingerprint/i.test(textOf(md)) && !/fingerprint fee[^.]*\$\d/i.test(textOf(md)), 'fingerprint fee not invented');
  });
  await test('every recommended class exists in the checkout price table and its displayed price is read from it', () => {
    for (const g of G.GUIDES) for (const r of g.recommendations) { assert(P.COURSE_PRICING[r.course], r.course); assert(L.COURSE_LABEL[r.course], r.course); eq(L.priceFor(r.course), '$' + P.COURSE_PRICING[r.course].base.toFixed(2)); }
  });

  console.log('\n[Routes, links and sitemap]');
  await test('the routes: a hub, one dynamic page for exactly the five slugs (anything else is a 404), only published guides are indexable', () => {
    for (const f of ['src/app/permits/layout.tsx', 'src/app/permits/page.tsx', 'src/app/permits/[state]/page.tsx']) assert(fs.existsSync(path.join(ROOT, f)), f);
    const p = read('src/app/permits/[state]/page.tsx'); assert(/export const dynamicParams = false/.test(p) && /generateStaticParams\(\) \{ return SLUGS\.map/.test(p) && /notFound\(\)/.test(p), 'five routes only'); assert(/robots: \{ index: false, follow: false \}/.test(p) && /=== 'published'/.test(p), 'only published is indexable');
    assert(/viewFor\(g, draftsVisible\(\)\)/.test(p) && /<InReview g=\{g\} \/>/.test(p), 'in-review view for the public');
  });
  await test('the in-review page carries no unverified facts: no fees, no requirements, no numbers, only next steps', () => {
    const c = read('src/permits/InReview.tsx'); assert(!/\$\d|\b\d+-hour\b|\b\d+ days\b|SP-248|Livescan/.test(c), 'no facts'); assert(/443-990-1304/.test(c) && /\/\?open=reciprocity/.test(c) && /\/\?open=classes/.test(c), 'real next steps'); assert(/will not publish application requirements until they have been checked/.test(c), 'honest notice');
  });
  await test('every link on the Permit Center pages goes somewhere real: deep links use words the site accepts, internal pages exist, outside links are safe', () => {
    const files = [...walk('src/permits'), ...walk('src/app/permits')].filter((f) => /\.tsx$/.test(f)); const words = new Set();
    for (const f of files) { const s = read(f); for (const m of s.matchAll(/\/\?open=([a-z]+)/g)) words.add(m[1]); for (const m of s.matchAll(/href="(\/[^"?]*)/g)) assert(['/', '/permits'].includes(m[1]) || /^\/permits\/[a-z]+$/.test(m[1]) || m[1] === '/permits/', f + ' ' + m[1]); for (const m of s.matchAll(/target="_blank"[^>]*/g)) assert(/rel="noopener noreferrer"/.test(m[0]) || /rel="noopener noreferrer"[^>]*target="_blank"/.test(s), f + ' external link without noopener'); }
    for (const w of words) assert(LA.TARGETS.includes(w), 'deep link word ' + w); assert(words.size >= 3, 'the hub uses reciprocity, renewal and classes: ' + [...words]);
    assert(!files.some((f) => /dangerouslySetInnerHTML|innerHTML/.test(read(f))), 'text only'); assert(!/localStorage|sessionStorage|fetch\(|console\./.test(read('src/permits/FactList.tsx') + read('src/permits/StateGuideView.tsx') + read('src/permits/InReview.tsx') + read('src/app/permits/page.tsx')), 'public pages store and send nothing');
  });
  await test('the sitemap lists the home page, the Permit Center and exactly the published guides; robots does not block them', () => {
    const locs = [...read('public/sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]); const want = ['https://trainwithfifs.com/', 'https://trainwithfifs.com/permits', ...G.GUIDES.filter((g) => G.viewFor(g, false) === 'published').map((g) => 'https://trainwithfifs.com/permits/' + g.slug)];
    eq(locs, want); const robots = read('public/robots.txt'); assert(!/Disallow:\s*\/(permits)?\s*$/m.test(robots) && !/Disallow:\s*\/permits/.test(robots), 'permits not blocked'); assert(!fs.existsSync(path.join(ROOT, 'src/app/sitemap.ts')) && !fs.existsSync(path.join(ROOT, 'src/app/robots.ts')), 'one sitemap source (the public file), no second copy');
  });
  await test('the pages are readable and usable: 44px+ controls, a skip link, visible focus, headings, no animation, company colours, and a header only on larger screens', () => {
    const css = read('src/permits/permits.css').replace(/\/\*[\s\S]*?\*\//g, ''); assert(/\.pc-btn \{[^}]*min-height: 48px/.test(css) && /\.pc-state \{[^}]*min-height: 64px/.test(css) && /\.pc-nav a \{[^}]*min-height: 44px/.test(css), 'sizes'); assert(/:focus-visible[^{]*\{ outline: 3px solid #00e5ff/.test(css), 'focus'); assert(!/animation|transition|@keyframes/.test(css), 'no motion'); assert(/#ffb703/.test(css) && /#00e5ff/.test(css) && /#090d16/.test(css), 'colours');
    assert(/\.pc-nav \{ display: none/.test(css) && /@media \(min-width: 900px\) \{[^}]*\.pc-nav \{ display: flex/.test(css), 'header nav only on large screens'); const lay = read('src/app/permits/layout.tsx'); assert(/pc-skip/.test(lay) && /<main id="pc-main"/.test(lay), 'skip link and main'); assert(/<h1 /.test(read('src/permits/StateGuideView.tsx')) && /<h1 /.test(read('src/permits/InReview.tsx')) && /<h1 /.test(read('src/app/permits/page.tsx')), 'one h1 per page');
  });
  await test('the verification record exists and says what was checked, what was not, and what conflicts with the existing site text', () => {
    const d = read('docs/PERMIT-CENTER-VERIFICATION.md'); for (const w of [/2026-10-21/, /Maryland State Police/, /Not stated on the page/i, /Virginia/, /Florida/, /Arizona/, /Pennsylvania/, /14 to 30 days/, /completely suspended/, /90 of 125/, /To publish a draft/]) assert(w.test(d), String(w));
  });

  console.log('\n[Existing site text now matches the official pages]');
  await test('the FAQ, the renewal center and the Guide no longer say the things the Maryland State Police pages contradict (14 to 30 days, 45 to 90 days, privileges "completely suspended", 175/250 for the 25-round course) and now state the official limits', () => {
    const page = read('src/app/page.tsx'), kn = read('src/ai/knowledge.ts');
    for (const s of [page, kn]) assert(!/14 to 30 days|45 to 90 days/.test(s), 'old processing times'); assert(!/completely suspended/.test(page) && !/175\/250/.test(page), 'old renewal text');
    assert(/decide an HQL application within 30 days[^.]*Wear & Carry \(CCW\) application within 90 days/.test(page) && /decide an HQL application within 30 days[^.]*Wear & Carry application within 90 days/.test(kn), 'official limits in the FAQ and the Guide');
    assert(/renew at least 14 days before your permit expires and you can keep carrying until a decision is made/.test(page) && /apply again as a new applicant/.test(page) && /valid for 2 years, and a renewal for 3 more/.test(page) && /90 of 125 points \(72%\)/.test(page), 'renewal center matches');
  });
  await test('dates a member enters in the wallet are labelled "Self-reported" on the card and in both date fields, and the label is readable', () => {
    const w = read('src/portal/WalletPanel.tsx'); assert(/<span className="vault-self">Self-reported<\/span>/.test(w) && /Expires \(optional, self-reported\)/.test(w) && /New expiry date \(self-reported\)/.test(w), 'labels'); const css = read('src/portal/vault.css'); assert(/\.vault-self \{[^}]*color: #9fb8cc/.test(css) && /font-size: 0\.78rem/.test(css), 'readable style');
  });

  console.log(`\nPermit Center: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
