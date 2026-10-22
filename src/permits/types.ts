// The Permit Center's content model. Every fact carries the official page it came from and the date someone last checked it against that page. A guide is "published" only when every
// fact has a check date; anything else is a draft, which the public site never shows (see logic.ts). A field with no verified answer says so instead of guessing.
export type StateCode = 'MD' | 'VA' | 'FL' | 'AZ' | 'PA';
export interface Source { label: string; url: string }
export interface Fact { text: string; source: Source; verifiedOn: string | null; caution?: string }
export interface Gap { unavailable: string }
export type Field = Fact[] | Gap;
export const isGap = (f: Field): f is Gap => !Array.isArray(f);
export interface Recommendation { course: 'ccw' | 'combo' | 'renewal' | 'hql' | 'mastery'; why: string }
export interface Reciprocity { status: 'verified' | 'unverified'; line: string; source?: Source; verifiedOn?: string }
export interface StateGuide {
  code: StateCode; slug: string; name: string; status: 'published' | 'draft';
  headline: string; summary: string;
  permit: Fact; authority: Fact;
  residency: Field; eligibility: Field; training: Field; steps: Field; fees: Field; processing: Field;
  related?: { title: string; facts: Fact[] }[];
  links: Source[];
  recommendations: Recommendation[];
  reciprocity: Reciprocity;
}
