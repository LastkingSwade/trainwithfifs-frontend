import { useState } from 'react';
import { DIAGRAM_NOTICE, HANDGUN_PARTS, VIEW_H, VIEW_W, type Part, type Shape } from './armoryDiagramData';

// A generic, labelled exploded view of a handgun. Each number is a real button (keyboard and screen reader friendly). Nothing is stored or sent; the picture is drawn here.
function drawShape(s: Shape, key: string, active: boolean) {
  const cls = active ? 'ad-shape on' : 'ad-shape';
  if (s.t === 'rect') return <rect key={key} className={cls} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r ?? 0} />;
  if (s.t === 'path') return <path key={key} className={cls} d={s.d} />;
  return <line key={key} className={cls + ' ad-line'} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} />;
}

export default function ArmoryDiagram() {
  const [sel, setSel] = useState(0);
  const chosen: Part | null = HANDGUN_PARTS.find((p) => p.n === sel) || null;
  const choose = (n: number) => setSel((cur) => (cur === n ? 0 : n));
  const onKey = (n: number) => (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(n); } };

  return (
    <section className="ad" aria-labelledby="ad-title">
      <h4 id="ad-title"><span aria-hidden="true">🔍 </span>Parts view (generic handgun)</h4>
      <p className="ad-notice" role="note">⚠️ {DIAGRAM_NOTICE}</p>
      <svg className="ad-svg" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label="Exploded view of a generic handgun with numbered parts. Choose a number or a part name below to read about it.">
        {HANDGUN_PARTS.map((p) => (
          <g key={p.id} role="button" tabIndex={0} className="ad-part" aria-label={`${p.n}. ${p.name}`} aria-pressed={sel === p.n} onClick={() => choose(p.n)} onKeyDown={onKey(p.n)}>
            {p.shapes.map((s, i) => drawShape(s, p.id + i, sel === p.n))}
          </g>
        ))}
        {HANDGUN_PARTS.map((p) => (
          <g key={'b' + p.id} aria-hidden="true" className="ad-badge-wrap" pointerEvents="none">
            <circle className={sel === p.n ? 'ad-badge on' : 'ad-badge'} cx={p.anchor[0]} cy={p.anchor[1]} r="21" />
            <text className="ad-num" x={p.anchor[0]} y={p.anchor[1] + 9} textAnchor="middle">{p.n}</text>
          </g>
        ))}
      </svg>
      <div className="ad-detail" aria-live="polite">
        {chosen ? <p><strong>{chosen.n}. {chosen.name}.</strong> {chosen.note}</p> : <p>Choose a number to read what that part does.</p>}
      </div>
      <ol className="ad-list" aria-label="Parts">
        {HANDGUN_PARTS.map((p) => (
          <li key={p.id}><button type="button" className="ad-item" aria-pressed={sel === p.n} onClick={() => choose(p.n)}><span className="ad-n">{p.n}</span>{p.name}</button></li>
        ))}
      </ol>
    </section>
  );
}
