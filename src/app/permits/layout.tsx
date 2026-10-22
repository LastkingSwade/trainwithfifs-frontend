import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '../../permits/permits.css';
import { PermitFooter, PermitHeader } from '../../permits/PermitChrome';

export const metadata: Metadata = {
  title: 'Permit Center | Train With FIFS',
  description: 'Maryland Wear & Carry permit and HQL guide from the Maryland State Police pages, plus out-of-state permit guides as they are reviewed. Training with Lead Instructor Kai Wade.',
  alternates: { canonical: '/permits' },
};
export default function PermitsLayout({ children }: { children: ReactNode }) {
  return (<div className="pc-shell"><a className="pc-skip" href="#pc-main">Skip to content</a><PermitHeader /><main id="pc-main" className="pc-main">{children}</main><PermitFooter /></div>);
}
