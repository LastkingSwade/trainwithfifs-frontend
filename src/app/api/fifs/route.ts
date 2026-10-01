import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ufqnmcincwnlyiwsmzcq.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase environment variables are not configured.');
  }
  return createClient(url, key, {
    auth: { persistSession: false }
  });
}

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'carpetcare85@gmail.com';
const SENDER_EMAIL = process.env.RESEND_FROM_EMAIL || 'Train With FIFS <onboarding@trainwithfifs.com>';

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

function validateStrictPassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long.' };
  }
  return { valid: true };
}

function verifyAdminPasscode(passcode?: string): boolean {
  const expected = process.env.ADMIN_PASSCODE || 'Ultima';
  return Boolean(passcode && passcode.trim().toLowerCase() === expected.trim().toLowerCase());
}

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
  const loc = (params.location || "Cindy's Hot Shots, 115 Holsum Way, Glen Burnie, MD 21060").replace(/,/g, '\\,');
  const cleanSummary = (params.title || 'FIFS Firearms Course').split('\n').join(' ').split('\r').join('');
  const cleanDesc = (params.description || '').split('\n').join('\\n').split('\r').join('');
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
    'DESCRIPTION:Reminder: 24 Hours until your FIFS Firearms Course',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

async function getSignedDocumentUrl(supabase: any, path?: string | null): Promise<string | null> {
  if (!path) return null;
  try {
    const { data, error } = await supabase.storage.from('course-materials').createSignedUrl(path, 604800);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch (err: any) {
    return null;
  }
}

interface ResendAttachment {
  filename: string;
  content: string;
}

async function sendResendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: ResendAttachment[];
}): Promise<{ success: boolean; error?: string }> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
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
      return { success: false, error: errText || 'Resend dispatch failed' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Email dispatch failed' };
  }
}

function normalizeStudent(s: any) {
  if (!s) return null;
  return {
    studentId: s.student_id || s.id,
    fullName: s.full_name || s.name || 'Student',
    email: s.email || '',
    phone: s.phone || '',
    course: s.course || s.course_name || s.course_selection || 'Maryland Wear & Carry Permit',
    assignedDate: s.assigned_date || s.preferred_dates || s.class_date || 'Upcoming Cohort',
    status: s.status || 'STEP_1_REGISTERED',
    profileDocUrl: s.profile_doc_url || s.dossier_url || '#',
    prepTasks: s.prep_tasks || { transport_law: false, ammo_acquired: false, eye_ear_pro: false, id_ready: false },
    mustChangePassword: Boolean(s.must_change_password || s.temp_password_reset),
    tempPasswordReset: Boolean(s.temp_password_reset),
    qualificationScore: s.qualification_score || '25/25 (100%)',
    scoresheetUrl: s.scoresheet_url || s.msp_score_sheet_url || null,
    internalNotes: s.internal_notes || s.notes || ''
  };
}

function normalizeClient(c: any) {
  if (!c) return null;
  return {
    clientId: c.client_id || c.id,
    fullName: c.full_name || 'Client',
    email: c.email || '',
    phone: c.phone || '',
    permitState: c.permit_state || c.permit_type || 'Maryland Wear & Carry',
    expirationDate: c.expiration_date || 'Not Set',
    status: c.status || 'ACTIVE_REGISTERED'
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action;
    const payload = (body.payload && typeof body.payload === 'object') ? { ...body, ...body.payload } : (body || {});
    const passcode = body.passcode || payload.passcode || payload.pin;
    const supabase = getSupabase();

    switch (action) {
      case 'getClasses': {
        const { data, error } = await supabase
          .from('classes')
          .select('*')
          .eq('is_active', true)
          .order('title', { ascending: true });
        if (error) {
          return NextResponse.json({ success: false, status: 'error', error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true, status: 'success', classes: data || [] });
      }

      case 'adminDirectInvite': {
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
          return NextResponse.json({ success: false, status: 'error', error: 'Full name and email are required.' }, { status: 400 });
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trainwithfifs.com';
        const magicLink = portalType === 'student'
          ? `${appUrl}/?portal=student&id=${encodeURIComponent(generatedId)}&temp=${encodeURIComponent(tempPassword)}`
          : `${appUrl}/?tab=fi-portal&id=${encodeURIComponent(generatedId)}`;

        if (portalType === 'client') {
          const clientId = payload.clientId || ('FI-CLIENT-' + Math.floor(1000 + Math.random() * 9000));
          await supabase.from('clients').upsert({
            client_id: clientId,
            full_name: fullName,
            email: email,
            phone: phone,
            permit_state: courseName,
            status: 'ACTIVE_REGISTERED',
            updated_at: now
          }, { onConflict: 'email' });

          return NextResponse.json({
            success: true,
            status: 'success',
            clientId,
            magicLink,
            message: 'Client invite created successfully.'
          });
        }

        const defaultTasks = { transport_law: false, ammo_acquired: false, eye_ear_pro: false, id_ready: false };
        const studentPayload: Record<string, any> = {
          student_id: generatedId,
          full_name: fullName,
          email: email,
          phone: phone,
          course: courseName,
          course_name: courseName,
          course_selection: courseName,
          preferred_dates: dates,
          assigned_date: dates,
          group_size: '1',
          comments: payload.comments || payload.notes || 'Direct invite dispatched by Instructor',
          status: 'STEP_1_REGISTERED',
          prep_tasks: defaultTasks,
          waiver_completed: false,
          created_at: now,
          updated_at: now,
          portal_password: tempPassword,
          temp_password_reset: true,
          must_change_password: true
        };

        await supabase.from('students').upsert(studentPayload, { onConflict: 'email' });

        const eventStart = new Date(dates);
        const validStartDate = isNaN(eventStart.getTime()) ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : eventStart;
        const icsContent = generateIcsCalendar({
          title: courseName,
          description: `Firearms Training Session: ${courseName} with Kai Wade. Schedule: ${dates}.`,
          startDate: validStartDate,
          durationHours: 8
        });

        const html = `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333;">
            <h2 style="color:#0f172a;">Welcome to Future Initiative Firearm Services</h2>
            <p>Dear <strong>${fullName}</strong>,</p>
            <p>Your portal access has been provisioned for <strong>${courseName}</strong> (${dates}).</p>
            <div style="background:#f1f5f9;border-left:4px solid #0284c7;padding:14px 18px;margin:16px 0;border-radius:4px;">
              <p style="margin:4px 0;"><strong>Direct 1-Click Access:</strong> <a href="${magicLink}" style="color:#0284c7;font-weight:bold;">Click here to enter your Student Portal</a></p>
              <p style="margin:6px 0 2px;"><strong>Student ID:</strong> <code>${generatedId}</code></p>
              <p style="margin:2px 0;"><strong>Temporary Password:</strong> <code>${tempPassword}</code></p>
            </div>
            <p><em>You will be prompted to set your permanent password upon first login.</em></p>
            <p>A calendar invitation (.ics) is attached to sync this course session with your phone.</p>
            <p>Lead Instructor Kai Wade<br>Future Initiative Firearm Services</p>
          </div>
        `;

        const emailResult = await sendResendEmail({
          to: email,
          subject: `Your Training Portal Access & Invitation - ${courseName}`,
          html: html,
          attachments: [{ filename: 'fifs-training-session.ics', content: Buffer.from(icsContent).toString('base64') }]
        });

        return NextResponse.json({
          success: true,
          status: 'success',
          studentId: generatedId,
          tempPassword: tempPassword,
          magicLink: magicLink,
          emailDispatched: emailResult.success,
          emailError: emailResult.error || null,
          message: 'Invitation dispatched and credentials created.'
        });
      }

      case 'getStudentPortalData': {
        const identifier = (payload.identifier || payload.studentId || payload.email || '').trim();
        const inputPassword = (payload.password || '').trim();

        if (!identifier) {
          return NextResponse.json({ success: false, status: 'error', error: 'Missing student identifier.' }, { status: 400 });
        }

        const { data: student, error: stErr } = await supabase
          .from('students')
          .select('*')
          .or(`email.ilike.${identifier},student_id.ilike.${identifier}`)
          .maybeSingle();

        if (stErr || !student) {
          return NextResponse.json({ success: false, status: 'not_found', message: 'Identifier not found in Student Roster.' }, { status: 404 });
        }

        const hasStoredPassword = Boolean(student.portal_password && student.portal_password.trim() !== '');
        const isMasterPasscode = verifyAdminPasscode(inputPassword);

        if (!inputPassword && hasStoredPassword) {
          return NextResponse.json({
            success: false,
            status: 'password_required',
            message: 'Please enter your portal password.'
          });
        }

        if (hasStoredPassword && !isMasterPasscode && inputPassword !== student.portal_password) {
          return NextResponse.json({
            success: false,
            status: 'invalid_password',
            error: 'Incorrect password. Please verify and try again.'
          });
        }

        if (!hasStoredPassword && !inputPassword) {
          return NextResponse.json({
            success: true,
            status: 'needs_password_setup',
            message: 'First-time login: create your portal password below.'
          });
        }

        const normalized = normalizeStudent(student);
        const requireReset = Boolean(student.temp_password_reset || student.must_change_password);

        return NextResponse.json({
          success: true,
          status: 'success',
          student: normalized,
          requirePasswordReset: requireReset,
          force_password_reset: requireReset
        });
      }

      case 'setupStudentPassword':
      case 'firstLoginPasswordChange':
      case 'selfServicePasswordUpdate': {
        const identifier = (payload.studentId || payload.email || '').trim();
        const newPassword = (payload.password || payload.newPassword || '').trim();

        if (!identifier || !newPassword) {
          return NextResponse.json({ success: false, status: 'error', error: 'Student ID and new password are required.' }, { status: 400 });
        }

        const val = validateStrictPassword(newPassword);
        if (!val.valid) {
          return NextResponse.json({ success: false, status: 'error', error: val.error }, { status: 400 });
        }

        const { data: updated, error: updateErr } = await supabase
          .from('students')
          .update({
            portal_password: newPassword,
            must_change_password: false,
            temp_password_reset: false,
            password_expires_at: null,
            updated_at: new Date().toISOString()
          })
          .or(`email.ilike.${identifier},student_id.ilike.${identifier}`)
          .select()
          .single();

        if (updateErr) {
          return NextResponse.json({ success: false, status: 'error', error: updateErr.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          status: 'success',
          student: normalizeStudent(updated),
          message: 'Password updated successfully!'
        });
      }

      case 'getAdminDashboardData': {
        const { data: students } = await supabase
          .from('students')
          .select('*')
          .order('created_at', { ascending: false });

        const { data: clients } = await supabase
          .from('clients')
          .select('*')
          .order('created_at', { ascending: false });

        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('*, classes(title)')
          .order('scheduled_date', { ascending: false });

        const { data: liveChats } = await supabase
          .from('live_chats')
          .select('*')
          .order('created_at', { ascending: false });

        return NextResponse.json({
          success: true,
          status: 'success',
          students: (students || []).map(normalizeStudent),
          clients: (clients || []).map(normalizeClient),
          enrollments: enrollments || [],
          liveChats: liveChats || []
        });
      }

      case 'updateStudentStatus': {
        const studentId = payload.studentId;
        const newStatus = payload.status;
        if (!studentId || !newStatus) {
          return NextResponse.json({ success: false, status: 'error', error: 'Missing studentId or status' }, { status: 400 });
        }

        const { error } = await supabase
          .from('students')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('student_id', studentId);

        if (error) {
          return NextResponse.json({ success: false, status: 'error', error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true, status: 'success' });
      }

      case 'updateStudentTask': {
        const studentId = payload.studentId;
        const taskId = payload.taskId;
        const isChecked = Boolean(payload.isChecked);

        const { data: student } = await supabase
          .from('students')
          .select('prep_tasks')
          .eq('student_id', studentId)
          .maybeSingle();

        const currentTasks = (student && student.prep_tasks) ? student.prep_tasks : {};
        currentTasks[taskId] = isChecked;

        await supabase
          .from('students')
          .update({ prep_tasks: currentTasks, updated_at: new Date().toISOString() })
          .eq('student_id', studentId);

        return NextResponse.json({ success: true, status: 'success' });
      }

      case 'adminEditStudent': {
        const studentId = payload.studentId;
        const updates = payload.updates || payload;
        delete updates.action;
        delete updates.passcode;
        delete updates.studentId;

        const { data: updated, error } = await supabase
          .from('students')
          .update({
            full_name: updates.fullName || updates.full_name,
            email: updates.email,
            phone: updates.phone,
            course_name: updates.courseSelection || updates.course,
            course: updates.courseSelection || updates.course,
            assigned_date: updates.assignedDate || updates.classDate,
            status: updates.status,
            qualification_score: updates.qualificationScore,
            profile_doc_url: updates.profileDocUrl || updates.dossierUrl,
            internal_notes: updates.notes,
            updated_at: new Date().toISOString()
          })
          .eq('student_id', studentId)
          .select()
          .single();

        if (error) {
          return NextResponse.json({ success: false, status: 'error', error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true, status: 'success', student: normalizeStudent(updated) });
      }

      case 'adminDeleteStudent': {
        const studentId = payload.studentId;
        if (!studentId) {
          return NextResponse.json({ success: false, status: 'error', error: 'Missing studentId' }, { status: 400 });
        }
        await supabase.from('students').delete().eq('student_id', studentId);
        return NextResponse.json({ success: true, status: 'success', message: 'Student removed.' });
      }

      case 'handleLiveChatMessage': {
        const threadId = payload.threadId || payload.thread_id;
        const messageText = payload.message || payload.text;
        const senderName = payload.senderName || payload.name || 'Visitor';
        const senderPhone = payload.senderPhone || payload.phone || '';

        if (!threadId || !messageText) {
          return NextResponse.json({ success: false, status: 'error', error: 'Missing message content or thread ID' }, { status: 400 });
        }

        await supabase.from('live_chats').insert({
          thread_id: threadId,
          sender: 'user',
          sender_name: senderName,
          sender_phone: senderPhone,
          message: messageText,
          sent_at: new Date().toISOString()
        });

        const { data: threadMessages } = await supabase
          .from('live_chats')
          .select('*')
          .eq('thread_id', threadId)
          .order('sent_at', { ascending: true });

        return NextResponse.json({ success: true, status: 'success', messages: threadMessages || [] });
      }

      case 'getLiveChats': {
        const { data: chats } = await supabase
          .from('live_chats')
          .select('*')
          .order('sent_at', { ascending: false });

        return NextResponse.json({ success: true, status: 'success', liveChats: chats || [] });
      }

      case 'getVisitorChatMessages': {
        const threadId = payload.threadId;
        const { data: msgs } = await supabase
          .from('live_chats')
          .select('*')
          .eq('thread_id', threadId)
          .order('sent_at', { ascending: true });

        return NextResponse.json({ success: true, status: 'success', messages: msgs || [] });
      }

      case 'sendAdminLiveChatReply': {
        const threadId = payload.threadId || payload.payload?.threadId;
        const replyText = payload.text || payload.payload?.text || payload.message;

        await supabase.from('live_chats').insert({
          thread_id: threadId,
          sender: 'instructor',
          sender_name: 'Coach Kai Wade',
          message: replyText,
          sent_at: new Date().toISOString()
        });

        return NextResponse.json({ success: true, status: 'success', message: 'Reply recorded.' });
      }

      case 'deleteLiveChatThread': {
        const threadId = payload.threadId;
        await supabase.from('live_chats').delete().eq('thread_id', threadId);
        return NextResponse.json({ success: true, status: 'success', message: 'Thread deleted.' });
      }

      default:
        return NextResponse.json({ success: false, status: 'error', error: 'Unhandled action: ' + action }, { status: 400 });
    }
  } catch (err: any) {
    console.error('[API FIFS Error]:', err);
    return NextResponse.json({ success: false, status: 'error', error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
