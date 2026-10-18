// Pure rules for the "keep people coming back" cards in the Student and Client portals. No storage, no tracking: everything is worked out from what the page already
// knows (the status on the student's record, the date, what the browser reports). Text here is plain, friendly and informational.
export const PHONE = '(443) 990-1304', PHONE_TEL = '+14439901304', EMAIL = 'info@trainwithfifs.com', SITE = 'https://trainwithfifs.com';
export const REVIEW_URL = 'https://share.google/7bGi1FjainNaCUYIl';
export const MAPS = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent("Cindy's Hot Shots Glen Burnie MD");

export type Which = 'student' | 'client';
export interface HelpLink { label: string; href?: string; action?: 'chat'; emoji: string; external?: boolean }
/** Ways to reach Coach Kai, in the order people reach for them. Students also get directions to the range. */
export function helpLinks(which: Which): HelpLink[] {
  const l: HelpLink[] = [
    { emoji: '📞', label: `Call ${PHONE}`, href: `tel:${PHONE_TEL}` },
    { emoji: '💬', label: 'Text Coach Kai', href: `sms:${PHONE_TEL}` },
    { emoji: '✉️', label: 'Email', href: `mailto:${EMAIL}?subject=${encodeURIComponent('Question from my portal')}` },
    { emoji: '🗨️', label: 'Chat with us here', action: 'chat' },
  ];
  if (which === 'student') l.push({ emoji: '🗺️', label: "Directions to Cindy's Hot Shots", href: MAPS, external: true });
  return l;
}

// ---- Ask for a review: only people who finished their class (students from "Certification issued" on), and clients who have signed in to the Client Portal ----
export function stepFromStatus(status: unknown): number {
  const s = String(status || '').toUpperCase();
  if (s.includes('STEP_8') || s.includes('LICENSED') || (s.includes('COMPLETED') && !s.includes('PREP'))) return 8;
  if (s.includes('STEP_7') || s.includes('MSP') || s.includes('PORTAL')) return 7;
  if (s.includes('STEP_6') || s.includes('CERTIF') || s.includes('QUALIF')) return 6;
  if (s.includes('STEP_5') || s.includes('LIVE_FIRE') || s.includes('RANGE')) return 5;
  if (s.includes('STEP_4') || s.includes('CLASSROOM')) return 4;
  if (s.includes('STEP_3') || s.includes('PREP')) return 3;
  if (s.includes('STEP_2') || s.includes('CONFIRM')) return 2;
  return 1;
}
/** Students are asked once they hold their certificate (step 6 or later); clients, who already finished a class, are always welcome to leave one. */
// (Stricter than the site's own step numbering on purpose: "live-fire qualification" means they are still at the range, so nobody is asked before they are done.)
export const wantsReview = (which: Which, status: unknown): boolean => {
  if (which === 'client') return true;
  const u = String(status || '').toUpperCase();
  return !u.includes('PREP') && (/STEP_[678]/.test(u) || u.includes('CERTIFICATE') || u.includes('CERTIFICATION') || u.includes('LICENSED') || u.includes('MSP') || u.includes('COMPLETED'));
};

// ---- Tell a friend: a friendly message the person can edit before sending. Nothing is sent from here; no names or details of the sender are added. ----
export const SHARE_TITLE = 'Firearms training with Coach Kai Wade';
export const SHARE_TEXT = 'I trained with Coach Kai Wade at Future Initiative Firearm Services and I would recommend him. Private one-on-one coaching in Maryland, no crowded classrooms, and he explains everything patiently. Have a look:';
export const shareLinks = (): { sms: string; email: string; text: string } => ({
  sms: `sms:?&body=${encodeURIComponent(SHARE_TEXT + ' ' + SITE)}`,
  email: `mailto:?subject=${encodeURIComponent(SHARE_TITLE)}&body=${encodeURIComponent(SHARE_TEXT + '\n\n' + SITE)}`,
  text: `${SHARE_TEXT} ${SITE}`,
});

// ---- Tip of the week: a new plain-language safety or know-how tip each week, so there is a small reason to open the portal ----
export const TIPS: readonly string[] = [
  'Treat every firearm as if it is loaded, every single time you pick it up.',
  'Keep the muzzle pointed in a safe direction, even when you are sure the firearm is unloaded.',
  'Keep your finger outside the trigger guard until your sights are on the target and you have decided to shoot.',
  'Know your target and what is beyond it before you ever press the trigger.',
  'Wear eye and ear protection every time you are on a range, even when you are only watching.',
  'Check your range-day gear the night before: photo ID, ammunition, eye and ear protection, closed-toe shoes.',
  'Short, regular practice beats one long session. Fifteen focused minutes builds calm, safe habits.',
  'Never mix alcohol or drugs with firearms. Not before, not during, not after.',
  'Use only the ammunition marked for your firearm. The caliber is stamped on the barrel or slide, so read it every time.',
  'Store firearms unloaded and locked, with ammunition kept separately, so no child or unauthorized person can reach them.',
  'Before you travel with a firearm, look up the rules for every state you will pass through. They are different and they change. The Reciprocity Hub is a good place to start.',
  'Clean and inspect your firearm regularly. A quick check before each range trip catches small problems early.',
  'Dress for the range: a crew-neck shirt, closed-toe shoes and a sturdy belt keep hot brass and surprises away.',
  'Electronic earmuffs let you hear range commands while still protecting your hearing.',
  'Ask questions. There is no wrong question in a firearms class, and a good instructor wants to hear them.',
  'Explaining the four safety rules to a friend is the best way to lock them in for yourself.',
  'Keep a photo of your permit card in your private Document Vault so it is never far away.',
  'Permit renewals can take the State Police up to 90 days to process, so start early and keep your reminders on.',
  'Slow is smooth. A smooth, steady trigger press matters more than speed.',
  'Focus on the front sight, not the target. A sharp front sight makes better shots.',
  'Hydrate and eat before a long class. A tired shooter is not a safe shooter.',
  'Dry practice (an unloaded firearm, with no ammunition in the room) builds smooth habits at home. Always re-check that it is unloaded first.',
  'If something feels wrong on the range, stop, keep the muzzle downrange and call for the instructor. Nobody will ever mind.',
  'Reciprocity agreements change. Check the current rules before every trip, not just the first one.',
  'Write down your permit expiration date somewhere you will see it, and let the portal count down for you.',
  'Confidence comes from repetition and good habits, not from rushing. Take your time.',
];
const ymd = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
/** ISO week (Monday start) in Eastern time, so the tip changes at the same moment for everyone. */
export function isoWeek(now: Date): { year: number; week: number } {
  const [y, m, d] = ymd(now).split('-').map(Number); const t = new Date(Date.UTC(y, m - 1, d)); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return { year: t.getUTCFullYear(), week: Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7) };
}
export function tipOfTheWeek(now: Date = new Date()): { tip: string; index: number; week: number } {
  const { year, week } = isoWeek(now); const index = (year * 52 + week) % TIPS.length; return { tip: TIPS[index], index, week };
}

// ---- Class-ready meter (students before class): worked out from the student's own record, so there is nothing to track or store ----
export interface ReadyFacts { classDate: unknown; prepTasks: unknown; balanceOwed: number | null; installed: boolean }
export interface ReadyItem { key: 'date' | 'prep' | 'payment' | 'app'; emoji: string; label: string; done: boolean; hint: string }
const PREP_KEYS = ['transport_law', 'ammo_acquired', 'eye_ear_pro', 'id_ready'] as const;
export function readiness(f: ReadyFacts): { items: ReadyItem[]; done: number; total: number } {
  const date = String(f.classDate || '').trim(); const prep = (f.prepTasks && typeof f.prepTasks === 'object' ? f.prepTasks : {}) as Record<string, unknown>;
  const items: ReadyItem[] = [
    { key: 'date', emoji: '📅', label: 'Class date locked in', done: !!date && !/to be scheduled|upcoming cohort|\btbd\b|not scheduled/i.test(date), hint: 'Message Coach Kai to pick your date.' },
    { key: 'prep', emoji: '✅', label: 'Preparation checklist finished', done: PREP_KEYS.every((k) => prep[k] === true), hint: 'Tick the four items in your preparation checklist.' },
  ];
  if (f.balanceOwed !== null) items.push({ key: 'payment', emoji: '💳', label: 'Paid in full', done: f.balanceOwed <= 0, hint: 'Pay the rest online below, or on class day.' });
  items.push({ key: 'app', emoji: '📱', label: 'App saved to your phone', done: f.installed, hint: 'Add it to your home screen for one-tap access.' });
  return { items, done: items.filter((i) => i.done).length, total: items.length };
}
/** Only before the range day: after that the meter would just be noise. */
export const showReadiness = (status: unknown): boolean => stepFromStatus(status) <= 4;
