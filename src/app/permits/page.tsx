import type { Metadata } from 'next';
import AccountLink from '../../permits/AccountLink';
import { GUIDES, draftsVisible, viewFor } from '../../permits/guides';
import { checkedOn } from '../../permits/logic';
import { maryland } from '../../permits/content/maryland';

export const metadata: Metadata = { alternates: { canonical: '/permits' } };

export default function PermitCenter() {
  const show = draftsVisible();
  return (
    <>
      <section className="pc-hero" aria-labelledby="pc-title">
        <p className="pc-eyebrow">FIFS Permit Center</p>
        <h1 id="pc-title">Your permit, step by step</h1>
        <p className="pc-lead">Plain-English guides built from the official state pages, with the date each fact was checked. Start with Maryland, then see where your permit travels.</p>
        <div className="pc-cta-row"><a className="pc-btn" href="/permits/maryland">Maryland permit guide</a><a className="pc-btn pc-btn-ghost" href="/?open=reciprocity">Reciprocity Explorer</a></div>
      </section>

      <section className="pc-block" aria-labelledby="pc-states-title">
        <h2 id="pc-states-title"><span aria-hidden="true">📍 </span>Choose a state</h2>
        <nav aria-label="State guides"><ul className="pc-states">
          {GUIDES.map((g) => { const v = viewFor(g, show); return (
            <li key={g.slug}><a className="pc-state" href={'/permits/' + g.slug}>
              <span className="pc-state-code" aria-hidden="true">{g.code}</span>
              <span className="pc-state-body"><strong>{g.name}</strong><span>{v === 'published' ? 'Guide ready' : v === 'draft-preview' ? 'Draft (preview only)' : 'Guide in review'}</span></span>
              <span aria-hidden="true">→</span>
            </a></li>); })}
        </ul></nav>
      </section>

      <section className="pc-block" aria-labelledby="pc-how-title">
        <h2 id="pc-how-title"><span aria-hidden="true">📝 </span>How a Maryland permit application works</h2>
        <ol className="pc-steps">{(maryland.steps as { text: string }[]).slice(0, 4).map((s, i) => <li key={i}>{s.text.replace(/^\d\.\s*/, '')}</li>)}</ol>
        <p className="pc-src">Source: <a href={maryland.links[0].url} target="_blank" rel="noopener noreferrer">{maryland.links[0].label} ↗</a> · <span>{checkedOn(maryland.permit)}</span></p>
        <p className="pc-warn"><span aria-hidden="true">⚠️ </span>Applying is not the same as being approved. Do not carry until you have the permit in hand.</p>
      </section>

      <section className="pc-grid" aria-label="More tools">
        <div className="pc-card"><h2><span aria-hidden="true">🗺️ </span>Reciprocity Explorer</h2><p>See which states recognize a Maryland permit, with sources and what to check before you travel. Recognition is never permission to carry anywhere.</p><a className="pc-btn pc-btn-ghost" href="/?open=reciprocity">Open the Explorer</a></div>
        <div className="pc-card"><h2><span aria-hidden="true">⏱️ </span>Renewal Center</h2><p>When to start your renewal and what the class involves. Your own dates and documents stay private in your portal Vault.</p><a className="pc-btn pc-btn-ghost" href="/?open=renewal">Open the Renewal Center</a></div>
        <div className="pc-card"><h2><span aria-hidden="true">🎓 </span>Train with FIFS</h2><p>The 16-hour Wear &amp; Carry class, the 8-hour renewal, the HQL class and Multi-State Mastery, with Lead Instructor Kai Wade.</p><a className="pc-btn" href="/?open=classes">See classes and prices</a></div>
        <div className="pc-card"><h2><span aria-hidden="true">👤 </span>My FIFS</h2><p>Sign in to your student or client portal: your documents, reminders and class details.</p><AccountLink className="pc-btn pc-btn-ghost">Go to my portal</AccountLink></div>
      </section>
    </>
  );
}
