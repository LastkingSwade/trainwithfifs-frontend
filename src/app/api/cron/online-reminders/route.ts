import { NextRequest, NextResponse } from 'next/server';
import { getPrivilegedClient } from '@/Lib/server/supabase-admin';
import { buildOnlineReminder, sendOnlineEmail } from '@/Lib/server/online-email';
import { timingSafeEqual } from 'crypto';

// Daily reminder for live-online students, sent the morning before each of their days (Vercel Cron calls this once a day with
// `Authorization: Bearer <CRON_SECRET>`). Without a matching CRON_SECRET nothing runs. Only paid bookings are emailed.
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
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    const claims = await supabase.from('day_claims').select('invoice_number, role').eq('day', tomorrow);
    if (claims.error || !Array.isArray(claims.data) || !claims.data.length) return NextResponse.json({ success: true, sent: 0 });
    const link = await supabase.from('online_days').select('meeting_url').eq('day', tomorrow).maybeSingle();
    let sent = 0;
    for (const c of claims.data) {
      const inv = await supabase.from('invoices').select('email, status, course, delivery').eq('invoice_number', c.invoice_number).eq('delivery', 'live_online').in('status', ['PAID', 'DEPOSIT_PAID']).maybeSingle();
      if (!inv.data) continue;
      const kind = c.role === 'day1' ? 'classroom' : 'range';
      const mail = buildOnlineReminder({ kind, course: inv.data.course, day1: kind === 'classroom' ? tomorrow : undefined, day2: kind === 'range' ? tomorrow : undefined, meetingUrl: kind === 'classroom' ? (link.data?.meeting_url || '') : '' });
      if (await sendOnlineEmail(String(inv.data.email || ''), mail)) sent += 1;
    }
    return NextResponse.json({ success: true, sent });
  } catch (err: any) {
    console.warn('[Cron] online reminders:', err?.message);
    return NextResponse.json({ success: false, error: 'Reminder run failed' }, { status: 500 });
  }
}
