import { createHash } from 'crypto';
import { LEVELS_WITH_QUESTIONS, PER_LEVEL, QUESTIONS, TOTAL_POINTS, type Question } from './quiz-bank';

// The rules of the Daily Range Quiz (pure; no database). One question per client per Eastern-time day, never repeated within a cycle, fifteen per level, each
// level a little harder. A correct answer earns its level number in points. The renewal-class reward is the cap (30% of tuition on the Base track, 20% on VIP)
// times points / 825 (the points for a perfect run through all ten planned levels). The reward comes off TUITION only, never the range fee or tax.
export const CAP = { base: 0.3, vip: 0.2 } as const;
export const RENEWAL_BASE = 149.99, RENEWAL_VIP = 209.99;
export interface Entry { q: string; ok: boolean; on: string }
export interface Progress { answered: Entry[]; points: number; lastOn: string | null; redeemedInvoice: string | null; redeemedFraction: number | null }
export const emptyProgress = (): Progress => ({ answered: [], points: 0, lastOn: null, redeemedInvoice: null, redeemedFraction: null });
const BY_ID = new Map(QUESTIONS.map((q) => [q.id, q] as const));
export const questionById = (id: string): Question | undefined => BY_ID.get(id);

export const todayET = (now: Date = new Date()): string => now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
/** A stable "random" order for one person, so the same question is shown all day and a different person gets a different order. */
function seeded(seed: string): () => number {
  let h = createHash('sha256').update(seed).digest(); let i = 0;
  return () => { if (i + 4 > h.length) { h = createHash('sha256').update(h).digest(); i = 0; } const v = h.readUInt32BE(i); i += 4; return v / 4294967296; };
}
export function shuffled<T>(items: readonly T[], seed: string): T[] { const a = items.slice(); const r = seeded(seed); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

export const levelFor = (answeredCount: number): number => Math.floor(answeredCount / PER_LEVEL) + 1;
export const positionInLevel = (answeredCount: number): number => (answeredCount % PER_LEVEL) + 1;

export type Today =
  | { state: 'question'; level: number; number: number; question: Question; order: number[] }
  | { state: 'answered'; entry: Entry }
  | { state: 'done' }; // every question written so far has been answered this cycle

/** What to show today. `order` maps the shown option positions to the real option indexes (so a position like "B" means something different for each person). */
export function todaysQuestion(p: Progress, userId: string, today: string): Today {
  if (p.lastOn === today && p.answered.length) return { state: 'answered', entry: p.answered[p.answered.length - 1] };
  const level = levelFor(p.answered.length);
  if (level > LEVELS_WITH_QUESTIONS) return { state: 'done' };
  const seen = new Set(p.answered.map((e) => e.q));
  const pool = shuffled(QUESTIONS.filter((q) => q.level === level), `${userId}|level|${level}`).filter((q) => !seen.has(q.id));
  if (!pool.length) return { state: 'done' };
  const question = pool[0]; const order = shuffled([0, 1, 2, 3], `${userId}|${question.id}|options`);
  return { state: 'question', level, number: positionInLevel(p.answered.length), question, order };
}

export type Graded = { ok: true; correct: boolean; points: number; progress: Progress; correctText: string; why: string } | { ok: false; reason: 'not-today' | 'already' | 'bad-option' | 'done' };
/** Grades the one question the person was shown today. Anything else (another question, a second try, an out-of-range choice) is refused. */
export function gradeAnswer(p: Progress, userId: string, qid: string, shownIndex: unknown, today: string): Graded {
  const t = todaysQuestion(p, userId, today);
  if (t.state === 'answered') return { ok: false, reason: 'already' };
  if (t.state === 'done') return { ok: false, reason: 'done' };
  if (t.question.id !== qid) return { ok: false, reason: 'not-today' };
  if (typeof shownIndex !== 'number' || !Number.isInteger(shownIndex) || shownIndex < 0 || shownIndex > 3) return { ok: false, reason: 'bad-option' };
  const chosen = t.order[shownIndex]; const correct = chosen === t.question.answer; const earned = correct ? t.level : 0;
  const progress: Progress = { ...p, answered: [...p.answered, { q: qid, ok: correct, on: today }], points: p.points + earned, lastOn: today };
  return { ok: true, correct, points: earned, progress, correctText: t.question.options[t.question.answer], why: t.question.why };
}

/** 0 to 1: how much of the maximum reward has been earned. */
export const rewardShare = (points: number): number => Math.max(0, Math.min(1, points / TOTAL_POINTS));
/** The fraction taken off tuition (for example 0.036 = 3.6%). Rounded to 0.01% so the checkout and the screen always agree. */
export const rewardFraction = (points: number, isVip: boolean): number => Math.round((isVip ? CAP.vip : CAP.base) * rewardShare(points) * 10000) / 10000;
export const dollarsOff = (tuition: number, fraction: number): number => Math.round(tuition * fraction * 100) / 100;

/** The progress an earned-and-spent reward leaves behind: a fresh cycle (new questions again from level 1), but never a second question on the same day. */
export const afterRedeemed = (p: Progress): Progress => ({ ...emptyProgress(), lastOn: p.lastOn });

export function cleanProgress(row: any): Progress {
  const answered: Entry[] = Array.isArray(row?.answered) ? row.answered.filter((e: any) => e && BY_ID.has(String(e.q)) && /^\d{4}-\d{2}-\d{2}$/.test(String(e.on || ''))).map((e: any) => ({ q: String(e.q), ok: e.ok === true, on: String(e.on) })) : [];
  const points = Math.max(0, Math.min(TOTAL_POINTS, Math.round(Number(row?.points) || 0)));
  const redeemedFraction = row?.redeemed_percent == null ? null : Math.max(0, Math.min(1, Number(row.redeemed_percent) / 100));
  return { answered, points, lastOn: /^\d{4}-\d{2}-\d{2}$/.test(String(row?.last_answered_on || '')) ? String(row.last_answered_on) : null, redeemedInvoice: row?.redeemed_invoice ? String(row.redeemed_invoice) : null, redeemedFraction: Number.isFinite(redeemedFraction as number) ? redeemedFraction : null };
}
