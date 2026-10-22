// Shot timer: the numbers and the rules, kept apart from the screen so they can be tested exactly. Times are milliseconds from the start beep.
export const DELAY_MIN_MS = 1000;       // the random wait before the beep: between 1 and 4 seconds (the usual range)
export const DELAY_MAX_MS = 4000;
export const MIN_GAP_MS = 90;           // two sounds closer than this are one shot (an echo or a ringing, not a second shot)
export const DEAD_AFTER_BEEP_MS = 400;  // the timer's own beep must not count as a shot
export const MAX_SHOTS = 60;
export const MAX_RUN_MS = 120000;       // a string stops by itself after two minutes
export const PAR_MIN_S = 0.5;
export const PAR_MAX_S = 60;

export interface Shot { n: number; atMs: number; splitMs: number }

/** A random wait before the beep, so the shooter cannot guess it. `rand` is injected so tests are exact. */
export function randomDelayMs(rand: () => number = Math.random, min = DELAY_MIN_MS, max = DELAY_MAX_MS): number {
  const r = Math.min(Math.max(Number(rand()) || 0, 0), 0.999999); return Math.round(min + r * (max - min));
}

/** A par time typed as seconds (like 2 or 1.75). Empty means no par time. Anything outside 0.5-60 seconds is not accepted. */
export function parseParSeconds(text: unknown): number | null {
  const t = String(text ?? '').trim(); if (!t) return null; if (!/^\d{1,2}(\.\d{1,2})?$/.test(t)) return null;
  const v = Number(t); return v >= PAR_MIN_S && v <= PAR_MAX_S ? v : null;
}

/** Sensitivity 1 (needs a very loud sound) to 10 (picks up quiet sounds) as the loudness a sound must reach, from 0 to 1. */
export function thresholdFor(sensitivity: unknown): number {
  const n = Number(sensitivity); const s = Number.isFinite(n) ? Math.min(10, Math.max(1, Math.round(n))) : 5; return Math.round((0.9 - (s - 1) * (0.8 / 9)) * 1000) / 1000;
}

/** Is this sound a shot? Loud enough, long enough after the beep, and not an echo of the last shot. */
export function isShot(level: number, threshold: number, sinceBeepMs: number, sinceLastShotMs: number | null): boolean {
  if (!(level >= threshold)) return false;
  if (sinceBeepMs < DEAD_AFTER_BEEP_MS) return false;
  if (sinceLastShotMs !== null && sinceLastShotMs < MIN_GAP_MS) return false;
  return true;
}

/** Adds a shot at `atMs` after the beep; the split is the time since the shot before (or since the beep for the first one). Never more than MAX_SHOTS, never out of order. */
export function addShot(shots: readonly Shot[], atMs: number): Shot[] {
  if (shots.length >= MAX_SHOTS || !Number.isFinite(atMs) || atMs < 0) return shots.slice();
  const prev = shots.length ? shots[shots.length - 1].atMs : 0; if (atMs < prev) return shots.slice();
  return [...shots, { n: shots.length + 1, atMs: Math.round(atMs), splitMs: Math.round(atMs - prev) }];
}

export interface Summary { count: number; firstMs: number | null; totalMs: number | null; avgSplitMs: number | null; bestSplitMs: number | null; worstSplitMs: number | null }
export function summarize(shots: readonly Shot[]): Summary {
  if (!shots.length) return { count: 0, firstMs: null, totalMs: null, avgSplitMs: null, bestSplitMs: null, worstSplitMs: null };
  const rest = shots.slice(1).map((s) => s.splitMs);
  return { count: shots.length, firstMs: shots[0].atMs, totalMs: shots[shots.length - 1].atMs,
    avgSplitMs: rest.length ? Math.round(rest.reduce((a, b) => a + b, 0) / rest.length) : null, bestSplitMs: rest.length ? Math.min(...rest) : null, worstSplitMs: rest.length ? Math.max(...rest) : null };
}

/** 1234 -> "1.23". */
export const fmt = (ms: number | null | undefined): string => (ms === null || ms === undefined || !Number.isFinite(ms) ? '-' : (ms / 1000).toFixed(2));

/** A short line the shooter can add to a journal session's notes. Numbers only; nothing about the firearm. */
export function noteLine(shots: readonly Shot[], parS: number | null): string {
  const s = summarize(shots); if (!s.count) return '';
  const bits = [`Shot timer: ${s.count} shot${s.count === 1 ? '' : 's'}`, `first ${fmt(s.firstMs)}s`, `total ${fmt(s.totalMs)}s`];
  if (s.avgSplitMs !== null) bits.push(`avg split ${fmt(s.avgSplitMs)}s`, `best split ${fmt(s.bestSplitMs)}s`);
  if (parS !== null) bits.push(`par ${parS}s`);
  return bits.join(', ') + '.';
}
