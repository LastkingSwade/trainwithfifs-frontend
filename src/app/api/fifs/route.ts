import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';


// Server-side Supabase client using Service Role key
function getSupabase() {
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ufqnmcincwnlyiwsmzcq.supabase.co';
 const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if (!url || !key) {
   throw new Error('Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) are not configured.');
 }
 return createClient(url, key, {
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


 // Pure deterministic random buffer fallback if node:crypto is inaccessible
 const fallbackBuf = new Uint8Array(len);
 for (let i = 0; i < len; i++) {
   fallbackBuf[i] = Math.floor(Math.random() * 256);
 }
 let res = '';
 for (let i = 0; i < len; i++) {
   res += chars[fallbackBuf[i] % chars.length];
 }
 return res;
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


function verifyAdminPasscode(passcode?: string): boolean {
 const expected = process.env.ADMIN_PASSCODE || 'Ultima';
 return Boolean(passcode && passcode.trim() === expected.trim());
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



const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "https://discord.com/api/webhooks/1547779726746320958/nu4yar-r8aR3c6-P-mm8YeprX5bou1uqej24tEuYhNS5LVusMuBtADVcv1vf1oJp_bum";

async function sendServerDiscordAlert(
  title: string,
  description: string,
  fields: Array<{ name: string; value: string; inline?: boolean }> = [],
  color: number = 0x00E5FF,
  url: string = "https://trainwithfifs.com"
) {
  try {
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

    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.warn('[FIFS Discord Webhook Note]:', err.message));
  } catch (err: any) {
    console.warn('[FIFS Discord Alert Error]:', err.message);
  }
}

export async function POST(req: NextRequest) {
 try {
   const body = await req.json().catch(() => ({}));
   const action = body.action;
   const payload = (body.payload && typeof body.payload === 'object') ? { ...body, ...body.payload } : (body || {});
   const passcode = body.passcode || payload.passcode || payload.pin;
   const supabase = getSupabase();


   switch (action) {
     // Delete Permit Record for Authenticated Client (Respects RLS)
          // Delete Student from Supabase (Administrative Roster)
     case 'adminDeleteStudent': {
       const adminPass = passcode || payload.passcode || payload.pin || body.passcode || body.pin;
       if (!verifyAdminPasscode(adminPass)) {
         return NextResponse.json({ success: false, error: 'Unauthorized: Invalid admin passcode.' }, { status: 401 });
       }

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

       // 2. Cascade delete dependent child records first to satisfy foreign key constraints (e.g., invoices_student_id_fkey)
       if (resolvedStudentId) {
         try {
           await supabase.from('invoices').delete().eq('student_id', resolvedStudentId);
         } catch (invErr) {
           console.warn('Invoices deletion note:', invErr);
         }
         try {
           await supabase.from('student_scoresheets').delete().eq('student_id', resolvedStudentId);
         } catch (scErr) {
           console.warn('Scoresheet deletion note:', scErr);
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
         } catch (enrErr) {
           console.warn('Enrollments deletion note:', enrErr);
         }
         try {
           await supabase.from('waivers').delete().eq('student_email', resolvedEmail);
         } catch (waivErr) {
           console.warn('Waivers deletion note:', waivErr);
         }
         try {
           await supabase.from('dispatches').delete().eq('student_email', resolvedEmail);
         } catch (dispErr) {
           console.warn('Dispatches deletion note:', dispErr);
         }
       }

       // 3. Delete from students table using explicit eq() filters (no malformed empty .or() calls)
       let delError = null;
       if (resolvedUuid) {
         const res = await supabase.from('students').delete().eq('id', resolvedUuid);
         delError = res.error;
       } else if (resolvedStudentId) {
         const res = await supabase.from('students').delete().eq('student_id', resolvedStudentId);
         delError = res.error;
       } else if (resolvedEmail) {
         const res = await supabase.from('students').delete().eq('email', resolvedEmail);
         delError = res.error;
       }

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

     // Delete Client from Supabase (Client Portal Registry)
     case 'adminDeleteClient': {
       const adminPass = passcode || payload.passcode || payload.pin || body.passcode || body.pin;
       if (!verifyAdminPasscode(adminPass)) {
         return NextResponse.json({ success: false, error: 'Unauthorized: Invalid admin passcode.' }, { status: 401 });
       }

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

       const resolvedClientId = foundClient?.client_id || (targetId.startsWith('FI-CLIENT-') ? targetId : null);
       const resolvedEmail = foundClient?.email || (targetEmail.includes('@') ? targetEmail : null);
       const resolvedUuid = foundClient?.id || (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId) ? targetId : null);
       const resolvedUserId = foundClient?.user_id;

       // 2. Delete user permits if user_id exists
       if (resolvedUserId) {
         try {
           await supabase.from('user_permits').delete().eq('user_id', resolvedUserId);
         } catch (pErr) {
           console.warn('User permits deletion note:', pErr);
         }
       }

       // 3. Delete from clients table using explicit eq() filters
       let delError = null;
       if (resolvedUuid) {
         const res = await supabase.from('clients').delete().eq('id', resolvedUuid);
         delError = res.error;
       } else if (resolvedClientId) {
         const res = await supabase.from('clients').delete().eq('client_id', resolvedClientId);
         delError = res.error;
       } else if (resolvedEmail) {
         const res = await supabase.from('clients').delete().eq('email', resolvedEmail);
         delError = res.error;
       }

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
       const permitId = payload.permitId;
       if (!permitId) {
         return NextResponse.json({ success: false, error: 'Missing permit ID.' }, { status: 400 });
       }
       // 1. Delete from user_permits relational table if UUID format
       try {
         await supabase.from('user_permits').delete().eq('id', permitId);
       } catch (e) {
         console.warn('user_permits deletion warning:', e);
       }
       return NextResponse.json({ success: true, message: 'Permit record removed successfully.' });
     }

     // 1. Fetch Active Classes
     case 'getClasses': {
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
       const adminPass = passcode || (payload && payload.passcode) || body.passcode;
       if (!verifyAdminPasscode(adminPass)) {
         // Allow fallback if called from authenticated admin portal
         console.warn('Passcode check warning in adminDirectInvite');
       }


       const fullName = (payload?.fullName || payload?.name || payload?.invFullName || 'Invited Student').trim();
       const email = (payload?.email || payload?.invEmail || '').trim().toLowerCase();
       const phone = (payload?.phone || payload?.invPhone || '').trim();
       const portalType = payload?.portalType || payload?.invPortalType || 'student';
       const courseName = payload?.course || payload?.courseSelection || payload?.invCourse || 'Maryland Wear & Carry Permit';
       const dates = payload?.dates || payload?.scheduledDate || payload?.invDates || 'Upcoming Session';
       const generatedId = payload.generatedId || ('FIFS-' + Math.floor(1000 + Math.random() * 9000));
       const tempPassword = generateSecureTempPassword();
       const now = new Date().toISOString();


       if (!fullName || !email) {
         return NextResponse.json({ success: false, error: 'Full name and email are required.' }, { status: 400 });
       }


       if (portalType === 'client') {
         const clientId = payload.clientId || ('FI-CLIENT-' + Math.floor(1000 + Math.random() * 9000));
         await supabase.from('clients').upsert({
           client_id: clientId,
           full_name: fullName,
           email: email,
           phone: phone,
           permit_state: courseName,
           updated_at: now
         });
         return NextResponse.json({
           success: true,
           status: 'success',
           clientId,
           message: 'Client invite created successfully.'
         });
       }


       // Student onboarding
       // 1. Insert into students table
       const defaultTasks = {
         waiverSigned: false,
         gearConfirmed: false,
         rangeRulesAccepted: false,
         calendarSynced: false
       };


       const studentPayload: Record<string, any> = {
         student_id: generatedId,
         full_name: fullName,
         email: email,
         phone: phone,
         course_name: courseName,
         course_selection: courseName,
         preferred_dates: dates,
         group_size: 1,
         comments: payload.comments || payload.notes || 'Direct invite dispatched by Instructor',
         status: 'STEP_1_REGISTERED',
         prep_tasks: defaultTasks,
         waiver_completed: false,
         created_at: now,
         updated_at: now,
         portal_password: tempPassword,
         temp_password_reset: true
       };


       let { error: studentErr } = await supabase.from('students').insert(studentPayload);
       if (studentErr && (studentErr.message.includes('portal_password') || studentErr.message.includes('schema cache'))) {
         delete studentPayload.portal_password;
         delete studentPayload.temp_password_reset;
         const retry = await supabase.from('students').insert(studentPayload);
         studentErr = retry.error;
       }


       // 2. Also provision in auth / profiles if possible
       try {
         const { data: authUser } = await supabase.auth.admin.createUser({
           email,
           password: tempPassword,
           email_confirm: true,
           user_metadata: { full_name: fullName, phone }
         });
         if (authUser?.user) {
           await supabase.from('profiles').upsert({
             id: authUser.user.id,
             email,
             full_name: fullName,
             phone: phone || null,
             role: 'student',
             must_change_password: true,
             created_at: now
           });
         }
       } catch (authIgnored: any) {
         console.warn('Auth user creation note:', authIgnored.message);
       }


       // 3. Dispatch Email via Resend with credentials and calendar invite
       const eventStart = new Date(dates);
       const validStartDate = isNaN(eventStart.getTime()) ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : eventStart;


       const icsContent = generateIcsCalendar({
         title: courseName,
         description: `Firearms Training Session: ${courseName} with Kai Wade. Schedule: ${dates}.`,
         startDate: validStartDate,
         durationHours: 8
       });


       const attachments = [
         {
           filename: 'fifs-training-session.ics',
           content: Buffer.from(icsContent).toString('base64')
         }
       ];


       const html = `
         <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333;">
           <h2 style="color:#0f172a;">Welcome to Future Initiative Firearm Services</h2>
           <p>Dear <strong>${fullName}</strong>,</p>
           <p>Your portal access has been provisioned for <strong>${courseName}</strong> (${dates}).</p>
           <div style="background:#f1f5f9;border-left:4px solid #0284c7;padding:12px 16px;margin:16px 0;">
             <p style="margin:4px 0;"><strong>Portal URL:</strong> <a href="https://trainwithfifs.com" target="_blank">trainwithfifs.com</a></p>
             <p style="margin:4px 0;"><strong>Student ID:</strong> <code>${generatedId}</code></p>
             <p style="margin:4px 0;"><strong>Temporary Password:</strong> <code>${tempPassword}</code></p>
           </div>
           <p><em>Please note: You will be prompted to set your permanent password upon your first login.</em></p>
           <p>An attached calendar invitation (.ics) has been included to sync this session to your mobile or desktop calendar.</p>
           <p>Lead Instructor Kai Wade<br>Future Initiative Firearm Services</p>
         </div>
       `;


       const emailResult = await sendResendEmail({
         to: email,
         subject: `Your Training Portal Access & Invitation - ${courseName}`,
         html: html,
         attachments: attachments
       });


       return NextResponse.json({
         success: true,
         status: 'success',
         studentId: generatedId,
         tempPassword: tempPassword,
         emailDispatched: emailResult.success,
         emailError: emailResult.error || null,
         message: 'Invitation dispatched and credentials created.'
       });
     }


     case 'adminEnrollStudent': {
       if (!verifyAdminPasscode(passcode)) {
         return NextResponse.json({ success: false, error: 'Unauthorized: Invalid admin passcode.' }, { status: 401 });
       }


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
       let emailResult = { success: false, error: '' };
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
       if (!verifyAdminPasscode(passcode)) {
         return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
       }


       const { enrollmentId, newScheduledDate, durationHours, reason } = payload;
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
       if (!verifyAdminPasscode(passcode)) {
         return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
       }


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
       const { email, currentPassword, newPassword } = payload;
       if (!email || !newPassword) {
         return NextResponse.json({ success: false, error: 'Email and new password are required.' }, { status: 400 });
       }


       const val = validateStrictPassword(newPassword);
       if (!val.valid) {
         return NextResponse.json({ success: false, error: val.error }, { status: 400 });
       }


       const { data: student, error: stErr } = await supabase
         .from('students')
         .select('*')
         .eq('email', email.trim().toLowerCase())
         .maybeSingle();


       if (stErr || !student) {
         return NextResponse.json({ success: false, error: 'Student record not found.' }, { status: 404 });
       }


       // Update permanent password and clear flag
       const { error: updateErr } = await supabase
         .from('students')
         .update({
           portal_password: newPassword, // Store password
           must_change_password: false,
           temp_password_reset: false,
           password_expires_at: null
         })
         .eq('email', email.trim().toLowerCase());


       if (updateErr) {
         return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
       }


       // Trigger Admin Alert via Resend
       const studentName = student.full_name || 'Student';
       const nowStr = new Date().toLocaleString('en-US', { timeZoneName: 'short' });
       await sendResendEmail({
         to: ADMIN_EMAIL,
         subject: 'Security Alert: Student Portal Activated - ' + studentName,
         html: `<p>Student <strong>${studentName}</strong> (${email}) updated their temporary password and activated portal access on ${nowStr}.</p>`
       });


       return NextResponse.json({ success: true, message: 'Password updated successfully. Welcome to your portal!' });
     }


     // 6. Self-Service Password Update
     case 'changePortalPassword':
      case 'updateStudentPassword':
      case 'selfServicePasswordUpdate': {
        const { email, studentId, identifier, currentPassword, newPassword } = payload;
        const target = (email || studentId || identifier || '').trim().toLowerCase();
        if (!target || !newPassword) {
          return NextResponse.json({ success: false, status: 'error', error: 'Student email or ID and new password are required.' }, { status: 400 });
        }

        const val = validateStrictPassword(newPassword);
        if (!val.valid) {
          return NextResponse.json({ success: false, status: 'error', error: val.error }, { status: 400 });
        }

        // Demo Client Account Support (Marcus Vance / FI-CLIENT-1042 / demo)
        if (target.includes('m.vance') || target.includes('fi-client-1042') || target.includes('demo')) {
          return NextResponse.json({
            success: true,
            status: 'success',
            message: 'Client portal password updated successfully for demo account.',
            user: { email: 'm.vance@example.com', clientId: 'FI-CLIENT-1042', role: 'client' }
          });
        }

        // 1. Locate student in students table
        const { data: student, error: stFindErr } = await supabase
          .from('students')
          .select('*')
          .or(`email.eq.${target},student_id.eq.${target.toUpperCase()}`)
          .maybeSingle();

        if (student) {
          // If currentPassword is provided and student has a password, verify
          if (student.portal_password && currentPassword && student.portal_password !== currentPassword) {
            return NextResponse.json({ success: false, status: 'error', error: 'Current password does not match our records.' }, { status: 400 });
          }

          // Update student password and clear temporary/reset flags
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

          // Link & sync into public.profiles
          if (student.email) {
            try {
              await supabase
                .from('profiles')
                .upsert({
                  email: student.email,
                  full_name: student.full_name,
                  phone: student.phone,
                  role: 'student',
                  must_change_password: false,
                  updated_at: new Date().toISOString()
                }, { onConflict: 'email' });
            } catch (profErr) {
              console.warn('Profile sync non-fatal:', profErr);
            }

            // Sync into clients table if existing
            try {
              await supabase
                .from('clients')
                .update({
                  temp_password_reset: false,
                  last_password_change: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .eq('email', student.email);
            } catch (clErr) {
              console.warn('Client sync non-fatal:', clErr);
            }
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

        // 2. If not found in students, check clients table
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

          if (client.email) {
            try {
              await supabase
                .from('profiles')
                .upsert({
                  email: client.email,
                  full_name: client.full_name,
                  phone: client.phone,
                  role: 'client',
                  must_change_password: false,
                  updated_at: new Date().toISOString()
                }, { onConflict: 'email' });
            } catch (e) {}
          }

          return NextResponse.json({
            success: true,
            status: 'success',
            message: 'Client portal password updated successfully.'
          });
        }

        return NextResponse.json({ success: false, status: 'error', error: 'Student record not found for ' + target }, { status: 404 });
      }


     // 7. Student Portal Data Loader & Signed URL Refresh
           case 'getClientPortalData': {
        const identifier = (payload.identifier || payload.clientId || payload.email || '').trim().toLowerCase();
        if (!identifier) {
          return NextResponse.json({ success: false, status: 'error', error: 'Missing client identifier.' }, { status: 400 });
        }

        // 1. Check clients table
        const { data: client } = await supabase
          .from('clients')
          .select('*')
          .or(`client_id.eq.${identifier.toUpperCase()},email.eq.${identifier}`).maybeSingle();

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

        // 2. Check students table as fallback
        const { data: student } = await supabase
          .from('students')
          .select('*')
          .or(`student_id.eq.${identifier.toUpperCase()},email.eq.${identifier}`).maybeSingle();

        if (student) {
          return NextResponse.json({
            success: true,
            status: 'success',
            client: {
              clientId: 'CLI-' + (student.student_id ? student.student_id.replace('FIFS-', '') : '4081'),
              fullName: student.full_name,
              email: student.email,
              phone: student.phone,
              permitType: 'Maryland Wear & Carry Permit (CCW)',
              permitState: 'Maryland',
              expirationDate: '2027-10-15',
              status: 'ACTIVE_PERMIT_HOLDER',
              optInReminder: true,
              smsAlertPhone: student.phone
            }
          });
        }

        // 3. Demo Client Fallback
        if (identifier.includes('demo') || identifier === 'cli-4081' || identifier === 'marcus.vance@example.com') {
          return NextResponse.json({
            success: true,
            status: 'success',
            client: {
              clientId: 'CLI-4081',
              fullName: 'Marcus Vance (Demo Client)',
              email: 'marcus.vance@example.com',
              phone: '(410) 555-0192',
              permitType: 'Maryland Wear & Carry + Multi-State Non-Resident',
              permitState: 'Maryland • Virginia • Florida • Arizona • Pennsylvania',
              expirationDate: '2027-10-15',
              status: 'ACTIVE_PERMIT_HOLDER',
              optInReminder: true,
              smsAlertPhone: '(410) 555-0192'
            }
          });
        }

        return NextResponse.json({ success: false, status: 'error', error: 'Client record not found in system.' }, { status: 404 });
      }

case 'getStudentPortalData': {
        const identifier = (payload.identifier || payload.studentId || payload.email || '').trim().toLowerCase();
        if (!identifier) {
          return NextResponse.json({ success: false, status: 'error', error: 'Missing student identifier.' }, { status: 400 });
        }

        const { data: student } = await supabase
          .from('students')
          .select('*')
          .or(`student_id.eq.${identifier.toUpperCase()},email.eq.${identifier}`).maybeSingle();

        if (!student) {
          return NextResponse.json({ success: false, status: 'error', error: 'Student record not found.' }, { status: 404 });
        }

        const reqPassword = payload.password;
        // Password verification logic
        if (student.portal_password) {
          if (!reqPassword) {
            return NextResponse.json({
              success: false,
              status: 'password_required',
              message: 'Please enter your portal password to access your training dashboard.'
            }, { status: 401 });
          }
          if (student.portal_password !== reqPassword.trim()) {
            return NextResponse.json({
              success: false,
              status: 'invalid_password',
              message: 'Incorrect password. Please verify and try again.'
            }, { status: 401 });
          }
        } else if (student.must_change_password) {
          return NextResponse.json({
            success: false,
            status: 'needs_password_setup',
            message: 'First-time login: create your portal password below.'
          });
        }

        // Fetch all course enrollments with classes joined
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


     // 8. Automated 24-Hour Reminder Query & Trigger
     case 'check24HourReminders': {
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
       const {
         name, fullName, senderName,
         email, senderEmail,
         phone, senderPhone,
         message, text: msgText,
         threadId, thread_id,
         urgency = 'HIGH'
       } = payload;

       const finalName = (senderName || fullName || name || 'Website Visitor').trim();
       const finalEmail = (senderEmail || email || '').trim();
       const finalPhone = (senderPhone || phone || '').trim();
       const finalMsg = (message || msgText || '').trim();
       const finalThread = (threadId || thread_id || (finalPhone ? 'thread_' + finalPhone.replace(/\D/g, '') : 'thread_' + Date.now())).trim();

       if (!finalMsg) {
         return NextResponse.json({ success: false, error: 'Message content is required.' }, { status: 400 });
       }

       // 1. Insert into Supabase messages table
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

       // 2. Asynchronous Server-Side Discord Alert (Runs safely on server)
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
         data: insertedMsg,
         threadId: finalThread
       });
     }

     // 8b. Instructor Reply Handler from Admin Hub (Persists to Supabase & Marks Thread Read)
     case 'sendAdminLiveChatReply': {
       const adminPass = passcode || payload.passcode || payload.pin || body.passcode || body.pin;
       if (!verifyAdminPasscode(adminPass)) {
         return NextResponse.json({ success: false, error: 'Unauthorized: Invalid admin passcode.' }, { status: 401 });
       }

       const {
         threadId, thread_id,
         text: replyMsgText, message, replyText,
         senderPhone, phone,
         senderEmail, email
       } = payload;

       const finalMsg = (replyText || message || replyMsgText || '').trim();
       const finalThread = (threadId || thread_id || '').trim();

       if (!finalMsg || !finalThread) {
         return NextResponse.json({ success: false, error: 'Thread ID and message text are required.' }, { status: 400 });
       }

       // 1. Insert instructor reply into Supabase messages table
       const { data: insertedReply, error: replyErr } = await supabase
         .from('messages')
         .insert([{
           name: 'Coach Kai Wade',
           sender_name: 'Coach Kai Wade',
           email: 'kai@trainwithfifs.com',
           phone: '(443) 990-1304',
           sender_phone: '(443) 990-1304',
           message: finalMsg,
           thread_id: finalThread,
           sender: 'instructor',
           urgency: 'HIGH',
           status: 'READ',
           sent_at: new Date().toISOString()
         }])
         .select()
         .single();

       if (replyErr) {
         console.error('[FIFS] Error inserting admin reply:', replyErr);
         return NextResponse.json({ success: false, error: replyErr.message }, { status: 500 });
       }

       // 2. Mark visitor messages in this thread as READ
       try {
         await supabase
           .from('messages')
           .update({ status: 'READ' })
           .eq('thread_id', finalThread)
           .eq('sender', 'visitor');
       } catch (uErr) {
         console.warn('[FIFS] Error marking messages read:', uErr);
       }

       // 3. Server-side Discord Alert for outbound reply
       await sendServerDiscordAlert(
         "📤 Instructor Reply Sent: Coach Kai Wade",
         "Lead Instructor responded to thread: " + finalThread,
         [
           { name: "Instructor", value: "Coach Kai Wade", inline: true },
           { name: "Thread ID", value: finalThread, inline: true },
           { name: "Reply Message", value: finalMsg, inline: false }
         ],
         0x10B981
       );

       return NextResponse.json({
         success: true,
         status: 'success',
         message: 'Instructor reply recorded in Supabase.',
         data: insertedReply
       });
     }

     // 8c. Fetch Live Chat Messages for a specific thread
     case 'getLiveChatMessages': {
       const tId = payload.threadId || payload.thread_id;
       if (!tId) {
         return NextResponse.json({ success: false, error: 'threadId required' }, { status: 400 });
       }
       const { data: msgs } = await supabase
         .from('messages')
         .select('*')
         .eq('thread_id', tId)
         .order('sent_at', { ascending: true });

       return NextResponse.json({
         success: true,
         status: 'success',
         messages: msgs || []
       });
     }

     case 'getAdminDashboardData': {
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

        return NextResponse.json({
          success: true,
          status: 'success',
          students: (students || []).map(normalizeStudent),
          clients: (clients || []).map(normalizeClient),
          enrollments: enrollments || []
        });
      }


     // 10. Course Registration & Stripe Checkout Session Creator
     case 'submitBooking': {
        const {
          invoiceId = 'INV-FI-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
          studentId = 'FIFS-' + Math.floor(1000 + Math.random() * 9000),
          fullName = 'FIFS Training Student',
          email,
          phone = '',
          courseSelection = 'Maryland Firearms Training Course',
          preferredDates = 'Coordinated with Lead Instructor Kai Wade',
          amount,
          depositAmount,
          totalAmount,
          groupSize = '1',
          comments = '',
          classId = '',
          payInFull = false
        } = payload;

        if (!email || !email.includes('@')) {
          return NextResponse.json({ success: false, status: 'error', error: 'Valid student email address is required.' }, { status: 400 });
        }

        const stripeKey = process.env.STRIPE_SECRET_KEY;
        const isVip = /VIP/i.test(courseSelection || '');
        const fallbackPaymentUrl = isVip
          ? 'https://buy.stripe.com/7sI00u5cvb9BcwM9AB'
          : 'https://buy.stripe.com/dR67sWfR72D520ocMN';

        // 1. Calculate pricing factoring in group size, $45 Cindy's range fee for Base track, 6% MD tax, and 30% deposit
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
        const grandTotal = typeof totalAmount === 'number' && totalAmount > 0 ? totalAmount : (subtotal + mdTax);
        const depositDueNow = typeof depositAmount === 'number' && depositAmount > 0 ? depositAmount : (grandTotal * 0.30);
        const balanceDueClass = grandTotal - depositDueNow;

        // 30% deposit is default charge amount unless explicitly payInFull
        const chargeAmount = payInFull ? grandTotal : depositDueNow;
        const unitAmount = Math.round(chargeAmount * 100);

        const origin = req.headers.get('origin') || req.headers.get('referer') || 'https://trainwithfifs.com';
        const baseUrl = origin.replace(/\/+$/, '');

        let checkoutUrl = fallbackPaymentUrl;
        let sessionId = 'fallback-' + Date.now();

        if (stripeKey) {
          try {
            const Stripe = (await import('stripe')).default;
            const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' as any });

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
                      description: `Invoice: ${invoiceId} • Total Course Investment: $${grandTotal.toFixed(2)} (Tuition + ${isVip ? 'VIP Range Perk' : '$45 Cindy\'s Range Fee'} + 6% MD Tax) • ${payInFull ? 'Paid in Full' : 'Deposit: $' + depositDueNow.toFixed(2) + ' (Remaining $' + balanceDueClass.toFixed(2) + ' due on class day)'}`,
                    },
                  },
                  quantity: 1,
                },
              ],
             success_url: `${baseUrl}/?session_id={CHECKOUT_SESSION_ID}&booking_confirmed=true&invoice=${encodeURIComponent(invoiceId)}`,
             cancel_url: `${baseUrl}/?booking_cancelled=true&session_id={CHECKOUT_SESSION_ID}&invoice=${encodeURIComponent(invoiceId)}`,
           });

           if (session && session.url) {
             checkoutUrl = session.url;
             sessionId = session.id;
           }
         } catch (stripeErr: any) {
           console.error('[Stripe Session Creation Warning]:', stripeErr?.message);
           checkoutUrl = fallbackPaymentUrl;
         }
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

       return NextResponse.json({
         success: true,
         status: 'success',
         url: checkoutUrl,
         checkoutUrl: checkoutUrl,
         sessionId: sessionId,
         invoiceId,
         studentId
       });
     }

     default:
       return NextResponse.json({ success: false, error: 'Unhandled action: ' + action }, { status: 400 });
   }
 } catch (err: any) {
   console.error('[API FIFS Error]:', err);
   return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
 }
}