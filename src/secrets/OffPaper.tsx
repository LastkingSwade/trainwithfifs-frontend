'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { START_HOLE, TARGET, onPaper, statusFor, zeroed, type Hole } from './logic';

// Tier 4: the 404 page, built as a qualification target. The shot went off the paper; the visitor "adjusts windage and elevation" with the arrow buttons (or the arrow keys)
// until the hole is back on paper and then on the center. A big button always leads back to the firing line (the home page); nothing here blocks leaving.
const CX = TARGET.cx, CY = TARGET.cy, PAPER = TARGET.paper, STEP = TARGET.step;

export default function OffPaper() {
  const [hole, setHole] = useState<Hole>(START_HOLE); const [moves, setMoves] = useState(0); const ref = useRef<SVGSVGElement | null>(null);
  const nudge = (dx: number, dy: number) => { setHole((h) => ({ x: Math.max(PAPER.x - 200, Math.min(PAPER.x + PAPER.w + 200, h.x + dx)), y: Math.max(-20, Math.min(PAPER.y + PAPER.h + 30, h.y + dy)) })); setMoves((m) => m + 1); };
  const key = (e: React.KeyboardEvent) => { const m: Record<string, [number, number]> = { ArrowLeft: [-STEP, 0], ArrowRight: [STEP, 0], ArrowUp: [0, -STEP], ArrowDown: [0, STEP] }; const v = m[e.key]; if (v) { e.preventDefault(); nudge(v[0], v[1]); } };
  const z = zeroed(hole), on = onPaper(hole);
  return (
    <section className={'offpaper' + (z ? ' zero' : on ? ' on' : '')} aria-labelledby="offpaper-title">
      <p className="offpaper-code">ERROR 404 · QUALIFICATION SHEET · MSP FORM 29-14 (RANGE COPY)</p>
      <h1 id="offpaper-title">Shot went off-paper.</h1>
      <p className="offpaper-sub">That page is not on the target. Check your zero: adjust your windage and elevation, then re-engage.</p>
      <div className="offpaper-field">
        <svg ref={ref} viewBox="0 0 520 410" role="img" aria-label={`Target sheet. ${statusFor(hole)}`} tabIndex={0} onKeyDown={key}>
          <rect x={PAPER.x} y={PAPER.y} width={PAPER.w} height={PAPER.h} rx="6" className="op-paper" />
          <path d={`M${CX - 70} ${CY + 175} L${CX - 62} ${CY - 20} Q${CX - 60} ${CY - 60} ${CX - 28} ${CY - 70} L${CX - 28} ${CY - 96} Q${CX} ${CY - 128} ${CX + 28} ${CY - 96} L${CX + 28} ${CY - 70} Q${CX + 60} ${CY - 60} ${CX + 62} ${CY - 20} L${CX + 70} ${CY + 175} Z`} className="op-sil" />
          {[28, 56, 84].map((r) => <circle key={r} cx={CX} cy={CY} r={r} className="op-ring" />)}
          <line x1={CX - 100} y1={CY} x2={CX + 100} y2={CY} className="op-cross" /><line x1={CX} y1={CY - 100} x2={CX} y2={CY + 100} className="op-cross" />
          <text x={CX} y={PAPER.y + 22} textAnchor="middle" className="op-label">FIFS · QUALIFICATION</text>
          <g className="op-hole" style={{ transform: `translate(${hole.x}px, ${hole.y}px)` }}><circle r="9" className="op-hole-c" /><circle r="3" className="op-hole-d" /></g>
          {!on && <text x={hole.x} y={hole.y - 18} textAnchor="middle" className="op-off">OFF PAPER</text>}
        </svg>
        <div className="offpaper-pad" role="group" aria-label="Adjust your zero">
          <button type="button" onClick={() => nudge(0, -STEP)} aria-label="Elevation up">▲</button>
          <button type="button" onClick={() => nudge(-STEP, 0)} aria-label="Windage left">◀</button>
          <button type="button" onClick={() => nudge(STEP, 0)} aria-label="Windage right">▶</button>
          <button type="button" onClick={() => nudge(0, STEP)} aria-label="Elevation down">▼</button>
        </div>
      </div>
      <p className="offpaper-status" role="status" aria-live="polite">{statusFor(hole)}{moves > 0 && !z ? ` (${moves} click${moves === 1 ? '' : 's'})` : ''}</p>
      <div className="offpaper-cta">
        <Link href="/" className="offpaper-go">🎯 Return to the firing line</Link>
        <Link href="/#enrollment" className="offpaper-alt">📋 Course roster</Link>
      </div>
    </section>
  );
}
