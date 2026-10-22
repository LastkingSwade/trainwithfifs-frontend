/**
 * TrainWithFIFS - client/student portal cleanup + Start Your Journey suite (offline)
 * Guards the owner's list: Sign Out beside Change Password, no slide-through dashboard bar, no "Switch to student portal" button, renewal countdown
 * under the permit card, the Document Vault as a hub card next to the Reciprocity Hub, the extra buttons gone from the permit card, the permit card
 * showing the client's real vault photo and details, one account panel in the header, no blank score sheet card, no outline boxes, and the new
 * Start Your Journey order and call to action.
 */
const fs = require('fs'); const path = require('path');
const { installFetchStub } = require('./lib/ts-loader');
installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
let passed = 0, failed = 0;
const test = (name, fn) => { try { fn(); passed++; console.log(`  ✓ PASS: ${name}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${name}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(a === b, `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
const PAGE = read('src/app/page.tsx');
const client = PAGE.slice(PAGE.indexOf('id="client-active-dashboard"'), PAGE.indexOf('{/* VIEW 2: INSTRUCTOR ADMIN COMMAND CENTER */}'));
const student = PAGE.slice(PAGE.indexOf('id="student-active-dashboard"'), PAGE.indexOf('id="view-fi-portal"'));

test('Client: Sign Out and Change Password share one row; the old offset margin is gone', () => {
  const row = /<div className="fi-acct-row">([\s\S]*?)<\/div>/.exec(client); assert(row, 'row');
  assert(/fiLogoutClient\(\)/.test(row[1]) && /openChangePasswordModal\('client'\)/.test(row[1]), 'both buttons inside');
  assert(!/"marginTop": "8px", "background": "rgba\(245, 158, 11, 0.08\)"/.test(client), 'offset margin removed');
});
test('Student: Sign Out and Change Password share one row', () => {
  const row = /<div className="fi-acct-row">([\s\S]*?)<\/div>/.exec(student); assert(row, 'row');
  assert(/logoutStudent\(\)/.test(row[1]) && /openChangePasswordModal\('student'\)/.test(row[1]), 'both buttons inside');
  assert(/\.fi-acct-row \{ display: flex; flex-wrap: wrap; align-items: center/.test(read('src/portal/dashboard.css')), 'row css');
});
test('Client: the slide-through bar (with its Switch to Student Portal button) is gone, and every place it led to still has a hub card', () => {
  assert(!/fi-portal-subnav/.test(client) && !/Switch to Student Portal/.test(client), 'bar removed');
  for (const fn of ['toggleReciprocityHubModal', 'toggleMultiPermitModal', 'openVehicleTravelModal', 'openFlyingWithFirearmModal', 'openPermitRenewalModal', 'openClientProfileModal', 'openFutureServicesModal', 'openClientFaqModal', 'openWallet']) assert(new RegExp('fi-feature-card[^>]*onClick=\\{\\(\\) => \\{ if \\(typeof window[^}]*' + fn).test(client), fn + ' card');
});
test('Client: hub order is Document Vault first, then the Reciprocity Hub, then the multi-permit guide and the rest', () => {
  const t = client.slice(client.indexOf('fi-hub-cards-grid')); const at = (x) => t.indexOf(x);
  assert(at('CARD 1: DOCUMENT VAULT') > 0 && at('CARD 1: DOCUMENT VAULT') < at('CARD 2: 50-STATE') && at('CARD 2: 50-STATE') < at('CARD 3: MULTI-PERMIT'), 'order');
  assert(/id="fi-vault-launch"/.test(t) && /openWallet/.test(t), 'vault card opens the vault');
});
test('Client: the renewal countdown sits right under the permit card, and the vault is no longer drawn there', () => {
  const card = client.indexOf('client-ccw-wallet-card'), host = client.indexOf('id="fi-client-extras"'), grid = client.indexOf('fi-hub-cards-grid');
  assert(card > 0 && host > card && host < grid, 'host between card and hub grid');
  assert(!/walletCard/.test(read('src/portal/clientExtras.ts')), 'vault card removed from the countdown area');
});
test('Client: the extra buttons are removed from and below the permit card', () => {
  const before = client.slice(0, client.indexOf('fi-hub-cards-grid'));
  for (const t of ['Check 50-State Reciprocity Map', '34+ State Expansion Guide', 'Check Permit Expiration', '50-State Reciprocity Engine', '34+ State Expansion Field Guide', 'Flying With Firearms Guide']) assert(!before.includes(t), t + ' still there');
});
test('Student: the blank Score Sheet download card is gone (the signed copy card stays)', () => {
  assert(!/portal-score-sheet-card/.test(student) && !/View \/ Download Official Score Sheet/.test(student), 'blank card removed');
  assert(/dash-scoresheet-card/.test(student) && /dash-scoresheet-download-btn/.test(student), 'signed copy card kept');
});
test('Permit card: real photo + details come from the signed-in client\'s own vault and profile', () => {
  const pc = require(path.join(ROOT, 'src/portal/permitCardLive.ts'));
  const d = (id, kind, created, extra = {}) => ({ id, kind, kindLabel: kind, mime: 'image/png', sizeBytes: 10, expiresOn: null, createdAt: created, ...extra });
  eq(pc.newestPermit([d('a', 'permit_card', '2026-01-01T00:00:00Z'), d('b', 'permit_card', '2026-03-01T00:00:00Z'), d('c', 'class_certificate', '2026-04-01T00:00:00Z')]).id, 'b', 'newest permit card only');
  eq(pc.newestPermit([d('c', 'class_certificate', '2026-04-01T00:00:00Z')]), null, 'none');
  const now = new Date('2026-10-12T12:00:00Z');
  let f = pc.cardFacts({ profileExpiry: '2027-05-31', docExpiry: null, hasPermitDoc: true, optIn: true, permitState: 'Maryland Wear & Carry', now });
  eq(f.expiresText, 'May 31, 2027', 'date'); assert(/^Active \(\d+ days left\)$/.test(f.renewalText), f.renewalText); eq(f.expiresColor, '#34d399', 'green'); eq(f.restrictions, 'As printed on your permit card', 'not invented');
  f = pc.cardFacts({ profileExpiry: '2027-05-31', docExpiry: '2026-11-15', hasPermitDoc: true, optIn: true, permitState: 'Maryland', now });
  eq(f.expiresText, 'Nov 15, 2026', 'the vault document date wins'); assert(/days left: renewal window open/.test(f.renewalText), f.renewalText); eq(f.expiresColor, '#ffd166', 'gold when inside 90 days');
  f = pc.cardFacts({ profileExpiry: '2026-09-01', docExpiry: null, hasPermitDoc: false, optIn: true, permitState: 'Maryland', now }); assert(/^Permit expired 41 days ago$/.test(f.renewalText), f.renewalText); eq(f.expiresColor, '#ff8a8a', 'red when expired'); eq(f.restrictions, 'See your permit card', 'no doc');
  eq(pc.cardFacts({ profileExpiry: '2027-05-31', docExpiry: null, hasPermitDoc: false, optIn: false, permitState: 'Maryland', now }).renewalText, 'Not turned on', 'renewal watch off');
  eq(pc.cardFacts({ profileExpiry: '', docExpiry: null, hasPermitDoc: false, optIn: null, permitState: 'Maryland', now }).expiresText, 'Not on file yet', 'no date');
});
test('Permit card: the photo goes through the vault server calls only, shows as a short-lived local picture, and is cleared on sign-out; vault changes refresh it', () => {
  const src = read('src/portal/permitCardLive.ts');
  assert(/callFifsBackend\('walletStatus'\)/.test(src) && /callFifsBackend\('walletOpen'/.test(src), 'server calls');
  assert(/URL\.createObjectURL/.test(src) && /URL\.revokeObjectURL/.test(src) && /\^image\\\//.test(src), 'local image only');
  assert(/innerHTML/.test(src) === false, 'text only');
  assert(/wallet-cardholder-name/.test(src), 'full name on the card');
  assert(/fifs-wallet-changed/.test(src) && (read('src/portal/WalletPanel.tsx').match(/fifs-wallet-changed/g) || []).length === 2, 'upload and delete refresh the card');
  assert(/installPermitCardLive\(\)/.test(PAGE) && /id="wallet-photo-box"/.test(PAGE) && /id="wallet-restrictions"/.test(PAGE) && /id="wallet-class"/.test(PAGE), 'wired and marked up');
});
test('Header: one account panel for the one portal you are in (name, which portal, open, change password, sign out); signed out shows the two sign-ins', () => {
  const hp = read('src/portal/headerProfile.ts'); const m = require(path.join(ROOT, 'src/portal/headerProfile.ts'));
  const st = [{ key: 'portal', label: 'Student portal', signedIn: false, name: '' }, { key: 'fi-portal', label: 'Client portal', signedIn: true, name: 'Dana' }];
  eq(m.activePortal(st).key, 'fi-portal', 'the signed-in one'); eq(m.activePortal([st[0]]), null, 'nobody');
  eq(m.activePortal([{ ...st[0], signedIn: true, name: 'A' }, st[1]], 'fi-portal').key, 'fi-portal', 'visible dashboard wins');
  assert(/Signed in to the /.test(hp) && /Change password/.test(hp) && /Not you\? Sign out/.test(hp) && /openChangePasswordModal/.test(hp) && /hb-avatar/.test(hp), 'panel pieces');
  assert(!/textContent = st\.signedIn/.test(hp), 'old two-row menu gone');
});
test('No outline boxes: the 1px ring around buttons and links and the square pulse ring around Chat are switched off; keyboard focus outline stays', () => {
  const css = read('src/portal/dashboard.css');
  assert(/\[data-onclick\]:not\(\[class\*="overlay"\]\):not\(body\)\) \{ box-shadow: none; \}/.test(css), 'ring removed');
  assert(!/0 0 0 1px/.test(css.slice(css.indexOf('No outline boxes'))), 'no new ring');
  assert(/html\[data-hud\] \.hud-chat::after \{ display: none !important; \}/.test(css), 'chat ring');
  assert(/outline: 2px solid #ffffff/.test(read('src/app/globals.css')), 'white focus outline still defined');
});
test('Start Your Journey: goal picker comes first, four quick jumps, 8 steps, what to bring, and one closing call to action (no duplicate Book Now)', () => {
  const v = PAGE.slice(PAGE.indexOf('id="view-start"')); const view = v.slice(0, v.indexOf('{/* VIEW 4')); const at = (x) => view.indexOf(x);
  assert(at('start-jump') > 0 && at('start-jump') < at('id="start-goals"') && at('id="start-goals"') < at('Core Zero-Intimidation Promise') && at('Core Zero-Intimidation Promise') < at('id="start-steps"') && at('id="start-steps"') < at('id="start-bring"') && at('id="start-bring"') < at('id="start-book"'), 'order');
  eq((view.match(/Ready to book\? Book Now/g) || []).length, 0, 'old button removed'); assert(/Ready for step one\?/.test(view) && /data-onclick="openAndSwitch\('booking'\)"/.test(view) && /openContactWidgetModal/.test(view), 'closing CTA');
  assert(/prefers-reduced-motion: reduce/.test(view), 'smooth scroll respects reduced motion');
  const css = read('src/portal/start.css'); assert(/#view-start \.pathway-pill \{ border-radius: 16px !important/.test(css), 'goal buttons are rounded rectangles, not clipped circles'); assert(/min-height: 44px/.test(css) && /repeat\(4, minmax\(0, 1fr\)\)/.test(css) && !/linear-gradient\([^)]*\)\s*;?\s*-webkit-background-clip|background-clip: text/.test(css), 'css rules');
});
test('The vault is in the company colors: navy HUD panels, cyan wayfinding, amber actions, the site heading font, a colour per document type, and the "Keep your records close at hand" note', () => {
  const css = read('src/portal/vault.css'), tsx = read('src/portal/WalletPanel.tsx');
  const off = [/Georgia/, /214, 178, 104/, /#f6eddb|#e9dcc0|#2a2112|#4a3a1c|#d9b25f|#b98a2f|#f0cd77|#c99a2e|#94700f|#f1ead9|#f1d48c/, /#121214|#0a0a0c|#151517/].reduce((n, r) => n + (css.match(new RegExp(r.source, 'g')) || []).length, 0);
  assert(off === 0, 'off-palette (black-and-gold / serif / parchment) colours left in the vault: ' + off);
  assert(/\.vault-art \{ --vk: #00e5ff;/.test(css) && /k-class_certificate \{ --vk: #ffb703;/.test(css) && /k-hql_approval \{ --vk: #10b981;/.test(css) && /' k-' \+/.test(tsx), 'a colour per document type');
  assert(/Keep your records close at hand/.test(tsx) && /vault-art-brand/.test(tsx), 'note + brand');
  assert(/\.vault-chip \{ min-height: 44px/.test(css) && /\.vault-add \{[^}]*min-height: 48px/.test(css), 'touch targets');
});
test('Client "Your next step": one clear action chosen from the permit date, reminders and vault', () => {
  const n = require(path.join(ROOT, 'src/portal/clientNextStep.ts')).nextStep; const f = (days, hasPermitDoc, optIn) => n({ days, hasPermitDoc, optIn }).key;
  eq(f(null, false, null), 'add-date'); eq(f(-3, true, true), 'expired'); eq(f(0, true, true), 'renew-now'); eq(f(89, true, true), 'renew-now'); eq(f(90, true, true), 'renew-soon'); eq(f(120, true, true), 'renew-soon');
  eq(f(121, false, true), 'add-card'); eq(f(300, true, false), 'turn-on-reminders'); eq(f(300, true, true), 'all-set'); eq(f(300, true, null), 'all-set');
  assert(/expires today/.test(n({ days: 0, hasPermitDoc: true, optIn: true }).title) && !/0 days/.test(n({ days: 0, hasPermitDoc: true, optIn: true }).title), 'a permit that expires today says so, not "0 days left"');
  assert(!/120 days ahead/.test(n({ days: 100, hasPermitDoc: true, optIn: true }).text) && /book soon/.test(n({ days: 100, hasPermitDoc: true, optIn: true }).text), 'a window already open says book soon, not 120 days ahead');
  assert(/opens in 180 days/.test(n({ days: 300, hasPermitDoc: true, optIn: true }).text), 'the renewal window countdown'); assert(/Renew now: 1 day left/.test(n({ days: 1, hasPermitDoc: true, optIn: true }).title), 'singular day');
  const src = read('src/portal/clientNextStep.ts'); assert(!/innerHTML/.test(src), 'text only');
  for (const k of ['openPermitRenewalModal', 'openClientProfileModal', 'openWallet', 'toggleReciprocityHubModal']) assert(new RegExp(k).test(src), k);
  assert(/d === 0 \? 'Expires today: renewal window open'/.test(read('src/portal/permitCardLive.ts')), 'the permit card says expires today on the day, not 0 days left');
  const pc = read('src/portal/permitCardLive.ts'); assert(/nextStep\(/.test(pc) && /renderNextStep\(/.test(pc), 'filled by the permit card refresh (one vault call)');
  const c = PAGE.slice(PAGE.indexOf('id="client-active-dashboard"')); assert(c.indexOf('id="fi-client-next"') > c.indexOf('fi-acct-row') && c.indexOf('id="fi-client-next"') < c.indexOf('id="fi-sec-dashboard"'), 'sits between the welcome bar and the banner');
  assert(/\.cns-btn \{[^}]*min-height: 48px/.test(read('src/portal/dashboard.css')), '44px+ button');
});
test('Sign-in boxes: password managers get username/current-password, phones get the email keyboard, and each password box has Show/Hide', () => {
  for (const id of ['studentAuthInput', 'clientAuthInput', 'adminStaffEmail']) assert(new RegExp('id="' + id + '"[^>]*autoComplete="username"').test(PAGE) || new RegExp('id="' + id + '"[^>]*type="email"[^>]*autoComplete="username"').test(PAGE), id);
  for (const id of ['studentAuthPassword', 'clientAuthPassword', 'adminStaffPassword']) assert(new RegExp('id="' + id + '"[^>]*autoComplete="current-password"').test(PAGE), id);
  const pk = require(path.join(ROOT, 'src/portal/passwordPeek.ts')); eq(Array.from(pk.PEEK_IDS).join(','), 'studentAuthPassword,clientAuthPassword,adminStaffPassword'); eq(pk.peekText(false), 'Show password'); eq(pk.peekText(true), 'Hide password');
  assert(/installPasswordPeek\(\)/.test(PAGE) && /aria-pressed/.test(read('src/portal/passwordPeek.ts')) && !/localStorage|console\./.test(read('src/portal/passwordPeek.ts')), 'wired, accessible, nothing stored');
});
test('Student: the install banner is hidden once the app is installed or the X was tapped, remembered on this device only', () => {
  const b = require(path.join(ROOT, 'src/portal/pwaBanner.ts')); eq(b.shouldHide(true, null), true); eq(b.shouldHide(false, '1'), true); eq(b.shouldHide(false, null), false); eq(b.shouldHide(false, '0'), false);
  const src = read('src/portal/pwaBanner.ts'); assert(/try \{ dismissed = w\.localStorage/.test(src) && /catch/.test(src), 'storage failures are harmless'); assert(!/fetch\(|console\./.test(src), 'nothing sent or logged'); assert(/installPwaBanner\(\)/.test(PAGE), 'wired');
});
console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`); process.exit(failed ? 1 : 0);
