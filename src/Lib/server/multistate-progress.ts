import { sendDiscordAlert } from './discord';
import { STEPS, STEP_IDS, TRACKING_KEYS, cleanDone, cleanTracking, cleanTrackingValue, phaseLabel, stepById, summarize, withToggle, type Done } from '../../multistate/plan';

// Where a student is in the Mid-Atlantic Multi-State application guide. A signed-in student or client reaches ONLY their own row (found from the verified login,
// never from anything the browser says). It stores checked step ids with the time, and up to three mail tracking numbers: nothing sensitive. Each newly checked
// step is posted to Discord so Coach Kai can see where people are.
export type Result<T = {}> = ({ ok: true } & T) | { ok: false; status: number; message: string };
const SETUP = 'The step tracker is not set up yet. Please tell Coach Kai.';
const isMissingTable = (e: any) => !!e && (e.code === '42P01' || /multistate_progress|relation|does not exist|schema cache/i.test(String(e.message || '')));
const MASTERY = /mastery|multi-?state|mid-atlantic/i;

export interface Status { eligible: boolean; setupNeeded: boolean; done: Done; tracking: Record<string, string> }

/** Who gets the guide: a student booked in the Multi-State Mastery class (the login is the same one they keep as a client), or anyone who has already started it. */
export async function multiStateStatus(supabase: any, userId: string): Promise<Result<Status>> {
  if (!userId) return { ok: false, status: 401, message: 'Please sign in.' };
  try {
    const row = await supabase.from('multistate_progress').select('steps, tracking').eq('user_id', userId).maybeSingle();
    let setupNeeded = false; let done: Done = {}; let tracking: Record<string, string> = {}; let has = false;
    if (row.error) { if (isMissingTable(row.error)) setupNeeded = true; else return { ok: false, status: 503, message: 'Could not load your steps right now.' }; }
    else if (row.data) { has = true; done = cleanDone(row.data.steps); tracking = cleanTracking(row.data.tracking); }
    let eligible = has;
    if (!eligible) {
      const st = await supabase.from('students').select('student_id, course, course_selection, course_name').eq('user_id', userId).maybeSingle();
      if (!st.error && st.data) {
        if ([st.data.course, st.data.course_selection, st.data.course_name].some((c: any) => MASTERY.test(String(c || '')))) eligible = true;
        else if (st.data.student_id) {
          const inv = await supabase.from('invoices').select('course, status').eq('student_id', st.data.student_id).in('status', ['PAID', 'DEPOSIT_PAID']);
          if (!inv.error && Array.isArray(inv.data) && inv.data.some((r: any) => MASTERY.test(String(r.course || '')))) eligible = true;
        }
      }
    }
    return { ok: true, eligible, setupNeeded: eligible && setupNeeded, done, tracking };
  } catch { return { ok: false, status: 503, message: 'Could not load your steps right now.' }; }
}

async function displayName(supabase: any, userId: string): Promise<string> {
  try {
    const s = await supabase.from('students').select('full_name').eq('user_id', userId).maybeSingle(); if (s.data?.full_name) return String(s.data.full_name).slice(0, 80);
    const c = await supabase.from('clients').select('full_name').eq('user_id', userId).maybeSingle(); if (c.data?.full_name) return String(c.data.full_name).slice(0, 80);
  } catch { /* fall through */ }
  return 'A student';
}

export async function setStep(supabase: any, userId: string, stepId: unknown, checked: unknown): Promise<Result<{ done: Done }>> {
  const id = String(stepId || ''); if (!STEP_IDS.has(id) || typeof checked !== 'boolean') return { ok: false, status: 400, message: 'That step could not be updated.' };
  const cur = await multiStateStatus(supabase, userId);
  if (!cur.ok) return cur;
  if (!cur.eligible) return { ok: false, status: 403, message: 'This guide is for students in the Mid-Atlantic Multi-State class.' };
  if (cur.setupNeeded) return { ok: false, status: 409, message: SETUP };
  const before = summarize(cur.done);
  const t = withToggle(cur.done, id, checked, new Date().toISOString());
  if (!t.ok) return { ok: false, status: 409, message: t.reason };
  try {
    const up = await supabase.from('multistate_progress').upsert({ user_id: userId, steps: t.done, tracking: cur.tracking, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (up.error) return { ok: false, status: isMissingTable(up.error) ? 409 : 503, message: isMissingTable(up.error) ? SETUP : 'Could not save that step. Please try again.' };
  } catch { return { ok: false, status: 503, message: 'Could not save that step. Please try again.' }; }
  if (checked && !cur.done[id]) {
    const after = summarize(t.done); const step = stepById(id)!; const name = await displayName(supabase, userId);
    await sendDiscordAlert(after.phase === 'complete' ? '🎉 Multi-state application: all steps done' : '🧭 Multi-state application progress', `**${name}** checked off: ${step.title}`, [
      { name: 'Progress', value: `${after.requiredDone} of ${after.required} steps (${after.percent}%)`, inline: true },
      { name: 'Now in', value: phaseLabel(after.phase), inline: true },
      { name: 'Next up', value: after.next ? after.next.title : 'Nothing left', inline: false },
      ...(before.phase !== after.phase && after.phase !== 'complete' ? [{ name: 'Phase change', value: `${phaseLabel(before.phase)} → ${phaseLabel(after.phase)}`, inline: false }] : []),
    ], after.phase === 'complete' ? 0x10b981 : 0x00e5ff);
  }
  return { ok: true, done: t.done };
}

export async function setTracking(supabase: any, userId: string, key: unknown, value: unknown): Promise<Result<{ tracking: Record<string, string> }>> {
  const k = String(key || ''); const v = cleanTrackingValue(value);
  if (!(TRACKING_KEYS as readonly string[]).includes(k) || v === null) return { ok: false, status: 400, message: 'Tracking numbers use letters, numbers, spaces and dashes only (up to 40).' };
  const cur = await multiStateStatus(supabase, userId); if (!cur.ok) return cur;
  if (!cur.eligible) return { ok: false, status: 403, message: 'This guide is for students in the Mid-Atlantic Multi-State class.' };
  if (cur.setupNeeded) return { ok: false, status: 409, message: SETUP };
  const tracking = { ...cur.tracking }; if (v) tracking[k] = v; else delete tracking[k];
  try {
    const up = await supabase.from('multistate_progress').upsert({ user_id: userId, steps: cur.done, tracking, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (up.error) return { ok: false, status: 503, message: 'Could not save that. Please try again.' };
  } catch { return { ok: false, status: 503, message: 'Could not save that. Please try again.' }; }
  return { ok: true, tracking };
}

export interface AdminRow { name: string; email: string; percent: number; requiredDone: number; required: number; phase: string; next: string; updatedAt: string; tracking: Record<string, string> }
/** Staff only (the route checks the role first): everyone who has started, newest activity first. */
export async function adminMultiStateList(supabase: any): Promise<Result<{ rows: AdminRow[]; setupNeeded: boolean }>> {
  try {
    const r = await supabase.from('multistate_progress').select('user_id, steps, tracking, updated_at').order('updated_at', { ascending: false }).limit(200);
    if (r.error) return isMissingTable(r.error) ? { ok: true, rows: [], setupNeeded: true } : { ok: false, status: 503, message: 'Could not load progress right now.' };
    const rows: AdminRow[] = [];
    for (const p of r.data || []) {
      const s = summarize(cleanDone(p.steps)); let name = '', email = '';
      const st = await supabase.from('students').select('full_name, email').eq('user_id', p.user_id).maybeSingle();
      if (st.data) { name = String(st.data.full_name || ''); email = String(st.data.email || ''); }
      else { const c = await supabase.from('clients').select('full_name, email').eq('user_id', p.user_id).maybeSingle(); if (c.data) { name = String(c.data.full_name || ''); email = String(c.data.email || ''); } }
      rows.push({ name: name || 'Unknown', email, percent: s.percent, requiredDone: s.requiredDone, required: s.required, phase: phaseLabel(s.phase), next: s.next ? s.next.title : 'All steps done', updatedAt: String(p.updated_at || ''), tracking: cleanTracking(p.tracking) });
    }
    return { ok: true, rows, setupNeeded: false };
  } catch { return { ok: false, status: 503, message: 'Could not load progress right now.' }; }
}
export const TOTAL_STEPS = STEPS.length;
