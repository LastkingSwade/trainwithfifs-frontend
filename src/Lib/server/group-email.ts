import { groupManageUrl } from '@/Lib/server/group-status';
import { CODE_PATTERN, CONTACT_EMAIL, CONTACT_PHONE, GROUP_STEPS, RANGE_LOCATION, SITE_URL, buildShareMessage, cleanCourse } from '@/group/groupCopy';

// Confirmation email for the person who booked a group: their group code, the four steps, and a block they can forward as it is.
// Sent once, right after the payment is applied. Best effort: it never throws and never changes the payment result.
const SENDER_EMAIL = process.env.RESEND_FROM_EMAIL || 'Train With FIFS <onboarding@trainwithfifs.com>';

export interface GroupEmailMeta { code: string; course?: string; dates?: string; size?: number; name?: string; manageUrl?: string }

const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

export function buildGroupCodeEmail(meta: GroupEmailMeta): { subject: string; html: string; text: string } {
  const course = cleanCourse(meta.course);
  const invite = buildShareMessage({ code: meta.code, course: meta.course, dates: meta.dates });
  const first = String(meta.name || '').trim().split(/\s+/)[0];
  const subject = `Your group code for ${course}: ${meta.code}`;
  const steps = GROUP_STEPS.map((s, i) => `<li style="margin:4px 0;">${esc(s)}${i < 2 ? ' (done)' : ''}</li>`).join('');
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#111;line-height:1.5;">
  <p>${first ? `Hi ${esc(first)},` : 'Hi,'}</p>
  <p>Your payment is in and your seat${meta.size && meta.size > 1 ? 's are' : ' is'} reserved for <strong>${esc(course)}</strong>${meta.dates ? ` (${esc(meta.dates)})` : ''}. Next step: get your party in.</p>
  <p style="margin:18px 0 4px;font-size:13px;color:#555;">YOUR GROUP CODE (ALSO CALLED A POD CODE)</p>
  <p style="font-family:Consolas,Menlo,monospace;font-size:28px;font-weight:bold;letter-spacing:2px;margin:0 0 16px;">${esc(meta.code)}</p>
  <ol style="padding-left:20px;margin:0 0 18px;">${steps}</ol>
  <p><strong>Forward this part to your party:</strong></p>
  <div style="border:1px solid #bbb;border-radius:8px;padding:12px 14px;background:#f6f6f6;white-space:pre-line;">${esc(invite)}</div>
  ${meta.manageUrl ? `<p style="font-size:14px;"><a href="${esc(meta.manageUrl)}">See who has joined your group</a> (private link, keep it to yourself).</p>` : ''}
  <p style="margin-top:18px;font-size:14px;">Lost the code, someone cancelled, or you need to add a person? Call ${esc(CONTACT_PHONE)} or reply to ${esc(CONTACT_EMAIL)}. The code works until every seat is taken. Class location: ${esc(RANGE_LOCATION)}.</p>
  <p style="font-size:14px;">Train With FIFS</p>
</div>`;
  const text = `${first ? `Hi ${first},` : 'Hi,'}\n\nYour payment is in. Your group code (also called a pod code): ${meta.code}\n\nSteps: ${GROUP_STEPS.join(' > ')}\n\nForward this part to your party:\n\n${invite}\n\n${meta.manageUrl ? `See who has joined (private link): ${meta.manageUrl}\n\n` : ''}Lost the code, someone cancelled, or you need to add a person? Call ${CONTACT_PHONE} or email ${CONTACT_EMAIL}.`;
  return { subject, html, text };
}

export async function sendGroupCodeEmail(to: string, meta: GroupEmailMeta): Promise<boolean> {
  try {
    const key = process.env.RESEND_API_KEY;
    const address = String(to || '').trim();
    if (!key || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(address) || !CODE_PATTERN.test(meta.code)) return false;
    const mail = buildGroupCodeEmail({ ...meta, manageUrl: meta.manageUrl ?? (groupManageUrl(meta.code) || undefined) });
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: SENDER_EMAIL, to: [address], subject: mail.subject, html: mail.html, text: mail.text }),
    });
    if (!res.ok) { console.warn('[GroupEmail] Resend rejected the message:', res.status); return false; }
    return true;
  } catch (err: any) {
    console.warn('[GroupEmail] Not sent:', err?.message || 'unknown error');
    return false;
  }
}

// Nudge for someone who started booking with a group code but has not paid yet.
export function buildGroupReminderEmail(meta: { code: string; course?: string; dates?: string }): { subject: string; html: string; text: string } {
  const course = cleanCourse(meta.course);
  const when = meta.dates ? ` on ${meta.dates}` : '';
  const subject = `Your seat in ${course} is not finished yet`;
  const body = `You started booking ${course}${when} with a group code, but the payment is not finished, so your seat is not held. To finish: go to ${SITE_URL}, tap Start Your Journey, then Book Now, type the group code ${meta.code} in the Group Code box and tap Apply. Questions? Call ${CONTACT_PHONE}.`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#111;line-height:1.5;"><p>Hi,</p><p>${esc(body)}</p><p style="font-family:Consolas,Menlo,monospace;font-size:24px;font-weight:bold;letter-spacing:2px;">${esc(meta.code)}</p><p style="font-size:14px;">Train With FIFS</p></div>`;
  return { subject, html, text: body };
}
export async function sendGroupReminderEmail(to: string, meta: { code: string; course?: string; dates?: string }): Promise<boolean> {
  try {
    const key = process.env.RESEND_API_KEY;
    const address = String(to || '').trim();
    if (!key || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(address) || !CODE_PATTERN.test(meta.code)) return false;
    const mail = buildGroupReminderEmail(meta);
    const res = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: SENDER_EMAIL, to: [address], subject: mail.subject, html: mail.html, text: mail.text }) });
    return res.ok;
  } catch { return false; }
}
