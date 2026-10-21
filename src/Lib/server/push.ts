import webpush from 'web-push';
import { MAX_DEVICES_PER_PERSON, DOC_REMINDER_DAYS, documentReminder, isAllowedEndpoint, alertPayload, classifyAlert, cleanSubscription, cleanTopics, defaultTopicsFor, easternDay, addDays, classDaysFrom, classReminder, paymentReceived, permitReminder, withinSendWindow, type PersonRole, type PushPayload, type Role, type Topic } from './push-logic';
import { getPrivilegedClient } from './supabase-admin';
import { runAfterResponse } from './background';

// Server side of push notifications (see docs/PUSH-SETUP.md). Everything is optional: without the two keys in the environment, or without the push_subscriptions table, nothing is
// offered in the portals and nothing is sent. A person reaches only their own devices (found from the verified login). Nothing personal is ever put in a notification.
export type Result<T = {}> = ({ ok: true } & T) | { ok: false; status: number; message: string };
const isMissingTable = (e: any) => !!e && (e.code === '42P01' || /push_subscriptions|relation|does not exist|schema cache/i.test(String(e.message || '')));
const SETUP = 'Notifications are not set up yet. Please check back soon.';

export function pushConfigured(): boolean { return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && /^mailto:|^https:\/\//.test(process.env.VAPID_SUBJECT || '')); }
export const vapidPublicKey = (): string => (pushConfigured() ? String(process.env.VAPID_PUBLIC_KEY) : '');
let configured = false;
function ready(): boolean { if (!pushConfigured()) return false; if (!configured) { webpush.setVapidDetails(String(process.env.VAPID_SUBJECT), String(process.env.VAPID_PUBLIC_KEY), String(process.env.VAPID_PRIVATE_KEY)); configured = true; } return true; }

/** Which kind of account a verified login is. Staff are neither (they do not subscribe). */
export async function roleOf(supabase: any, userId: string): Promise<PersonRole | null> {
  try {
    const s = await supabase.from('students').select('student_id').eq('user_id', userId).maybeSingle(); if (!s.error && s.data) return 'student';
    const c = await supabase.from('clients').select('user_id').eq('user_id', userId).maybeSingle(); if (!c.error && c.data) return 'client';
  } catch { /* unknown */ }
  return null;
}

export async function saveSubscription(supabase: any, userId: string, role: Role, input: unknown): Promise<Result> {
  if (!pushConfigured()) return { ok: false, status: 409, message: SETUP };
  const sub = cleanSubscription(input); if (!sub) return { ok: false, status: 400, message: 'That device could not be registered. Please try again.' };
  try {
    // Turning it on again on the same device keeps the choices the person already made; a new device starts with every topic on.
    const ex = await supabase.from('push_subscriptions').select('user_id, topics').eq('endpoint', sub.endpoint).maybeSingle();
    const keep = !ex.error && ex.data && String(ex.data.user_id) === userId && Array.isArray(ex.data.topics) ? cleanTopics(role, ex.data.topics) : null;
    const up = await supabase.from('push_subscriptions').upsert({ user_id: userId, role, endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth, topics: keep && keep.length ? keep : defaultTopicsFor(role) }, { onConflict: 'endpoint' });
    if (up.error) return isMissingTable(up.error) ? { ok: false, status: 409, message: SETUP } : { ok: false, status: 503, message: 'Could not turn on reminders right now.' };
    const mine = await supabase.from('push_subscriptions').select('endpoint, created_at').eq('user_id', userId).order('created_at', { ascending: false });
    const rows: any[] = Array.isArray(mine.data) ? mine.data : [];
    for (const old of rows.slice(MAX_DEVICES_PER_PERSON)) await supabase.from('push_subscriptions').delete().eq('endpoint', old.endpoint).eq('user_id', userId);
    return { ok: true };
  } catch { return { ok: false, status: 503, message: 'Could not turn on reminders right now.' }; }
}
export async function removeSubscription(supabase: any, userId: string, endpoint: unknown): Promise<Result> {
  if (typeof endpoint !== 'string' || !endpoint) return { ok: false, status: 400, message: 'Nothing to turn off.' };
  try { const r = await supabase.from('push_subscriptions').delete().eq('user_id', userId).eq('endpoint', endpoint); return r.error && !isMissingTable(r.error) ? { ok: false, status: 503, message: 'Could not turn off reminders right now.' } : { ok: true }; } catch { return { ok: false, status: 503, message: 'Could not turn off reminders right now.' }; }
}
/** The topics this exact device is set to (null when the device is not registered for this person). */
export async function deviceTopics(supabase: any, userId: string, endpoint: unknown): Promise<{ role: Role; topics: Topic[] } | null> {
  if (typeof endpoint !== 'string' || !endpoint) return null;
  try { const r = await supabase.from('push_subscriptions').select('role, topics').eq('user_id', userId).eq('endpoint', endpoint).maybeSingle(); return r.error || !r.data ? null : { role: r.data.role, topics: cleanTopics(r.data.role, r.data.topics) }; } catch { return null; }
}
/** Changes which kinds of notification this exact device gets. Only real topics for that kind of account are kept. */
export async function setDeviceTopics(supabase: any, userId: string, endpoint: unknown, topics: unknown): Promise<Result<{ topics: Topic[] }>> {
  const dev = await deviceTopics(supabase, userId, endpoint); if (!dev) return { ok: false, status: 404, message: 'This device is not turned on yet.' };
  const clean = cleanTopics(dev.role, topics);
  try { const r = await supabase.from('push_subscriptions').update({ topics: clean }).eq('user_id', userId).eq('endpoint', String(endpoint)); return r.error ? { ok: false, status: 503, message: 'Could not save your choices right now.' } : { ok: true, topics: clean }; } catch { return { ok: false, status: 503, message: 'Could not save your choices right now.' }; }
}
/** True when this exact device is registered for this person. */
export async function isSubscribed(supabase: any, userId: string, endpoint: unknown): Promise<boolean> {
  if (typeof endpoint !== 'string' || !endpoint) return false;
  try { const r = await supabase.from('push_subscriptions').select('endpoint').eq('user_id', userId).eq('endpoint', endpoint).maybeSingle(); return !r.error && !!r.data; } catch { return false; }
}

export interface SendReport { sent: number; failed: number; removed: number; skipped?: 'quiet-hours' | 'not-configured' | 'none' }
/** Sends one notification to every device of the given people that wants this topic. Outside 8am to 8pm Eastern nothing is sent. Dead devices (the push service says gone) are deleted. */
export async function sendToUsers(supabase: any, userIds: string[], payload: PushPayload, now: Date = new Date(), opts: { ignoreQuiet?: boolean; ignoreTopic?: boolean } = {}): Promise<SendReport> {
  const rep: SendReport = { sent: 0, failed: 0, removed: 0 };
  if (!ready()) return { ...rep, skipped: 'not-configured' };
  if (!opts.ignoreQuiet && !withinSendWindow(now)) return { ...rep, skipped: 'quiet-hours' };
  const ids = Array.from(new Set(userIds.filter(Boolean))); if (!ids.length) return { ...rep, skipped: 'none' };
  let rows: any[] = [];
  try { const r = await supabase.from('push_subscriptions').select('endpoint, p256dh, auth, topics, user_id').in('user_id', ids); if (r.error || !Array.isArray(r.data)) return { ...rep, skipped: 'none' }; rows = r.data; } catch { return { ...rep, skipped: 'none' }; }
  const body = JSON.stringify({ title: payload.title, body: payload.body, url: payload.url, tag: payload.tag });
  for (const row of rows) {
    if (!opts.ignoreTopic && Array.isArray(row.topics) && !row.topics.includes(payload.topic)) continue;   // a direct message from the instructor is not switched off by topic
    try { await webpush.sendNotification({ endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } }, body, { TTL: 12 * 3600, urgency: 'normal' }); rep.sent += 1; }
    catch (e: any) {
      if (e && (e.statusCode === 404 || e.statusCode === 410)) { rep.removed += 1; try { await supabase.from('push_subscriptions').delete().eq('endpoint', row.endpoint); } catch { /* retried next time */ } }
      else rep.failed += 1;
    }
  }
  return rep;
}
export async function countSubscribers(supabase: any, audience: 'all' | PersonRole): Promise<number> {
  try { let q = supabase.from('push_subscriptions').select('user_id, topics'); if (audience !== 'all') q = q.eq('role', audience); const r = await q; return !r.error && Array.isArray(r.data) ? r.data.filter((x: any) => !Array.isArray(x.topics) || x.topics.includes('news')).length : 0; } catch { return 0; }
}
export async function userIdsFor(supabase: any, audience: 'all' | PersonRole): Promise<string[]> {
  try { let q = supabase.from('push_subscriptions').select('user_id'); q = audience === 'all' ? q.in('role', ['student', 'client']) : q.eq('role', audience); const r = await q; return !r.error && Array.isArray(r.data) ? Array.from(new Set(r.data.map((x: any) => String(x.user_id)))) : []; } catch { return []; }
}

// ---- the triggers ----
/** The login ids of every staff device that is turned on. */
export async function staffUserIds(supabase: any): Promise<string[]> {
  try { const r = await supabase.from('push_subscriptions').select('user_id').eq('role', 'staff'); return !r.error && Array.isArray(r.data) ? Array.from(new Set<string>(r.data.map((x: any) => String(x.user_id)))) : []; } catch { return []; }
}
/** Tells every staff device that wants this kind of event. Only the generic line for the event is sent (see classifyAlert); problems go out at any hour, everything else 8am to 8pm Eastern. */
export async function notifyStaff(supabase: any, alertTitle: unknown, now: Date = new Date()): Promise<SendReport> {
  const al = classifyAlert(alertTitle); const ids = await staffUserIds(supabase);
  return ids.length ? sendToUsers(supabase, ids, alertPayload(al), now, { ignoreQuiet: al.urgent }) : { sent: 0, failed: 0, removed: 0, skipped: 'none' };
}
/** Called whenever the site posts an operational alert to Discord. Does nothing unless notifications are switched on; runs after the answer; never throws. */
/** Is this push address one of the staff devices (Admin Hub alerts on)? The visit route uses it so a staff member's own visit from that device is not counted or alerted. Never throws; a failed check counts the visit as normal. */
export async function isStaffEndpoint(supabase: any, endpoint: unknown): Promise<boolean> {
  if (!isAllowedEndpoint(endpoint)) return false;
  try { const r = await supabase.from('push_subscriptions').select('role').eq('endpoint', String(endpoint)).eq('role', 'staff').maybeSingle(); return !r.error && !!r.data; } catch { return false; }
}
export function notifyStaffOfAlert(alertTitle: unknown): void {
  if (!pushConfigured()) return;
  runAfterResponse(async () => { await notifyStaff(getPrivilegedClient(), alertTitle); });
}

/** After staff record a payment: tell that student (if they turned notifications on). The message says nothing about the amount. */
export async function notifyPaymentReceived(supabase: any, invoiceNumber: string): Promise<SendReport | null> {
  try {
    const inv = await supabase.from('invoices').select('student_id').eq('invoice_number', invoiceNumber).maybeSingle(); if (inv.error || !inv.data?.student_id) return null;
    const stu = await supabase.from('students').select('user_id').eq('student_id', inv.data.student_id).maybeSingle(); if (stu.error || !stu.data?.user_id) return null;
    return await sendToUsers(supabase, [String(stu.data.user_id)], paymentReceived());
  } catch { return null; }
}
/** Daily: students whose class is tomorrow or today (days found in their saved date text) and who turned notifications on. */
export async function sendClassReminders(supabase: any, now: Date = new Date()): Promise<{ tomorrow: SendReport; today: SendReport }> {
  const empty: SendReport = { sent: 0, failed: 0, removed: 0 }; const out = { tomorrow: { ...empty }, today: { ...empty } };
  if (!pushConfigured() || !withinSendWindow(now)) return out;
  const today = easternDay(now), tomorrow = addDays(today, 1);
  const subs = await supabase.from('push_subscriptions').select('user_id, topics').eq('role', 'student'); if (subs.error || !Array.isArray(subs.data)) return out;
  const ids: string[] = Array.from(new Set<string>(subs.data.filter((x: any) => !Array.isArray(x.topics) || x.topics.includes('class')).map((x: any) => String(x.user_id))));
  const add = (a: SendReport, b: SendReport) => { a.sent += b.sent; a.failed += b.failed; a.removed += b.removed; };
  for (const uid of ids) {
    try {
      const st = await supabase.from('students').select('student_id, assigned_date, class_date, preferred_dates, status').eq('user_id', uid).maybeSingle(); if (st.error || !st.data) continue;
      const days = classDaysFrom(st.data.assigned_date, st.data.class_date, st.data.preferred_dates);
      const when = days.includes(tomorrow) ? 'tomorrow' : days.includes(today) ? 'today' : null; if (!when) continue;
      let owing = false; if (when === 'tomorrow') { const inv = await supabase.from('invoices').select('balance_due').eq('student_id', st.data.student_id).eq('status', 'DEPOSIT_PAID'); owing = !inv.error && Array.isArray(inv.data) && inv.data.some((r: any) => Number(r.balance_due) > 0); }
      add(out[when], await sendToUsers(supabase, [uid], classReminder(when, owing), now));
    } catch { /* one person never stops the rest */ }
  }
  return out;
}
/** Used by the permit-renewal daily job: the clients (by login id) who are due a reminder today get a notification too, if they turned it on. */
/** Wallet documents due 90, 30 or 7 days out (matched on the exact day, so a daily job never repeats one). `skip` holds the people who already got the permit reminder for the same milestone today. */
export async function sendDocumentExpiryPushes(supabase: any, now: Date = new Date(), skip: Map<number, string[]> = new Map()): Promise<SendReport> {
  const total: SendReport = { sent: 0, failed: 0, removed: 0 }; const today = easternDay(now);
  for (const n of DOC_REMINDER_DAYS) {
    try {
      const r = await supabase.from('wallet_documents').select('user_id').eq('expires_on', addDays(today, n)); if (r.error || !Array.isArray(r.data)) continue;
      const already = new Set(skip.get(n) || []); const ids = Array.from(new Set<string>(r.data.map((x: any) => String(x.user_id || '')))).filter((id) => id && !already.has(id));
      const groups: Record<PersonRole, string[]> = { student: [], client: [] };
      for (const id of ids) { const role = await roleOf(supabase, id); if (role) groups[role].push(id); }
      for (const role of ['student', 'client'] as PersonRole[]) { if (!groups[role].length) continue; const rep = await sendToUsers(supabase, groups[role], documentReminder(n, role), now); total.sent += rep.sent; total.failed += rep.failed; total.removed += rep.removed; }
    } catch { /* one milestone failing never stops the others */ }
  }
  return total;
}
export async function sendPermitPushes(supabase: any, byDaysLeft: Map<number, string[]>, now: Date = new Date()): Promise<SendReport> {
  const total: SendReport = { sent: 0, failed: 0, removed: 0 };
  for (const [n, ids] of Array.from(byDaysLeft.entries()) as Array<[number, string[]]>) { const r = await sendToUsers(supabase, ids, permitReminder(n), now); total.sent += r.sent; total.failed += r.failed; total.removed += r.removed; }
  return total;
}
export { classReminder };
export type { Topic };
