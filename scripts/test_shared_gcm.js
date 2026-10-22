// One shared AES-GCM routine (src/Lib/server/gcm.ts) for the Vault, Armory records and Armory photos.
// The samples below were sealed by the code as it stood BEFORE they were merged into one routine (fixed test keys and a fixed nonce, nothing real).
// They prove: data already stored still opens, and new data is byte-for-byte what the old code would have written.
const fs = require('fs'); const path = require('path'); const assert = require('assert'); const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const G = {"keys": {"WALLET_KEY": "abababababababababababababababababababababababababababababababab", "ARMORY_KEY": "cdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcd"}, "ids": {"U": "11111111-1111-4111-8111-111111111111", "DOC": "dddddddd-dddd-4ddd-8ddd-dddddddddddd", "ITEM": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "PH": "cccccccc-cccc-4ccc-8ccc-cccccccccccc"}, "vault": {"plainB64": "Z29sZGVuIHZhdWx0IGZpbGU6ICVQREYtMS40IHRlc3QgYnl0ZXMgw6nkuK0=", "sealedB64": "AQcHBwcHBwcHBwcHB5+butqPURF6KlTNt2cO6GnKy7EQaSnBgyuTu5/VWkxW5dYNg8mps6mreu/mAOdBVe/ECWHFxNPmFocdog=="}, "item": {"data": {"nickname": "Range pistol", "type": "handgun", "make": "Glock", "model": "19", "caliber": "9mm", "serial": "ABC123", "purchasedOn": "2024-03-01", "price": 549.99, "notes": "golden", "maintenance": [{"id": "m1", "on": "2026-09-01", "kind": "cleaning", "note": "oiled"}], "serviceEveryMonths": 12}, "sealed": "BwcHBwcHBwcHBwcH/hoNWpFgOUj1N7uHhNkUPBEp56edpQuye3WkYV7y47r6pVGH0g4/5omu8tS8CZVgpLjcLC1ssza9aGMNH8Ps4IFsQpC4Lfk7APZD8p4+WPPbD59/oYZvxp2POtmph7FRZmGSYJ2UFnNF5XQ0ER7yuvKNB3tTKKYEFwT5dpSMYFHK7rlJBUOXW9hG4R1u85EGDUSNovrAr989CFgQdP4Y3xKy9o7mfPrQ6+S5exE/8kgOAIIYrOU/1qJs1GaWzy4g/Ihj03MKhghXo4aDAB3/sTA7BjNCMujOxusiCMAY/6yNyS1+SQof2GjILXVBfZ59Al0DSXfx30T7L6dGP5dW7sBiBMZ9H6BSbOvwvyd9ETaTXKiRo9yf6w6MAJg="}, "photoFull": {"plainB64": "/9j/4GdvbGRlbiBwaG90byBieXRlc1VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=", "sealedB64": "AQcHBwcHBwcHBwcHB43hwqHHqPBu5/97EeDfzhKV03YumaEJt3N+pisUz/a7vaIIg94OHtyw2YujnSWwUNPXqxEZV4IEnVMUdGj72N6xGy3nqhTDDT6BOoWmBA=="}, "photoThumb": {"plainB64": "/9j/4GdvbGRlbiBwaG90byBieXRlc1VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=", "sealedB64": "AQcHBwcHBwcHBwcHB/A8MTXO3A3YehAchnhXuoeV03YumaEJt3N+pisUz/a7vaIIg94OHtyw2YujnSWwUNPXqxEZV4IEnVMUdGj72N6xGy3nqhTDDT6BOoWmBA=="}};
process.env.WALLET_KEY = G.keys.WALLET_KEY; process.env.ARMORY_KEY = G.keys.ARMORY_KEY;
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const W = require(path.join(ROOT, 'src/Lib/server/wallet.ts')); const A = require(path.join(ROOT, 'src/Lib/server/armory.ts')); const P = require(path.join(ROOT, 'src/Lib/server/armory-photos.ts')); const GCM = require(path.join(ROOT, 'src/Lib/server/gcm.ts'));
let passed = 0, failed = 0;
function test(n, f) { try { f(); console.log('  ✓ PASS: ' + n); passed++; } catch (e) { console.log('  ✗ FAIL: ' + n + '\n    -> ' + e.message); failed++; } }
const { U, DOC, ITEM, PH } = G.ids; const b = (x) => Buffer.from(x, 'base64');
const fixedNonce = (fn) => { const real = crypto.randomBytes; crypto.randomBytes = (n) => (n === 12 ? Buffer.alloc(12, 7) : real(n)); try { return fn(); } finally { crypto.randomBytes = real; } };
console.log('\n[shared encryption]');
test('Vault: a file sealed before the change still opens, and sealing again gives the identical bytes', () => {
  assert.ok(W.decryptBytes(b(G.vault.sealedB64), U, DOC).equals(b(G.vault.plainB64)));
  assert.strictEqual(fixedNonce(() => W.encryptBytes(b(G.vault.plainB64), U, DOC)).toString('base64'), G.vault.sealedB64);
});
test('Armory record: a record sealed before the change still opens, and sealing again gives the identical text', () => {
  assert.deepStrictEqual(A.decryptItem(U, ITEM, G.item.sealed, 1), G.item.data);
  assert.strictEqual(fixedNonce(() => A.encryptItem(U, ITEM, G.item.data, 1)), G.item.sealed);
});
test('Armory photos (full and preview): sealed-before photos still open, and sealing again gives the identical bytes', () => {
  for (const k of ['full', 'thumb']) { const s = G[k === 'full' ? 'photoFull' : 'photoThumb'];
    assert.ok(P.openPhoto(k, U, ITEM, PH, b(s.sealedB64)).equals(b(s.plainB64)), k + ' opens');
    assert.strictEqual(fixedNonce(() => P.sealPhoto(k, U, ITEM, PH, b(s.plainB64), 1)).toString('base64'), s.sealedB64, k + ' identical'); }
});
test('Each kind stays bound to its owner and its ids: another person, another document, another item, or the other photo size will not open it', () => {
  const OTHER = '22222222-2222-4222-8222-222222222222';
  assert.throws(() => W.decryptBytes(b(G.vault.sealedB64), OTHER, DOC)); assert.throws(() => W.decryptBytes(b(G.vault.sealedB64), U, OTHER));
  assert.throws(() => A.decryptItem(OTHER, ITEM, G.item.sealed, 1)); assert.throws(() => A.decryptItem(U, OTHER, G.item.sealed, 1));
  assert.throws(() => P.openPhoto('thumb', U, ITEM, PH, b(G.photoFull.sealedB64))); assert.throws(() => P.openPhoto('full', U, OTHER, PH, b(G.photoFull.sealedB64))); assert.throws(() => P.openPhoto('full', OTHER, ITEM, PH, b(G.photoFull.sealedB64)));
});
test('Any changed byte (nonce, tag or content) is refused, and a too-short blob is refused', () => {
  for (const [name, blob, open] of [['vault', b(G.vault.sealedB64), (x) => W.decryptBytes(x, U, DOC)], ['photo', b(G.photoFull.sealedB64), (x) => P.openPhoto('full', U, ITEM, PH, x)], ['record', b(G.item.sealed), (x) => A.decryptItem(U, ITEM, x.toString('base64'), 1)]]) {
    for (const at of [5, 20, blob.length - 1]) { const c = Buffer.from(blob); c[at] ^= 1; assert.throws(() => open(c), name + ' byte ' + at); }
    assert.throws(() => open(blob.subarray(0, 20)), name + ' short'); }
});
test('The shared routine works on its own: with and without the version byte, and refuses a wrong key or wrong bound text', () => {
  const key = Buffer.alloc(32, 9), aad = Buffer.from('x'), plain = Buffer.from('hello');
  const v = GCM.gcmSeal(key, aad, plain, 3), n = GCM.gcmSeal(key, aad, plain);
  assert.strictEqual(v[0], 3); assert.strictEqual(v.length, plain.length + 29); assert.strictEqual(n.length, plain.length + 28);
  assert.ok(GCM.gcmOpen(key, aad, v, true).equals(plain)); assert.ok(GCM.gcmOpen(key, aad, n, false).equals(plain));
  assert.throws(() => GCM.gcmOpen(Buffer.alloc(32, 8), aad, v, true)); assert.throws(() => GCM.gcmOpen(key, Buffer.from('y'), v, true)); assert.throws(() => GCM.gcmOpen(key, aad, n.subarray(0, 27), false));
  assert.notStrictEqual(GCM.gcmSeal(key, aad, plain).toString('hex'), GCM.gcmSeal(key, aad, plain).toString('hex'), 'a fresh nonce every time');
});
test('Only the shared file talks to the cipher: the Vault, Armory records and photos no longer carry their own copy', () => {
  for (const f of ['wallet', 'armory', 'armory-photos']) { const s = fs.readFileSync(path.join(ROOT, 'src/Lib/server', f + '.ts'), 'utf8'); assert.ok(!/createCipheriv|createDecipheriv/.test(s), f + ' has its own cipher'); assert.ok(/from '\.\/gcm'/.test(s), f + ' does not use the shared file'); }
  assert.ok(/aes-256-gcm/.test(fs.readFileSync(path.join(ROOT, 'src/Lib/server/gcm.ts'), 'utf8')));
});
console.log('\nShared encryption: ' + passed + ' passed, ' + failed + ' failed'); process.exit(failed ? 1 : 0);
