/**
 * TrainWithFIFS - staff devices (admin alerts on) are not counted in telemetry and do not trigger visitor alerts (offline)
 * The marker lives only in this browser. It is set when alerts are on and removed when they are off. Blocked storage never breaks a page.
 */
const fs = require('fs'); const path = require('path');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
const S = require(path.join(ROOT, 'src/analytics/staffDevice.ts'));
const mem = () => { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; }, _m: m }; };

(async () => {
  console.log('\n[The marker]');
  await test('a device is a staff device only after alerts are turned on there, and not after they are turned off', () => {
    const st = mem(); eq(S.isStaffDevice(st), false, 'a new device is not staff');
    S.setStaffDevice(true, st); eq(S.isStaffDevice(st), true, 'alerts on');
    S.setStaffDevice(false, st); eq(S.isStaffDevice(st), false, 'alerts off');
  });
  await test('blocked or missing storage never throws and counts the visit as normal', () => {
    const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); }, removeItem: () => { throw new Error('blocked'); } };
    eq(S.isStaffDevice(broken), false); S.setStaffDevice(true, broken); S.setStaffDevice(false, null); eq(S.isStaffDevice(null), false);
  });
  await test('only the exact marker counts, so no other value can switch a device off the count by accident', () => {
    const st = mem(); st._m[S.STAFF_DEVICE_KEY] = 'yes'; eq(S.isStaffDevice(st), false); st._m[S.STAFF_DEVICE_KEY] = '1'; eq(S.isStaffDevice(st), true);
  });

  console.log('\n[Visits and alerts]');
  await test('the visit beacon sends nothing from a staff device, before anything else happens', () => {
    const b = read('src/analytics/VisitBeacon.tsx');
    const send = b.indexOf('sendBeacon'); const guard = b.indexOf('if (isStaffDevice()) return;');
    assert(guard > 0 && send > guard, 'the check comes before the send');
    assert(/import \{ isStaffDevice \} from '\.\/staffDevice'/.test(b), 'imported');
  });
  await test('turning alerts on or off in the Admin Hub sets or clears the marker, and opening the panel fixes it for devices that already had alerts on', () => {
    const p = read('src/portal/AdminPushPanel.tsx');
    assert(/if \(r\.ok\) setStaffDevice\(true\)/.test(p), 'on'); assert(/if \(r\.ok\) setStaffDevice\(false\)/.test(p), 'off');
    assert(/setStaffDevice\(d\.state === 'on'\)/.test(p), 'follows the real device state when the panel opens');
  });
  await test('the marker is never sent to the server or written by anything else', () => {
    const h = read('src/analytics/staffDevice.ts'); assert(!/fetch\(|sendBeacon|callFifsBackend/.test(h), 'local only');
    const srv = read('src/app/api/visit/route.ts'); assert(!/fifs_staff|localStorage/i.test(srv), 'the server never reads the local marker');
  });

  await test('the server skips a visit from a staff device: it checks the push address against the staff devices, before anything is stored or alerted', () => {
    const srv = read('src/app/api/visit/route.ts');
    const check = srv.indexOf('isStaffEndpoint(getPrivilegedClient(), body && body.e)'); const store = srv.indexOf('buildRow({');
    assert(check > 0 && store > check, 'the staff check comes before the row is built, so nothing is stored or alerted');
    const p = read('src/Lib/server/push.ts');
    assert(/export async function isStaffEndpoint/.test(p) && /\.eq\('role', 'staff'\)/.test(p) && /isAllowedEndpoint\(endpoint\)/.test(p), 'the check is staff-only and only for real push addresses');
  });
  await test('the visit beacon sends this device\'s push address (only the address, never the keys)', () => {
    const b = read('src/analytics/VisitBeacon.tsx');
    assert(/e: endpoint/.test(b) || /, e\)|e: e|\be\b.*sub\.endpoint/.test(b) && /sub\.endpoint/.test(b), 'address sent');
    assert(!/keys|p256dh|auth:/.test(b), 'no keys');
  });
  console.log(`\nStaff device: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
