// "Hack Detected" homepage event: every timing and switch in one place.
// Switch it off for everyone with NEXT_PUBLIC_HACK_EFFECT=off (build-time), or set ENABLED to false here.
export const HACK = {
  ENABLED: process.env.NEXT_PUBLIC_HACK_EFFECT !== 'off',
  firstDelayMs: 60 * 1000,       // first run: this long after the boot intro finishes (time spent with the tab hidden does not count)
  intervalMs: 60 * 1000,         // then every this long after the previous run ends
  retryMs: 20 * 1000,            // if a modal, form field, other page or boot screen is in the way, try again after this
  scrambleLeadMs: 800,           // text scrambles alone for this long, then the message appears
  messageHoldMs: 3000,           // "HACK DETECTED////" stays this long, then the colour wash
  flashMs: 1100,                 // soft brand-colour wash: two slow pulses (under 2 per second)
  clearHoldMs: 1600,             // "COUNTERMEASURES EFFECTIVE//" stays this long, then everything restores
  scrambleTickMs: 70,            // how often the scrambled letters change
  maxWords: 420,                 // safety cap on how many words are redrawn
  tickMs: 1000,                  // the visible-time clock
} as const;

export const HACK_MESSAGE = 'HACK DETECTED////';
export const HACK_CLEARED = 'COUNTERMEASURES EFFECTIVE//';
export const HACK_NOTE = '// visual effect only. Nothing is wrong with this site or your data.';
export const HACK_SR_START = 'Visual effect: a short stylized terminal animation is playing. Nothing is wrong with this site or your information. Press Escape to stop it.';
export const HACK_SR_END = 'The visual effect has finished.';
export const HACK_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@$*+=<>?/';
export const HACK_DONE_EVENT = 'fifs:hack-complete';
