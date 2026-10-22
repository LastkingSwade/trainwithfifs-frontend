// Pure helpers for the Permit Center pages (no browser needed, so they can be tested).
import { COURSE_PRICING } from '../Lib/pricing';
import { isGap, type Field, type Fact, type Recommendation, type StateGuide } from './types';
import { prettyDay } from '../portal/rangeLogic';

export const SITE = 'https://trainwithfifs.com';
export const COURSE_LABEL: Record<Recommendation['course'], string> = { ccw: 'Maryland Wear & Carry (16-hour class)', combo: 'Maryland CCW & HQL Combo', renewal: 'Maryland Wear & Carry 8-hour renewal', hql: 'Maryland HQL (4-hour class)', mastery: 'Mid-Atlantic Multi-State Mastery' };
/** The standard price for a recommended class, read from the same table the checkout uses so it cannot drift. */
export const priceFor = (c: Recommendation['course']): string => '$' + COURSE_PRICING[c].base.toFixed(2);
export const checkedOn = (f: { verifiedOn?: string | null }): string => (f.verifiedOn ? 'Checked ' + prettyDay(f.verifiedOn) : 'Not yet reviewed');

/** Official sources only: government websites over https. Anything else is not allowed in a guide. */
export function isOfficialUrl(u: string): boolean {
  try { const x = new URL(u); return x.protocol === 'https:' && /(^|\.)(gov)$/.test(x.hostname); } catch { return false; }
}
const factsOf = (f: Field): Fact[] => (isGap(f) ? [] : f);
/** Every fact in a guide, in one list (for checks). */
export function allFacts(g: StateGuide): Fact[] {
  return [g.permit, g.authority, ...factsOf(g.residency), ...factsOf(g.eligibility), ...factsOf(g.training), ...factsOf(g.steps), ...factsOf(g.fees), ...factsOf(g.processing), ...(g.related || []).flatMap((r) => r.facts)];
}
/** A guide may be published only when every fact has a check date and an official source, and every link is official. */
export function publishable(g: StateGuide): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  for (const f of allFacts(g)) { if (!f.verifiedOn || !/^\d{4}-\d{2}-\d{2}$/.test(f.verifiedOn)) problems.push('no check date: ' + f.text.slice(0, 40)); if (!isOfficialUrl(f.source.url)) problems.push('not an official source: ' + f.source.url); }
  for (const l of g.links) if (!isOfficialUrl(l.url)) problems.push('not an official link: ' + l.url);
  if (g.reciprocity.status === 'verified' && (!g.reciprocity.source || !g.reciprocity.verifiedOn || !isOfficialUrl(g.reciprocity.source.url))) problems.push('reciprocity claim without an official source and date');
  return { ok: problems.length === 0, problems };
}
/** Words a guide must never use: recognition of a permit is not permission to carry anywhere. */
export const BANNED_PHRASES: readonly RegExp[] = [/\blegal to carry\b/i, /\ballowed to carry\b/i, /\bcan legally carry\b/i, /\bnationwide\b/i, /\bguarantee/i, /\bno questions asked\b/i];
