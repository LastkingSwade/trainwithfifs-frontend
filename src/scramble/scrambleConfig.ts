// Letter scramble: when the visitor has done nothing for 10 seconds, a random handful of homepage words briefly turn into scrambled characters for
// 1 second, then restore. Touching the screen, clicking, typing or scrolling cancels it and starts the quiet period again. Home page only.
// A purely visual effect. Every timing and switch is here. It shares the off switch with Hack Detected (NEXT_PUBLIC_HACK_EFFECT=off, build-time).
export const SCRAMBLE = {
  ENABLED: process.env.NEXT_PUBLIC_HACK_EFFECT !== 'off',
  idleMs: 10 * 1000,         // how long the visitor must do nothing before the scramble plays (counted from the boot intro finishing at the earliest)
  repeatMs: 10 * 1000,       // if they keep doing nothing, the next scramble comes this long after the previous one ends
  retryMs: 3 * 1000,         // if a pop-up, form field, other page or Hack Detected is in the way, try again after this
  durationMs: 1000,          // how long the letters stay scrambled
  tickMs: 70,                // how often the scrambled letters change
  share: 0.4,                // roughly this share of the visible words is scrambled each time (always at least one)
  maxWords: 420,             // safety cap on how many words are considered
  clockMs: 500,              // how often the idle clock is checked
} as const;
