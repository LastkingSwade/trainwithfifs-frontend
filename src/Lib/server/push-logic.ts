// Pure rules for push notifications (no network, no database), so they can be tested on their own.
// What a notification may contain: a short generic line. Never a name, an amount, a permit number, a date of birth, or anything about a firearm.

export type Role = 'student' | 'client' | 'staff';
export type PersonRole = 'student' | 'client';
import { STAFF_TOPICS, STAFF_TOPIC_LABELS, type StaffTopic } from '../../pwa/staffTopics';
export { STAFF_TOPICS, STAFF_TOPIC_LABELS };
export type { StaffTopic };
export type Topic = 'class' | 'permit' | 'payment' | 'news' | StaffTopic;
export const TOPICS: readonly Topic[] = ['class', 'permit', 'payment', 'news'];
export const defaultTopicsFor = (role: Role): readonly Topic[] => (role === 'staff' ? STAFF_TOPICS : TOPICS);
/** The topics a person asked for, kept only if they are real topics for that kind of account. */
export function cleanTopics(role: Role, input: unknown): Topic[] {
  const allowed = defaultTopicsFor(role) as readonly string[]; return Array.isArray(input) ? Array.from(new Set(input.map(String))).filter((t) => allowed.includes(t)) as Topic[] : [];
}
export interface PushPayload { title: string; body: string; url: string; tag: string; topic: Topic }

// ---- the device's push address: only the push services the browsers use, over https (so the server can never be pointed at an internal address) ----
const HOSTS: RegExp[] = [/^fcm\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /^[a-z0-9-]+\.push\.services\.mozilla\.com$/, /^web\.push\.apple\.com$/, /^[a-z0-9.-]+\.push\.apple\.com$/, /^[a-z0-9.-]+\.notify\.windows\.com$/];
export function isAllowedEndpoint(raw: unknown): boolean {
  if (typeof raw !== 'string' || raw.length > 600) return false;
  let u: URL; try { u = new URL(raw); } catch { return false; }
  if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443')) return false;
  return HOSTS.some((r) => r.test(u.hostname.toLowerCase()));
}
const B64URL = /^[A-Za-z0-9_-]+$/;
export interface CleanSubscription { endpoint: string; p256dh: string; auth: string }
/** Accepts the browser's PushSubscription JSON ({endpoint, keys:{p256dh, auth}}); anything else is refused. */
export function cleanSubscription(input: unknown): CleanSubscription | null {
  const s = input as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | null;
  if (!s || typeof s !== 'object' || !isAllowedEndpoint(s.endpoint)) return null;
  const p = s.keys && s.keys.p256dh, a = s.keys && s.keys.auth;
  if (typeof p !== 'string' || typeof a !== 'string' || p.length < 80 || p.length > 100 || a.length < 20 || a.length > 30 || !B64URL.test(p) || !B64URL.test(a)) return null;
  return { endpoint: String(s.endpoint), p256dh: p, auth: a };
}
export const MAX_DEVICES_PER_PERSON = 10;

// ---- quiet hours: nothing is sent before 8am or from 8pm Eastern ----
export const SEND_FROM_HOUR = 8, SEND_UNTIL_HOUR = 20;
export function easternHour(now: Date): number {
  try { return Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false }).format(now)) % 24; } catch { return 12; }
}
export const withinSendWindow = (now: Date): boolean => { const h = easternHour(now); return h >= SEND_FROM_HOUR && h < SEND_UNTIL_HOUR; };
export const easternDay = (now: Date): string => now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
export function addDays(day: string, n: number): string { const d = new Date(day + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }

// ---- finding class days in the free text a student's record holds ("Sat, Oct 31, 2026", "10/31/2026", "2026-10-31", with "Day 1: ... | Day 2: ..." lists) ----
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const pad = (n: number) => String(n).padStart(2, '0');
function valid(y: number, m: number, d: number): string | null { if (y < 2020 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null; const t = new Date(Date.UTC(y, m - 1, d)); return t.getUTCMonth() === m - 1 && t.getUTCDate() === d ? `${y}-${pad(m)}-${pad(d)}` : null; }
export function classDaysFrom(...texts: unknown[]): string[] {
  const out = new Set<string>();
  for (const raw of texts) {
    const t = String(raw || ''); if (!t) continue;
    for (const m of Array.from(t.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g))) { const v = valid(+m[1], +m[2], +m[3]); if (v) out.add(v); }
    for (const m of Array.from(t.matchAll(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g))) { const v = valid(+m[3], +m[1], +m[2]); if (v) out.add(v); }
    for (const m of Array.from(t.matchAll(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/gi))) { const v = valid(+m[3], MONTHS.indexOf(m[1].toLowerCase()) + 1, +m[2]); if (v) out.add(v); }
  }
  return Array.from(out).sort();
}

// ---- the messages ----
export const URL_FOR: Record<Role, string> = { student: '/?open=student', client: '/?open=client', staff: '/' };
export function classReminder(when: 'tomorrow' | 'today', balanceDue: boolean): PushPayload {
  return when === 'tomorrow'
    ? { title: '📅 Your class is tomorrow', body: 'Open your Student Portal for what to bring and where to go.' + (balanceDue ? ' 💳 You can pay the rest online there too.' : ''), url: URL_FOR.student, tag: 'class-tomorrow', topic: 'class' }
    : { title: '🎯 Class day', body: 'Your FIFS class is today. Your checklist is in the Student Portal. See you at the range!', url: URL_FOR.student, tag: 'class-today', topic: 'class' };
}
export function permitReminder(daysLeft: number): PushPayload {
  const d = Math.round(daysLeft);
  const body = d <= 7 ? 'Your permit expires in about a week. Open your Client Portal for the next step.' : `About ${d} days until your permit expires. Open your Client Portal to book your renewal class.`;
  return { title: '🛡️ Permit renewal', body, url: URL_FOR.client, tag: 'permit-' + d, topic: 'permit' };
}
export const paymentReceived = (): PushPayload => ({ title: '💵 Payment received', body: 'Coach Kai recorded a payment on your account. Open your Student Portal to see your receipt.', url: URL_FOR.student, tag: 'payment', topic: 'payment' });
/** A short note from Coach Kai: plain text only, control characters and links removed, 140 characters at most. Returns '' if nothing is left. */
export function cleanBroadcast(text: unknown): string {
  return String(text ?? '').replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g, ' ').replace(/https?:\/\/\S+|www\.\S+/gi, '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 140);
}
export const broadcastMessage = (text: string, audience: 'all' | PersonRole): PushPayload => ({ title: '📣 FIFS update', body: text, url: audience === 'client' ? URL_FOR.client : URL_FOR.student, tag: 'news', topic: 'news' });

// ---- Alerts for staff: the same events that go to Discord, as short generic notifications. The alert's own text (it has names, emails and invoice numbers) is NEVER used:
//      the event is recognised from its title and a fixed line is sent instead. Problems are urgent and are sent at any hour; everything else waits for 8am to 8pm Eastern. ----
export interface StaffAlert { topic: StaffTopic; title: string; body: string; urgent: boolean; tag: string }
const HINT = 'Open the Admin Hub for details.';
export function classifyAlert(title: unknown): StaffAlert {
  const t = String(title ?? '');
  const a = (topic: StaffTopic, head: string, body: string, tag: string, urgent = false): StaffAlert => ({ topic, title: head, body, urgent, tag });
  if (/refund/i.test(t)) return a('problems', '⚠️ Refund needed', 'A student paid twice. ' + HINT, 'problem-refund', true);
  if (/amount mismatch/i.test(t)) return a('problems', '⚠️ Payment amount mismatch', 'An invoice was not marked paid. ' + HINT, 'problem-mismatch', true);
  if (/reconcil/i.test(t)) return a('problems', '⚠️ A payment needs checking', HINT, 'problem-reconcile', true);
  if (/checkout blocked/i.test(t)) return a('problems', '⚠️ A checkout was blocked', 'Someone could not start paying. ' + HINT, 'problem-checkout', true);
  if (/abandoned|expired/i.test(t)) return a('bookings', '⏳ Checkout abandoned', 'Someone left before paying. ' + HINT, 'checkout-abandoned');
  if (/^\s*⚠️/.test(t)) return a('problems', '⚠️ Needs your attention', HINT, 'problem', true);
  if (/deposit received/i.test(t)) return a('payments', '💳 Deposit received', HINT, 'pay-deposit');
  if (/payment in full received/i.test(t)) return a('payments', '💳 Payment in full received', HINT, 'pay-full');
  if (/remaining balance paid/i.test(t)) return a('payments', '💳 Balance paid', HINT, 'pay-balance');
  if (/payment recorded in person/i.test(t)) return a('payments', '💵 Payment recorded', HINT, 'pay-inperson');
  if (/voided/i.test(t)) return a('payments', '↩️ Payment voided', HINT, 'pay-void');
  if (/guest checkout|enrollment checkout|seat booking/i.test(t)) return a('bookings', '🎯 New booking started', 'Someone started checkout. ' + HINT, 'booking');
  if (/live chat/i.test(t)) return a('messages', '💬 New chat message', HINT, 'msg-chat');
  if (/contact form/i.test(t)) return a('messages', '📩 New contact inquiry', HINT, 'msg-contact');
  if (/guide lead/i.test(t)) return a('messages', '📥 New guide download', HINT, 'msg-guide');
  if (/multi-state.*all steps/i.test(t)) return a('progress', '🎉 Multi-state: all steps done', HINT, 'progress-complete');
  if (/multi-state/i.test(t)) return a('progress', '🧭 Multi-state progress', HINT, 'progress-ms');
  if (/quiz reward/i.test(t)) return a('progress', '🎯 Quiz reward used', HINT, 'progress-quiz');
  if (/visiting/i.test(t)) return a('visits', '🌐 Someone is on the website', HINT, 'visit');
  return a('progress', '🔔 FIFS alert', HINT, 'alert');
}
export const alertPayload = (al: StaffAlert): PushPayload => ({ title: al.title, body: al.body, url: URL_FOR.staff, tag: al.tag, topic: al.topic });
