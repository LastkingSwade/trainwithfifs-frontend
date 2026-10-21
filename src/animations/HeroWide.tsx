// The wide-screen hero picture (computers and landscape tablets, 900px and wider) with its own light show on top: the emblem breathes and glows, two rings turn around it,
// a light sweeps across the wordmark, a beam pulses under it, the tablet screen shimmers, the targets ping and a soft scan line drifts down the table.
// Everything is positioned in the picture's own units (1376 x 768) so it stays on the right spot at any screen size (see heroWide.css). Pure markup: no script.
// Phones and portrait tablets keep the tall picture and its HUD (src/animations/HudIntro.tsx) exactly as before.
export default function HeroWide() {
  return (
    <div className="hw" aria-hidden="true">
      <div className="hw-art" />
      <div className="hw-o hw-glow" style={{ ['--x' as string]: 688, ['--y' as string]: 165, ['--w' as string]: 470, ['--h' as string]: 470 } as React.CSSProperties} />
      <svg className="hw-o hw-rings" viewBox="0 0 400 400" style={{ ['--x' as string]: 688, ['--y' as string]: 163, ['--w' as string]: 400, ['--h' as string]: 400 } as React.CSSProperties}>
        <circle className="hw-ring hw-ring-a" cx="200" cy="200" r="150" />
        <circle className="hw-ring hw-ring-b" cx="200" cy="200" r="172" />
        <g className="hw-ticks"><path d="M200 18v14M200 368v14M18 200h14M368 200h14" /></g>
      </svg>
      <div className="hw-o hw-tab" style={{ ['--x' as string]: 500, ['--y' as string]: 515, ['--w' as string]: 620, ['--h' as string]: 230 } as React.CSSProperties} />
      <div className="hw-o hw-shine" style={{ ['--x' as string]: 688, ['--y' as string]: 292, ['--w' as string]: 330, ['--h' as string]: 78 } as React.CSSProperties}><i /></div>
      <div className="hw-o hw-beam" style={{ ['--x' as string]: 688, ['--y' as string]: 299, ['--w' as string]: 420, ['--h' as string]: 6 } as React.CSSProperties} />
      <div className="hw-o hw-ping" style={{ ['--x' as string]: 1128, ['--y' as string]: 388, ['--w' as string]: 90, ['--h' as string]: 90 } as React.CSSProperties} />
      <div className="hw-o hw-ping hw-ping-b" style={{ ['--x' as string]: 766, ['--y' as string]: 612, ['--w' as string]: 90, ['--h' as string]: 90 } as React.CSSProperties} />
      <div className="hw-scan" />
    </div>
  );
}
