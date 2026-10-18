'use client';

import { useCallback, useEffect, useState } from 'react';
import '../online/online.css';

interface Row { name: string; email: string; percent: number; requiredDone: number; required: number; phase: string; next: string; updatedAt: string; tracking: Record<string, string> }
const when = (iso: string) => (iso ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '');

// Admin Hub: who has started the Mid-Atlantic Multi-State application guide and where each person is. Read only; the server checks the staff role.
export default function AdminMultiStatePanel() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [setup, setSetup] = useState(false);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    const fn = (window as any).callFifsBackend; if (typeof fn !== 'function') { setMsg('The page is still loading.'); return; }
    setLoading(true); setMsg('');
    try { const d = await fn('adminMultiStateList', {}); setRows(d.rows || []); setSetup(!!d.setupNeeded); } catch (e: any) { setMsg(e?.message || 'Could not load progress.'); }
    setLoading(false);
  }, []);
  useEffect(() => { (window as any).openAdminMultiState = () => { setOpen(true); load(); }; return () => { delete (window as any).openAdminMultiState; }; }, [load]);
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [open]);
  if (!open) return null;
  return (
    <div className="online-admin-overlay" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <section className="online-admin" style={{ width: 'min(96vw, 900px)' }} role="dialog" aria-modal="true" aria-label="Multi-state application progress">
        <div className="row" style={{ justifyContent: 'space-between' }}><h2>🧭 Multi-State progress</h2><span className="row"><button type="button" onClick={load}>Refresh</button><button type="button" onClick={() => setOpen(false)}>Close</button></span></div>
        <p className="hint">Everyone who has started the Mid-Atlantic Multi-State application guide, newest activity first. You also get a Discord message each time someone checks off a step.</p>
        {setup && <p className="hint" role="alert">One-time setup needed: run <strong>scripts/sql/20261019_multistate_progress.sql</strong> in the SQL editor of your database, then reload this list.</p>}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
            <thead><tr style={{ textAlign: 'left' }}>{['Student', 'Progress', 'Now in', 'Next up', 'Tracking', 'Last change'].map((h) => <th key={h} scope="col" style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td style={{ padding: '6px 8px' }}><strong>{r.name}</strong><br /><span className="hint">{r.email}</span></td>
                  <td style={{ padding: '6px 8px' }}>{r.requiredDone}/{r.required} ({r.percent}%)</td>
                  <td style={{ padding: '6px 8px' }}>{r.phase}</td>
                  <td style={{ padding: '6px 8px' }}>{r.next}</td>
                  <td style={{ padding: '6px 8px' }}>{Object.entries(r.tracking).map(([k, v]) => k.toUpperCase() + ': ' + v).join(' · ') || '—'}</td>
                  <td style={{ padding: '6px 8px' }}>{when(r.updatedAt)}</td>
                </tr>
              ))}
              {!rows.length && !loading && !setup && <tr><td colSpan={6} style={{ padding: 18, textAlign: 'center', color: 'var(--text-muted)' }}>Nobody has started yet.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="msg" role="status">{loading ? 'Loading…' : msg}</div>
      </section>
    </div>
  );
}
