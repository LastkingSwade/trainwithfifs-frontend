/**
 * TrainWithFIFS - Daily Range Quiz (offline; the database is an in-memory fake)
 * One question a day, answers never sent before answering, the reward is capped (30% Base, 20% VIP), only clients can play, a reward is held by one booking at a time
 * and comes back when that booking is never paid.
 */
const fs = require('fs'); const path = require('path'); const Module = require('module');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..');
const alerts = []; const origLoad = Module._load;
Module._load = function (request, parent, ...rest) { if (/\/discord$/.test(request)) return { sendDiscordAlert: async (title, desc, fields) => { alerts.push({ title, desc, fields }); return true; } }; return origLoad.call(this, request, parent, ...rest); };
const bank = require(path.join(ROOT, 'src/Lib/server/quiz-bank.ts'));
const eng = require(path.join(ROOT, 'src/Lib/server/quiz-engine.ts'));
const prog = require(path.join(ROOT, 'src/Lib/server/quiz-progress.ts'));
const pricing = require(path.join(ROOT, 'src/Lib/pricing.ts'));
const card = require(path.join(ROOT, 'src/portal/quizCard.ts'));
Module._load = origLoad;
let passed = 0, failed = 0;
const test = async (name, fn) => { try { await fn(); passed++; console.log(`  ✓ PASS: ${name}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${name}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);

function makeDb(opts = {}) {
  const t = { clients: opts.noClient ? [] : [{ user_id: 'u1' }, { user_id: 'u2' }], quiz_progress: [], invoices: [] };
  const db = { t, missing: !!opts.missing, raceOnce: null };
  db.from = (table) => {
    const q = { op: 'select', f: [], vals: null, ret: false, opts: null };
    q.select = () => { q.ret = true; return q; };
    q.eq = (c, v) => { q.f.push((r) => String(r[c]) === String(v)); return q; };
    q.is = (c, v) => { q.f.push((r) => (v === null ? r[c] == null : r[c] === v)); return q; };
    q.update = (v) => { q.op = 'update'; q.vals = v; return q; }; q.insert = (v) => { q.op = 'insert'; q.vals = v; return q; }; q.upsert = (v) => { q.op = 'upsert'; q.vals = v; return q; };
    const run = async () => {
      if (table === 'quiz_progress' && db.missing) return { data: null, error: { code: '42P01', message: 'relation "quiz_progress" does not exist' } };
      const rows = db.t[table] || (db.t[table] = []);
      if (q.op === 'insert') { rows.push({ ...q.vals }); return { data: q.ret ? [{ ...q.vals }] : null, error: null }; }
      if (q.op === 'upsert') { const i = rows.findIndex((r) => r.user_id === q.vals.user_id); if (i >= 0) rows[i] = { ...rows[i], ...q.vals }; else rows.push({ ...q.vals }); return { data: null, error: null }; }
      if (q.op === 'update') { if (db.raceOnce) { const h = db.raceOnce; db.raceOnce = null; h(db.t); } const hit = rows.filter((r) => q.f.every((f) => f(r))); hit.forEach((r) => Object.assign(r, q.vals)); return { data: q.ret ? hit.map((r) => ({ ...r })) : null, error: null }; }
      return { data: rows.filter((r) => q.f.every((f) => f(r))).map((r) => ({ ...r })), error: null };
    };
    q.maybeSingle = async () => { const r = await run(); return r.error ? r : { data: (r.data || [])[0] || null, error: null }; }; q.then = (res, rej) => run().then(res, rej); return q;
  };
  return db;
}
const day = (n) => new Date(Date.UTC(2026, 9, 20 + n, 16, 0, 0)); // noon-ish Eastern
// answer the question the player is shown today, correctly or not
async function play(db, uid, now, wantCorrect) {
  const v = await prog.quizToday(db, uid, now); assert(v.ok && v.today.state === 'question', 'no question today: ' + JSON.stringify(v));
  const t = eng.todaysQuestion(eng.cleanProgress(db.t.quiz_progress.find((r) => r.user_id === uid)), uid, eng.todayET(now));
  const shownCorrect = t.order.indexOf(t.question.answer); const pick = wantCorrect ? shownCorrect : (shownCorrect + 1) % 4;
  return prog.quizAnswer(db, uid, v.today.id, pick, now);
}

(async () => {
  console.log('\n--- Question bank ---');
  await test('45 questions, 15 per level for levels 1 to 3, unique ids', () => {
    eq(bank.QUESTIONS.length, 45); eq(bank.LEVELS_WITH_QUESTIONS, 3); eq(new Set(bank.QUESTIONS.map((q) => q.id)).size, 45);
    for (const l of [1, 2, 3]) eq(bank.QUESTIONS.filter((q) => q.level === l).length, 15, 'level ' + l);
    eq(bank.TOTAL_POINTS, 825);
  });
  await test('every question has four distinct options, a valid answer and an explanation', () => {
    for (const q of bank.QUESTIONS) { eq(q.options.length, 4, q.id); eq(new Set(q.options).size, 4, q.id + ' options'); assert(q.answer >= 0 && q.answer <= 3, q.id + ' answer'); assert(q.q.length > 10 && q.why.length > 10, q.id + ' text'); }
  });
  await test('the questions avoid law and legal claims (laws change; a wrong answer could hurt)', () => {
    for (const q of bank.QUESTIONS) assert(!/\b(legal|illegal|law|statute|permit|felony|misdemeanor)\b/i.test(q.q + ' ' + q.options.join(' ')), q.id + ' mentions law');
  });
  await test('the browser code never imports the bank, and the bank holds no browser code', () => {
    const files = ['src/portal/quizCard.ts', 'src/app/page.tsx']; for (const f of files) assert(!/quiz-bank|quiz-engine|quiz-progress/.test(fs.readFileSync(path.join(ROOT, f), 'utf8')), f + ' imports server quiz code');
  });

  console.log('\n--- Engine ---');
  await test('the same person sees the same question all day; a different person gets a different order', () => {
    const a = eng.todaysQuestion(eng.emptyProgress(), 'u1', '2026-10-20'), b = eng.todaysQuestion(eng.emptyProgress(), 'u1', '2026-10-20');
    eq(a, b); const orders = new Set(['u1', 'u2', 'u3', 'u4', 'u5', 'u6'].map((u) => JSON.stringify(eng.todaysQuestion(eng.emptyProgress(), u, '2026-10-20').order))); assert(orders.size > 1, 'all options in the same order for everyone');
  });
  await test('the option order is a permutation of 0 to 3', () => { const t = eng.todaysQuestion(eng.emptyProgress(), 'u1', '2026-10-20'); eq([...t.order].sort(), [0, 1, 2, 3]); });
  await test('grading uses the option the person was shown, not the printed position', () => {
    const t = eng.todaysQuestion(eng.emptyProgress(), 'u1', '2026-10-20'); const right = t.order.indexOf(t.question.answer);
    const g = eng.gradeAnswer(eng.emptyProgress(), 'u1', t.question.id, right, '2026-10-20'); assert(g.ok && g.correct && g.points === 1, 'correct answer not credited');
    const w = eng.gradeAnswer(eng.emptyProgress(), 'u1', t.question.id, (right + 1) % 4, '2026-10-20'); assert(w.ok && !w.correct && w.points === 0, 'wrong answer credited');
  });
  await test('a second answer the same day, the wrong question id and a bad option are refused', () => {
    const t = eng.todaysQuestion(eng.emptyProgress(), 'u1', '2026-10-20'); const g = eng.gradeAnswer(eng.emptyProgress(), 'u1', t.question.id, 0, '2026-10-20');
    eq(eng.gradeAnswer(g.progress, 'u1', t.question.id, 0, '2026-10-20'), { ok: false, reason: 'already' });
    eq(eng.gradeAnswer(eng.emptyProgress(), 'u1', 'L3-15', 0, '2026-10-20').reason, 'not-today');
    for (const bad of [4, -1, 1.5, '1', null, undefined, NaN]) eq(eng.gradeAnswer(eng.emptyProgress(), 'u1', t.question.id, bad, '2026-10-20').reason, 'bad-option', String(bad));
  });
  await test('questions never repeat in a cycle, and level 2 starts after 15 answers (worth 2 points each)', () => {
    let p = eng.emptyProgress(); const seen = new Set();
    for (let i = 0; i < 15; i++) { const t = eng.todaysQuestion(p, 'u1', 'd' + i); eq(t.level, 1); assert(!seen.has(t.question.id), 'repeat'); seen.add(t.question.id); const g = eng.gradeAnswer(p, 'u1', t.question.id, t.order.indexOf(t.question.answer), 'd' + i); p = g.progress; }
    eq(p.points, 15); const t2 = eng.todaysQuestion(p, 'u1', 'x'); eq(t2.level, 2); eq(t2.number, 1);
    const g2 = eng.gradeAnswer(p, 'u1', t2.question.id, t2.order.indexOf(t2.question.answer), 'x'); eq(g2.points, 2);
  });
  await test('after the last written question the quiz says it is done instead of failing', () => {
    let p = eng.emptyProgress(); for (let i = 0; i < 45; i++) { const t = eng.todaysQuestion(p, 'u1', 'd' + i); assert(t.state === 'question', 'ran out early at ' + i); p = eng.gradeAnswer(p, 'u1', t.question.id, 0, 'd' + i).progress; }
    eq(eng.todaysQuestion(p, 'u1', 'later').state, 'done'); eq(eng.gradeAnswer(p, 'u1', 'L1-01', 0, 'later').reason, 'done');
  });
  await test('the day rolls over at midnight Eastern', () => { eq(eng.todayET(new Date('2026-10-21T03:30:00Z')), '2026-10-20'); eq(eng.todayET(new Date('2026-10-21T04:30:00Z')), '2026-10-21'); });

  console.log('\n--- Reward maths ---');
  await test('caps: 30% Base and 20% VIP at full marks, nothing at zero, never over', () => {
    eq(eng.rewardFraction(825, false), 0.3); eq(eng.rewardFraction(825, true), 0.2); eq(eng.rewardFraction(0, false), 0); eq(eng.rewardFraction(99999, false), 0.3); eq(eng.rewardFraction(-5, true), 0);
  });
  await test('90 points is about 3.27% Base and the dollars come off the $149.99 / $209.99 renewal prices', () => {
    eq(eng.rewardFraction(90, false), 0.0327); eq(eng.dollarsOff(eng.RENEWAL_BASE, 0.0327), 4.9); eq(eng.dollarsOff(eng.RENEWAL_VIP, eng.rewardFraction(90, true)), 4.58);
    eq(eng.dollarsOff(eng.RENEWAL_BASE, 0.3), 45); eq(eng.dollarsOff(eng.RENEWAL_VIP, 0.2), 42);
  });
  await test('server pricing: the reward comes off tuition only; range fee untouched; tax and deposit follow', () => {
    const none = pricing.calculatePricingBreakdown('Maryland CCW Renewal - Base Track ($149.99)', 1, false, 'in_person', 0), r = pricing.calculatePricingBreakdown('Maryland CCW Renewal - Base Track ($149.99)', 1, false, 'in_person', 0.1);
    eq(r.rangeFee, none.rangeFee); eq(r.rewardDiscount, 15); assert(r.grandTotal < none.grandTotal, 'no discount'); eq(r.discountedTuition, Math.round((none.discountedTuition - 15) * 100) / 100);
    eq(r.mdTax, Math.round((r.discountedTuition + r.rangeFee) * 0.06 * 100) / 100);
  });
  await test('server pricing ignores a reward for groups and anything over 30% or not a number', () => {
    const course = 'Maryland CCW Renewal - Base Track ($149.99)'; const base2 = pricing.calculatePricingBreakdown(course, 2, false, 'in_person', 0);
    eq(pricing.calculatePricingBreakdown(course, 2, false, 'in_person', 0.2).grandTotal, base2.grandTotal);
    const base1 = pricing.calculatePricingBreakdown(course, 1, false, 'in_person', 0);
    for (const bad of [0.31, 1, -0.2, NaN, Infinity, '0.2']) eq(pricing.calculatePricingBreakdown(course, 1, false, 'in_person', bad).grandTotal, base1.grandTotal, String(bad));
  });
  await test('the screen price mirror matches the server price to the cent', () => {
    for (const [course, vip] of [['Maryland CCW Renewal - Base Track ($149.99)', false], ['Maryland CCW Renewal - VIP Track ($209.99)', true]]) for (const f of [0.01, 0.0327, 0.1, 0.2, 0.3]) {
      if (vip && f > 0.2) continue; const s = pricing.calculatePricingBreakdown(course, 1, false, 'in_person', f); const tuition = s.baseTuitionPerPerson;
      const sub = Math.round(tuition * 100) + Math.round(s.rangeFee * 100); const m = card.applyReward({ subtotal: sub / 100, discountedTuition: tuition, mdTax: 0, total: 0 }, tuition, vip, f);
      eq(m.grandTotal, s.grandTotal, `total ${course} ${f}`); eq(m.depositDueNow, s.depositDue || s.depositDueNow, `deposit ${f}`); eq(m.rewardDiscount, s.rewardDiscount, `reward ${f}`);
    }
  });

  console.log('\n--- Database layer ---');
  const now = day(0);
  await test('only clients can play: students and strangers are refused', async () => {
    const db = makeDb({ noClient: true }); const v = await prog.quizToday(db, 'u1', now); assert(!v.ok && v.status === 403, 'student allowed');
    assert(!(await prog.quizAnswer(db, 'u1', 'L1-01', 0, now)).ok, 'student answered'); eq((await prog.quizToday(db, '', now)).status, 401);
  });
  await test('quizToday never sends the answer, the explanation or the real option index', async () => {
    const db = makeDb(); const v = await prog.quizToday(db, 'u1', now); const s = JSON.stringify(v);
    assert(v.ok && v.today.options.length === 4, 'no question'); assert(!/"why"|"answer"|correctText|order/.test(s), 'leaks: ' + s);
    const q = bank.QUESTIONS.find((x) => x.id === v.today.id); assert(!s.includes(q.why), 'explanation sent');
  });
  await test('answer a question: points saved, the reply holds the right answer and the reward', async () => {
    const db = makeDb(); const r = await play(db, 'u1', now, true); assert(r.ok && r.correct && r.pointsEarned === 1 && r.points === 1, JSON.stringify(r)); assert(r.correctText && r.why, 'no teaching text');
    eq(db.t.quiz_progress.length, 1); eq(db.t.quiz_progress[0].points, 1);
  });
  await test('one answer a day: a second try the same day is refused and nothing changes; tomorrow works', async () => {
    const db = makeDb(); await play(db, 'u1', now, true); const v = await prog.quizToday(db, 'u1', now); eq(v.today, { state: 'answered', correct: true });
    const again = await prog.quizAnswer(db, 'u1', 'L1-01', 0, now); assert(!again.ok && again.status === 409, 'second answer accepted'); eq(db.t.quiz_progress[0].points, 1);
    const r2 = await play(db, 'u1', day(1), false); assert(r2.ok && !r2.correct, 'next day'); eq(db.t.quiz_progress[0].points, 1); eq(db.t.quiz_progress[0].answered.length, 2);
  });
  await test('two devices answering at once: only the first answer is kept', async () => {
    const db = makeDb(); await play(db, 'u1', now, false); // row exists now
    const v = await prog.quizToday(db, 'u1', day(1)); const t = eng.todaysQuestion(eng.cleanProgress(db.t.quiz_progress[0]), 'u1', eng.todayET(day(1))); const right = t.order.indexOf(t.question.answer);
    db.raceOnce = (tables) => { tables.quiz_progress[0].last_answered_on = eng.todayET(day(1)); }; // the other device wins between our read and write
    const r = await prog.quizAnswer(db, 'u1', v.today.id, right, day(1)); assert(!r.ok && r.status === 409, 'race not caught: ' + JSON.stringify(r)); eq(db.t.quiz_progress[0].points, 0);
  });
  await test('a missing table is reported as "not set up", not an error screen', async () => {
    const db = makeDb({ missing: true }); const v = await prog.quizToday(db, 'u1', now); assert(v.ok && v.setupNeeded === true, JSON.stringify(v));
    assert(!(await prog.quizAnswer(db, 'u1', 'L1-01', 0, now)).ok, 'answered without a table'); eq(await prog.reserveReward(db, 'u1', 'INV-1', false, now), null);
  });
  await test('people cannot read or change each other: u2 starts empty even after u1 plays', async () => {
    const db = makeDb(); await play(db, 'u1', now, true); const v = await prog.quizToday(db, 'u2', now); eq(v.points, 0); eq(db.t.quiz_progress.length, 1);
  });

  console.log('\n--- Reserving the reward at checkout ---');
  const earn = async (db, n) => { for (let i = 0; i < n; i++) await play(db, 'u1', day(i), true); }; // each correct level-1 answer is 1 point
  await test('no points means no reward', async () => { const db = makeDb(); eq(await prog.reserveReward(db, 'u1', 'INV-1', false, now), null); await play(db, 'u1', now, false); eq(await prog.reserveReward(db, 'u1', 'INV-1', false, day(1)), null); });
  await test('points turn into a fraction (Base 30% cap, VIP 20% cap) and a Discord note is sent', async () => {
    const db = makeDb(); await earn(db, 3); const f = await prog.reserveReward(db, 'u1', 'INV-A', false, day(5)); eq(f, eng.rewardFraction(3, false)); eq(db.t.quiz_progress[0].redeemed_invoice, 'INV-A'); assert(alerts.length > 0, 'no discord note');
    const db2 = makeDb(); await earn(db2, 3); eq(await prog.reserveReward(db2, 'u1', 'INV-V', true, day(5)), eng.rewardFraction(3, true));
  });
  await test('one booking holds the reward at a time (the second booking gets nothing)', async () => {
    const db = makeDb(); await earn(db, 2); db.t.invoices.push({ invoice_number: 'INV-A', status: 'PENDING' });
    assert((await prog.reserveReward(db, 'u1', 'INV-A', false, day(5))) > 0, 'first'); eq(await prog.reserveReward(db, 'u1', 'INV-B', false, day(5)), null);
  });
  await test('releaseReward gives it back only for the same invoice', async () => {
    const db = makeDb(); await earn(db, 2); await prog.reserveReward(db, 'u1', 'INV-A', false, day(5));
    await prog.releaseReward(db, 'u1', 'INV-OTHER'); eq(db.t.quiz_progress[0].redeemed_invoice, 'INV-A'); await prog.releaseReward(db, 'u1', 'INV-A'); eq(db.t.quiz_progress[0].redeemed_invoice, null); assert((await prog.reserveReward(db, 'u1', 'INV-C', false, day(5))) > 0, 'cannot reuse');
  });
  const reserved = async (status, ageMin, withInvoice = true) => {
    const db = makeDb(); await earn(db, 2); const at = day(5); await prog.reserveReward(db, 'u1', 'INV-A', false, at); if (withInvoice) db.t.invoices.push({ invoice_number: 'INV-A', status });
    const v = await prog.quizToday(db, 'u1', new Date(at.getTime() + ageMin * 60000)); return { db, v };
  };
  await test('when the booking is paid (full or deposit) the cycle starts over: points 0, a new level 1, same-day question blocked', async () => {
    for (const s of ['PAID', 'DEPOSIT_PAID']) { const { db, v } = await reserved(s, 30); eq(v.points, 0, s); eq(db.t.quiz_progress[0].redeemed_invoice, null, s); eq(db.t.quiz_progress[0].answered, [], s); }
  });
  await test('a booking still PENDING keeps the reward reserved', async () => { const { v, db } = await reserved('PENDING', 60 * 5); eq(v.reward.reserved, true); eq(db.t.quiz_progress[0].redeemed_invoice, 'INV-A'); assert(v.points === 2, 'points lost'); });
  await test('an ABANDONED booking, or one that never appeared after 15 minutes, gives the reward back', async () => {
    const a = await reserved('ABANDONED', 1); eq(a.v.reward.reserved, false); eq(a.v.points, 2);
    const m = await reserved('', 20, false); eq(m.v.reward.reserved, false); eq(m.v.points, 2);
  });
  await test('a booking that has not appeared yet but is under 15 minutes old is left alone', async () => { const { v } = await reserved('', 5, false); eq(v.reward.reserved, true); });

  console.log('\n--- Wiring ---');
  await test('checkout reserves the reward only for a single-attendee renewal, releases it on failure, and records it in the Stripe metadata', () => {
    const src = fs.readFileSync(path.join(ROOT, 'src/Lib/server/booking-checkout.ts'), 'utf8');
    assert(/reserveReward\(/.test(src) && /releaseReward\(/.test(src) && /quizReward/.test(src), 'checkout is not wired'); assert(/attendees === 1 && !podMember && courseKeyFor\(courseSelection\) === 'renewal'\)\s*\{\s*const f = await reserveReward/.test(src), 'not limited to a single renewal seat');
  });
  await test('the quiz routes require a signed-in user and the answer route is throttled', () => {
    const src = fs.readFileSync(path.join(ROOT, 'src/app/api/fifs/route.ts'), 'utf8'); const i = src.indexOf("case 'quizToday'"), j = src.indexOf("case 'quizAnswer'");
    assert(i > 0 && j > 0, 'routes missing'); assert(/getAuthenticatedUser/.test(src.slice(i, j + 900)), 'no login check'); assert(/allowPublicSubmit\(req, ?'quiz'/.test(src.slice(j, j + 900)), 'no throttle');
  });

  console.log(`\nQuiz: ${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
})();
