import FactList, { FactItem } from './FactList';
import { COURSE_LABEL, checkedOn, priceFor } from './logic';
import type { StateGuide } from './types';
import type { View } from './guides';

/** One state's guide. A draft is shown only in a preview build, under a large DRAFT banner. */
export default function StateGuideView({ g, view }: { g: StateGuide; view: Exclude<View, 'in-review'> }) {
  return (
    <article className="pc-guide" aria-labelledby="pc-guide-title">
      {view === 'draft-preview' && <p className="pc-draft" role="note"><strong>DRAFT: NOT REVIEWED.</strong> This guide is not published. The facts below have no check date and some are marked for confirmation. Visitors to the live site see only &ldquo;Guide in review.&rdquo;</p>}
      <p className="pc-eyebrow">{g.name} permit guide</p>
      <h1 id="pc-guide-title">{g.headline}</h1>
      <p className="pc-lead">{g.summary}</p>

      <section className="pc-card pc-key" aria-labelledby="pc-key-title">
        <h2 id="pc-key-title"><span aria-hidden="true">🛡️ </span>The permit</h2>
        <ul className="pc-facts"><FactItem f={g.permit} /><FactItem f={g.authority} /></ul>
      </section>
      <FactList title="Residency" field={g.residency} emoji="🏠" />
      <FactList title="Who can apply" field={g.eligibility} emoji="✅" />
      <FactList title="Training" field={g.training} emoji="🎯" />
      <FactList title="How to apply" field={g.steps} emoji="📝" />
      <FactList title="Fees" field={g.fees} emoji="💵" />
      <FactList title="Timing and renewal" field={g.processing} emoji="⏱️" />
      {(g.related || []).map((r) => <FactList key={r.title} title={r.title} field={r.facts} emoji="📘" />)}

      <section className="pc-card" aria-labelledby="pc-recip-title">
        <h2 id="pc-recip-title"><span aria-hidden="true">🗺️ </span>Travelling with a Maryland permit</h2>
        <p>{g.reciprocity.line}</p>
        <p className="pc-src">{g.reciprocity.source ? <><a href={g.reciprocity.source.url} target="_blank" rel="noopener noreferrer">{g.reciprocity.source.label} ↗</a> · </> : null}<span>{checkedOn({ verifiedOn: g.reciprocity.verifiedOn })}</span></p>
        <p className="pc-warn"><span aria-hidden="true">⚠️ </span>A state recognizing a permit is not permission to carry anywhere in it. Places, rules and conditions still apply. Check the official source before you travel armed.</p>
        <a className="pc-btn pc-btn-ghost" href="/?open=reciprocity">Open the Reciprocity Explorer</a>
      </section>

      <section className="pc-card" aria-labelledby="pc-train-title">
        <h2 id="pc-train-title"><span aria-hidden="true">🎓 </span>Train with FIFS</h2>
        <ul className="pc-recs">{g.recommendations.map((r) => <li key={r.course}><strong>{COURSE_LABEL[r.course]}</strong> <span className="pc-price">from {priceFor(r.course)}</span><br /><span>{r.why}</span></li>)}</ul>
        <a className="pc-btn" href="/?open=classes">See classes and prices</a>
      </section>

      <section className="pc-card" aria-labelledby="pc-links-title">
        <h2 id="pc-links-title"><span aria-hidden="true">🔗 </span>Official links</h2>
        <ul className="pc-links">{g.links.map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer">{l.label} ↗</a></li>)}</ul>
      </section>
      <p className="pc-back"><a href="/permits">← All permit guides</a></p>
    </article>
  );
}
