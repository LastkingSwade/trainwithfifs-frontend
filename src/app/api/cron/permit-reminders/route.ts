import { NextRequest, NextResponse } from 'next/server';
import { getPrivilegedClient } from '@/Lib/server/supabase-admin';
import { sendOnlineEmail } from '@/Lib/server/online-email';
import { REMINDER_DAYS, addDays, buildPermitReminder } from '@/Lib/server/permit-email';
import { sendDocumentExpiryPushes, sendPermitPushes } from '@/Lib/server/push';
import { timingSafeEqual } from 'crypto';

// Daily job (Vercel Cron, `Authorization: Bearer <CRON_SECRET>`): emails opted-in clients exactly 120, 90, 30 and 7 days before the permit
// expiration date they entered, and sends a generic push for wallet documents about to expire. No record is stored: a client matches each reminder date on one day only, so nobody gets the same one twice.
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
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    let sent = 0; const pushIds = new Map<number, string[]>(); // who is due a notification today (it goes out only to people who turned notifications on)
    for (const n of REMINDER_DAYS) {
      const day = addDays(today, n);
      const { data, error } = await supabase.from('clients').select('email, full_name, expiration_date, user_id').eq('expiration_date', day).eq('opt_in_reminder', true);
      if (error || !Array.isArray(data)) { console.warn('[Cron] permit reminders lookup failed:', error?.code || 'no code'); continue; }
      const due = data.map((c: any) => String(c.user_id || '')).filter(Boolean); if (due.length) pushIds.set(n, due);
      for (const c of data) {
        const email = String(c.email || '').trim();
        if (!email) continue;
        if (await sendOnlineEmail(email, buildPermitReminder({ name: c.full_name, expiresOn: day, daysLeft: n }))) sent += 1;
      }
    }
    let pushed = 0; try { pushed = (await sendPermitPushes(supabase, pushIds)).sent; } catch { /* the emails above already went out */ }
    // Wallet documents with an expiry date entered by their owner: a generic push 90, 30 and 7 days ahead (not twice on a day the permit reminder already went out).
    let docPushed = 0; try { docPushed = (await sendDocumentExpiryPushes(supabase, new Date(), pushIds)).sent; } catch { /* optional */ }
    return NextResponse.json({ success: true, sent, pushed, docPushed });
  } catch (err: any) {
    console.warn('[Cron] permit reminders:', err?.message);
    return NextResponse.json({ success: false, error: 'Reminder run failed' }, { status: 500 });
  }
}
