/**
 * TrainWithFIFS - training badges from the member's own range journal (offline)
 * Earned only when the numbers reach the target; nothing new stored; words as well as colour; shown inside the Range Journal.
 */
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const B = require(path.join(ROOT, 'src/portal/badges.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
const earned = (i) => B.badgesFor(i).filter((b) => b.earned).map((b) => b.id);

(async () => {
  await test('the badges are the seven agreed ones, each with a unique id and a plain title', () => {
    eq(B.BADGE_RULES.map((r) => r.id), ['first-day', 'five-days', 'ten-days', 'twenty-five-days', 'thousand-rounds', 'first-goal', 'three-goals']); assert(new Set(B.BADGE_RULES.map((r) => r.title)).size === 7, 'titles');
  });
  await test('a badge is earned exactly when the number reaches its target, and not before', () => {
    eq(earned({ sessions: 0, rounds: 0, goalsDone: 0 }), [], 'nothing at the start');
    eq(earned({ sessions: 1, rounds: 0, goalsDone: 0 }), ['first-day'], 'first day at one');
    eq(earned({ sessions: 4, rounds: 0, goalsDone: 0 }), ['first-day'], 'not five at four');
    eq(earned({ sessions: 5, rounds: 0, goalsDone: 0 }), ['first-day', 'five-days'], 'five at five');
    eq(earned({ sessions: 24, rounds: 999, goalsDone: 2 }), ['first-day', 'five-days', 'ten-days', 'first-goal'], 'rounds and goals at the edge');
    eq(earned({ sessions: 25, rounds: 1000, goalsDone: 3 }), ['first-day', 'five-days', 'ten-days', 'twenty-five-days', 'thousand-rounds', 'first-goal', 'three-goals'], 'everything');
  });
  await test('progress is shown in words and never goes past the target; odd numbers are treated as zero', () => {
    const b = B.badgesFor({ sessions: 3, rounds: 0, goalsDone: 0 }).find((x) => x.id === 'five-days'); eq(B.progressText(b), '3 of 5 range days'); eq(B.progressText(B.badgesFor({ sessions: 9, rounds: 0, goalsDone: 0 }).find((x) => x.id === 'five-days')), 'Earned');
    eq(B.badgesFor({ sessions: 'x', rounds: NaN, goalsDone: -4 }).every((x) => !x.earned && x.have === 0), true, 'odd input is zero'); eq(B.progressText(B.badgesFor({ sessions: 0, rounds: 1500, goalsDone: 0 }).find((x) => x.id === 'thousand-rounds')), 'Earned');
  });
  await test('the badge list is shown inside the Range Journal with words for earned and locked, and it stores and sends nothing', () => {
    const p = read('src/portal/RangeJournalPanel.tsx'); assert(/badgesFor\(\{ sessions: t\.sessions, rounds: t\.rounds, goalsDone: goals\.filter\(\(g\) => !!g\.doneAt\)\.length \}\)/.test(p), 'counts come from the journal already loaded');
    assert(/progressText\(b\)/.test(p) && /Nothing is shared\./.test(p), 'words shown'); const code = read('src/portal/badges.ts').replace(/\/\/.*$/gm, ''); assert(!/localStorage|sessionStorage|fetch\(|console\.|innerHTML/.test(code), 'nothing stored or sent');
    assert(!/opacity/.test(read('src/portal/rangeJournal.css').split('rj-badge-list')[1] || ''), 'no faded locked badges (contrast)');
  });
  console.log(`\nTraining badges: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
