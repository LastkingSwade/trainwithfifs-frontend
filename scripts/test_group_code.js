// Group code (pod code) redemption: input cleanup, every outcome (valid, full, cancelled, not found, bad format), double-submit, rate limits, masking (offline).
const fs = require('fs'); const path = require('path'); const vm = require('vm'); const assert = require('assert'); const ts = require('typescript');
const ROOT = path.resolve(__dirname, '..'); const R = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8'); const cache = {};
let fakeDb = null, sessions = {};
class FakeStripe { constructor() { this.checkout = { sessions: { retrieve: async (id) => { if (!sessions[id]) throw new Error('no such session'); return sessions[id]; } } }; } }
const load = (rel) => { if (cache[rel]) return cache[rel]; const m = { exports: {} };
  const req = (id) => ({ './group-status': { recordPodCodeOnInvoice: async () => {} }, './online-classroom': {}, '../pricing': {}, './discord': { sendDiscordAlert: async () => {} }, '../config/environment': { resolveSiteUrl: () => 'https://trainwithfifs.com', ConfigurationError: class extends Error {} },
    './supabase-admin': { getPrivilegedClient: () => fakeDb, hasBearerToken: () => false, getAuthenticatedUser: async () => ({}), resolveStripeSecretKey: () => 'sk_test_x' }, 'stripe': FakeStripe, '../../group/groupCode': load('src/group/groupCode.ts'), 'node:crypto': require('crypto') }[id] || require(id));
  vm.runInNewContext(ts.transpileModule(R(rel), { compilerOptions: { target: 'ES2020', module: 'commonjs', esModuleInterop: true } }).outputText, { module: m, exports: m.exports, require: req, process, console, Date, Object, Array, String, Number, Math, Promise, JSON, RegExp, Buffer, URL, Map, Set, Error }); return (cache[rel] = m.exports); };
let passed = 0, failed = 0;
async function test(n, f) { try { await f(); console.log('  ✓ PASS: ' + n); passed++; } catch (e) { console.log('  ✗ FAIL: ' + n + '\n    -> ' + e.message); failed++; } }
function db({ groups = {}, invoices = [] } = {}) {
  return { groups, invoices, from(table) { const f = []; let op = 'select', vals = null; const q = { select: () => q, eq: (c, v) => { f.push((r) => r[c] === v); return q; }, gt: (c, v) => { f.push((r) => r[c] > v); return q; }, order: () => q, limit: () => q, update: (v) => { op = 'update'; vals = v; return q; },
    maybeSingle: async () => { const r = table === 'booking_groups' ? Object.values(groups).filter((g) => f.every((x) => x(g)))[0] : null; return { data: r ? { ...r } : null, error: null }; },
    then: (res) => { if (table === 'booking_groups') { const hit = Object.values(groups).filter((g) => f.every((x) => x(g))); if (op === 'update') { hit.forEach((g) => Object.assign(g, vals)); return res({ data: hit.map((g) => ({ invite_code: g.invite_code })), error: null }); } return res({ data: hit, error: null }); }
      if (table === 'invoices') return res({ data: invoices.filter((r) => f.every((x) => x(r))), error: null }); return res({ data: [], error: null }); } }; return q; } };
}
const grp = (over = {}) => ({ invite_code: 'FIFS-POD-AB12', status: 'ACTIVE', max_seats: 3, claimed_seats: 1, course: 'Maryland CCW — Base Track ($199.99)', track: 'Base', preferred_dates: 'Oct 25', ...over });
(async () => {
  const gc = load('src/group/groupCode.ts'), bc = load('src/Lib/server/booking-checkout.ts');
  console.log('\n[group code redemption]');
  await test('Normalization: spaces, case, any dash, a missing prefix, zero-width characters and pasted junk all become FIFS-POD-AB12', () => {
    for (const v of ['FIFS-POD-AB12', 'fifs-pod-ab12', '  fifs pod ab12  ', 'FIFS–POD–AB12', 'FIFS—POD—AB12', 'fifs_pod_ab12', 'FIFSPODAB12', 'ab12', ' a b 1 2 ', 'FIFS​-POD-​AB12', 'FIFS‑POD‑AB12', '\n"FIFS-POD-AB12"\n', 'ＦＩＦＳ－ＰＯＤ－ＡＢ１２']) assert(gc.normalizeGroupCode(v) === 'FIFS-POD-AB12', JSON.stringify(v) + ' -> ' + gc.normalizeGroupCode(v));
    assert(gc.normalizeGroupCode('') === '' && gc.normalizeGroupCode(null) === '' && gc.normalizeGroupCode(undefined) === '');
    for (const v of ['AB1', 'AB123', 'FIFS-POD-AB123', 'ZZZZ-POD-AB12', '<script>']) assert(!gc.isGroupCodeFormat(v), 'accepted ' + v);
    assert(gc.isGroupCodeFormat('ab12') && bc.normalizePodCode(' fifs pod ab12 ') === 'FIFS-POD-AB12' && bc.POD_CODE_PATTERN.test('FIFS-POD-AB12'), 'the server uses the same cleanup');
  });
  await test('Every outcome has a distinct answer: valid, not found, bad format, full, cancelled', async () => {
    fakeDb = db({ groups: { A: grp(), F: grp({ invite_code: 'FIFS-POD-FULL', claimed_seats: 3 }), X: grp({ invite_code: 'FIFS-POD-GONE', status: 'CANCELLED' }) } });
    const ok = await bc.lookupPod('fifs pod ab12'); assert(ok.ok && ok.pod.code === 'FIFS-POD-AB12' && ok.pod.maxSeats - ok.pod.claimedSeats === 2 && /Maryland CCW/.test(ok.pod.course));
    const nf = await bc.lookupPod('FIFS-POD-ZZZZ'); assert(!nf.ok && nf.status === 404 && /not found/.test(nf.message));
    const bad = await bc.lookupPod('hello'); assert(!bad.ok && bad.status === 400 && /not valid/.test(bad.message));
    const full = await bc.lookupPod('FIFS-POD-FULL'); assert(!full.ok && full.status === 409 && /full/.test(full.message));
    const gone = await bc.lookupPod('FIFS-POD-GONE'); assert(!gone.ok && gone.status === 409 && /no longer active/.test(gone.message));
    assert(new Set([nf.message, bad.message, full.message, gone.message]).size === 4, 'four distinct messages');
  });
  await test('Friendly errors say what to do next and always include a way to reach FIFS where needed', () => {
    const cp = load('src/group/groupCopy.ts');
    for (const m of ['That pod code was not found.', 'That pod code is not valid.', 'This private pod is already full.', 'This private pod is no longer active.', 'Too many attempts. Please wait a few minutes and try again.', 'That seat was just taken. Please try again.', 'Pod codes are temporarily unavailable. Please try again in a few minutes.']) { const f = cp.friendlyCodeError(m); assert(f.length > 30 && f !== m, 'unfriendly: ' + m); }
    assert(/443-990-1304/.test(cp.friendlyCodeError('This private pod is already full.')) && /443-990-1304/.test(cp.friendlyCodeError('This private pod is no longer active.')) && /last seat/.test(cp.friendlyCodeError('That seat was just taken.')));
  });
  await test('Double submit: two people racing for the last seat, only one wins; the seat count never goes past the maximum', async () => {
    fakeDb = db({ groups: { A: grp({ max_seats: 2, claimed_seats: 1 }) } });
    const [a, b] = await Promise.all([bc.claimPodSeat('FIFS-POD-AB12'), bc.claimPodSeat('fifs pod ab12')]);
    assert([a, b].filter((r) => r.ok).length === 1 && [a, b].filter((r) => !r.ok).length === 1, JSON.stringify([a, b]));
    assert(fakeDb.groups.A.claimed_seats === 2, 'seats taken: ' + fakeDb.groups.A.claimed_seats);
  });
  await test('Refresh or double-click: the same person with the same code gets the SAME open checkout back; nobody else does; closed, old or paid checkouts are never reused', async () => {
    const recent = new Date(Date.now() - 5 * 60000).toISOString(), old = new Date(Date.now() - 40 * 60000).toISOString();
    sessions = { cs_open: { id: 'cs_open', status: 'open', url: 'https://checkout.stripe.com/c/open' }, cs_done: { id: 'cs_done', status: 'complete', url: null } };
    fakeDb = db({ invoices: [{ invoice_number: 'INV-FI-2026-AAAA', student_id: 'GUEST-CHECKOUT', stripe_session_id: 'cs_open', email: 'sam@x.com', pod_code: 'FIFS-POD-AB12', status: 'PENDING', created_at: recent }, { invoice_number: 'INV-FI-2026-BBBB', student_id: 'GUEST-CHECKOUT', stripe_session_id: 'cs_done', email: 'kim@x.com', pod_code: 'FIFS-POD-AB12', status: 'PENDING', created_at: recent }, { invoice_number: 'INV-FI-2026-CCCC', student_id: 'GUEST-CHECKOUT', stripe_session_id: 'cs_open', email: 'old@x.com', pod_code: 'FIFS-POD-AB12', status: 'PENDING', created_at: old }, { invoice_number: 'INV-FI-2026-DDDD', student_id: 'GUEST-CHECKOUT', stripe_session_id: 'cs_open', email: 'paid@x.com', pod_code: 'FIFS-POD-AB12', status: 'PAID', created_at: recent }] });
    const r = await bc.reuseOpenMemberCheckout('sam@x.com', 'FIFS-POD-AB12'); assert(r && r.url === 'https://checkout.stripe.com/c/open' && r.invoiceId === 'INV-FI-2026-AAAA' && r.reused === true && r.attendees === 1);
    for (const [e, c] of [['other@x.com', 'FIFS-POD-AB12'], ['kim@x.com', 'FIFS-POD-AB12'], ['old@x.com', 'FIFS-POD-AB12'], ['paid@x.com', 'FIFS-POD-AB12'], ['sam@x.com', 'FIFS-POD-ZZZZ'], ['sam@x.com', 'nope']]) assert(await bc.reuseOpenMemberCheckout(e, c) === null, 'reused for ' + e + ' ' + c);
    sessions = {}; assert(await bc.reuseOpenMemberCheckout('sam@x.com', 'FIFS-POD-AB12') === null, 'a session Stripe no longer has is not reused');
  });
  await test('Rate limits and logs: 20 tries per address and 30 per code in 10 minutes, a 429 with a plain message, codes masked in logs', () => {
    const ROUTE = R('src/app/api/fifs/route.ts'); const at = ROUTE.indexOf("case 'validatePodCode':"), body = ROUTE.slice(at, ROUTE.indexOf("case 'onlineOptions':", at));
    assert(/allowPodCodeAttempt\(callerKey\)/.test(body) && /allowPodCodeAttempt\('code:' \+ checkedCode, 30\)/.test(body) && /function allowPodCodeAttempt\(key: string, limit = 20\)/.test(ROUTE) && /status: 429/.test(body));
    assert(/maskCode\(checkedCode\)/.test(body) && body.indexOf('allowPodCodeAttempt(callerKey)') < body.indexOf('lookupPod('), 'throttle comes before any lookup');
    assert(gc.maskCode('FIFS-POD-AB12') === 'FI***' && !gc.maskCode('FIFS-POD-AB12').includes('AB12') && gc.maskCode('') === '(empty)');
    for (const f of ['src/Lib/server/booking-checkout.ts', 'src/app/api/fifs/route.ts', 'src/Lib/server/group-status.ts', 'src/Lib/server/group-email.ts']) {
      for (const line of R(f).split('\n').filter((l) => /console\.(log|warn|error)\(/.test(l))) { const code = line.replace(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g, ''); assert(!/\b(podCode|podCodeInput|checkedCode|podMember|code)\b(?!\s*[:|?])/.test(code.replace(/\b(error|err|Err|e)\??\.code\b/g, '')) || /maskCode\(/.test(code), f + ' logs a code: ' + line.trim().slice(0, 90)); }
    }
  });
  await test('Entry point 1, the email: a "Register for your class" button and a share link carry the code in ?gcode= (never ?code=, which belongs to sign-in), the page cleans the address bar, skips the intro and sends no Referer', () => {
    const cp = load('src/group/groupCopy.ts');
    assert(cp.GROUP_CODE_PARAM === 'gcode' && cp.groupRegisterUrl('FIFS-POD-AB12') === 'https://trainwithfifs.com/?gcode=FIFS-POD-AB12');
    const EM = R('src/Lib/server/group-email.ts');
    assert(/Register for your class/.test(EM) && /groupRegisterUrl\(meta\.code\)/.test(EM), 'email button');
    assert(cp.buildShareMessage({ code: 'FIFS-POD-AB12', course: 'Maryland CCW', dates: 'Oct 25' }).includes('https://trainwithfifs.com/?gcode=FIFS-POD-AB12'), 'the forwarded message carries the link');
    const PAGE = R('src/app/page.tsx'); const at = PAGE.indexOf('const fromLink = incoming.get(GROUP_CODE_PARAM)'), blk = PAGE.slice(at, at + 1500);
    assert(/incoming\.delete\(GROUP_CODE_PARAM\)/.test(blk) && /window\.history\.replaceState/.test(blk) && blk.indexOf('replaceState') < blk.indexOf('openGroupCodeEntry(wanted)'), 'the code leaves the address before anything else happens');
    assert(/\[\?&\]gcode=/.test(R('src/boot/bootConfig.ts')), 'a group-code link skips the intro');
    const NC = R('next.config.ts'); assert(/has: \[\{ type: "query", key: "gcode" \}\]/.test(NC) && /Referrer-Policy", value: "no-referrer"/.test(NC) && NC.indexOf('has: [{ type: "query", key: "gcode" }]') > NC.indexOf('strict-origin-when-cross-origin'), 'strict referrer policy for the link, listed after the default');
  });
  await test('Entry point 2, Start Your Journey: a small text link under the two cards (no third card) opens the code box; the cards are unchanged', () => {
    const PAGE = R('src/app/page.tsx'); const m = PAGE.indexOf('id="journeySelectionModal"'), blk = PAGE.slice(m, PAGE.indexOf('</div>\n      </div>', PAGE.indexOf('btnJourneyEnterCode', m)) + 20);
    assert(/Already paid\? Enter your code →/.test(blk) && /id="btnJourneyEnterCode"/.test(blk) && /data-onclick="openGroupCodeEntry\(\)"/.test(blk), 'link');
    assert((blk.match(/className="fi-select-card/g) || []).length === 2, 'still exactly two cards');
    assert(blk.indexOf('journey-code-row') > blk.lastIndexOf('Book Now →'), 'the link sits below the cards');
    assert(/Start Your Journey →/.test(blk) && /Book Now →/.test(blk) && /openAndSwitch\('start'\)/.test(blk) && /openAndSwitch\('booking'\)/.test(blk), 'the two cards keep their buttons');
    const CSS = R('src/group/group.css'); assert(/\.journey-code-link \{ min-height: 44px/.test(CSS) && /\.journey-code-link:focus-visible/.test(CSS), '44 px target and visible focus');
    assert(/window as any\)\.openGroupCodeEntry = function\(prefill\?: string\) \{\s*if \(typeof \(window as any\)\.closeJourneySelectionModal === 'function'\)/.test(PAGE) && /input\.focus\(\)/.test(PAGE), 'opens the box and focuses the field');
  });
  await test('Entry point 3, the booking form: "Have a code?" is collapsed until clicked, labelled, announced, and shows what the code covers before the visitor confirms', () => {
    const PAGE = R('src/app/page.tsx'); const at = PAGE.indexOf('<details className="form-group" id="podCodeBox"'), blk = PAGE.slice(at, PAGE.indexOf('</details>', at));
    assert(at > 0 && !/<details[^>]*\sopen[\s=>]/.test(blk.split('>')[0]) && /<summary id="podCodeSummary"[^>]*minHeight": "44px"/.test(blk) && /Have a code\?/.test(blk), 'collapsed by default with a 44 px summary');
    assert(/<label htmlFor="podCodeInput"/.test(blk) && /id="podCodeStatus" role="status"/.test(blk) && /role="group" aria-label="Confirm your group class"/.test(blk), 'label, live status, labelled confirmation');
    for (const id of ['podConfirmCourse', 'podConfirmDates', 'podConfirmPlace', 'podConfirmSeats', 'btnPodConfirmYes', 'btnPodConfirmNo']) assert(blk.includes('id="' + id + '"'), id);
    assert(/Class: <strong id="podConfirmCourse"/.test(blk) && /Date: <strong id="podConfirmDates"/.test(blk) && /Where: <strong id="podConfirmPlace"/.test(blk), 'class, date and place');
    const ap = PAGE.slice(PAGE.indexOf('window as any).applyPodCode = async function')), apply = ap.slice(0, ap.indexOf('(window as any).confirmPodCode'));
    assert(!/course\.disabled = true|__fifsPodCode = code/.test(apply) && /__fifsPendingPod = \{ code, res \}/.test(apply) && /showPodConfirm\(\{/.test(apply), 'applying a code changes nothing until it is confirmed');
    assert(/box\.tagName === 'DETAILS'\) box\.open = true/.test(PAGE), 'it expands when a code arrives from a link');
    assert(/RANGE_LOCATION/.test(PAGE.slice(PAGE.indexOf('const showPodConfirm'), PAGE.indexOf('const showPodConfirm') + 700)), 'location comes from the shared copy');
  });
  console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
  process.exit(failed ? 1 : 0);
})();
