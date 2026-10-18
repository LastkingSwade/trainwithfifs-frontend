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
