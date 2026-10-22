import { badgesFor, progressText } from './badges';
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import './rangeJournal.css';
import { PRESET_FOCUS, barPct, monthlySeries, prettyDay, toCsv, todayISO, totals, type Goal, type Session } from './rangeLogic';

interface Data { available: boolean; sessions: Session[]; goals: Goal[] }
const EMPTY_FORM = () => ({ on: todayISO(), range: '', rounds: '', focus: '', score: '', notes: '' });

// The signed-in person's own private range journal. Every call goes to the server, which uses the verified login as the owner. Staff cannot see it. All text is rendered as text.
export default function RangeJournalPanel() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Data | null>(null);
  const [msg, setMsg] = useState('');
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM());
  const [goalText, setGoalText] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const [confirm, setConfirm] = useState('');
  const panel = useRef<HTMLElement | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const call = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const fn = (window as any).callFifsBackend;
    if (typeof fn !== 'function') throw new Error('The page is still loading.');
    return fn(action, payload);
  }, []);
  const load = useCallback(async () => { try { const d = await call('journalList'); setData({ available: d.available !== false, sessions: d.sessions || [], goals: d.goals || [] }); setMsg(''); } catch (e: any) { setMsg(e?.message || 'Could not load your journal.'); } }, [call]);
  const say = (t: string) => { setToast(t); if (toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 4000); };

  useEffect(() => { (window as any).openRangeJournal = () => { setOpen(true); setMsg(''); setToast(''); setConfirm(''); setForm(EMPTY_FORM()); load(); }; return () => { delete (window as any).openRangeJournal; }; }, [load]);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { if (confirm) setConfirm(''); else setOpen(false); return; }
      if (e.key !== 'Tab' || !panel.current) return;
      const f = Array.from(panel.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]')).filter((x) => x.offsetParent !== null);
      if (!f.length) return; const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [open, confirm]);
  useEffect(() => { if (open) window.setTimeout(() => panel.current?.querySelector<HTMLElement>('.rj-close')?.focus(), 60); }, [open]);
  if (!open) return null;

  const sessions = data?.sessions || []; const goals = data?.goals || [];
  const t = totals(sessions); const series = monthlySeries(sessions); const max = Math.max(0, ...series.map((b) => b.rounds));
  const set = (k: keyof ReturnType<typeof EMPTY_FORM>) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const run = async (fn: () => Promise<void>) => { setBusy(true); try { await fn(); } catch (e: any) { setMsg(e?.message || 'That did not work. Please try again.'); } finally { setBusy(false); } };
  const addSession = (e: React.FormEvent) => { e.preventDefault(); void run(async () => { await call('journalAddSession', form); setForm(EMPTY_FORM()); setMsg(''); say('✅ Session saved.'); await load(); }); };
  const delSession = (id: string) => run(async () => { await call('journalDeleteSession', { id }); setConfirm(''); say('Session deleted.'); await load(); });
  const addGoal = (e: React.FormEvent) => { e.preventDefault(); if (!goalText.trim()) { setMsg('Write your goal first.'); return; } void run(async () => { await call('journalAddGoal', { goal: goalText, targetOn: goalDate || undefined }); setGoalText(''); setGoalDate(''); setMsg(''); say('🎯 Goal added.'); await load(); }); };
  const toggleGoal = (g: Goal) => run(async () => { await call('journalSetGoal', { id: g.id, done: !g.doneAt }); await load(); });
  const delGoal = (id: string) => run(async () => { await call('journalDeleteGoal', { id }); setConfirm(''); await load(); });
  const wipe = () => run(async () => { await call('journalDeleteAll'); setConfirm(''); say('Your journal was deleted.'); await load(); });
  const exportCsv = () => { const url = URL.createObjectURL(new Blob([toCsv(sessions, goals)], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = `fifs-range-journal-${todayISO()}.csv`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); say('⬇️ Your journal was exported.'); };

  return (
    <div className="rj-overlay" data-organic="skip" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <section className="rj" role="dialog" aria-modal="true" aria-labelledby="rj-title" ref={panel}>
        <header className="rj-head">
          <div><span className="rj-bar" aria-hidden="true" /><h2 id="rj-title">📓 Range Journal</h2><p className="rj-tag">Private to you. Staff cannot see it.</p></div>
          <button type="button" className="rj-close" onClick={() => setOpen(false)} aria-label="Close your range journal">✕</button>
        </header>

        {msg && <p className="rj-msg" role="alert">⚠️ {msg}</p>}
        <div className="rj-toast" role="status" aria-live="polite">{toast}</div>

        {!data && !msg && <p className="rj-empty">Loading your journal…</p>}
        {data && !data.available && <p className="rj-empty">The range journal is not set up yet. Please check back soon.</p>}

        {data && data.available && (
          <>
            <div className="rj-stats" aria-label="Your totals">
              <div className="rj-stat"><span aria-hidden="true">🗓️</span><b>{t.sessions}</b><small>Sessions</small></div>
              <div className="rj-stat"><span aria-hidden="true">🎯</span><b>{t.rounds.toLocaleString()}</b><small>Rounds</small></div>
              <div className="rj-stat"><span aria-hidden="true">📈</span><b>{t.avg}</b><small>Avg per session</small></div>
              <div className="rj-stat"><span aria-hidden="true">⏱️</span><b>{t.last ? prettyDay(t.last) : 'None yet'}</b><small>Last session</small></div>
            </div>

            <section className="rj-card" aria-labelledby="rj-chart-t">
              <h3 id="rj-chart-t">Rounds per month</h3>
              <div className="rj-chart" role="img" aria-label={'Rounds per month: ' + series.map((b) => `${b.label} ${b.rounds}`).join(', ')}>
                {series.map((b) => (
                  <div className="rj-col" key={b.key}><span className="rj-val">{b.rounds}</span><div className="rj-track"><i className="rj-fill" style={{ height: barPct(b.rounds, max) + '%' }} /></div><span className="rj-lab">{b.label}</span></div>
                ))}
              </div>
              {sessions.length === 0 && <p className="rj-empty">No sessions yet. Log your first one below and your chart will fill in.</p>}
            </section>

            <section className="rj-card" aria-labelledby="rj-log-t">
              <h3 id="rj-log-t">Log a session</h3>
              <p className="rj-note" role="note">🚫 Please do not enter firearm serial numbers, where you store firearms, or home-security details.</p>
              <form onSubmit={addSession} className="rj-form">
                <label>Date<input type="date" required value={form.on} max={todayISO()} onChange={set('on')} /></label>
                <label>Range<input type="text" maxLength={80} placeholder="e.g. Cindy's Hot Shots" value={form.range} onChange={set('range')} /></label>
                <label>Rounds fired<input type="number" inputMode="numeric" min={0} max={5000} placeholder="e.g. 100" value={form.rounds} onChange={set('rounds')} /></label>
                <label>Focus<input type="text" list="rj-focus" maxLength={60} placeholder="e.g. Accuracy" value={form.focus} onChange={set('focus')} /><datalist id="rj-focus">{PRESET_FOCUS.map((f) => <option key={f} value={f} />)}</datalist></label>
                <label>Score (optional)<input type="text" maxLength={40} placeholder="e.g. 23/25" value={form.score} onChange={set('score')} /></label>
                <label className="rj-wide">Notes<textarea rows={3} maxLength={1000} placeholder="What went well? What to work on next time?" value={form.notes} onChange={set('notes')} /></label>
                <button type="submit" className="rj-primary" disabled={busy}>{busy ? 'Saving…' : '💾 Save session'}</button>
              </form>
            </section>

            <section className="rj-card rj-badges" aria-labelledby="rj-badge-t">
              <h3 id="rj-badge-t"><span aria-hidden="true">🏅 </span>Your badges</h3>
              <p className="rj-note">Badges come from your own journal. Nothing is shared.</p>
              <ul className="rj-badge-list">
                {badgesFor({ sessions: t.sessions, rounds: t.rounds, goalsDone: goals.filter((g) => !!g.doneAt).length }).map((b) => (
                  <li key={b.id} className={b.earned ? 'earned' : 'locked'}>
                    <span className="rj-badge-ico" aria-hidden="true">{b.emoji}</span>
                    <span><b>{b.title}</b><small>{progressText(b)}</small></span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="rj-card" aria-labelledby="rj-goal-t">
              <h3 id="rj-goal-t">Goals</h3>
              <form onSubmit={addGoal} className="rj-goalform">
                <label className="rj-grow">New goal<input type="text" maxLength={140} placeholder="e.g. Shoot 24/25 on the qualification course" value={goalText} onChange={(e) => setGoalText(e.target.value)} /></label>
                <label>Target date<input type="date" value={goalDate} onChange={(e) => setGoalDate(e.target.value)} /></label>
                <button type="submit" className="rj-primary" disabled={busy}>🎯 Add goal</button>
              </form>
              {goals.length === 0 ? <p className="rj-empty">No goals yet. A clear goal makes range days count.</p> : (
                <ul className="rj-list">
                  {goals.map((g) => (
                    <li key={g.id} className={g.doneAt ? 'done' : ''}>
                      <label className="rj-check"><input type="checkbox" checked={!!g.doneAt} disabled={busy} onChange={() => toggleGoal(g)} /><span>{g.goal}{g.targetOn ? <small> · by {prettyDay(g.targetOn)}</small> : null}</span></label>
                      {confirm === 'g' + g.id ? <span className="rj-confirm"><button type="button" className="danger" onClick={() => delGoal(g.id)}>Yes, delete</button><button type="button" onClick={() => setConfirm('')}>Cancel</button></span>
                        : <button type="button" className="rj-ghost" aria-label={`Delete goal: ${g.goal}`} onClick={() => setConfirm('g' + g.id)}>🗑️</button>}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rj-card" aria-labelledby="rj-hist-t">
              <h3 id="rj-hist-t">History</h3>
              {sessions.length === 0 ? <p className="rj-empty">Your sessions will show here.</p> : (
                <ul className="rj-list">
                  {sessions.map((s) => (
                    <li key={s.id}>
                      <div className="rj-sess">
                        <b>{prettyDay(s.on)}</b><span className="rj-pill">🎯 {s.rounds} rounds</span>{s.focus && <span className="rj-pill alt">{s.focus}</span>}{s.score && <span className="rj-pill alt">📝 {s.score}</span>}
                        {s.range && <small>{s.range}</small>}{s.notes && <p>{s.notes}</p>}
                      </div>
                      {confirm === 's' + s.id ? <span className="rj-confirm"><button type="button" className="danger" onClick={() => delSession(s.id)}>Yes, delete</button><button type="button" onClick={() => setConfirm('')}>Cancel</button></span>
                        : <button type="button" className="rj-ghost" aria-label={`Delete the session on ${prettyDay(s.on)}`} onClick={() => setConfirm('s' + s.id)}>🗑️</button>}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <footer className="rj-foot">
              <button type="button" className="rj-secondary" onClick={exportCsv} disabled={!sessions.length && !goals.length}>⬇️ Export my journal (CSV)</button>
              {confirm === 'all' ? <span className="rj-confirm" role="alert"><span>Delete your whole journal? This cannot be undone.</span><button type="button" className="danger" onClick={wipe}>Yes, delete everything</button><button type="button" onClick={() => setConfirm('')}>Cancel</button></span>
                : <button type="button" className="rj-ghost wide" onClick={() => setConfirm('all')} disabled={!sessions.length && !goals.length}>🗑️ Delete my journal</button>}
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
