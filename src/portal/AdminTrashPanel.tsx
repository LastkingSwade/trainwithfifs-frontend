'use client';

import { useCallback, useEffect, useState } from 'react';
import '../online/online.css';

interface Item { id: string; kind: 'student' | 'client'; label: string; deletedBy: string; deletedAt: string; expiresAt: string; counts: Record<string, number> }
const when = (iso: string) => (iso ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '');
const daysLeft = (iso: string) => Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 86400000));
const NAMES: Record<string, string> = { students: 'student record', clients: 'client record', invoices: 'invoices', enrollments: 'class enrollments', messages: 'messages', user_permits: 'permits' };

// Admin Hub: put back a student or client that was deleted in the last 30 days. The server checks the staff role on every call.
export default function AdminTrashPanel() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [msg, setMsg] = useState('');
  const [confirmId, setConfirmId] = useState('');

  const call = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const fn = (window as any).callFifsBackend;
    if (typeof fn !== 'function') throw new Error('The page is still loading.');
    return fn(action, payload);
  }, []);
  const load = useCallback(async () => { try { const d = await call('adminTrashList'); setItems(d.items || []); setMsg(''); } catch (e: any) { setMsg(e?.message || 'Could not load.'); } }, [call]);

  useEffect(() => { (window as any).openAdminTrash = () => { setOpen(true); setConfirmId(''); load(); }; return () => { delete (window as any).openAdminTrash; }; }, [load]);
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [open]);
  if (!open) return null;

  const restore = async (it: Item) => {
    try {
      const d = await call('adminTrashRestore', { id: it.id });
      setConfirmId(''); setMsg(`Restored ${it.label}. ${d.skipped?.length ? 'Not restored: ' + d.skipped.join(', ') + '. ' : ''}${d.note || ''}`);
      load(); (window as any).refreshAdminRoster?.();
    } catch (e: any) { setConfirmId(''); setMsg(e?.message || 'Could not restore.'); }
  };

  return (
    <div className="online-admin-overlay" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <section className="online-admin" role="dialog" aria-modal="true" aria-label="Recently deleted">
        <div className="row" style={{ justifyContent: 'space-between' }}><h2>↩ Recently deleted</h2><button type="button" onClick={() => setOpen(false)}>Close</button></div>
        <p className="hint">Deleted students and clients are kept here for 30 days. Restoring puts back the record and its invoices, class enrollments, messages or permits. Their sign-in is not restored, so send a new invite afterwards.</p>
        {items.length === 0 && <p className="hint">Nothing has been deleted recently.</p>}
        {items.map((it) => (
          <div className="sess" key={it.id}>
            <span><strong>{it.kind === 'student' ? 'Student' : 'Client'}</strong> · {it.label}<br /><small>Deleted {when(it.deletedAt)} by {it.deletedBy || 'staff'} · {daysLeft(it.expiresAt)} days left · {Object.entries(it.counts).filter(([, n]) => n > 0).map(([t, n]) => `${n} ${NAMES[t] || t}`).join(', ')}</small></span>
            <span className="row">
              {confirmId === it.id
                ? (<><button type="button" className="primary" onClick={() => restore(it)}>Yes, restore</button><button type="button" onClick={() => setConfirmId('')}>Cancel</button></>)
                : <button type="button" onClick={() => setConfirmId(it.id)}>Restore</button>}
            </span>
          </div>
        ))}
        <div className="msg" role="status">{msg}</div>
      </section>
    </div>
  );
}
