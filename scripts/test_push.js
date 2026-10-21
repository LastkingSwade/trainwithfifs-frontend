/**
 * TrainWithFIFS - push notifications (offline; the push service and the database are fakes)
 * Only real push services; nothing private in a message; nothing sent at night or without keys; a person reaches only their own devices; staff-only broadcast;
 * dead devices are cleaned up; the service worker shows every push and opens only this site.
 */
const fs = require('fs'); const path = require('path'); const vm = require('vm'); const Module = require('module');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const sent = []; let nextError = null; const wp = { setVapidDetails: () => {}, sendNotification: async (sub, body, opts) => { if (nextError) { const e = nextError(sub); if (e) throw e; } sent.push({ sub, body: JSON.parse(body), opts }); } };
let currentDb = null; const origLoad = Module._load; Module._load = function (request, parent, ...rest) { if (request === 'web-push') return { default: wp, ...wp }; if (/(^|\/)supabase-admin$/.test(request)) return { getPrivilegedClient: () => currentDb }; return origLoad.call(this, request, parent, ...rest); };
const L = require(path.join(ROOT, 'src/Lib/server/push-logic.ts')); const P = require(path.join(ROOT, 'src/Lib/server/push.ts')); const C = require(path.join(ROOT, 'src/pwa/pushClient.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { sent.length = 0; nextError = null; try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
const P256 = 'B' + 'A'.repeat(86), AUTH = 'a'.repeat(22), EP = (n = 1) => `https://fcm.googleapis.com/fcm/send/dev${n}`;
const goodSub = (n = 1) => ({ endpoint: EP(n), keys: { p256dh: P256, auth: AUTH } });
const NOON = new Date('2026-10-22T16:00:00Z'); // 12:00 Eastern
const KEYS = () => { process.env.VAPID_PUBLIC_KEY = 'pub'; process.env.VAPID_PRIVATE_KEY = 'priv'; process.env.VAPID_SUBJECT = 'mailto:info@trainwithfifs.com'; };
const NOKEYS = () => { delete process.env.VAPID_PUBLIC_KEY; delete process.env.VAPID_PRIVATE_KEY; delete process.env.VAPID_SUBJECT; };

// A small fake of the Supabase builder: select/eq/in/order/upsert/delete/maybeSingle
function fakeDb(t, o = {}) {
  const db = { t, missing: !!o.missing };
  db.from = (table) => { const f = []; let op = 'select', vals = null, ord = null, conflict = null;
    const q = { select: () => q, eq: (c, v) => { f.push((r) => String(r[c]) === String(v)); return q; }, in: (c, vs) => { f.push((r) => vs.includes(r[c])); return q; }, order: (c, d) => { ord = [c, d && d.ascending === false]; return q; }, delete: () => { op = 'delete'; return q; }, upsert: (v, opts) => { op = 'upsert'; vals = v; conflict = opts && opts.onConflict; return q; }, update: (v) => { op = 'update'; vals = v; return q; } };
    const run = async () => { if (db.missing && table === 'push_subscriptions') return { data: null, error: { code: '42P01', message: 'relation "push_subscriptions" does not exist' } };
      const rows = db.t[table] || (db.t[table] = []);
      if (op === 'upsert') { const i = rows.findIndex((r) => r[conflict] === vals[conflict]); const row = { created_at: new Date(Date.now() + rows.length).toISOString(), ...vals }; if (i >= 0) rows[i] = { ...rows[i], ...vals }; else rows.push(row); return { data: null, error: null }; }
      if (op === 'update') { rows.filter((r) => f.every((g) => g(r))).forEach((r) => Object.assign(r, vals)); return { data: null, error: null }; }
      if (op === 'delete') { const keep = rows.filter((r) => !f.every((g) => g(r))); db.t[table] = keep; return { data: null, error: null }; }
      let hit = rows.filter((r) => f.every((g) => g(r))).map((r) => ({ ...r })); if (ord) hit.sort((a, b) => (a[ord[0]] < b[ord[0]] ? 1 : -1) * (ord[1] ? 1 : -1)); return { data: hit, error: null }; };
    q.maybeSingle = async () => { const r = await run(); return r.error ? r : { data: (r.data || [])[0] || null, error: null }; }; q.then = (res, rej) => run().then(res, rej); return q; };
  return db;
}

(async () => {
  console.log('\n[Rules]');
  await test('only real push services over https are accepted (so the server can never be pointed at an internal address)', () => {
    for (const ok of [EP(), 'https://updates.push.services.mozilla.com/wpush/v2/abc', 'https://web.push.apple.com/Qx', 'https://wns2-par02p.notify.windows.com/w/?token=x']) assert(L.isAllowedEndpoint(ok), ok);
    for (const bad of ['http://fcm.googleapis.com/x', 'https://evil.example/x', 'https://fcm.googleapis.com.evil.example/x', 'https://localhost/x', 'https://127.0.0.1/x', 'https://169.254.169.254/latest', 'https://user:pw@fcm.googleapis.com/x', 'https://fcm.googleapis.com:8443/x', '', null, 5, 'x'.repeat(700)]) assert(!L.isAllowedEndpoint(bad), String(bad).slice(0, 40));
  });
  await test('a subscription needs a real endpoint and two well-formed keys; nothing else is kept', () => {
    eq(L.cleanSubscription({ ...goodSub(), extra: 'x', name: 'Sam' }), { endpoint: EP(), p256dh: P256, auth: AUTH });
    for (const bad of [null, {}, { endpoint: EP() }, { endpoint: EP(), keys: {} }, { endpoint: EP(), keys: { p256dh: 'short', auth: AUTH } }, { endpoint: EP(), keys: { p256dh: P256, auth: 'x' } }, { endpoint: EP(), keys: { p256dh: P256 + '!', auth: AUTH } }, { endpoint: 'https://evil.example', keys: { p256dh: P256, auth: AUTH } }, 'text']) assert(L.cleanSubscription(bad) === null, JSON.stringify(bad));
  });
  await test('nothing is sent before 8am or from 8pm Eastern (summer and winter)', () => {
    const at = (iso) => L.withinSendWindow(new Date(iso));
    assert(!at('2026-07-15T11:59:00Z') && at('2026-07-15T12:00:00Z') && at('2026-07-15T23:59:00Z') && !at('2026-07-16T00:00:00Z'), 'summer (EDT)'); assert(!at('2026-12-15T12:59:00Z') && at('2026-12-15T13:00:00Z') && at('2026-12-16T00:59:00Z') && !at('2026-12-16T01:00:00Z'), 'winter (EST)');
    assert(L.withinSendWindow(new Date('2026-07-15T13:15:00Z')) && L.withinSendWindow(new Date('2026-12-15T13:15:00Z')), 'the daily 13:15 UTC job is inside the window all year');
  });
  await test('class days are found in the free text on a student record, in every format the site writes, and impossible dates are ignored', () => {
    eq(L.classDaysFrom('Day 1: Sat, Oct 31, 2026 (FIFS Classroom) | Day 2: Sun, Nov 1, 2026 (Cindy\'s)'), ['2026-10-31', '2026-11-01']); eq(L.classDaysFrom('10/31/2026', '2026-11-02'), ['2026-10-31', '2026-11-02']);
    eq(L.classDaysFrom('Saturday, October 31st, 2026'), ['2026-10-31']); eq(L.classDaysFrom('To Be Scheduled', null, undefined, ''), []); eq(L.classDaysFrom('Feb 30, 2026', '13/40/2026', '2026-02-30', 'Oct 31, 1999'), []);
    eq(L.addDays('2026-10-31', 1), '2026-11-01'); eq(L.addDays('2026-12-31', 1), '2027-01-01');
  });
  await test('messages are short, generic and tap into the right portal: no names, amounts, permit numbers or firearm details', () => {
    const all = [L.classReminder('tomorrow', false), L.classReminder('tomorrow', true), L.classReminder('today', false), L.permitReminder(120), L.permitReminder(90), L.permitReminder(30), L.permitReminder(7), L.paymentReceived()];
    for (const m of all) { assert(m.title.length <= 40 && m.body.length <= 140, 'short: ' + m.title); assert(!/\$|@|\d{4}|serial|firearm|gun|pistol|handgun|permit number/i.test(m.title + ' ' + m.body.replace(/about \d+ days/, '')), 'private detail in: ' + m.body); assert(/^\/\?open=(student|client)$/.test(m.url), m.url); assert(L.TOPICS.includes(m.topic), m.topic); }
    eq(all.filter((m) => /Student Portal/.test(m.body)).length, 4); assert(/Client Portal/.test(L.permitReminder(30).body) && L.permitReminder(7).body.includes('week'), 'permit text');
    assert(/pay the rest/.test(L.classReminder('tomorrow', true).body) && !/pay the rest/.test(L.classReminder('tomorrow', false).body), 'balance nudge only when owing'); eq(L.classReminder('tomorrow', false).tag, 'class-tomorrow');
  });
  await test('a note from Coach Kai is cleaned: control characters, links and angle brackets removed, 140 characters at most', () => {
    eq(L.cleanBroadcast('  Weather   update\n\tSat class ON   '), 'Weather update Sat class ON'); eq(L.cleanBroadcast('Details https://evil.example/x and www.evil.example now'), 'Details and now'); eq(L.cleanBroadcast('<b>hi</b>'), 'bhi/b');
    eq(L.cleanBroadcast('x'.repeat(300)).length, 140); eq(L.cleanBroadcast(null), ''); eq(L.cleanBroadcast('‮evil​'), 'evil'); eq(L.broadcastMessage('Hi', 'client').url, '/?open=client'); eq(L.broadcastMessage('Hi', 'all').url, '/?open=student');
  });

  console.log('\n[Server]');
  const newDb = (extra = {}) => fakeDb({ push_subscriptions: [], students: [{ user_id: 'u-stu', student_id: 'FIFS-1', assigned_date: null, class_date: null, preferred_dates: null }, { user_id: 'u-stu2', student_id: 'FIFS-2' }], clients: [{ user_id: 'u-cli', expiration_date: '2027-01-01' }], invoices: [], ...extra });
  await test('without the keys: nothing is offered and nothing is sent; with them it is', async () => {
    NOKEYS(); assert(!P.pushConfigured() && P.vapidPublicKey() === '', 'not configured'); const db = newDb(); eq((await P.saveSubscription(db, 'u-stu', 'student', goodSub())).status, 409);
    eq((await P.sendToUsers(db, ['u-stu'], L.paymentReceived(), NOON)).skipped, 'not-configured'); eq(sent.length, 0); KEYS(); assert(P.pushConfigured() && P.vapidPublicKey() === 'pub', 'configured'); process.env.VAPID_SUBJECT = 'notamailto'; assert(!P.pushConfigured(), 'a bad contact address switches it off'); KEYS();
  });
  await test('a person saves, finds and removes only their own devices; roles come from the verified login; staff are neither', async () => {
    KEYS(); const db = newDb(); eq(await P.roleOf(db, 'u-stu'), 'student'); eq(await P.roleOf(db, 'u-cli'), 'client'); eq(await P.roleOf(db, 'someone-else'), null);
    assert((await P.saveSubscription(db, 'u-stu', 'student', goodSub(1))).ok, 'saved'); assert(await P.isSubscribed(db, 'u-stu', EP(1)), 'found'); assert(!(await P.isSubscribed(db, 'u-cli', EP(1))), 'not found for someone else');
    assert(!(await P.saveSubscription(db, 'u-stu', 'student', { endpoint: 'https://evil.example/x', keys: goodSub().keys })).ok, 'bad endpoint refused'); eq((await P.saveSubscription(db, 'u-stu', 'student', null)).status, 400);
    assert((await P.removeSubscription(db, 'u-cli', EP(1))).ok && await P.isSubscribed(db, 'u-stu', EP(1)), 'someone else cannot remove it'); assert((await P.removeSubscription(db, 'u-stu', EP(1))).ok && !(await P.isSubscribed(db, 'u-stu', EP(1))), 'removed'); eq((await P.removeSubscription(db, 'u-stu', '')).status, 400);
  });
  await test('saving the same device again does not duplicate it; one person keeps at most 10 devices (the oldest go)', async () => {
    KEYS(); const db = newDb(); await P.saveSubscription(db, 'u-stu', 'student', goodSub(1)); await P.saveSubscription(db, 'u-stu', 'student', goodSub(1)); eq(db.t.push_subscriptions.length, 1);
    for (let i = 2; i <= 13; i++) await P.saveSubscription(db, 'u-stu', 'student', goodSub(i)); eq(db.t.push_subscriptions.length, 10, 'capped'); assert(!db.t.push_subscriptions.some((r) => r.endpoint === EP(1)), 'the oldest was dropped');
  });
  await test('a missing table is reported as "not set up", never as a crash', async () => { KEYS(); const db = newDb({}); db.missing = true; eq((await P.saveSubscription(db, 'u-stu', 'student', goodSub())).status, 409); eq(await P.isSubscribed(db, 'u-stu', EP()), false); eq((await P.sendToUsers(db, ['u-stu'], L.paymentReceived(), NOON)).sent, 0); eq(await P.countSubscribers(db, 'all'), 0); });
  await test('sending: only that person\'s devices, only devices that want the topic; quiet hours and empty lists send nothing; the push carries title, text, tag and the portal address', async () => {
    KEYS(); const db = newDb(); await P.saveSubscription(db, 'u-stu', 'student', goodSub(1)); await P.saveSubscription(db, 'u-cli', 'client', goodSub(2)); db.t.push_subscriptions.push({ user_id: 'u-stu2', role: 'student', endpoint: EP(3), p256dh: P256, auth: AUTH, topics: ['news'] });
    const r = await P.sendToUsers(db, ['u-stu', 'u-stu2'], L.paymentReceived(), NOON); eq(r.sent, 1, 'u-stu2 did not choose the payment topic, u-cli was not asked'); eq(sent[0].sub.endpoint, EP(1)); eq(Object.keys(sent[0].body).sort(), ['body', 'tag', 'title', 'url']); assert(sent[0].opts.TTL <= 12 * 3600, 'expires the same day');
    sent.length = 0; eq((await P.sendToUsers(db, ['u-stu'], L.paymentReceived(), new Date('2026-10-22T05:00:00Z'))).skipped, 'quiet-hours'); eq(sent.length, 0); eq((await P.sendToUsers(db, [], L.paymentReceived(), NOON)).skipped, 'none');
  });
  await test('a device the push service says is gone is deleted; other errors are counted and the device is kept; one failure never stops the rest', async () => {
    KEYS(); const db = newDb(); for (let i = 1; i <= 3; i++) await P.saveSubscription(db, 'u-stu', 'student', goodSub(i)); nextError = (sub) => (sub.endpoint === EP(1) ? Object.assign(new Error('gone'), { statusCode: 410 }) : sub.endpoint === EP(2) ? Object.assign(new Error('busy'), { statusCode: 503 }) : null);
    const r = await P.sendToUsers(db, ['u-stu'], L.paymentReceived(), NOON); eq([r.sent, r.failed, r.removed], [1, 1, 1]); eq(db.t.push_subscriptions.map((x) => x.endpoint).sort(), [EP(2), EP(3)]);
  });
  await test('class reminders: students whose class is tomorrow or today (days read from their record) get one each; an owing balance adds the nudge; others and quiet hours get nothing', async () => {
    KEYS(); const db = newDb({ invoices: [{ student_id: 'FIFS-1', status: 'DEPOSIT_PAID', balance_due: '175.00' }] }); db.t.students[0].preferred_dates = 'Day 1: Fri, Oct 23, 2026 (FIFS Classroom) | Day 2: Sat, Oct 24, 2026'; db.t.students[1].assigned_date = 'Thu, Oct 22, 2026';
    await P.saveSubscription(db, 'u-stu', 'student', goodSub(1)); await P.saveSubscription(db, 'u-stu2', 'student', goodSub(2)); await P.saveSubscription(db, 'u-cli', 'client', goodSub(3));
    const r = await P.sendClassReminders(db, NOON); eq([r.tomorrow.sent, r.today.sent], [1, 1]); const a = sent.find((s) => s.sub.endpoint === EP(1)).body, b = sent.find((s) => s.sub.endpoint === EP(2)).body; eq(a.tag, 'class-tomorrow'); assert(/pay the rest/.test(a.body), 'balance nudge'); eq(b.tag, 'class-today'); assert(!sent.some((s) => s.sub.endpoint === EP(3)), 'clients get no class reminders');
    sent.length = 0; const q = await P.sendClassReminders(db, new Date('2026-10-22T05:00:00Z')); eq([q.tomorrow.sent, q.today.sent, sent.length], [0, 0, 0], 'quiet hours'); db.t.students[0].preferred_dates = 'To Be Scheduled'; db.t.students[1].assigned_date = null; eq((await P.sendClassReminders(db, NOON)).tomorrow.sent, 0);
  });
  await test('payment received: the student of that invoice is told (nothing about the amount); an unknown invoice or a student without notifications sends nothing', async () => {
    KEYS(); const db = newDb({ invoices: [{ invoice_number: 'INV-1', student_id: 'FIFS-1' }] }); await P.saveSubscription(db, 'u-stu', 'student', goodSub(1)); const r = await P.notifyPaymentReceived(db, 'INV-1'); eq(r.sent, 1); assert(!/\d/.test(sent[0].body.body), 'no numbers'); eq(sent[0].body.tag, 'payment');
    sent.length = 0; eq(await P.notifyPaymentReceived(db, 'INV-NOPE'), null); eq((await P.notifyPaymentReceived(newDb({ invoices: [{ invoice_number: 'INV-1', student_id: 'FIFS-2' }] }), 'INV-1')).sent, 0);
  });
  await test('permit renewal pushes go to the clients due today who turned notifications on, one message per milestone', async () => {
    KEYS(); const db = newDb(); await P.saveSubscription(db, 'u-cli', 'client', goodSub(2)); const r = await P.sendPermitPushes(db, new Map([[90, ['u-cli']], [30, ['u-nobody']]]), NOON); eq(r.sent, 1); eq(sent[0].body.tag, 'permit-90'); eq(sent[0].body.url, '/?open=client');
  });
  await test('subscriber counts for the Admin Hub are numbers only (no names)', async () => { KEYS(); const db = newDb(); await P.saveSubscription(db, 'u-stu', 'student', goodSub(1)); await P.saveSubscription(db, 'u-cli', 'client', goodSub(2)); eq([await P.countSubscribers(db, 'student'), await P.countSubscribers(db, 'client'), await P.countSubscribers(db, 'all')], [1, 1, 2]); eq((await P.userIdsFor(db, 'client')), ['u-cli']); });

  console.log('\n[Website actions and jobs]');
  await test('the actions: sign-in required, roles from the database, staff-only broadcast with rate limit, quiet hours and cleaned text; the payment hook never blocks or fails the answer', () => {
    const r = read('src/app/api/fifs/route.ts'); const i = r.indexOf("case 'pushStatus'"), j = r.indexOf("case 'studentOnlineClass'"); const blk = r.slice(i, j);
    assert(i > 0 && j > i, 'actions exist'); assert(/getAuthenticatedUser\(req\)/.test(blk) && (blk.match(/getAuthenticatedUser/g) || []).length === 3, 'every action checks the login'); assert(/roleOf\(sb, String\(user\.id\)\)/.test(blk) && /Reminders are for student, client and staff accounts/.test(blk), 'roles from the database');
    assert(/isStaffOrAdmin\(user\)/.test(blk) && /allowPublicSubmit\(req, 'pushadmin', 6\)/.test(blk) && /allowPublicSubmit\(req, 'push', 30\)/.test(blk), 'staff-only + limits'); assert(/cleanBroadcast\(payload\.text\)/.test(blk) && /withinSendWindow\(new Date\(\)\)/.test(blk) && /8am and 8pm Eastern/.test(blk), 'cleaned text + quiet hours');
    assert(!/payload\.(userId|user_id|email)/.test(blk), 'nobody names another person in a request'); assert(/payload\.subscription/.test(blk) && /payload\.endpoint/.test(blk), 'only the device itself is passed');
    assert(/if \(r\.ok && action === 'adminRecordPayment' && pushConfigured\(\)\)[\s\S]{0,300}after\(job\)/.test(r) && /notifyPaymentReceived\(sb, String\(payload\.invoiceNumber/.test(r), 'payment hook runs after the answer');
  });
  await test('the daily jobs need the secret, run once a day inside the window, and the permit job still sends its emails first', () => {
    const c = read('src/app/api/cron/push-reminders/route.ts'), pr = read('src/app/api/cron/permit-reminders/route.ts'), v = JSON.parse(read('vercel.json'));
    assert(/timingSafeEqual/.test(c) && /secret\.length >= 16/.test(c) && /sendClassReminders\(getPrivilegedClient\(\)\)/.test(c), 'authorised'); assert(v.crons.some((x) => x.path === '/api/cron/push-reminders' && x.schedule === '15 13 * * *') && v.crons.length === 3, 'scheduled at 13:15 UTC');
    assert(/sendOnlineEmail[\s\S]*sendPermitPushes\(supabase, pushIds\)/.test(pr) && /try \{ pushed = /.test(pr) && /\.select\('email, full_name, expiration_date, user_id'\)/.test(pr), 'push after email, and a push problem cannot undo the emails');
  });
  await test('the table holds no personal details, is server-only, and cascades with the account', () => {
    const q = read('scripts/sql/20261022_push_subscriptions.sql'); assert(/create table if not exists public\.push_subscriptions/.test(q) && /references auth\.users\(id\) on delete cascade/.test(q), 'table + cascade'); assert(!/\b(email|phone|name|address|amount|permit|serial)\b\s+(text|numeric|date)/i.test(q.replace(/--.*$/gm, '')), 'no personal columns');
    assert(/enable row level security/.test(q) && /revoke all on public\.push_subscriptions from anon, authenticated/.test(q) && /grant select, insert, update, delete on public\.push_subscriptions to service_role/.test(q), 'server only'); assert(/endpoint like 'https:\/\/%'/.test(q) && /unique/.test(q), 'https only, one row per device');
  });

  console.log('\n[Admin Hub alerts]');
  await test('every alert the site posts to Discord becomes a short generic notification; the alert\'s own text (names, emails, invoices) is never used', () => {
    const real = [['🚨 New Guest Checkout: Sam Student', 'bookings'], ['🎯 New Course Enrollment Checkout: Sam Student', 'bookings'], ['🎯 Authorized Seat Booking: Sam Student', 'bookings'], ['⚠️ Checkout Session Abandoned / Expired', 'bookings'],
      ['💳 Reservation Deposit Received', 'payments'], ['💳 Payment in Full Received', 'payments'], ['💳 Remaining Balance Paid', 'payments'], ['💵 Payment recorded in person', 'payments'], ['↩️ In-person payment voided', 'payments'],
      ['💬 Live Chat Inquiry: Sam Student', 'messages'], ['📩 New Contact Form Inquiry: Sam Student', 'messages'], ['📥 New Free Guide Lead: Sam Student', 'messages'],
      ['🧭 Multi-state application progress', 'progress'], ['🎉 Multi-state application: all steps done', 'progress'], ['🎯 Quiz reward applied to a booking', 'progress'], ['🌐 Someone is visiting trainwithfifs.com', 'visits'],
      ['⚠️ Balance paid twice: refund needed', 'problems'], ['⚠️ Balance payment amount mismatch', 'problems'], ['⚠️ Payment amount mismatch', 'problems'], ['⚠️ Payment needs manual reconciliation', 'problems'], ['⚠️ Balance payment needs manual reconciliation', 'problems'], ['⚠️ Checkout blocked: invoice could not be recorded', 'problems'], ['⚠️ Checkout blocked: guest checkout record unavailable', 'problems']];
    for (const [title, topic] of real) { const a = L.classifyAlert(title); eq(a.topic, topic, title); assert(L.STAFF_TOPICS.includes(a.topic), 'a real topic'); assert(a.title.length <= 40 && a.body.length <= 120, 'short: ' + title); assert(!/Sam|Student|@|INV-|\$|\d{3}/.test(a.title + a.body), 'private text leaked for ' + title + ' -> ' + a.title + ' | ' + a.body); assert(a.urgent === (topic === 'problems'), 'only problems are urgent: ' + title); }
    eq(L.classifyAlert('something new').topic, 'progress'); eq(L.classifyAlert(null).title, '🔔 FIFS alert'); eq(L.alertPayload(L.classifyAlert('💳 Payment in Full Received')).url, '/');
    const src = read('src/Lib/server/discord.ts'), rt = read('src/app/api/fifs/route.ts'); for (const body of [src, rt]) assert(!/classifyAlert\([^)]*(description|fields)/.test(body), 'only the title is ever looked at');
  });
  await test('topics: staff get six, people four; a device keeps only real topics for its kind of account', () => {
    eq(L.STAFF_TOPICS.length, 6); eq(L.defaultTopicsFor('staff').length, 6); eq(L.defaultTopicsFor('student').length, 4); eq(L.cleanTopics('staff', ['visits', 'payments', 'class', 'junk', 'visits', 5]), ['visits', 'payments']); eq(L.cleanTopics('student', ['class', 'visits', 'news']), ['class', 'news']); eq(L.cleanTopics('staff', 'x'), []); eq(L.cleanTopics('staff', null), []);
    for (const t of L.STAFF_TOPICS) assert(L.STAFF_TOPIC_LABELS[t] && /^\p{Extended_Pictographic}/u.test(L.STAFF_TOPIC_LABELS[t]), 'label with emoji for ' + t);
  });
  await test('a staff device registers as staff with every alert on; turning it on again keeps the choices; choices can be changed for that device only', async () => {
    KEYS(); const db = newDb(); assert((await P.saveSubscription(db, 'u-staff', 'staff', goodSub(1))).ok, 'saved'); eq(db.t.push_subscriptions[0].role, 'staff'); eq(db.t.push_subscriptions[0].topics, ['bookings', 'payments', 'messages', 'progress', 'visits', 'problems']);
    const r = await P.setDeviceTopics(db, 'u-staff', EP(1), ['payments', 'problems', 'class', 'x']); assert(r.ok && JSON.stringify(r.topics) === JSON.stringify(['payments', 'problems']), JSON.stringify(r)); eq(db.t.push_subscriptions[0].topics, ['payments', 'problems']);
    await P.saveSubscription(db, 'u-staff', 'staff', goodSub(1)); eq(db.t.push_subscriptions[0].topics, ['payments', 'problems'], 'turning it on again keeps the choices'); eq((await P.setDeviceTopics(db, 'someone-else', EP(1), ['visits'])).status, 404); eq(db.t.push_subscriptions[0].topics, ['payments', 'problems'], 'another person cannot change it');
    eq((await P.deviceTopics(db, 'u-staff', EP(1))).role, 'staff'); eq(await P.deviceTopics(db, 'u-staff', 'https://fcm.googleapis.com/none'), null);
  });
  await test('staff alerts go only to staff devices that chose that topic; problems are sent at any hour, everything else only 8am to 8pm Eastern; broadcasts to students and clients never reach staff', async () => {
    KEYS(); const db = newDb(); await P.saveSubscription(db, 'u-staff', 'staff', goodSub(1)); await P.saveSubscription(db, 'u-staff2', 'staff', goodSub(2)); await P.setDeviceTopics(db, 'u-staff2', EP(2), ['problems']); await P.saveSubscription(db, 'u-stu', 'student', goodSub(3));
    const NIGHT = new Date('2026-10-22T05:00:00Z');
    let r = await P.notifyStaff(db, '💳 Payment in Full Received', NOON); eq(r.sent, 1, 'only the staff device that chose payments'); eq(sent[0].sub.endpoint, EP(1)); eq(sent[0].body.title, '💳 Payment in full received'); sent.length = 0;
    r = await P.notifyStaff(db, '🌐 Someone is visiting trainwithfifs.com', NIGHT); eq([r.sent, r.skipped], [0, 'quiet-hours']);
    r = await P.notifyStaff(db, '⚠️ Payment amount mismatch', NIGHT); eq(r.sent, 2, 'a problem goes to both staff devices at night'); assert(!sent.some((x) => x.sub.endpoint === EP(3)), 'the student never gets staff alerts'); sent.length = 0;
    await P.notifyStaff(newDb(), '💳 Deposit received', NOON); eq(sent.length, 0, 'no staff devices, nothing to send'); const ids = await P.userIdsFor(db, 'all'); assert(!ids.includes('u-staff') && ids.includes('u-stu'), 'notes to everyone skip staff');
  });
  await test('the site\'s alerts also reach staff phones: both Discord senders call it first, it does nothing without the keys, runs after the answer and never throws', async () => {
    const d = read('src/Lib/server/discord.ts'), rt = read('src/app/api/fifs/route.ts'); assert(/import \{ notifyStaffOfAlert \} from '\.\/push'/.test(d) && /notifyStaffOfAlert\(title\);[^\n]*\n  const webhookUrl/.test(d), 'Discord helper'); assert(/\) \{\n  notifyStaffOfAlert\(title\);[^\n]*\n  try \{\n    if \(!DISCORD_WEBHOOK_URL/.test(rt), 'route helper');
    NOKEYS(); currentDb = newDb(); await P.saveSubscription(currentDb, 'u-staff', 'staff', goodSub(1)); P.notifyStaffOfAlert('💳 Payment in Full Received'); await new Promise((r) => setTimeout(r, 30)); eq(sent.length, 0, 'no keys, nothing sent');
    KEYS(); currentDb = newDb(); currentDb.t.push_subscriptions.push({ user_id: 'u-staff', role: 'staff', endpoint: EP(1), p256dh: P256, auth: AUTH, topics: ['payments'] }); P.notifyStaffOfAlert('💳 Payment in Full Received'); await new Promise((r) => setTimeout(r, 30)); const inHours = L.withinSendWindow(new Date()); eq(sent.length, inHours ? 1 : 0, 'sent only inside the window right now');
    currentDb = null; P.notifyStaffOfAlert('⚠️ Payment amount mismatch'); await new Promise((r) => setTimeout(r, 30)); // a broken database must not throw
    const B = require(path.join(ROOT, 'src/Lib/server/background.ts')); let ran = 0; B.runAfterResponse(async () => { ran++; }); B.runAfterResponse(async () => { throw new Error('boom'); }); B.runAfterResponse(() => { throw new Error('sync boom'); }); await new Promise((r) => setTimeout(r, 30)); eq(ran, 1);
  });
  await test('Admin Hub: the device section turns alerts on and off, lists the six kinds with emoji and 44px-high rows, saves each choice, and says you do not need to stay signed in; the new SQL only widens the role rule', () => {
    const adm = read('src/portal/AdminPushPanel.tsx'), rt = read('src/app/api/fifs/route.ts'), q = read('scripts/sql/20261023_push_staff_role.sql'), q0 = read('scripts/sql/20261022_push_subscriptions.sql');
    assert(/Alert this device/.test(adm) && /Turn off alerts on this device/.test(adm) && /pushSetTopics/.test(adm) && /STAFF_TOPICS\.map/.test(adm) && /minHeight: 44/.test(adm) && /do not need to stay signed in/.test(adm), 'device section');
    assert(/isStaffOrAdmin\(user\) \? 'staff' : await roleOf/.test(rt) && /action === 'pushSetTopics'/.test(rt), 'staff role comes from the verified login'); assert(/drop constraint if exists push_subscriptions_role_check/.test(q) && /role in \('student', 'client', 'staff'\)/.test(q) && !/drop table|delete from|truncate/i.test(q), 'only widens one rule'); assert(/constraint push_subscriptions_role_check check \(role in \('student', 'client', 'staff'\)\)/.test(q0), 'new installs get it too');
  });

  console.log('\n[Phone and computer side]');
  await test('which devices can get reminders, which state the card shows, and the key conversion', () => {
    eq(C.supportFor({ serviceWorker: true, pushManager: true, notification: true, ios: false, standalone: false }), 'ok'); eq(C.supportFor({ serviceWorker: true, pushManager: true, notification: true, ios: true, standalone: false }), 'needs-install'); eq(C.supportFor({ serviceWorker: true, pushManager: true, notification: true, ios: true, standalone: true }), 'ok'); eq(C.supportFor({ serviceWorker: true, pushManager: false, notification: true, ios: false, standalone: false }), 'unsupported');
    const s = (o) => C.cardState({ enabled: true, support: 'ok', permission: 'default', subscribed: false, ...o }); eq(s({ enabled: false }), 'hidden'); eq(s({ support: 'unsupported' }), 'hidden'); eq(s({ support: 'needs-install' }), 'needs-install'); eq(s({ permission: 'denied' }), 'blocked'); eq(s({}), 'off'); eq(s({ permission: 'granted', subscribed: true }), 'on'); eq(s({ permission: 'granted', subscribed: false }), 'off'); eq(s({ permission: 'default', subscribed: true }), 'off');
    const b = C.keyBytes('AQID_w'); eq(Array.from(b), [1, 2, 3, 255]);
  });
  await test('the card asks only when tapped (no automatic prompt), uses textContent only, has 44px+ buttons, and the Admin panel can only send what the server accepts', () => {
    const card = read('src/portal/pushCard.ts'), cl = read('src/pwa/pushClient.ts'), css = read('src/pwa/pwa.css'), adm = read('src/portal/AdminPushPanel.tsx'), pg = read('src/app/page.tsx');
    assert(!/innerHTML/.test(card) && /addEventListener\('click'/.test(card), 'safe DOM, on tap'); assert(/requestPermission\(\)/.test(cl) && !/requestPermission/.test(card.replace(/\/\/.*$/gm, '')) && !/requestPermission\(\)[\s\S]*installPushCard/.test(cl), 'permission only inside turnOn, which the tap calls');
    assert(/\.pn-btn \{ min-height: 48px/.test(css) && /userVisibleOnly: true/.test(cl), 'touch size + visible notifications only'); assert(/id="push-student"/.test(pg) && /id="push-client"/.test(pg) && /installPushCard\(\);/.test(pg) && /id="btn-admin-push-hdr"/.test(pg), 'wired into the page');
    assert(/maxLength=\{140\}/.test(adm) && /callFifsBackend/.test(adm) && /disabled=\{busy \|\| !text\.trim\(\) \|\| !st\?\.configured \|\| !!st\?\.quietHours\}/.test(adm), 'admin panel limits'); assert(!/localStorage|sessionStorage/.test(card + cl), 'nothing stored in the page');
  });
  await test('the service worker shows a notification for every push (even a damaged one), and a tap opens only an address on this site', async () => {
    const SWSRC = read('public/sw.js'); const shown = [], opened = [], listeners = {}; const origin = 'https://trainwithfifs.com';
    const self = { location: { origin }, addEventListener: (t, f) => { listeners[t] = f; }, registration: { showNotification: async (title, o) => { shown.push({ title, ...o }); } }, clients: { matchAll: async () => clientsList, openWindow: async (u) => { opened.push(u); }, claim: async () => {} }, skipWaiting: () => {} }; let clientsList = [];
    vm.runInNewContext(SWSRC, { self, caches: { open: async () => ({ add: async () => {} }), keys: async () => [], match: async () => undefined }, fetch: async () => ({}), Request: class {}, Response: class {}, URL, setTimeout, clearTimeout, Promise, Error, JSON, String, Array, Object }, { filename: 'sw.js' });
    const push = async (data) => { let p; await listeners.push({ data: data === undefined ? null : { json: () => { if (data instanceof Error) throw data; return data; } }, waitUntil: (x) => { p = x; } }); await p; };
    await push({ title: '📅 Your class is tomorrow', body: 'Open your Student Portal.', url: '/?open=student', tag: 'class-tomorrow' }); eq(shown[0].title, '📅 Your class is tomorrow'); eq(shown[0].data.url, '/?open=student'); eq(shown[0].tag, 'class-tomorrow'); assert(shown[0].icon === '/icons/icon-192.png', 'icon');
    await push(new Error('not json')); await push(undefined); await push({ title: 'x'.repeat(500), body: 'y'.repeat(900), url: 'https://evil.example/phish', tag: 't'.repeat(99) }); eq(shown.length, 4, 'every push is shown'); eq(shown[1].title, 'Train With FIFS'); eq(shown[3].title.length, 80); eq(shown[3].body.length, 200); eq(shown[3].data.url, '/', 'a foreign address becomes the home page'); eq(shown[3].tag.length, 40);
    const click = async (url, list) => { clientsList = list; opened.length = 0; let p; const n = { close: () => {}, data: { url } }; await listeners.notificationclick({ notification: n, waitUntil: (x) => { p = x; } }); await p; };
    const nav = []; await click('/?open=client', [{ url: origin + '/', focus: async () => {}, navigate: async (u) => { nav.push(u); } }]); eq(nav, ['/?open=client']); eq(opened, [], 'brought the existing window forward'); await click('/?open=student', []); eq(opened, ['/?open=student']); await click('https://evil.example/x', []); eq(opened, ['/']); await click('//evil.example/x', []); eq(opened, ['/'], 'a protocol-relative address is also refused');
  });
  Module._load = origLoad;
  console.log(`\nPush: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
