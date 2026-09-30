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
  const cleanSummary = (params.title || 'FIFS Firearms Course').replace(/
/g, ' ');
  const cleanDesc = (params.description || '').replace(/
/g, '\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Train with FIFS//Course Scheduler//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: 24 Hours until your FIFS Firearms Qualification Course',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('
');
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
        'Authorization': ,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn();
      return { success: false, error:  };
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
    course: s.course || 'Firearms Training',
    assignedDate: s.assigned_date || s.dates || 'Upcoming Cohort',
    status: s.status || 'STEP_1_REGISTERED',
    profileDocUrl: s.profile_doc_url || '#',
    prepTasks: s.prep_tasks || { transport_law: false, ammo_acquired: false, eye_ear_pro: false, id_ready: false },
    mustChangePassword: Boolean(s.must_change_password),
    internalNotes: s.internal_notes || ''
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, payload, passcode } = body;
    const supabase = getSupabase();

    switch (action) {
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
      case 'adminEnrollStudent': {
        if (!verifyAdminPasscode(passcode)) {
          return NextResponse.json({ success: false, error: 'Unauthorized: Invalid admin passcode.' }, { status: 401 });
        }

        const fullName = (payload.fullName || payload.name || '').trim();
        const email = (payload.email || '').trim().toLowerCase();
        const phone = (payload.phone || '').trim();
        const role = payload.role || 'student';
        const internalNotes = payload.internalNotes || payload.notes || '';
        const classId = payload.classId;
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
          return NextResponse.json({ success: true, isNewUser: true, message:  });
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
        const icsDescription = ;
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
          const html = <p style="margin:10px 0 0 0;"><a href="" style="background:#0284c7;color:#ffffff;text-decoration:none;padding:8px 16px;border-radius:4px;font-weight:bold;display:inline-block;">Download Course Materials (7-Day Secure Link)</a></p>;
          emailResult = await sendResendEmail({
            to: email,
            subject: ,
            html: html,
            attachments: attachments
          });
        } else {
          // Existing User Enrollment Confirmation
          const html = <p style="margin:10px 0 0 0;"><a href="" style="background:#0284c7;color:#ffffff;text-decoration:none;padding:8px 16px;border-radius:4px;font-weight:bold;display:inline-block;">Download Course Materials (7-Day Secure Link)</a></p>;
          emailResult = await sendResendEmail({
            to: email,
            subject: ,
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
            internal_notes: reason ?  : enrollment.internal_notes
          })
          .eq('id', enrollmentId);

        if (updateErr) {
          return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
        }

        // Generate updated ICS
        const classTitle = enrollment.classes?.title || 'FIFS Firearms Course';
        const icsContent = generateIcsCalendar({
          title: ,
          description: ,
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

        const html = <p style="margin:8px 0 0 0;color:#713f12;"><strong>Instructor Note:</strong> </p>;

        await sendResendEmail({
          to: enrollment.student_email,
          subject: ,
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

        const html = <div style="background:#fef2f2;border:1px solid #fecaca;padding:12px;border-radius:6px;margin:16px 0;"><strong>Reason:</strong> </div>;

        await sendResendEmail({
          to: enrollment.student_email,
          subject: ,
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
          subject: ,
          html: 
        });

        return NextResponse.json({ success: true, message: 'Password updated successfully. Welcome to your portal!' });
      }

      // 6. Self-Service Password Update
      case 'selfServicePasswordUpdate': {
        const { email, currentPassword, newPassword } = payload;
        if (!email || !newPassword) {
          return NextResponse.json({ success: false, error: 'Email and new password are required.' }, { status: 400 });
        }

        const val = validateStrictPassword(newPassword);
        if (!val.valid) {
          return NextResponse.json({ success: false, error: val.error }, { status: 400 });
        }

        const { error } = await supabase
          .from('students')
          .update({ portal_password: newPassword, must_change_password: false })
          .eq('email', email.trim().toLowerCase());

        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true, message: 'Account password updated successfully.' });
      }

      // 7. Student Portal Data Loader & Signed URL Refresh
      case 'getStudentPortalData': {
        const identifier = (payload.identifier || payload.studentId || payload.email || '').trim().toLowerCase();
        if (!identifier) {
          return NextResponse.json({ success: false, error: 'Missing student identifier.' }, { status: 400 });
        }

        const { data: student } = await supabase
          .from('students')
          .select('*')
          .or()
          .maybeSingle();

        if (!student) {
          return NextResponse.json({ success: false, error: 'Student record not found.' }, { status: 404 });
        }

        // Fetch all course enrollments with classes joined (Never expose internal_notes)
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('id, class_id, scheduled_date, duration_hours, status, cancellation_reason, previous_dates, created_at, classes(title, description, materials_path, required_gear_notes)')
          .eq('student_email', student.email)
          .order('scheduled_date', { ascending: false });

        // Generate fresh 7-day signed URLs for any active materials
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

          const html = <p><a href="" style="background:#0284c7;color:#ffffff;padding:8px 16px;border-radius:4px;text-decoration:none;font-weight:bold;">Review Course Study Guide</a></p>;

          await sendResendEmail({
            to: enr.student_email,
            subject: ,
            html: html
          });

          await supabase.from('enrollments').update({ reminder_sent: true }).eq('id', enr.id);
          sentList.push(enr.id);
        }

        return NextResponse.json({ success: true, processedCount: sentList.length, sentIds: sentList });
      }

      // 9. Admin Dashboard Roster & History
      case 'getAdminDashboardData': {
        const { data: students } = await supabase
          .from('students')
          .select('*')
          .order('created_at', { ascending: false });

        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('*, classes(title)')
          .order('scheduled_date', { ascending: false });

        return NextResponse.json({
          success: true,
          students: (students || []).map(normalizeStudent),
          enrollments: enrollments || []
        });
      }

      default:
        return NextResponse.json({ success: false, error:  }, { status: 400 });
    }
  } catch (err: any) {
    console.error('[API FIFS Error]:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
