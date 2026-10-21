// Pure helpers for the FIFS secrets (kept apart from the screens so they can be tested on their own). Nothing here touches the page, the network or any stored data.
export const SAFETY_RULES: readonly string[] = [
  'Treat every firearm as if it is loaded.',
  'Never point the muzzle at anything you are not willing to destroy.',
  'Keep your finger off the trigger until your sights are on the target and you have decided to shoot.',
  'Be sure of your target and what is beyond it.',
];

/** The instructor's par time for the draw-to-first-shot game, in milliseconds. */
export const PAR_MS = 1250;
/** Under this reaction time the shooter is graded a Grandmaster. */
export const GRANDMASTER_MS = 600;
export const STANDBY_MIN_MS = 1500;
export const STANDBY_MAX_MS = 3500;

export type GradeKey = 'grandmaster' | 'qualified' | 'dryfire';
export interface ShotGrade { key: GradeKey; label: string; emoji: string; note: string }
/** Grades a reaction time (beep to tap). At or under 0.60 s is a Grandmaster; at or under the 1.25 s par is Maryland Qualified; slower needs dry-fire practice. */
export function gradeShot(ms: number): ShotGrade {
  if (ms <= GRANDMASTER_MS) return { key: 'grandmaster', label: 'Grandmaster', emoji: '🏆', note: 'Faster than half the par time. The Kernel approves.' };
  if (ms <= PAR_MS) return { key: 'qualified', label: 'Maryland Qualified', emoji: '🎯', note: 'Inside the 1.25 second par time. Solid.' };
  return { key: 'dryfire', label: 'Needs Dry-Fire Practice', emoji: '🔧', note: 'Over par. Ten minutes of dry-fire a day fixes this.' };
}
export const formatSeconds = (ms: number): string => (Math.max(0, ms) / 1000).toFixed(2) + ' s';
/** A random wait of 1.5 to 3.5 seconds before the beep. `rand` is injectable so it can be tested. */
export function randomStandbyMs(rand: () => number = Math.random): number {
  const r = Math.min(0.999999, Math.max(0, rand()));
  return STANDBY_MIN_MS + Math.floor(r * (STANDBY_MAX_MS - STANDBY_MIN_MS + 1));
}

/** True when the key press is going into something the person is typing in. The secrets never listen there. */
export function isTypingTarget(el: unknown): boolean {
  const e = el as { tagName?: string; isContentEditable?: boolean; getAttribute?: (n: string) => string | null; closest?: (s: string) => unknown } | null;
  if (!e || typeof e !== 'object') return false;
  const tag = String(e.tagName || '').toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (e.isContentEditable === true) return true;
  const ce = typeof e.getAttribute === 'function' ? e.getAttribute('contenteditable') : null;
  return ce === '' || ce === 'true' || ce === 'plaintext-only';
}

/** Watches single typed letters and reports when one of the secret words was typed (within `timeoutMs` between letters). */
export function createSequenceMatcher(words: Record<string, string>, timeoutMs = 1500) {
  let buf = ''; let last = 0;
  const longest = Math.max(...Object.values(words).map((w) => w.length));
  return {
    feed(key: string, at: number): string | null {
      if (typeof key !== 'string' || key.length !== 1) { buf = ''; return null; }
      if (at - last > timeoutMs) buf = '';
      last = at; buf = (buf + key.toLowerCase()).slice(-longest);
      for (const [id, w] of Object.entries(words)) if (buf.endsWith(w)) { buf = ''; return id; }
      return null;
    },
    reset() { buf = ''; last = 0; },
  };
}

export type OpsMode = 'off' | 'green' | 'red';
/** Typing the secret word again cycles off, phosphor green, red-dot crimson, off. */
export const nextOpsMode = (m: OpsMode): OpsMode => (m === 'off' ? 'green' : m === 'green' ? 'red' : 'off');
export const OPS_LABEL: Record<OpsMode, string> = { off: 'OFF', green: 'NVG PHOSPHOR GREEN', red: 'RED-DOT CRIMSON' };

/** Counts quick repeated clicks. Returns true on the third click inside `windowMs`. */
export function createTripleClick(windowMs = 650) {
  let times: number[] = [];
  return { click(at: number): boolean { times = times.filter((t) => at - t <= windowMs); times.push(at); if (times.length >= 3) { times = []; return true; } return false; }, reset() { times = []; } };
}

// ---- The 404 target: where the shot is, whether it is on the paper, and whether it is on the center (all in the picture's own units) ----
export const TARGET = { cx: 260, cy: 205, paper: { x: 110, y: 10, w: 300, h: 390 }, step: 28, zeroRadius: 26 } as const;
export type Hole = { x: number; y: number };
export const START_HOLE: Hole = { x: 478, y: 96 };
export const onPaper = (h: Hole): boolean => h.x >= TARGET.paper.x && h.x <= TARGET.paper.x + TARGET.paper.w && h.y >= TARGET.paper.y && h.y <= TARGET.paper.y + TARGET.paper.h;
export const zeroed = (h: Hole): boolean => Math.hypot(h.x - TARGET.cx, h.y - TARGET.cy) <= TARGET.zeroRadius;
export const statusFor = (h: Hole): string => (zeroed(h) ? 'Zeroed. Dead center. Now go back and re-engage.' : onPaper(h) ? 'On paper. Keep adjusting toward the center.' : 'Shot went off-paper. Adjust your windage and elevation.');
