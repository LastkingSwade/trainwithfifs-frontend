/**
 * TrainWithFIFS - Offline Password-Reset Suite
 *
 * Proves the recovery logic never calls updateUser without a valid recovery session, rejects bad or
 * expired links, gives the same answer for known and unknown email addresses, and that the pages involved
 * never use a service-role key. The Supabase client is a mock; fetch is stubbed; nothing leaves this process.
 */
const fs = require('fs');
const path = require('path');
const { installFetchStub } = require('./lib/ts-loader');

const ROOT = path.resolve(__dirname, '..');
const fetchCalls = installFetchStub();
const pr = require(path.join(ROOT, 'src/Lib/auth/password-reset.ts'));

let passed = 0, failed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log(`  ✓ PASS: ${name}`); }
  catch (e) { failed++; console.log(`  ✗ FAIL: ${name}\n      ${e.message}`); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }
const eq = (a, b, msg) => assert(JSON.stringify(a) === JSON.stringify(b), `${msg}: got ${JSON.stringify(a)}, expected ${JSON.stringify(b)}`);

/** Mock client. `session` is what getSession returns; every call is recorded. */
function mockClient(opts = {}) {
  const calls = [];
  const rec = (name, args) => calls.push({ name, args });
  const session = (role) => ({ access_token: 'fake', user: { app_metadata: role ? { role } : {} } });
  return {
    calls,
    called: (n) => calls.filter((c) => c.name === n).length,
    auth: {
      getSession: async () => { rec('getSession'); return { data: { session: opts.session === undefined ? null : opts.session } }; },
      exchangeCodeForSession: async (code) => { rec('exchangeCodeForSession', [code]); return opts.exchange || { data: { session: session(opts.role) }, error: null }; },
      setSession: async (t) => { rec('setSession', [t]); return opts.set || { data: { session: session(opts.role) }, error: null }; },
      updateUser: async (u) => { rec('updateUser', [u]); return opts.update || { data: {}, error: null }; },
      signOut: async (o) => { rec('signOut', [o]); return { error: null }; },
      resetPasswordForEmail: async (email, o) => { rec('resetPasswordForEmail', [email, o]); if (opts.reset instanceof Error) throw opts.reset; return opts.reset || { data: {}, error: null }; },
    },
  };
}

async function main() {
  const logged = [];
  for (const m of ['log', 'info', 'warn', 'error']) { const o = console[m]; console[m] = (...a) => { logged.push(a.map(String).join(' ')); o.apply(console, a); }; }

  console.log('\n[SECTION A: Password rules]');
  await test('Rejects short, mismatched and oversized passwords; accepts a valid pair', async () => {
    assert(pr.validateNewPassword('short1', 'short1'), 'short password accepted');
    assert(pr.validateNewPassword('longenough1', 'different11'), 'mismatch accepted');
    assert(pr.validateNewPassword('x'.repeat(73), 'x'.repeat(73)), 'oversized password accepted');
    assert(pr.validateNewPassword(undefined, undefined), 'undefined accepted');
    eq(pr.validateNewPassword('longenough1', 'longenough1'), null, 'valid pair');
  });

  console.log('\n[SECTION B: Reading the link]');
  await test('Parses hash tokens, PKCE codes, Supabase error links, and empty URLs', async () => {
    eq(pr.parseRecoveryParams('', '#access_token=a&refresh_token=r&type=recovery').kind, 'tokens', 'hash tokens');
    eq(pr.parseRecoveryParams('?code=abc', '').kind, 'code', 'pkce code');
    eq(pr.parseRecoveryParams('', '#error=access_denied&error_code=otp_expired').kind, 'error', 'error link');
    eq(pr.parseRecoveryParams('?error=access_denied', '').kind, 'error', 'query error link');
    eq(pr.parseRecoveryParams('', '').kind, 'none', 'empty');
    eq(pr.parseRecoveryParams('', '#access_token=only').kind, 'none', 'incomplete tokens');
  });

  console.log('\n[SECTION C: Recovery session gate]');
  await test('No link and no held session is invalid and never touches updateUser', async () => {
    const c = mockClient({ session: null });
    const out = await pr.establishRecoverySession(c, pr.parseRecoveryParams('', ''));
    eq(out.state, 'invalid', 'state'); eq(c.called('updateUser'), 0, 'updateUser calls');
  });
  await test('An expired/errored link is invalid and creates no session', async () => {
    const c = mockClient();
    const out = await pr.establishRecoverySession(c, pr.parseRecoveryParams('', '#error=access_denied&error_code=otp_expired'));
    eq(out.state, 'invalid', 'state'); eq(out.reason, 'expired', 'reason');
    eq(c.called('setSession') + c.called('exchangeCodeForSession'), 0, 'session calls');
  });
  await test('Hash tokens of type recovery or invite become ready; magiclink/signup/other types are refused', async () => {
    for (const type of ['recovery', 'invite']) {
      const c = mockClient({ role: 'instructor' });
      const out = await pr.establishRecoverySession(c, pr.parseRecoveryParams('', `#access_token=a&refresh_token=r&type=${type}`));
      eq(out.state, 'ready', `${type} state`); eq(out.appRole, 'instructor', `${type} role is read from app_metadata`);
    }
    for (const type of ['magiclink', 'signup', 'email_change', '']) {
      const c = mockClient();
      const out = await pr.establishRecoverySession(c, pr.parseRecoveryParams('', `#access_token=a&refresh_token=r${type ? '&type=' + type : ''}`));
      eq(out.state, 'invalid', `${type || '(no type)'} state`); eq(c.called('setSession'), 0, `${type || '(no type)'} setSession`);
    }
  });
  await test('A PKCE code is exchanged; a failed exchange is invalid', async () => {
    const ok = mockClient();
    eq((await pr.establishRecoverySession(ok, { kind: 'code', code: 'c1' })).state, 'ready', 'good code');
    eq(ok.calls.find((x) => x.name === 'exchangeCodeForSession').args[0], 'c1', 'code passed through');
    const bad = mockClient({ exchange: { data: { session: null }, error: { message: 'bad' } } });
    eq((await pr.establishRecoverySession(bad, { kind: 'code', code: 'c2' })).state, 'invalid', 'bad code');
  });
  await test('A client error while establishing the session is invalid, not an exception', async () => {
    const c = mockClient(); c.auth.setSession = async () => { throw new Error('network'); };
    eq((await pr.establishRecoverySession(c, pr.parseRecoveryParams('', '#access_token=a&refresh_token=r&type=recovery'))).state, 'invalid', 'state');
  });
  await test('A refresh keeps working while the isolated client still holds the session', async () => {
    const c = mockClient({ session: { user: { app_metadata: {} } } });
    eq((await pr.establishRecoverySession(c, pr.parseRecoveryParams('', ''))).state, 'ready', 'state');
  });

  console.log('\n[SECTION D: Setting the new password]');
  await test('updateUser is never called without a session, or with invalid input', async () => {
    const none = mockClient({ session: null });
    const r1 = await pr.submitNewPassword(none, 'validpassword1', 'validpassword1');
    assert(!r1.ok && /expired|no longer valid/.test(r1.error), 'expected expired message');
    eq(none.called('updateUser'), 0, 'updateUser without session');
    const withSession = mockClient({ session: { user: {} } });
    assert(!(await pr.submitNewPassword(withSession, 'short', 'short')).ok, 'short accepted');
    assert(!(await pr.submitNewPassword(withSession, 'validpassword1', 'validpassword2')).ok, 'mismatch accepted');
    eq(withSession.called('updateUser'), 0, 'updateUser with invalid input');
  });
  await test('A valid session and password calls updateUser once, then signs out locally', async () => {
    const c = mockClient({ session: { user: {} } });
    const r = await pr.submitNewPassword(c, 'validpassword1', 'validpassword1');
    eq(r, { ok: true }, 'result'); eq(c.called('updateUser'), 1, 'updateUser calls');
    eq(c.calls.find((x) => x.name === 'updateUser').args[0], { password: 'validpassword1' }, 'only password is sent');
    eq(c.calls.find((x) => x.name === 'signOut').args[0], { scope: 'local' }, 'signOut scope');
    const order = c.calls.map((x) => x.name);
    assert(order.indexOf('updateUser') < order.indexOf('signOut'), 'sign out must follow the update');
  });
  await test('updateUser failures return clear errors and keep the session for a retry', async () => {
    const same = mockClient({ session: { user: {} }, update: { error: { code: 'same_password' } } });
    assert(/different/.test((await pr.submitNewPassword(same, 'validpassword1', 'validpassword1')).error), 'same_password message');
    const weak = mockClient({ session: { user: {} }, update: { error: { code: 'weak_password' } } });
    assert(/weak/.test((await pr.submitNewPassword(weak, 'validpassword1', 'validpassword1')).error), 'weak_password message');
    const gone = mockClient({ session: { user: {} }, update: { error: { status: 401 } } });
    assert(/expired/.test((await pr.submitNewPassword(gone, 'validpassword1', 'validpassword1')).error), '401 message');
    for (const c of [same, weak, gone]) eq(c.called('signOut'), 0, 'must not sign out after a failed update');
  });
  await test('The password is never logged or echoed in results', async () => {
    const secret = 'Zx9-unique-test-password-Qw3';
    const c = mockClient({ session: { user: {} }, update: { error: { code: 'weak_password' } } });
    const r = await pr.submitNewPassword(c, secret, secret);
    assert(!JSON.stringify(r).includes(secret), 'password appeared in the result');
    assert(!logged.some((l) => l.includes(secret)), 'password appeared in console output');
  });

  console.log('\n[SECTION E: Requesting a link]');
  await test('Known and unknown addresses get the identical message; redirectTo is the reset page', async () => {
    const known = mockClient(); const unknown = mockClient();
    const a = await pr.requestPasswordReset(known, 'real@example.com', 'https://trainwithfifs.com');
    const b = await pr.requestPasswordReset(unknown, 'nobody@example.com', 'https://trainwithfifs.com');
    eq(a, b, 'responses differ'); eq(a.message, pr.GENERIC_RESET_MESSAGE, 'generic message');
    eq(known.calls[0].args[1], { redirectTo: 'https://trainwithfifs.com/reset-password' }, 'redirectTo');
  });
  await test('A malformed address makes no request; rate limits and transport errors do not leak existence', async () => {
    const c = mockClient();
    assert(!(await pr.requestPasswordReset(c, 'not-an-email', 'https://x.test')).ok, 'malformed accepted');
    eq(c.called('resetPasswordForEmail'), 0, 'request for malformed address');
    const limited = await pr.requestPasswordReset(mockClient({ reset: { error: { status: 429 } } }), 'a@b.co', 'https://x.test');
    assert(limited.cooldown && /wait/.test(limited.message), 'rate limit message');
    const thrown = await pr.requestPasswordReset(mockClient({ reset: new Error('down') }), 'a@b.co', 'https://x.test');
    assert(!thrown.ok && !/exist|account/i.test(thrown.message.replace(/If an account exists/, '')), 'transport message mentions accounts');
  });

  console.log('\n[SECTION F: After success]');
  await test('Post-reset portal: a remembered hint wins, otherwise app_metadata.role decides; nothing else is read', async () => {
    eq(pr.portalForReset('client', 'admin'), 'client', 'hint wins');
    eq(pr.portalForReset(null, 'admin'), 'staff', 'admin role'); eq(pr.portalForReset(null, 'instructor'), 'staff', 'instructor role');
    eq(pr.portalForReset(null, 'staff'), 'staff', 'staff role'); eq(pr.portalForReset(null, undefined), 'student', 'no role');
    eq(pr.portalForReset('<script>', 'superuser'), 'student', 'junk values fall back to student');
    eq([pr.portalTab('student'), pr.portalTab('client'), pr.portalTab('staff')], ['portal', 'fi-portal', 'admin'], 'tab names');
  });

  console.log('\n[SECTION G: Source checks]');
  const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf-8');
  const pageSrc = read('src/app/reset-password/page.tsx');
  const mainSrc = read('src/app/page.tsx');
  const uiFiles = ['src/Lib/auth/password-reset.ts', 'src/Lib/supabase/recovery-client.ts', 'src/app/reset-password/page.tsx', 'src/app/layout.tsx'];
  await test('Recovery files never use a service-role key, admin API, or server-only modules', async () => {
    for (const f of uiFiles) {
      const src = read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1'); // comments may name what is NOT used
      assert(!/SERVICE_ROLE|SERVICE_KEY|service_role|auth\.admin|Lib\/server|user_metadata|is_admin/.test(src), `${f} references a forbidden name`);
    }
  });
  await test('The reset page only calls updateUser through submitNewPassword and logs nothing', async () => {
    assert(!/updateUser\s*\(/.test(pageSrc), 'page calls updateUser directly');
    assert(!/console\.\w+\(/.test(pageSrc), 'page uses console');
    assert(/establishRecoverySession/.test(pageSrc) && /submitNewPassword/.test(pageSrc), 'page must use the gated helpers');
  });
  await test('The recovery client keeps its session under its own storage key and does not auto-read the URL', async () => {
    const src = read('src/Lib/supabase/recovery-client.ts');
    assert(/storageKey:\s*RECOVERY_STORAGE_KEY/.test(src) && /detectSessionInUrl:\s*false/.test(src), 'recovery client options');
  });
  await test('Student, client and staff logins each have a Forgot password entry; the dead handler is gone', async () => {
    for (const portal of ['student', 'client', 'staff']) assert(mainSrc.includes(`fifsRequestPasswordReset('${portal}', this)`), `${portal} login has no entry`);
    assert(!mainSrc.includes('handleClientForgotPassword'), 'dead handler still referenced');
  });
  await test('Home-page recovery/invite hash links are forwarded to /reset-password before sign-in code runs', async () => {
    const layout = read('src/app/layout.tsx');
    assert(/beforeInteractive/.test(layout) && /\/reset-password/.test(layout) && /recovery\|invite/.test(layout), 'layout redirect missing');
  });
  await test('The home-page guard forwards recovery hash links and ?code= links, and leaves every other URL alone', async () => {
    const layout = read('src/app/layout.tsx');
    const script = layout.match(/const recoveryRedirect = `([\s\S]*?)`;/)[1];
    const run = (pathname, search, hash) => {
      let target = null;
      new Function('window', `with(window){${script}}`)({ location: { pathname, search, hash, replace: (u) => { target = u; } } });
      return target;
    };
    eq(run('/', '', '#access_token=a&refresh_token=r&type=recovery'), '/reset-password#access_token=a&refresh_token=r&type=recovery', 'recovery hash');
    eq(run('/', '', '#access_token=a&refresh_token=r&type=invite'), '/reset-password#access_token=a&refresh_token=r&type=invite', 'invite hash');
    eq(run('/', '?code=abc123', ''), '/reset-password?code=abc123', 'pkce code');
    eq(run('/', '', '#access_token=a&refresh_token=r&type=magiclink'), null, 'magic link must not be forwarded');
    eq(run('/', '?portal=student&id=FIFS-1', ''), null, 'existing site params');
    eq(run('/', '?session_id=cs_1&booking_confirmed=true', ''), null, 'checkout return');
    eq(run('/reset-password', '?code=abc', ''), null, 'no redirect loop on the reset page');
    eq(run('/', '', ''), null, 'plain home page');
  });
  await test('No outbound network calls were attempted', async () => { eq(fetchCalls.length, 0, 'fetch calls'); });

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
  console.log('================================================================');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error('Suite crashed:', e && e.message); process.exit(1); });
