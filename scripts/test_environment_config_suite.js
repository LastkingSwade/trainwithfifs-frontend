/**
 * TrainWithFIFS - Offline Environment-Configuration Safety Suite
 *
 * Verifies that only a Vercel Production deployment may use Production services, that every other
 * environment fails closed when its own configuration is missing, that alternate variable names
 * cannot reintroduce Production values, and that browser code never receives a service-role key.
 *
 * All keys here are fake, unsigned test tokens. No key value is ever printed, including in failures.
 * Supabase, Stripe, and fetch are mocked; nothing leaves this process.
 */

const fs = require('fs');
const path = require('path');
const Module = require('module');
const { installFetchStub } = require('./lib/ts-loader');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const fetchCalls = installFetchStub();

// ---- Fake Supabase keys (unsigned; claims only) ----
const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const fakeJwt = (ref, role) => `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ iss: 'supabase', ref, role })}.fake-test-signature`;

const PROD_REF = 'ufqnmcincwnlyiwsmzcq';
const PROD_URL = `https://${PROD_REF}.supabase.co`;
const STAGING_REF = 'stagingtestref0000001';
const STAGING_URL = `https://${STAGING_REF}.supabase.co`;
const OTHER_REF = 'otherprojectref000002';

const KEYS = {
  prodAnon: fakeJwt(PROD_REF, 'anon'),
  prodService: fakeJwt(PROD_REF, 'service_role'),
  stagingAnon: fakeJwt(STAGING_REF, 'anon'),
  stagingService: fakeJwt(STAGING_REF, 'service_role'),
  otherAnon: fakeJwt(OTHER_REF, 'anon'),
  otherService: fakeJwt(OTHER_REF, 'service_role'),
  opaquePublishable: 'sb_publishable_fake_test_value_0001',
  opaqueSecret: 'sb_secret_fake_test_value_0001',
  stripeTest: 'sk_test_fake_offline_value_0001',
  stripeLive: 'sk_live_fake_offline_value_0001',
  stripeRestrictedLive: 'rk_live_fake_offline_value_0001'
};
const ALL_FAKE_VALUES = Object.values(KEYS);

// ---- Mocks ----
const created = [];       // { url, keyId } — keyId is the KEYS name, never the value
const createdUsers = [];  // auth.admin.createUser calls
const stripeSessions = [];
const keyId = (value) => (Object.entries(KEYS).find(([, v]) => v === value) || ['<unrecognized test value>'])[0];

function fakeSupabase(url, key) {
  created.push({ url, keyId: keyId(key) });
  const query = {
    select: () => query, eq: () => query, order: () => query, in: () => query,
    maybeSingle: async () => ({ data: null, error: null }),
    single: async () => ({ data: null, error: null }),
    insert: () => query, update: () => query,
    then: (resolve) => resolve({ data: [], error: null })
  };
  return {
    from: () => query,
    auth: {
      getUser: async (token) => token === 'staff-admin-token'
        ? { data: { user: { id: 'uuid-admin', email: 'admin@example.test', app_metadata: { role: 'admin' } } }, error: null }
        : { data: { user: null }, error: { message: 'invalid token' } },
      admin: {
        createUser: async (params) => { createdUsers.push(params.email); return { data: { user: { id: 'new-user' } }, error: null }; },
        deleteUser: async () => ({ error: null }),
        generateLink: async () => ({ data: { properties: { action_link: 'https://auth.example.test/link' } }, error: null })
      }
    }
  };
}

const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === '@supabase/supabase-js') return { createClient: (url, key) => fakeSupabase(url, key) };
  if (id === '@supabase/ssr') return { createServerClient: (url, key) => fakeSupabase(url, key) };
  if (id === 'next/headers') return { cookies: async () => ({ getAll: () => [], set: () => {} }) };
  if (id === 'next/server') return { NextResponse: { json: (body, init) => ({ status: (init && init.status) || 200, _body: body }) }, NextRequest: class {} };
  if (id === 'stripe') {
    return class FakeStripe {
      constructor() {
        this.checkout = { sessions: {
          create: async (params) => { stripeSessions.push(params.success_url); return { id: 'cs_test_fake', url: 'https://checkout.stripe.com/c/pay/cs_test_fake' }; },
          retrieve: async () => ({ id: 'cs_test_fake', status: 'open', payment_status: 'unpaid' })
        } };
        this.webhooks = { constructEvent: () => { throw new Error('not used'); } };
      }
    };
  }
  return originalRequire.apply(this, arguments);
};

const env = require(path.join(SRC, 'Lib/config/environment.ts'));
const admin = require(path.join(SRC, 'Lib/server/supabase-admin.ts'));
const browser = require(path.join(SRC, 'Lib/supabase/client.ts'));
const ssr = require(path.join(SRC, 'Lib/supabase/server.ts'));
const checkout = require(path.join(SRC, 'Lib/server/booking-checkout.ts'));
const checkoutRoute = require(path.join(SRC, 'app/api/checkout/route.ts'));
const fifsRoute = require(path.join(SRC, 'app/api/fifs/route.ts'));

// ---- Environment control ----
const MANAGED = ['VERCEL_ENV', 'NEXT_PUBLIC_FIFS_DEPLOYMENT_ENV', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_KEY', 'NEXT_PUBLIC_SITE_URL',
  'STRIPE_SECRET_KEY', 'DISCORD_WEBHOOK_URL', 'RESEND_API_KEY', 'CHAT_HMAC_SECRET', 'CRON_SECRET'];
async function withEnv(vars, fn) {
  const saved = {};
  for (const k of MANAGED) { saved[k] = process.env[k]; delete process.env[k]; }
  Object.assign(process.env, vars);
  created.length = 0; createdUsers.length = 0; stripeSessions.length = 0;
  try { return await fn(); } finally {
    for (const k of MANAGED) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }
  }
}

const PRODUCTION = { VERCEL_ENV: 'production', NEXT_PUBLIC_SUPABASE_URL: PROD_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY: KEYS.prodAnon, SUPABASE_SERVICE_ROLE_KEY: KEYS.prodService };
const PREVIEW_OK = { VERCEL_ENV: 'preview', NEXT_PUBLIC_SUPABASE_URL: STAGING_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY: KEYS.stagingAnon, SUPABASE_SERVICE_ROLE_KEY: KEYS.stagingService, NEXT_PUBLIC_SITE_URL: 'https://staging.example.test', STRIPE_SECRET_KEY: KEYS.stripeTest };
const without = (obj, ...names) => Object.fromEntries(Object.entries(obj).filter(([k]) => !names.includes(k)));

// ---- Runner ----
let passed = 0, failed = 0;
const thrownMessages = [];
async function test(name, fn) {
  try { await fn(); passed++; console.log(`  ✓ PASS: ${name}`); }
  catch (err) { failed++; console.log(`  ✗ FAIL: ${name}\n    -> ${redact(err && err.message)}`); }
}
function redact(text) {
  let out = String(text || '');
  for (const v of ALL_FAKE_VALUES) out = out.split(v).join('<redacted>');
  return out;
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }
function expectConfigError(fn, mustMention) {
  let caught = null;
  try { fn(); } catch (e) { caught = e; }
  assert(caught, 'expected a ConfigurationError, but no error was thrown');
  thrownMessages.push(caught.message);
  assert(caught instanceof env.ConfigurationError, `expected ConfigurationError, got ${caught && caught.name}`);
  if (mustMention) assert(caught.message.includes(mustMention), `error should name ${mustMention}`);
}
async function expectConfigErrorAsync(fn, mustMention) {
  let caught = null;
  try { await fn(); } catch (e) { caught = e; }
  assert(caught instanceof env.ConfigurationError, 'expected a ConfigurationError');
  thrownMessages.push(caught.message);
  if (mustMention) assert(caught.message.includes(mustMention), `error should name ${mustMention}`);
}
const noProductionClient = () => assert(!created.some((c) => c.url && c.url.includes(PROD_REF)), 'a Supabase client was created for the Production project');
const req = (headers = {}) => {
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return { headers: { get: (n) => lower[String(n).toLowerCase()] ?? null } };
};

async function main() {
  console.log('================================================================');
  console.log('🔒 ENVIRONMENT CONFIGURATION SAFETY SUITE (offline, fake keys only)');
  console.log('================================================================\n');

  console.log('[SECTION A: Production configuration keeps working]');
  await test('Production with its variables creates public, privileged, browser, and SSR clients', async () => withEnv(PRODUCTION, async () => {
    admin.getPublicClient(); admin.getPrivilegedClient(); browser.createClient(); await ssr.createClient();
    assert(created.length === 4 && created.every((c) => c.url === PROD_URL), 'expected four Production clients');
    assert(created.filter((c) => c.keyId === 'prodService').length === 1, 'service key used exactly once (privileged client)');
  }));
  await test('Production keeps its existing URL fallback when NEXT_PUBLIC_SUPABASE_URL is unset', async () => withEnv(without(PRODUCTION, 'NEXT_PUBLIC_SUPABASE_URL'), async () => {
    admin.getPrivilegedClient();
    assert(created[0].url === PROD_URL, 'expected the Production URL in Production');
  }));
  await test('Production keeps legacy aliases (SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY)', async () => withEnv({ VERCEL_ENV: 'production', SUPABASE_SERVICE_KEY: KEYS.prodService, SUPABASE_ANON_KEY: KEYS.prodAnon }, async () => {
    admin.getPrivilegedClient(); admin.getPublicClient();
    assert(created.length === 2, 'aliases should still work in Production');
  }));
  await test('Production privileged client does not require the anon key (unchanged behavior)', async () => withEnv(without(PRODUCTION, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'), async () => {
    admin.getPrivilegedClient();
    assert(created.length === 1, 'expected a privileged client');
  }));
  await test('Production site URL defaults to the Production site; live Stripe key accepted', async () => withEnv({ ...PRODUCTION, STRIPE_SECRET_KEY: KEYS.stripeLive }, async () => {
    assert(env.resolveSiteUrl() === 'https://trainwithfifs.com', 'expected Production site');
    assert(admin.resolveStripeSecretKey() === KEYS.stripeLive, 'Production must accept its live key');
  }));
  await test('Browser build marker identifies Production when VERCEL_ENV is not visible (browser runtime)', async () => withEnv({ NEXT_PUBLIC_FIFS_DEPLOYMENT_ENV: 'production', NEXT_PUBLIC_SUPABASE_URL: PROD_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY: KEYS.prodAnon }, async () => {
    assert(env.getDeploymentEnvironment() === 'production', 'expected production');
    browser.createClient();
    assert(created[0].url === PROD_URL, 'Production browser client should use Production');
  }));

  console.log('\n[SECTION B: Non-production with its own configuration works]');
  await test('Preview with its own staging variables creates all clients against staging only', async () => withEnv(PREVIEW_OK, async () => {
    admin.getPublicClient(); admin.getPrivilegedClient(); browser.createClient(); await ssr.createClient();
    assert(created.length === 4 && created.every((c) => c.url === STAGING_URL), 'expected staging clients');
    assert(env.resolveSiteUrl() === 'https://staging.example.test', 'expected staging site');
    assert(admin.resolveStripeSecretKey() === KEYS.stripeTest, 'expected test-mode Stripe key');
    noProductionClient();
  }));
  await test('Local/unset environment is non-production and accepts its own opaque keys', async () => withEnv({ NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321', NEXT_PUBLIC_SUPABASE_ANON_KEY: KEYS.opaquePublishable, SUPABASE_SERVICE_ROLE_KEY: KEYS.opaqueSecret }, async () => {
    assert(env.getDeploymentEnvironment() === 'non-production', 'unset must be non-production');
    admin.getPrivilegedClient(); browser.createClient();
    assert(created.every((c) => c.url === 'http://127.0.0.1:54321'), 'expected local clients');
  }));
  await test('Preview booking checkout succeeds with staging configuration and returns to the staging site', async () => withEnv(PREVIEW_OK, async () => {
    const result = await checkout.createBookingCheckout(req(), { email: 'buyer@example.test', courseSelection: 'Maryland CCW' });
    assert(result.status === 200, `expected 200, got ${result.status}`);
    assert(stripeSessions.length === 1 && stripeSessions[0].startsWith('https://staging.example.test/'), 'return URL must be the staging site');
    noProductionClient();
  }));

  console.log('\n[SECTION C: Non-production with missing variables fails closed]');
  for (const [missing, call] of [
    ['NEXT_PUBLIC_SUPABASE_URL', () => admin.getPrivilegedClient()],
    ['NEXT_PUBLIC_SUPABASE_URL', () => admin.getPublicClient()],
    ['NEXT_PUBLIC_SUPABASE_URL', () => browser.createClient()],
    ['NEXT_PUBLIC_SUPABASE_ANON_KEY', () => admin.getPublicClient()],
    ['NEXT_PUBLIC_SUPABASE_ANON_KEY', () => browser.createClient()],
    ['SUPABASE_SERVICE_ROLE_KEY', () => admin.getPrivilegedClient()],
    ['NEXT_PUBLIC_SITE_URL', () => env.resolveSiteUrl()]
  ]) {
    await test(`Preview missing ${missing}: ${call.toString().replace(/^\(\) => /, '')} fails with a clear error`, async () => withEnv(without(PREVIEW_OK, missing), async () => {
      expectConfigError(call, missing);
      noProductionClient();
    }));
  }
  await test('SSR client fails closed when NEXT_PUBLIC_SUPABASE_URL is missing', async () => withEnv(without(PREVIEW_OK, 'NEXT_PUBLIC_SUPABASE_URL'), async () => {
    await expectConfigErrorAsync(() => ssr.createClient(), 'NEXT_PUBLIC_SUPABASE_URL');
    noProductionClient();
  }));
  await test('Preview checkout with missing site URL returns 503 before any Stripe session is created', async () => withEnv(without(PREVIEW_OK, 'NEXT_PUBLIC_SITE_URL'), async () => {
    const result = await checkout.createBookingCheckout(req(), { email: 'buyer@example.test', courseSelection: 'Maryland CCW' });
    assert(result.status === 503 && /NEXT_PUBLIC_SITE_URL/.test(result.body.error), `expected 503 naming the variable, got ${result.status}`);
    assert(stripeSessions.length === 0, 'no Stripe session may be created');
  }));
  await test('Preview checkout with missing database configuration returns 503 before any Stripe session', async () => withEnv(without(PREVIEW_OK, 'SUPABASE_SERVICE_ROLE_KEY'), async () => {
    const result = await checkout.createBookingCheckout(req(), { email: 'buyer@example.test', courseSelection: 'Maryland CCW' });
    assert(result.status === 503 && stripeSessions.length === 0, `expected 503 without a session, got ${result.status}`);
  }));
  await test('Preview staff invite with missing site URL returns 503 and creates no account', async () => withEnv(without(PREVIEW_OK, 'NEXT_PUBLIC_SITE_URL'), async () => {
    const r = { ...req({ Authorization: 'Bearer staff-admin-token' }), url: 'https://staging.example.test/api/fifs', json: async () => ({ action: 'adminDirectInvite', fullName: 'Test Person', email: 'invitee@example.test', portalType: 'student' }) };
    const res = await fifsRoute.POST(r);
    assert(res.status === 503 && /NEXT_PUBLIC_SITE_URL/.test(res._body.error), `expected 503 naming the variable, got ${res.status}`);
    assert(createdUsers.length === 0, 'no auth account may be created');
  }));

  console.log('\n[SECTION D: Production values and alternate names are refused outside Production]');
  await test('Preview pointing NEXT_PUBLIC_SUPABASE_URL at the Production project is refused', async () => withEnv({ ...PREVIEW_OK, NEXT_PUBLIC_SUPABASE_URL: PROD_URL }, async () => {
    expectConfigError(() => admin.getPrivilegedClient(), 'Production');
    expectConfigError(() => browser.createClient(), 'Production');
    noProductionClient();
  }));
  await test('Alias SUPABASE_URL cannot supply the Production URL outside Production', async () => withEnv({ ...without(PREVIEW_OK, 'NEXT_PUBLIC_SUPABASE_URL'), SUPABASE_URL: PROD_URL }, async () => {
    expectConfigError(() => admin.getPrivilegedClient(), 'NEXT_PUBLIC_SUPABASE_URL');
    expectConfigError(() => admin.getPublicClient(), 'NEXT_PUBLIC_SUPABASE_URL');
    noProductionClient();
  }));
  await test('Alias SUPABASE_URL is ignored outside Production even when it is not Production', async () => withEnv({ ...without(PREVIEW_OK, 'NEXT_PUBLIC_SUPABASE_URL'), SUPABASE_URL: STAGING_URL }, async () => {
    expectConfigError(() => admin.getPrivilegedClient(), 'NEXT_PUBLIC_SUPABASE_URL');
  }));
  await test('Alias SUPABASE_SERVICE_KEY cannot supply a (Production) service key outside Production', async () => withEnv({ ...without(PREVIEW_OK, 'SUPABASE_SERVICE_ROLE_KEY'), SUPABASE_SERVICE_KEY: KEYS.prodService }, async () => {
    expectConfigError(() => admin.getPrivilegedClient(), 'SUPABASE_SERVICE_ROLE_KEY');
    assert(!created.some((c) => c.keyId === 'prodService'), 'Production service key must never be used');
  }));
  await test('Alias SUPABASE_SERVICE_KEY is ignored outside Production even with a non-Production key', async () => withEnv({ ...without(PREVIEW_OK, 'SUPABASE_SERVICE_ROLE_KEY'), SUPABASE_SERVICE_KEY: KEYS.stagingService }, async () => {
    expectConfigError(() => admin.getPrivilegedClient(), 'SUPABASE_SERVICE_ROLE_KEY is required');
    assert(created.length === 0, 'no client may be created from an alias outside Production');
  }));
  await test('Alias SUPABASE_ANON_KEY is ignored outside Production even with a non-Production key', async () => withEnv({ ...without(PREVIEW_OK, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'), SUPABASE_ANON_KEY: KEYS.stagingAnon }, async () => {
    expectConfigError(() => admin.getPublicClient(), 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
    assert(created.length === 0, 'no client may be created from an alias outside Production');
  }));
  await test('Alias SUPABASE_ANON_KEY is ignored outside Production', async () => withEnv({ ...without(PREVIEW_OK, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'), SUPABASE_ANON_KEY: KEYS.prodAnon }, async () => {
    expectConfigError(() => admin.getPublicClient(), 'NEXT_PUBLIC_SUPABASE_ANON_KEY');
    assert(!created.some((c) => c.keyId === 'prodAnon'), 'Production anon key must never be used');
  }));
  await test('Staging URL paired with a Production anon key is refused (server and browser)', async () => withEnv({ ...PREVIEW_OK, NEXT_PUBLIC_SUPABASE_ANON_KEY: KEYS.prodAnon }, async () => {
    expectConfigError(() => admin.getPublicClient(), 'Production');
    expectConfigError(() => browser.createClient(), 'Production');
  }));
  await test('Staging URL paired with a Production service key is refused', async () => withEnv({ ...PREVIEW_OK, SUPABASE_SERVICE_ROLE_KEY: KEYS.prodService }, async () => {
    expectConfigError(() => admin.getPrivilegedClient(), 'Production');
    assert(!created.some((c) => c.keyId === 'prodService'), 'Production service key must never be used');
  }));
  await test('Keys from a different project than the configured URL are refused', async () => withEnv({ ...PREVIEW_OK, NEXT_PUBLIC_SUPABASE_ANON_KEY: KEYS.otherAnon, SUPABASE_SERVICE_ROLE_KEY: KEYS.otherService }, async () => {
    expectConfigError(() => admin.getPublicClient(), 'different Supabase project');
    expectConfigError(() => admin.getPrivilegedClient(), 'different Supabase project');
  }));
  await test('An anon key in SUPABASE_SERVICE_ROLE_KEY is refused outside Production', async () => withEnv({ ...PREVIEW_OK, SUPABASE_SERVICE_ROLE_KEY: KEYS.stagingAnon }, async () => {
    expectConfigError(() => admin.getPrivilegedClient(), 'not a service-role key');
  }));
  await test('Production site URL is refused outside Production (apex and www)', async () => {
    for (const site of ['https://trainwithfifs.com', 'https://www.trainwithfifs.com/booking']) {
      await withEnv({ ...PREVIEW_OK, NEXT_PUBLIC_SITE_URL: site }, async () => expectConfigError(() => env.resolveSiteUrl(), 'Production site'));
    }
  });
  await test('Live Stripe keys are refused outside Production; checkout returns 503 with no session', async () => {
    for (const live of [KEYS.stripeLive, KEYS.stripeRestrictedLive]) {
      await withEnv({ ...PREVIEW_OK, STRIPE_SECRET_KEY: live }, async () => {
        expectConfigError(() => admin.resolveStripeSecretKey(), 'STRIPE_SECRET_KEY');
        const result = await checkout.createBookingCheckout(req(), { email: 'buyer@example.test', courseSelection: 'Maryland CCW' });
        assert(result.status === 503 && stripeSessions.length === 0, 'expected 503 without a Stripe session');
      });
    }
  });
  await test('Checkout status check refuses a live Stripe key outside Production (503)', async () => withEnv({ ...PREVIEW_OK, STRIPE_SECRET_KEY: KEYS.stripeLive }, async () => {
    const res = await checkoutRoute.GET({ url: 'https://staging.example.test/api/checkout?session_id=cs_test_fake', headers: { get: () => null } });
    assert(res.status === 503, `expected 503, got ${res.status}`);
  }));
  await test('VERCEL_ENV=development is non-production', async () => withEnv({ VERCEL_ENV: 'development' }, async () => {
    assert(env.getDeploymentEnvironment() === 'non-production', 'development must be non-production');
  }));
  await test('A Preview runtime cannot be promoted to Production by setting the build marker variable', async () => withEnv({ ...PREVIEW_OK, NEXT_PUBLIC_FIFS_DEPLOYMENT_ENV: 'production', NEXT_PUBLIC_SUPABASE_URL: PROD_URL }, async () => {
    assert(env.getDeploymentEnvironment() === 'non-production', 'runtime VERCEL_ENV must win');
    expectConfigError(() => admin.getPrivilegedClient(), 'Production');
  }));
  await test('next.config.ts derives the browser marker only from VERCEL_ENV', async () => {
    const configPath = path.join(ROOT, 'next.config.ts');
    const load = () => { delete require.cache[require.resolve(configPath)]; const m = require(configPath); return (m.default || m).env.NEXT_PUBLIC_FIFS_DEPLOYMENT_ENV; };
    const cases = [[{ VERCEL_ENV: 'production' }, 'production'], [{ VERCEL_ENV: 'preview' }, 'non-production'], [{}, 'non-production'],
      [{ VERCEL_ENV: 'preview', NEXT_PUBLIC_FIFS_DEPLOYMENT_ENV: 'production' }, 'non-production']];
    for (const [vars, expected] of cases) {
      const got = await withEnv(vars, async () => load());
      assert(got === expected, `VERCEL_ENV=${vars.VERCEL_ENV || '(unset)'} produced ${got}, expected ${expected}`);
    }
  });

  console.log('\n[SECTION E: Browser code never receives a service-role key]');
  await test('Browser client refuses a service-role key as its anon key, in every environment', async () => {
    for (const base of [PRODUCTION, PREVIEW_OK]) {
      const svc = base === PRODUCTION ? KEYS.prodService : KEYS.stagingService;
      for (const bad of [svc, KEYS.opaqueSecret]) {
        await withEnv({ ...base, NEXT_PUBLIC_SUPABASE_ANON_KEY: bad }, async () => {
          expectConfigError(() => browser.createClient(), 'never a service-role key');
          assert(created.length === 0, 'no client may be created with a service-role key');
        });
      }
    }
  });

  // Static import graph from the browser entry points.
  const clientEntries = ['src/app/page.tsx', 'src/app/layout.tsx'].map((p) => path.join(ROOT, p));
  function resolveImport(fromFile, spec) {
    let base;
    if (spec.startsWith('@/')) base = path.join(SRC, spec.slice(2));
    else if (spec.startsWith('.')) base = path.resolve(path.dirname(fromFile), spec);
    else return null; // package import
    for (const cand of [base, base + '.ts', base + '.tsx', base + '.js', path.join(base, 'index.ts')]) {
      if (fs.existsSync(cand) && fs.statSync(cand).isFile()) return cand;
    }
    return null;
  }
  const browserFiles = new Set();
  const stack = [...clientEntries];
  while (stack.length) {
    const file = stack.pop();
    if (browserFiles.has(file)) continue;
    browserFiles.add(file);
    const code = fs.readFileSync(file, 'utf-8');
    // import x from '…', export … from '…', side-effect import '…', dynamic import('…'), require('…')
    for (const m of code.matchAll(/(?:(?:import|export)\s[^'"]*?from\s*|import\s*\(\s*|import\s+|require\(\s*)['"]([^'"]+)['"]/g)) {
      const resolved = resolveImport(file, m[1]);
      if (resolved && resolved.startsWith(SRC)) stack.push(resolved);
    }
  }
  const SERVER_SECRET_NAMES = ['SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET',
    'RESEND_API_KEY', 'DISCORD_WEBHOOK_URL', 'CHAT_HMAC_SECRET', 'CRON_SECRET'];
  await test('Browser-reachable modules never import server-only code (src/Lib/server, API routes)', async () => {
    const bad = [...browserFiles].filter((f) => f.includes(`${path.sep}Lib${path.sep}server${path.sep}`) || f.includes(`${path.sep}app${path.sep}api${path.sep}`));
    assert(browserFiles.size >= 3, 'import graph looks too small to be meaningful');
    assert(bad.length === 0, 'browser imports server code: ' + bad.map((f) => path.relative(ROOT, f)).join(', '));
  });
  await test('Browser-reachable modules reference no server secret variables and only allowed NEXT_PUBLIC_* names', async () => {
    const allowedPublic = new Set(['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SITE_URL', 'NEXT_PUBLIC_FIFS_DEPLOYMENT_ENV']);
    for (const f of browserFiles) {
      const code = fs.readFileSync(f, 'utf-8');
      for (const name of SERVER_SECRET_NAMES) assert(!new RegExp(`process\\.env\\.${name}\\b`).test(code), `${path.relative(ROOT, f)} reads ${name}`);
      for (const m of code.matchAll(/process\.env\.(NEXT_PUBLIC_[A-Z0-9_]+)/g)) assert(allowedPublic.has(m[1]), `${path.relative(ROOT, f)} reads unexpected public variable ${m[1]}`);
    }
  });
  await test('Public browser script references no server secret variables or service-role keys', async () => {
    const code = fs.readFileSync(path.join(ROOT, 'public/scripts/TrainWithFIFS_scripts.js'), 'utf-8');
    for (const name of SERVER_SECRET_NAMES) assert(!new RegExp(`process\\.env\\.${name}\\b`).test(code), `public script reads ${name}`);
    assert(!/sb_secret_[A-Za-z0-9]/.test(code) && !/"role"\s*:\s*"service_role"/.test(code), 'public script contains a service-role key');
    assert(!/pk_live_[A-Za-z0-9]{10,}/.test(code), 'public script hardcodes a live Stripe key');
  });
  await test('No hardcoded live Stripe key remains in browser source', async () => {
    for (const f of browserFiles) assert(!/pk_live_[A-Za-z0-9]{10,}/.test(fs.readFileSync(f, 'utf-8')), `${path.relative(ROOT, f)} hardcodes a live Stripe key`);
  });
  await test('Built browser bundles (if present) contain no server secret variable names', async () => {
    const staticDir = path.join(ROOT, '.next', 'static');
    if (!fs.existsSync(staticDir)) { console.log('    (no .next/static build present — run `next build` to include this check)'); return; }
    const files = [];
    const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (p.endsWith('.js')) files.push(p); } };
    walk(staticDir);
    for (const f of files) {
      const code = fs.readFileSync(f, 'utf-8');
      for (const name of SERVER_SECRET_NAMES) assert(!code.includes(name), `browser bundle ${path.relative(ROOT, f)} mentions ${name}`);
    }
  });

  console.log('\n[SECTION F: Errors never contain configuration values]');
  await test('No error message contains any key value', async () => {
    assert(thrownMessages.length >= 20, `expected many captured errors, got ${thrownMessages.length}`);
    for (const msg of thrownMessages) for (const v of ALL_FAKE_VALUES) assert(!msg.includes(v), 'an error message contained a key value');
  });
  await test('No outbound network calls were attempted', async () => {
    assert(fetchCalls.length === 0, `unexpected outbound calls: ${fetchCalls.length}`);
  });

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
  console.log('================================================================');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => { console.error('Suite crashed:', redact(err && err.stack)); process.exit(1); });
