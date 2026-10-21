import { NextRequest, NextResponse } from 'next/server';
import { getPrivilegedClient } from '@/Lib/server/supabase-admin';
import { sendClassReminders } from '@/Lib/server/push';
import { sendChatNudges } from '@/Lib/server/portal-chat';
import { timingSafeEqual } from 'crypto';

// Daily job (Vercel Cron, `Authorization: Bearer <CRON_SECRET>`): a short notification to students who turned notifications on and whose class is tomorrow or today, and a generic nudge for unread portal chat messages.
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
    const sb = getPrivilegedClient();
    const r = await sendClassReminders(sb);
    // Chat: one generic nudge for unread instructor messages, and removal of messages older than 12 months. Never throws the reminder run.
    const chat = await sendChatNudges(sb).catch(() => ({ nudged: 0, purged: false }));
    return NextResponse.json({ success: true, tomorrow: r.tomorrow.sent, today: r.today.sent, chatNudges: chat.nudged, chatPurged: chat.purged });
  } catch (err: any) {
    console.warn('[Cron] push reminders:', err?.message);
    return NextResponse.json({ success: false, error: 'Reminder run failed' }, { status: 500 });
  }
}
