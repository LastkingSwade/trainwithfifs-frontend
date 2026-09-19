import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client using Service Role key (bypasses RLS for secure server operations)
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error('Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) are not configured.');
  }
  return createClient(url, key, {
    auth: { persistSession: false }
  });
}

function verifyAdminPasscode(passcode?: string): boolean {
  const expected = process.env.ADMIN_PASSCODE || 'Ultima';
  return Boolean(passcode && passcode.trim().toLowerCase() === expected.trim().toLowerCase());
}

// Helper to normalize student fields to both camelCase and snake_case for UI compatibility
function normalizeStudent(s: any) {
  if (!s) return s;
  return {
    ...s,
    studentId: s.student_id || s.studentId,
    fullName: s.full_name || s.fullName,
    email: s.email,
    phone: s.phone,
    courseSelection: s.course_selection || s.courseSelection,
    preferredDates: s.preferred_dates || s.preferredDates,
    groupSize: s.group_size || s.groupSize,
    comments: s.comments,
    status: s.status,
    prepTasks: s.prep_tasks || s.prepTasks,
    profileDocUrl: s.profile_doc_url || s.profileDocUrl,
    waiverCompleted: s.waiver_completed !== undefined ? s.waiver_completed : s.waiverCompleted,
    scoresheetUrl: s.scoresheet_url || s.scoresheetUrl,
    assignedDate: s.assigned_date || s.assignedDate,
    qualificationScore: s.qualification_score || s.qualificationScore,
    createdAt: s.created_at || s.createdAt,
    updatedAt: s.updated_at || s.updatedAt,
  };
}

// Helper to normalize client fields
function normalizeClient(c: any) {
  if (!c) return c;
  return {
    ...c,
    clientId: c.client_id || c.clientId,
    fullName: c.full_name || c.fullName,
    email: c.email,
    phone: c.phone,
    permitState: c.permit_state || c.permitState,
    expirationDate: c.expiration_date || c.expirationDate,
    createdAt: c.created_at || c.createdAt,
    updatedAt: c.updated_at || c.updatedAt,
  };
}

// Helper to normalize invoice fields
function normalizeInvoice(i: any) {
  if (!i) return i;
  return {
    ...i,
    invoiceId: i.invoice_id || i.invoiceId,
    studentId: i.student_id || i.studentId,
    course: i.course,
    totalAmount: i.total_amount !== undefined ? i.total_amount : i.totalAmount,
    amountPaid: i.amount_paid !== undefined ? i.amount_paid : i.amountPaid,
    balanceDue: i.balance_due !== undefined ? i.balance_due : i.balanceDue,
    status: i.status,
    dueDate: i.due_date || i.dueDate,
    stripeSessionId: i.stripe_session_id || i.stripeSessionId,
    facility: i.facility,
    paymentMethod: i.payment_method || i.paymentMethod,
  };
}


// Helper to group flat messages into threads for Admin Hub Two-Way Chat Console
function groupMessagesIntoThreads(messages: any[] = []) {
  const threadsMap: { [key: string]: any } = {};

  // Sort chronologically ascending so messages read in order
  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
  );

  for (const m of sortedMessages) {
    const rawPhone = (m.phone || '').toString().trim();
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const studentId = (m.student_id || m.studentId || '').toString().trim();

    // Use thread_id as primary key
    let threadKey = m.thread_id || (cleanPhone ? 'thread_' + cleanPhone : (studentId ? 'thread_' + studentId : 'thread_' + (m.id || 'general')));
    if (!threadsMap[threadKey]) {
      threadsMap[threadKey] = {
        id: threadKey,
        senderName: (m.sender === 'student' || m.sender === 'visitor') ? (m.name || 'Valued Visitor') : 'Inquirer',
        senderPhone: rawPhone || 'Online Visitor',
        senderEmail: m.email || '',
        studentId: studentId || null,
        lastUpdated: m.sent_at ? new Date(m.sent_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '',
        lastTimestamp: m.sent_at ? new Date(m.sent_at).getTime() : 0,
        unread: false,
        messages: []
      };
    }
    const t = threadsMap[threadKey];
    if (m.sender === 'student' || m.sender === 'visitor') {
      if (m.name && m.name !== 'Coach Kai Wade') t.senderName = m.name;
      if (rawPhone) t.senderPhone = rawPhone;
      if (m.email) t.senderEmail = m.email;
    }
    const msgObj = {
      id: m.id,
      sender: (m.sender === 'admin' || m.sender === 'instructor') ? 'instructor' : 'user',
      senderName: (m.sender === 'admin' || m.sender === 'instructor') ? 'Coach Kai Wade' : t.senderName,
      text: m.message || '',
      time: m.sent_at ? new Date(m.sent_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '',
      sent_at: m.sent_at
    };
    t.messages.push(msgObj);
    const sentTime = m.sent_at ? new Date(m.sent_at).getTime() : 0;
    if (sentTime >= t.lastTimestamp) {
      t.lastTimestamp = sentTime;
      t.lastUpdated = msgObj.time;
      t.unread = (m.sender === 'student' || m.sender === 'visitor');
    }
  }
  return Object.values(threadsMap).sort((a: any, b: any) => b.lastTimestamp - a.lastTimestamp);
}

async function sendDiscordChatAlert({
  name,
  phone,
  email,
  message,
  sessionId,
}: {
  name: string;
  phone: string;
  email?: string;
  message: string;
  sessionId?: string;
}) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('[FIFS] DISCORD_WEBHOOK_URL not configured');
    return;
  }
  const cleanPhone = (phone || '').replace(/\D/g, '');
  const telLink = cleanPhone ? `tel:${cleanPhone}` : '';

  const payload = {
    content: '@everyone 🚨 **NEW INCOMING TRAINING INQUIRY**',
    embeds: [
      {
        title: 'Direct Dispatch from trainwithfifs.com',
        description: message,
        color: 0x00e5ff,
        fields: [
          { name: '👤 Student / Visitor', value: name || 'Valued Visitor', inline: true },
          { name: '📱 Phone', value: phone ? `[${phone}](${telLink})` : 'N/A', inline: true },
          { name: '✉️ Email', value: email || 'N/A', inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: `FIFS Dispatch System • ID: ${sessionId || 'direct'}` },
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error('[FIFS] Discord webhook error:', res.status, await res.text());
    }
  } catch (err) {
    console.error('[FIFS] Failed to send Discord webhook:', err);
  }
}



async function syncBookingToGoogleCalendar({
  fullName,
  studentId,
  course,
  phone,
  email,
  dates,
  comments,
}: {
  fullName: string;
  studentId: string;
  course: string;
  phone?: string;
  email?: string;
  dates: string;
  comments?: string;
}) {
  const webhookUrl = process.env.GOOGLE_CALENDAR_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbzMxq-Zrfh8DTDOr2YBbcI-2vuR1os_d6KNljyYGQ17IEi1JxzqSWchQpBKf2eWrh8F/exec';
  if (!webhookUrl) return { success: false, reason: 'No webhook URL' };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName,
        studentId,
        course,
        phone,
        email,
        dates,
        comments,
      }),
    });
    const data = await res.json().catch(() => null);
    return { success: res.ok, data };
  } catch (err) {
    console.error('[FIFS] Failed to sync Google Calendar event:', err);
    return { success: false, error: err };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || (body.payload && body.payload.action);
    const payload = body.payload !== undefined ? body.payload : body;
    const passcode = body.passcode || payload?.passcode || payload?.pin;

    let supabase;
    try {
      supabase = getSupabase();
    } catch (err: any) {
      console.error('Supabase initialization error in /api/fifs:', err.message);
      return NextResponse.json({
        success: false,
        status: 'error',
        error: err.message || 'Supabase service role client is not configured in environment variables.'
      }, { status: 500 });
    }

    switch (action) {
      // =========================================================================
      // SECTION A: ADMIN HUB ACTIONS (Passcode protected)
      // =========================================================================
      case 'getAdminDashboardData': {
        if (!verifyAdminPasscode(passcode)) {
          return NextResponse.json({ success: false, status: 'error', error: 'Invalid admin passcode.' }, { status: 401 });
        }

        const [studentsRes, clientsRes, invoicesRes, messagesRes] = await Promise.all([
          supabase.from('students').select('*').order('created_at', { ascending: false }),
          supabase.from('clients').select('*').order('created_at', { ascending: false }),
          supabase.from('invoices').select('*').order('created_at', { ascending: false }),
          supabase.from('messages').select('*').order('sent_at', { ascending: false }).limit(100),
        ]);

        if (studentsRes.error) console.error('Error fetching students:', studentsRes.error);
        if (clientsRes.error) console.error('Error fetching clients:', clientsRes.error);
        if (invoicesRes.error) console.error('Error fetching invoices:', invoicesRes.error);
        if (messagesRes.error) console.error('Error fetching messages:', messagesRes.error);

        const rawStudents = studentsRes.data || [];
        const rawClients = clientsRes.data || [];
        const rawInvoices = invoicesRes.data || [];
        const rawMessages = messagesRes.data || [];

        const students = rawStudents.map(normalizeStudent);
        const clients = rawClients.map(normalizeClient);
        const invoices = rawInvoices.map(normalizeInvoice);

        // Aggregate metrics
        const totalStudents = students.length;
        const activeClients = clients.length;
        let totalRevenue = 0;
        let outstandingBalance = 0;

        for (const inv of rawInvoices) {
          totalRevenue += Number(inv.amount_paid || 0);
          outstandingBalance += Number(inv.balance_due || 0);
        }

        const groupedThreads = groupMessagesIntoThreads(rawMessages);
        const unreadChatCount = groupedThreads.filter((t: any) => t.unread).length;

        return NextResponse.json({
          success: true,
          status: 'success',
          totalStudents,
          activeClients,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          outstandingBalance: Math.round(outstandingBalance * 100) / 100,
          students,
          clients,
          invoices,
          messages: rawMessages,
          liveChats: groupedThreads,
          threads: groupedThreads,
          stats: {
            totalStudents,
            activeClients,
            unreadChatCount,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            outstandingBalance: Math.round(outstandingBalance * 100) / 100,
          }
        });
      }

      case 'adminEditStudent': {
        if (!verifyAdminPasscode(passcode)) {
          return NextResponse.json({ success: false, status: 'error', error: 'Invalid admin passcode.' }, { status: 401 });
        }
        const studentId = payload.studentId || payload.student_id;
        if (!studentId) {
          return NextResponse.json({ success: false, status: 'error', error: 'Missing studentId.' }, { status: 400 });
        }

        const updates = payload.updates || payload;
        const dbUpdates: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };

        if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
        if (updates.full_name !== undefined) dbUpdates.full_name = updates.full_name;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
        if (updates.courseSelection !== undefined) dbUpdates.course_selection = updates.courseSelection;
        if (updates.course_selection !== undefined) dbUpdates.course_selection = updates.course_selection;
        if (updates.preferredDates !== undefined) dbUpdates.preferred_dates = updates.preferredDates;
        if (updates.preferred_dates !== undefined) dbUpdates.preferred_dates = updates.preferred_dates;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.prepTasks !== undefined) dbUpdates.prep_tasks = updates.prepTasks;
        if (updates.prep_tasks !== undefined) dbUpdates.prep_tasks = updates.prep_tasks;
        if (updates.waiverCompleted !== undefined) dbUpdates.waiver_completed = Boolean(updates.waiverCompleted);
        if (updates.waiver_completed !== undefined) dbUpdates.waiver_completed = Boolean(updates.waiver_completed);
        if (updates.assignedDate !== undefined) dbUpdates.assigned_date = updates.assignedDate;
        if (updates.assigned_date !== undefined) dbUpdates.assigned_date = updates.assigned_date;
        if (updates.qualificationScore !== undefined) dbUpdates.qualification_score = updates.qualificationScore;
        if (updates.qualification_score !== undefined) dbUpdates.qualification_score = updates.qualification_score;

        const { data, error } = await supabase
          .from('students')
          .update(dbUpdates)
          .eq('student_id', studentId)
          .select()
          .single();

        if (error) {
          return NextResponse.json({ success: false, status: 'error', error: error.message }, { status: 400 });
        }
        return NextResponse.json({ success: true, status: 'success', student: normalizeStudent(data) });
      }

      case 'adminDeleteStudent': {
        if (!verifyAdminPasscode(passcode)) {
          return NextResponse.json({ success: false, status: 'error', error: 'Invalid admin passcode.' }, { status: 401 });
        }
        const studentId = payload.studentId || payload.student_id;
        if (!studentId) {
          return NextResponse.json({ success: false, status: 'error', error: 'Missing studentId.' }, { status: 400 });
        }

        // Delete associated invoices first (to respect foreign key)
        const { error: invoiceErr } = await supabase
          .from('invoices')
          .delete()
          .eq('student_id', studentId);

        if (invoiceErr) {
          console.warn('Notice deleting associated student invoices:', invoiceErr.message);
        }

        const { error: studentErr } = await supabase
          .from('students')
          .delete()
          .eq('student_id', studentId);

        if (studentErr) {
          return NextResponse.json({ success: false, status: 'error', error: studentErr.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, status: 'success', message: 'Student and related records deleted.' });
      }

      case 'adminEditClient': {
        if (!verifyAdminPasscode(passcode)) {
          return NextResponse.json({ success: false, status: 'error', error: 'Invalid admin passcode.' }, { status: 401 });
        }
        const clientId = payload.clientId || payload.client_id;
        if (!clientId) {
          return NextResponse.json({ success: false, status: 'error', error: 'Missing clientId.' }, { status: 400 });
        }

        const updates = payload.updates || payload;
        const dbUpdates: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };

        if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
        if (updates.full_name !== undefined) dbUpdates.full_name = updates.full_name;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
        if (updates.permitState !== undefined) dbUpdates.permit_state = updates.permitState;
        if (updates.permit_state !== undefined) dbUpdates.permit_state = updates.permit_state;
        if (updates.expirationDate !== undefined) dbUpdates.expiration_date = updates.expirationDate;
        if (updates.expiration_date !== undefined) dbUpdates.expiration_date = updates.expiration_date;

        const { data, error } = await supabase
          .from('clients')
          .update(dbUpdates)
          .eq('client_id', clientId)
          .select()
          .single();

        if (error) {
          return NextResponse.json({ success: false, status: 'error', error: error.message }, { status: 400 });
        }
        return NextResponse.json({ success: true, status: 'success', client: normalizeClient(data) });
      }

      case 'adminDeleteClient': {
        if (!verifyAdminPasscode(passcode)) {
          return NextResponse.json({ success: false, status: 'error', error: 'Invalid admin passcode.' }, { status: 401 });
        }
        const clientId = payload.clientId || payload.client_id;
        if (!clientId) {
          return NextResponse.json({ success: false, status: 'error', error: 'Missing clientId.' }, { status: 400 });
        }

        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('client_id', clientId);

        if (error) {
          return NextResponse.json({ success: false, status: 'error', error: error.message }, { status: 400 });
        }
        return NextResponse.json({ success: true, status: 'success', message: 'Client deleted from database.' });
      }

      case 'adminDirectInvite': {
        if (!verifyAdminPasscode(passcode)) {
          return NextResponse.json({ success: false, status: 'error', error: 'Invalid admin passcode.' }, { status: 401 });
        }

        const portalType = payload.portalType || 'student';
        const generatedId = payload.generatedId || ('FIFS-' + Math.floor(1000 + Math.random() * 9000));
        const now = new Date().toISOString();

        if (portalType === 'client') {
          const clientId = payload.clientId || ('FI-CLIENT-' + Math.floor(1000 + Math.random() * 9000));
          const { data, error } = await supabase
            .from('clients')
            .upsert({
              client_id: clientId,
              full_name: payload.fullName || payload.name || 'Agent Invite',
              email: payload.email || '',
              phone: payload.phone || '',
              permit_state: payload.course || payload.permitState || 'Maryland Wear & Carry',
              expiration_date: payload.dates || payload.expirationDate || null,
              created_at: now,
              updated_at: now,
            })
            .select()
            .single();

          if (error) {
            return NextResponse.json({ success: false, status: 'error', error: error.message }, { status: 400 });
          }
          return NextResponse.json({ success: true, status: 'success', client: normalizeClient(data), clientId });
        }

        // Student direct invite
        const defaultTasks = {
          waiverSigned: false,
          gearConfirmed: false,
          rangeRulesAccepted: false,
          calendarSynced: false,
        };

        const invitePassword = (payload.password || payload.portalPassword || '').toString().trim();
        const studentPayload: Record<string, any> = {
          student_id: generatedId,
          full_name: payload.fullName || payload.name || 'Invited Student',
          email: payload.email || '',
          phone: payload.phone || '',
          course_name: payload.course || payload.courseSelection || 'Maryland Wear & Carry Permit',
          course_selection: payload.course || payload.courseSelection || 'Maryland Wear & Carry Permit',
          preferred_dates: payload.dates || 'Upcoming Cohort',
          group_size: 1,
          comments: 'Direct invite dispatched by Instructor',
          status: 'STEP_1_REGISTERED',
          prep_tasks: defaultTasks,
          waiver_completed: false,
          portal_password: invitePassword || null,
          created_at: now,
          updated_at: now,
        };

        let { data: student, error: studentError } = await supabase
          .from('students')
          .insert(studentPayload)
          .select()
          .single();

        if (studentError && (studentError.message.includes('portal_password') || studentError.message.includes('schema cache'))) {
          delete studentPayload.portal_password;
          const retry = await supabase.from('students').insert(studentPayload).select().single();
          student = retry.data;
          studentError = retry.error;
        }

        if (studentError) {
          return NextResponse.json({ success: false, status: 'error', error: studentError.message }, { status: 400 });
        }

        // Auto-sync invited student session to Google Calendar
        syncBookingToGoogleCalendar({
          fullName: payload.fullName || payload.name || 'Invited Student',
          studentId: generatedId,
          course: payload.course || payload.courseSelection || 'Maryland Wear & Carry Permit',
          phone: payload.phone || '',
          email: payload.email || '',
          dates: payload.dates || 'Upcoming Cohort',
          comments: 'Direct invite dispatched by Instructor',
        });

        // Create associated invoice if total specified or default
        const invoiceId = 'INV-' + Math.floor(10000 + Math.random() * 90000);
        await supabase
          .from('invoices')
          .insert({
            invoice_id: invoiceId,
            student_id: generatedId,
            course: payload.course || 'Maryland Wear & Carry Permit',
            total_amount: Number(payload.totalAmount || 312.69),
            amount_paid: 0.0,
            balance_due: Number(payload.totalAmount || 312.69),
            status: 'ISSUED',
            facility: 'Main Training Facility',
            payment_method: 'Stripe / Pending',
          });

        return NextResponse.json({
          success: true,
          status: 'success',
          studentId: generatedId,
          student: normalizeStudent(student),
        });
      }

      case 'sendAdminLiveChatReply': {
        if (!verifyAdminPasscode(passcode)) {
          return NextResponse.json({ success: false, status: 'error', error: 'Invalid admin passcode.' }, { status: 401 });
        }
        const replyMessage = payload.replyText || payload.text || payload.message || '';
        const targetThreadId = payload.thread_id || payload.threadId || '';
        const targetPhone = payload.senderPhone || payload.phone || '';
        const studentId = payload.studentId || payload.student_id || null;

        const { data, error } = await supabase
          .from('messages')
          .insert({
            name: 'Coach Kai Wade',
            sender_name: 'Coach Kai Wade',
            phone: targetPhone,
            sender_phone: targetPhone,
            email: payload.senderEmail || 'info@trainwithfifs.com',
            message: replyMessage,
            urgency: 'HIGH',
            sender: 'admin',
            student_id: studentId,
            thread_id: targetThreadId,
            sent_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          console.error('Supabase admin reply error:', error);
          return NextResponse.json({ success: false, status: 'error', error: error.message }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          status: 'success',
          message: 'Reply sent.',
          data,
        });
      }

      
            // =============================================================
      case 'getStudentPortalData': {
        const queryTerm = (payload.studentId || payload.id || payload.email || '').toString().trim();
        const providedPassword = (payload.password || '').toString().trim();
        if (!queryTerm) {
          return NextResponse.json({ success: false, status: 'error', error: 'Missing student identifier or email.' }, { status: 400 });
        }

        let studentQuery = supabase.from('students').select('*');
        if (queryTerm.includes('@')) {
          studentQuery = studentQuery.ilike('email', queryTerm);
        } else {
          studentQuery = studentQuery.eq('student_id', queryTerm);
        }

        const { data: student, error: studentError } = await studentQuery.maybeSingle();

        if (studentError) {
          return NextResponse.json({ success: false, status: 'error', error: studentError.message }, { status: 400 });
        }
        if (!student) {
          return NextResponse.json({ success: false, status: 'not_found', message: 'Student record not found.' }, { status: 404 });
        }

        // Student Portal Password verification (Option 1 & 2 integration)
        if (!student.portal_password) {
          return NextResponse.json({
            success: true,
            status: 'needs_password_setup',
            student: {
              studentId: student.student_id,
              email: student.email,
              fullName: student.full_name,
            },
            message: 'First-time setup: please create your permanent portal password.',
          });
        }

        if (!providedPassword) {
          return NextResponse.json({
            success: false,
            status: 'password_required',
            message: 'Please enter your portal password.',
          }, { status: 401 });
        }

        if (student.portal_password !== providedPassword) {
          return NextResponse.json({
            success: false,
            status: 'invalid_password',
            message: 'Incorrect portal password. Please check and try again.',
          }, { status: 401 });
        }

        // Fetch related invoices
        const { data: invoices } = await supabase
          .from('invoices')
          .select('*')
          .eq('student_id', student.student_id);

        return NextResponse.json({
          success: true,
          status: 'success',
          student: normalizeStudent(student),
          invoices: (invoices || []).map(normalizeInvoice),
        });
      }

      case 'setupStudentPassword': {
        const studentId = (payload.studentId || '').toString().trim();
        const email = (payload.email || '').toString().trim().toLowerCase();
        const newPassword = (payload.password || '').toString().trim();

        if (!newPassword || newPassword.length < 4) {
          return NextResponse.json({ success: false, status: 'error', error: 'Password must be at least 4 characters.' }, { status: 400 });
        }

        let updateQuery = supabase.from('students').update({
          portal_password: newPassword,
          updated_at: new Date().toISOString(),
        });

        if (studentId) {
          updateQuery = updateQuery.eq('student_id', studentId);
        } else {
          updateQuery = updateQuery.ilike('email', email);
        }

        const { data: updatedStudent, error: updateError } = await updateQuery.select().single();

        if (updateError) {
          return NextResponse.json({ success: false, status: 'error', error: updateError.message }, { status: 400 });
        }

        const { data: invoices } = await supabase
          .from('invoices')
          .select('*')
          .eq('student_id', updatedStudent.student_id);

        return NextResponse.json({
          success: true,
          status: 'success',
          student: normalizeStudent(updatedStudent),
          invoices: (invoices || []).map(normalizeInvoice),
          message: 'Portal password created successfully.',
        });
      }

      case 'getClientPortalData': {
        const queryTerm = (payload.clientId || payload.id || payload.email || '').toString().trim();
        if (!queryTerm) {
          return NextResponse.json({ success: false, status: 'error', error: 'Missing client identifier or email.' }, { status: 400 });
        }

        let clientQuery = supabase.from('clients').select('*');
        if (queryTerm.includes('@')) {
          clientQuery = clientQuery.ilike('email', queryTerm);
        } else {
          clientQuery = clientQuery.eq('client_id', queryTerm);
        }

        const { data: client, error: clientError } = await clientQuery.maybeSingle();

        if (clientError) {
          return NextResponse.json({ success: false, status: 'error', error: clientError.message }, { status: 400 });
        }
        if (!client) {
          return NextResponse.json({ success: false, status: 'not_found', message: 'Client profile not found.' }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          status: 'success',
          client: normalizeClient(client),
        });
      }

      case 'registerClient':
      case 'createClient': {
        const clientId = payload.clientId || ('FI-CLIENT-' + Math.floor(1000 + Math.random() * 9000));
        const email = (payload.email || '').trim().toLowerCase();
        const now = new Date().toISOString();

        const row = {
          client_id: clientId,
          full_name: payload.fullName || payload.name || 'FIFS Agent',
          email: email,
          phone: payload.phone || '',
          permit_state: payload.permitState || 'Maryland Wear & Carry',
          expiration_date: payload.expirationDate || null,
          created_at: now,
          updated_at: now,
        };

        const { data, error } = await supabase
          .from('clients')
          .upsert(row, { onConflict: 'email' })
          .select()
          .single();

        if (error) {
          console.error('Supabase registerClient error:', error);
          return NextResponse.json({ success: false, status: 'error', error: error.message }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          status: 'success',
          clientId: data.client_id || clientId,
          client: normalizeClient(data),
        });
      }

      case 'updateStudentTask': {
        const studentId = payload.studentId || payload.student_id;
        const taskKey = payload.taskId || payload.taskKey;
        const isDone = Boolean(payload.completed !== undefined ? payload.completed : payload.isDone);

        if (!studentId) {
          return NextResponse.json({ success: false, status: 'error', error: 'Missing studentId.' }, { status: 400 });
        }

        // Get current tasks
        const { data: currentStudent, error: fetchErr } = await supabase
          .from('students')
          .select('prep_tasks')
          .eq('student_id', studentId)
          .single();

        if (fetchErr) {
          return NextResponse.json({ success: false, status: 'error', error: fetchErr.message }, { status: 400 });
        }

        const existingTasks = (currentStudent && typeof currentStudent.prep_tasks === 'object' && currentStudent.prep_tasks !== null)
          ? currentStudent.prep_tasks
          : {};

        if (taskKey) {
          existingTasks[taskKey] = isDone;
        } else if (payload.tasks && typeof payload.tasks === 'object') {
          Object.assign(existingTasks, payload.tasks);
        }

        const { data: updated, error: updateErr } = await supabase
          .from('students')
          .update({
            prep_tasks: existingTasks,
            updated_at: new Date().toISOString(),
          })
          .eq('student_id', studentId)
          .select()
          .single();

        if (updateErr) {
          return NextResponse.json({ success: false, status: 'error', error: updateErr.message }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          status: 'success',
          studentId,
          prepTasks: existingTasks,
          student: normalizeStudent(updated),
        });
      }

      case 'submitStudentWaiver': {
        const studentId = payload.studentId || payload.student_id;
        if (!studentId) {
          return NextResponse.json({ success: false, status: 'error', error: 'Missing studentId.' }, { status: 400 });
        }

        const { data, error } = await supabase
          .from('students')
          .update({
            waiver_completed: true,
            updated_at: new Date().toISOString(),
          })
          .eq('student_id', studentId)
          .select()
          .single();

        if (error) {
          return NextResponse.json({ success: false, status: 'error', error: error.message }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          status: 'success',
          message: 'Liability waiver submitted and confirmed.',
          student: normalizeStudent(data),
        });
      }

      case 'handleLiveChatMessage': {
        const now = new Date().toISOString();
        const senderName = payload.name || payload.senderName || payload.fullName || 'Anonymous Visitor';
        const senderPhone = payload.phone || payload.senderPhone || '';
        const senderEmail = payload.email || payload.senderEmail || '';
        const messageText = payload.message || payload.text || '';
        const studentId = payload.studentId || payload.student_id || null;
        const cleanPhone = (senderPhone || '').replace(/\D/g, '');
        const computedThreadId = payload.thread_id || payload.threadId || (cleanPhone ? 'thread_' + cleanPhone : (studentId ? 'thread_' + studentId : 'thread_' + Date.now()));

        const { data, error } = await supabase
          .from('messages')
          .insert({
            name: senderName,
            sender_name: senderName,
            phone: senderPhone,
            sender_phone: senderPhone,
            email: senderEmail,
            message: messageText,
            urgency: payload.urgency || 'NORMAL',
            sender: 'student',
            student_id: studentId,
            thread_id: computedThreadId,
            sent_at: now,
          })
          .select()
          .single();

        if (error) {
          console.error('Supabase live chat error:', error);
          return NextResponse.json({ success: false, status: 'error', error: error.message }, { status: 400 });
        }

        // Dispatch audible Discord push alert with @everyone
        sendDiscordChatAlert({
          name: senderName,
          phone: senderPhone,
          email: senderEmail,
          message: messageText,
          sessionId: computedThreadId,
        }).catch(console.error);

        return NextResponse.json({
          success: true,
          status: 'success',
          messageId: data.id,
          threadId: computedThreadId,
          message: 'Message delivered to instructor hub.',
          data,
        });
      }

      case 'handleLeadMagnetSubmission':
      case 'leadMagnet': {
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from('leads')
          .insert({
            full_name: payload.fullName || payload.name || 'Reciprocity Lead',
            email: payload.email || '',
            source: payload.source || payload.guide || 'State Reciprocity Guide',
            captured_at: now,
          })
          .select()
          .single();

        if (error) {
          console.error('Supabase leadMagnet error:', error);
          return NextResponse.json({ success: false, status: 'error', error: error.message }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          status: 'success',
          leadId: data.id,
          message: 'Guide dispatched to your email.',
        });
      }

      case 'handleSmsAlertSubmit':
      case 'smsAlert': {
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from('sms_alerts')
          .insert({
            phone: payload.phone || '',
            carrier: payload.carrier || 'Unknown',
            milestones: payload.milestones || payload.options || '30_60_90_RENEWAL',
            status: 'ACTIVE',
            registered_at: now,
          })
          .select()
          .single();

        if (error) {
          console.error('Supabase sms_alerts error:', error);
          return NextResponse.json({ success: false, status: 'error', error: error.message }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          status: 'success',
          alertId: data.id,
          message: 'SMS milestone alerts activated.',
        });
      }

      case 'submitBooking': {
        const generatedStudentId = 'FIFS-' + Math.floor(1000 + Math.random() * 9000);
        const invoiceId = 'INV-' + Math.floor(10000 + Math.random() * 90000);
        const now = new Date().toISOString();

        const defaultTasks = {
          waiverSigned: false,
          gearConfirmed: false,
          rangeRulesAccepted: false,
          calendarSynced: false,
        };

        const totalAmount = Number(payload.totalAmount || 312.69);
        const depositAmount = Number(payload.depositAmount || 93.81);

        const courseVal = payload.courseSelection || payload.course || payload.courseName || payload.course_name || 'Maryland Wear & Carry Permit';
        const bookingPassword = (payload.password || payload.portalPassword || '').toString().trim();
        const bookingPayload: Record<string, any> = {
          student_id: generatedStudentId,
          full_name: payload.fullName || payload.name || 'New Enrollee',
          email: payload.email || '',
          phone: payload.phone || '',
          course_name: courseVal,
          course_selection: courseVal,
          preferred_dates: payload.dates || payload.preferredDates || 'Upcoming Range Cohort',
          group_size: Number(payload.groupSize || 1),
          comments: payload.comments || '',
          status: 'STEP_1_REGISTERED',
          prep_tasks: defaultTasks,
          waiver_completed: false,
          portal_password: bookingPassword || null,
          created_at: now,
          updated_at: now,
        };

        let { data: student, error: studentError } = await supabase
          .from('students')
          .insert(bookingPayload)
          .select()
          .single();

        if (studentError && (studentError.message.includes('portal_password') || studentError.message.includes('schema cache'))) {
          delete bookingPayload.portal_password;
          const retry = await supabase.from('students').insert(bookingPayload).select().single();
          student = retry.data;
          studentError = retry.error;
        }

        if (studentError) {
          console.error('Error creating student on booking:', studentError);
          return NextResponse.json({ success: false, status: 'error', error: studentError.message }, { status: 400 });
        }

        // Auto-sync booking event to Google Calendar
        syncBookingToGoogleCalendar({
          fullName: payload.fullName || payload.name || 'New Enrollee',
          studentId: generatedStudentId,
          course: courseVal,
          phone: payload.phone || '',
          email: payload.email || '',
          dates: payload.dates || payload.preferredDates || 'Upcoming Range Cohort',
          comments: payload.comments || '',
        });

        const { data: invoice } = await supabase
          .from('invoices')
          .insert({
            invoice_id: invoiceId,
            student_id: generatedStudentId,
            course: payload.course || 'Maryland Wear & Carry Permit',
            total_amount: totalAmount,
            amount_paid: 0.0,
            balance_due: totalAmount,
            status: 'PENDING_DEPOSIT',
            facility: 'Main Training Facility',
            payment_method: 'Stripe Checkout',
          })
          .select()
          .single();

        let checkoutUrl = (courseVal.toLowerCase().includes('vip') || (payload.tier && payload.tier === 'vip'))
          ? 'https://buy.stripe.com/7sI00u5cvb9BcwM9AB'
          : 'https://buy.stripe.com/dR67sWfR72D520ocMN';

        if (process.env.STRIPE_SECRET_KEY) {
          try {
            const StripeLib = (await import('stripe')).default;
            const stripe = new StripeLib(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' as any });
            const origin = req.headers.get('origin') || req.headers.get('referer') || 'https://trainwithfifs.com';
            const baseUrl = origin.replace(/\/+$/, '');
            const unitAmount = Math.round(depositAmount > 0 ? depositAmount * 100 : totalAmount * 100);
            const session = await stripe.checkout.sessions.create({
              payment_method_types: ['card'],
              mode: 'payment',
              customer_email: payload.email && payload.email.includes('@') ? payload.email : undefined,
              client_reference_id: generatedStudentId,
              metadata: {
                invoiceId,
                studentId: generatedStudentId,
                fullName: payload.fullName || payload.name || '',
                phone: payload.phone || '',
                courseSelection: courseVal,
                preferredDates: payload.dates || payload.preferredDates || '',
              },
              line_items: [
                {
                  price_data: {
                    currency: 'usd',
                    unit_amount: unitAmount,
                    product_data: {
                      name: courseVal,
                      description: `Invoice ${invoiceId} • Student: ${payload.fullName || 'Student'}`,
                    },
                  },
                  quantity: 1,
                },
              ],
              success_url: `${baseUrl}/?session_id={CHECKOUT_SESSION_ID}&booking_confirmed=true&invoice=${encodeURIComponent(invoiceId)}`,
              cancel_url: `${baseUrl}/?booking_cancelled=true&invoice=${encodeURIComponent(invoiceId)}`,
            });
            if (session.url) {
              checkoutUrl = session.url;
            }
          } catch (stripeErr: any) {
            console.warn('Stripe checkout session creation fallback to payment link:', stripeErr?.message);
          }
        }

        return NextResponse.json({
          success: true,
          status: 'success',
          studentId: generatedStudentId,
          invoiceId: invoiceId,
          checkoutUrl: checkoutUrl,
          student: normalizeStudent(student),
          invoice: normalizeInvoice(invoice),
        });
      }

      case 'updateStudentStatus': {
        const studentId = payload.studentId || payload.student_id;
        const newStatus = payload.status;
        if (!studentId || !newStatus) {
          return NextResponse.json({ success: false, status: 'error', error: 'Missing studentId or status.' }, { status: 400 });
        }

        const { data, error } = await supabase
          .from('students')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('student_id', studentId)
          .select()
          .single();

        if (error) {
          return NextResponse.json({ success: false, status: 'error', error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, status: 'success', student: normalizeStudent(data) });
      }

      case 'getLiveChats':
      case 'getVisitorChatMessages': {
        const threadId = payload.threadId || payload.thread_id;
        let query = supabase.from('messages').select('*').order('sent_at', { ascending: true });
        if (threadId) {
          query = query.eq('thread_id', threadId);
        } else if (payload.phone) {
          const clean = payload.phone.replace(/\D/g, '');
          if (clean) {
            query = query.or('phone.ilike.%' + clean + '%,sender_phone.ilike.%' + clean + '%');
          }
        }
        const { data, error } = await query.limit(100);
        if (error) return NextResponse.json({ success: false, status: 'error', error: error.message }, { status: 400 });

        const rawData = data || [];
        const messages = rawData.map(m => ({
          id: m.id,
          sender: (m.sender === 'admin' || m.sender === 'instructor') ? 'instructor' : 'user',
          senderName: m.sender_name || m.name || ((m.sender === 'admin' || m.sender === 'instructor') ? 'Coach Kai Wade' : 'Student'),
          text: m.message || m.body || '',
          sent_at: m.sent_at,
          time: m.sent_at ? new Date(m.sent_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''
        }));
        const groupedThreads = groupMessagesIntoThreads(rawData);
        return NextResponse.json({
          success: true,
          status: 'success',
          messages,
          threads: groupedThreads,
          liveChats: groupedThreads
        });
      }

      case 'deleteLiveChatThread': {
        if (!verifyAdminPasscode(passcode)) {
          return NextResponse.json({ success: false, status: 'error', error: 'Invalid admin passcode.' }, { status: 401 });
        }
        const threadId = payload.threadId || payload.id || payload.thread_id;
        if (threadId) {
          const cleanPhone = threadId.replace('thread_', '').replace(/\D/g, '');
          if (cleanPhone) {
            await supabase.from('messages').delete().or('thread_id.eq.' + threadId + ',phone.ilike.%' + cleanPhone + '%,sender_phone.ilike.%' + cleanPhone + '%');
          } else {
            await supabase.from('messages').delete().eq('thread_id', threadId);
          }
        }
        return NextResponse.json({ success: true, status: 'success', message: 'Thread cleared.' });
      }

      case 'logAnalytics':
      case 'resetTelemetry': {
        return NextResponse.json({ success: true, status: 'success' });
      }

      default:
        return NextResponse.json({
          success: false,
          status: 'error',
          error: `Unhandled action: "${action}"`,
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Unhandled exception in /api/fifs route:', error);
    return NextResponse.json({
      success: false,
      status: 'error',
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}
