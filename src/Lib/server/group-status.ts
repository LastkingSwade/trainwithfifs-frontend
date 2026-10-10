import { createHmac, timingSafeEqual } from 'crypto';
import { CODE_PATTERN, SITE_URL, cleanCourse } from '@/group/groupCopy';

// Organizer view for a group booking. The organizer has no account, so their confirmation email carries a private link whose token only
// the server can make (an HMAC of the group code under a server secret). Nothing is stored for it. The view shows seat counts and,
// for each person who started booking with the code, a masked email and a payment state: never a full email, phone or name.

const secret = () => process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export function groupLinkToken(code: string): string {
  const key = secret();
  if (!key) return '';
  return createHmac('sha256', key).update(`fifs-group-link:v1:${code}`).digest('base64url').slice(0, 32);
}

export function verifyGroupLinkToken(code: unknown, token: unknown): boolean {
  const c = String(code ?? '').trim().toUpperCase();
  const t = String(token ?? '');
  const expected = groupLinkToken(c);
  if (!CODE_PATTERN.test(c) || !expected || t.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(t), Buffer.from(expected));
}

export function groupManageUrl(code: string, base: string = SITE_URL): string {
  const token = groupLinkToken(code);
  return token ? `${base}/?group=${encodeURIComponent(code)}&gt=${encodeURIComponent(token)}` : '';
}

export function maskEmail(email: unknown): string {
  const [user, domain] = String(email ?? '').trim().split('@');
  if (!user || !domain) return 'an email on file';
  return `${user.slice(0, 1)}***@${domain}`;
}

const STATE: Record<string, string> = { PAID: 'Paid in full', DEPOSIT_PAID: 'Deposit paid', PENDING: 'Started, waiting for payment' };

export interface GroupStatus {
  course: string; dates: string; seatsTotal: number; seatsTaken: number; seatsOpen: number;
  members: Array<{ label: string; state: string; organizer: boolean }> | null;
}
export type GroupStatusResult = { ok: true; status: GroupStatus; pendingEmails: string[] } | { ok: false; status: number; message: string };

/** Best effort: records which group a booking belongs to. Never throws and never blocks a booking (the column may not exist yet). */
export async function recordPodCodeOnInvoice(supabase: any, invoiceNumber: unknown, code: unknown): Promise<boolean> {
  try {
    const c = String(code ?? '').trim().toUpperCase();
    if (!CODE_PATTERN.test(c) || !invoiceNumber) return false;
    const { error } = await supabase.from('invoices').update({ pod_code: c }).eq('invoice_number', String(invoiceNumber));
    if (error) { console.warn('[Group] Could not record the group code on the invoice:', error.code || 'no code'); return false; }
    return true;
  } catch (err: any) {
    console.warn('[Group] Group code not recorded:', err?.message || 'unknown error');
    return false;
  }
}

export async function getGroupStatus(supabase: any, rawCode: unknown): Promise<GroupStatusResult> {
  const code = String(rawCode ?? '').trim().toUpperCase();
  if (!CODE_PATTERN.test(code)) return { ok: false, status: 400, message: 'This link is not valid.' };
  try {
    const { data: group, error } = await supabase.from('booking_groups').select('course, preferred_dates, max_seats, claimed_seats, status').eq('invite_code', code).maybeSingle();
    if (error) return { ok: false, status: 503, message: 'The group view is not available right now. Please try again in a few minutes.' };
    if (!group) return { ok: false, status: 404, message: 'This group was not found.' };
    const total = Number(group.max_seats) || 0;
    const taken = Number(group.claimed_seats) || 0;
    let members: GroupStatus['members'] = null;
    let pendingEmails: string[] = [];
    const inv = await supabase.from('invoices').select('email, status, created_at').eq('pod_code', code).order('created_at', { ascending: true });
    if (!inv.error && Array.isArray(inv.data)) {
      const live = inv.data.filter((r: any) => STATE[String(r.status)]);
      members = live.map((r: any, i: number) => ({ label: maskEmail(r.email), state: STATE[String(r.status)], organizer: i === 0 }));
      pendingEmails = live.filter((r: any, i: number) => i > 0 && String(r.status) === 'PENDING' && r.email).map((r: any) => String(r.email));
    }
    return { ok: true, pendingEmails, status: { course: cleanCourse(group.course), dates: String(group.preferred_dates || ''), seatsTotal: total, seatsTaken: taken, seatsOpen: Math.max(total - taken, 0), members } };
  } catch (err: any) {
    console.warn('[Group] Status unavailable:', err?.message);
    return { ok: false, status: 503, message: 'The group view is not available right now. Please try again in a few minutes.' };
  }
}

/** Emails a nudge to the people who started booking but have not paid (at most 5 per request). Returns how many were sent. */
export async function remindGroup(supabase: any, rawCode: unknown, send: (to: string, meta: { code: string; course: string; dates: string }) => Promise<boolean>): Promise<{ ok: true; sent: number; waiting: number } | { ok: false; status: number; message: string }> {
  const result = await getGroupStatus(supabase, rawCode);
  if (!result.ok) return result;
  const code = String(rawCode).trim().toUpperCase();
  const targets = Array.from(new Set(result.pendingEmails.map((e) => e.toLowerCase()))).slice(0, 5);
  let sent = 0;
  for (const to of targets) { if (await send(to, { code, course: result.status.course, dates: result.status.dates })) sent += 1; }
  return { ok: true, sent, waiting: targets.length };
}
