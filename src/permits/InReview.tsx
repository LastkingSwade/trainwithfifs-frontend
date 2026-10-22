import type { StateGuide } from './types';

/** What the public sees for a guide that has not been reviewed yet: a plain notice and real next steps. No unverified content. */
export default function InReview({ g }: { g: StateGuide }) {
  return (
    <article className="pc-guide" aria-labelledby="pc-guide-title">
      <p className="pc-eyebrow">{g.name} permit guide</p>
      <h1 id="pc-guide-title">{g.name}: guide in review</h1>
      <p className="pc-lead">We are checking this guide against {g.name}&rsquo;s official sources. We will not publish application requirements until they have been checked.</p>
      <section className="pc-card" aria-labelledby="pc-next-title">
        <h2 id="pc-next-title"><span aria-hidden="true">👉 </span>In the meantime</h2>
        <ul className="pc-facts">
          <li className="pc-fact"><p>See where a Maryland permit is recognized in the Reciprocity Explorer.</p><a className="pc-btn pc-btn-ghost" href="/?open=reciprocity">Open the Reciprocity Explorer</a></li>
          <li className="pc-fact"><p>Ask Coach Kai about a {g.name} permit: call 443-990-1304, or use Chat with me in your portal.</p></li>
          <li className="pc-fact"><p>Multi-State Mastery walks you through assembling an out-of-state packet.</p><a className="pc-btn" href="/?open=classes">See classes and prices</a></li>
        </ul>
      </section>
      <p className="pc-back"><a href="/permits">← All permit guides</a></p>
    </article>
  );
}
