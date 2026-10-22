import type { Metadata } from 'next';
import '../../permits/permits.css';
import { CONTACT, CRISIS, HELP, REPORTING } from '../../emergency/content';

export const metadata: Metadata = { title: 'Emergency information | Train With FIFS', description: 'Emergency numbers, 988, Maryland reporting duties and official help links from Train With FIFS.', alternates: { canonical: '/emergency' } };

export default function EmergencyPage() {
  return (
    <main className="pc-main" id="pc-main">
      <section className="pc-hero" aria-labelledby="em-title">
        <p className="pc-eyebrow">Train With FIFS</p>
        <h1 id="em-title">Emergency information</h1>
        <p className="pc-lead">If someone is in immediate danger, call 911 now. Everything else on this page is for information.</p>
      </section>

      <section className="pc-block" aria-labelledby="em-crisis">
        <h2 id="em-crisis"><span aria-hidden="true">🆘 </span>Get help now</h2>
        <ul className="pc-facts">
          {CRISIS.map((c) => <li key={c.title} className="pc-fact"><h3>{c.title}</h3><p>{c.text}</p></li>)}
        </ul>
        <p className="pc-cta-row"><a className="pc-btn" href="tel:911">Call 911</a><a className="pc-btn pc-btn-ghost" href="tel:988">Call 988</a></p>
      </section>

      <section className="pc-block" aria-labelledby="em-report">
        <h2 id="em-report"><span aria-hidden="true">📝 </span>Reporting a lost or stolen firearm</h2>
        {REPORTING.map((r) => (
          <div key={r.title} className="pc-card">
            <h3>{r.title}</h3>
            <p>{r.text}</p>
            <p className="pc-src"><a href={r.source.url} target="_blank" rel="noopener noreferrer">{r.source.label} ↗</a> · <span>Checked {r.checked}</span></p>
          </div>
        ))}
      </section>

      <section className="pc-block" aria-labelledby="em-help">
        <h2 id="em-help"><span aria-hidden="true">🤝 </span>Help and official resources</h2>
        <ul className="pc-links">
          {HELP.map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer">{l.label} ↗</a> <span className="pc-src">Checked {l.checked}</span></li>)}
        </ul>
      </section>

      <section className="pc-block" aria-labelledby="em-contact">
        <h2 id="em-contact"><span aria-hidden="true">📞 </span>Questions for your instructor</h2>
        <p>{CONTACT.label}: <a href={`tel:+1${CONTACT.phone.replace(/-/g, '')}`}>{CONTACT.phone}</a></p>
      </section>
      <p className="pc-back"><a href="/">← Back to the home page</a></p>
    </main>
  );
}
