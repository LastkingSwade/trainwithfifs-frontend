// Private range journal for students and clients (tables: scripts/sql/20261027_range_journal.sql). Every row belongs to one login, found from the verified token:
// nothing here ever takes an owner from the request, and staff have no way to read these rows. Plain text only, with limits. If the tables do not exist yet, the journal
// says it is unavailable instead of failing.
import { memberRole } from './portal-chat';

export const MAX_SESSIONS = 1000, MAX_GOALS = 50, LIST_LIMIT = 500;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export type JResult<T = {}> = ({ ok: true } & T) | { ok: false; status: number; message: string };
export interface JSession { id: string; on: string; range: string | null; rounds: number; focus: string | null; score: string | null; notes: string | null }
export interface JGoal { id: string; goal: string; targetOn: string | null; doneAt: string | null }

const missingTable = (e: any) => !!e && (e.code === '42P01' || e.code === 'PGRST205' || /does not exist|schema cache/i.test(String(e.message || '')));
const NOT_READY = 'The range journal is not set up yet. Please check back soon.';
const FAIL = 'That could not be saved right now. Nothing was changed.';
const clean = (v: unknown) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ').replace(/\r\n?/g, '\n').trim();
const validDay = (s: string) => DAY.test(s) && !Number.isNaN(Date.parse(s + 'T12:00:00Z')) && new Date(s + 'T12:00:00Z').toISOString().slice(0, 10) === s;
const plusDay = (now: Date) => new Date(now.getTime() + 86400000).toISOString().slice(0, 10);

function text(v: unknown, max: number, label: string): { ok: true; value: string | null } | { ok: false; message: string } {
  const s = clean(v); if (!s) return { ok: true, value: null }; if (s.length > max) return { ok: false, message: `${label} can be up to ${max} characters.` }; return { ok: true, value: s };
}

export function cleanSession(input: any, now: Date = new Date()): { ok: true; row: Record<string, unknown> } | { ok: false; message: string } {
  const on = clean(input?.on);
  if (!validDay(on)) return { ok: false, message: 'Choose the day of the session.' };
  if (on < '1990-01-01' || on > plusDay(now)) return { ok: false, message: 'The session day cannot be in the future.' };
  const roundsRaw = input?.rounds === '' || input?.rounds === null || input?.rounds === undefined ? 0 : Number(input.rounds);
  if (!Number.isInteger(roundsRaw) || roundsRaw < 0 || roundsRaw > 5000) return { ok: false, message: 'Rounds must be a whole number from 0 to 5000.' };
  const range = text(input?.range, 80, 'The range name'); if (!range.ok) return range;
  const focus = text(input?.focus, 60, 'The focus'); if (!focus.ok) return focus;
  const score = text(input?.score, 40, 'The score'); if (!score.ok) return score;
  const notes = text(input?.notes, 1000, 'Notes'); if (!notes.ok) return notes;
  return { ok: true, row: { session_on: on, range_name: range.value, rounds: roundsRaw, focus: focus.value, score_text: score.value, notes: notes.value } };
}

const toSession = (r: any): JSession => ({ id: String(r.id), on: String(r.session_on), range: r.range_name ?? null, rounds: Number(r.rounds) || 0, focus: r.focus ?? null, score: r.score_text ?? null, notes: r.notes ?? null });
const toGoal = (r: any): JGoal => ({ id: String(r.id), goal: String(r.goal), targetOn: r.target_on ?? null, doneAt: r.done_at ?? null });

async function guard(sb: any, uid: string): Promise<JResult> {
  try { const role = await memberRole(sb, uid); return role ? { ok: true } : { ok: false, status: 403, message: 'The range journal is for students and clients.' }; }
  catch { return { ok: false, status: 503, message: 'The journal is unavailable right now. Please try again in a minute.' }; }
}

export async function journalList(sb: any, uid: string): Promise<JResult<{ available: boolean; sessions: JSession[]; goals: JGoal[] }>> {
  const g = await guard(sb, uid); if (!g.ok) return g;
  try {
    const s = await sb.from('range_sessions').select('id, session_on, range_name, rounds, focus, score_text, notes').eq('user_id', uid).order('session_on', { ascending: false }).limit(LIST_LIMIT);
    if (s.error) return missingTable(s.error) ? { ok: true, available: false, sessions: [], goals: [] } : { ok: false, status: 503, message: 'Could not load your journal right now.' };
    const gl = await sb.from('range_goals').select('id, goal, target_on, done_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(MAX_GOALS);
    if (gl.error) return missingTable(gl.error) ? { ok: true, available: false, sessions: [], goals: [] } : { ok: false, status: 503, message: 'Could not load your journal right now.' };
    return { ok: true, available: true, sessions: (s.data || []).map(toSession), goals: (gl.data || []).map(toGoal) };
  } catch { return { ok: false, status: 503, message: 'Could not load your journal right now.' }; }
}

export async function addSession(sb: any, uid: string, input: unknown, now: Date = new Date()): Promise<JResult<{ session: JSession }>> {
  const v = cleanSession(input, now); if (!v.ok) return { ok: false, status: 400, message: v.message };
  const g = await guard(sb, uid); if (!g.ok) return g;
  try {
    const have = await sb.from('range_sessions').select('id').eq('user_id', uid).limit(MAX_SESSIONS + 1);
    if (have.error) return { ok: false, status: 503, message: missingTable(have.error) ? NOT_READY : FAIL };
    if ((have.data || []).length >= MAX_SESSIONS) return { ok: false, status: 409, message: `You can keep up to ${MAX_SESSIONS} sessions. Delete old ones or export them first.` };
    const ins = await sb.from('range_sessions').insert({ user_id: uid, ...v.row }).select('id, session_on, range_name, rounds, focus, score_text, notes').maybeSingle();
    if (ins.error || !ins.data) return { ok: false, status: 503, message: FAIL };
    return { ok: true, session: toSession(ins.data) };
  } catch { return { ok: false, status: 503, message: FAIL }; }
}

async function removeOne(sb: any, uid: string, table: 'range_sessions' | 'range_goals', id: unknown): Promise<JResult> {
  const docId = String(id ?? ''); if (!UUID.test(docId)) return { ok: false, status: 400, message: 'That item could not be found.' };
  const g = await guard(sb, uid); if (!g.ok) return g;
  try {
    const f = await sb.from(table).select('id').eq('id', docId).eq('user_id', uid).maybeSingle();
    if (f.error) return { ok: false, status: 503, message: missingTable(f.error) ? NOT_READY : FAIL };
    if (!f.data) return { ok: false, status: 404, message: 'That item could not be found.' };
    const d = await sb.from(table).delete().eq('id', docId).eq('user_id', uid);
    return d.error ? { ok: false, status: 503, message: FAIL } : { ok: true };
  } catch { return { ok: false, status: 503, message: FAIL }; }
}
export const deleteSession = (sb: any, uid: string, id: unknown) => removeOne(sb, uid, 'range_sessions', id);
export const deleteGoal = (sb: any, uid: string, id: unknown) => removeOne(sb, uid, 'range_goals', id);

export async function addGoal(sb: any, uid: string, input: any): Promise<JResult<{ goal: JGoal }>> {
  const goal = clean(input?.goal); if (!goal || goal.length > 140) return { ok: false, status: 400, message: 'Write your goal in up to 140 characters.' };
  const target = clean(input?.targetOn); if (target && (!validDay(target) || target < '2000-01-01' || target > '2100-12-31')) return { ok: false, status: 400, message: 'The target date is not valid.' };
  const g = await guard(sb, uid); if (!g.ok) return g;
  try {
    const have = await sb.from('range_goals').select('id').eq('user_id', uid).limit(MAX_GOALS + 1);
    if (have.error) return { ok: false, status: 503, message: missingTable(have.error) ? NOT_READY : FAIL };
    if ((have.data || []).length >= MAX_GOALS) return { ok: false, status: 409, message: `You can keep up to ${MAX_GOALS} goals. Delete finished ones first.` };
    const ins = await sb.from('range_goals').insert({ user_id: uid, goal, target_on: target || null }).select('id, goal, target_on, done_at').maybeSingle();
    if (ins.error || !ins.data) return { ok: false, status: 503, message: FAIL };
    return { ok: true, goal: toGoal(ins.data) };
  } catch { return { ok: false, status: 503, message: FAIL }; }
}

export async function setGoalDone(sb: any, uid: string, id: unknown, done: unknown, now: Date = new Date()): Promise<JResult> {
  const goalId = String(id ?? ''); if (!UUID.test(goalId)) return { ok: false, status: 400, message: 'That goal could not be found.' };
  const g = await guard(sb, uid); if (!g.ok) return g;
  try {
    const up = await sb.from('range_goals').update({ done_at: done === true ? now.toISOString() : null }).eq('id', goalId).eq('user_id', uid).select('id');
    if (up.error) return { ok: false, status: 503, message: missingTable(up.error) ? NOT_READY : FAIL };
    return Array.isArray(up.data) && up.data.length ? { ok: true } : { ok: false, status: 404, message: 'That goal could not be found.' };
  } catch { return { ok: false, status: 503, message: FAIL }; }
}

/** Delete everything this person keeps in the journal. */
export async function deleteAll(sb: any, uid: string): Promise<JResult> {
  const g = await guard(sb, uid); if (!g.ok) return g;
  try {
    const a = await sb.from('range_sessions').delete().eq('user_id', uid); const b = await sb.from('range_goals').delete().eq('user_id', uid);
    if (a.error || b.error) return { ok: false, status: 503, message: missingTable(a.error) || missingTable(b.error) ? NOT_READY : FAIL };
    return { ok: true };
  } catch { return { ok: false, status: 503, message: FAIL }; }
}
