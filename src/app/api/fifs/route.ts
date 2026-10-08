import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getAuthenticatedUser, getPrivilegedClient, getPublicClient } from '@/Lib/server/supabase-admin';
import { createBookingCheckout } from '@/Lib/server/booking-checkout';
import { ConfigurationError, resolveSiteUrl } from '@/Lib/config/environment';


const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'carpetcare85@gmail.com';
const SENDER_EMAIL = process.env.RESEND_FROM_EMAIL || 'Train With FIFS <onboarding@trainwithfifs.com>';


// --- Cryptographically Secure 12-char OTP Generator ---
function generateSecureTempPassword(): string {
 const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
 const len = 12;
 try {
   if (typeof crypto !== 'undefined' && crypto && typeof crypto.randomBytes === 'function') {
     const buf = crypto.randomBytes(len);
     let res = '';
     for (let i = 0; i < len; i++) {
       res += chars[buf[i] % chars.length];
     }
     return res;
   }
 } catch (_e) {}


 if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
   const arr = new Uint8Array(len);
   globalThis.crypto.getRandomValues(arr);
   let res = '';
   for (let i = 0; i < len; i++) {
     res += chars[arr[i] % chars.length];
   }
   return res;
 }


 throw new Error('Cryptographically secure CSPRNG (crypto.randomBytes or getRandomValues) is unavailable.');
}


// --- Strict Password Validator ---
function validateStrictPassword(password: string): { valid: boolean; error?: string } {
 if (!password || password.length < 12) {
   return { valid: false, error: 'Password must be at least 12 characters long.' };
 }
 if (!/[A-Z]/.test(password)) {
   return { valid: false, error: 'Password must include at least one uppercase letter.' };
 }
 if (!/[a-z]/.test(password)) {
   return { valid: false, error: 'Password must include at least one lowercase letter.' };
 }
 if (!/[0-9]/.test(password)) {
   return { valid: false, error: 'Password must include at least one number.' };
 }
 if (!/[!@#$%^&*()_+\-=\[\]{};':"\|,.<>\/?]/.test(password)) {
   return { valid: false, error: 'Password must include at least one special character (!@#$%^&*).' };
 }
 return { valid: true };
}


// Actions the portal UI calls that have no server-side persistence yet. They fail explicitly
// (501) so the UI cannot report a change as saved when nothing was stored.
const NOT_IMPLEMENTED_ACTIONS: Record<string, string> = {
  adminEditClient: 'Saving client record edits',
  saveStudentScoresheet: 'Saving qualification scoresheets',
  deleteStudentScoresheet: 'Removing qualification scoresheets',
  submitStudentWaiver: 'Online waiver submission',
  handleLeadMagnetSubmission: 'Lead capture for the free guide'
};

// --- Student record edit validation (adminEditStudent, updateStudentStatus, updateStudentTask) ---
const STUDENT_STATUS_ALLOWLIST = [
  'STEP_1_REGISTERED', 'STEP_2_CONFIRMED', 'STEP_3_PREPARATION', 'STEP_4_CLASSROOM',
  'STEP_5_LIVE_FIRE', 'STEP_6_CERTIFIED', 'STEP_7_MSP_PORTAL', 'STEP_8_LICENSED'
];
const PREP_TASK_KEYS = ['transport_law', 'ammo_acquired', 'eye_ear_pro', 'id_ready'];
const STUDENT_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

// Every key adminEditStudent understands, mapped to the column it may change. Anything else is rejected,
// so identity, role, and credential columns can never be written through this action.
const ADMIN_EDIT_STUDENT_FIELDS: Record<string, string> = {
  fullName: 'full_name', full_name: 'full_name',
  phone: 'phone',
  courseSelection: 'course_selection', course_selection: 'course_selection',
  assignedDate: 'assigned_date', assigned_date: 'assigned_date', classDate: 'assigned_date', preferredDates: 'assigned_date',
  status: 'status',
  qualificationScore: 'qualification_score', qualification_score: 'qualification_score',
  profileDocUrl: 'profile_doc_url', profile_doc_url: 'profile_doc_url', dossierUrl: 'profile_doc_url', dossier_url: 'profile_doc_url',
  notes: 'internal_notes'
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

type FieldCheck = { ok: true; value: string | null } | { ok: false; error: string };

function checkText(label: string, raw: unknown, maxLength: number, opts: { required?: boolean; multiline?: boolean } = {}): FieldCheck {
  if (typeof raw !== 'string') return { ok: false, error: `${label} must be text.` };
  const value = raw.trim();
  if (!value) return opts.required ? { ok: false, error: `${label} cannot be empty.` } : { ok: true, value: null };
  if (value.length > maxLength) return { ok: false, error: `${label} must be ${maxLength} characters or fewer.` };
  const probe = opts.multiline ? value.replace(/[\n\r\t]/g, ' ') : value;
  if (CONTROL_CHARS.test(probe)) return { ok: false, error: `${label} contains characters that are not allowed.` };
  return { ok: true, value };
}

// '' and '#' (the UI's "no document" placeholder) clear the link; anything else must be a plain http(s) URL.
function checkDocumentUrl(raw: unknown): FieldCheck {
  if (typeof raw !== 'string') return { ok: false, error: 'Document link must be text.' };
  const value = raw.trim();
  if (value === '' || value === '#') return { ok: true, value: null };
  if (value.length > 2048 || /\s/.test(value) || CONTROL_CHARS.test(value) || !/^https?:\/\//i.test(value)) {
    return { ok: false, error: 'Document link must be a valid http:// or https:// URL.' };
  }
  try {
    const parsed = new URL(value);
    if ((parsed.protocol !== 'http:' && parsed.protocol !== 'https:') || parsed.username || parsed.password || !parsed.hostname) {
      return { ok: false, error: 'Document link must be a valid http:// or https:// URL.' };
    }
  } catch {
    return { ok: false, error: 'Document link must be a valid http:// or https:// URL.' };
  }
  return { ok: true, value };
}

function checkStudentStatus(raw: unknown): FieldCheck {
  if (typeof raw !== 'string' || !STUDENT_STATUS_ALLOWLIST.includes(raw.trim())) {
    return { ok: false, error: 'Status must be one of: ' + STUDENT_STATUS_ALLOWLIST.join(', ') + '.' };
  }
  return { ok: true, value: raw.trim() };
}

// Authorize staff solely from verified user's app_metadata.role
function isStaffOrAdmin(user: any): boolean {
  if (!user || !user.app_metadata) return false;
  const role = String(user.app_metadata.role || user.app_metadata.roles || '').toLowerCase().trim();
  return role === 'admin' || role === 'instructor' || role === 'staff';
}

function isAdmin(user: any): boolean {
  if (!user || !user.app_metadata) return false;
  const role = String(user.app_metadata.role || user.app_metadata.roles || '').toLowerCase().trim();
  return role === 'admin';
}

// --- Cryptographically Strong Thread Credential Verification for Visitor Chat ---
function getChatHmacSecret(): string {
  // Dedicated secret only; never reuse the Supabase service-role key.
  const secret = (process.env.CHAT_HMAC_SECRET || '').trim();
  if (!secret || secret.length < 32) {
    throw new ConfigurationError('A dedicated CHAT_HMAC_SECRET of at least 32 characters is required.');
  }
  return secret;
}

// Constant-time comparison for shared secrets of any length (both sides hashed to 32 bytes).
function secretsMatch(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected) return false;
  const a = crypto.createHash('sha256').update(provided).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function computeThreadSecret(threadId: string): string {
  const secret = getChatHmacSecret();
  return crypto.createHmac('sha256', secret).update(threadId).digest('hex');
}

function verifyThreadSecret(threadId: string, providedSecret?: string): boolean {
  if (!threadId || !providedSecret) return false;
  // A missing or weak CHAT_HMAC_SECRET throws ConfigurationError here; it is never treated as a
  // merely invalid credential, so callers report a server configuration error.
  const expected = computeThreadSecret(threadId);
  try {
    const b1 = Buffer.from(providedSecret, 'hex');
    const b2 = Buffer.from(expected, 'hex');
    return b1.length === b2.length && crypto.timingSafeEqual(b1, b2);
  } catch {
    return false;
  }
}


// --- ICS Calendar Generator (RFC 5545) ---
function formatIcsDate(d: Date): string {
 return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}


function generateIcsCalendar(params: {
 title: string;
 description: string;
 startDate: Date;
 durationHours: number;
 location?: string;
}): string {
 const start = formatIcsDate(params.startDate);
 const endDate = new Date(params.startDate.getTime() + (params.durationHours || 8) * 3600000);
 const end = formatIcsDate(endDate);
 const now = formatIcsDate(new Date());
 const uid = 'fifs-class-' + params.startDate.getTime() + '-' + Math.floor(Math.random() * 100000) + '@trainwithfifs.com';
 const loc = (params.location || 'Future Initiative Firearm Services Training Center, Maryland').replace(/,/g, '\,');
 const cleanSummary = (params.title || 'FIFS Firearms Course').split(String.fromCharCode(10)).join(' ').split(String.fromCharCode(13)).join('');
 const cleanDesc = (params.description || '').split(String.fromCharCode(10)).join('\n').split(String.fromCharCode(13)).join('');


 return [
   'BEGIN:VCALENDAR',
   'VERSION:2.0',
   'PRODID:-//Train with FIFS//Course Scheduler//EN',
   'CALSCALE:GREGORIAN',
   'METHOD:REQUEST',
   'BEGIN:VEVENT',
   'UID:' + uid,
   'DTSTAMP:' + now,
   'DTSTART:' + start,
   'DTEND:' + end,
   'SUMMARY:' + cleanSummary,
   'DESCRIPTION:' + cleanDesc,
   'LOCATION:' + loc,
   'STATUS:CONFIRMED',
   'SEQUENCE:0',
   'BEGIN:VALARM',
   'TRIGGER:-PT24H',
   'ACTION:DISPLAY',
   'DESCRIPTION:Reminder: 24 Hours until your FIFS Firearms Qualification Course',
   'END:VALARM',
   'END:VEVENT',
   'END:VCALENDAR'
 ].join(String.fromCharCode(13, 10));
}


// --- Dynamic Storage Signed URL (7 Days / 604,800s) ---
async function getSignedDocumentUrl(supabase: any, path?: string | null): Promise<string | null> {
 if (!path) return null;
 try {
   const { data, error } = await supabase.storage.from('course-materials').createSignedUrl(path, 604800);
   if (error || !data?.signedUrl) {
     console.warn('[Storage] Signed URL error for', path, error?.message);
     return null;
   }
   return data.signedUrl;
 } catch (err: any) {
   console.warn('[Storage] Exception fetching signed URL:', err?.message);
   return null;
 }
}


// --- Resend Dispatch Helper ---
interface ResendAttachment {
 filename: string;
 content: string; // base64 string
}


async function sendResendEmail(params: {
 to: string | string[];
 subject: string;
 html: string;
 attachments?: ResendAttachment[];
}): Promise<{ success: boolean; error?: string }> {
 const resendKey = process.env.RESEND_API_KEY;
 if (!resendKey) {
   console.warn('[Resend] RESEND_API_KEY is not configured in environment.');
   return { success: false, error: 'RESEND_API_KEY environment variable missing' };
 }


 const recipients = Array.isArray(params.to) ? params.to : [params.to];
 const bodyPayload: any = {
   from: SENDER_EMAIL,
   to: recipients,
   subject: params.subject,
   html: params.html,
 };


 if (params.attachments && params.attachments.length > 0) {
   bodyPayload.attachments = params.attachments;
 }


 try {
   const res = await fetch('https://api.resend.com/emails', {
     method: 'POST',
     headers: {
       'Authorization': 'Bearer ' + resendKey,
       'Content-Type': 'application/json',
     },
     body: JSON.stringify(bodyPayload),
   });


   if (!res.ok) {
     const errText = await res.text().catch(() => '');
     console.warn('[Resend] API Error:', errText);
     return { success: false, error: errText || 'Resend dispatch failed' };
   }
   const data = await res.json().catch(() => ({}));
   return { success: true };
 } catch (err: any) {
   console.warn('[Resend] Exception calling API:', err);
   return { success: false, error: err?.message || 'Email dispatch failed' };
 }
}


function escapeHtml(value: unknown): string {
 const text = String(value ?? '');
 return text.replace(/[&<>"']/g, (char) => ({
   '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
 }[char] as string));
}

// --- Enrollment change notices (cancellation / reschedule) ---------------------------------------
// The enrollment change is saved first and is never rolled back because an email failed. These helpers
// report whether the student was actually notified, using generic reason codes only (never recipient
// addresses, provider error text, or secrets).

type NoticeFailure = 'not_configured' | 'missing_recipient' | 'send_failed';
type NoticeOutcome = { sent: true } | { sent: false; reason: NoticeFailure };

async function sendEnrollmentNotice(params: { to: unknown; subject: string; html: string; attachments?: ResendAttachment[] }): Promise<NoticeOutcome> {
  const recipient = String(params.to || '').trim();
  if (!recipient) return { sent: false, reason: 'missing_recipient' };
  if (!(process.env.RESEND_API_KEY || '').trim()) return { sent: false, reason: 'not_configured' };
  try {
    const result = await sendResendEmail({ to: recipient, subject: params.subject, html: params.html, attachments: params.attachments });
    return result && result.success ? { sent: true } : { sent: false, reason: 'send_failed' };
  } catch {
    return { sent: false, reason: 'send_failed' };
  }
}

const NOTICE_FAILURE_TEXT: Record<NoticeFailure, { status: number; why: string }> = {
  not_configured: { status: 503, why: 'email sending is not configured on the server' },
  missing_recipient: { status: 422, why: 'this enrollment has no student email address' },
  send_failed: { status: 502, why: 'the email provider did not accept the message' },
};

function buildCancellationNotice(enrollment: any, reason?: string) {
  const classTitle = enrollment.classes?.title || 'FIFS Firearms Course';
  const dateStr = new Date(enrollment.scheduled_date).toLocaleString();
  const html = `<p>Your session for <strong>${escapeHtml(classTitle)}</strong> scheduled for ${escapeHtml(dateStr)} has been cancelled.</p><div style="background:#fef2f2;border:1px solid #fecaca;padding:12px;border-radius:6px;margin:16px 0;"><strong>Reason:</strong> ${escapeHtml(reason || "Cancelled by instructor.")}</div>`;
  return { subject: 'Course Confirmation & Portal Access - ' + classTitle, html };
}

function buildRescheduleNotice(enrollment: any, nextDate: Date, durationHours: number, reason?: string) {
  const classTitle = enrollment.classes?.title || 'FIFS Firearms Course';
  const icsContent = generateIcsCalendar({
    title: classTitle,
    description: 'Rescheduled session for ' + classTitle,
    startDate: nextDate,
    durationHours
  });
  const dateStr = nextDate.toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  const html = `<p>Your course session for <strong>${escapeHtml(classTitle)}</strong> has been rescheduled to <strong>${escapeHtml(dateStr)}</strong>.</p><p style="margin:8px 0 0 0;color:#713f12;"><strong>Instructor Note:</strong> ${escapeHtml(reason || "Schedule adjusted by instructor.")}</p>`;
  return {
    subject: 'Course Confirmation & Portal Access - ' + classTitle,
    html,
    attachments: [{ filename: 'Updated_Class_Schedule.ics', content: Buffer.from(icsContent).toString('base64') }] as ResendAttachment[]
  };
}

/**
 * Response for a handler whose enrollment change is already saved. The change succeeded, so this is HTTP 200
 * in every case; `notificationSent` says whether the student was actually told. It never claims a notice
 * that was not sent, and the follow-up only resends the email (it makes no enrollment change).
 */
function savedChangeResponse(kind: 'cancelled' | 'rescheduled', enrollmentId: string, outcome: NoticeOutcome) {
  if (outcome.sent) {
    return NextResponse.json({
      success: true,
      changeSaved: true,
      notificationSent: true,
      message: kind === 'cancelled' ? 'Enrollment cancelled and student notified.' : 'Class session rescheduled successfully.'
    });
  }
  const failure = NOTICE_FAILURE_TEXT[outcome.reason];
  return NextResponse.json({
    success: true,
    changeSaved: true,
    notificationSent: false,
    notificationFailure: outcome.reason,
    enrollmentId,
    message: `${kind === 'cancelled' ? 'Enrollment cancelled' : 'Class session rescheduled'}. The change is saved, but the student was NOT notified because ${failure.why}. No further enrollment change is needed; resend the notice only, or contact the student directly.`,
    followUp: { action: 'adminResendEnrollmentNotice', payload: { enrollmentId, type: kind }, note: 'Sends the notice email only; makes no enrollment change.' }
  });
}

// Helper to normalize student. Staff-only internal notes are included only when the caller asks for them
// (staff views); the default view a student receives is built without them, so they cannot leak by omission.
function normalizeStudent(s: any, opts: { includeInternalNotes?: boolean } = {}) {
  if (!s) return null;
  const view: any = {
    studentId: s.student_id || s.id,
    fullName: s.full_name || s.name || 'Student',
    email: s.email,
    phone: s.phone || '',
    course: s.course || s.course_name || s.course_selection || 'Firearms Training',
    track: s.track || (/VIP/i.test(s.course_selection || s.course_name || '') ? 'VIP' : 'Base'),
    assignedDate: s.assigned_date || s.class_date || s.preferred_dates || s.dates || 'Upcoming Cohort',
    status: s.status || 'STEP_1_REGISTERED',
    // No recorded score means no score; never present an unverified qualification as passed.
    qualificationScore: s.qualification_score || null,
    profileDocUrl: s.profile_doc_url || s.scoresheet_url || s.msp_score_sheet_url || '#',
    prepTasks: s.prep_tasks || { transport_law: false, ammo_acquired: false, eye_ear_pro: false, id_ready: false },
    mustChangePassword: Boolean(s.must_change_password)
  };
  if (opts.includeInternalNotes) view.internalNotes = s.internal_notes || '';
  return view;
}

function normalizeClient(c: any) {
  if (!c) return null;
  return {
    clientId: c.client_id || c.id,
    fullName: c.full_name || c.name || 'Client',
    email: c.email,
    phone: c.phone || '',
    permitState: c.permit_state || c.permit_type || 'Maryland Wear & Carry',
    expirationDate: c.expiration_date || '2026-10-31',
    status: c.status || 'ACTIVE_REGISTERED',
    createdAt: c.created_at
  };
}



const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

async function sendServerDiscordAlert(
  title: string,
  description: string,
  fields: Array<{ name: string; value: string; inline?: boolean }> = [],
  color: number = 0x00E5FF,
  url: string = "https://trainwithfifs.com"
) {
  try {
    if (!DISCORD_WEBHOOK_URL || !DISCORD_WEBHOOK_URL.startsWith('http')) {
      console.warn('[FIFS Route Discord] DISCORD_WEBHOOK_URL is not configured.');
      return;
    }

    const payload = {
      username: "FIFS Operations & Command Dispatch",
      avatar_url: "https://lh3.googleusercontent.com/d/1u53IU5ttzcy8t5W4oLlB2H9q2pXaaExa",
      embeds: [{
        title,
        description,
        url,
        color,
        fields: fields.map(f => ({
          name: f.name || "Detail",
          value: String(f.value || "N/A"),
          inline: Boolean(f.inline)
        })),
        footer: {
          text: "Future Initiative Firearm Services • Operational Relay",
          icon_url: "https://lh3.googleusercontent.com/d/1u53IU5ttzcy8t5W4oLlB2H9q2pXaaExa"
        },
        timestamp: new Date().toISOString()
      }]
    };

    console.log(`[FIFS Route Discord] Sending server alert to Discord: "${title}"`);
    const res = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const resText = await res.text().catch(() => '');
    console.log(`[FIFS Route Discord] Webhook HTTP response: ${res.status} ${res.statusText}`);
    if (!res.ok && res.status !== 204) {
      console.error(`[FIFS Route Discord Error ${res.status}]:`, resText);
    }
  } catch (err: any) {
    console.error('[FIFS Route Discord Exception]:', err.message);
  }
}

export async function POST(req: NextRequest) {
 try {
   const body = await req.json().catch(() => ({}));
   const action = body.action;
   const payload = (body.payload && typeof body.payload === 'object') ? { ...body, ...body.payload } : (body || {});
   // Zero-trust: privileged service-role clients are ONLY created after authorization succeeds
   let supabase: any = null;


   switch (action) {
     case 'registerClient': {
       const { user, error: authErr } = await getAuthenticatedUser(req);
       if (authErr || !user) {
         return NextResponse.json({ success: false, status: 'error', error: 'Authentication is required to create a client profile.' }, { status: 401 });
       }

       const email = String(user.email || '').trim().toLowerCase();
       const submittedEmail = String(payload.email || '').trim().toLowerCase();
       const fullName = String(payload.fullName || '').trim().slice(0, 100);
       const phone = String(payload.phone || '').trim().slice(0, 30);
       const permitType = String(payload.permitType || '').trim().slice(0, 120);
       const expirationDate = String(payload.expirationDate || '').trim();
       const optInReminder = payload.optInReminder === true;

       if (!email || !email.includes('@') || !fullName || !phone || !permitType) {
         return NextResponse.json({ success: false, status: 'error', error: 'Name, phone, permit type, and a valid authenticated email are required.' }, { status: 400 });
       }
       if (submittedEmail && submittedEmail !== email) {
         return NextResponse.json({ success: false, status: 'error', error: 'The submitted email must match your authenticated account.' }, { status: 403 });
       }
       if (expirationDate && !/^\d{4}-\d{2}-\d{2}$/.test(expirationDate)) {
         return NextResponse.json({ success: false, status: 'error', error: 'Enter a valid permit expiration date.' }, { status: 400 });
       }

       // Only a verified Supabase identity can create a profile. Existing records are never linked by email.
       supabase = getPrivilegedClient();
       const { data: existingUserProfile, error: lookupUserErr } = await supabase.from('clients').select('client_id').eq('user_id', user.id).maybeSingle();
       if (lookupUserErr) {
         return NextResponse.json({ success: false, status: 'error', error: 'Could not verify whether a client profile already exists.' }, { status: 500 });
       }
       if (existingUserProfile) {
         return NextResponse.json({ success: false, status: 'error', error: 'A client profile is already linked to this account. Please sign in to your portal.' }, { status: 409 });
       }
       const { data: existingEmailProfile, error: lookupEmailErr } = await supabase.from('clients').select('client_id').eq('email', email).maybeSingle();
       if (lookupEmailErr) {
         return NextResponse.json({ success: false, status: 'error', error: 'Could not verify whether this email already has a client profile.' }, { status: 500 });
       }
       if (existingEmailProfile) {
         return NextResponse.json({ success: false, status: 'error', error: 'A client record already exists for this email and cannot be linked automatically. Contact FIFS for secure account recovery.' }, { status: 409 });
       }

       const clientId = `CLI-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
       const clientRecord = {
         user_id: user.id,
         client_id: clientId,
         full_name: fullName,
         email,
         phone,
         permit_type: permitType,
         permit_state: permitType,
         expiration_date: expirationDate || null,
         opt_in_reminder: optInReminder,
         status: 'ACTIVE_REGISTERED',
         created_at: new Date().toISOString(),
         updated_at: new Date().toISOString()
       };
       const { data: createdClient, error: insertErr } = await supabase.from('clients').insert(clientRecord).select('*').single();
       if (insertErr || !createdClient) {
         console.error('[registerClient] Profile insert failed:', insertErr?.message);
         return NextResponse.json({ success: false, status: 'error', error: 'Could not save your client profile. Please try again.' }, { status: 500 });
       }

       return NextResponse.json({
         success: true,
         status: 'success',
         client: {
           clientId: createdClient.client_id,
           fullName: createdClient.full_name,
           email: createdClient.email,
           phone: createdClient.phone,
           permitType: createdClient.permit_type || 'Maryland Wear & Carry (CCW)',
           permitState: createdClient.permit_state || 'Maryland',
           expirationDate: createdClient.expiration_date || null,
           status: createdClient.status || 'ACTIVE_REGISTERED',
           optInReminder: Boolean(createdClient.opt_in_reminder),
           smsAlertPhone: createdClient.sms_alert_phone || createdClient.phone
         }
       });
     }

     // Delete Permit Record for Authenticated Client (Respects RLS)
          // Delete Student from Supabase (Administrative Roster)
     case 'adminDeleteStudent': {
       const { user, error: authErr } = await getAuthenticatedUser(req);
       if (authErr || !isStaffOrAdmin(user)) {
         return NextResponse.json({ success: false, error: 'Unauthorized: Staff or administrator authentication required.' }, { status: 401 });
       }
       supabase = getPrivilegedClient();

       const targetId = (payload.studentId || payload.id || body.studentId || body.id || '').trim();
       const targetEmail = (payload.email || body.email || '').trim().toLowerCase();

       if (!targetId && !targetEmail) {
         return NextResponse.json({ success: false, error: 'Student ID or email is required for deletion.' }, { status: 400 });
       }

       // 1. Locate student to retrieve student_id, id, and email for cascading cleanups
       let query = supabase.from('students').select('id, student_id, email, full_name');
       if (targetId) {
         const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
         if (isUuid) {
           query = query.or(`student_id.eq.${targetId},id.eq.${targetId}`);
         } else {
           query = query.eq('student_id', targetId);
         }
       } else {
         query = query.eq('email', targetEmail);
       }

       const { data: foundStudent } = await query.maybeSingle();

       const resolvedStudentId = foundStudent?.student_id || (targetId.startsWith('FIFS-') ? targetId : null);
       const resolvedEmail = foundStudent?.email || (targetEmail.includes('@') ? targetEmail : null);
       const resolvedUuid = foundStudent?.id || (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId) ? targetId : null);

       // 2. Cascade delete dependent child records first to satisfy foreign key constraints
       if (resolvedStudentId) {
         try {
           await supabase.from('invoices').delete().eq('student_id', resolvedStudentId);
         } catch (invErr) {
           console.warn('Invoices deletion note:', invErr);
         }
         try {
           await supabase.from('enrollments').delete().eq('student_id', resolvedStudentId);
         } catch (enrErr) {
           console.warn('Enrollments deletion note:', enrErr);
         }
         try {
           await supabase.from('messages').delete().eq('student_id', resolvedStudentId);
         } catch (msgErr) {
           console.warn('Messages deletion note:', msgErr);
         }
       }

       if (resolvedEmail) {
         try {
           await supabase.from('enrollments').delete().eq('student_email', resolvedEmail);
         } catch (enrEmailErr) {
           console.warn('Enrollments email deletion note:', enrEmailErr);
         }
         try {
           await supabase.from('invoices').delete().eq('email', resolvedEmail);
         } catch (invEmailErr) {
           console.warn('Invoices email deletion note:', invEmailErr);
         }
         try {
           await supabase.from('profiles').delete().eq('email', resolvedEmail);
         } catch (profErr) {
           console.warn('Profiles email deletion note:', profErr);
         }
       }

       // 3. Delete from primary students table
       let delQuery = supabase.from('students').delete();
       if (resolvedUuid) {
         delQuery = delQuery.eq('id', resolvedUuid);
       } else if (resolvedStudentId) {
         delQuery = delQuery.eq('student_id', resolvedStudentId);
       } else if (resolvedEmail) {
         delQuery = delQuery.eq('email', resolvedEmail);
       } else {
         return NextResponse.json({ success: false, error: 'Could not resolve target student for deletion.' }, { status: 404 });
       }

       const { error: delError } = await delQuery;

       if (delError) {
         console.error('Failed to delete student from Supabase:', delError);
         return NextResponse.json({ success: false, error: delError.message }, { status: 500 });
       }

       return NextResponse.json({
         success: true,
         status: 'success',
         deletedStudentId: resolvedStudentId || targetId,
         message: `Student ${foundStudent?.full_name || targetId} successfully removed from Supabase.`
       });
     }

     case 'adminDeleteClient': {
       const { user, error: authErr } = await getAuthenticatedUser(req);
       if (authErr || !isStaffOrAdmin(user)) {
         return NextResponse.json({ success: false, error: 'Unauthorized: Staff or administrator authentication required.' }, { status: 401 });
       }
       supabase = getPrivilegedClient();

       const targetId = (payload.clientId || payload.id || body.clientId || body.id || '').trim();
       const targetEmail = (payload.email || body.email || '').trim().toLowerCase();

       if (!targetId && !targetEmail) {
         return NextResponse.json({ success: false, error: 'Client ID or email is required for deletion.' }, { status: 400 });
       }

       // 1. Locate client record
       let query = supabase.from('clients').select('id, client_id, email, full_name, user_id');
       if (targetId) {
         const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
         if (isUuid) {
           query = query.or(`client_id.eq.${targetId},id.eq.${targetId}`);
         } else {
           query = query.eq('client_id', targetId);
         }
       } else {
         query = query.eq('email', targetEmail);
       }

       const { data: foundClient } = await query.maybeSingle();

       const resolvedClientId = foundClient?.client_id || (targetId.startsWith('CLI-') || targetId.startsWith('FI-CLIENT-') ? targetId : null);
       const resolvedEmail = foundClient?.email || (targetEmail.includes('@') ? targetEmail : null);
       const resolvedUuid = foundClient?.id || (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId) ? targetId : null);

       // 2. Cascade delete dependent client records
       if (resolvedClientId) {
         try {
           await supabase.from('user_permits').delete().eq('client_id', resolvedClientId);
         } catch (pErr) {
           console.warn('user_permits deletion note:', pErr);
         }
       }

       if (resolvedEmail) {
         try {
           await supabase.from('user_permits').delete().eq('email', resolvedEmail);
         } catch (pEmailErr) {
           console.warn('user_permits email deletion note:', pEmailErr);
         }
         try {
           await supabase.from('profiles').delete().eq('email', resolvedEmail);
         } catch (profErr) {
           console.warn('profiles email deletion note:', profErr);
         }
       }

       // 3. Delete from primary clients table
       let delQuery = supabase.from('clients').delete();
       if (resolvedUuid) {
         delQuery = delQuery.eq('id', resolvedUuid);
       } else if (resolvedClientId) {
         delQuery = delQuery.eq('client_id', resolvedClientId);
       } else if (resolvedEmail) {
         delQuery = delQuery.eq('email', resolvedEmail);
       } else {
         return NextResponse.json({ success: false, error: 'Could not resolve target client for deletion.' }, { status: 404 });
       }

       const { error: delError } = await delQuery;

       if (delError) {
         console.error('Failed to delete client from Supabase:', delError);
         return NextResponse.json({ success: false, error: delError.message }, { status: 500 });
       }

       return NextResponse.json({
         success: true,
         status: 'success',
         deletedClientId: resolvedClientId || targetId,
         message: `Client ${foundClient?.full_name || targetId} successfully removed from Supabase.`
       });
     }

     case 'deletePermit': {
       const permitId = (payload.permitId || payload.id || body.permitId || body.id || '').trim();
       if (!permitId) {
         return NextResponse.json({ success: false, error: 'Missing permit ID.' }, { status: 400 });
       }

       const { user, error: authErr } = await getAuthenticatedUser(req);
       if (authErr || !user) {
         return NextResponse.json({ success: false, error: 'Unauthorized: Authentication required to delete permits.' }, { status: 401 });
       }
       supabase = getPrivilegedClient();

       // Verify caller owns this permit record unless caller is staff/admin
       if (!isStaffOrAdmin(user)) {
         const { data: existingPermit } = await supabase
           .from('user_permits')
           .select('id, user_id, email')
           .eq('id', permitId)
           .maybeSingle();

         if (!existingPermit) {
           return NextResponse.json({ success: false, error: 'Permit record not found.' }, { status: 404 });
         }

         const callerEmail = (user.email || '').toLowerCase().trim();
         const permitEmail = (existingPermit.email || '').toLowerCase().trim();
         if (existingPermit.user_id !== user.id && (!permitEmail || permitEmail !== callerEmail)) {
           return NextResponse.json({ success: false, error: 'Forbidden: You do not have permission to delete this permit record.' }, { status: 403 });
         }
       }

       try {
         const { error: delErr } = await supabase.from('user_permits').delete().eq('id', permitId);
         if (delErr) {
           return NextResponse.json({ success: false, error: delErr.message }, { status: 500 });
         }
       } catch (e: any) {
         console.warn('user_permits deletion warning:', e);
         return NextResponse.json({ success: false, error: e?.message || 'Failed to delete permit.' }, { status: 500 });
       }
       return NextResponse.json({ success: true, message: 'Permit record removed successfully.' });
     }

     case 'getClasses': {
       supabase = getPublicClient();
       const { data, error } = await supabase
         .from('classes')
         .select('*')
         .eq('is_active', true)
         .order('title', { ascending: true });


       if (error) {
         return NextResponse.json({ success: false, error: error.message }, { status: 500 });
       }
       return NextResponse.json({ success: true, classes: data || [] });
     }


     // 2. Clean Intake & Single-Course Enrollment (Deprecates broken legacy invite handlers)
           // Direct Portal Invitation Dispatcher (used by Admin Hub Direct Access Dispatcher modal)
     case 'adminDirectInvite': {
       const { user, error: authErr } = await getAuthenticatedUser(req);
       if (authErr || !isStaffOrAdmin(user)) {
         return NextResponse.json({ success: false, error: 'Unauthorized: Staff or administrator authentication required.' }, { status: 401 });
       }
       supabase = getPrivilegedClient();
       // Resolved before any account is created so a configuration error leaves nothing behind.
       const siteUrl = resolveSiteUrl();

       const fullName = String(payload?.fullName || payload?.name || payload?.invFullName || 'Invited Student').trim().slice(0, 100);
       const email = String(payload?.email || payload?.invEmail || '').trim().toLowerCase().slice(0, 150);
       const phone = String(payload?.phone || payload?.invPhone || '').trim().slice(0, 30);
       const portalType = String(payload?.portalType || payload?.invPortalType || 'student').trim().toLowerCase();
       const courseName = String(payload?.course || payload?.courseSelection || payload?.invCourse || 'Maryland Wear & Carry Permit').trim().slice(0, 200);
       const dates = String(payload?.dates || payload?.scheduledDate || payload?.invDates || 'Upcoming Session').trim().slice(0, 200);
       const generatedId = String(payload?.generatedId || ('FIFS-' + Math.floor(1000 + Math.random() * 9000))).trim().slice(0, 60);
       const now = new Date().toISOString();

       if (!fullName || !email || !email.includes('@')) {
         return NextResponse.json({ success: false, error: 'Valid full name and email are required.' }, { status: 400 });
       }
       if (portalType !== 'student' && portalType !== 'client') {
         return NextResponse.json({ success: false, error: 'Portal type must be student or client.' }, { status: 400 });
       }

       // A random password is used only to initialize the Auth identity. It is never emailed or returned.
       const initialPassword = generateSecureTempPassword();
       const { data: createdAuth, error: createAuthErr } = await supabase.auth.admin.createUser({
         email,
         password: initialPassword,
         email_confirm: true,
         app_metadata: { role: portalType === 'client' ? 'client' : 'student' },
         user_metadata: { full_name: fullName, phone }
       });
       const authUserId = createdAuth?.user?.id;
       if (createAuthErr || !authUserId) {
         return NextResponse.json({ success: false, error: 'Could not create a new secure sign-in. If this email already has an account, use the account-recovery process instead.' }, { status: 409 });
       }

       const profileTable = portalType === 'client' ? 'clients' : 'students';
       const profile = portalType === 'client' ? {
         user_id: authUserId,
         client_id: generatedId.startsWith('CLI-') ? generatedId : 'CLI-' + Math.floor(1000 + Math.random() * 9000),
         full_name: fullName, email, phone, permit_type: courseName, permit_state: 'Maryland',
         status: 'ACTIVE_REGISTERED', created_at: now, updated_at: now
       } : {
         user_id: authUserId, student_id: generatedId, full_name: fullName, email, phone,
         course_selection: courseName, preferred_dates: dates, status: 'REGISTERED',
         must_change_password: true, temp_password_reset: true, created_at: now, updated_at: now
       };
       const { error: profileErr } = await supabase.from(profileTable).insert(profile);
       if (profileErr) {
         const { error: cleanupErr } = await supabase.auth.admin.deleteUser(authUserId);
         if (cleanupErr) console.error('[adminDirectInvite] Auth cleanup failed after profile insert error:', cleanupErr);
         return NextResponse.json({ success: false, error: 'Could not save a linked portal profile. No invitation was sent.' }, { status: 500 });
       }

       const redirectPath = portalType === 'client' ? '/?tab=fi-portal' : '/?portal=student';
       let setupLink: string | null = null;
       let setupLinkError: string | null = null;
       try {
         const redirectTo = new URL(redirectPath, siteUrl).toString();
         const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
           type: 'recovery',
           email,
           options: { redirectTo }
         });
         if (linkErr || !linkData?.properties?.action_link) {
           setupLinkError = linkErr?.message || 'Supabase did not return a password setup link.';
         } else {
           setupLink = linkData.properties.action_link;
         }
       } catch (linkErr: any) {
         setupLinkError = linkErr?.message || 'Could not generate the password setup link.';
       }

       let emailResult: { success: boolean; error?: string } = { success: false, error: setupLinkError || 'Password setup link unavailable.' };
       if (setupLink) {
         const safeName = escapeHtml(fullName);
         const safeCourse = escapeHtml(courseName);
         const safeSetupLink = escapeHtml(setupLink);
         const emailHtml = `
           <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0b0f14;color:#fff;padding:24px;border-radius:8px;">
             <h2 style="color:#ffb703;">Welcome to Future Initiative Firearm Services</h2>
             <p>Dear ${safeName},</p>
             <p>Lead Instructor Kai Wade has invited you to access your personal training portal for <strong>${safeCourse}</strong>.</p>
             <p>Use the secure link below to set your password and activate portal access. This link is time-limited and can only be used through Supabase's account recovery flow.</p>
             <p><a href="${safeSetupLink}" style="display:inline-block;background:#ffb703;color:#000;padding:12px 24px;text-decoration:none;font-weight:bold;border-radius:4px;">Set up your password and access the portal</a></p>
             <p style="color:#aaa;font-size:12px;">Your Student/Client ID is for record reference only. Do not share your setup link.</p>
             <p style="color:#888;font-size:12px;margin-top:24px;">Future Initiative Firearm Services • Maryland State Police Certified Training</p>
           </div>`;
         emailResult = await sendResendEmail({
           to: email,
           subject: `Welcome to Train With FIFS — Portal Access for ${courseName}`,
           html: emailHtml
         });
       }

       if (!setupLink || !emailResult.success) {
         console.error('[adminDirectInvite] Setup invitation not delivered:', setupLinkError || emailResult.error || 'Unknown email error');
         return NextResponse.json({
           success: false,
           recordCreated: true,
           emailDispatched: false,
           studentId: generatedId,
           error: 'The linked portal profile was created, but the secure password setup email was not delivered. Do not retry the invite; use the account recovery/resend process for this address.'
         }, { status: 502 });
       }

       return NextResponse.json({
         success: true,
         status: 'success',
         message: `Secure password setup invitation sent to ${email}.`,
         studentId: generatedId,
         emailDispatched: true
       });
     }

     case 'adminEnrollStudent': {
       const { user, error: authErr } = await getAuthenticatedUser(req);
       if (authErr || !isStaffOrAdmin(user)) {
         return NextResponse.json({ success: false, error: 'Unauthorized: Staff or administrator authentication required.' }, { status: 401 });
       }
       supabase = getPrivilegedClient();
       // Resolved before any account is created so a configuration error leaves nothing behind.
       const siteUrl = resolveSiteUrl();

       const fullName = String(payload.fullName || payload.name || '').trim();
       const email = String(payload.email || '').trim().toLowerCase();
       const phone = String(payload.phone || '').trim();
       const role = payload.role || 'student';
       const internalNotes = payload.internalNotes || payload.notes || '';
       let classId = payload.classId;
       if (!classId || classId === 'default') {
         const courseNameLower = String(payload.courseName || payload.courseSelection || '').toLowerCase();
         if (courseNameLower.includes('renewal')) {
           classId = '48daf0ba-41a3-4d89-a148-07f26f1e89f5';
         } else if (courseNameLower.includes('mastery') || courseNameLower.includes('multi-state')) {
           classId = '282526dc-97b9-4481-8e2d-3ca90f719bdf';
         } else if (courseNameLower.includes('combo')) {
           classId = '532fbdb5-c26e-4a24-9993-387637b8b2f8';
         } else if (courseNameLower.includes('hql')) {
           classId = '817074c2-22a9-4fc6-9fd5-11b347a15b3b';
         }
       }
       const scheduledDateStr = payload.scheduledDate;
       let durationHours = Number(payload.durationHours) || 8;

       if (!fullName || !email || !email.includes('@')) {
         return NextResponse.json({ success: false, error: 'Full name and valid email are required.' }, { status: 400 });
       }

       if (role !== 'student') {
         const clientId = 'FI-CLIENT-' + Math.floor(1000 + Math.random() * 9000);
         const { error: clientErr } = await supabase.from('clients').insert({
           client_id: clientId, full_name: fullName, email, phone: phone || null,
           permit_state: 'Maryland Wear & Carry', status: 'ACTIVE_REGISTERED', created_at: new Date().toISOString()
         });
         if (clientErr) {
           return NextResponse.json({ success: false, error: 'Could not create client profile: ' + clientErr.message }, { status: 500 });
         }
         return NextResponse.json({ success: true, isNewUser: true, emailDispatched: false, clientId, message: 'Client profile created. No portal credentials or invitation email were generated by this enrollment action.' });
       }

       if (!classId || !scheduledDateStr) {
         return NextResponse.json({ success: false, error: 'Class and scheduled date/time are required for student enrollment.' }, { status: 400 });
       }
       const scheduledDate = new Date(scheduledDateStr);
       if (isNaN(scheduledDate.getTime())) {
         return NextResponse.json({ success: false, error: 'Invalid scheduled date/time provided.' }, { status: 400 });
       }

       const { data: classRecord } = await supabase.from('classes').select('*').eq('id', classId).single();
       const classTitle = classRecord?.title || 'Firearms Qualification Course';
       const gearNotes = classRecord?.required_gear_notes || 'Eye and ear protection, government-issued photo ID, range fee (0 cash), functional firearm with 50 rounds of factory ammunition.';
       const materialsPath = classRecord?.materials_path || null;
       if (!payload.durationHours && classRecord?.duration_hours) durationHours = Number(classRecord.duration_hours);

       const { data: existingStudent, error: existingStudentErr } = await supabase
         .from('students').select('*').eq('email', email).maybeSingle();
       if (existingStudentErr) {
         return NextResponse.json({ success: false, error: 'Could not verify existing student record: ' + existingStudentErr.message }, { status: 500 });
       }

       const isNewUser = !existingStudent;
       let studentId = existingStudent?.student_id;
       let authUserId: string | null = null;
       let createdStudentRow = false;
       if (isNewUser) {
         studentId = 'FIFS-' + Math.floor(1000 + Math.random() * 9000);
         const initialPassword = generateSecureTempPassword();
         const { data: createdAuth, error: createAuthErr } = await supabase.auth.admin.createUser({
           email,
           password: initialPassword,
           email_confirm: true,
           app_metadata: { role: 'student' },
           user_metadata: { full_name: fullName, phone }
         });
         authUserId = createdAuth?.user?.id || null;
         if (createAuthErr || !authUserId) {
           return NextResponse.json({ success: false, error: 'Could not create a new secure sign-in. If this email already has an account, use the account-recovery process instead. Existing student records are not automatically linked by email.' }, { status: 409 });
         }

         const { error: insertErr } = await supabase.from('students').insert({
           user_id: authUserId,
           student_id: studentId,
           full_name: fullName,
           email,
           phone: phone || '',
           course_selection: classTitle,
           preferred_dates: scheduledDate.toISOString(),
           status: 'STEP_1_REGISTERED',
           created_at: new Date().toISOString()
         });
         if (insertErr) {
           const { error: cleanupErr } = await supabase.auth.admin.deleteUser(authUserId);
           if (cleanupErr) console.error('[adminEnrollStudent] Auth cleanup failed after student insert error:', cleanupErr);
           return NextResponse.json({ success: false, error: 'Could not create the linked student profile. No enrollment was recorded.' }, { status: 500 });
         }
         createdStudentRow = true;
       } else {
         // Do not auto-link existing unlinked records by matching email.
         const { error: updateErr } = await supabase.from('students').update({
           phone: phone || existingStudent.phone,
           internal_notes: internalNotes || existingStudent.internal_notes,
           course: classTitle,
           assigned_date: scheduledDate.toLocaleDateString()
         }).eq('id', existingStudent.id);
         if (updateErr) {
           return NextResponse.json({ success: false, error: 'Could not update the existing student record: ' + updateErr.message }, { status: 500 });
         }
       }

       const { data: enrollment, error: enrollErr } = await supabase.from('enrollments').insert({
         student_email: email,
         student_name: fullName,
         class_id: classId,
         scheduled_date: scheduledDate.toISOString(),
         duration_hours: durationHours,
         reminder_sent: false,
         status: 'confirmed',
         previous_dates: [],
         internal_notes: internalNotes
       }).select().single();
       if (enrollErr) {
         if (createdStudentRow && authUserId) {
           const { error: rowCleanupErr } = await supabase.from('students').delete().eq('user_id', authUserId);
           if (rowCleanupErr) console.error('[adminEnrollStudent] Student cleanup failed after enrollment insert error:', rowCleanupErr);
           const { error: authCleanupErr } = await supabase.auth.admin.deleteUser(authUserId);
           if (authCleanupErr) console.error('[adminEnrollStudent] Auth cleanup failed after enrollment insert error:', authCleanupErr);
         }
         return NextResponse.json({ success: false, error: 'Failed to record enrollment: ' + enrollErr.message }, { status: 500 });
       }

       const signedDocUrl = await getSignedDocumentUrl(supabase, materialsPath);
       const dateFormatted = scheduledDate.toLocaleString('en-US', {
         weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
       });
       const icsContent = generateIcsCalendar({
         title: classTitle,
         description: 'FIFS Qualification Course - Gear: ' + gearNotes,
         startDate: scheduledDate,
         durationHours
       });
       const attachments: ResendAttachment[] = [{ filename: 'FIFS_Course_Invitation.ics', content: Buffer.from(icsContent).toString('base64') }];

       let setupLink: string | null = null;
       let setupLinkError: string | null = null;
       if (isNewUser) {
         try {
           const redirectTo = new URL('/?portal=student', siteUrl).toString();
           const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
             type: 'recovery', email, options: { redirectTo }
           });
           if (linkErr || !linkData?.properties?.action_link) {
             setupLinkError = linkErr?.message || 'Supabase did not return a password setup link.';
           } else {
             setupLink = linkData.properties.action_link;
           }
         } catch (linkErr: any) {
           setupLinkError = linkErr?.message || 'Could not generate the password setup link.';
         }
       }

       const safeClassTitle = escapeHtml(classTitle);
       const safeSetupLink = setupLink ? escapeHtml(setupLink) : null;
       const emailHtml = `<p>Welcome to <strong>${safeClassTitle}</strong>! Your session is confirmed for <strong>${escapeHtml(dateFormatted)}</strong>.</p>` +
         (safeSetupLink ? `<p>Use this secure, time-limited link to set your portal password: <a href="${safeSetupLink}">Set up your portal password</a>. Do not share the link.</p>` : '') +
         (isNewUser && !safeSetupLink ? `<p>Your enrollment is recorded, but we could not generate the portal setup link. Please contact FIFS to complete portal setup.</p>` : '') +
         (signedDocUrl ? `<p style="margin:10px 0 0 0;"><a href="${escapeHtml(signedDocUrl)}" style="background:#0284c7;color:#ffffff;text-decoration:none;padding:8px 16px;border-radius:4px;font-weight:bold;display:inline-block;">Download Course Materials (7-Day Secure Link)</a></p>` : '');
       const emailResult = await sendResendEmail({
         to: email,
         subject: 'Course Confirmation & Portal Access - ' + classTitle,
         html: emailHtml,
         attachments
       });

       const portalSetupEmailDispatched = isNewUser ? Boolean(setupLink && emailResult.success) : null;
       const message = !emailResult.success
         ? 'Enrollment recorded, but the confirmation email could not be delivered.'
         : (isNewUser && !setupLink
           ? 'Enrollment recorded and confirmation email delivered, but portal password setup is still required. Contact FIFS; no temporary password was sent.'
           : (isNewUser
             ? 'Enrollment recorded and secure password setup link sent. No temporary password was sent.'
             : 'Enrollment recorded and confirmation email delivered. Existing portal access was not changed.'));

       return NextResponse.json({
         success: true,
         isNewUser,
         studentId,
         emailDispatched: emailResult.success,
         portalSetupEmailDispatched,
         portalSetupLinkGenerated: isNewUser ? Boolean(setupLink) : null,
         emailError: emailResult.error || setupLinkError || null,
         message,
         enrollment
       });
     }

     case 'adminRescheduleEnrollment': {
       const { user, error: authErr } = await getAuthenticatedUser(req);
       if (authErr || !isStaffOrAdmin(user)) {
         return NextResponse.json({ success: false, error: 'Unauthorized: Staff or administrator authentication required.' }, { status: 401 });
       }
       supabase = getPrivilegedClient();


       const enrollmentId = payload.enrollmentId || payload.id;
       const newScheduledDate = payload.newScheduledDate || payload.newDate || payload.date;
       const { durationHours, reason } = payload;
       if (!enrollmentId || !newScheduledDate) {
         return NextResponse.json({ success: false, changeSaved: false, notificationSent: false, error: 'Enrollment ID and new date are required.' }, { status: 400 });
       }


       const { data: enrollment, error: findErr } = await supabase
         .from('enrollments')
         .select('*, classes(*)')
         .eq('id', enrollmentId)
         .single();


       if (findErr || !enrollment) {
         return NextResponse.json({ success: false, changeSaved: false, notificationSent: false, error: 'Enrollment record not found.' }, { status: 404 });
       }


       const oldDate = new Date(enrollment.scheduled_date);
       const nextDate = new Date(newScheduledDate);
       const previousDates = Array.isArray(enrollment.previous_dates) ? [...enrollment.previous_dates] : [];
       previousDates.push({
         date: enrollment.scheduled_date,
         rescheduled_at: new Date().toISOString(),
         reason: reason || 'Admin schedule modification'
       });


       const newDuration = Number(durationHours) || Number(enrollment.duration_hours) || 8;


       const { error: updateErr } = await supabase
         .from('enrollments')
         .update({
           scheduled_date: nextDate.toISOString(),
           duration_hours: newDuration,
           reminder_sent: false,
           status: 'rescheduled',
           previous_dates: previousDates,
           internal_notes: reason || enrollment.internal_notes
         })
         .eq('id', enrollmentId);


       if (updateErr) {
         return NextResponse.json({ success: false, changeSaved: false, notificationSent: false, error: updateErr.message }, { status: 500 });
       }


       // The reschedule is saved. Notify the student and report whether that email really went out.
       const notice = buildRescheduleNotice(enrollment, nextDate, newDuration, reason);
       const outcome = await sendEnrollmentNotice({
         to: enrollment.student_email,
         subject: notice.subject,
         html: notice.html,
         attachments: notice.attachments
       });
       if (!outcome.sent) console.warn('[Reschedule] Change saved but the student notice was not sent - reason:', outcome.reason);
       return savedChangeResponse('rescheduled', String(enrollmentId), outcome);
     }


     // 4. Cancel Enrollment
     case 'adminCancelEnrollment': {
       const { user, error: authErr } = await getAuthenticatedUser(req);
       if (authErr || !isStaffOrAdmin(user)) {
         return NextResponse.json({ success: false, error: 'Unauthorized: Staff or administrator authentication required.' }, { status: 401 });
       }
       supabase = getPrivilegedClient();


       const { enrollmentId, reason } = payload;
       if (!enrollmentId) {
         return NextResponse.json({ success: false, changeSaved: false, notificationSent: false, error: 'Enrollment ID is required.' }, { status: 400 });
       }


       const { data: enrollment, error: findErr } = await supabase
         .from('enrollments')
         .select('*, classes(*)')
         .eq('id', enrollmentId)
         .single();


       if (findErr || !enrollment) {
         return NextResponse.json({ success: false, changeSaved: false, notificationSent: false, error: 'Enrollment not found.' }, { status: 404 });
       }


       const { error: cancelErr } = await supabase
         .from('enrollments')
         .update({
           status: 'cancelled',
           cancellation_reason: reason || 'Cancelled by instructor'
         })
         .eq('id', enrollmentId);


       if (cancelErr) {
         return NextResponse.json({ success: false, changeSaved: false, notificationSent: false, error: cancelErr.message }, { status: 500 });
       }


       // The cancellation is saved. Notify the student and report whether that email really went out.
       const notice = buildCancellationNotice(enrollment, reason);
       const outcome = await sendEnrollmentNotice({ to: enrollment.student_email, subject: notice.subject, html: notice.html });
       if (!outcome.sent) console.warn('[Cancel] Change saved but the student notice was not sent - reason:', outcome.reason);
       return savedChangeResponse('cancelled', String(enrollmentId), outcome);
     }

     // 4b. Resend a cancellation/reschedule notice. Sends email only: it never writes to the database, so
     // it can be retried safely after a failed notification without applying the change twice.
     case 'adminResendEnrollmentNotice': {
       const { user, error: authErr } = await getAuthenticatedUser(req);
       if (authErr || !isStaffOrAdmin(user)) {
         return NextResponse.json({ success: false, error: 'Unauthorized: Staff or administrator authentication required.' }, { status: 401 });
       }
       supabase = getPrivilegedClient();

       const { enrollmentId, type } = payload;
       if (!enrollmentId || (type !== 'cancelled' && type !== 'rescheduled')) {
         return NextResponse.json({ success: false, error: 'Enrollment ID and a notice type of "cancelled" or "rescheduled" are required.' }, { status: 400 });
       }

       const { data: enrollment, error: findErr } = await supabase
         .from('enrollments')
         .select('*, classes(*)')
         .eq('id', enrollmentId)
         .single();
       if (findErr || !enrollment) {
         return NextResponse.json({ success: false, error: 'Enrollment not found.' }, { status: 404 });
       }
       // Only resend a notice that matches what is actually saved, so a stale retry cannot misinform the student.
       if (enrollment.status !== type) {
         return NextResponse.json({ success: false, notificationSent: false, error: `This enrollment is not currently ${type}, so no notice was sent.` }, { status: 409 });
       }

       let notice: { subject: string; html: string; attachments?: ResendAttachment[] };
       if (type === 'cancelled') {
         notice = buildCancellationNotice(enrollment, enrollment.cancellation_reason);
       } else {
         const history = Array.isArray(enrollment.previous_dates) ? enrollment.previous_dates : [];
         const savedReason = history.length ? history[history.length - 1]?.reason : undefined;
         const note = savedReason && savedReason !== 'Admin schedule modification' ? String(savedReason) : undefined;
         notice = buildRescheduleNotice(enrollment, new Date(enrollment.scheduled_date), Number(enrollment.duration_hours) || 8, note);
       }

       const outcome = await sendEnrollmentNotice({ to: enrollment.student_email, subject: notice.subject, html: notice.html, attachments: notice.attachments });
       if (!outcome.sent) {
         console.warn('[ResendNotice] Notice not sent - reason:', outcome.reason);
         return NextResponse.json({
           success: false,
           notificationSent: false,
           notificationFailure: outcome.reason,
           error: `The notice was NOT sent because ${NOTICE_FAILURE_TEXT[outcome.reason].why}. No enrollment change was made; you can try again or contact the student directly.`
         }, { status: NOTICE_FAILURE_TEXT[outcome.reason].status });
       }
       return NextResponse.json({ success: true, notificationSent: true, message: type === 'cancelled' ? 'Cancellation notice sent to the student.' : 'Reschedule notice sent to the student.' });
     }


     // 5. First-Login Password Change & Gate Clear + Admin Alert
     case 'firstLoginPasswordChange': {
       const { email, identifier, newPassword } = payload;
       if (!newPassword) {
         return NextResponse.json({ success: false, error: 'A new password is required.' }, { status: 400 });
       }
       const { user, error: authErr } = await getAuthenticatedUser(req);
       if (authErr || !user) {
         return NextResponse.json({ success: false, error: 'Unauthorized: Authentication required.' }, { status: 401 });
       }
       const val = validateStrictPassword(newPassword);
       if (!val.valid) return NextResponse.json({ success: false, error: val.error }, { status: 400 });
       const targetEmail = String(email || '').trim().toLowerCase();
       if (targetEmail && targetEmail !== String(user.email || '').toLowerCase()) {
         return NextResponse.json({ success: false, error: 'Forbidden: You can only update your own password.' }, { status: 403 });
       }
       supabase = getPrivilegedClient();
       const { data: student, error: studentErr } = await supabase.from('students').select('*').eq('user_id', user.id).maybeSingle();
       if (studentErr || !student || student.user_id !== user.id) {
         return NextResponse.json({ success: false, error: 'Linked student record not found.' }, { status: 404 });
       }
       const { error: authUpdateErr } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword });
       if (authUpdateErr) {
         console.error('[firstLoginPasswordChange] Auth password update failed:', authUpdateErr);
         return NextResponse.json({ success: false, error: 'Password update failed. Please try again.' }, { status: 500 });
       }
       const { error: updateErr } = await supabase.from('students').update({
         must_change_password: false,
         temp_password_reset: false,
         password_expires_at: null,
         last_password_change: new Date().toISOString(),
         updated_at: new Date().toISOString()
       }).eq('user_id', user.id);
       if (updateErr) return NextResponse.json({ success: false, error: 'Password changed, but the portal status could not be updated.' }, { status: 500 });
       return NextResponse.json({ success: true, message: 'Password updated successfully.' });
     }

     case 'changePortalPassword':
     case 'updateStudentPassword':
     case 'selfServicePasswordUpdate': {
       const { email, studentId, identifier, newPassword } = payload;
       const requestedTarget = String(email || studentId || identifier || '').trim().toLowerCase();
       if (!newPassword) return NextResponse.json({ success: false, status: 'error', error: 'A new password is required.' }, { status: 400 });
       const { user, error: authErr } = await getAuthenticatedUser(req);
       if (authErr || !user) return NextResponse.json({ success: false, status: 'error', error: 'Unauthorized: Authentication required.' }, { status: 401 });
       if (isStaffOrAdmin(user)) return NextResponse.json({ success: false, status: 'error', error: 'Use the staff password reset workflow.' }, { status: 403 });
       const val = validateStrictPassword(newPassword);
       if (!val.valid) return NextResponse.json({ success: false, status: 'error', error: val.error }, { status: 400 });
       supabase = getPrivilegedClient();
       const [studentResult, clientResult] = await Promise.all([
         supabase.from('students').select('*').eq('user_id', user.id).maybeSingle(),
         supabase.from('clients').select('*').eq('user_id', user.id).maybeSingle()
       ]);
       const student = studentResult.data;
       const client = clientResult.data;
       if (!student && !client) return NextResponse.json({ success: false, status: 'error', error: 'Linked portal record not found.' }, { status: 404 });
       const ownedRecord = student || client;
       const allowedTargets = [String(user.email || '').toLowerCase(), String(ownedRecord.email || '').toLowerCase(), String(ownedRecord.student_id || ownedRecord.client_id || '').toLowerCase(), String(ownedRecord.id || '').toLowerCase()];
       if (requestedTarget && !allowedTargets.includes(requestedTarget)) return NextResponse.json({ success: false, status: 'error', error: 'Forbidden: You can only update your own password.' }, { status: 403 });
       const { error: authUpdateErr } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword });
       if (authUpdateErr) return NextResponse.json({ success: false, status: 'error', error: 'Password update failed. Please try again.' }, { status: 500 });
       const passwordStatusUpdate = student
         ? { must_change_password: false, temp_password_reset: false, password_expires_at: null, last_password_change: new Date().toISOString(), updated_at: new Date().toISOString() }
         : { temp_password_reset: false, last_password_change: new Date().toISOString(), updated_at: new Date().toISOString() };
       const { error: updateErr } = await supabase.from(student ? 'students' : 'clients').update(passwordStatusUpdate).eq('user_id', user.id);
       if (updateErr) return NextResponse.json({ success: false, status: 'error', error: 'Password changed, but the portal status could not be updated.' }, { status: 500 });
       return NextResponse.json({ success: true, status: 'success', message: 'Password updated successfully.' });
     }

     // Staff: move a student to a journey step. Only the status allow-list is accepted.
     case 'updateStudentStatus': {
       const { user, error: authErr } = await getAuthenticatedUser(req);
       if (authErr || !isStaffOrAdmin(user)) {
         return NextResponse.json({ success: false, status: 'error', error: 'Unauthorized: Staff or administrator authentication required.' }, { status: 401 });
       }
       const studentId = typeof payload.studentId === 'string' ? payload.studentId.trim() : '';
       if (!STUDENT_ID_PATTERN.test(studentId)) {
         return NextResponse.json({ success: false, status: 'error', error: 'A valid student ID is required.' }, { status: 400 });
       }
       const statusCheck = checkStudentStatus(payload.status);
       if (!statusCheck.ok) return NextResponse.json({ success: false, status: 'error', error: statusCheck.error }, { status: 400 });

       supabase = getPrivilegedClient();
       const { data: existing, error: findErr } = await supabase.from('students').select('id, student_id').eq('student_id', studentId).maybeSingle();
       if (findErr) {
         console.error('[updateStudentStatus] Student lookup failed:', findErr.message);
         return NextResponse.json({ success: false, status: 'error', error: 'Could not look up the student record. Nothing was saved.' }, { status: 500 });
       }
       if (!existing) return NextResponse.json({ success: false, status: 'error', error: 'Student not found. Nothing was saved.' }, { status: 404 });

       const { data: updated, error: updateErr } = await supabase.from('students')
         .update({ status: statusCheck.value, updated_at: new Date().toISOString() })
         .eq('student_id', studentId).eq('id', existing.id).select('student_id');
       if (updateErr) {
         console.error('[updateStudentStatus] Update failed:', updateErr.message);
         return NextResponse.json({ success: false, status: 'error', error: 'The status could not be saved.' }, { status: 500 });
       }
       if (!Array.isArray(updated) || updated.length !== 1) {
         return NextResponse.json({ success: false, status: 'error', error: 'The status change could not be confirmed. Nothing was saved.' }, { status: 409 });
       }
       return NextResponse.json({ success: true, status: 'success', message: 'Student status updated.', studentId, newStatus: statusCheck.value });
     }

     // Staff: edit a student record. Only the columns named in ADMIN_EDIT_STUDENT_FIELDS can change; the portal
     // login (email, user_id, student_id, role/is_admin, password and token columns) is never writable here.
     case 'adminEditStudent': {
       const { user, error: authErr } = await getAuthenticatedUser(req);
       if (authErr || !isStaffOrAdmin(user)) {
         return NextResponse.json({ success: false, status: 'error', error: 'Unauthorized: Staff or administrator authentication required.' }, { status: 401 });
       }
       const studentId = typeof payload.studentId === 'string' ? payload.studentId.trim() : '';
       if (!STUDENT_ID_PATTERN.test(studentId)) {
         return NextResponse.json({ success: false, status: 'error', error: 'A valid student ID is required.' }, { status: 400 });
       }
       const updates = payload.updates;
       if (!isPlainObject(updates)) {
         return NextResponse.json({ success: false, status: 'error', error: 'An updates object is required.' }, { status: 400 });
       }

       const row: Record<string, string | null> = {};
       let hasEmail = false;
       let requestedEmail: unknown = undefined;
       for (const [key, raw] of Object.entries(updates)) {
         if (key === 'email') { hasEmail = true; requestedEmail = raw; continue; }
         if (!Object.prototype.hasOwnProperty.call(ADMIN_EDIT_STUDENT_FIELDS, key)) {
           return NextResponse.json({ success: false, status: 'error', error: `The field "${key.slice(0, 40)}" cannot be changed here.` }, { status: 400 });
         }
         const column = ADMIN_EDIT_STUDENT_FIELDS[key];
         let check: FieldCheck;
         switch (column) {
           case 'full_name': check = checkText('Full name', raw, 120, { required: true }); break;
           case 'phone':
             // students.phone is NOT NULL, so a blank phone is stored as an empty string, never null.
             check = checkText('Phone', raw, 40);
             if (check.ok && check.value === null) check = { ok: true, value: '' };
             break;
           case 'course_selection': check = checkText('Course', raw, 200); break;
           case 'assigned_date': check = checkText('Class date', raw, 100); break;
           case 'qualification_score': check = checkText('Qualification score', raw, 50); break;
           case 'status': check = checkStudentStatus(raw); break;
           case 'profile_doc_url': check = checkDocumentUrl(raw); break;
           default: check = checkText('Notes', raw, 5000, { multiline: true }); break;
         }
         if (!check.ok) return NextResponse.json({ success: false, status: 'error', error: check.error }, { status: 400 });
         // The roster does not send stored internal notes back to the browser, so an empty Notes box means
         // "not shown", not "clear". Empty notes therefore never overwrite what staff already saved.
         if (column === 'internal_notes' && check.value === null) continue;
         if (Object.prototype.hasOwnProperty.call(row, column) && row[column] !== check.value) {
           return NextResponse.json({ success: false, status: 'error', error: `Conflicting values were supplied for ${column}.` }, { status: 400 });
         }
         row[column] = check.value;
       }
       if (Object.keys(row).length === 0 && !hasEmail) {
         return NextResponse.json({ success: false, status: 'error', error: 'No editable changes were supplied.' }, { status: 400 });
       }

       supabase = getPrivilegedClient();
       const { data: existing, error: findErr } = await supabase.from('students').select('id, student_id, email').eq('student_id', studentId).maybeSingle();
       if (findErr) {
         console.error('[adminEditStudent] Student lookup failed:', findErr.message);
         return NextResponse.json({ success: false, status: 'error', error: 'Could not look up the student record. Nothing was saved.' }, { status: 500 });
       }
       if (!existing) return NextResponse.json({ success: false, status: 'error', error: 'Student not found. Nothing was saved.' }, { status: 404 });

       if (hasEmail) {
         const requested = typeof requestedEmail === 'string' ? requestedEmail.trim().toLowerCase() : null;
         if (requested === null || requested !== String(existing.email || '').trim().toLowerCase()) {
           return NextResponse.json({ success: false, status: 'error', error: 'Email addresses cannot be modified here to avoid desyncing portal login credentials.' }, { status: 400 });
         }
       }
       if (Object.keys(row).length === 0) {
         return NextResponse.json({ success: false, status: 'error', error: 'No editable changes were supplied.' }, { status: 400 });
       }

       const { data: updated, error: updateErr } = await supabase.from('students')
         .update({ ...row, updated_at: new Date().toISOString() })
         .eq('student_id', studentId).eq('id', existing.id).select('student_id');
       if (updateErr) {
         console.error('[adminEditStudent] Update failed:', updateErr.message);
         return NextResponse.json({ success: false, status: 'error', error: 'The student record could not be saved.' }, { status: 500 });
       }
       if (!Array.isArray(updated) || updated.length !== 1) {
         return NextResponse.json({ success: false, status: 'error', error: 'The student edit could not be confirmed. Nothing was saved.' }, { status: 409 });
       }
       return NextResponse.json({ success: true, status: 'success', message: 'Student record updated.', studentId, updatedFields: Object.keys(row) });
     }

     // Student: tick a prep checklist item. The row is found only from the verified token's user id; any
     // studentId or email in the request is ignored.
     case 'updateStudentTask': {
       const { user, error: authErr } = await getAuthenticatedUser(req);
       if (authErr || !user) {
         return NextResponse.json({ success: false, status: 'error', error: 'Unauthorized: Authentication required.' }, { status: 401 });
       }
       let entries: Array<[unknown, unknown]>;
       if (payload.tasks !== undefined) {
         if (!isPlainObject(payload.tasks)) {
           return NextResponse.json({ success: false, status: 'error', error: 'Tasks must be an object of task names and true/false values.' }, { status: 400 });
         }
         entries = Object.entries(payload.tasks);
       } else {
         entries = [[payload.taskId, payload.isChecked]];
       }
       const requested: Record<string, boolean> = {};
       for (const [key, value] of entries) {
         if (typeof key !== 'string' || !PREP_TASK_KEYS.includes(key) || typeof value !== 'boolean') {
           return NextResponse.json({ success: false, status: 'error', error: 'Unknown checklist item or value. Allowed items: ' + PREP_TASK_KEYS.join(', ') + ', each set to true or false.' }, { status: 400 });
         }
         requested[key] = value;
       }
       if (Object.keys(requested).length === 0) {
         return NextResponse.json({ success: false, status: 'error', error: 'No checklist change was supplied.' }, { status: 400 });
       }

       supabase = getPrivilegedClient();
       const { data: row, error: findErr } = await supabase.from('students').select('id, user_id, prep_tasks').eq('user_id', user.id).maybeSingle();
       if (findErr) {
         console.error('[updateStudentTask] Student lookup failed:', findErr.message);
         return NextResponse.json({ success: false, status: 'error', error: 'Could not look up your record. Nothing was saved.' }, { status: 500 });
       }
       if (!row || row.user_id !== user.id) {
         return NextResponse.json({ success: false, status: 'error', error: 'Linked student record not found.' }, { status: 404 });
       }
       const current = isPlainObject(row.prep_tasks) ? row.prep_tasks : {};
       const merged = { transport_law: false, ammo_acquired: false, eye_ear_pro: false, id_ready: false, ...current, ...requested };

       const { data: updated, error: updateErr } = await supabase.from('students')
         .update({ prep_tasks: merged, updated_at: new Date().toISOString() })
         .eq('user_id', user.id).eq('id', row.id).select('id');
       if (updateErr) {
         console.error('[updateStudentTask] Update failed:', updateErr.message);
         return NextResponse.json({ success: false, status: 'error', error: 'Checklist progress could not be saved.' }, { status: 500 });
       }
       if (!Array.isArray(updated) || updated.length !== 1) {
         return NextResponse.json({ success: false, status: 'error', error: 'The checklist change could not be confirmed. Nothing was saved.' }, { status: 409 });
       }
       return NextResponse.json({ success: true, status: 'success', message: 'Checklist progress saved.', prepTasks: merged });
     }

     case 'getClientPortalData': {
       const { user, error: authErr } = await getAuthenticatedUser(req);
       if (authErr || !user) return NextResponse.json({ success: false, status: 'error', error: 'Unauthorized: Authentication required.' }, { status: 401 });
       supabase = getPrivilegedClient();
       const identifier = String(payload.identifier || payload.clientId || payload.email || '').trim().toLowerCase();
       let client: any = null;
       if (isStaffOrAdmin(user)) {
         if (!identifier) return NextResponse.json({ success: false, status: 'error', error: 'Client identifier required.' }, { status: 400 });
         const { data } = await supabase.from('clients').select('*').or(`client_id.eq.${identifier.toUpperCase()},email.eq.${identifier}`).maybeSingle();
         client = data;
       } else {
         const { data } = await supabase.from('clients').select('*').eq('user_id', user.id).maybeSingle();
         client = data;
         if (client && identifier && identifier !== String(client.client_id || '').toLowerCase() && identifier !== String(user.email || '').toLowerCase()) {
           return NextResponse.json({ success: false, status: 'error', error: 'Forbidden: Access restricted to your own client account.' }, { status: 403 });
         }
       }
       if (!client) return NextResponse.json({ success: false, status: 'error', error: 'Linked client record not found.' }, { status: 404 });
       return NextResponse.json({ success: true, status: 'success', client: {
         clientId: client.client_id, fullName: client.full_name, email: client.email, phone: client.phone,
         permitType: client.permit_type || 'Maryland Wear & Carry (CCW)', permitState: client.permit_state || 'Maryland',
         expirationDate: client.expiration_date || null, status: client.status || 'ACTIVE_PERMIT_HOLDER',
         optInReminder: Boolean(client.opt_in_reminder), smsAlertPhone: client.sms_alert_phone || client.phone
       }});
     }

     case 'getStudentPortalData': {
       const { user, error: authErr } = await getAuthenticatedUser(req);
       if (authErr || !user) return NextResponse.json({ success: false, status: 'error', error: 'Unauthorized: Authentication required to view student portal.' }, { status: 401 });
       supabase = getPrivilegedClient();
       const identifier = String(payload.identifier || payload.studentId || payload.email || '').trim().toLowerCase();
       let student: any = null;
       if (isStaffOrAdmin(user)) {
         if (!identifier) return NextResponse.json({ success: false, status: 'error', error: 'Student identifier required.' }, { status: 400 });
         const { data } = await supabase.from('students').select('*').or(`student_id.eq.${identifier.toUpperCase()},email.eq.${identifier}`).maybeSingle();
         student = data;
       } else {
         const { data } = await supabase.from('students').select('*').eq('user_id', user.id).maybeSingle();
         student = data;
         if (student && identifier && identifier !== String(student.student_id || '').toLowerCase() && identifier !== String(user.email || '').toLowerCase()) {
           return NextResponse.json({ success: false, status: 'error', error: 'Forbidden: Access restricted to your own student account.' }, { status: 403 });
         }
       }
       if (!student) return NextResponse.json({ success: false, status: 'error', error: 'Linked student record not found.' }, { status: 404 });
       if (!isStaffOrAdmin(user) && student.user_id !== user.id) return NextResponse.json({ success: false, status: 'error', error: 'Linked student record not found.' }, { status: 404 });
       const { data: enrollments } = await supabase.from('enrollments')
         .select('id, class_id, scheduled_date, duration_hours, status, cancellation_reason, previous_dates, created_at, classes(title, description, materials_path, required_gear_notes)')
         .eq('student_email', student.email).order('scheduled_date', { ascending: false });
       const enrollmentsWithUrls = await Promise.all((enrollments || []).map(async (enrollment: any) => ({
         ...enrollment,
         materialsUrl: enrollment.classes?.materials_path ? await getSignedDocumentUrl(supabase, enrollment.classes.materials_path) : null
       })));
       // Staff-only notes are never part of the view a student receives (see normalizeStudent).
       const studentView: any = normalizeStudent(student, { includeInternalNotes: isStaffOrAdmin(user) });
       return NextResponse.json({ success: true, status: 'success', student: {
         ...studentView, enrollments: enrollmentsWithUrls, mustChangePassword: Boolean(student.must_change_password)
       }});
     }

     case 'check24HourReminders': {
       const cronSecret = req.headers.get('x-cron-secret');
       const configuredCronSecret = (process.env.CRON_SECRET || '').trim();
       // A cron credential was presented but the server has no dedicated CRON_SECRET: fail closed
       // as a configuration error. The service-role key is never accepted as a cron credential.
       if (cronSecret && !configuredCronSecret) {
         return NextResponse.json({ success: false, error: 'Scheduled reminders are not configured: CRON_SECRET is required.' }, { status: 503 });
       }
       const isCron = secretsMatch(cronSecret, configuredCronSecret || undefined);

       if (!isCron) {
         const { user, error: authErr } = await getAuthenticatedUser(req);
         if (authErr || !isStaffOrAdmin(user)) {
           return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication or cron secret required.' }, { status: 401 });
         }
       }
       // Without an email provider key nothing can be sent, so do not query or mark anything.
       if (!(process.env.RESEND_API_KEY || '').trim()) {
         console.error('[Reminders] RESEND_API_KEY is not configured; no reminders were attempted.');
         return NextResponse.json({ success: false, error: 'Reminder email is not configured on the server.', processedCount: 0, sentIds: [], failedCount: 0, failedIds: [] }, { status: 503 });
       }
       supabase = getPrivilegedClient();
       const now = new Date();
       const startWindow = new Date(now.getTime() + 23 * 3600 * 1000);
       const endWindow = new Date(now.getTime() + 25 * 3600 * 1000);


       const { data: pendingReminders, error: remErr } = await supabase
         .from('enrollments')
         .select('*, classes(*)')
         .eq('status', 'confirmed')
         .eq('reminder_sent', false)
         .gte('scheduled_date', startWindow.toISOString())
         .lte('scheduled_date', endWindow.toISOString());


       if (remErr) {
         return NextResponse.json({ success: false, error: remErr.message }, { status: 500 });
       }


       // A reminder is marked sent only after the email provider accepted it. A failure on one
       // enrollment never stops the others, and failures are reported with generic reason codes only
       // (never recipient addresses, secrets, or provider error text).
       const sentList: string[] = [];
       const failures: Array<{ id: string; reason: 'missing_recipient' | 'send_failed' | 'mark_failed' }> = [];
       for (const enr of (pendingReminders || [])) {
         try {
           const recipient = String(enr.student_email || '').trim();
           if (!recipient) {
             failures.push({ id: enr.id, reason: 'missing_recipient' });
             continue;
           }

           const classTitle = enr.classes?.title || 'Firearms Qualification Course';
           const gearNotes = enr.classes?.required_gear_notes || 'Eye and ear protection, government ID, range fees.';
           const dateStr = new Date(enr.scheduled_date).toLocaleString();
           const docUrl = await getSignedDocumentUrl(supabase, enr.classes?.materials_path);


           const html = `<p>Reminder: Your upcoming class <strong>${escapeHtml(classTitle)}</strong> is scheduled for <strong>${escapeHtml(dateStr)}</strong>.</p>` + (docUrl ? `<p><a href="${escapeHtml(docUrl)}" style="background:#0284c7;color:#ffffff;padding:8px 16px;border-radius:4px;text-decoration:none;font-weight:bold;">Review Course Study Guide</a></p>` : "");


           const sendResult = await sendResendEmail({
             to: recipient,
             subject: 'Course Confirmation & Portal Access - ' + classTitle,
             html: html
           });
           if (!sendResult || !sendResult.success) {
             failures.push({ id: enr.id, reason: 'send_failed' });
             continue;
           }

           const { error: markErr } = await supabase
             .from('enrollments')
             .update({ reminder_sent: true })
             .eq('id', enr.id)
             .eq('reminder_sent', false);
           if (markErr) {
             // The email went out but could not be recorded, so a later run may send it again.
             failures.push({ id: enr.id, reason: 'mark_failed' });
             continue;
           }
           sentList.push(enr.id);
         } catch {
           failures.push({ id: enr.id, reason: 'send_failed' });
         }
       }

       for (const f of failures) console.warn('[Reminders] Not completed for enrollment', f.id, '- reason:', f.reason);
       if (failures.length > 0) {
         return NextResponse.json({
           success: false,
           error: 'One or more reminders could not be completed.',
           processedCount: sentList.length,
           sentIds: sentList,
           failedCount: failures.length,
           failedIds: failures.map((f) => f.id),
           failures
         }, { status: 502 });
       }

       return NextResponse.json({ success: true, processedCount: sentList.length, sentIds: sentList, failedCount: 0, failedIds: [] });
     }


     // 9. Admin Dashboard Roster & History
          // 8a. Live Chat Visitor/Student Message Handler (Persists to Supabase & Dispatches Discord Alert)
     case 'handleLiveChatMessage': {
       supabase = getPublicClient();
       const {
         name, fullName, senderName,
         email, senderEmail,
         phone, senderPhone,
         message, text: msgText,
         threadId, thread_id,
         threadSecret, thread_secret,
         urgency = 'HIGH'
       } = payload;

       const finalName = String(senderName || fullName || name || 'Website Visitor').trim().slice(0, 100);
       const rawEmail = String(senderEmail || email || '').trim().toLowerCase().slice(0, 150);
       const finalEmail = (rawEmail && rawEmail.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) ? rawEmail : null;
       const finalPhone = String(senderPhone || phone || '').trim().slice(0, 30);
       const finalMsg = String(message || msgText || '').trim().slice(0, 2000);

       if (!finalMsg) {
         return NextResponse.json({ success: false, error: 'Message content is required.' }, { status: 400 });
       }

       const incomingThread = (threadId || thread_id || '').trim();
       const incomingSecret = (threadSecret || thread_secret || '').trim();

       let finalThread = incomingThread;
       let finalSecret = incomingSecret;

       try {
         if (incomingThread) {
           // Existing thread: verify caller possesses the valid unguessable thread credential
           if (!incomingSecret || !verifyThreadSecret(incomingThread, incomingSecret)) {
             return NextResponse.json({ success: false, error: 'Forbidden: Invalid or missing thread credential.' }, { status: 403 });
           }
         } else {
           // New thread: generate strong unguessable thread ID and cryptographic secret
           finalThread = 'th_' + crypto.randomBytes(16).toString('hex');
           finalSecret = computeThreadSecret(finalThread);
         }
       } catch (err: any) {
         if (err instanceof ConfigurationError) {
           return NextResponse.json({ success: false, error: 'Live chat service unavailable: Missing secure server configuration.' }, { status: 503 });
         }
         throw err;
       }

       // Insert into messages table
       const { data: insertedMsg, error: insertErr } = await supabase
         .from('messages')
         .insert([{
           name: finalName,
           sender_name: finalName,
           email: finalEmail || null,
           phone: finalPhone || null,
           sender_phone: finalPhone || null,
           message: finalMsg,
           thread_id: finalThread,
           sender: 'visitor',
           urgency: urgency,
           status: 'UNREAD',
           sent_at: new Date().toISOString()
         }])
         .select()
         .single();

       if (insertErr) {
         console.error('[FIFS] Error inserting live chat message:', insertErr);
         return NextResponse.json({ success: false, error: insertErr.message }, { status: 500 });
       }

       // Asynchronous Server-Side Discord Alert
       await sendServerDiscordAlert(
         "💬 Live Chat Inquiry: " + finalName,
         "A student or visitor submitted a live inquiry on TrainWithFIFS.",
         [
           { name: "Sender", value: finalName, inline: true },
           { name: "Phone", value: finalPhone || "Not provided", inline: true },
           { name: "Email", value: finalEmail || "Not provided", inline: true },
           { name: "Thread ID", value: finalThread, inline: true },
           { name: "Message Content", value: finalMsg, inline: false }
         ],
         0x00E5FF
       );

       return NextResponse.json({
         success: true,
         status: 'success',
         message: 'Live chat message received and synced to Admin Hub.',
         threadId: finalThread,
         threadSecret: finalSecret,
         data: {
           id: insertedMsg?.id,
           sender: 'visitor',
           senderName: finalName,
           message: finalMsg,
           sent_at: insertedMsg?.sent_at
         }
       });
     }

     case 'sendAdminLiveChatReply': {
       const { user, error: authErr } = await getAuthenticatedUser(req);
       if (authErr || !isStaffOrAdmin(user)) {
         return NextResponse.json({ success: false, error: 'Unauthorized: Staff or administrator authentication required.' }, { status: 401 });
       }
       supabase = getPrivilegedClient();

       const {
         threadId, thread_id,
         text: replyMsgText, message, replyText,
         senderPhone, phone,
         senderEmail, email
       } = payload;

       const finalMsg = (replyText || message || replyMsgText || body.text || body.message || body.replyText || '').trim();
       const finalThread = (threadId || thread_id || body.threadId || body.thread_id || '').trim();

       if (!finalMsg || !finalThread) {
         return NextResponse.json({ success: false, error: 'Thread ID and message text are required.' }, { status: 400 });
       }

       // 1. Insert admin reply
       const { data: replyRecord, error: replyErr } = await supabase
         .from('messages')
         .insert([{
           name: 'Lead Instructor Kai Wade',
           sender_name: 'Lead Instructor Kai Wade',
           message: finalMsg,
           thread_id: finalThread,
           sender: 'instructor',
           status: 'READ',
           sent_at: new Date().toISOString()
         }])
         .select()
         .single();

       if (replyErr) {
         console.error('[FIFS] Error inserting admin reply:', replyErr);
         return NextResponse.json({ success: false, error: replyErr.message }, { status: 500 });
       }

       // 2. Mark visitor thread messages as READ
       await supabase
         .from('messages')
         .update({ status: 'READ' })
         .eq('thread_id', finalThread);

       return NextResponse.json({
         success: true,
         status: 'success',
         message: 'Instructor reply dispatched and thread marked resolved.',
         reply: replyRecord
       });
     }

     case 'getVisitorChatMessages': {
       supabase = getPublicClient();
       const tId = (payload.threadId || payload.thread_id || body.threadId || body.thread_id || '').trim();
       const tSecret = (payload.threadSecret || payload.thread_secret || body.threadSecret || body.thread_secret || '').trim();

       if (!tId || !tSecret) {
         return NextResponse.json({ success: false, error: 'Unauthorized: threadId and threadSecret are required to access visitor messages.' }, { status: 401 });
       }

       try {
         if (!verifyThreadSecret(tId, tSecret)) {
           return NextResponse.json({ success: false, error: 'Forbidden: Invalid thread credential.' }, { status: 403 });
         }
       } catch (err: any) {
         if (err instanceof ConfigurationError) {
           return NextResponse.json({ success: false, error: 'Live chat service unavailable: Missing secure server configuration.' }, { status: 503 });
         }
         throw err;
       }

       // Query ONLY messages for this validated thread and select ONLY safe fields
       const { data: msgs, error: chatErr } = await supabase
         .from('messages')
         .select('id, sender, sender_name, message, sent_at')
         .eq('thread_id', tId)
         .order('sent_at', { ascending: true });

       if (chatErr) {
         console.error('[FIFS] Error fetching visitor messages:', chatErr);
         return NextResponse.json({ success: false, error: chatErr.message }, { status: 500 });
       }

       const safeMessages = (msgs || []).map((m: any) => ({
         id: m.id,
         sender: m.sender,
         senderName: m.sender === 'instructor' ? 'Lead Instructor Kai Wade' : (m.sender_name || 'Visitor'),
         text: m.message,
         sentAt: m.sent_at,
         time: m.sent_at ? new Date(m.sent_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''
       }));

       return NextResponse.json({
         success: true,
         status: 'success',
         threadId: tId,
         messages: safeMessages
       });
     }

     case 'getLiveChats': {
       const { user, error: authErr } = await getAuthenticatedUser(req);
       if (authErr || !isStaffOrAdmin(user)) {
         return NextResponse.json({ success: false, error: 'Unauthorized: Staff or administrator authentication required.' }, { status: 401 });
       }
       supabase = getPrivilegedClient();

       const { data: msgs, error: chatErr } = await supabase
         .from('messages')
         .select('*')
         .order('sent_at', { ascending: true });

       if (chatErr) {
         console.error('[FIFS] Error fetching messages:', chatErr);
         return NextResponse.json({ success: false, error: chatErr.message }, { status: 500 });
       }

       const threadMap: Record<string, any> = {};
       (msgs || []).forEach((m: any) => {
         const key = m.thread_id || 'unknown';
         if (!threadMap[key]) {
           threadMap[key] = {
             id: key,
             senderName: m.sender === 'instructor' ? 'Student' : (m.sender_name || m.name || 'Visitor'),
             senderPhone: m.sender_phone || m.phone || 'Live Visitor',
             senderEmail: m.email || '',
             lastUpdated: m.sent_at ? new Date(m.sent_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '',
             lastTimestamp: new Date(m.sent_at || 0).getTime(),
             unread: m.status === 'UNREAD' && m.sender !== 'instructor',
             messages: []
           };
         }
         if (m.sender !== 'instructor') {
           if (m.sender_name || m.name) threadMap[key].senderName = m.sender_name || m.name;
           if (m.sender_phone || m.phone) threadMap[key].senderPhone = m.sender_phone || m.phone;
           if (m.email) threadMap[key].senderEmail = m.email;
           if (m.status === 'UNREAD') threadMap[key].unread = true;
         }
         threadMap[key].messages.push({
           sender: m.sender,
           senderName: m.sender_name || m.name,
           text: m.message,
           time: m.sent_at ? new Date(m.sent_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''
         });
         threadMap[key].lastUpdated = m.sent_at ? new Date(m.sent_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
       });

       const liveChats = Object.values(threadMap).sort((a: any, b: any) => {
         if (a.unread && !b.unread) return -1;
         if (!a.unread && b.unread) return 1;
         return (b.lastTimestamp || 0) - (a.lastTimestamp || 0);
       });

       return NextResponse.json({
         success: true,
         status: 'success',
         liveChats: liveChats,
         threads: liveChats
       });
     }

     case 'getLiveChatMessages': {
       const { user, error: authErr } = await getAuthenticatedUser(req);
       if (authErr || !isStaffOrAdmin(user)) {
         return NextResponse.json({ success: false, error: 'Unauthorized: Staff or administrator authentication required.' }, { status: 401 });
       }
       supabase = getPrivilegedClient();

       const tId = (payload.threadId || payload.thread_id || body.threadId || body.thread_id || '').trim();
       let query = supabase.from('messages').select('*').order('sent_at', { ascending: true });
       if (tId) {
         query = query.eq('thread_id', tId);
       }
       const { data: msgs, error: chatErr } = await query;
       if (chatErr) {
         return NextResponse.json({ success: false, error: chatErr.message }, { status: 500 });
       }

       return NextResponse.json({
         success: true,
         status: 'success',
         messages: msgs || []
       });
     }

     case 'deleteLiveChatThread': {
       const { user, error: authErr } = await getAuthenticatedUser(req);
       if (authErr || !isStaffOrAdmin(user)) {
         return NextResponse.json({ success: false, error: 'Unauthorized: Staff or administrator authentication required.' }, { status: 401 });
       }
       supabase = getPrivilegedClient();
       const tId = (payload.threadId || payload.thread_id || body.threadId || body.thread_id || '').trim();
       if (!tId) {
         return NextResponse.json({ success: false, error: 'threadId is required.' }, { status: 400 });
       }
       const { error: delErr } = await supabase
         .from('messages')
         .delete()
         .eq('thread_id', tId);
       if (delErr) {
         return NextResponse.json({ success: false, error: delErr.message }, { status: 500 });
       }
       return NextResponse.json({ success: true, message: 'Chat thread deleted.' });
     }

     case 'markLiveChatRead': {
       const { user, error: authErr } = await getAuthenticatedUser(req);
       if (authErr || !isStaffOrAdmin(user)) {
         return NextResponse.json({ success: false, error: 'Unauthorized: Staff or administrator authentication required.' }, { status: 401 });
       }
       supabase = getPrivilegedClient();
       const tId = (payload.threadId || payload.thread_id || body.threadId || body.thread_id || '').trim();
       if (!tId) {
         return NextResponse.json({ success: false, error: 'threadId is required.' }, { status: 400 });
       }
       const { error: updErr } = await supabase
         .from('messages')
         .update({ status: 'READ' })
         .eq('thread_id', tId);
       if (updErr) {
         return NextResponse.json({ success: false, error: updErr.message }, { status: 500 });
       }
       return NextResponse.json({ success: true, message: 'Chat thread marked read.' });
     }

     case 'getAdminDashboardData': {
       const { user, error: authErr } = await getAuthenticatedUser(req);
       if (authErr || !isStaffOrAdmin(user)) {
         return NextResponse.json({ success: false, error: 'Unauthorized: Staff or administrator authentication required.' }, { status: 401 });
       }
       supabase = getPrivilegedClient();
        const { data: students } = await supabase
          .from('students')
          .select('*')
          .order('created_at', { ascending: false });

        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('*, classes(title)')
          .order('scheduled_date', { ascending: false });

        const { data: clients } = await supabase
          .from('clients')
          .select('*')
          .order('created_at', { ascending: false });

        // Query all messages for live chat console
        const { data: chatMessages } = await supabase
          .from('messages')
          .select('*')
          .order('sent_at', { ascending: true });

        const threadMap: Record<string, any> = {};
        (chatMessages || []).forEach((m: any) => {
          const key = m.thread_id || 'unknown';
          if (!threadMap[key]) {
            threadMap[key] = {
              id: key,
              senderName: m.sender === 'instructor' ? 'Student' : (m.sender_name || m.name || 'Visitor'),
              senderPhone: m.sender_phone || m.phone || 'Live Visitor',
              senderEmail: m.email || '',
              lastUpdated: m.sent_at ? new Date(m.sent_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '',
              lastTimestamp: new Date(m.sent_at || 0).getTime(),
              unread: m.status === 'UNREAD' && m.sender !== 'instructor',
              messages: []
            };
          }
          if (m.sender !== 'instructor') {
            if (m.sender_name || m.name) threadMap[key].senderName = m.sender_name || m.name;
            if (m.sender_phone || m.phone) threadMap[key].senderPhone = m.sender_phone || m.phone;
            if (m.email) threadMap[key].senderEmail = m.email;
            if (m.status === 'UNREAD') threadMap[key].unread = true;
          }
          threadMap[key].messages.push({
            sender: m.sender,
            senderName: m.sender_name || m.name,
            text: m.message,
            time: m.sent_at ? new Date(m.sent_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''
          });
          threadMap[key].lastUpdated = m.sent_at ? new Date(m.sent_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
        });

        // Sort threads: Unread inquiries always rank at the top, then newest timestamp
        const liveChats = Object.values(threadMap).sort((a: any, b: any) => {
          if (a.unread && !b.unread) return -1;
          if (!a.unread && b.unread) return 1;
          return (b.lastTimestamp || 0) - (a.lastTimestamp || 0);
        });

        return NextResponse.json({
          success: true,
          status: 'success',
          students: (students || []).map(normalizeStudent),
          clients: (clients || []).map(normalizeClient),
          enrollments: enrollments || [],
          liveChats: liveChats,
          threads: liveChats,
          messages: chatMessages || []
        });
      }


     // 10. Course Registration & Stripe Checkout Session Creator
     case 'submitBooking': {
       // Shared, server-priced checkout: client-supplied IDs, totals, and user IDs are ignored.
       const result = await createBookingCheckout(req, payload);
       if (result.status !== 200) {
         return NextResponse.json(result.body, { status: result.status });
       }

       // If group booking (more than 1 person), generate private pod invite code
       let podInviteCode = null;
       if (result.body.attendees > 1) {
         try {
           const pricingCourse = String(payload.courseSelection || 'Maryland Firearms Training Course').trim().slice(0, 200);
           const { data: codeData } = await getPublicClient().rpc('create_booking_group', {
             p_leader_name: String(payload.fullName || 'FIFS Training Student').trim().slice(0, 100),
             p_leader_email: String(payload.email).trim().toLowerCase(),
             p_leader_phone: String(payload.phone || '').trim().slice(0, 30) || null,
             p_course: pricingCourse,
             p_track: result.body.isVip ? 'VIP' : 'Base',
             p_preferred_dates: String(payload.preferredDates || 'Coordinated with Lead Instructor Kai Wade').trim().slice(0, 200),
             p_max_seats: result.body.attendees
           });
           podInviteCode = codeData;
         } catch (podErr) {
           console.warn('[FIFS] Pod generation note:', podErr);
         }
       }

       return NextResponse.json({ ...result.body, podInviteCode });
     }

     case 'trackSiteVisit': {
       const rawPath = String(payload.path || body.path || '/').slice(0, 255);
       return NextResponse.json({ success: true, tracked: true });
     }

     case 'submitContactInquiry': {
       supabase = getPublicClient();
       const fullName = String(payload.fullName || payload.name || body.fullName || 'Inquiry Visitor').trim().slice(0, 100);
       const phone = String(payload.phone || body.phone || '').trim().slice(0, 30);
       const message = String(payload.message || body.message || '').trim().slice(0, 2000);
       const rawEmail = String(payload.email || body.email || '').trim().toLowerCase().slice(0, 150);
       const email = (rawEmail && rawEmail.includes('@')) ? rawEmail : null;

       if (!message && !phone) {
         return NextResponse.json({ success: false, error: 'A message or phone number is required.' }, { status: 400 });
       }

       try {
         await supabase.from('leads').insert([{
           full_name: fullName,
           phone: phone || null,
           email: email || null,
           notes: message,
           source: 'Contact Inquiry Form'
         }]);
       } catch (_e) {}

       await sendServerDiscordAlert(
         "📩 New Contact Form Inquiry: " + fullName,
         "A visitor submitted an inquiry via the contact form.",
         [
           { name: "Name", value: fullName, inline: true },
           { name: "Phone", value: phone || "Not provided", inline: true },
           { name: "Email", value: email || "Not provided", inline: true },
           { name: "Message", value: message || "No message content", inline: false }
         ],
         0xF59E0B
       );

       return NextResponse.json({ success: true, message: 'Contact inquiry received.' });
     }

     default:
       if (typeof action === 'string' && Object.prototype.hasOwnProperty.call(NOT_IMPLEMENTED_ACTIONS, action)) {
         return NextResponse.json({
           success: false,
           status: 'error',
           notImplemented: true,
           error: `${NOT_IMPLEMENTED_ACTIONS[action]} is not available yet. This change was NOT saved.`
         }, { status: 501 });
       }
       return NextResponse.json({ success: false, error: 'Unhandled action: ' + action }, { status: 400 });
   }
 } catch (err: any) {
   if (err instanceof ConfigurationError) {
     // Missing or unsafe environment configuration (message names variables only, never values).
     console.error('[API FIFS Configuration Error]:', err.message);
     return NextResponse.json({ success: false, status: 'error', error: 'Service is not configured for this environment. ' + err.message }, { status: 503 });
   }
   console.error('[API FIFS Error]:', err);
   return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
 }
}