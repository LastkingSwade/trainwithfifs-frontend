import { sendDiscordAlert } from './discord';
import { LEVELS_WITH_QUESTIONS, PER_LEVEL, QUESTIONS, TOTAL_POINTS } from './quiz-bank';
import { CAP, RENEWAL_BASE, RENEWAL_VIP, afterRedeemed, cleanProgress, dollarsOff, emptyProgress, gradeAnswer, rewardFraction, todayET, todaysQuestion, type Progress } from './quiz-engine';

// Database side of the Daily Range Quiz. Everyone reaches ONLY their own row, found from the verified login. The questions and answers stay on the server: the
// browser is sent the question text and the options in the order shown to that person, and nothing about which one is right until after they have answered.
export type Result<T = {}> = ({ ok: true } & T) | { ok: false; status: number; message: string };
const SETUP = 'The daily quiz is not set up yet. Please check back soon.';
const isMissingTable = (e: any) => !!e && (e.code === '42P01' || /quiz_progress|relation|does not exist|schema cache/i.test(String(e.message || '')));
const RESERVE_GRACE_MS = 15 * 60 * 1000; // a reservation whose invoice is not there yet is left alone this long (the checkout is still being set up)
const COLS = 'answered, points, last_answered_on, redeemed_invoice, redeemed_percent, redeemed_at';

export async function isClientUser(supabase: any, userId: string): Promise<boolean> {
  try { const r = await supabase.from('clients').select('user_id').eq('user_id', userId).maybeSingle(); return !r.error && !!r.data; } catch { return false; }
}

type Loaded = { ok: true; p: Progress; exists: boolean; at: string | null } | { ok: false; status: number; message: string; setupNeeded?: boolean };
async function load(supabase: any, userId: string): Promise<Loaded> {
  try {
    const r = await supabase.from('quiz_progress').select(COLS).eq('user_id', userId).maybeSingle();
    if (r.error) return isMissingTable(r.error) ? { ok: false, status: 409, message: SETUP, setupNeeded: true } : { ok: false, status: 503, message: 'Could not load your quiz right now.' };
    return { ok: true, p: r.data ? cleanProgress(r.data) : emptyProgress(), exists: !!r.data, at: r.data?.redeemed_at ? String(r.data.redeemed_at) : null };
  } catch { return { ok: false, status: 503, message: 'Could not load your quiz right now.' }; }
}
async function save(supabase: any, userId: string, p: Progress, at: string | null): Promise<boolean> {
  try {
    const r = await supabase.from('quiz_progress').upsert({ user_id: userId, answered: p.answered, points: p.points, last_answered_on: p.lastOn, redeemed_invoice: p.redeemedInvoice, redeemed_percent: p.redeemedFraction == null ? null : Math.round(p.redeemedFraction * 10000) / 100, redeemed_at: p.redeemedInvoice ? (at || new Date().toISOString()) : null, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    return !r.error;
  } catch { return false; }
}

/** A reward that was reserved for a booking either became real (the booking was paid: the cycle starts over) or came back (the booking never was paid). */
export async function reconcile(supabase: any, userId: string, p: Progress, at: string | null, now: Date): Promise<{ p: Progress; at: string | null }> {
  if (!p.redeemedInvoice) return { p, at };
  try {
    const inv = await supabase.from('invoices').select('status').eq('invoice_number', p.redeemedInvoice).maybeSingle();
    if (inv.error) return { p, at };
    const status = inv.data ? String(inv.data.status) : '';
    if (status === 'PAID' || status === 'DEPOSIT_PAID') { const n = afterRedeemed(p); if (await save(supabase, userId, n, null)) return { p: n, at: null }; return { p, at }; }
    if (status === 'PENDING') return { p, at };
    if (!inv.data && at && now.getTime() - Date.parse(at) < RESERVE_GRACE_MS) return { p, at };
    const n: Progress = { ...p, redeemedInvoice: null, redeemedFraction: null }; if (await save(supabase, userId, n, null)) return { p: n, at: null };
  } catch { /* leave it as it is */ }
  return { p, at };
}

export interface RewardView { fraction: number; fractionVip: number; percent: number; dollarsBase: number; dollarsVip: number; capBase: number; capVip: number; reserved: boolean }
const rewardView = (p: Progress): RewardView => { const fb = rewardFraction(p.points, false), fv = rewardFraction(p.points, true); return { fraction: fb, fractionVip: fv, percent: Math.round(fb * 10000) / 100, dollarsBase: dollarsOff(RENEWAL_BASE, fb), dollarsVip: dollarsOff(RENEWAL_VIP, fv), capBase: CAP.base * 100, capVip: CAP.vip * 100, reserved: !!p.redeemedInvoice }; };

export interface QuizView {
  setupNeeded: boolean; points: number; level: number; levels: number; perLevel: number; totalPoints: number; reward: RewardView;
  today: { state: 'question'; id: string; level: number; number: number; text: string; options: string[] } | { state: 'answered'; correct: boolean } | { state: 'done' };
}
export async function quizToday(supabase: any, userId: string, now: Date = new Date()): Promise<Result<QuizView>> {
  if (!userId) return { ok: false, status: 401, message: 'Please sign in.' };
  if (!(await isClientUser(supabase, userId))) return { ok: false, status: 403, message: 'The daily quiz is part of the Client Portal.' };
  const l = await load(supabase, userId); if (!l.ok) return l.setupNeeded ? { ok: true, setupNeeded: true, points: 0, level: 1, levels: LEVELS_WITH_QUESTIONS, perLevel: PER_LEVEL, totalPoints: TOTAL_POINTS, reward: rewardView(emptyProgress()), today: { state: 'done' } } : l;
  const { p } = await reconcile(supabase, userId, l.p, l.at, now);
  const t = todaysQuestion(p, userId, todayET(now));
  const today: QuizView['today'] = t.state === 'question' ? { state: 'question', id: t.question.id, level: t.level, number: t.number, text: t.question.q, options: t.order.map((i) => t.question.options[i]) } : t.state === 'answered' ? { state: 'answered', correct: t.entry.ok } : { state: 'done' };
  const level = Math.min(LEVELS_WITH_QUESTIONS, Math.floor(p.answered.length / PER_LEVEL) + 1);
  return { ok: true, setupNeeded: false, points: p.points, level, levels: LEVELS_WITH_QUESTIONS, perLevel: PER_LEVEL, totalPoints: TOTAL_POINTS, reward: rewardView(p), today };
}

export interface AnswerResult { correct: boolean; pointsEarned: number; correctText: string; why: string; points: number; reward: RewardView }
export async function quizAnswer(supabase: any, userId: string, qid: unknown, shownIndex: unknown, now: Date = new Date()): Promise<Result<AnswerResult>> {
  if (!userId) return { ok: false, status: 401, message: 'Please sign in.' };
  if (!(await isClientUser(supabase, userId))) return { ok: false, status: 403, message: 'The daily quiz is part of the Client Portal.' };
  const l = await load(supabase, userId); if (!l.ok) return l;
  const { p, at } = await reconcile(supabase, userId, l.p, l.at, now);
  const g = gradeAnswer(p, userId, String(qid || ''), shownIndex, todayET(now));
  if (!g.ok) return { ok: false, status: g.reason === 'bad-option' ? 400 : 409, message: g.reason === 'already' ? 'You have already answered today. Come back tomorrow for a new question.' : g.reason === 'done' ? 'You have answered every question we have so far. New ones are on the way.' : g.reason === 'bad-option' ? 'Choose one of the four answers.' : 'That is not today\'s question. Reload the page.' };
  // Two taps at once, or two devices: only the first answer for the day is kept.
  try {
    const exists = l.exists;
    const row = { user_id: userId, answered: g.progress.answered, points: g.progress.points, last_answered_on: g.progress.lastOn, redeemed_invoice: g.progress.redeemedInvoice, redeemed_percent: g.progress.redeemedFraction == null ? null : Math.round(g.progress.redeemedFraction * 10000) / 100, redeemed_at: g.progress.redeemedInvoice ? (at || new Date().toISOString()) : null, updated_at: new Date().toISOString() };
    let q = exists ? supabase.from('quiz_progress').update(row).eq('user_id', userId) : null;
    if (q) q = p.lastOn ? q.eq('last_answered_on', p.lastOn) : q.is('last_answered_on', null); // only if nothing was answered since we read it
    const w = exists ? await q.select('user_id') : await supabase.from('quiz_progress').insert(row).select('user_id');
    if (w.error) return { ok: false, status: 503, message: 'Could not save your answer. Please try again.' };
    if (exists && (!Array.isArray(w.data) || w.data.length === 0)) return { ok: false, status: 409, message: 'You have already answered today. Reload the page.' };
  } catch { return { ok: false, status: 503, message: 'Could not save your answer. Please try again.' }; }
  return { ok: true, correct: g.correct, pointsEarned: g.points, correctText: g.correctText, why: g.why, points: g.progress.points, reward: rewardView(g.progress) };
}

// ---- Used by checkout (src/Lib/server/booking-checkout.ts) ----
/** Reserves the reward for ONE booking. Returns the fraction to take off tuition, or null when there is nothing to apply (no points, not a client, a booking already holds it, or the quiz is not set up). */
export async function reserveReward(supabase: any, userId: string, invoiceId: string, isVip: boolean, now: Date = new Date()): Promise<number | null> {
  try {
    if (!userId || !(await isClientUser(supabase, userId))) return null;
    const l = await load(supabase, userId); if (!l.ok || !l.exists) return null;
    const { p } = await reconcile(supabase, userId, l.p, l.at, now);
    if (p.redeemedInvoice) return null;
    const fraction = rewardFraction(p.points, isVip); if (!(fraction > 0)) return null;
    const r = await supabase.from('quiz_progress').update({ redeemed_invoice: invoiceId, redeemed_percent: Math.round(fraction * 10000) / 100, redeemed_at: now.toISOString(), updated_at: now.toISOString() }).eq('user_id', userId).is('redeemed_invoice', null).select('user_id');
    if (r.error || !Array.isArray(r.data) || r.data.length === 0) return null;
    await sendDiscordAlert('🎯 Quiz reward applied to a booking', `A client's Daily Range Quiz reward of **${(fraction * 100).toFixed(2)}%** off tuition was applied to invoice **${invoiceId}**.`, [{ name: 'Track', value: isVip ? 'VIP (20% cap)' : 'Base (30% cap)', inline: true }, { name: 'Points', value: String(p.points), inline: true }], 0x10b981);
    return fraction;
  } catch { return null; }
}
export async function releaseReward(supabase: any, userId: string, invoiceId: string): Promise<void> {
  try { await supabase.from('quiz_progress').update({ redeemed_invoice: null, redeemed_percent: null, redeemed_at: null, updated_at: new Date().toISOString() }).eq('user_id', userId).eq('redeemed_invoice', invoiceId); } catch { /* it is released by the next check anyway */ }
}
export const QUIZ_QUESTION_COUNT = QUESTIONS.length;
