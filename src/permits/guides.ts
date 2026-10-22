// The five state guides and what the public may see. A draft is never shown in production; preview builds show drafts under a clear DRAFT banner so they can be reviewed.
import type { StateGuide } from './types';
import { publishable } from './logic';
import { maryland } from './content/maryland'; import { virginia } from './content/virginia'; import { florida } from './content/florida'; import { arizona } from './content/arizona'; import { pennsylvania } from './content/pennsylvania';
export const GUIDES: readonly StateGuide[] = [maryland, virginia, florida, arizona, pennsylvania];
export const SLUGS: readonly string[] = GUIDES.map((g) => g.slug);
export const guideFor = (slug: string): StateGuide | null => GUIDES.find((g) => g.slug === slug) || null;
/** Production never shows drafts. Anything else (a preview deployment or local work) does, so they can be reviewed. */
export const draftsVisible = (env: string | undefined = process.env.VERCEL_ENV): boolean => env !== 'production';
/** What the public page shows for a guide: its full content, a "Guide in review" notice, or (for a draft in a preview) the content under a DRAFT banner. */
export type View = 'published' | 'in-review' | 'draft-preview';
/** Fail-safe: a guide marked "published" still shows as "in review" unless every fact has a check date and an official source (see publishable in logic.ts). */
export const viewFor = (g: StateGuide, showDrafts: boolean): View => (g.status === 'published' && publishable(g).ok ? 'published' : showDrafts ? 'draft-preview' : 'in-review');
