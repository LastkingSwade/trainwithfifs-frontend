import { getPrivilegedClient } from '@/Lib/server/supabase-admin';
import { ONLINE_PREMIUM_RATE, courseKeyFor, onlineEligible } from '@/Lib/pricing';

// Live Online Classroom rules, all enforced here on the server. The browser only guides the form.
//  - classroom taught live over video; Day 2 (range) is always in person
//  - a course is offered online only if its switch is ON in public.course_settings (everything starts OFF)
//  - booking requires a live classroom session, an in-person range session, and the "Day 2 is mandatory" acknowledgement
//  - remote students hold range seats exactly like in-person students (shared capacity)
// Every database call fails safe: if the tables are missing or the database is unreachable, online is simply not offered.

export const DAY2_STATEMENT = 'Day 2 is the hands-on range day (loading, malfunctions and jams, live fire) and it is always in person at the range.';
export const DAY2_ACK_TEXT = 'I understand Day 2 is mandatory, in person, at the range.';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface PublicSession { id: string; kind: 'classroom' | 'range'; startsAt: string; seatsLeft: number | null }
export interface OnlineOptions { premiumRate: number; courses: Record<string, { classroom: PublicSession[]; range: PublicSession[] }> }

export async function getOnlineOptions(supabase: any = getPrivilegedClient()): Promise<OnlineOptions> {
  const empty: OnlineOptions = { premiumRate: ONLINE_PREMIUM_RATE, courses: {} };
  try {
    const sw = await supabase.from('course_settings').select('course_key').eq('online_enabled', true);
    if (sw.error || !Array.isArray(sw.data) || sw.data.length === 0) return empty;
    const keys: string[] = sw.data.map((r: any) => String(r.course_key));
    const ses = await supabase.from('class_sessions').select('id, course_key, kind, delivery, starts_at, capacity, is_open').eq('is_open', true).gt('starts_at', new Date().toISOString()).order('starts_at', { ascending: true });
    if (ses.error || !Array.isArray(ses.data)) return empty;
    const rows = ses.data.filter((r: any) => keys.includes(String(r.course_key)));
    const counts = new Map<string, number>();
    if (rows.length) {
      const enr = await supabase.from('session_enrollments').select('session_id').in('session_id', rows.map((r: any) => r.id));
      if (!enr.error && Array.isArray(enr.data)) for (const e of enr.data) counts.set(String(e.session_id), (counts.get(String(e.session_id)) || 0) + 1);
    }
    for (const k of keys) {
      const mine = rows.filter((r: any) => r.course_key === k);
      const toPublic = (r: any): PublicSession => ({ id: String(r.id), kind: r.kind, startsAt: String(r.starts_at), seatsLeft: Number(r.capacity) > 0 ? Math.max(Number(r.capacity) - (counts.get(String(r.id)) || 0), 0) : null });
      const classroom = mine.filter((r: any) => r.kind === 'classroom' && r.delivery === 'live_online').map(toPublic);
      const range = mine.filter((r: any) => r.kind === 'range' && r.delivery === 'in_person').map(toPublic);
      if (classroom.length && range.length) empty.courses[k] = { classroom, range };   // offered only when both a live classroom and a range day exist
    }
    return empty;
  } catch (err: any) {
    console.warn('[Online] Options unavailable:', err?.message);
    return { premiumRate: ONLINE_PREMIUM_RATE, courses: {} };
  }
}

export type OnlineCheck = { ok: true; courseKey: string; classroomSessionId: string; rangeSessionId: string } | { ok: false; status: number; message: string };

export async function validateOnlineBooking(supabase: any, courseSelection: string, sel: { classroomSessionId?: unknown; rangeSessionId?: unknown; ack?: unknown }): Promise<OnlineCheck> {
  const courseKey = courseKeyFor(courseSelection) || '';
  if (!onlineEligible(courseSelection)) return { ok: false, status: 400, message: 'The live online classroom is not offered for this class.' };
  if (!(sel.ack === true || sel.ack === 'true')) return { ok: false, status: 400, message: 'Please confirm that Day 2 is mandatory, in person, at the range.' };
  const classroomId = String(sel.classroomSessionId ?? ''), rangeId = String(sel.rangeSessionId ?? '');
  if (!UUID.test(classroomId)) return { ok: false, status: 400, message: 'Please choose a live classroom date.' };
  if (!UUID.test(rangeId)) return { ok: false, status: 400, message: 'Please choose your in-person Day 2 range date. It is required.' };
  try {
    const sw = await supabase.from('course_settings').select('online_enabled').eq('course_key', courseKey).maybeSingle();
    if (sw.error || !sw.data || sw.data.online_enabled !== true) return { ok: false, status: 400, message: 'The live online classroom is not available for this class right now.' };
    const ses = await supabase.from('class_sessions').select('id, course_key, kind, delivery, starts_at, is_open').in('id', [classroomId, rangeId]);
    if (ses.error || !Array.isArray(ses.data)) return { ok: false, status: 503, message: 'Dates are temporarily unavailable. Please try again in a few minutes.' };
    const now = Date.now();
    const good = (r: any, kind: string, delivery: string) => r && r.kind === kind && r.delivery === delivery && r.course_key === courseKey && r.is_open === true && Date.parse(r.starts_at) > now;
    if (!good(ses.data.find((r: any) => r.id === classroomId), 'classroom', 'live_online')) return { ok: false, status: 400, message: 'That live classroom date is not available. Please choose another.' };
    if (!good(ses.data.find((r: any) => r.id === rangeId), 'range', 'in_person')) return { ok: false, status: 400, message: 'That range day is not available. Please choose another.' };
    return { ok: true, courseKey, classroomSessionId: classroomId, rangeSessionId: rangeId };
  } catch (err: any) {
    console.warn('[Online] Validation unavailable:', err?.message);
    return { ok: false, status: 503, message: 'The online option is temporarily unavailable. Please try again in a few minutes.' };
  }
}

export async function releaseOnlineSeats(invoiceNumber: unknown, supabase: any = getPrivilegedClient()): Promise<void> {
  try {
    if (!invoiceNumber) return;
    const { error } = await supabase.rpc('release_session_seats', { p_invoice: String(invoiceNumber) });
    if (error) console.warn('[Online] Seat release failed:', error.code || 'no code');
  } catch (err: any) { console.warn('[Online] Seat release unavailable:', err?.message); }
}

/** Holds one range seat and one classroom seat for the invoice. If either is full, nothing stays held. */
export async function claimOnlineSeats(supabase: any, invoiceNumber: string, check: { classroomSessionId: string; rangeSessionId: string }): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const range = await supabase.rpc('claim_session_seat', { p_session: check.rangeSessionId, p_invoice: invoiceNumber, p_kind: 'range' });
    if (range.error || range.data !== true) { await releaseOnlineSeats(invoiceNumber, supabase); return { ok: false, message: 'That range day just filled up. Please choose another date.' }; }
    const room = await supabase.rpc('claim_session_seat', { p_session: check.classroomSessionId, p_invoice: invoiceNumber, p_kind: 'classroom' });
    if (room.error || room.data !== true) { await releaseOnlineSeats(invoiceNumber, supabase); return { ok: false, message: 'That live classroom date just filled up. Please choose another date.' }; }
    return { ok: true };
  } catch (err: any) {
    await releaseOnlineSeats(invoiceNumber, supabase);
    return { ok: false, message: 'Dates are temporarily unavailable. Please try again in a few minutes.' };
  }
}
