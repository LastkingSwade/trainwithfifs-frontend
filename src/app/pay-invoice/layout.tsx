import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// A private page reached only from the emailed invoice link: never listed in search results.
export const metadata: Metadata = { title: 'Pay your invoice | Train With FIFS', robots: { index: false, follow: false } };
export default function PayInvoiceLayout({ children }: { children: ReactNode }) { return children; }
