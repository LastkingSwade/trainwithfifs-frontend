import crypto from 'crypto';
import { resolveSiteUrl } from '@/Lib/config/environment';
import { sendOnlineEmail } from '@/Lib/server/online-email';
import { cleanCourse } from '@/group/groupCopy';

// Student Portal access for people who book without signing in. The password is NOT collected on the booking form. Once the payment is
// confirmed, the paying person gets an email with a secure, time-limited link to create their own password; they cannot use the portal
// until they do. Rules:
//  - nothing is created before payment, and only from the signature-verified Stripe session;
//  - a person who already has a student or client record, or a sign-in, is never touched (no second account, no password change);
//  - a random throw-away password initialises the sign-in; it is never emailed, stored or returned;
//  - best effort: nothing here can fail or change a payment (the function never throws).
export type AccessResult = 'created' | 'skipped-linked' | 'skipped-existing' | 'skipped-no-email' | 'skipped-not-paid' | 'failed';
const GUEST = 'GUEST-CHECKOUT';
const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
const likeEscape = (v: string) => v.replace(/[\\%_]/g, (c) => '\\' + c);

export interface AccessDeps { sendMail?: (to: string, mail: { subject: string; html: string; text: string }) => Promise<boolean>; siteUrl?: () => string }

export function buildSetupMail(m: { name?: string; course?: string; link: string }) {
  const first = String(m.name || '').trim().split(/\s+/)[0]; const course = cleanCourse(m.course);
  const hi = first ? `Hi ${first},` : 'Hi,';
  const text = `${hi}\n\nThank you for booking ${course}. Your payment is confirmed.\n\nCreate the password for your Student Portal here (the link is time-limited and only for you):\n${m.link}\n\nYou need this password to open your Student Portal, where you will find your class details, checklist and receipts. Please do not share the link.\n\nQuestions? Call 443-990-1304.`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#111;line-height:1.5;"><p>${esc(hi)}</p>
    <p>Thank you for booking <strong>${esc(course)}</strong>. Your payment is confirmed.</p>
    <p>Create the password for your Student Portal with the secure link below. It is time-limited and only for you.</p>
    <p><a href="${esc(m.link)}" style="display:inline-block;background:#ffb703;color:#000;padding:12px 24px;text-decoration:none;font-weight:bold;border-radius:4px;">Create my portal password</a></p>
    <p>You need this password to open your Student Portal, where you will find your class details, checklist and receipts. Please do not share the link.</p>
    <p style="font-size:14px;">Questions? Call 443-990-1304.</p><p style="font-size:14px;">Train With FIFS</p></div>`;
  return { subject: `Create your Student Portal password: ${course}`, html, text };
}

const randomPassword = () => crypto.randomBytes(24).toString('base64url');
const newStudentId = () => `FIFS-${crypto.randomInt(1000, 10000)}`;

export async function ensurePortalAccessAfterPayment(supabase: any, session: { customer_email?: string | null; customer_details?: { email?: string | null } | null; metadata?: Record<string, string> | null }, deps: AccessDeps = {}): Promise<AccessResult> {
  try {
    const md = session.metadata || {};
    if (md.linkedUserId) return 'skipped-linked';                       // they booked while signed in: they already have a login
    const email = String(session.customer_email || session.customer_details?.email || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return 'skipped-no-email';
    const invoiceNumber = String(md.invoiceId || '');
    if (!/^INV-[A-Za-z0-9-]{3,40}$/.test(invoiceNumber)) return 'skipped-no-email';

    // Only a recorded payment creates anything.
    const inv = await supabase.from('invoices').select('invoice_number, status').eq('invoice_number', invoiceNumber).maybeSingle();
    if (inv.error || !inv.data || !['PAID', 'DEPOSIT_PAID'].includes(String(inv.data.status))) return 'skipped-not-paid';

    // Anyone who already has a record is left alone (a second sign-in for the same email would split their data).
    for (const table of ['students', 'clients']) {
      const r = await supabase.from(table).select('id').ilike('email', likeEscape(email)).limit(1);
      if (r.error) { console.warn('[Portal access] lookup failed, nothing created'); return 'failed'; }
      if (Array.isArray(r.data) && r.data.length) return 'skipped-existing';
    }

    const siteUrl = (deps.siteUrl || resolveSiteUrl)();
    const fullName = String(md.fullName || 'FIFS Student').trim().slice(0, 100);
    const phone = String(md.phone || '').trim().slice(0, 30);
    const courseName = String(md.courseSelection || 'Maryland Firearms Training').trim().slice(0, 200);
    const dates = String(md.preferredDates || 'Upcoming Session').trim().slice(0, 200);

    const created = await supabase.auth.admin.createUser({ email, password: randomPassword(), email_confirm: true, app_metadata: { role: 'student' }, user_metadata: { full_name: fullName, phone } });
    const userId = created?.data?.user?.id;
    if (created?.error || !userId) {
      // "already registered" means a sign-in exists without a record: leave it alone.
      if (/already|exists|registered/i.test(String(created?.error?.message || '') + String(created?.error?.code || ''))) return 'skipped-existing';
      console.warn('[Portal access] sign-in not created:', created?.error?.code || 'no code');
      return 'failed';
    }

    const now = new Date().toISOString(); let studentId = ''; let inserted = false;
    for (let attempt = 0; attempt < 5 && !inserted; attempt += 1) {
      studentId = newStudentId();
      const ins = await supabase.from('students').insert({ user_id: userId, student_id: studentId, full_name: fullName, email, phone: phone || '', course_name: courseName, course_selection: courseName, preferred_dates: dates, status: 'CONFIRMED', must_change_password: true, temp_password_reset: true, created_at: now, updated_at: now });
      if (!ins.error) inserted = true; else if (ins.error.code !== '23505') break;
    }
    if (!inserted) {
      await supabase.auth.admin.deleteUser(userId);                      // never leave a sign-in without a record
      console.warn('[Portal access] record not saved; sign-in removed');
      return 'failed';
    }
    // The receipt moves from the shared guest record to the student, so it shows in their portal.
    await supabase.from('invoices').update({ student_id: studentId, updated_at: now }).eq('invoice_number', invoiceNumber).eq('student_id', GUEST);

    const link = await supabase.auth.admin.generateLink({ type: 'recovery', email, options: { redirectTo: new URL('/?portal=student', siteUrl).toString() } });
    const action = link?.data?.properties?.action_link;
    if (link?.error || !action) { console.warn('[Portal access] setup link not created (staff can use Setup link on the roster)'); return 'created'; }
    const sent = await (deps.sendMail || sendOnlineEmail)(email, buildSetupMail({ name: fullName, course: courseName, link: action }));
    if (!sent) console.warn('[Portal access] setup email not sent (staff can use Setup link on the roster)');
    return 'created';
  } catch (err: any) {
    console.warn('[Portal access] unavailable:', err?.message || 'unknown error');
    return 'failed';
  }
}
