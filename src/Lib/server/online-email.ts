import { RANGE_LOCATION, cleanCourse } from '@/group/groupCopy';
import { DAY2_STATEMENT, ONLINE_NAME, TECH_REQUIREMENTS } from '@/online/onlineCopy';

// Emails for the Live Online Classroom: booking confirmation (after payment) and the class reminder. Plain, escaped, best effort.
const SENDER_EMAIL = process.env.RESEND_FROM_EMAIL || 'Train With FIFS <onboarding@trainwithfifs.com>';
const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
export const when = (iso: string) => new Date(iso).toLocaleString('en-US', { timeZone: 'America/New_York', weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });

export interface OnlineMailMeta { name?: string; course?: string; classroomAt?: string; rangeAt?: string; meetingUrl?: string }
type Mail = { subject: string; html: string; text: string };

function shell(inner: string): string { return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#111;line-height:1.5;">${inner}<p style="font-size:14px;">Train With FIFS</p></div>`; }

export function buildOnlineConfirmation(m: OnlineMailMeta): Mail {
  const course = cleanCourse(m.course); const first = String(m.name || '').trim().split(/\s+/)[0];
  const lines = [
    `${ONLINE_NAME}: ${course}`,
    m.classroomAt ? `Live classroom (over video): ${when(m.classroomAt)}` : '',
    m.rangeAt ? `Day 2 range day (IN PERSON at ${RANGE_LOCATION}): ${when(m.rangeAt)}` : '',
  ].filter(Boolean);
  const text = `${first ? `Hi ${first},` : 'Hi,'}\n\nYou are booked.\n\n${lines.join('\n')}\n\n${DAY2_STATEMENT} Day 2 is mandatory and you must attend it in person. Your certificate and completion are held until Day 2 attendance is recorded.\n\n${TECH_REQUIREMENTS}\n\n${m.meetingUrl ? `Join link for the live classroom: ${m.meetingUrl}\n(It is also in your Student Portal.)\n\n` : 'Your join link will be in your Student Portal.\n\n'}Questions? Call 443-990-1304.`;
  const html = shell(`<p>${first ? `Hi ${esc(first)},` : 'Hi,'}</p><p>You are booked.</p><p>${lines.map(esc).join('<br>')}</p>
    <p style="border-left:4px solid #d49000;padding:6px 12px;background:#fff8e6;"><strong>${esc(DAY2_STATEMENT)} Day 2 is mandatory and you must attend it in person.</strong> Your certificate and completion are held until Day 2 attendance is recorded.</p>
    <p>${esc(TECH_REQUIREMENTS)}</p>${m.meetingUrl ? `<p><a href="${esc(m.meetingUrl)}">Join the live classroom</a> (it is also in your Student Portal).</p>` : '<p>Your join link will be in your Student Portal.</p>'}<p style="font-size:14px;">Questions? Call 443-990-1304.</p>`);
  return { subject: `You are booked: ${course} (live online classroom + in-person range day)`, html, text };
}

export function buildOnlineReminder(m: OnlineMailMeta & { kind: 'classroom' | 'range' }): Mail {
  const course = cleanCourse(m.course);
  const body = m.kind === 'classroom'
    ? `Your live online classroom for ${course} is ${m.classroomAt ? when(m.classroomAt) : 'coming up'}. ${TECH_REQUIREMENTS}${m.meetingUrl ? ` Join here: ${m.meetingUrl}` : ' Your join link is in your Student Portal.'}`
    : `Your in-person Day 2 range day for ${course} is ${m.rangeAt ? when(m.rangeAt) : 'coming up'} at ${RANGE_LOCATION}. Day 2 is mandatory and in person. Bring your photo ID.`;
  return { subject: m.kind === 'classroom' ? `Reminder: live online classroom (${course})` : `Reminder: in-person range day (${course})`, text: body, html: shell(`<p>${esc(body)}</p>`) };
}

export async function sendOnlineEmail(to: string, mail: Mail): Promise<boolean> {
  try {
    const key = process.env.RESEND_API_KEY; const address = String(to || '').trim();
    if (!key || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(address)) return false;
    const res = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: SENDER_EMAIL, to: [address], subject: mail.subject, html: mail.html, text: mail.text }) });
    if (!res.ok) console.warn('[OnlineEmail] Resend rejected the message:', res.status);
    return res.ok;
  } catch (err: any) { console.warn('[OnlineEmail] Not sent:', err?.message || 'unknown error'); return false; }
}

/** After payment: confirmation to the person who booked, with both dates and (because they paid) the join link. Best effort. */
export async function sendOnlineConfirmationForSession(supabase: any, session: { customer_email?: string | null; customer_details?: { email?: string | null } | null; metadata?: Record<string, string> | null }): Promise<boolean> {
  try {
    const md = session.metadata || {};
    const to = session.customer_email || session.customer_details?.email || '';
    const ids = [md.classroomSessionId, md.rangeSessionId].filter(Boolean) as string[];
    if (!to || ids.length !== 2) return false;
    const { data, error } = await supabase.from('class_sessions').select('id, kind, starts_at, meeting_url').in('id', ids);
    if (error || !Array.isArray(data)) return false;
    const room = data.find((r: any) => r.kind === 'classroom'), range = data.find((r: any) => r.kind === 'range');
    return await sendOnlineEmail(to, buildOnlineConfirmation({ name: md.fullName, course: md.courseSelection, classroomAt: room?.starts_at, rangeAt: range?.starts_at, meetingUrl: room?.meeting_url || '' }));
  } catch (err: any) { console.warn('[OnlineEmail] Confirmation not sent:', err?.message); return false; }
}
