// Training badges, earned from the member's own range journal (sessions, rounds and goals reached). Nothing new is stored: a badge is earned when the numbers reach its target,
// and the page recalculates it every time the journal loads. Pure functions, so they are tested without a browser.
export interface BadgeInput { sessions: number; rounds: number; goalsDone: number }
export interface Badge { id: string; title: string; emoji: string; measure: 'sessions' | 'rounds' | 'goals'; target: number; have: number; earned: boolean }

export const BADGE_RULES: readonly { id: string; title: string; emoji: string; measure: Badge['measure']; target: number }[] = [
  { id: 'first-day', title: 'First range day', emoji: '🎯', measure: 'sessions', target: 1 },
  { id: 'five-days', title: 'Five range days', emoji: '🔥', measure: 'sessions', target: 5 },
  { id: 'ten-days', title: 'Ten range days', emoji: '🏅', measure: 'sessions', target: 10 },
  { id: 'twenty-five-days', title: 'Twenty-five range days', emoji: '🥇', measure: 'sessions', target: 25 },
  { id: 'thousand-rounds', title: '1,000 rounds logged', emoji: '🔢', measure: 'rounds', target: 1000 },
  { id: 'first-goal', title: 'First goal reached', emoji: '⭐', measure: 'goals', target: 1 },
  { id: 'three-goals', title: 'Three goals reached', emoji: '🏆', measure: 'goals', target: 3 },
];

/** Any value becomes a whole number of zero or more; text, NaN and negatives count as zero. */
const whole = (v: unknown): number => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n > 0 ? n : 0; };
export function badgesFor(i: BadgeInput): Badge[] {
  const have = (m: Badge['measure']) => whole(m === 'sessions' ? i.sessions : m === 'rounds' ? i.rounds : i.goalsDone);
  return BADGE_RULES.map((r) => { const h = have(r.measure); return { ...r, have: Math.min(h, r.target), earned: h >= r.target }; });
}
/** A short line for a badge: "Earned", or how far along it is ("3 of 5 range days"). */
export function progressText(b: Badge): string {
  if (b.earned) return 'Earned';
  const unit = b.measure === 'sessions' ? 'range days' : b.measure === 'rounds' ? 'rounds' : 'goals';
  return `${b.have.toLocaleString('en-US')} of ${b.target.toLocaleString('en-US')} ${unit}`;
}
