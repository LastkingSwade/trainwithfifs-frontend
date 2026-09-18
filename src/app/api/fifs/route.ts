import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client using Service Role key
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

// Normalizes single message so both client and admin scripts can read properties
function normalizeMessage(m: any) {
  if (!m) return m;
  const isInstructor = m.sender === 'instructor' || m.sender_type === 'admin' || m.name === 'Coach Kai Wade';
  return {
    ...m,
    text: m.message || m.text || '',
    message: m.message || m.text || '',
    timestamp: m.sent_at || m.timestamp || new Date().toISOString(),
    sent_at: m.sent_at || m.timestamp || new Date().toISOString(),
    senderName: m.name || (isInstructor ? 'Coach Kai Wade' : 'Student'),
    name: m.name || (isInstructor ? 'Coach Kai Wade' : 'Student'),
    sender: isInstructor ? 'instructor' : 'student',
  };
}

// Group raw messages into inquiry threads matching TrainWithFIFS_scripts.js expectations
function groupMessagesIntoThreads(rawMessages: any[]) {
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) return [];

  const threadMap = new Map<string, any>();

  for (const rawM of rawMessages) {
    const m = normalizeMessage(rawM);
    // Thread key: prioritize phone or email, else sanitized sender name or inquiry ID
    const threadKey = (m.phone && m.phone.trim()) || 
                      (m.email && m.email.trim()) || 
                      (m.student_id && m.student_id.trim()) || 
                      (m.name && m.name !== 'Anonymous Visitor' && m.name !== 'Coach Kai Wade' ? m.name.trim() : 'inquiry-' + (m.id || 'default'));

    const senderName = (m.name && m.name !== 'Coach Kai Wade') ? m.name : 'Web Visitor';
    const senderPhone = m.phone || '(No Phone Provided)';

    const msgObj = {
      id: m.id || String(Date.now()),
      sender: m.sender,
      text: m.text,
      time: m.sent_at ? new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'NOW'
    };

    if (!threadMap.has(threadKey)) {
      threadMap.set(threadKey, {
        id: threadKey,
        senderName: senderName,
        senderPhone: senderPhone,
        unread: m.sender === 'student', // Unread only if waiting on instructor response
        messages: [msgObj]
      });
    } else {
      const existing = threadMap.get(threadKey);
      if (senderName !== 'Web Visitor' && existing.senderName === 'Web Visitor') {
        existing.senderName = senderName;
      }
      if (senderPhone !== '(No Phone Provided)' && existing.senderPhone === '(No Phone Provided)') {
        existing.senderPhone = senderPhone;
      }
      existing.messages.push(msgObj);
      // If the last message was sent by the instructor, mark as already synced/read
      if (m.sender === 'instructor') {
        existing.unread = false;
      } else {
        existing.unread = true;
      }
    }
  }

  return Array.from(threadMap.values());
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
      // -----------------------------------------------------------------------
      // 1. ADMIN DASHBOARD SYNC
      // -----------------------------------------------------------------------
      case 'getAdminDashboardData': {
        if (!verifyAdminPasscode(passcode)) {
          return NextResponse.json({ success: false, status: 'error', error: 'Invalid admin passcode.' }, { status: 401 });
        }

        const [studentsRes, clientsRes, invoicesRes, messagesRes] = await Promise.allSettled([
          supabase.from('students').select('*').order('created_at', { ascending: false }),
          supabase.from('clients').select('*').order('created_at', { ascending: false }),
          supabase.from('invoices').select('*').order('created_at', { ascending: false }),
          supabase.from('messages').select('*').order('sent_at', { ascending: true }).limit(200),
        ]);

        const rawStudents = (studentsRes.status === 'fulfilled' && studentsRes.value.data) ? studentsRes.value.data : [];
        const rawClients = (clientsRes.status === 'fulfilled' && clientsRes.value.data) ? clientsRes.value.data : [];
        const rawInvoices = (invoicesRes.status === 'fulfilled' && invoicesRes.value.data) ? invoicesRes.value.data : [];
        const rawMessages = (messagesRes.status === 'fulfilled' && messagesRes.value.data) ? messagesRes.value.data.map(normalizeMessage) : [];

        const students = rawStudents.map(normalizeStudent);
        const clients = rawClients.map(normalizeClient);
        const invoices = rawInvoices.map(normalizeInvoice);
        const threads = groupMessagesIntoThreads(rawMessages);

        const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + (parseFloat(inv.total_amount || inv.totalAmount || 0) || 0), 0);
        const outstandingBalance = invoices.reduce((sum: number, inv: any) => sum + (parseFloat(inv.balance_due || inv.balanceDue || 0) || 0), 0);

        return NextResponse.json({
          success: true,
          status: 'success',
          totalStudents: students.length,
          activeClients: clients.length,
          totalRevenue,
          outstandingBalance,
          students,
          clients,
          invoices,
          messages: rawMessages,
          liveChats: rawMessages,
          threads,
        });
      }

      // -----------------------------------------------------------------------
      // 2. LIVE CHAT INQUIRIES & REPLIES
      // -----------------------------------------------------------------------
      case 'getLiveChats':
      case 'getVisitorChatMessages': {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .order('sent_at', { ascending: true })
          .limit(200);

        if (error) {
          return NextResponse.json({ success: false, status: 'error', error: error.message }, { status: 400 });
        }

        const raw = (data || []).map(normalizeMessage);
        const threads = groupMessagesIntoThreads(raw);

        return NextResponse.json({
          success: true,
          status: 'success',
          messages: raw,
          threads: threads
        });
      }

      case 'sendAdminLiveChatReply': {
        if (!verifyAdminPasscode(passcode)) {
          return NextResponse.json({ success: false, status: 'error', error: 'Invalid admin passcode.' }, { status: 401 });
        }

        const replyData = payload.payload || payload;
        const text = replyData.message || replyData.text;
        const studentPhone = replyData.studentPhone || replyData.phone || '';
        const studentName = replyData.studentName || replyData.name || 'Student';

        if (!text) {
          return NextResponse.json({ success: false, status: 'error', error: 'Missing reply message text.' }, { status: 400 });
        }

        const { data, error } = await supabase.from('messages').insert({
          name: 'Coach Kai Wade',
          phone: studentPhone,
          message: text,
          sender: 'instructor',
          sent_at: new Date().toISOString(),
          urgency: 'NORMAL'
        }).select().single();

        if (error) {
          return NextResponse.json({ success: false, status: 'error', error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, status: 'success', reply: normalizeMessage(data) });
      }

      case 'handleLiveChatMessage': {
        const msg = (payload.message || payload.text || '').trim();
        const name = payload.name || payload.senderName || 'Anonymous Visitor';
        const phone = payload.phone || payload.senderPhone || '';
        const email = payload.email || '';

        if (!msg) {
          return NextResponse.json({ success: false, status: 'error', error: 'Empty message text.' }, { status: 400 });
        }

        // Server-side deduplication: if exact duplicate sent in last 5 seconds, return success without inserting
        const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
        const { data: recentDupes } = await supabase
          .from('messages')
          .select('id')
          .eq('message', msg)
          .gte('sent_at', fiveSecondsAgo)
          .limit(1);

        if (recentDupes && recentDupes.length > 0) {
          return NextResponse.json({ success: true, status: 'success', duplicate: true });
        }

        const { data, error } = await supabase.from('messages').insert({
          name,
          phone,
          email,
          message: msg,
          sender: 'student',
          urgency: payload.urgency || 'NORMAL',
          sent_at: new Date().toISOString()
        }).select().single();

        if (error) {
          return NextResponse.json({ success: false, status: 'error', error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, status: 'success', message: normalizeMessage(data) });
      }

      case 'deleteLiveChatThread': {
        if (!verifyAdminPasscode(passcode)) {
          return NextResponse.json({ success: false, status: 'error', error: 'Invalid admin passcode.' }, { status: 401 });
        }

        const threadId = payload.threadId || payload.id;
        if (!threadId) {
          return NextResponse.json({ success: false, status: 'error', error: 'Missing threadId.' }, { status: 400 });
        }

        // Extract identifier: if inquiry-UUID or raw UUID or phone number
        const cleanId = threadId.replace('inquiry-', '');

        // Delete any matching messages by id, phone, or name
        const { error } = await supabase
          .from('messages')
          .delete()
          .or(`id.eq.${cleanId},phone.eq.${threadId},name.eq.${threadId}`);

        if (error) {
          console.error('Delete chat thread error:', error.message);
          return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, status: 'success', message: 'Chat thread purged permanently from Supabase.' });
      }

      // -----------------------------------------------------------------------
      // 3. CLIENT REGISTRATION & PORTAL
      // -----------------------------------------------------------------------
      case 'registerClient': {
        const fullName = payload.fullName || payload.name || payload.legalName;
        const email = payload.email;
        const phone = payload.phone;
        const permitState = payload.permitState || payload.permitType || 'Maryland Wear & Carry';
        const expirationDate = payload.expirationDate || payload.expDate || '';

        if (!fullName || !email) {
          return NextResponse.json({ success: false, status: 'error', error: 'Full name and email are required to create a client profile.' }, { status: 400 });
        }

        const clientId = 'FI-CLIENT-' + Math.floor(1000 + Math.random() * 9000);

        const { data, error } = await supabase.from('clients').insert({
          client_id: clientId,
          full_name: fullName,
          email: email.trim().toLowerCase(),
          phone: phone || '',
          permit_state: permitState,
          expiration_date: expirationDate,
          created_at: new Date().toISOString()
        }).select().single();

        if (error) {
          console.error('Supabase client insert error:', error.message);
          return NextResponse.json({ success: false, status: 'error', error: error.message }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          status: 'success',
          clientId: clientId,
          client: normalizeClient(data)
        });
      }

      // -----------------------------------------------------------------------
      // 4. ADMIN CLIENT & STUDENT ACTIONS
      // -----------------------------------------------------------------------
      case 'adminEditClient': {
        if (!verifyAdminPasscode(passcode)) {
          return NextResponse.json({ success: false, status: 'error', error: 'Invalid admin passcode.' }, { status: 401 });
        }
        const clientId = payload.clientId || payload.client_id;
        const { error } = await supabase.from('clients').update({
          full_name: payload.fullName || payload.name,
          email: payload.email,
          phone: payload.phone,
          permit_state: payload.permitState,
          expiration_date: payload.expirationDate
        }).eq('client_id', clientId);

        if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        return NextResponse.json({ success: true, status: 'success' });
      }

      case 'adminDeleteClient': {
        if (!verifyAdminPasscode(passcode)) {
          return NextResponse.json({ success: false, status: 'error', error: 'Invalid admin passcode.' }, { status: 401 });
        }
        const clientId = payload.clientId || payload.client_id;
        const { error } = await supabase.from('clients').delete().eq('client_id', clientId);
        if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        return NextResponse.json({ success: true, status: 'success' });
      }

      case 'adminDeleteStudent': {
        if (!verifyAdminPasscode(passcode)) {
          return NextResponse.json({ success: false, status: 'error', error: 'Invalid admin passcode.' }, { status: 401 });
        }
        const studentId = payload.studentId || payload.student_id;
        const { error } = await supabase.from('students').delete().eq('student_id', studentId);
        if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        return NextResponse.json({ success: true, status: 'success' });
      }

      default:
        return NextResponse.json({
          success: false,
          status: 'error',
          error: `Unhandled action: "${action}"`
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Unhandled exception in /api/fifs:', error);
    return NextResponse.json({
      success: false,
      status: 'error',
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
