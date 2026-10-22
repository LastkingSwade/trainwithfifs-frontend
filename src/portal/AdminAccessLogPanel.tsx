'use client';

import { useCallback, useEffect, useState } from 'react';
import '../online/online.css';

interface Entry { id: string; at: string; staff: string; action: string; actionLabel: string; studentId: string; outcome: string }
const when = (iso: string) => (iso ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '');
const RESULT: Record<string, string> = { ok: '✅ done', sent: '✅ reminder sent', already_signed: 'ℹ️ already signed, nothing sent', too_soon: '⏳ one was already sent in the last 24 hours', not_sent: 'nothing sent', failed: '⚠️ did not go through' };

// Admin Hub: a read-only list of who on the staff opened the waiver list or a student's waiver, or sent a waiver reminder, and when. It never shows what a waiver says.
// The server only answers the administrator login.
export default function AdminAccessLogPanel() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [available, setAvailable] = useState(true);
  const [keep, setKeep] = useState(12);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const fn = (window as any).callFifsBackend;
    try { if (typeof fn !== 'function') throw new Error('The page is still loading.'); const d = await fn('adminAccessLogList'); setEntries(d.entries || []); setAvailable(d.available !== false); setKeep(d.keepMonths || 12); setMsg(''); }
    catch (e: any) { setEntries([]); setMsg(/Unauthorized|administrator/i.test(String(e?.message)) ? 'Only the administrator can see this log.' : (e?.message || 'Could not load.')); }
  }, []);

  useEffect(() => { (window as any).openAdminAccessLog = () => { setOpen(true); setMsg(''); load(); }; return () => { delete (window as any).openAdminAccessLog; }; }, [load]);
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [open]);
  if (!open) return null;

  return (
    <div className="online-admin-overlay" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <section className="online-admin" role="dialog" aria-modal="true" aria-label="Staff access log">
        <div className="row" style={{ justifyContent: 'space-between' }}><h2>🕵️ Staff access log</h2><button type="button" onClick={() => setOpen(false)}>Close</button></div>
        <p className="hint">Who on the staff opened the waiver list or a student&apos;s waiver, or sent a waiver reminder, and when. It never shows what a waiver says. The newest 200 entries are shown, and entries older than {keep} months are cleared automatically.</p>
        {!available && <p className="hint">The log is not set up yet. Run the access log setup file (20261030_staff_access_log.sql) to turn it on.</p>}
        {available && !msg && entries.length === 0 && <p className="hint">Nothing has been recorded yet.</p>}
        {entries.map((e) => (
          <div className="sess" key={e.id}>
            <span><strong>{e.actionLabel}</strong>{e.studentId ? <> · student {e.studentId}</> : null}<br /><small>{when(e.at)} · by {e.staff} · {RESULT[e.outcome] || e.outcome}</small></span>
          </div>
        ))}
        <div className="msg" role="status">{msg}</div>
      </section>
    </div>
  );
}
