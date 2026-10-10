'use client';

import { useCallback, useEffect, useState } from 'react';
import './online.css';

interface Day { day: string; mode: 'online' | 'in_person'; bookings: number; attended: number; meetingUrl: string }
interface Person { invoiceNumber: string; email: string; status: string; role: string; attendedAt: string | null }
const pretty = (day: string) => new Date(day + 'T12:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

// Admin Hub: see which calendar days are web days or in-person days (set by the first booking), set the meeting link for a web day,
// and mark attendance. The server checks the staff role on every call; nothing here is trusted.
export default function OnlineAdminPanel() {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState<Day[]>([]);
  const [msg, setMsg] = useState('');
  const [roster, setRoster] = useState<{ day: string; people: Person[] } | null>(null);
  const [links, setLinks] = useState<Record<string, string>>({});

  const call = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const fn = (window as any).callFifsBackend;
    if (typeof fn !== 'function') throw new Error('The page is still loading.');
    return fn(action, payload);
  }, []);
  const load = useCallback(async () => {
    try { const d = await call('adminOnlineOverview'); const list: Day[] = d.days || []; setDays(list); setLinks(Object.fromEntries(list.map((x) => [x.day, x.meetingUrl]))); setMsg(''); } catch (e: any) { setMsg(e?.message || 'Could not load.'); }
  }, [call]);

  useEffect(() => { (window as any).openOnlineAdmin = () => { setOpen(true); load(); }; return () => { delete (window as any).openOnlineAdmin; }; }, [load]);
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [open]);
  if (!open) return null;

  const saveLink = async (day: string) => { try { await call('adminSetMeetingLink', { day, url: links[day] || '' }); setMsg('Meeting link saved for ' + pretty(day) + '.'); } catch (e: any) { setMsg(e?.message || 'Could not save.'); } };
  const showRoster = async (day: string) => { try { const d = await call('adminDayRoster', { day }); setRoster({ day, people: d.people || [] }); } catch (e: any) { setMsg(e?.message || 'Could not load.'); } };
  const mark = async (p: Person, attended: boolean) => {
    if (!roster) return;
    try { await call('adminMarkAttendance', { invoiceNumber: p.invoiceNumber, day: roster.day, attended }); await showRoster(roster.day); load(); setMsg(attended ? 'Attendance recorded.' : 'Attendance cleared.'); } catch (e: any) { setMsg(e?.message || 'Could not save.'); }
  };

  return (
    <div className="online-admin-overlay" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <section className="online-admin" role="dialog" aria-modal="true" aria-label="Online classes">
        <div className="row" style={{ justifyContent: 'space-between' }}><h2>💻 Live Online Classroom</h2><button type="button" onClick={() => setOpen(false)}>Close</button></div>
        <p className="hint">Live online classes are always available for the five eligible classes and use the same booking calendar as in-person classes. Each calendar day is a web day (💻) or an in-person day (🏫): whichever type books first sets the day, and the other type is refused for it. Day 2 (range) is always in person.</p>
        <h3>Upcoming days with bookings</h3>
        {days.length === 0 && <p className="hint">No days are claimed yet. A day appears here when the first booking for it is made.</p>}
        {days.map((d) => (
          <div className="sess" key={d.day}>
            <span><strong>{d.mode === 'online' ? '💻 Web day' : '🏫 In-person day'}</strong> · {pretty(d.day)} · {d.bookings} booked · {d.attended} attended</span>
            <span className="row">
              {d.mode === 'online' && <><input aria-label={'Meeting link for ' + pretty(d.day)} placeholder="Meeting link (https://...)" style={{ minWidth: 200 }} value={links[d.day] || ''} onChange={(e) => setLinks({ ...links, [d.day]: e.target.value })} /><button type="button" onClick={() => saveLink(d.day)}>Save link</button></>}
              <button type="button" onClick={() => showRoster(d.day)}>Roster</button>
            </span>
          </div>
        ))}
        {roster && (
          <>
            <h3>Roster: {pretty(roster.day)}</h3>
            {roster.people.length === 0 && <p className="hint">Nobody is booked yet.</p>}
            {roster.people.map((p) => (
              <div className="sess" key={p.invoiceNumber}>
                <span>{p.email || p.invoiceNumber} · {p.role === 'day2' ? 'Day 2 range' : 'Day 1'} · {p.status === 'PENDING' ? 'not paid yet' : 'paid'} · {p.attendedAt ? 'attended' : 'not marked'}</span>
                <span className="row">{p.attendedAt ? <button type="button" onClick={() => mark(p, false)}>Undo</button> : <button type="button" className="primary" onClick={() => mark(p, true)}>Mark attended</button>}</span>
              </div>
            ))}
            <p className="hint">Certificates for live online students unlock only after their Day 2 range day is marked attended.</p>
          </>
        )}
        <div className="msg" role="status">{msg}</div>
      </section>
    </div>
  );
}
