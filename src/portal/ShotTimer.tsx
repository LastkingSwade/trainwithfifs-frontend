'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MAX_RUN_MS, MAX_SHOTS, PAR_MAX_S, PAR_MIN_S, addShot, fmt, isShot, noteLine, parseParSeconds, randomDelayMs, summarize, thresholdFor, type Shot } from './shotTimerLogic';

type Phase = 'idle' | 'waiting' | 'running' | 'done';
type Mic = 'off' | 'on' | 'denied' | 'unavailable';
const IDLE_TEXT = 'Press Start. After a random wait you will hear a beep. That is your signal.';

// A shot timer inside the Range Journal. Start, wait for the random beep, shoot: the timer listens through the microphone and notes each shot and the time between shots (or you can tap for each shot, for dry-fire).
// The microphone is only used to hear how loud things are, right here on this device, while a string is running: nothing is recorded, saved or sent anywhere, and it is switched off the moment you stop or close the journal.
export default function ShotTimer({ onAddNote }: { onAddNote?: (line: string) => void }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [shots, setShots] = useState<Shot[]>([]);
  const [par, setPar] = useState('');
  const [sens, setSens] = useState(6);
  const [useMic, setUseMic] = useState(true);
  const [mic, setMic] = useState<Mic>('off');
  const [status, setStatus] = useState(IDLE_TEXT);
  const [level, setLevel] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [go, setGo] = useState(false);

  const ctx = useRef<AudioContext | null>(null); const stream = useRef<MediaStream | null>(null); const analyser = useRef<AnalyserNode | null>(null);
  const waitT = useRef<number | undefined>(undefined); const parT = useRef<number | undefined>(undefined); const pollI = useRef<number | undefined>(undefined); const tickI = useRef<number | undefined>(undefined); const goT = useRef<number | undefined>(undefined);
  const beepAt = useRef(0); const shotsRef = useRef<Shot[]>([]); const phaseRef = useRef<Phase>('idle'); const sensRef = useRef(6); const lastLevelPaint = useRef(0);
  useEffect(() => { sensRef.current = sens; }, [sens]);
  const setPhaseBoth = (p: Phase) => { phaseRef.current = p; setPhase(p); };
  const cur = (): Phase => phaseRef.current; // read fresh each time: the person can press Stop while the microphone permission is being asked

  /** Stops every timer, switches the microphone off and closes the audio engine. Safe to call at any time and more than once. */
  const teardown = useCallback(() => {
    window.clearTimeout(waitT.current); window.clearTimeout(parT.current); window.clearTimeout(goT.current); window.clearInterval(pollI.current); window.clearInterval(tickI.current);
    if (stream.current) { stream.current.getTracks().forEach((t) => t.stop()); stream.current = null; }
    analyser.current = null; if (ctx.current) { void ctx.current.close().catch(() => undefined); ctx.current = null; }
    setMic('off'); setLevel(0);
  }, []);
  useEffect(() => teardown, [teardown]);

  const beep = (freq: number, ms: number) => {
    const c = ctx.current; if (!c) return; const o = c.createOscillator(); const g = c.createGain(); o.type = 'square'; o.frequency.value = freq; g.gain.value = 0.35; o.connect(g); g.connect(c.destination);
    const t = c.currentTime; o.start(t); o.stop(t + ms / 1000);
  };
  const finish = (why: string) => { window.clearTimeout(parT.current); window.clearInterval(pollI.current); window.clearInterval(tickI.current); if (stream.current) { stream.current.getTracks().forEach((t) => t.stop()); stream.current = null; } analyser.current = null; if (ctx.current) { void ctx.current.close().catch(() => undefined); ctx.current = null; } setMic('off'); setLevel(0); setGo(false); setPhaseBoth('done'); const n = shotsRef.current.length; setStatus(`${why} ${n} shot${n === 1 ? '' : 's'} recorded.`); };
  const record = (atMs: number) => {
    const next = addShot(shotsRef.current, atMs); if (next.length === shotsRef.current.length) return;
    shotsRef.current = next; setShots(next); if (next.length >= MAX_SHOTS) finish('Shot limit reached.');
  };

  const start = async () => {
    if (cur() === 'waiting' || cur() === 'running') return;
    teardown(); shotsRef.current = []; setShots([]); setElapsed(0); setGo(false); setPhaseBoth('waiting'); setStatus('Stand by…');
    try { const AC = window.AudioContext || (window as any).webkitAudioContext; if (!AC) throw new Error('no audio'); ctx.current = new AC(); if (ctx.current.state === 'suspended') await ctx.current.resume(); }
    catch { setPhaseBoth('idle'); setStatus('This device cannot play the start beep, so the timer cannot run here.'); return; }
    if (useMic) {
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') { setMic('unavailable'); }
      else {
        try {
          // The sound is not cleaned up (no echo cancelling, noise reduction or automatic volume): a shot is a short, very loud sound, and those filters would hide it.
          const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
          if (cur() !== 'waiting' || !ctx.current) { s.getTracks().forEach((t) => t.stop()); return; }
          stream.current = s; const a = ctx.current.createAnalyser(); a.fftSize = 256; ctx.current.createMediaStreamSource(s).connect(a); analyser.current = a; setMic('on');
        } catch { setMic('denied'); }
      }
    }
    if (cur() !== 'waiting') return;
    waitT.current = window.setTimeout(() => {
      beep(1800, 250); beepAt.current = performance.now(); setPhaseBoth('running'); setGo(true); setStatus('GO! Shoot now.'); goT.current = window.setTimeout(() => setGo(false), 700);
      const parS = parseParSeconds(par); if (parS !== null) parT.current = window.setTimeout(() => { beep(900, 450); }, parS * 1000);
      const a = analyser.current; const buf = a ? new Uint8Array(a.fftSize) : null;
      if (a && buf) pollI.current = window.setInterval(() => {
        a.getByteTimeDomainData(buf); let peak = 0; for (let i = 0; i < buf.length; i++) { const d = Math.abs(buf[i] - 128) / 128; if (d > peak) peak = d; }
        const now = performance.now(); const t = now - beepAt.current; const last = shotsRef.current.length ? shotsRef.current[shotsRef.current.length - 1].atMs : null;
        if (now - lastLevelPaint.current > 60) { lastLevelPaint.current = now; setLevel(peak); }
        if (isShot(peak, thresholdFor(sensRef.current), t, last === null ? null : t - last)) record(t);
      }, 5);
      tickI.current = window.setInterval(() => { const t = performance.now() - beepAt.current; setElapsed(t); if (t >= MAX_RUN_MS) finish('Time limit reached.'); }, 50);
    }, randomDelayMs());
  };
  const tap = () => { if (cur() === 'running') record(performance.now() - beepAt.current); };
  const stop = () => { if (cur() === 'waiting') { teardown(); setPhaseBoth('idle'); setStatus(IDLE_TEXT); return; } if (cur() === 'running') finish('Stopped.'); };
  const reset = () => { teardown(); shotsRef.current = []; setShots([]); setElapsed(0); setGo(false); setPhaseBoth('idle'); setStatus(IDLE_TEXT); };

  const sum = summarize(shots); const parS = parseParSeconds(par); const busy = phase === 'waiting' || phase === 'running';
  const parBad = par.trim() !== '' && parS === null;
  return (
    <section className="rj-card rj-timer" id="rj-timer" aria-labelledby="rj-timer-t">
      <h3 id="rj-timer-t"><span aria-hidden="true">⏱️ </span>Shot timer</h3>

      <div className={'rj-t-screen' + (go ? ' rj-t-go' : '') + (phase === 'waiting' ? ' rj-t-wait' : '')}>
        <output className="rj-t-time" aria-hidden="true">{phase === 'running' || phase === 'done' ? fmt(phase === 'done' ? sum.totalMs ?? elapsed : elapsed) : '0.00'}<small>s</small></output>
        <p className="rj-t-status" role="status" aria-live="assertive">{status}</p>
      </div>

      <div className="rj-t-actions">
        {!busy && <button type="button" className="rj-primary rj-t-start" id="rj-timer-start" onClick={() => { void start(); }}>{phase === 'done' ? '↻ Go again' : '▶ Start'}</button>}
        {busy && <button type="button" className="rj-t-stop" onClick={stop}>■ Stop</button>}
        {phase === 'running' && <button type="button" className="rj-t-tap" onClick={tap}>👆 Tap for each shot</button>}
        {(shots.length > 0 || phase === 'done') && !busy && <button type="button" className="rj-t-ghost" onClick={reset}>Clear</button>}
      </div>

      {shots.length > 0 && (
        <div className="rj-t-results" aria-label="Shot times">
          <ol className="rj-t-list">{shots.map((s) => <li key={s.n}><b>Shot {s.n}</b><span>{fmt(s.atMs)} s</span><small>{s.n === 1 ? 'draw' : 'split ' + fmt(s.splitMs) + ' s'}</small></li>)}</ol>
          <p className="rj-t-sum">{sum.count} shot{sum.count === 1 ? '' : 's'} · first {fmt(sum.firstMs)} s · total {fmt(sum.totalMs)} s{sum.avgSplitMs !== null ? ` · avg split ${fmt(sum.avgSplitMs)} s · best ${fmt(sum.bestSplitMs)} s` : ''}</p>
          {onAddNote && !busy && <button type="button" className="rj-t-ghost" onClick={() => onAddNote(noteLine(shots, parS))}>📝 Add to my session notes</button>}
        </div>
      )}

      <p className="rj-note">Wear hearing and eye protection. The microphone only listens for how loud things are, on this device, while a string is running. Nothing is recorded, saved or sent.</p>
      <div className="rj-t-settings">
        <label>Par time in seconds (optional)<input type="text" inputMode="decimal" maxLength={5} placeholder="e.g. 2.5" value={par} onChange={(e) => setPar(e.target.value)} disabled={busy} aria-invalid={parBad} aria-describedby="rj-par-help" /></label>
        <p className="rj-t-help" id="rj-par-help">{parBad ? `Use a number from ${PAR_MIN_S} to ${PAR_MAX_S}.` : 'A second, lower beep tells you when your par time is up.'}</p>
        <label className="rj-t-check"><input type="checkbox" checked={useMic} onChange={(e) => setUseMic(e.target.checked)} disabled={busy} /> Listen for shots with the microphone</label>
        {useMic && (<>
          <label>Sensitivity: {sens} of 10 <small>(higher hears quieter shots)</small><input type="range" min={1} max={10} step={1} value={sens} onChange={(e) => setSens(Number(e.target.value))} aria-valuetext={`${sens} of 10`} /></label>
          {mic === 'on' && <div className="rj-t-meter" role="img" aria-label={`Microphone level ${Math.round(level * 100)} percent`}><i style={{ width: Math.min(100, Math.round(level * 100)) + '%' }} /><b style={{ left: Math.round(thresholdFor(sens) * 100) + '%' }} aria-hidden="true" /></div>}
        </>)}
        {mic === 'denied' && <p className="rj-msg" role="alert">⚠️ The microphone is blocked, so shots will not be heard. Use the tap button, or allow the microphone for this site in your browser settings.</p>}
        {mic === 'unavailable' && <p className="rj-msg" role="alert">⚠️ This browser cannot use the microphone here. Use the tap button for each shot.</p>}
      </div>

    </section>
  );
}
