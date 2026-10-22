'use client';

import { useEffect, useState } from 'react';
import '../../permits/permits.css';
import { CHECKED, ITEMS, LEGAL_LINE, SOURCE, doneCount, readTicks, writeTicks } from '../../safety/storageChecklist';

// Ticks are kept in this browser only (a convenience, never sent). If the browser blocks storage the checklist still works for the visit.
export default function SafeStoragePage() {
  const [ticks, setTicks] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(true);
  useEffect(() => { try { setTicks(readTicks(window.localStorage)); } catch { setTicks({}); } }, []);
  const toggle = (id: string) => { const next = { ...ticks, [id]: !ticks[id] }; setTicks(next); setSaved(writeTicks((() => { try { return window.localStorage; } catch { return null; } })(), next)); };
  const reset = () => { const cleared: Record<string, boolean> = {}; setTicks(cleared); setSaved(writeTicks((() => { try { return window.localStorage; } catch { return null; } })(), cleared)); };
  const done = doneCount(ticks);
  return (
    <main className="pc-main" id="pc-main">
      <section className="pc-hero" aria-labelledby="ss-title">
        <p className="pc-eyebrow">Train With FIFS</p>
        <h1 id="ss-title">Safe storage checklist</h1>
        <p className="pc-lead">Habits that keep firearms and the people around them safe. Tick each one as you do it.</p>
        <p className="pc-src" role="status" aria-live="polite">{done} of {ITEMS.length} done{saved ? '' : ' (this browser will not save ticks; they last for this visit only)'}</p>
      </section>
      <section className="pc-block" aria-label="Checklist">
        <ul className="pc-facts">
          {ITEMS.map((i) => (
            <li key={i.id} className="pc-fact">
              <label className="ss-row"><input type="checkbox" checked={!!ticks[i.id]} onChange={() => toggle(i.id)} /><span><b>{i.text}</b><small>{i.why}</small></span></label>
            </li>
          ))}
        </ul>
        <button type="button" className="pc-btn pc-btn-ghost" onClick={reset} disabled={done === 0}>Clear my ticks</button>
      </section>
      <section className="pc-card" aria-labelledby="ss-help">
        <h2 id="ss-help"><span aria-hidden="true">🆘 </span>Need help now?</h2>
        <p>If someone may be in crisis, call or text 988, or call 911 in an emergency. <a href="/emergency">See the emergency information page</a>.</p>
        <p className="pc-src">Temporary, voluntary storage near you: <a href="https://mdpgv.org/safestoragemap" target="_blank" rel="noopener noreferrer">Maryland Safe Storage Map ↗</a></p>
      </section>
      <p className="pc-warn"><span aria-hidden="true">⚠️ </span>{LEGAL_LINE}</p>
      <p className="pc-src">Source: <a href={SOURCE.url} target="_blank" rel="noopener noreferrer">{SOURCE.label} ↗</a> · Checked {CHECKED}</p>
      <p className="pc-back"><a href="/">← Back to the home page</a></p>
    </main>
  );
}
