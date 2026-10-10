// Calendar file (.ics) with permit renewal reminders. Built in the browser; nothing is sent anywhere.
const pad = (n: number) => String(n).padStart(2, '0');
const day = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** "2027-05-31" or "May 31, 2027" -> a UTC date at noon (so no time zone can move the day), or null. */
export function parseExpiry(text: string): Date | null {
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(text || '').trim());
  const d = iso ? new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3], 12)) : (() => { const t = Date.parse(String(text || '')); if (!Number.isFinite(t)) return null; const x = new Date(t); return new Date(Date.UTC(x.getFullYear(), x.getMonth(), x.getDate(), 12)); })();
  return d && Number.isFinite(d.getTime()) ? d : null;
}

export function daysLeft(expiry: Date, now: Date = new Date()): number {
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  return Math.round((expiry.getTime() - today) / 86400000);
}

export type Stage = 'plenty' | 'window' | 'inside' | 'expired';
export function renewalStage(days: number): Stage { return days < 0 ? 'expired' : days < 90 ? 'inside' : days <= 120 ? 'window' : 'plenty'; }

export function buildRenewalIcs(expiry: Date, stamp: Date = new Date()): string {
  const at = (back: number) => new Date(expiry.getTime() - back * 86400000);
  const events = [
    { uid: 'renew-120', back: 120, title: 'Book your Maryland Wear & Carry renewal class', note: 'Your permit expires in 120 days. State Police processing can take up to 90 days, so book your 8-hour renewal class now. Train With FIFS: https://trainwithfifs.com' },
    { uid: 'renew-90', back: 90, title: 'Apply for your permit renewal now', note: 'Your permit expires in 90 days and processing can take that long. Your renewal application should be in now. Check the official MSP page for the current steps.' },
    { uid: 'expires', back: 0, title: 'Maryland Wear & Carry permit expires today', note: 'Check the official MSP page if you have not renewed.' },
  ];
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Train With FIFS//Permit reminders//EN', 'CALSCALE:GREGORIAN'];
  for (const e of events) {
    const d = at(e.back); const next = new Date(d.getTime() + 86400000);
    lines.push('BEGIN:VEVENT', `UID:${e.uid}-${day(expiry)}@trainwithfifs.com`, `DTSTAMP:${day(stamp)}T120000Z`, `DTSTART;VALUE=DATE:${day(d)}`, `DTEND;VALUE=DATE:${day(next)}`, `SUMMARY:${esc(e.title)}`, `DESCRIPTION:${esc(e.note)}`, 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
