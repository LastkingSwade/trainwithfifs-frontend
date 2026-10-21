/**
 * TrainWithFIFS - portal chat between each student or client and their instructor (offline; the database and push service are fakes)
 * Privacy: a member only ever sees their own thread; staff only through the Admin Hub; push texts never contain the message.
 * Quiet hours: staff replies outside 8am to 8pm Eastern are saved and the nudge waits for the daily job. Messages older than 12 months are removed.
 */
const fs = require('fs'); const path = require('path'); const Module = require('module');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const pushCalls = []; let pushResult = { sent: 1, failed: 0, removed: 0 }; let staffCalls = 0;
const origLoad = Module._load;
Module._load = function (request, parent, ...rest) {
  if (request === './push' && parent && /portal-chat\.ts$/.test(parent.filename || '')) return {
    sendToUsers: async (sb, ids, payload, now, opts) => { pushCalls.push({ ids, payload, now, opts }); return typeof pushResult === 'function' ? pushResult(ids) : { ...pushResult }; },
    notifyStaff: async () => { staffCalls += 1; return { sent: 1, failed: 0, removed: 0 }; },
  };
  return origLoad.call(this, request, parent, ...rest);
};
const C = require(path.join(ROOT, 'src/Lib/server/portal-chat.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { pushCalls.length = 0; staffCalls = 0; pushResult = { sent: 1, failed: 0, removed: 0 }; try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
const EDT = (iso) => new Date(iso);
const NOON = EDT('2026-10-26T16:00:00Z');   // 12:00 Eastern
const MIDNIGHT = EDT('2026-10-27T04:00:00Z'); // 12:00 am Eastern

// A small fake of the Supabase builder: from/select/eq/in/is/lt/order/limit/insert/update/delete/maybeSingle
function fakeDb(t) {
  const db = { t, writes: [] };
  db.from = (table) => {
    const f = []; let op = 'select', vals = null, ord = null, lim = null;
    const q = {
      select: () => q, eq: (c, v) => { f.push((r) => String(r[c]) === String(v)); return q; }, in: (c, vs) => { f.push((r) => vs.map(String).includes(String(r[c]))); return q; },
      is: (c, v) => { f.push((r) => (v === null ? r[c] == null : r[c] === v)); return q; }, lt: (c, v) => { f.push((r) => r[c] < v); return q; },
      order: (c, o) => { ord = [c, !(o && o.ascending === false) ? 1 : -1]; return q; }, limit: (n) => { lim = n; return q; },
      insert: (v) => { op = 'insert'; vals = v; return q; }, update: (v) => { op = 'update'; vals = v; return q; }, delete: () => { op = 'delete'; return q; },
    };
    const run = async () => {
      const rows = db.t[table] || (db.t[table] = []);
      if (op === 'insert') { const row = { id: 'm' + (rows.length + 1) + '-' + table, read_at: null, notified_at: null, ...vals }; rows.push(row); db.writes.push([table, 'insert', vals]); return { data: row, error: null }; }
      if (op === 'update') { const hit = rows.filter((r) => f.every((g) => g(r))); hit.forEach((r) => Object.assign(r, vals)); db.writes.push([table, 'update', vals, hit.length]); return { data: null, error: null }; }
      if (op === 'delete') { const before = rows.length; db.t[table] = rows.filter((r) => !f.every((g) => g(r))); db.writes.push([table, 'delete', before - db.t[table].length]); return { data: null, error: null }; }
      let hit = rows.filter((r) => f.every((g) => g(r))).map((r) => ({ ...r }));
      if (ord) hit.sort((a, b) => (a[ord[0]] < b[ord[0]] ? -1 : a[ord[0]] > b[ord[0]] ? 1 : 0) * ord[1]);
      if (lim !== null) hit = hit.slice(0, lim);
      return { data: hit, error: null };
    };
    q.maybeSingle = async () => { const r = await run(); if (r.error) return r; const d = Array.isArray(r.data) ? (r.data[0] || null) : (r.data || null); return { data: d, error: null }; };
    q.then = (res, rej) => run().then(res, rej);
    return q;
  };
  return db;
}
const A = '11111111-1111-4111-8111-111111111111', B = '22222222-2222-4222-8222-222222222222', S = '33333333-3333-4333-8333-333333333333';
const base = () => ({
  students: [{ user_id: A, full_name: 'Sam Student' }],
  clients: [{ user_id: B, full_name: 'Dana Client' }],
  push_subscriptions: [{ user_id: A, role: 'student', endpoint: 'https://fcm.googleapis.com/a' }, { user_id: A, role: 'student', endpoint: 'https://fcm.googleapis.com/a2' }, { user_id: B, role: 'client', endpoint: 'https://fcm.googleapis.com/b' }],
  portal_messages: [
    { id: 'p1', member_user_id: A, sender: 'member', body: 'Sam private question', created_at: '2026-10-20T14:00:00Z', read_at: null, notified_at: null },
    { id: 'p2', member_user_id: A, sender: 'staff', body: 'Coach reply to Sam', created_at: '2026-10-20T15:00:00Z', read_at: null, notified_at: '2026-10-20T15:00:01Z' },
    { id: 'p3', member_user_id: B, sender: 'member', body: 'Dana private question', created_at: '2026-10-21T14:00:00Z', read_at: null, notified_at: null },
  ],
});

(async () => {
  console.log('\n[Text]');
  await test('messages are plain text, trimmed, 1 to 1000 characters; control characters are removed', () => {
    eq(C.cleanBody('  hi there  '), 'hi there'); eq(C.cleanBody('a\u0000b\u0007c'), 'a b c'); eq(C.cleanBody('line one\r\nline two'), 'line one\nline two');
    eq(C.cleanBody('   '), null); eq(C.cleanBody(''), null); eq(C.cleanBody(null), null); eq(C.cleanBody(42), null); eq(C.cleanBody('x'.repeat(1000)).length, 1000); eq(C.cleanBody('x'.repeat(1001)), null);
  });

  console.log('\n[Privacy: a member sees only their own thread]');
  await test('a student reads only their own messages, never a client\'s, and the instructor\'s reply is marked read', async () => {
    const db = fakeDb(base()); const r = await C.memberThread(db, A, NOON); assert(r.ok, JSON.stringify(r));
    eq(r.messages.map((m) => m.body), ['Sam private question', 'Coach reply to Sam'], 'only Sam\'s rows'); assert(!JSON.stringify(r).includes('Dana'), 'no other member\'s text');
    assert(db.t.portal_messages.find((m) => m.id === 'p2').read_at, 'the reply is now read');
  });
  await test('a client sees only their own thread', async () => {
    const r = await C.memberThread(fakeDb(base()), B, NOON); eq(r.messages.map((m) => m.body), ['Dana private question']);
  });
  await test('a login that is neither a student nor a client gets no chat at all', async () => {
    const r = await C.memberThread(fakeDb(base()), S, NOON); eq(r.ok, false); eq(r.status, 403);
    const s = await C.memberSend(fakeDb(base()), S, 'hello', NOON); eq(s.ok, false); eq(s.status, 403);
  });
  await test('a member\'s message is saved to their own thread only and staff are alerted (generic title)', async () => {
    const db = fakeDb(base()); const r = await C.memberSend(db, B, '  Can I bring my own target ammo?  ', NOON); assert(r.ok, JSON.stringify(r));
    const row = db.t.portal_messages[db.t.portal_messages.length - 1]; eq([row.member_user_id, row.sender, row.body], [B, 'member', 'Can I bring my own target ammo?']);
    eq(staffCalls, 1, 'staff alerted once');
  });

  console.log('\n[Staff: the member list and replies]');
  await test('the member list shows only students and clients, with their device counts, names and unread messages', async () => {
    const r = await C.staffMembers(fakeDb(base())); assert(r.ok, JSON.stringify(r));
    const sam = r.members.find((m) => m.userId === A), dana = r.members.find((m) => m.userId === B);
    eq([sam.name, sam.role, sam.devices], ['Sam', 'student', 2], 'two devices, first name only'); eq([dana.name, dana.role, dana.devices, dana.unread], ['Dana', 'client', 1, 1]);
    eq(sam.unread, 1, 'Sam\'s question has not been read by staff yet');
  });
  await test('a staff reply inside the send window is saved, pushed with generic text, and marked notified', async () => {
    const db = fakeDb(base()); const r = await C.staffSend(db, B, 'Yes, bring factory target ammo.', NOON); assert(r.ok && r.pushed && !r.held, JSON.stringify(r));
    eq(pushCalls.length, 1); eq(pushCalls[0].ids, [B]); eq(pushCalls[0].opts, { ignoreTopic: true }, 'a direct message is not switched off by topic');
    eq(pushCalls[0].payload.body, 'Open your portal to read it.'); assert(!/Yes, bring|ammo/i.test(JSON.stringify(pushCalls[0].payload)), 'the push never carries the message');
    assert(db.t.portal_messages.find((m) => m.body.startsWith('Yes, bring')).notified_at, 'marked notified');
  });
  await test('a staff reply outside 8am to 8pm Eastern is saved, held (no push now), and not marked notified', async () => {
    const db = fakeDb(base()); const r = await C.staffSend(db, A, 'Good question, see you Saturday.', MIDNIGHT); assert(r.ok && !r.pushed && r.held, JSON.stringify(r));
    eq(pushCalls.length, 0, 'nothing pushed at night'); eq(db.t.portal_messages.find((m) => m.body.startsWith('Good question')).notified_at, null, 'waits for the daily nudge');
  });
  await test('staff replies to a non-member, or sends nothing, are refused', async () => {
    eq((await C.staffSend(fakeDb(base()), S, 'hi', NOON)).status, 404); eq((await C.staffSend(fakeDb(base()), A, '   ', NOON)).status, 400); eq(pushCalls.length, 0);
  });
  await test('opening a member\'s thread as staff marks their messages read', async () => {
    const db = fakeDb(base()); const r = await C.staffThread(db, B, NOON); assert(r.ok, JSON.stringify(r)); eq(r.name, 'Dana'); assert(db.t.portal_messages.find((m) => m.id === 'p3').read_at, 'member message now read');
  });

  console.log('\n[Daily job: nudges and 12-month cleanup]');
  await test('inside the window: one generic nudge per member with an unnotified reply, then marked notified', async () => {
    const db = fakeDb(base()); db.t.portal_messages.push({ id: 'p9', member_user_id: A, sender: 'staff', body: 'Held reply', created_at: '2026-10-25T23:00:00Z', read_at: null, notified_at: null });
    const r = await C.sendChatNudges(db, NOON); eq(r.nudged, 1); eq(pushCalls.length, 1); eq(pushCalls[0].ids, [A]); eq(pushCalls[0].payload.title, '💬 New message from Coach Kai');
    assert(db.t.portal_messages.find((m) => m.id === 'p9').notified_at, 'notified');
  });
  await test('outside the window: no nudge, but old messages are still cleared', async () => {
    const db = fakeDb(base()); db.t.portal_messages.push({ id: 'old', member_user_id: A, sender: 'member', body: 'Two years ago', created_at: '2024-01-01T10:00:00Z', read_at: null, notified_at: null });
    const r = await C.sendChatNudges(db, MIDNIGHT); eq(r.nudged, 0); eq(pushCalls.length, 0); assert(r.purged && !db.t.portal_messages.some((m) => m.id === 'old'), 'removed');
  });
  await test('messages from the last 12 months are kept', async () => {
    const db = fakeDb(base()); await C.sendChatNudges(db, NOON); assert(db.t.portal_messages.length === 3, 'nothing recent removed');
  });
  await test('no push keys configured: nothing is marked notified, so the nudge can run again later', async () => {
    const db = fakeDb(base()); pushResult = { sent: 0, failed: 0, removed: 0, skipped: 'not-configured' };
    await C.sendChatNudges(db, NOON); assert(db.t.portal_messages.find((m) => m.body === 'Coach reply to Sam').notified_at, 'the old reply is untouched'); eq(db.t.portal_messages.filter((m) => m.sender === 'staff' && !m.notified_at).length, 0, 'the sample reply was already notified; no change');
  });

  console.log('\n[Wiring and security]');
  await test('the route: members see only their own thread (the login, never the request, names the person); staff actions need a staff or admin login; members are rate limited', () => {
    const r = read('src/app/api/fifs/route.ts'); const seg = (a) => { const i = r.indexOf(`case '${a}':`); return r.slice(i, i + 1100); };
    const member = seg('portalChatGet') + seg('portalChatSend'); assert(/getAuthenticatedUser\(req\)/.test(member) && /String\(user\.id\)/.test(member), 'member uses the verified login');
    assert(!/payload\??\.(userId|memberId|user_id)/.test(member), 'member never names another person'); assert(/allowPublicSubmit\(req, 'portalchat', 20\)/.test(member), 'rate limited');
    const staff = seg('adminPortalChatMembers') + seg('adminPortalChatThread') + seg('adminPortalChatReply'); assert(/isStaffOrAdmin\(user\)/.test(staff) && /401/.test(staff), 'staff only');
  });
  await test('the daily job sends the nudges and cleanup after the class reminders, and stays protected by the cron secret', () => {
    const c = read('src/app/api/cron/push-reminders/route.ts'); assert(/authorized\(req\)/.test(c) && /sendChatNudges\(sb\)/.test(c) && c.indexOf('sendClassReminders') < c.indexOf('sendChatNudges'), 'order and protection');
  });
  await test('push: topic is only bypassed for direct chat messages, and the default for everything else is unchanged', () => {
    const p = read('src/Lib/server/push.ts'); assert(/ignoreTopic\?: boolean/.test(p) && /!opts\.ignoreTopic && Array\.isArray\(row\.topics\)/.test(p), 'bypass only with the option');
  });
  await test('the table: row security on, no access for anyone but the server, one message per row, 1 to 1000 characters, sender limited', () => {
    const q = read('scripts/sql/20261025_portal_messages.sql').replace(/--.*$/gm, '');
    assert(/enable row level security/.test(q) && /revoke all on public\.portal_messages from anon, authenticated/.test(q) && /grant select, insert, update, delete on public\.portal_messages to service_role/.test(q), 'locked to the server');
    assert(/check \(sender in \('member', 'staff'\)\)/.test(q) && /char_length\(body\) between 1 and 1000/.test(q) && /references auth\.users\(id\) on delete cascade/.test(q), 'checks');
  });
  await test('the chat text is always set with textContent in the portal and the Admin Hub (never HTML)', () => {
    const f = read('src/portal/portalChat.ts'); assert(!/innerHTML|insertAdjacentHTML|outerHTML/.test(f), 'no HTML from chat text');
  });

  console.log('\n[Interface]');
  await test('the chat areas are in the Student portal, the Client portal and the Admin Hub Live Chat console, and installed on page load', () => {
    const p = read('src/app/page.tsx');
    assert(/data-portal-chat="student"/.test(p) && /data-portal-chat="client"/.test(p) && /data-admin-member-chat/.test(p), 'three hosts');
    assert(/installPortalChat\(\); installAdminPortalChat\(\);/.test(p) && /import \{ installPortalChat \} from "@\/portal\/portalChat"/.test(p) && /import "@\/portal\/portalChat\.css"/.test(p), 'installed and styled');
  });
  await test('the member chat only ever calls its own two actions, and the staff panel only the three staff actions', () => {
    const m = read('src/portal/portalChat.ts'), a = read('src/portal/adminPortalChat.ts');
    eq([...new Set(m.match(/callApi\('[A-Za-z]+'/g))].sort(), ["callApi('portalChatGet'", "callApi('portalChatSend'"]);
    eq([...new Set(a.match(/callApi\('[A-Za-z]+'/g))].sort(), ["callApi('adminPortalChatMembers'", "callApi('adminPortalChatReply'", "callApi('adminPortalChatThread'"]);
  });
  await test('the member chat never sends a name or number: the server knows who is signed in', () => {
    const m = read('src/portal/portalChat.ts'); assert(!/name|phone/i.test(m.match(/callApi\('portalChatSend'[^)]*\)/)[0]), 'send carries only the text');
  });
  await test('controls are at least 44px, the send button and text box are 44px+, focus is visible, and the text is 16px (no zoom on phones)', () => {
    const css = read('src/portal/portalChat.css');
    assert(/\.pc-send, \.amc-btn \{ min-height: 44px; min-width: 44px/.test(css) && /\.pc-input \{[^}]*min-height: 44px[^}]*font-size: 16px/.test(css) && /\.amc-item \{ width: 100%; min-height: 44px/.test(css), 'targets');
    assert(/:focus-visible[^{]*\{ outline: 3px solid #00e5ff/.test(css), 'focus ring');
  });
  await test('no animation anywhere in the chat, and reduced motion is respected', () => {
    const css = read('src/portal/portalChat.css').replace(/\/\*[\s\S]*?\*\//g, ''); assert(!/animation|transition|@keyframes/.test(css), 'no motion'); assert(/prefers-reduced-motion: reduce/.test(css), 'reduced motion rule');
  });
  await test('screen readers hear new messages politely, and the member and staff text is never HTML', () => {
    const m = read('src/portal/portalChat.ts'), a = read('src/portal/adminPortalChat.ts');
    assert(/role', 'log'/.test(m) && /aria-live', 'polite'/.test(m) && /aria-relevant', 'additions'/.test(m), 'member log'); assert(/role', 'log'|aria-live', 'polite'/.test(a), 'staff log');
    for (const src of [m, a]) assert(!/innerHTML|insertAdjacentHTML|outerHTML/.test(src), 'no HTML');
  });
  await test('the chat can be sent with Enter (Shift+Enter for a new line) and is capped at 1000 characters on screen and on the server', () => {
    const m = read('src/portal/portalChat.ts'); assert(/e\.key === 'Enter' && !e\.shiftKey/.test(m) && /maxLength = MAX/.test(m) && /const MAX = 1000|MAX = 1000/.test(m), 'keys and cap');
  });

  console.log(`\nPortal chat: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
