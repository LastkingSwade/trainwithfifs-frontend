import { getPrivilegedClient } from '@/Lib/server/supabase-admin';
import { ONLINE_ELIGIBLE_KEYS, ONLINE_PREMIUM_RATE, courseKeyFor, onlineEligible } from '@/Lib/pricing';

// Live Online Classroom rules, all enforced here on the server. The browser only guides the form.
//  - classroom taught live over video; Day 2 (range) is always in person
//  - a course is offered online only if its switch is ON in public.course_settings (everything starts OFF)
//  - booking requires a live classroom session, an in-person range session, and the "Day 2 is mandatory" acknowledgement
//  - remote students hold range seats exactly like in-person students (shared capacity)
// Every database call fails safe: if the tables are missing or the database is unreachable, online is simply not offered.

export { DAY2_ACK_TEXT, DAY2_STATEMENT } from '@/online/onlineCopy';
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

// ---------------------------------------------------------------------------------------------------------------------------
// Admin and student sides. Every function takes the (service-role) client; the route checks WHO is asking before calling any of them.
// ---------------------------------------------------------------------------------------------------------------------------
const KEYS = ONLINE_ELIGIBLE_KEYS as readonly string[];
const PAID = ['PAID', 'DEPOSIT_PAID'];
export type AdminResult<T = {}> = ({ ok: true } & T) | { ok: false; status: number; message: string };

export async function adminOnlineOverview(supabase: any): Promise<AdminResult<{ switches: Array<{ courseKey: string; enabled: boolean }>; sessions: any[] }>> {
  try {
    const sw = await supabase.from('course_settings').select('course_key, online_enabled');
    const ses = await supabase.from('class_sessions').select('id, course_key, kind, delivery, starts_at, capacity, meeting_url, is_open').order('starts_at', { ascending: true });
    if (sw.error || ses.error) return { ok: false, status: 503, message: 'The online class tables are not set up yet. Run the database script first.' };
    const enr = await supabase.from('session_enrollments').select('session_id, attended_at');
    const taken = new Map<string, number>(); const attended = new Map<string, number>();
    for (const e of (enr.data || [])) { taken.set(String(e.session_id), (taken.get(String(e.session_id)) || 0) + 1); if (e.attended_at) attended.set(String(e.session_id), (attended.get(String(e.session_id)) || 0) + 1); }
    const switches = KEYS.map((k) => ({ courseKey: k, enabled: (sw.data || []).some((r: any) => r.course_key === k && r.online_enabled === true) }));
    return { ok: true, switches, sessions: (ses.data || []).map((r: any) => ({ id: r.id, courseKey: r.course_key, kind: r.kind, delivery: r.delivery, startsAt: r.starts_at, capacity: r.capacity, meetingUrl: r.meeting_url || '', isOpen: r.is_open, seatsTaken: taken.get(String(r.id)) || 0, attended: attended.get(String(r.id)) || 0 })) };
  } catch (err: any) { console.warn('[Online admin] overview:', err?.message); return { ok: false, status: 503, message: 'Could not load the online classes.' }; }
}

export async function adminSetCourseOnline(supabase: any, courseKey: unknown, enabled: unknown): Promise<AdminResult> {
  const key = String(courseKey ?? '');
  if (!KEYS.includes(key) || typeof enabled !== 'boolean') return { ok: false, status: 400, message: 'That class cannot be switched.' };
  try {
    const { error } = await supabase.from('course_settings').upsert({ course_key: key, online_enabled: enabled, updated_at: new Date().toISOString() }, { onConflict: 'course_key' });
    if (error) return { ok: false, status: 503, message: 'Could not save the switch. The online class tables may not be set up yet.' };
    return { ok: true };
  } catch (err: any) { return { ok: false, status: 503, message: 'Could not save the switch.' }; }
}

export async function adminSaveSession(supabase: any, input: any): Promise<AdminResult<{ id: string }>> {
  const courseKey = String(input?.courseKey ?? ''), kind = String(input?.kind ?? '');
  if (!KEYS.includes(courseKey)) return { ok: false, status: 400, message: 'Choose one of the classes that can be taught online.' };
  if (kind !== 'classroom' && kind !== 'range') return { ok: false, status: 400, message: 'Choose live classroom or range day.' };
  const startsMs = Date.parse(String(input?.startsAt ?? ''));
  if (!Number.isFinite(startsMs)) return { ok: false, status: 400, message: 'Enter a valid date and time.' };
  const capacity = Number(input?.capacity ?? 0);
  if (!Number.isInteger(capacity) || capacity < 0 || capacity > 200) return { ok: false, status: 400, message: 'Seats must be a whole number from 0 (no limit) to 200.' };
  const meetingUrl = String(input?.meetingUrl ?? '').trim();
  if (kind === 'classroom' && meetingUrl && !/^https:\/\/[^\s<>"']{4,480}$/.test(meetingUrl)) return { ok: false, status: 400, message: 'The meeting link must start with https://.' };
  const row: Record<string, unknown> = { course_key: courseKey, kind, delivery: kind === 'classroom' ? 'live_online' : 'in_person', starts_at: new Date(startsMs).toISOString(), capacity,
    meeting_url: kind === 'classroom' ? (meetingUrl || null) : null, is_open: input?.isOpen !== false };
  try {
    const id = String(input?.id ?? '');
    if (id) {
      if (!UUID.test(id)) return { ok: false, status: 400, message: 'That session was not found.' };
      const { data, error } = await supabase.from('class_sessions').update(row).eq('id', id).select('id');
      if (error || !Array.isArray(data) || data.length !== 1) return { ok: false, status: 404, message: 'That session was not found.' };
      return { ok: true, id };
    }
    const { data, error } = await supabase.from('class_sessions').insert(row).select('id');
    if (error || !Array.isArray(data) || !data[0]) return { ok: false, status: 503, message: 'Could not save the session. The online class tables may not be set up yet.' };
    return { ok: true, id: String(data[0].id) };
  } catch (err: any) { return { ok: false, status: 503, message: 'Could not save the session.' }; }
}

export async function adminSessionRoster(supabase: any, sessionId: unknown): Promise<AdminResult<{ people: Array<{ invoiceNumber: string; email: string; status: string; attendedAt: string | null }> }>> {
  const id = String(sessionId ?? '');
  if (!UUID.test(id)) return { ok: false, status: 400, message: 'That session was not found.' };
  try {
    const enr = await supabase.from('session_enrollments').select('invoice_number, attended_at').eq('session_id', id);
    if (enr.error) return { ok: false, status: 503, message: 'Could not load the roster.' };
    const numbers = (enr.data || []).map((e: any) => String(e.invoice_number));
    const inv = numbers.length ? await supabase.from('invoices').select('invoice_number, email, status').in('invoice_number', numbers) : { data: [], error: null };
    const byNum = new Map<string, any>((inv.data || []).map((r: any) => [String(r.invoice_number), r]));
    return { ok: true, people: (enr.data || []).map((e: any) => ({ invoiceNumber: String(e.invoice_number), email: String(byNum.get(String(e.invoice_number))?.email || ''), status: String(byNum.get(String(e.invoice_number))?.status || ''), attendedAt: e.attended_at || null })) };
  } catch (err: any) { return { ok: false, status: 503, message: 'Could not load the roster.' }; }
}

export async function adminMarkAttendance(supabase: any, invoiceNumber: unknown, kind: unknown, attended: unknown, markedBy: string): Promise<AdminResult> {
  const inv = String(invoiceNumber ?? '').trim();
  if (!/^INV-[A-Za-z0-9-]{3,40}$/.test(inv) || (kind !== 'classroom' && kind !== 'range') || typeof attended !== 'boolean') return { ok: false, status: 400, message: 'Choose a person and whether they attended.' };
  try {
    const { data, error } = await supabase.from('session_enrollments').update({ attended_at: attended ? new Date().toISOString() : null, marked_by: attended ? String(markedBy).slice(0, 120) : null }).eq('invoice_number', inv).eq('kind', kind).select('invoice_number');
    if (error) return { ok: false, status: 503, message: 'Could not save attendance.' };
    if (!Array.isArray(data) || data.length === 0) return { ok: false, status: 404, message: 'That person has no seat in this session.' };
    return { ok: true };
  } catch (err: any) { return { ok: false, status: 503, message: 'Could not save attendance.' }; }
}

export interface StudentOnlineClass { invoiceNumber: string; classroom: { startsAt: string; meetingUrl: string; attended: boolean } | null; range: { startsAt: string; attended: boolean } | null; day2Attended: boolean }
/** Live-online bookings of ONE student (found by the verified student id), only once paid. The meeting link is returned only for paid invoices. */
export async function studentOnlineClasses(supabase: any, studentId: string): Promise<StudentOnlineClass[]> {
  try {
    const inv = await supabase.from('invoices').select('invoice_number, status, delivery').eq('student_id', studentId).eq('delivery', 'live_online');
    if (inv.error || !Array.isArray(inv.data)) return [];
    const paid = inv.data.filter((r: any) => PAID.includes(String(r.status))).map((r: any) => String(r.invoice_number));
    if (!paid.length) return [];
    const enr = await supabase.from('session_enrollments').select('invoice_number, session_id, kind, attended_at').in('invoice_number', paid);
    if (enr.error || !Array.isArray(enr.data) || !enr.data.length) return paid.map((n: string) => ({ invoiceNumber: n, classroom: null, range: null, day2Attended: false }));
    const ses = await supabase.from('class_sessions').select('id, starts_at, meeting_url').in('id', Array.from(new Set(enr.data.map((e: any) => String(e.session_id)))));
    const sById = new Map<string, any>((ses.data || []).map((s: any) => [String(s.id), s]));
    return paid.map((n: string) => {
      const mine = enr.data.filter((e: any) => e.invoice_number === n);
      const room = mine.find((e: any) => e.kind === 'classroom'), rng = mine.find((e: any) => e.kind === 'range');
      const rs = room ? sById.get(String(room.session_id)) : null, gs = rng ? sById.get(String(rng.session_id)) : null;
      return { invoiceNumber: n, classroom: rs ? { startsAt: rs.starts_at, meetingUrl: rs.meeting_url || '', attended: !!room.attended_at } : null, range: gs ? { startsAt: gs.starts_at, attended: !!rng.attended_at } : null, day2Attended: !!(rng && rng.attended_at) };
    });
  } catch (err: any) { console.warn('[Online] student classes:', err?.message); return []; }
}

/** True when this student has a paid live-online booking whose Day 2 range attendance is not recorded yet. */
export async function day2Pending(supabase: any, studentId: string): Promise<boolean> {
  const list = await studentOnlineClasses(supabase, studentId);
  return list.some((c) => !c.day2Attended);
}
