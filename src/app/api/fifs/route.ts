import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';


// Public Supabase client for token verification and unprivileged operations
function getPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ufqnmcincwnlyiwsmzcq.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Supabase public credentials (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY) are not configured.');
  }
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured.');
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false }
  });
}

// Privileged Service Role client - created ONLY after request authorization succeeds
function getPrivilegedClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ufqnmcincwnlyiwsmzcq.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Supabase service role credentials (SUPABASE_SERVICE_ROLE_KEY) are not configured.');
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false }
  });
}


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


// --- Supabase Auth & Zero-Trust Bearer Token Verification ---
async function getAuthenticatedUser(req: NextRequest): Promise<{ user: any; error: string | null }> {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return { user: null, error: 'Unauthorized: Missing or invalid Authorization Bearer header.' };
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return { user: null, error: 'Unauthorized: Missing authentication bearer token.' };
  }

  try {
    // Validates token strictly via public client; does NOT create privileged service-role client
    const publicClient = getPublicClient();
    const { data: { user }, error } = await publicClient.auth.getUser(token);
    if (error || !user) {
      return { user: null, error: error?.message || 'Unauthorized: Invalid or expired authentication token.' };
    }
    return { user, error: null };
  } catch (err: any) {
    return { user: null, error: 'Unauthorized: Failed to verify authentication session.' };
  }
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
  const secret = (process.env.CHAT_HMAC_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!secret || secret.length < 32) {
    throw new Error('Server configuration error: Strong CHAT_HMAC_SECRET or SUPABASE_SERVICE_ROLE_KEY is required.');
  }
  return secret;
}

function computeThreadSecret(threadId: string): string {
  const secret = getChatHmacSecret();
  return crypto.createHmac('sha256', secret).update(threadId).digest('hex');
}

function verifyThreadSecret(threadId: string, providedSecret?: string): boolean {
  if (!threadId || !providedSecret) return false;
  try {
    const expected = computeThreadSecret(threadId);
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


// Helper to normalize student
function normalizeStudent(s: any) {
  if (!s) return null;
  return {
    studentId: s.student_id || s.id,
    fullName: s.full_name || s.name || 'Student',
    email: s.email,
    phone: s.phone || '',
    course: s.course || s.course_name || s.course_selection || 'Firearms Training',
    track: s.track || (/VIP/i.test(s.course_selection || s.course_name || '') ? 'VIP' : 'Base'),
    assignedDate: s.assigned_date || s.class_date || s.preferred_dates || s.dates || 'Upcoming Cohort',
    status: s.status || 'STEP_1_REGISTERED',
    qualificationScore: s.qualification_score || '25/25 (100%)',
    profileDocUrl: s.profile_doc_url || s.scoresheet_url || s.msp_score_sheet_url || '#',
    prepTasks: s.prep_tasks || { transport_law: false, ammo_acquired: false, eye_ear_pro: false, id_ready: false },
    mustChangePassword: Boolean(s.must_change_password),
    internalNotes: s.internal_notes || ''
  };
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

       const fullName = String(payload?.fullName || payload?.name || payload?.invFullName || 'Invited Student').trim().slice(0, 100);
       const email = String(payload?.email || payload?.invEmail || '').trim().toLowerCase().slice(0, 150);
       const phone = String(payload?.phone || payload?.invPhone || '').trim().slice(0, 30);
       const portalType = String(payload?.portalType || payload?.invPortalType || 'student').trim().toLowerCase();
       const courseName = String(payload?.course || payload?.courseSelection || payload?.invCourse || 'Maryland Wear & Carry Permit').trim().slice(0, 200);
       const dates = String(payload?.dates || payload?.scheduledDate || payload?.invDates || 'Upcoming Session').trim().slice(0, 200);
       const generatedId = payload.generatedId || ('FIFS-' + Math.floor(1000 + Math.random() * 9000));
       const tempPassword = generateSecureTempPassword();
       const now = new Date().toISOString();

       if (!fullName || !email || !email.includes('@')) {
         return NextResponse.json({ success: false, error: 'Valid full name and email are required.' }, { status: 400 });
       }

       // 1. Provision in public.students or public.clients
       if (portalType === 'client') {
         await supabase.from('clients').upsert({
           client_id: generatedId.startsWith('CLI-') ? generatedId : 'CLI-' + Math.floor(1000 + Math.random() * 9000),
           full_name: fullName,
           email,
           phone,
           permit_type: courseName,
           permit_state: 'Maryland',
           status: 'ACTIVE_REGISTERED',
           created_at: now,
           updated_at: now
         }, { onConflict: 'email' });
       } else {
         await supabase.from('students').upsert({
           student_id: generatedId,
           full_name: fullName,
           email,
           phone,
           course_selection: courseName,
           preferred_dates: dates,
           status: 'REGISTERED',
           must_change_password: true,
           temp_password_reset: true,
           created_at: now,
           updated_at: now
         }, { onConflict: 'student_id' });
       }

       // 2. Also provision in auth if possible
       try {
         await supabase.auth.admin.createUser({
           email,
           password: tempPassword,
           email_confirm: true,
           user_metadata: { full_name: fullName, phone, role: portalType }
         });
       } catch (authErr) {
         console.warn('Auth user creation warning:', authErr);
       }

       // 3. Dispatch invitation email via Resend
       const isVip = /VIP/i.test(courseName);
       const emailHtml = `
         <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0b0f14; color: #ffffff; padding: 24px; border-radius: 8px;">
           <h2 style="color: #ffb703;">Welcome to Future Initiative Firearm Services</h2>
           <p>Dear ${fullName},</p>
           <p>Lead Instructor Kai Wade has invited you to access your personal training portal for <strong>${courseName}</strong>.</p>
           <div style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 6px; margin: 20px 0;">
             <p style="margin: 4px 0;"><strong>Portal Login:</strong> ${email}</p>
             <p style="margin: 4px 0;"><strong>Temporary Password:</strong> <code style="color: #00e5ff; font-size: 16px;">${tempPassword}</code></p>
             <p style="margin: 4px 0; color: #ffb703; font-size: 13px;">⚠️ You will be prompted to create your permanent password on first sign-in.</p>
           </div>
           <p><a href="https://trainwithfifs.com" style="display: inline-block; background: #ffb703; color: #000000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px;">Access Your Portal →</a></p>
           <p style="color: #888; font-size: 12px; margin-top: 24px;">Future Initiative Firearm Services • Maryland State Police Certified Training</p>
         </div>
       `;

       await sendResendEmail({
         to: email,
         subject: `Welcome to Train With FIFS — Portal Access for ${courseName}`,
         html: emailHtml
       });

       return NextResponse.json({
         success: true,
         status: 'success',
         message: `Invitation successfully dispatched to ${email}`,
         studentId: generatedId,
         tempPassword
       });
     }

     case 'adminEnrollStudent': {
       const { user, error: authErr } = await getAuthenticatedUser(req);
       if (authErr || !isStaffOrAdmin(user)) {
         return NextResponse.json({ success: false, error: 'Unauthorized: Staff or administrator authentication required.' }, { status: 401 });
       }
       supabase = getPrivilegedClient();


       const fullName = (payload.fullName || payload.name || '').trim();
       const email = (payload.email || '').trim().toLowerCase();
       const phone = (payload.phone || '').trim();
       const role = payload.role || 'student';
       const internalNotes = payload.internalNotes || payload.notes || '';
       let classId = payload.classId;
       // Curriculum selector explicit mapping
       if (!classId || classId === 'default') {
         const courseNameLower = (payload.courseName || payload.courseSelection || '').toLowerCase();
         if (courseNameLower.includes('renewal')) {
           classId = '48daf0ba-41a3-4d89-a148-07f26f1e89f5'; // Explicit Maryland Wear & Carry (8-Hour Renewal) unique ID
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


       if (!fullName || !email) {
         return NextResponse.json({ success: false, error: 'Full name and email are required.' }, { status: 400 });
       }


       // If client or admin role (Non-course onboarding)
       if (role !== 'student') {
         const clientId = 'FI-CLIENT-' + Math.floor(1000 + Math.random() * 9000);
         await supabase.from('clients').upsert({
           client_id: clientId,
           full_name: fullName,
           email: email,
           phone: phone,
           permit_state: 'Maryland Wear & Carry',
           updated_at: new Date().toISOString()
         });
         return NextResponse.json({ success: true, isNewUser: true, message: 'Client profile created. Welcome email with portal credentials sent.' });
       }


       if (!classId || !scheduledDateStr) {
         return NextResponse.json({ success: false, error: 'Class and scheduled date/time are required for student enrollment.' }, { status: 400 });
       }


       const scheduledDate = new Date(scheduledDateStr);
       if (isNaN(scheduledDate.getTime())) {
         return NextResponse.json({ success: false, error: 'Invalid scheduled date/time provided.' }, { status: 400 });
       }


       // Query class details
       const { data: classRecord } = await supabase
         .from('classes')
         .select('*')
         .eq('id', classId)
         .single();


       const classTitle = classRecord?.title || 'Firearms Qualification Course';
       const gearNotes = classRecord?.required_gear_notes || 'Eye and ear protection, government-issued photo ID, range fee (0 cash), functional firearm with 50 rounds of factory ammunition.';
       const materialsPath = classRecord?.materials_path || null;
       if (!payload.durationHours && classRecord?.duration_hours) {
         durationHours = Number(classRecord.duration_hours);
       }


       // Check if student exists
       const { data: existingStudent } = await supabase
         .from('students')
         .select('*')
         .eq('email', email)
         .maybeSingle();


       const isNewUser = !existingStudent;
       let tempPassword = '';
       let studentId = existingStudent?.student_id;


       if (isNewUser) {
         // Branch B: New User Provisioning
         studentId = 'FIFS-' + Math.floor(1000 + Math.random() * 9000);
         tempPassword = generateSecureTempPassword();


         const { error: insertErr } = await supabase.from('students').insert({
           student_id: studentId,
           full_name: fullName,
           email: email,
           phone: phone,
           course: classTitle,
           assigned_date: scheduledDate.toLocaleDateString(),
           status: 'STEP_1_REGISTERED',
           must_change_password: true,
           temp_password_reset: true,
           password_expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
           internal_notes: internalNotes,
           portal_password: tempPassword // Stored for one-time verification during first login
         });
         if (insertErr) {
           return NextResponse.json({ success: false, error: insertErr.message }, { status: 500 });
         }
       } else {
         // Branch A: Existing User
         await supabase.from('students').update({
           phone: phone || existingStudent.phone,
           internal_notes: internalNotes || existingStudent.internal_notes,
           course: classTitle,
           assigned_date: scheduledDate.toLocaleDateString()
         }).eq('email', email);
       }


       // Insert new enrollment record
       const { data: enrollment, error: enrollErr } = await supabase
         .from('enrollments')
         .insert({
           student_email: email,
           student_name: fullName,
           class_id: classId,
           scheduled_date: scheduledDate.toISOString(),
           duration_hours: durationHours,
           reminder_sent: false,
           status: 'confirmed',
           previous_dates: [],
           internal_notes: internalNotes
         })
         .select()
         .single();


       if (enrollErr) {
         return NextResponse.json({ success: false, error: 'Failed to record enrollment: ' + enrollErr.message }, { status: 500 });
       }


       // Dynamic 7-day signed materials link
       const signedDocUrl = await getSignedDocumentUrl(supabase, materialsPath);


       // Generate ICS Calendar Event
       const icsDescription = 'FIFS Qualification Course - Gear: ' + gearNotes;
       const icsContent = generateIcsCalendar({
         title: classTitle,
         description: icsDescription,
         startDate: scheduledDate,
         durationHours: durationHours
       });
       const icsBase64 = Buffer.from(icsContent).toString('base64');
       const attachments: ResendAttachment[] = [{
         filename: 'FIFS_Course_Invitation.ics',
         content: icsBase64
       }];


       // Email Dispatch
       let emailResult: { success: boolean; error?: string } = { success: false };
       const dateFormatted = scheduledDate.toLocaleString('en-US', {
         weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
       });


       if (isNewUser) {
         // Welcome & Temporary Credentials
         const html = `<p>Welcome to <strong>${classTitle}</strong>! Your session is confirmed for <strong>${dateFormatted}</strong>.</p>` +
           (signedDocUrl ? `<p style="margin:10px 0 0 0;"><a href="${signedDocUrl}" style="background:#0284c7;color:#ffffff;text-decoration:none;padding:8px 16px;border-radius:4px;font-weight:bold;display:inline-block;">Download Course Materials (7-Day Secure Link)</a></p>` : '') +
           (isNewUser && tempPassword ? `<p>Your temporary password is: <code>${tempPassword}</code></p><p>You will be required to change this password at first login.</p>` : '');
         emailResult = await sendResendEmail({
           to: email,
           subject: 'Course Confirmation & Portal Access - ' + classTitle,
           html: html,
           attachments: attachments
         });
       } else {
         // Existing User Enrollment Confirmation
         const html = `<p>Welcome to <strong>${classTitle}</strong>! Your session is confirmed for <strong>${dateFormatted}</strong>.</p>` +
           (signedDocUrl ? `<p style="margin:10px 0 0 0;"><a href="${signedDocUrl}" style="background:#0284c7;color:#ffffff;text-decoration:none;padding:8px 16px;border-radius:4px;font-weight:bold;display:inline-block;">Download Course Materials (7-Day Secure Link)</a></p>` : '') +
           (isNewUser && tempPassword ? `<p>Your temporary password is: <code>${tempPassword}</code></p><p>You will be required to change this password at first login.</p>` : '');
         emailResult = await sendResendEmail({
           to: email,
           subject: 'Course Confirmation & Portal Access - ' + classTitle,
           html: html,
           attachments: attachments
         });
       }


       return NextResponse.json({
         success: true,
         isNewUser: isNewUser,
         studentId: studentId,
         tempPassword: isNewUser ? tempPassword : null,
         emailDispatched: emailResult.success,
         emailError: emailResult.error || null,
         enrollment: enrollment
       });
     }


     // 3. Reschedule Enrollment
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
         return NextResponse.json({ success: false, error: 'Enrollment ID and new date are required.' }, { status: 400 });
       }


       const { data: enrollment, error: findErr } = await supabase
         .from('enrollments')
         .select('*, classes(*)')
         .eq('id', enrollmentId)
         .single();


       if (findErr || !enrollment) {
         return NextResponse.json({ success: false, error: 'Enrollment record not found.' }, { status: 404 });
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
         return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
       }


       // Generate updated ICS
       const classTitle = enrollment.classes?.title || 'FIFS Firearms Course';
       const icsContent = generateIcsCalendar({
         title: classTitle,
         description: 'Rescheduled session for ' + classTitle,
         startDate: nextDate,
         durationHours: newDuration
       });
       const icsBase64 = Buffer.from(icsContent).toString('base64');


       const dateStr = nextDate.toLocaleString('en-US', {
         weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
       });
       const oldDateStr = oldDate.toLocaleString('en-US', {
         weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
       });


       const html = `<p>Your course session for <strong>${classTitle}</strong> has been rescheduled to <strong>${dateStr}</strong>.</p><p style="margin:8px 0 0 0;color:#713f12;"><strong>Instructor Note:</strong> ${reason || "Schedule adjusted by instructor."}</p>`;


       await sendResendEmail({
         to: enrollment.student_email,
         subject: 'Course Confirmation & Portal Access - ' + classTitle,
         html: html,
         attachments: [{ filename: 'Updated_Class_Schedule.ics', content: icsBase64 }]
       });


       return NextResponse.json({ success: true, message: 'Class session rescheduled successfully.' });
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
         return NextResponse.json({ success: false, error: 'Enrollment ID is required.' }, { status: 400 });
       }


       const { data: enrollment, error: findErr } = await supabase
         .from('enrollments')
         .select('*, classes(*)')
         .eq('id', enrollmentId)
         .single();


       if (findErr || !enrollment) {
         return NextResponse.json({ success: false, error: 'Enrollment not found.' }, { status: 404 });
       }


       const { error: cancelErr } = await supabase
         .from('enrollments')
         .update({
           status: 'cancelled',
           cancellation_reason: reason || 'Cancelled by instructor'
         })
         .eq('id', enrollmentId);


       if (cancelErr) {
         return NextResponse.json({ success: false, error: cancelErr.message }, { status: 500 });
       }


       const classTitle = enrollment.classes?.title || 'FIFS Firearms Course';
       const dateStr = new Date(enrollment.scheduled_date).toLocaleString();


       const html = `<p>Your session for <strong>${classTitle}</strong> scheduled for ${dateStr} has been cancelled.</p><div style="background:#fef2f2;border:1px solid #fecaca;padding:12px;border-radius:6px;margin:16px 0;"><strong>Reason:</strong> ${reason || "Cancelled by instructor."}</div>`;


       await sendResendEmail({
         to: enrollment.student_email,
         subject: 'Course Confirmation & Portal Access - ' + classTitle,
         html: html
       });


       return NextResponse.json({ success: true, message: 'Enrollment cancelled and student notified.' });
     }


     // 5. First-Login Password Change & Gate Clear + Admin Alert
     case 'firstLoginPasswordChange': {
       const { email, newPassword } = payload;
       if (!email || !newPassword) {
         return NextResponse.json({ success: false, error: 'Email and new password are required.' }, { status: 400 });
       }

       const { user, error: authErr } = await getAuthenticatedUser(req);
       if (authErr || !user) {
         return NextResponse.json({ success: false, error: 'Unauthorized: Authentication required.' }, { status: 401 });
       }
       supabase = getPrivilegedClient();

       const callerEmail = (user.email || '').toLowerCase().trim();
       const targetEmail = email.trim().toLowerCase();
       if (!isStaffOrAdmin(user) && callerEmail !== targetEmail) {
         return NextResponse.json({ success: false, error: 'Forbidden: You can only update your own password.' }, { status: 403 });
       }

       const val = validateStrictPassword(newPassword);
       if (!val.valid) {
         return NextResponse.json({ success: false, error: val.error }, { status: 400 });
       }

       const { data: student, error: stErr } = await supabase
         .from('students')
         .select('*')
         .eq('email', targetEmail)
         .maybeSingle();

       if (stErr || !student) {
         return NextResponse.json({ success: false, error: 'Student record not found.' }, { status: 404 });
       }

       // Update Supabase Auth password
       try {
         await supabase.auth.admin.updateUserById(user.id, { password: newPassword });
       } catch (authPassErr) {
         console.warn('Auth password update note:', authPassErr);
       }

       // Update student record
       const { error: updateErr } = await supabase
         .from('students')
         .update({
           portal_password: newPassword,
           must_change_password: false,
           temp_password_reset: false,
           password_expires_at: null,
           last_password_change: new Date().toISOString(),
           updated_at: new Date().toISOString()
         })
         .eq('email', targetEmail);

       if (updateErr) {
         return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
       }

       const studentName = student.full_name || 'Student';
       const nowStr = new Date().toLocaleString('en-US', { timeZoneName: 'short' });
       await sendResendEmail({
         to: ADMIN_EMAIL,
         subject: 'Security Alert: Student Portal Activated - ' + studentName,
         html: `<p>Student <strong>${studentName}</strong> (${targetEmail}) activated portal access on ${nowStr}.</p>`
       });

       return NextResponse.json({ success: true, message: 'Password updated successfully. Welcome to your portal!' });
     }

     case 'changePortalPassword':
     case 'updateStudentPassword':
     case 'selfServicePasswordUpdate': {
       const { email, studentId, identifier, currentPassword, newPassword } = payload;
       const target = (email || studentId || identifier || '').trim().toLowerCase();
       if (!target || !newPassword) {
         return NextResponse.json({ success: false, status: 'error', error: 'Student email or ID and new password are required.' }, { status: 400 });
       }

       const { user, error: authErr } = await getAuthenticatedUser(req);
       if (authErr || !user) {
         return NextResponse.json({ success: false, status: 'error', error: 'Unauthorized: Authentication required.' }, { status: 401 });
       }
       supabase = getPrivilegedClient();

       const callerEmail = (user.email || '').toLowerCase().trim();
       if (!isStaffOrAdmin(user) && callerEmail !== target && user.id !== target) {
         return NextResponse.json({ success: false, status: 'error', error: 'Forbidden: You can only update your own password.' }, { status: 403 });
       }

       const val = validateStrictPassword(newPassword);
       if (!val.valid) {
         return NextResponse.json({ success: false, status: 'error', error: val.error }, { status: 400 });
       }

       // Update Supabase Auth password for the user
       try {
         await supabase.auth.admin.updateUserById(user.id, { password: newPassword });
       } catch (authPassErr) {
         console.warn('Auth password update note:', authPassErr);
       }

       // 1. Locate student in students table
       const { data: student } = await supabase
         .from('students')
         .select('*')
         .or(`email.eq.${target},student_id.eq.${target.toUpperCase()}`)
         .maybeSingle();

       if (student) {
         const { error: updErr } = await supabase
           .from('students')
           .update({
             portal_password: newPassword,
             must_change_password: false,
             temp_password_reset: false,
             last_password_change: new Date().toISOString(),
             updated_at: new Date().toISOString()
           })
           .eq('id', student.id);

         if (updErr) {
           return NextResponse.json({ success: false, status: 'error', error: updErr.message }, { status: 500 });
         }

         return NextResponse.json({
           success: true,
           status: 'success',
           message: 'Password updated successfully and linked to your student profile.',
           student: {
             ...normalizeStudent(student),
             mustChangePassword: false
           }
         });
       }

       // 2. Locate in clients table
       const { data: client } = await supabase
         .from('clients')
         .select('*')
         .or(`email.eq.${target},client_id.eq.${target.toUpperCase()}`)
         .maybeSingle();

       if (client) {
         await supabase
           .from('clients')
           .update({
             temp_password_reset: false,
             last_password_change: new Date().toISOString(),
             updated_at: new Date().toISOString()
           })
           .eq('id', client.id);

         return NextResponse.json({
           success: true,
           status: 'success',
           message: 'Client portal password updated successfully.'
         });
       }

       return NextResponse.json({ success: false, status: 'error', error: 'Record not found.' }, { status: 404 });
     }

     case 'getClientPortalData': {
       const { user, error: authErr } = await getAuthenticatedUser(req);
       if (authErr || !user) {
         return NextResponse.json({ success: false, status: 'error', error: 'Unauthorized: Authentication required.' }, { status: 401 });
       }
       supabase = getPrivilegedClient();

       const callerEmail = (user.email || '').toLowerCase().trim();
       const identifier = (payload.identifier || payload.clientId || payload.email || callerEmail).trim().toLowerCase();

       // Enforce self-service isolation unless staff/admin
       if (!isStaffOrAdmin(user) && callerEmail !== identifier) {
         // Query client by caller email only
         const { data: ownClient } = await supabase
           .from('clients')
           .select('*')
           .eq('email', callerEmail)
           .maybeSingle();

         if (!ownClient || (identifier && identifier !== ownClient.client_id?.toLowerCase() && identifier !== ownClient.id?.toLowerCase())) {
           return NextResponse.json({ success: false, status: 'error', error: 'Forbidden: Access restricted to your own client account.' }, { status: 403 });
         }
       }

       // Fetch client
       const { data: client } = await supabase
         .from('clients')
         .select('*')
         .or(`client_id.eq.${identifier.toUpperCase()},email.eq.${identifier}`)
         .maybeSingle();

       if (client) {
         return NextResponse.json({
           success: true,
           status: 'success',
           client: {
             clientId: client.client_id,
             fullName: client.full_name,
             email: client.email,
             phone: client.phone,
             permitType: client.permit_type || 'Maryland Wear & Carry (CCW)',
             permitState: client.permit_state || 'Maryland',
             expirationDate: client.expiration_date || '2027-10-01',
             status: client.status || 'ACTIVE_PERMIT_HOLDER',
             optInReminder: Boolean(client.opt_in_reminder),
             smsAlertPhone: client.sms_alert_phone || client.phone
           }
         });
       }

       return NextResponse.json({ success: false, status: 'error', error: 'Client record not found in system.' }, { status: 404 });
     }

     case 'getStudentPortalData': {
       const { user, error: authErr } = await getAuthenticatedUser(req);
       if (authErr || !user) {
         return NextResponse.json({ success: false, status: 'error', error: 'Unauthorized: Authentication required to view student portal.' }, { status: 401 });
       }
       supabase = getPrivilegedClient();

       const callerEmail = (user.email || '').toLowerCase().trim();
       const identifier = (payload.identifier || payload.studentId || payload.email || callerEmail).trim().toLowerCase();

       // Enforce self-service student isolation unless staff/admin
       let studentLookupQuery = supabase.from('students').select('*');
       if (isStaffOrAdmin(user)) {
         studentLookupQuery = studentLookupQuery.or(`student_id.eq.${identifier.toUpperCase()},email.eq.${identifier}`);
       } else {
         // Non-staff callers can only query their own authenticated account
         studentLookupQuery = studentLookupQuery.eq('email', callerEmail);
       }

       const { data: student } = await studentLookupQuery.maybeSingle();

       if (!student) {
         return NextResponse.json({ success: false, status: 'error', error: 'Student record not found.' }, { status: 404 });
       }

       // If identifier was provided and does not match own record, reject
       if (!isStaffOrAdmin(user) && identifier !== callerEmail && identifier !== student.student_id?.toLowerCase() && identifier !== student.id?.toLowerCase()) {
         return NextResponse.json({ success: false, status: 'error', error: 'Forbidden: Access restricted to your own student account.' }, { status: 403 });
       }

       // Fetch course enrollments with signed materials URLs
       const { data: enrollments } = await supabase
         .from('enrollments')
         .select('id, class_id, scheduled_date, duration_hours, status, cancellation_reason, previous_dates, created_at, classes(title, description, materials_path, required_gear_notes)')
         .eq('student_email', student.email)
         .order('scheduled_date', { ascending: false });

       const enrollmentsWithUrls = await Promise.all((enrollments || []).map(async (e: any) => {
         let signedUrl = null;
         if (e.classes?.materials_path) {
           signedUrl = await getSignedDocumentUrl(supabase, e.classes.materials_path);
         }
         return {
           ...e,
           materialsUrl: signedUrl
         };
       }));

       return NextResponse.json({
         success: true,
         status: 'success',
         student: {
           ...normalizeStudent(student),
           enrollments: enrollmentsWithUrls,
           mustChangePassword: Boolean(student.must_change_password)
         }
       });
     }

     case 'check24HourReminders': {
       const cronSecret = req.headers.get('x-cron-secret');
       const expectedCron = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
       const isCron = Boolean(cronSecret && expectedCron && cronSecret === expectedCron);

       if (!isCron) {
         const { user, error: authErr } = await getAuthenticatedUser(req);
         if (authErr || !isStaffOrAdmin(user)) {
           return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication or cron secret required.' }, { status: 401 });
         }
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


       const sentList: string[] = [];
       for (const enr of (pendingReminders || [])) {
         const classTitle = enr.classes?.title || 'Firearms Qualification Course';
         const gearNotes = enr.classes?.required_gear_notes || 'Eye and ear protection, government ID, range fees.';
         const dateStr = new Date(enr.scheduled_date).toLocaleString();
         const docUrl = await getSignedDocumentUrl(supabase, enr.classes?.materials_path);


         const html = `<p>Reminder: Your upcoming class <strong>${classTitle}</strong> is scheduled for <strong>${dateStr}</strong>.</p>` + (docUrl ? `<p><a href="${docUrl}" style="background:#0284c7;color:#ffffff;padding:8px 16px;border-radius:4px;text-decoration:none;font-weight:bold;">Review Course Study Guide</a></p>` : "");


         await sendResendEmail({
           to: enr.student_email,
           subject: 'Course Confirmation & Portal Access - ' + classTitle,
           html: html
         });


         await supabase.from('enrollments').update({ reminder_sent: true }).eq('id', enr.id);
         sentList.push(enr.id);
       }


       return NextResponse.json({ success: true, processedCount: sentList.length, sentIds: sentList });
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
         return NextResponse.json({ success: false, error: 'Live chat service unavailable: Missing secure server configuration.' }, { status: 500 });
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
         return NextResponse.json({ success: false, error: 'Live chat service unavailable: Missing secure server configuration.' }, { status: 500 });
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
       supabase = getPublicClient();
        const {
          invoiceId = 'INV-FI-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
          studentId = 'FIFS-' + Math.floor(1000 + Math.random() * 9000),
          fullName = 'FIFS Training Student',
          email,
          phone = '',
          courseSelection = 'Maryland Firearms Training Course',
          preferredDates = 'Coordinated with Lead Instructor Kai Wade',
          groupSize = '1',
          comments = '',
          classId = '',
          payInFull = false
        } = payload;

        if (!email || !email.includes('@')) {
          return NextResponse.json({ success: false, status: 'error', error: 'Valid student email address is required.' }, { status: 400 });
        }

        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) {
          console.error('[submitBooking] Stripe configuration missing: STRIPE_SECRET_KEY not set.');
          return NextResponse.json(
            {
              success: false,
              status: 'error',
              error: 'Payment processing gateway is not configured on the server. Please contact FIFS directly.'
            },
            { status: 503 }
          );
        }

        const isVip = /VIP/i.test(courseSelection || '');

        // 1. Authoritative server-side pricing calculation - strictly ignores client-supplied totals/deposits
        let baseTuitionPerPerson = 249.99;
        const cleanCourse = (courseSelection || '').toLowerCase();
        if (cleanCourse.includes('mastery') || cleanCourse.includes('multi-state') || cleanCourse.includes('multistate')) {
          baseTuitionPerPerson = isVip ? 549.99 : 424.99;
        } else if (cleanCourse.includes('renewal')) {
          baseTuitionPerPerson = isVip ? 249.99 : 149.99;
        } else if (cleanCourse.includes('combo')) {
          baseTuitionPerPerson = isVip ? 375.00 : 249.99;
        } else if (cleanCourse.includes('hql')) {
          baseTuitionPerPerson = isVip ? 165.00 : 100.00;
        } else if (cleanCourse.includes('ccw') || cleanCourse.includes('wear & carry')) {
          baseTuitionPerPerson = isVip ? 349.99 : 199.99;
        } else if (cleanCourse.includes('coaching')) {
          baseTuitionPerPerson = isVip ? 195.00 : 125.00;
        } else if (cleanCourse.includes('cleaning')) {
          baseTuitionPerPerson = isVip ? 115.00 : 75.00;
        } else if (cleanCourse.includes('children')) {
          baseTuitionPerPerson = isVip ? 265.00 : 199.99;
        } else if (cleanCourse.includes('alumni')) {
          baseTuitionPerPerson = isVip ? 115.00 : 65.00;
        }

        let attendees = 1;
        let discountPercent = 0;
        const groupStr = String(groupSize || '1');
        if (/^2|2 \(paired/i.test(groupStr)) {
          attendees = 2;
          discountPercent = 0.05;
        } else if (/^[34]|[34] \(small/i.test(groupStr)) {
          attendees = 3;
          discountPercent = 0.10;
        } else if (/5\+/i.test(groupStr) || /^5/i.test(groupStr)) {
          attendees = 5;
          discountPercent = 0.15;
        }

        const rawTuition = baseTuitionPerPerson * attendees;
        const discountVal = rawTuition * discountPercent;
        const discountedTuition = rawTuition - discountVal;

        // Cindy's range fee ($45.00 per person for Base Track, $0 for VIP Turnkey)
        const rangeFee = isVip ? 0 : (45.00 * attendees);
        const subtotal = discountedTuition + rangeFee;
        const mdTax = subtotal * 0.06;
        const grandTotal = subtotal + mdTax;
        const depositDueNow = grandTotal * 0.30;
        const balanceDueClass = grandTotal - depositDueNow;

        // 30% deposit is default charge amount unless explicitly payInFull
        const chargeAmount = payInFull ? grandTotal : depositDueNow;
        const unitAmount = Math.round(chargeAmount * 100);

        const origin = req.headers.get('origin') || req.headers.get('referer') || 'https://trainwithfifs.com';
        const baseUrl = origin.replace(/\/+$/, '');

        let checkoutUrl: string;
        let sessionId: string;

        try {
          const StripeModule = typeof require === 'function' ? (require('stripe')?.default || require('stripe')) : ((await import('stripe')).default || (await import('stripe')));
          const stripe = new StripeModule(stripeKey, { apiVersion: '2023-10-16' as any });

          const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            customer_email: email,
            client_reference_id: studentId,
            metadata: {
              invoiceId,
              studentId,
              fullName,
              phone,
              courseSelection,
              preferredDates,
              groupSize: String(groupSize),
              comments: String(comments).slice(0, 400),
              classId: classId || '',
              rangeFee: rangeFee.toFixed(2),
              mdTax: mdTax.toFixed(2),
              grandTotal: grandTotal.toFixed(2),
              depositDueNow: depositDueNow.toFixed(2),
              balanceDueClass: balanceDueClass.toFixed(2),
              isDepositPayment: String(!payInFull)
            },
            line_items: [
              {
                price_data: {
                  currency: 'usd',
                  unit_amount: unitAmount,
                  product_data: {
                    name: `${courseSelection} — ${payInFull ? 'Full Tuition & Range Fee' : '30% Reservation Deposit'}`,
                    description: `Invoice: ${invoiceId} • Total Course Investment: $${grandTotal.toFixed(2)} (Tuition + ${isVip ? "VIP Range Perk" : "$45 Range Fee"} + 6% MD Tax) • ${payInFull ? "Paid in Full" : "Deposit: $" + depositDueNow.toFixed(2) + " (Remaining $" + balanceDueClass.toFixed(2) + " due on class day)"}`,
                  },
                },
                quantity: 1,
              },
            ],
            success_url: `${baseUrl}/?session_id={CHECKOUT_SESSION_ID}&booking_confirmed=true&invoice=${encodeURIComponent(invoiceId)}`,
            cancel_url: `${baseUrl}/?booking_cancelled=true&session_id={CHECKOUT_SESSION_ID}&invoice=${encodeURIComponent(invoiceId)}`,
          });

          if (!session || !session.url || !session.id) {
            throw new Error('Stripe failed to return a valid checkout session URL or ID.');
          }

          checkoutUrl = session.url;
          sessionId = session.id;
        } catch (stripeErr: any) {
          console.error('[submitBooking] Stripe checkout session creation failed:', stripeErr?.message);
          return NextResponse.json(
            {
              success: false,
              status: 'error',
              error: 'Failed to create secure checkout session: ' + (stripeErr?.message || 'Payment gateway error')
            },
            { status: 502 }
          );
        }

       try {
         await supabase.from('invoices').upsert({
            invoice_number: invoiceId,
            student_id: studentId,
            course: courseSelection,
            total_amount: grandTotal.toFixed(2),
            tuition_amount: discountedTuition.toFixed(2),
            tax_amount: mdTax.toFixed(2),
            deposit_due: depositDueNow.toFixed(2),
            amount_paid: '0.00',
            balance_due: balanceDueClass.toFixed(2),
            status: 'PENDING',
            due_date: preferredDates || 'Upon Class Date',
            stripe_session_id: sessionId,
            email: email,
            facility: "Cindy's Hot Shots (115 Holsum Way, Glen Burnie, MD 21060)",
            payment_method: 'Stripe Checkout',
            updated_at: new Date().toISOString()
          }, { onConflict: 'invoice_number' });
       } catch (_dbErr) {}

       // Guest Booking Check & Unauthenticated Lead Trigger
       const userId = payload.user_id || payload.userId || null;
       const isGuest = !userId && !studentId.startsWith('FI-CLIENT-');

       if (isGuest) {
         // 1. Capture into leads table as Unauthenticated Lead
         try {
           await supabase.from('leads').insert([{
             full_name: fullName,
             email: email,
             source: 'Guest Checkout Lead: ' + courseSelection
           }]);
         } catch (leadErr) {
           console.warn('[FIFS] Lead capture note:', leadErr);
         }

         // 2. Dispatch dedicated "Guest Checkout" Discord alert (asynchronously on server)
         await sendServerDiscordAlert(
           "🚨 New Unauthenticated Lead (Guest Checkout): " + fullName,
           "A guest student without an existing portal account has initiated course reservation checkout.",
           [
             { name: "Student Name", value: fullName, inline: true },
             { name: "Lead Classification", value: "⚠️ Unauthenticated Lead (Guest)", inline: true },
             { name: "Contact Email", value: email, inline: true },
             { name: "Contact Phone", value: phone || "Not provided", inline: true },
             { name: "Curriculum Track", value: courseSelection + (isVip ? " (👑 VIP Turnkey)" : " (Standard Base)"), inline: false },
             { name: "Reservation Deposit", value: "$" + depositDueNow.toFixed(2) + " Due Now", inline: true },
             { name: "Total Course Investment", value: "$" + grandTotal.toFixed(2), inline: true },
             { name: "Training Dates", value: preferredDates, inline: false },
             { name: "Invoice Reference", value: invoiceId, inline: true }
           ],
           0xF59E0B // Warning Amber
         );
       } else {
         // Standard Authenticated Booking Discord Alert
         await sendServerDiscordAlert(
           "🎯 New Course Enrollment Checkout: " + fullName,
           `Enrolled in ${courseSelection} with reservation invoice ${invoiceId}`,
           [
             { name: "Student", value: fullName, inline: true },
             { name: "Course", value: courseSelection, inline: true },
             { name: "Track", value: isVip ? "👑 VIP Turnkey" : "Standard Base", inline: true },
             { name: "Email", value: email, inline: true },
             { name: "Phone", value: phone || "Not provided", inline: true },
             { name: "Deposit Due", value: "$" + depositDueNow.toFixed(2), inline: true },
             { name: "Total", value: "$" + grandTotal.toFixed(2), inline: true },
             { name: "Dates", value: preferredDates, inline: false }
           ],
           0x00E5FF // Cyan
         );
       }

       // If group booking (more than 1 person), generate private pod invite code
       let podInviteCode = null;
       if (attendees > 1) {
         try {
           const { data: codeData } = await supabase.rpc('create_booking_group', {
             p_leader_name: fullName,
             p_leader_email: email,
             p_leader_phone: phone || null,
             p_course: courseSelection,
             p_track: isVip ? 'VIP' : 'Base',
             p_preferred_dates: preferredDates,
             p_max_seats: attendees
           });
           podInviteCode = codeData;
         } catch (podErr) {
           console.warn('[FIFS] Pod generation note:', podErr);
         }
       }

       return NextResponse.json({
         success: true,
         status: 'success',
         url: checkoutUrl,
         checkoutUrl: checkoutUrl,
         sessionId: sessionId,
         invoiceId,
         studentId,
         podInviteCode
       });
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
       return NextResponse.json({ success: false, error: 'Unhandled action: ' + action }, { status: 400 });
   }
 } catch (err: any) {
   console.error('[API FIFS Error]:', err);
   return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
 }
}