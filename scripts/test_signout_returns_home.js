/**
 * TrainWithFIFS - signing out returns to the home page (offline)
 * After a student or client signs out (the in-portal button or the header's "Not you? Sign out"), the saved login is cleared, nothing typed is left behind, and the person lands on the home page.
 * Before this, the site stayed parked on the Student Portal sign-in screen with the email still typed in, and "My FIFS" looked like it belonged to that portal. Every copy of each sign-out function in the
 * script is checked, so whichever copy the page ends up using does the right thing.
 */
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
const src = read('public/scripts/TrainWithFIFS_scripts.js');

/** Every declaration of `function name(`, each with its full body (matched by braces). */
function defs(name) {
  const out = []; const re = new RegExp('function ' + name + '\\s*\\(', 'g'); let m;
  while ((m = re.exec(src))) { let i = src.indexOf('{', m.index), d = 0, j = i; for (; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (d === 0) break; } } out.push(src.slice(m.index, j + 1)); }
  return out;
}
/** Runs one copy of a sign-out function against a stand-in page and reports what it did. */
function runIt(fnSrc, name, ids) {
  const calls = []; const els = {}; for (const id of ids) els[id] = { id, value: 'typed@example.com', textContent: 'x', style: { display: 'block', setProperty(k, v) { this.display = v; } }, classList: { _c: new Set(), add(c) { this._c.add(c); }, remove(c) { this._c.delete(c); }, contains(c) { return this._c.has(c); } } };
  // while someone is signed in, the dashboard is showing and the sign-in box is hidden (as on the real page)
  for (const id of ids) if (/login-box|auth-box/.test(id)) { els[id].classList.add('hidden'); els[id].style.display = 'none'; }
  const box = { fifsRemoveStudentSession: () => calls.push('removeStudent'), fifsRemoveClientSession: () => calls.push('removeClient'), fifsSignOutSupabase: () => calls.push('signOut'), purgeAllSessionCookies: () => calls.push('purge'),
    returnToHome: () => calls.push('home'), document: { getElementById: (i) => els[i] || null }, window: {}, console };
  box.window.returnToHome = box.returnToHome; vm.createContext(box); vm.runInContext(fnSrc + `;this.__fn = ${name};`, box); box.__fn();
  return { calls, els };
}

(async () => {
  await test('the student sign-out: every copy in the script clears the saved login AND returns to the home page (the live copy used to leave the person on the student sign-in screen)', () => {
    const all = defs('logoutStudent'); assert(all.length >= 2, 'copies found: ' + all.length);
    for (const [k, d] of all.entries()) { assert(/fifsSignOutSupabase\(\)/.test(d), `copy ${k + 1} must clear the saved login`); assert(/returnToHome\(\)/.test(d), `copy ${k + 1} must return to the home page`); }
  });
  await test('the client sign-out: every copy (the in-portal button and the header menu use them) clears the saved login and returns to the home page', () => {
    for (const name of ['fiLogoutClient', 'logoutClient']) { const all = defs(name); assert(all.length >= 1, name + ' found'); for (const [k, d] of all.entries()) { assert(/fifsSignOutSupabase\(\)/.test(d), `${name} copy ${k + 1} must clear the saved login`); assert(/returnToHome\(\)/.test(d), `${name} copy ${k + 1} must return to the home page`); } }
  });
  await test('running each student sign-out: the saved login is cleared once, the typed email and password are wiped, the dashboard is hidden, the sign-in box returns, the banner text is reset, and the home page is shown last', () => {
    for (const [k, d] of defs('logoutStudent').entries()) {
      const r = runIt(d, 'logoutStudent', ['student-active-dashboard', 'student-login-box', 'studentAuthInput', 'studentAuthPassword', 'student-login-status', 'portal-user-tag']);
      assert(r.calls.filter((c) => c === 'signOut').length === 1, `copy ${k + 1} clears the saved login once: ${r.calls}`); assert(r.calls.filter((c) => c === 'home').length === 1 && r.calls[r.calls.length - 1] === 'home', `copy ${k + 1} ends on the home page: ${r.calls}`);
      eq([r.els.studentAuthInput.value, r.els.studentAuthPassword.value], ['', ''], `copy ${k + 1} wipes what was typed`); assert(r.els['student-active-dashboard'].classList.contains('hidden') || r.els['student-active-dashboard'].style.display === 'none', `copy ${k + 1} hides the dashboard`);
      assert(!r.els['student-login-box'].classList.contains('hidden'), `copy ${k + 1} shows the sign-in box`); eq(r.els['portal-user-tag'].textContent, 'Public Training Portal', `copy ${k + 1} resets the banner`);
    }
  });
  await test('running each client sign-out: same result (saved login cleared once, typed text wiped, dashboard hidden, sign-in box back, home page last)', () => {
    for (const name of ['fiLogoutClient', 'logoutClient']) for (const [k, d] of defs(name).entries()) {
      const r = runIt(d, name, ['client-active-dashboard', 'client-auth-box', 'clientAuthInput', 'clientAuthPassword', 'client-login-status', 'portal-user-tag']);
      assert(r.calls.filter((c) => c === 'signOut').length === 1, `${name} ${k + 1} clears the saved login once: ${r.calls}`); assert(r.calls[r.calls.length - 1] === 'home' && r.calls.filter((c) => c === 'home').length === 1, `${name} ${k + 1} ends on the home page: ${r.calls}`);
      eq([r.els.clientAuthInput.value, r.els.clientAuthPassword.value], ['', ''], `${name} ${k + 1} wipes what was typed`); assert(r.els['client-active-dashboard'].style.display === 'none' || r.els['client-active-dashboard'].classList.contains('hidden'), `${name} ${k + 1} hides the dashboard`);
      assert(r.els['client-auth-box'].style.display === 'block' || !r.els['client-auth-box'].classList.contains('hidden'), `${name} ${k + 1} shows the sign-in box`);
    }
  });
  await test('a missing home-page function never breaks signing out (the saved login is still cleared first)', () => {
    const d = defs('logoutStudent').pop(); const box = { fifsRemoveStudentSession() {}, fifsSignOutSupabase() { box.cleared = true; }, document: { getElementById: () => null }, window: {} }; vm.createContext(box); vm.runInContext(d + ';this.__fn = logoutStudent;', box); box.__fn(); assert(box.cleared === true, 'saved login cleared');
  });
  await test('the sign-out buttons still call the same functions: the Student and Client portals\' Sign Out buttons and the header\'s "Not you? Sign out"', () => {
    const page = read('src/app/page.tsx'); assert(/data-onclick="logoutStudent\(\)"/.test(page) && /fiLogoutClient\(\)/.test(page), 'portal buttons'); const h = read('src/portal/headerProfile.ts'); assert(/w\.logoutStudent/.test(h) && /w\.fiLogoutClient/.test(h), 'header menu');
    assert(/window\.logoutStudent = logoutStudent/.test(src) && /window\.fiLogoutClient = fiLogoutClient/.test(src), 'exposed on window');
  });
  console.log(`\nSign-out returns home: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
