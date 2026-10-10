'use client';

import { useCallback, useEffect, useState } from 'react';
import '../online/online.css';
import { getPref, setPref } from './prefs';

interface Row { invoiceNumber: string; email: string; course: string; status: string; total: number; paid: number; balance: number; date: string; delivery: string }
interface Summary { collected: number; outstanding: number; paidInFull: number; deposits: number; pending: number; other: number }
const FILTERS: Array<[string, string]> = [['all', 'All'], ['PAID', 'Paid in full'], ['DEPOSIT_PAID', 'Deposit paid'], ['PENDING', 'Not paid yet'], ['ABANDONED', 'Abandoned'], ['CANCELLED', 'Cancelled']];
const LABEL: Record<string, string> = { PAID: 'Paid in full', DEPOSIT_PAID: 'Deposit paid', PENDING: 'Not paid yet', ABANDONED: 'Abandoned', CANCELLED: 'Cancelled' };
const usd = (n: number) => '$' + n.toFixed(2);
const day = (iso: string) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');
const csvCell = (v: string | number) => { let t = String(v); if (/^[=+\-@\t\r]/.test(t)) t = "'" + t; return '"' + t.replace(/"/g, '""') + '"'; };

// Admin Hub: who has paid, who owes a balance, and what is still unpaid. Read only; the server checks the staff role on every call.
export default function AdminPaymentsPanel() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [sum, setSum] = useState<Summary | null>(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (f: string, q: string) => {
    const fn = (window as any).callFifsBackend;
    if (typeof fn !== 'function') { setMsg('The page is still loading.'); return; }
    setLoading(true);
    try { const d = await fn('adminPayments', { filter: f, search: q }); setRows(d.rows || []); setSum(d.summary || null); setMsg(d.truncated ? 'Showing the newest 500. Use the search box to narrow down.' : ''); } catch (e: any) { setMsg(e?.message || 'Could not load.'); }
    setLoading(false);
  }, []);

  useEffect(() => { (window as any).openAdminPayments = () => { const f = getPref('paymentsFilter', 'all'); setFilter(f); setOpen(true); load(f, ''); }; return () => { delete (window as any).openAdminPayments; }; }, [load]);
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [open]);
  if (!open) return null;

  const exportCsv = () => {
    const head = ['Invoice', 'Email', 'Class', 'Delivery', 'Status', 'Total', 'Paid', 'Balance', 'Date'];
    const lines = [head.map(csvCell).join(',')].concat(rows.map((r) => [r.invoiceNumber, r.email, r.course, r.delivery, LABEL[r.status] || r.status, r.total.toFixed(2), r.paid.toFixed(2), r.balance.toFixed(2), day(r.date)].map(csvCell).join(',')));
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'fifs-payments.csv'; document.body.appendChild(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return (
    <div className="online-admin-overlay" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <section className="online-admin" style={{ width: 'min(96vw, 980px)' }} role="dialog" aria-modal="true" aria-label="Payments">
        <div className="row" style={{ justifyContent: 'space-between' }}><h2>💵 Payments</h2><button type="button" onClick={() => setOpen(false)}>Close</button></div>
        <p className="hint">Read only. This lists bookings and what has been paid. Refunds and changes are still made in Stripe.</p>
        {sum && (
          <div className="row" aria-label="Totals">
            <span className="sess" style={{ flex: 1, minWidth: 140 }}><span>Collected</span><strong>{usd(sum.collected)}</strong></span>
            <span className="sess" style={{ flex: 1, minWidth: 140 }}><span>Balances due</span><strong>{usd(sum.outstanding)}</strong></span>
            <span className="sess" style={{ flex: 1, minWidth: 140 }}><span>Paid in full</span><strong>{sum.paidInFull}</strong></span>
            <span className="sess" style={{ flex: 1, minWidth: 140 }}><span>Deposits</span><strong>{sum.deposits}</strong></span>
            <span className="sess" style={{ flex: 1, minWidth: 140 }}><span>Not paid yet</span><strong>{sum.pending}</strong></span>
          </div>
        )}
        <div className="row">
          <select aria-label="Show" value={filter} onChange={(e) => { setFilter(e.target.value); setPref('paymentsFilter', e.target.value); load(e.target.value, search); }}>{FILTERS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <input type="search" aria-label="Search by invoice, email or class" placeholder="Search invoice, email or class" style={{ flex: 1, minWidth: 200 }} value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') load(filter, search); }} />
          <button type="button" onClick={() => load(filter, search)}>Search</button>
          <button type="button" onClick={exportCsv} disabled={!rows.length}>Download CSV</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead><tr style={{ textAlign: 'left' }}>{['Date', 'Invoice', 'Email', 'Class', 'Status', 'Total', 'Paid', 'Balance'].map((h) => <th key={h} scope="col" style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.invoiceNumber}>
                  <td style={{ padding: '6px 8px' }}>{day(r.date)}</td><td style={{ padding: '6px 8px' }}>{r.invoiceNumber}</td><td style={{ padding: '6px 8px' }}>{r.email}</td>
                  <td style={{ padding: '6px 8px' }}>{r.course}{r.delivery === 'Live online' ? ' 💻' : ''}</td><td style={{ padding: '6px 8px' }}>{LABEL[r.status] || r.status}</td>
                  <td style={{ padding: '6px 8px' }}>{usd(r.total)}</td><td style={{ padding: '6px 8px' }}>{usd(r.paid)}</td><td style={{ padding: '6px 8px' }}>{usd(r.balance)}</td>
                </tr>
              ))}
              {!rows.length && loading && [0, 1, 2, 3].map((i) => <tr key={'s' + i} aria-hidden="true"><td colSpan={8} style={{ padding: '10px 8px' }}><div className="fifs-skel" /></td></tr>)}
              {!rows.length && !loading && <tr><td colSpan={8} style={{ padding: 18, textAlign: 'center', color: 'var(--text-muted)' }}>No bookings match.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="msg" role="status">{loading ? 'Loading payments…' : msg}</div>
      </section>
    </div>
  );
}
