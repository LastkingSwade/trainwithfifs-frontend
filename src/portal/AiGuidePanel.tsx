'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import './rangeJournal.css';
import './aiGuide.css';

interface Source { title: string; url?: string; label?: string }
interface Turn { role: 'member' | 'guide'; text: string; sources?: Source[] }
const SUGGESTED = ['What should I bring to class?', 'Where is the range?', 'How does the Document Wallet work?', 'How do I install the app on my phone?', 'How long do Maryland permits take to process?'] as const;
const MAX = 500;

// The FIFS Guide window for signed-in members. The server answers only from approved FIFS reference text and never receives anything about the member except the typed question and a few earlier turns.
// The conversation lives only in this window's memory and is dropped when it closes. All text is rendered as text; links shown are the ones the server returned from its approved list.
export default function AiGuidePanel() {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const panel = useRef<HTMLElement | null>(null);
  const log = useRef<HTMLOListElement | null>(null);

  const call = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const fn = (window as any).callFifsBackend;
    if (typeof fn !== 'function') throw new Error('The page is still loading.');
    return fn(action, payload);
  }, []);
  const close = useCallback(() => { setOpen(false); setTurns([]); setText(''); setMsg(''); setEnabled(null); }, []);

  useEffect(() => { (window as any).openAiGuide = () => { setOpen(true); setTurns([]); setText(''); setMsg(''); setEnabled(null); call('aiGuideStatus').then((d) => setEnabled(d.enabled === true)).catch((e: any) => { setEnabled(null); setMsg(e?.message || 'Could not open the FIFS Guide.'); }); }; return () => { delete (window as any).openAiGuide; }; }, [call]);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab' || !panel.current) return;
      const f = Array.from(panel.current.querySelectorAll<HTMLElement>('button:not(:disabled), textarea:not(:disabled), a[href]')).filter((x) => x.offsetParent !== null);
      if (!f.length) return; const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [open, close]);
  useEffect(() => { if (open) window.setTimeout(() => panel.current?.querySelector<HTMLElement>('.rj-close')?.focus(), 60); }, [open]);
  useEffect(() => { if (log.current) log.current.scrollTop = log.current.scrollHeight; }, [turns, busy]);
  if (!open) return null;

  const ask = async (q: string) => {
    const question = q.trim(); if (!question || busy) return;
    if (question.length > MAX) { setMsg(`Please keep your question under ${MAX} characters.`); return; }
    const history = turns.slice(-6).map((t) => ({ role: t.role, text: t.text }));
    setTurns((t) => [...t, { role: 'member', text: question }]); setText(''); setMsg(''); setBusy(true);
    try { const d = await call('aiGuideAsk', { question, history }); setTurns((t) => [...t, { role: 'guide', text: String(d.answer || ''), sources: Array.isArray(d.sources) ? d.sources : [] }]); }
    catch (e: any) { setMsg(e?.message || 'The FIFS Guide is not available right now.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="rj-overlay ai-overlay" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <section className="rj ai" role="dialog" aria-modal="true" aria-labelledby="ai-title" ref={panel}>
        <header className="rj-head">
          <div><span className="rj-bar" aria-hidden="true" /><h2 id="ai-title">🤖 FIFS Guide</h2><p className="rj-tag">Quick answers about classes and your portal.</p></div>
          <button type="button" className="rj-close" onClick={close} aria-label="Close the FIFS Guide">✕</button>
        </header>
        <p className="rj-note" role="note">⚠️ AI-generated help from approved FIFS information. It is not legal advice and it can make mistakes. For anything important, ask Coach Kai at 443-990-1304 or use “Chat with me”.</p>
        {msg && <p className="rj-msg" role="alert">⚠️ {msg}</p>}
        {enabled === false && <div className="ar-soon"><h3>🤖 The FIFS Guide is coming soon</h3><p>For now, use “Chat with me” in your portal or call Coach Kai at 443-990-1304.</p></div>}
        {enabled === null && !msg && <p className="rj-empty">Opening…</p>}
        {enabled === true && (
          <>
            <ol className="ai-log" role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversation with the FIFS Guide" ref={log}>
              {turns.length === 0 && <li className="ai-hello"><p>Hi! Ask me about class day, booking, or how to use your portal. Try one of these:</p><div className="ai-chips">{SUGGESTED.map((s) => <button type="button" key={s} className="ai-chip" onClick={() => ask(s)} disabled={busy}>{s}</button>)}</div></li>}
              {turns.map((t, i) => (
                <li key={i} className={'ai-turn ' + (t.role === 'member' ? 'mine' : 'guide')}>
                  <span className="ai-who">{t.role === 'member' ? 'You' : '🤖 FIFS Guide'}</span>
                  <p>{t.text}</p>
                  {t.role === 'guide' && t.sources && t.sources.length > 0 && <p className="ai-src"><span>Sources: </span>{t.sources.map((s, j) => <span key={j}>{j ? ' · ' : ''}{s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer">{s.label || s.title} ↗</a> : s.title}</span>)}</p>}
                </li>
              ))}
              {busy && <li className="ai-turn guide" aria-live="polite"><span className="ai-who">🤖 FIFS Guide</span><p>Thinking…</p></li>}
            </ol>
            <form className="ai-form" onSubmit={(e) => { e.preventDefault(); void ask(text); }}>
              <label htmlFor="ai-input">Your question</label>
              <textarea id="ai-input" rows={2} maxLength={MAX} placeholder="Ask about classes, booking or your portal…" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !(e.nativeEvent as any).isComposing) { e.preventDefault(); void ask(text); } }} />
              <div className="ai-row"><span className="ai-count">{text.length} / {MAX}</span><button type="submit" className="rj-primary" disabled={busy || !text.trim()}>{busy ? 'Thinking…' : '✉️ Ask'}</button></div>
            </form>
            <p className="ai-fine">Your conversation is not saved and is cleared when you close this window. Please do not enter personal details.</p>
          </>
        )}
      </section>
    </div>
  );
}
