import { RANGE_LOCATION } from '@/group/groupCopy';

// Permit-expiry reminder emails. Sent by the daily cron to clients who opted in to reminders, exactly 120, 90, 30 and 7 days before the
// expiration date they entered. Plain, escaped, no legal advice: the official State Police page is linked for what applies to them.
export const REMINDER_DAYS = [120, 90, 30, 7] as const;
const OFFICIAL = 'https://mdsp.maryland.gov/firearms-permits-professional-licenses/wear-carry-permit';
const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
export const prettyDate = (day: string) => new Date(day + 'T12:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
export const addDays = (day: string, n: number) => new Date(Date.parse(day + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10);

const LINES: Record<number, string> = {
  120: 'This is a good time to book your renewal class. Classes fill up, and the State Police can take up to 90 days to process an application.',
  90: 'Processing can take up to 90 days, so please book your renewal class and apply now.',
  30: 'Your permit expires in 30 days. If you have not applied yet, please book your renewal class this week and call us if you need help.',
  7: 'Your permit expires in 7 days. Please call us today at 443-990-1304 so we can point you to the right next step.',
};

export function buildPermitReminder(m: { name?: string; expiresOn: string; daysLeft: number }): { subject: string; html: string; text: string } {
  const first = String(m.name || '').trim().split(/\s+/)[0];
  const hi = first ? `Hi ${first},` : 'Hi,';
  const body = LINES[m.daysLeft] || LINES[30];
  const when = prettyDate(m.expiresOn);
  const text = `${hi}\n\nYour permit on file expires on ${when} (${m.daysLeft} days from now).\n\n${body}\n\nBook a renewal class: https://trainwithfifs.com\nOfficial State Police information: ${OFFICIAL}\nQuestions? Call 443-990-1304. Classes are held at ${RANGE_LOCATION}.\n\nYou are getting this because you chose permit reminders in your client profile. To stop them, turn off reminders in your profile or call us.`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#111;line-height:1.5;"><p>${esc(hi)}</p>
    <p>Your permit on file expires on <strong>${esc(when)}</strong> (${m.daysLeft} days from now).</p><p>${esc(body)}</p>
    <p><a href="https://trainwithfifs.com">Book a renewal class</a><br><a href="${OFFICIAL}">Official State Police information</a></p>
    <p style="font-size:14px;">Questions? Call 443-990-1304.</p>
    <p style="font-size:12px;color:#555;">You are getting this because you chose permit reminders in your client profile. To stop them, turn off reminders in your profile or call us.</p>
    <p style="font-size:14px;">Train With FIFS</p></div>`;
  return { subject: m.daysLeft <= 7 ? `Your permit expires in ${m.daysLeft} days` : `Your permit expires in ${m.daysLeft} days: time to plan your renewal`, html, text };
}
