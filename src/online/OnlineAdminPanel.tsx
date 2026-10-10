'use client';

import { useCallback, useEffect, useState } from 'react';
import './online.css';

const COURSES: Record<string, string> = { mastery: 'Multi-State Mastery', combo: 'CCW & HQL Combo', ccw: 'Wear & Carry (CCW)', renewal: 'Wear & Carry Renewal', hql: 'HQL' };
interface Session { id: string; courseKey: string; kind: 'classroom' | 'range'; startsAt: string; capacity: number; meetingUrl: string; isOpen: boolean; seatsTaken: number; attended: number }
interface Person { invoiceNumber: string; email: string; status: string; attendedAt: string | null }
const when = (iso: string) => new Date(iso).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const toLocalInput = (iso: string) => { const d = new Date(iso); const p = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };

// Admin Hub: switch classes on for the live online option, post classroom and range dates, set meeting links, mark Day 2 attendance.
// The server checks the staff role on every call; nothing here is trusted.
export default function OnlineAdminPanel() {
  const [open, setOpen] = useState(false);
  const [switches, setSwitches] = useState<Array<{ courseKey: string; enabled: boolean }>>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [msg, setMsg] = useState('');
  const [roster, setRoster] = useState<{ session: Session; people: Person[] } | null>(null);
  const [form, setForm] = useState({ id: '', courseKey: 'ccw', kind: 'classroom', startsAt: '', capacity: '10', meetingUrl: '', isOpen: true });

  const call = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const fn = (window as any).callFifsBackend;
    if (typeof fn !== 'function') throw new Error('The page is still loading.');
    return fn(action, payload);
  }, []);
  const load = useCallback(async () => {
    try { const d = await call('adminOnlineOverview'); setSwitches(d.switches || []); setSessions(d.sessions || []); setMsg(''); } catch (e: any) { setMsg(e?.message || 'Could not load.'); }
  }, [call]);

  useEffect(() => { (window as any).openOnlineAdmin = () => { setOpen(true); load(); }; return () => { delete (window as any).openOnlineAdmin; }; }, [load]);
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [open]);
  if (!open) return null;

  const flip = async (courseKey: string, enabled: boolean) => { try { await call('adminSetOnlineCourse', { courseKey, enabled }); setSwitches((s) => s.map((x) => (x.courseKey === courseKey ? { ...x, enabled } : x))); setMsg(enabled ? 'Online option is ON for this class (students see it once a classroom date and a range day are posted).' : 'Online option is OFF for this class.'); } catch (e: any) { setMsg(e?.message || 'Could not save.'); } };
  const save = async () => {
    try {
      await call('adminSaveSession', { ...form, id: form.id || undefined, capacity: Number(form.capacity), startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : '' });
      setForm({ ...form, id: '', startsAt: '', meetingUrl: '' }); setMsg('Saved.'); load();
    } catch (e: any) { setMsg(e?.message || 'Could not save.'); }
  };
  const edit = (s: Session) => setForm({ id: s.id, courseKey: s.courseKey, kind: s.kind, startsAt: toLocalInput(s.startsAt), capacity: String(s.capacity), meetingUrl: s.meetingUrl, isOpen: s.isOpen });
  const showRoster = async (s: Session) => { try { const d = await call('adminSessionRoster', { sessionId: s.id }); setRoster({ session: s, people: d.people || [] }); } catch (e: any) { setMsg(e?.message || 'Could not load.'); } };
  const mark = async (p: Person, attended: boolean) => {
    if (!roster) return;
    try { await call('adminMarkAttendance', { invoiceNumber: p.invoiceNumber, kind: roster.session.kind, attended }); await showRoster(roster.session); load(); setMsg(attended ? 'Attendance recorded.' : 'Attendance cleared.'); } catch (e: any) { setMsg(e?.message || 'Could not save.'); }
  };

  return (
    <div className="online-admin-overlay" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <section className="online-admin" role="dialog" aria-modal="true" aria-label="Online classes">
        <div className="row" style={{ justifyContent: 'space-between' }}><h2>💻 Live Online Classroom</h2><button type="button" onClick={() => setOpen(false)}>Close</button></div>
        <p className="hint">Day 2 (range) is always in person. A class shows the online option to students only when its switch is ON and you have posted at least one live classroom date and one range day.</p>
        <h3>1. Which classes can be taken online</h3>
        <p className="hint">Every class starts OFF. Check Maryland State Police requirements before turning one on.</p>
        <div className="row">{switches.map((s) => (<label className="sw" key={s.courseKey}><input type="checkbox" checked={s.enabled} onChange={(e) => flip(s.courseKey, e.target.checked)} /> {COURSES[s.courseKey] || s.courseKey}</label>))}</div>
        <h3>2. Dates</h3>
        {sessions.length === 0 && <p className="hint">No dates yet. Add a live classroom date and a range day below.</p>}
        {sessions.map((s) => (
          <div className="sess" key={s.id}>
            <span><strong>{s.kind === 'classroom' ? 'Live classroom' : 'Range day (in person)'}</strong> · {COURSES[s.courseKey] || s.courseKey} · {when(s.startsAt)} · {s.seatsTaken}{s.capacity ? ` of ${s.capacity}` : ''} seats{s.isOpen ? '' : ' · CLOSED'}</span>
            <span className="row"><button type="button" onClick={() => edit(s)}>Edit</button><button type="button" onClick={() => showRoster(s)}>Roster</button></span>
          </div>
        ))}
        <h3>{form.id ? 'Edit date' : 'Add a date'}</h3>
        <div className="row">
          <select aria-label="Class" value={form.courseKey} onChange={(e) => setForm({ ...form, courseKey: e.target.value })}>{Object.entries(COURSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <select aria-label="Kind" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}><option value="classroom">Live classroom (video)</option><option value="range">Range day (in person)</option></select>
          <input aria-label="Date and time" type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
          <input aria-label="Seats (0 = no limit)" type="number" min={0} max={200} style={{ width: 90 }} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
        </div>
        {form.kind === 'classroom' && <div className="row"><input aria-label="Meeting link" placeholder="Meeting link (https://...)" style={{ flex: 1, minWidth: 220 }} value={form.meetingUrl} onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })} /></div>}
        <div className="row"><label className="sw"><input type="checkbox" checked={form.isOpen} onChange={(e) => setForm({ ...form, isOpen: e.target.checked })} /> Open for booking</label><button type="button" className="primary" onClick={save}>{form.id ? 'Save changes' : 'Add date'}</button>{form.id && <button type="button" onClick={() => setForm({ ...form, id: '', startsAt: '', meetingUrl: '' })}>Cancel edit</button>}</div>
        {roster && (
          <>
            <h3>Roster: {roster.session.kind === 'classroom' ? 'Live classroom' : 'Range day'} · {when(roster.session.startsAt)}</h3>
            {roster.people.length === 0 && <p className="hint">Nobody has a seat yet.</p>}
            {roster.people.map((p) => (
              <div className="sess" key={p.invoiceNumber}>
                <span>{p.email || p.invoiceNumber} · {p.status === 'PENDING' ? 'not paid yet' : 'paid'} · {p.attendedAt ? 'attended' : 'not marked'}</span>
                <span className="row">{p.attendedAt ? <button type="button" onClick={() => mark(p, false)}>Undo</button> : <button type="button" className="primary" onClick={() => mark(p, true)}>Mark attended</button>}</span>
              </div>
            ))}
            <p className="hint">Certificates for live online students unlock only after their range day is marked attended.</p>
          </>
        )}
        <div className="msg" role="status">{msg}</div>
      </section>
    </div>
  );
}
