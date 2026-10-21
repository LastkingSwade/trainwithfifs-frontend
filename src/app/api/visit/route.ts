import { NextRequest, NextResponse, after } from 'next/server';
import { getPrivilegedClient } from '@/Lib/server/supabase-admin';
import { sendDiscordAlert } from '@/Lib/server/discord';
import { allowVisit, buildRow, discordFor, isBot, newThrottle, shouldPing } from '@/Lib/server/site-visits';
import { isStaffEndpoint } from '@/Lib/server/push';

// Called by the page once per load (a hard refresh is a new load, so it counts again). Always answers 204 and never reveals why a visit was ignored.
// Stores one anonymous row (see src/Lib/server/site-visits.ts for exactly what) and posts a throttled "someone is visiting" note to Discord.
const throttle = newThrottle();
let warnedMissingTable = false;
const done = () => new NextResponse(null, { status: 204 });

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin');
    if (origin) { try { if (new URL(origin).host !== req.headers.get('host')) return done(); } catch { return done(); } } // only our own pages
    const text = await req.text(); if (text.length > 1024) return done();
    let body: any; try { body = JSON.parse(text); } catch { return done(); }
    const ua = req.headers.get('user-agent') || ''; if (isBot(ua)) return done();
    // A staff member's own device (its push address is one of the Admin Hub alert devices): not counted, and no visitor alert.
    if (await isStaffEndpoint(getPrivilegedClient(), body && body.e)) return done();
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || '';
    const now = new Date();
    const row = buildRow({
      ua, ip, body, now, secret: process.env.VISIT_HASH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      geo: { country: req.headers.get('x-vercel-ip-country'), region: req.headers.get('x-vercel-ip-country-region'), city: req.headers.get('x-vercel-ip-city') },
    });
    if (!row || !allowVisit(row.visitor_hash || ip, now.getTime(), throttle)) return done();
    after(async () => {
      try {
        const ins = await getPrivilegedClient().from('site_visits').insert(row);
        if (ins.error && !warnedMissingTable) { warnedMissingTable = true; console.warn('[FIFS visits] Could not record a visit (has scripts/sql/20261012_site_visits.sql been run?).'); }
      } catch { /* the website must never break over a counter */ }
      if (process.env.VERCEL_ENV === 'production' && shouldPing(row.visitor_hash, now.getTime(), throttle)) {
        const d = discordFor(row); await sendDiscordAlert(d.title, d.description, d.fields, 0x00e5ff);
      }
    });
  } catch { /* ignore */ }
  return done();
}
