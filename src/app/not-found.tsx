import type { Metadata } from 'next';
import OffPaper from '../secrets/OffPaper';

export const metadata: Metadata = { title: 'Off paper (404) | Train With FIFS', robots: { index: false, follow: true } };

// Tier 4 secret: the not-found page is an interactive qualification target (see src/secrets/OffPaper.tsx and EASTER_EGGS.md).
export default function NotFound() {
  return <main className="offpaper-wrap"><OffPaper /></main>;
}
