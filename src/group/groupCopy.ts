// Group booking: plain-language copy and the share/invite builders. Pure functions (no browser access) so they can be tested directly.
// What a visitor sees is "group code"; the older name "pod code" is mentioned wherever the term first appears.
export const SITE_URL = 'https://trainwithfifs.com';
export const CONTACT_PHONE = '443-990-1304';
export const CONTACT_PHONE_HREF = 'tel:4439901304';
export const CONTACT_EMAIL = 'info@trainwithfifs.com';
export const RANGE_LOCATION = "Cindy's Hot Shots, Glen Burnie, MD";
export const CODE_PATTERN = /^FIFS-POD-[A-Z0-9]{4}$/;
export const META_KEY = 'fifs_group_invite_meta'; // course, dates and party size remembered next to the code across the Stripe redirect
export const CODE_KEY = 'fifs_pod_invite_code';   // the code itself (unchanged key)

export const GROUP_STEPS = ['Book and pay', 'Get your code', 'Share it with your party', 'Everyone joins and finishes their info'] as const;

export const WHAT_IS_A_GROUP_CODE = 'A group code (also called a pod code) is a short code that ties your party to one class. You share it with the people coming with you. Each person types it into the booking form, and their class and date fill in by themselves. They book their own seat and finish their own details.';

export const GROUP_EXPLAINER = {
  title: 'Booking for more than one person?',
  body: 'After you pay, we give you a group code (also called a pod code). Send it to everyone coming with you. Each of them types it into the booking form, picks up the same class and date, and finishes their own details.',
  steps: ['You book and pay now.', 'You get your group code right after payment.', 'You send the code to your party.', 'Each person joins with the code and finishes their own details.'],
} as const;

export const HELP_ITEMS: ReadonlyArray<{ q: string; a: string }> = [
  { q: 'I lost my code', a: `Call ${CONTACT_PHONE} or email ${CONTACT_EMAIL} from the email you booked with, and we will look it up for you.` },
  { q: 'Someone in my party cancels', a: `Their seat is only held while they are paying. If they already paid, call ${CONTACT_PHONE} and we will sort it out with you.` },
  { q: 'I need to add someone late', a: `The code works until every seat is taken. Send it to the new person. If all seats are taken, call ${CONTACT_PHONE}.` },
  { q: 'Someone typed the code and it did not work', a: 'Check it letter by letter. It looks like FIFS-POD-AB12 and it is not case sensitive. If it still fails, ask them to send you a screenshot or call us.' },
];

// "Maryland Wear & Carry (CCW) — VIP Turnkey ($279.99)" -> "Maryland Wear & Carry (CCW)"
export function cleanCourse(course: unknown): string {
  const s = String(course || '').split(' — ')[0].trim();
  return s || 'a FIFS firearms training class';
}

export interface GroupMeta { code: string; course?: string; dates?: string; size?: number }

export function buildShareMessage(meta: GroupMeta): string {
  const when = meta.dates ? ` on ${meta.dates}` : '';
  return [
    `Join me for ${cleanCourse(meta.course)}${when}.`,
    `Where: ${RANGE_LOCATION}`,
    '',
    'How to join:',
    `1. Go to ${SITE_URL} and tap Start Your Journey, then Book Now.`,
    `2. Type this group code in the Group Code box and tap Apply: ${meta.code}`,
    '3. Your class and date fill in by themselves. Finish your details and book your own seat.',
    '',
    `Questions? Call ${CONTACT_PHONE}.`,
  ].join('\n');
}
export const shareSubject = (meta: GroupMeta) => `Join me: ${cleanCourse(meta.course)} (group code ${meta.code})`;
export const mailtoHref = (meta: GroupMeta) => `mailto:?subject=${encodeURIComponent(shareSubject(meta))}&body=${encodeURIComponent(buildShareMessage(meta))}`;
export const smsHref = (meta: GroupMeta) => `sms:?&body=${encodeURIComponent(buildShareMessage(meta))}`;

export function seatsSummary(size: number | undefined, seatsLeft: number): string {
  if (size && size >= seatsLeft) return `${size - seatsLeft} of ${size} seats are taken (you count as one). ${seatsLeft} still open.`;
  return `${seatsLeft} seat${seatsLeft === 1 ? '' : 's'} still open.`;
}

// Turns the server's short messages into something a first-time organizer can act on.
export function friendlyCodeError(message: unknown): string {
  const m = String(message || '').toLowerCase();
  if (/just taken/.test(m)) return `Someone just took the last seat. Ask the person who booked, or call ${CONTACT_PHONE}.`;
  if (/not valid|not found/.test(m)) return `We could not find that group code. Check it letter by letter (it looks like FIFS-POD-AB12), or ask the person who booked to send it again.`;
  if (/full/.test(m)) return `Every seat in this group is already taken. Ask the person who booked, or call ${CONTACT_PHONE}.`;
  if (/no longer active/.test(m)) return `This group is no longer open. Call ${CONTACT_PHONE} and we will help.`;
  if (/too many/.test(m)) return 'Too many tries in a row. Please wait a few minutes and try again.';
  if (/temporarily unavailable/.test(m)) return 'Group codes are not responding right now. Please try again in a few minutes.';
  return String(message || 'That group code could not be used. Call ' + CONTACT_PHONE + ' and we will help.');
}
