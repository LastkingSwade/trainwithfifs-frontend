// Passkeys (server side): sign in with Face ID / fingerprint. A software "phone" (a real P-256 key, real WebAuthn messages) drives the real server code and the real verification library,
// so the checks are cryptographic, not mocked: one-time challenges, the right site only, biometric required, replays and copies refused, same plain failure every time, own passkeys only (offline).
const fs = require('fs'); const path = require('path'); const crypto = require('crypto'); const assert = require('assert');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const P = require(path.join(ROOT, 'src/Lib/server/passkeys.ts'));
let passed = 0, failed = 0;
async function test(n, f) { try { await f(); console.log('  ✓ PASS: ' + n); passed++; } catch (e) { console.log('  ✗ FAIL: ' + n + '\n    -> ' + e.message); failed++; } }
const b64u = (b) => Buffer.from(b).toString('base64url'); const sha = (b) => crypto.createHash('sha256').update(b).digest();
const RP = P.rpFromSite('https://trainwithfifs.com'); const NOW = Date.parse('2026-11-01T12:00:00Z');
const U1 = '11111111-1111-4111-8111-111111111111', U2 = '22222222-2222-4222-8222-222222222222';
// ---- a tiny CBOR writer (ints, bytes, text, maps) for the attestation message ----
function cbor(v) { const head = (m, n) => (n < 24 ? Buffer.from([(m << 5) | n]) : n < 256 ? Buffer.from([(m << 5) | 24, n]) : Buffer.from([(m << 5) | 25, n >> 8, n & 255]));
  if (typeof v === 'number') return v >= 0 ? head(0, v) : head(1, -1 - v); if (Buffer.isBuffer(v)) return Buffer.concat([head(2, v.length), v]); if (typeof v === 'string') { const b = Buffer.from(v); return Buffer.concat([head(3, b.length), b]); }
  const e = [...v.entries()]; return Buffer.concat([head(5, e.length), ...e.flatMap(([k, x]) => [cbor(k), cbor(x)])]); }
// ---- the software phone ----
function phone() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' }); const jwk = publicKey.export({ format: 'jwk' }); const credId = crypto.randomBytes(32); let counter = 0;
  const cose = cbor(new Map([[1, 2], [3, -7], [-1, 1], [-2, Buffer.from(jwk.x, 'base64url')], [-3, Buffer.from(jwk.y, 'base64url')]]));
  const cd = (type, challenge, origin) => Buffer.from(JSON.stringify({ type, challenge, origin, crossOrigin: false }));
  const ctr = (n) => { const b = Buffer.alloc(4); b.writeUInt32BE(n); return b; };
  return { credId,
    create(options, { origin = RP.origin, uv = true, rpId = RP.id } = {}) {
      const authData = Buffer.concat([sha(rpId), Buffer.from([0x41 | (uv ? 0x04 : 0)]), ctr(0), Buffer.alloc(16), Buffer.from([credId.length >> 8, credId.length & 255]), credId, cose]);
      return { id: b64u(credId), rawId: b64u(credId), type: 'public-key', clientExtensionResults: {}, response: { clientDataJSON: b64u(cd('webauthn.create', options.challenge, origin)), attestationObject: b64u(cbor(new Map([['fmt', 'none'], ['attStmt', new Map()], ['authData', authData]]))), transports: ['internal'] } };
    },
    get(options, { origin = RP.origin, uv = true, rpId = RP.id, count = ++counter, key = privateKey, id = credId } = {}) {
      const authData = Buffer.concat([sha(rpId), Buffer.from([0x01 | (uv ? 0x04 : 0)]), ctr(count)]); const clientData = cd('webauthn.get', options.challenge, origin);
      const sig = crypto.sign('sha256', Buffer.concat([authData, sha(clientData)]), key);
      return { id: b64u(id), rawId: b64u(id), type: 'public-key', clientExtensionResults: {}, response: { authenticatorData: b64u(authData), clientDataJSON: b64u(clientData), signature: b64u(sig), userHandle: b64u(Buffer.from(U1)) } };
    } };
}
// ---- an in-memory database with just what the code uses ----
function mem() {
  const t = { passkeys: [], passkey_challenges: [] }; const log = { links: [], missing: false };
  const from = (table) => { const f = []; let op = 'select', vals = null, ret = false, lim = null, ord = null;
    const q = { select: () => { ret = true; return q; }, eq: (c, v) => { f.push((r) => String(r[c]) === String(v)); return q; }, lt: (c, v) => { f.push((r) => String(r[c]) < String(v)); return q; }, order: () => q, limit: (n) => { lim = n; return q; },
      insert: (v) => { op = 'insert'; vals = v; return q; }, update: (v) => { op = 'update'; vals = v; return q; }, delete: () => { op = 'delete'; return q; },
      maybeSingle: async () => { const r = await run(); return r.error ? r : { data: (r.data || [])[0] || null, error: null }; }, then: (res, rej) => run().then(res, rej) };
    const run = async () => { if (log.missing) return { data: null, error: { code: '42P01', message: 'relation does not exist' } }; const rows = t[table];
      if (op === 'update' && log.updateFails) throw new Error('db down');
      if (op === 'insert') { if (table === 'passkeys' && rows.some((r) => r.credential_id === vals.credential_id)) return { data: null, error: { code: '23505', message: 'dup' } }; rows.push({ id: vals.id || crypto.randomUUID(), created_at: new Date().toISOString(), last_used_at: null, ...vals }); return { data: null, error: null }; }
      const hit = rows.filter((r) => f.every((g) => g(r))); if (op === 'update') { hit.forEach((r) => Object.assign(r, vals)); return { data: ret ? hit : null, error: null }; }
      if (op === 'delete') { t[table] = rows.filter((r) => !hit.includes(r)); return { data: ret ? hit.map((r) => ({ ...r })) : null, error: null }; } let out = hit.map((r) => ({ ...r })); if (lim) out = out.slice(0, lim); return { data: out, error: null }; };
    return q; };
  const users = { [U1]: { id: U1, email: 'josh@example.com' }, [U2]: { id: U2, email: 'tanae@example.com' } };
  const authAdmin = { getUserById: async (id) => (users[id] ? { data: { user: users[id] }, error: null } : { data: { user: null }, error: { message: 'none' } }), generateLink: async (a) => { log.links.push(a); return log.linkFails ? { data: null, error: { message: 'x' } } : { data: { properties: { hashed_token: 'hash-' + a.email } }, error: null }; } };
  return { t, from, log, authAdmin, users };
}
const jwt = (amrTs) => ['h', Buffer.from(JSON.stringify({ amr: amrTs === undefined ? [] : [{ method: 'password', timestamp: amrTs }] })).toString('base64url'), 's'].join('.');
const fresh = () => jwt(Math.floor(NOW / 1000) - 60);
const user1 = { id: U1, email: 'josh@example.com' };
async function addPasskey(db, ph, who = user1, name = 'iPhone') { const o = await P.registerOptions(db, who, jwt(Math.floor(NOW / 1000) - 5), RP, NOW); assert(o.ok, JSON.stringify(o)); const r = await P.registerVerify(db, who, { challengeId: o.challengeId, response: ph.create(o.options), deviceName: name }, RP, NOW); assert(r.ok, JSON.stringify(r)); return r; }

(async () => {
  console.log('\n[the basics]');
  await test('The site identity comes from the site address only; "signed in recently" is read from when they last signed in (15 minutes)', () => {
    assert.deepStrictEqual(RP, { id: 'trainwithfifs.com', name: 'Train With FIFS', origin: 'https://trainwithfifs.com' }); const s = Math.floor(NOW / 1000);
    assert(P.recentSignIn(jwt(s - 60), NOW) && P.recentSignIn(jwt(s - 899), NOW)); assert(!P.recentSignIn(jwt(s - 901), NOW) && !P.recentSignIn(jwt(undefined), NOW) && !P.recentSignIn('garbage', NOW) && !P.recentSignIn('', NOW) && !P.recentSignIn(jwt(s + 99999), NOW), 'old, missing, malformed or future');
  });
  console.log('\n[adding a device]');
  await test('Adding Face ID: the server asks for a biometric and a stored (discoverable) passkey, then keeps only the public key, the counter and the name the person chose', async () => {
    const db = mem(), ph = phone(); const o = await P.registerOptions(db, user1, fresh(), RP, NOW); assert(o.ok && o.challengeId);
    assert(o.options.authenticatorSelection.userVerification === 'required' && o.options.authenticatorSelection.residentKey === 'required' && o.options.attestation === 'none' && o.options.rp.id === 'trainwithfifs.com', 'options');
    assert(o.options.pubKeyCredParams.every((p) => [-7, -257].includes(p.alg)), 'algs'); const r = await P.registerVerify(db, user1, { challengeId: o.challengeId, response: ph.create(o.options), deviceName: '  My <b>iPhone</b>  ' }, RP, NOW);
    assert(r.ok && r.passkeys.length === 1 && r.passkeys[0].name === 'My b iPhone /b', JSON.stringify(r)); const row = db.t.passkeys[0]; assert(row.user_id === U1 && row.credential_id === b64u(ph.credId) && row.counter === 0 && row.public_key.length > 40);
    assert(!Object.keys(row).some((k) => /private|secret|password/.test(k)), 'only public data stored'); assert(db.t.passkey_challenges.length === 0, 'the one-time request is used up');
  });
  await test('Adding needs a RECENT sign-in; up to 5 devices; the same device cannot be added twice; each person has their own list', async () => {
    const db = mem(); const old = await P.registerOptions(db, user1, jwt(Math.floor(NOW / 1000) - 3600), RP, NOW); assert(!old.ok && old.status === 403 && /sign in again/.test(old.message));
    for (let i = 0; i < 5; i++) await addPasskey(db, phone(), user1, 'd' + i); const sixth = await P.registerOptions(db, user1, fresh(), RP, NOW); assert(!sixth.ok && sixth.status === 409 && /up to 5/.test(sixth.message));
    const d2 = mem(), ph = phone(); await addPasskey(d2, ph); const o = await P.registerOptions(d2, user1, fresh(), RP, NOW); assert(o.options.excludeCredentials.length === 1, 'already-added devices are excluded');
    const dup = await P.registerVerify(d2, user1, { challengeId: o.challengeId, response: ph.create(o.options) }, RP, NOW); assert(!dup.ok, 'same device twice'); const other = await P.passkeyList(d2, U2); assert(other.ok && other.passkeys.length === 0, 'someone else sees none');
  });
  await test('Two additions started at once cannot slip past the limit of 5', async () => {
    const db = mem(); for (let i = 0; i < 4; i++) await addPasskey(db, phone(), user1, 'd' + i); const a = phone(), b = phone();
    const oa = await P.registerOptions(db, user1, fresh(), RP, NOW), ob = await P.registerOptions(db, user1, fresh(), RP, NOW); assert(oa.ok && ob.ok, 'both were allowed to start');
    assert((await P.registerVerify(db, user1, { challengeId: oa.challengeId, response: a.create(oa.options) }, RP, NOW)).ok); const sixth = await P.registerVerify(db, user1, { challengeId: ob.challengeId, response: b.create(ob.options) }, RP, NOW); assert(!sixth.ok && sixth.status === 409 && db.t.passkeys.length === 5);
  });
  await test('A bad registration is refused and gets nothing stored: wrong site, no biometric, wrong challenge, reused request, expired request, another person\'s request, junk', async () => {
    const tries = [['wrong site', (db, o, ph) => ph.create(o.options, { origin: 'https://evil.example' })], ['wrong rp id', (db, o, ph) => ph.create(o.options, { rpId: 'evil.example' })], ['no biometric', (db, o, ph) => ph.create(o.options, { uv: false })],
      ['wrong challenge', (db, o, ph) => ph.create({ challenge: b64u(crypto.randomBytes(32)) })], ['junk', () => ({ id: 'x', response: {} })], ['nothing', () => undefined]];
    for (const [name, make] of tries) { const db = mem(), ph = phone(); const o = await P.registerOptions(db, user1, fresh(), RP, NOW); const r = await P.registerVerify(db, user1, { challengeId: o.challengeId, response: make(db, o, ph) }, RP, NOW); assert(!r.ok, name); assert(db.t.passkeys.length === 0, name + ' stored something'); }
    const db = mem(), ph = phone(); const o = await P.registerOptions(db, user1, fresh(), RP, NOW); const resp = ph.create(o.options);
    assert(!(await P.registerVerify(db, user1, { challengeId: o.challengeId, response: resp }, RP, NOW + 6 * 60 * 1000)).ok, 'expired'); const o2 = await P.registerOptions(db, user1, fresh(), RP, NOW);
    assert((await P.registerVerify(db, user1, { challengeId: o2.challengeId, response: ph.create(o2.options) }, RP, NOW)).ok, 'first use works'); assert(!(await P.registerVerify(db, user1, { challengeId: o2.challengeId, response: ph.create(o2.options) }, RP, NOW)).ok, 'second use refused');
    const o3 = await P.registerOptions(db, user1, fresh(), RP, NOW); assert(!(await P.registerVerify(db, { id: U2 }, { challengeId: o3.challengeId, response: phone().create(o3.options) }, RP, NOW)).ok, 'someone else cannot finish it'); assert(!(await P.registerVerify(db, user1, { challengeId: 'not-a-uuid', response: resp }, RP, NOW)).ok);
  });
  await test('Before the SQL file is run: a clear message and nothing breaks', async () => {
    const db = mem(); db.log.missing = true; const o = await P.registerOptions(db, user1, fresh(), RP, NOW); assert(!o.ok && /not set up yet/.test(o.message)); const l = await P.loginOptions(db, RP, NOW); assert(!l.ok && /not set up yet/.test(l.message)); const li = await P.passkeyList(db, U1); assert(li.ok && li.passkeys.length === 0);
  });
  console.log('\n[signing in]');
  await test('Signing in: the phone proves the passkey, the server hands back a one-time sign-in token for that person\'s own email, and the counter and last-used time are kept', async () => {
    const db = mem(), ph = phone(); await addPasskey(db, ph); const o = await P.loginOptions(db, RP, NOW); assert(o.ok && o.options.userVerification === 'required' && o.options.rpId === 'trainwithfifs.com');
    const r = await P.loginVerify(db, db.authAdmin, { challengeId: o.challengeId, response: ph.get(o.options) }, RP, NOW); assert(r.ok && r.tokenHash === 'hash-josh@example.com', JSON.stringify(r)); assert.deepStrictEqual(db.log.links, [{ type: 'magiclink', email: 'josh@example.com' }]);
    assert(db.t.passkeys[0].counter === 1 && db.t.passkeys[0].last_used_at, 'counter and time kept'); assert(db.t.passkey_challenges.length === 0, 'request used up');
  });
  await test('Every way of failing gives the SAME plain message and no token: unknown device, replay of the same request, a copy signed by another key, wrong site, no biometric, an old counter, expired, a register request used to sign in, junk', async () => {
    const base = async () => { const db = mem(), ph = phone(); await addPasskey(db, ph); return { db, ph }; }; const tries = [];
    tries.push(['unknown device', async () => { const { db } = await base(), stranger = phone(); const o = await P.loginOptions(db, RP, NOW); return [db, o, stranger.get(o.options)]; }]);
    tries.push(['wrong key', async () => { const { db, ph } = await base(); const o = await P.loginOptions(db, RP, NOW); return [db, o, ph.get(o.options, { key: crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' }).privateKey })]; }]);
    tries.push(['wrong site', async () => { const { db, ph } = await base(); const o = await P.loginOptions(db, RP, NOW); return [db, o, ph.get(o.options, { origin: 'https://evil.example' })]; }]);
    tries.push(['wrong rp id', async () => { const { db, ph } = await base(); const o = await P.loginOptions(db, RP, NOW); return [db, o, ph.get(o.options, { rpId: 'evil.example' })]; }]);
    tries.push(['no biometric', async () => { const { db, ph } = await base(); const o = await P.loginOptions(db, RP, NOW); return [db, o, ph.get(o.options, { uv: false })]; }]);
    tries.push(['another challenge', async () => { const { db, ph } = await base(); const o = await P.loginOptions(db, RP, NOW); return [db, o, ph.get({ challenge: b64u(crypto.randomBytes(32)) })]; }]);
    tries.push(['junk', async () => { const { db } = await base(); const o = await P.loginOptions(db, RP, NOW); return [db, o, { id: 'x' }]; }]);
    tries.push(['nothing', async () => { const { db } = await base(); const o = await P.loginOptions(db, RP, NOW); return [db, o, undefined]; }]);
    for (const [name, make] of tries) { const [db, o, resp] = await make(); const r = await P.loginVerify(db, db.authAdmin, { challengeId: o.challengeId, response: resp }, RP, NOW); assert(!r.ok && r.status === 401 && r.message === P.SIGN_IN_FAILED && !('tokenHash' in r), name); assert(db.log.links.length === 0, name + ' made a token'); }
    const { db, ph } = await base(); const o = await P.loginOptions(db, RP, NOW); const resp = ph.get(o.options); assert((await P.loginVerify(db, db.authAdmin, { challengeId: o.challengeId, response: resp }, RP, NOW)).ok);
    const replay = await P.loginVerify(db, db.authAdmin, { challengeId: o.challengeId, response: resp }, RP, NOW); assert(!replay.ok && replay.message === P.SIGN_IN_FAILED && db.log.links.length === 1, 'a captured request cannot be replayed');
    const o2 = await P.loginOptions(db, RP, NOW); const old = await P.loginVerify(db, db.authAdmin, { challengeId: o2.challengeId, response: ph.get(o2.options, { count: 1 }) }, RP, NOW); assert(!old.ok && old.message === P.SIGN_IN_FAILED, 'a counter that went backwards means a copied passkey');
    const o3 = await P.loginOptions(db, RP, NOW); const late = await P.loginVerify(db, db.authAdmin, { challengeId: o3.challengeId, response: ph.get(o3.options) }, RP, NOW + 6 * 60 * 1000); assert(!late.ok && late.message === P.SIGN_IN_FAILED, 'expired');
    const reg = await P.registerOptions(db, user1, fresh(), RP, NOW); const wrongPurpose = await P.loginVerify(db, db.authAdmin, { challengeId: reg.challengeId, response: ph.get(reg.options) }, RP, NOW); assert(!wrongPurpose.ok, 'a register request cannot sign anyone in');
  });
  await test('The token is always for the passkey owner\'s own email, whatever else the request says; and a problem saving the counter never blocks a real sign-in', async () => {
    const db = mem(), ph = phone(); await addPasskey(db, ph); const o = await P.loginOptions(db, RP, NOW); const resp = { ...ph.get(o.options), email: 'tanae@example.com', userId: U2, user_id: U2 };
    const r = await P.loginVerify(db, db.authAdmin, { challengeId: o.challengeId, response: resp, email: 'tanae@example.com' }, RP, NOW); assert(r.ok && r.tokenHash === 'hash-josh@example.com' && db.log.links[0].email === 'josh@example.com', 'owner only');
    db.log.updateFails = true; const o2 = await P.loginOptions(db, RP, NOW); const r2 = await P.loginVerify(db, db.authAdmin, { challengeId: o2.challengeId, response: ph.get(o2.options) }, RP, NOW); assert(r2.ok, 'sign-in stands');
  });
  await test('A removed, banned or deleted account never gets a token, and a failure to make the token is the same plain failure', async () => {
    const go = async (mutate) => { const db = mem(), ph = phone(); await addPasskey(db, ph); mutate(db); const o = await P.loginOptions(db, RP, NOW); return P.loginVerify(db, db.authAdmin, { challengeId: o.challengeId, response: ph.get(o.options) }, RP, NOW); };
    for (const [name, m] of [['removed', (db) => { db.t.passkeys.length = 0; }], ['banned', (db) => { db.users[U1].banned_until = '2099-01-01T00:00:00Z'; }], ['deleted account', (db) => { delete db.users[U1]; }], ['token failure', (db) => { db.log.linkFails = true; }], ['no email', (db) => { db.users[U1].email = ''; }]]) { const r = await go(m); assert(!r.ok && r.message === P.SIGN_IN_FAILED, name); }
    const fine = await go((db) => { db.users[U1].banned_until = '2001-01-01T00:00:00Z'; }); assert(fine.ok, 'an old ban that has ended does not block');
  });
  console.log('\n[managing devices]');
  await test('A person can list and remove only their own devices', async () => {
    const db = mem(); await addPasskey(db, phone(), user1, 'iPhone'); await addPasskey(db, phone(), { id: U2, email: 'tanae@example.com' }, 'Pixel'); const mine = await P.passkeyList(db, U1); assert(mine.passkeys.length === 1 && mine.passkeys[0].name === 'iPhone');
    const theirs = db.t.passkeys.find((r) => r.user_id === U2).id; const bad = await P.passkeyRemove(db, U1, theirs); assert(!bad.ok && bad.status === 404 && db.t.passkeys.length === 2, 'cannot remove someone else\'s');
    assert(!(await P.passkeyRemove(db, U1, 'nope')).ok); const ok = await P.passkeyRemove(db, U1, mine.passkeys[0].id); assert(ok.ok && db.t.passkeys.length === 1); assert(!(await P.passkeyRemove(db, U1, mine.passkeys[0].id)).ok, 'twice');
  });
  console.log('\n[the server and the tables]');
  await test('The server actions: the two sign-in steps are public and rate-limited; the other four need a verified login and use only that person; nothing sensitive is logged', () => {
    const api = read('src/app/api/fifs/route.ts'); const a = api.indexOf("case 'passkeyLoginOptions':"), b = api.indexOf("case 'passkeyRegisterOptions':"), c = api.indexOf('// Staff: create the Student Portal for a paying guest');
    const pub = api.slice(a, b), priv = api.slice(b, c); assert(/allowPublicSubmit\(req, 'passkeyLogin'/.test(pub) && !/getAuthenticatedUser/.test(pub), 'public steps limited'); assert(priv.indexOf('getAuthenticatedUser(req)') < priv.indexOf('getPrivilegedClient()') && /status: 401/.test(priv), 'login first');
    assert(/passkeyList\(sb, me\.id\)/.test(priv) && /passkeyRemove\(sb, me\.id, payload\?\.id\)/.test(priv) && !/payload\?\.(userId|user_id|email)/.test(priv + pub), 'only the verified person'); assert(/rpFromSite\(resolveSiteUrl\(\)\)/.test(pub) && /rpFromSite\(resolveSiteUrl\(\)\)/.test(priv), 'site identity from config');
    assert(!/console\./.test(read('src/Lib/server/passkeys.ts').replace(/\/\/.*$/gm, '')), 'no logging'); assert(/Cache-Control': 'no-store'/.test(pub) && /Cache-Control': 'no-store'/.test(priv), 'never cached');
  });
  await test('The SQL adds exactly two tables, both server-only (row security on, nothing granted to browsers), the public key only, deleted with the account, with fixed purposes', () => {
    const s = read('scripts/sql/20261031_passkeys.sql'); const code = s.replace(/--.*$/gm, ''); assert.strictEqual((code.match(/create table/gi) || []).length, 2); assert(/passkeys enable row level security/.test(code) && /passkey_challenges enable row level security/.test(code) && /revoke all on public\.passkeys from anon, authenticated/.test(code) && /revoke all on public\.passkey_challenges from anon, authenticated/.test(code), 'locked');
    assert(!/create policy|grant /i.test(code), 'no policy or grant'); assert(/references auth\.users\(id\) on delete cascade/.test(code), 'goes with the account'); assert(/purpose in \('register', 'login'\)/.test(code)); assert(!/private_key|secret/i.test(code), 'no secret column'); assert(!/\bdrop\b|alter table public\.(?!passkeys|passkey_challenges)/i.test(code), 'touches nothing else');
  });
  console.log(`\nPasskeys: ${passed} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
})();
