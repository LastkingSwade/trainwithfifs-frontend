import { NextRequest, NextResponse } from 'next/server';
import { getPrivilegedClient } from '@/Lib/server/supabase-admin';
import { sendClassReminders } from '@/Lib/server/push';
import { timingSafeEqual } from 'crypto';

// Daily job (Vercel Cron, `Authorization: Bearer <CRON_SECRET>`): a short notification to students who turned notifications on and whose class is tomorrow or today.
// Nothing runs without a matching CRON_SECRET, and nothing is sent outside 8am to 8pm Eastern or without the notification keys. No record is kept: it runs once a day.
function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET || '';
  const got = req.headers.get('authorization') || '';
  const want = `Bearer ${secret}`;
  return secret.length >= 16 && got.length === want.length && timingSafeEqual(Buffer.from(got), Buffer.from(want));
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const r = await sendClassReminders(getPrivilegedClient());
    return NextResponse.json({ success: true, tomorrow: r.tomorrow.sent, today: r.today.sent });
  } catch (err: any) {
    console.warn('[Cron] push reminders:', err?.message);
    return NextResponse.json({ success: false, error: 'Reminder run failed' }, { status: 500 });
  }
}
