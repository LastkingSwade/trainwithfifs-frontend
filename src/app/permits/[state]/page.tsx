import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import InReview from '../../../permits/InReview';
import StateGuideView from '../../../permits/StateGuideView';
import { SLUGS, draftsVisible, guideFor, viewFor } from '../../../permits/guides';

// Exactly the five guides exist; any other address is a 404.
export const dynamicParams = false;
export function generateStaticParams() { return SLUGS.map((state) => ({ state })); }

type Props = { params: Promise<{ state: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params; const g = guideFor(state); if (!g) return {};
  const live = viewFor(g, draftsVisible()) === 'published';
  // Only a published guide is listed in search results; a guide in review or a draft never is.
  return live
    ? { title: `${g.headline} | Train With FIFS`, description: g.summary, alternates: { canonical: '/permits/' + g.slug } }
    : { title: `${g.name} permit guide (in review) | Train With FIFS`, robots: { index: false, follow: false } };
}
export default async function StateGuidePage({ params }: Props) {
  const { state } = await params; const g = guideFor(state); if (!g) notFound();
  const view = viewFor(g, draftsVisible());
  return view === 'in-review' ? <InReview g={g} /> : <StateGuideView g={g} view={view} />;
}
