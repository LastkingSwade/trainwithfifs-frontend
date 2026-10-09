// Single switchboard for the range HUD. Flip `enabled` to false to turn every effect off (the page then renders exactly as before);
// each effect below can also be disabled on its own. Values are read once when the page mounts.
export const HUD = {
  enabled: true,
  intro: true,
  ring: true,
  pistolScan: true,
  decode: true,
  cardTrace: true,
  acquire: true,
  sweep: true,
  chatPulse: true,
  parallax: true,
  retireLogoLoops: true,
} as const;

export type HudEffect = Exclude<keyof typeof HUD, 'enabled' | 'intro'>;

// sessionStorage key: the full intro plays once per browser session; later visits get the short fade.
export const SEEN_KEY = 'fifs_hud_seen';

// The photo's native size. All HUD geometry is drawn in these coordinates and scaled to wherever the photo actually sits.
export const PHOTO = { width: 893, height: 1600 } as const;

// Hand-placed beats (ms from intro start). The CSS delays in hud.css and these values describe the same sequence;
// the CSS side carries the drawing, this side carries what needs script (text decode, control acquisition, hand-off).
export const BEATS = {
  decodeStart: 1300,
  introEnd: 2900,
  // Word-by-word lock times for the motto (uneven on purpose).
  decodeLocks: [520, 700, 780, 1010, 1190, 1260, 1500],
  // Which control the bracket acquires, and when.
  acquireOrder: [
    ['wrap-neon-guide', 1700],
    ['btn-hero-booking', 1790],
    ['btn-hero-portal', 2020],
    ['btn-hero-about', 2090],
    ['btn-hero-targets', 2260],
    ['btn-hero-faq', 2330],
    ['btn-hero-contact', 2400],
  ] as ReadonlyArray<readonly [string, number]>,
  acquireHold: 330,
} as const;

// Gaps between scan sweeps (seconds). Hand-set so the rhythm never settles into a metronome; cycles in order.
export const SWEEP_GAPS_S = [9.4, 11.2, 8.6, 10.5, 9.1, 11.8, 8.9] as const;
