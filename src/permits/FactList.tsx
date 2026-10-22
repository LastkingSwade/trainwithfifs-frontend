import { isGap, type Field, type Fact } from './types';
import { checkedOn } from './logic';

function FactItem({ f }: { f: Fact }) {
  return (
    <li className="pc-fact">
      <p>{f.text}</p>
      {f.caution && <p className="pc-caution"><span aria-hidden="true">⚠️ </span>{f.caution}</p>}
      <p className="pc-src"><a href={f.source.url} target="_blank" rel="noopener noreferrer">{f.source.label} ↗</a> · <span>{checkedOn(f)}</span></p>
    </li>
  );
}
/** A guide section: the checked facts, or a plain "not available" note. Nothing is guessed. */
export default function FactList({ title, field, emoji }: { title: string; field: Field; emoji: string }) {
  return (
    <section className="pc-card" aria-labelledby={'h-' + title.replace(/\W+/g, '-').toLowerCase()}>
      <h3 id={'h-' + title.replace(/\W+/g, '-').toLowerCase()}><span aria-hidden="true">{emoji} </span>{title}</h3>
      {isGap(field) ? <p className="pc-gap">Not available yet. {field.unavailable}</p> : <ul className="pc-facts">{field.map((f, i) => <FactItem key={i} f={f} />)}</ul>}
    </section>
  );
}
export { FactItem };
