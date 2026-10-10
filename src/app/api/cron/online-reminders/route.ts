import { NextRequest, NextResponse } from 'next/server';
import { getPrivilegedClient } from '@/Lib/server/supabase-admin';
import { buildOnlineReminder, sendOnlineEmail } from '@/Lib/server/online-email';
import { timingSafeEqual } from 'crypto';

// Daily reminder for live-online students. Vercel Cron calls this once a day with `Authorization: Bearer <CRON_SECRET>`.
// Window: sessions starting between 12 and 36 hours from now, so each session is reminded exactly once by a daily run.
// Without a matching CRON_SECRET nothing runs. Only paid bookings are emailed.
const HOUR = 3600 * 1000;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET || '';
  const got = req.headers.get('authorization') || '';
  const want = `Bearer ${secret}`;
  return secret.length >= 16 && got.length === want.length && timingSafeEqual(Buffer.from(got), Buffer.from(want));
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const supabase = getPrivilegedClient();
    const from = new Date(Date.now() + 12 * HOUR).toISOString(), to = new Date(Date.now() + 36 * HOUR).toISOString();
    const ses = await supabase.from('class_sessions').select('id, kind, starts_at, meeting_url, course_key').eq('is_open', true).gt('starts_at', from).lte('starts_at', to);
    if (ses.error || !Array.isArray(ses.data)) return NextResponse.json({ success: true, sent: 0, note: 'no session data' });
    let sent = 0;
    for (const s of ses.data) {
      const enr = await supabase.from('session_enrollments').select('invoice_number').eq('session_id', s.id);
      const numbers = (enr.data || []).map((e: any) => String(e.invoice_number));
      if (!numbers.length) continue;
      const inv = await supabase.from('invoices').select('email, status, course').in('invoice_number', numbers).eq('delivery', 'live_online').in('status', ['PAID', 'DEPOSIT_PAID']);
      for (const r of (inv.data || [])) {
        const mail = buildOnlineReminder({ kind: s.kind, course: r.course, classroomAt: s.kind === 'classroom' ? s.starts_at : undefined, rangeAt: s.kind === 'range' ? s.starts_at : undefined, meetingUrl: s.kind === 'classroom' ? (s.meeting_url || '') : '' });
        if (await sendOnlineEmail(String(r.email || ''), mail)) sent += 1;
      }
    }
    return NextResponse.json({ success: true, sent });
  } catch (err: any) {
    console.warn('[Cron] online reminders:', err?.message);
    return NextResponse.json({ success: false, error: 'Reminder run failed' }, { status: 500 });
  }
}
