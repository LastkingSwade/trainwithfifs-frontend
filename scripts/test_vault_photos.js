/**
 * TrainWithFIFS - Vault photos (offline)
 * A phone photo over the 3 MB limit (or an iPhone HEIC) is shrunk to a plain JPEG on the phone before it is sent; small photos and PDFs go through untouched; the Vault still encrypts every file on the server
 * before it reaches storage, still decides the file type from the file's own bytes, and still stores only PDF, PNG, JPG and WEBP. (The shrinking itself is also run in a real browser by the release checks.)
 */
const fs = require('fs'); const path = require('path');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const P = require(path.join(ROOT, 'src/portal/photoShrink.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
const code = (p) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const MB = 1024 * 1024;

(async () => {
  await test('only photos that need it are prepared: a photo over the limit, or an iPhone HEIC; small photos, PDFs and everything else go through untouched', () => {
    assert(P.needsPrep('image/jpeg', 5 * MB, 3 * MB) && P.needsPrep('image/png', 3 * MB + 1, 3 * MB) && P.needsPrep('image/webp', 9 * MB, 3 * MB), 'big photos');
    assert(P.needsPrep('image/heic', 1 * MB, 3 * MB) && P.needsPrep('image/HEIF', 10, 3 * MB), 'HEIC even when small (the Vault cannot store it as it is)');
    assert(!P.needsPrep('image/jpeg', 2 * MB, 3 * MB) && !P.needsPrep('image/jpeg', 3 * MB, 3 * MB) && !P.needsPrep('image/png', 1000, 3 * MB), 'small photos untouched');
    assert(!P.needsPrep('application/pdf', 9 * MB, 3 * MB) && !P.needsPrep('', 9 * MB, 3 * MB) && !P.needsPrep(undefined, 9 * MB, 3 * MB) && !P.needsPrep('text/plain', 9 * MB, 3 * MB), 'PDFs and other files untouched');
  });
  await test('the drawn size keeps the shape, never goes above the longest-side limit and never enlarges a picture', () => {
    eq(P.fitSize(4000, 3000, 2400), { w: 2400, h: 1800 }); eq(P.fitSize(3000, 4000, 2400), { w: 1800, h: 2400 }); eq(P.fitSize(1000, 800, 2400), { w: 1000, h: 800 }, 'no enlarging'); eq(P.fitSize(2400, 2400, 2400), { w: 2400, h: 2400 });
    eq(P.fitSize(10000, 1, 2400), { w: 2400, h: 1 }, 'a very thin picture keeps at least 1 pixel'); eq(P.fitSize(0, 0, 2400), { w: 1, h: 1 }, 'nonsense sizes do not give zero');
    for (const [w, h] of [[4032, 3024], [6000, 4000], [1234, 4321]]) { const r = P.fitSize(w, h, 1600); assert(Math.max(r.w, r.h) <= 1600 && Math.abs(r.w / r.h - w / h) < 0.01, `${w}x${h} -> ${r.w}x${r.h}`); }
  });
  await test('the shrink schedule only ever gets smaller, starts with good quality, keeps text on a permit card readable (not below 1200 px or quality 0.5), and stops after a few tries', () => {
    const a = P.ATTEMPTS; assert(a.length >= 4 && a.length <= 8, 'a few tries'); eq(a[0], { side: 2400, quality: 0.85 }, 'best quality first');
    for (let i = 1; i < a.length; i++) assert(a[i].side <= a[i - 1].side && a[i].quality <= a[i - 1].quality && (a[i].side < a[i - 1].side || a[i].quality < a[i - 1].quality), 'each try is smaller than the last');
    assert(a.every((x) => x.side >= 1200 && x.quality >= 0.5), 'never so small that a card cannot be read'); assert(P.TARGET_FRACTION > 0.8 && P.TARGET_FRACTION < 1, 'aims under the limit');
  });
  await test('the photo code touches only the chosen file on this phone: no network, storage, logging or HTML, and nothing is created beyond a canvas and a plain JPEG file', () => {
    const c = code('src/portal/photoShrink.ts'); assert(!/fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|console\.|innerHTML|document\.cookie|WebSocket/.test(c), 'nothing sent or stored'); assert(/type: 'image\/jpeg'/.test(c) && /'image\/jpeg', q\)/.test(c), 'a plain JPEG comes out');
    assert(/createImageBitmap\(file, \{ imageOrientation: 'from-image' \}/.test(c), 'turned the right way up'); assert(/x\.fillStyle = '#fff'/.test(c), 'transparent areas become white, not black');
  });
  await test('the Vault screen prepares a file before sending it, shows plain progress and plain failures, never sends a file that is still over the limit, and leaves PDFs and small photos as they are', () => {
    const w = code('src/portal/WalletPanel.tsx'); const at = w.indexOf('const upload = async'); const u = w.slice(at, w.indexOf('const view = async', at));
    assert(/prepPhoto\(file, st\.maxBytes\)/.test(u) && /Preparing your file/.test(u), 'prepared first, with progress'); assert(/if \(!prep\.ok\) \{ setBusy\(false\); setMsg\(prep\.message\); return; \}/.test(u), 'a failure is shown and nothing is sent');
    assert(/if \(send\.size > st\.maxBytes\)/.test(u) && /toBase64\(send\)/.test(u) && !/toBase64\(file\)/.test(u), 'only the prepared file is sent, and only if it fits'); assert(u.indexOf('prepPhoto') < u.indexOf("call('walletUpload'"), 'prepared before the upload call');
    assert(/photos are shrunk automatically/.test(w) && /Everything is encrypted/.test(w), 'the on-screen note matches'); assert(/No firearm serial numbers, gun photos or storage details/.test(w), 'the never-upload notice is kept');
  });
  await test('encryption is unchanged and still happens before storage: AES-256-GCM on the server with the owner and document bound in, file type from the bytes, only PDF/PNG/JPG/WEBP, same limits', () => {
    const s = read('src/Lib/server/wallet.ts'); const g = read('src/Lib/server/gcm.ts'); assert(/aes-256-gcm/.test(g) && /setAAD\(aad\)/.test(g) && (s.match(/gcm(Seal|Open)\(k, Buffer\.from\(`\$\{owner\}:\$\{docId\}`\)/g) || []).length === 2, 'AES-GCM (shared routine) with owner and document bound in, both ways'); const up = s.indexOf('.upload(path, encryptBytes(bytes, userId, docId)'); assert(up > 0, 'encrypted bytes are what is stored');
    assert(/export const MAX_BYTES = 3 \* 1024 \* 1024/.test(s) && /export const MAX_DOCS = 20/.test(s), 'limits unchanged'); assert(/const mime = sniffMime\(bytes\)/.test(s) && /Only PDF, PNG, JPG or WEBP files can be stored/.test(s), 'type decided from the bytes');
    assert(/application\/octet-stream/.test(s), 'stored as opaque encrypted data');
  });
  console.log(`\nVault photos: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
