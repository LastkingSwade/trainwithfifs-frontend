import type { ReactNode } from 'react';

// Shared NOIR surfaces. Presentation only: they never read data, call the server or handle sensitive content.
export function NoirPanel({ children, raised = false, className = '' }: { children: ReactNode; raised?: boolean; className?: string }) {
  return <section className={`noir-panel${raised ? ' noir-panel--raised' : ''} ${className}`.trim()}>{children}</section>;
}
export function NoirSectionHeading({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead?: string }) {
  return (
    <header>
      {eyebrow && <p className="noir-eyebrow">{eyebrow}</p>}
      <h2 className="noir-title">{title}</h2>
      {lead && <p className="noir-lead">{lead}</p>}
    </header>
  );
}
