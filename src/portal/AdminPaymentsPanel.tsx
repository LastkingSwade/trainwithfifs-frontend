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
interface Ledger { id: string; amount: number; methodLabel: string; receivedOn: string; note: string; recordedBy: string; voided: boolean; voidReason: string }
const METHOD_OPTIONS: Array<[string, string]> = [['cash', 'Cash'], ['check', 'Check'], ['money_order', 'Money order'], ['zelle', 'Zelle'], ['venmo', 'Venmo'], ['cash_app', 'Cash App'], ['card_in_person', 'Card in person'], ['other', 'Other']];
const todayET = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
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
  const [picked, setPicked] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState('');
  // Recording a payment received in person (cash, check...) on a booking whose deposit was paid online.
  const [detail, setDetail] = useState<Row | null>(null);
  const [ledger, setLedger] = useState<Ledger[]>([]);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [receivedOn, setReceivedOn] = useState('');
  const [note, setNote] = useState('');
  const [formMsg, setFormMsg] = useState<{ text: string; bad: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [voidFor, setVoidFor] = useState('');
  const [voidReason, setVoidReason] = useState('');

  const load = useCallback(async (f: string, q: string) => {
    const fn = (window as any).callFifsBackend;
    if (typeof fn !== 'function') { setMsg('The page is still loading.'); return; }
    setLoading(true);
    try { const d = await fn('adminPayments', { filter: f, search: q }); setRows(d.rows || []); setSum(d.summary || null); setPicked([]); setConfirming(false); setTyped(''); setMsg(d.truncated ? 'Showing the newest 500. Use the search box to narrow down.' : ''); } catch (e: any) { setMsg(e?.message || 'Could not load.'); }
    setLoading(false);
  }, []);

  useEffect(() => { (window as any).openAdminPayments = () => { const f = getPref('paymentsFilter', 'all'); setFilter(f); setOpen(true); load(f, ''); }; return () => { delete (window as any).openAdminPayments; }; }, [load]);
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [open]);
  if (!open) return null;

  const isPaid = (r: Row) => r.status === 'PAID' || r.status === 'DEPOSIT_PAID';
  const chosen = rows.filter((r) => picked.includes(r.invoiceNumber));
  const paidChosen = chosen.filter(isPaid).length;
  const toggle = (n: string) => { setConfirming(false); setTyped(''); setPicked((p) => (p.includes(n) ? p.filter((x) => x !== n) : p.length >= 50 ? p : [...p, n])); };
  const pickUnpaid = () => { setConfirming(false); setTyped(''); setPicked(rows.filter((r) => !isPaid(r)).slice(0, 50).map((r) => r.invoiceNumber)); };
  const doDelete = async () => {
    const fn = (window as any).callFifsBackend;
    try {
      const d = await fn('adminDeletePayments', { ids: picked, confirmPaid: paidChosen > 0 });
      setMsg(`Deleted ${d.deleted} payment record${d.deleted === 1 ? '' : 's'} from Future Initiative.${d.paidDeleted ? ' Money already received is still in Stripe; refund it there if needed.' : ''}`);
      await load(filter, search);
      setMsg(`Deleted ${d.deleted} payment record${d.deleted === 1 ? '' : 's'} from Future Initiative.${d.paidDeleted ? ' Money already received is still in Stripe; refund it there if needed.' : ''}`);
    } catch (e: any) { setConfirming(false); setMsg(e?.message || 'Could not delete.'); }
  };

  const loadLedger = async (invoice: string) => {
    const fn = (window as any).callFifsBackend;
    try { const d = await fn('adminInvoicePayments', { invoiceNumber: invoice }); setLedger(d.payments || []); setSetupNeeded(!!d.setupNeeded); } catch { setLedger([]); }
  };
  const openDetail = (r: Row) => { setDetail(r); setAmount(r.balance > 0 ? r.balance.toFixed(2) : ''); setMethod('cash'); setReceivedOn(todayET()); setNote(''); setFormMsg(null); setVoidFor(''); setVoidReason(''); setLedger([]); setSetupNeeded(false); loadLedger(r.invoiceNumber); };
  const afterChange = async (r: Row, d: any, text: string) => {
    setFormMsg({ text, bad: false });
    const next = { ...r, status: d.status || r.status, paid: Number(d.paid ?? r.paid), balance: Number(d.balance ?? r.balance) };
    setDetail(next); setAmount(next.balance > 0 ? next.balance.toFixed(2) : '');
    await loadLedger(r.invoiceNumber); await load(filter, search); setDetail(next); setFormMsg({ text, bad: false });
  };
  const savePayment = async () => {
    if (!detail || saving) return; setSaving(true); setFormMsg(null);
    try { const d = await (window as any).callFifsBackend('adminRecordPayment', { invoiceNumber: detail.invoiceNumber, amount, method, receivedOn, note }); await afterChange(detail, d, `Recorded ${usd(Number(d.amount))}. ${d.status === 'PAID' ? 'This booking is now paid in full.' : 'The balance is now ' + usd(Number(d.balance)) + '.'} The student's receipt is updated.`); setNote(''); }
    catch (e: any) { setFormMsg({ text: e?.message || 'Could not record the payment.', bad: true }); }
    setSaving(false);
  };
  const voidPayment = async (id: string) => {
    if (!detail || saving) return; setSaving(true); setFormMsg(null);
    try { const d = await (window as any).callFifsBackend('adminVoidPayment', { id, reason: voidReason }); setVoidFor(''); setVoidReason(''); await afterChange(detail, d, 'That payment was voided and the amount is back on the balance. It stays in the history.'); }
    catch (e: any) { setFormMsg({ text: e?.message || 'Could not void that payment.', bad: true }); }
    setSaving(false);
  };

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
        <p className="hint">This lists bookings and what has been paid. You can delete test attempts here (they are removed from Future Initiative). Payments the student made by card online are changed in Stripe. If a student pays the rest in cash, by check or any other way in person, open that booking with Record payment below.</p>
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
          <button type="button" onClick={pickUnpaid} disabled={!rows.length} title="Select every booking that was never paid, which is what most test attempts are">Select unpaid</button>
        </div>
        {picked.length > 0 && (
          <div className="sess" role="group" aria-label="Delete selected payments">
            <span><strong>{picked.length} selected</strong>{paidChosen > 0 ? ` · ${paidChosen} show money received` : ' · none show money received'}</span>
            <span className="row">
              {!confirming && <button type="button" className="primary" onClick={() => setConfirming(true)}>Delete selected…</button>}
              <button type="button" onClick={() => { setPicked([]); setConfirming(false); setTyped(''); }}>Clear</button>
            </span>
          </div>
        )}
        {confirming && (
          <div className="sess" role="alertdialog" aria-label="Confirm delete">
            <span>
              This permanently deletes {picked.length} payment record{picked.length === 1 ? '' : 's'} from Future Initiative and frees their calendar days. It does not refund or change anything in Stripe.
              {paidChosen > 0 && <> <strong>{paidChosen} of them show money received.</strong> Type DELETE to confirm.</>}
            </span>
            <span className="row">
              {paidChosen > 0 && <input aria-label="Type DELETE to confirm" placeholder="DELETE" style={{ width: 110 }} value={typed} onChange={(e) => setTyped(e.target.value)} />}
              <button type="button" className="primary" disabled={paidChosen > 0 && typed.trim() !== 'DELETE'} onClick={doDelete}>Yes, delete permanently</button>
              <button type="button" onClick={() => { setConfirming(false); setTyped(''); }}>Cancel</button>
            </span>
          </div>
        )}
        {detail && (
          <section className="sess" aria-label={'Payments for ' + detail.invoiceNumber} style={{ display: 'grid', gap: 10 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span><strong>{detail.invoiceNumber}</strong> · {detail.email} · {detail.course}<br />Total {usd(detail.total)} · Paid {usd(detail.paid)} · <strong>Balance {usd(detail.balance)}</strong> · {LABEL[detail.status] || detail.status}</span>
              <button type="button" onClick={() => setDetail(null)}>Close</button>
            </div>
            {setupNeeded && <p className="hint" role="alert">One-time setup needed before you can record payments: run <strong>scripts/sql/20261019_invoice_payments.sql</strong> in the SQL editor of your database, then reopen this booking.</p>}
            {ledger.length > 0 && (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }} aria-label="Payments recorded in person">
                {ledger.map((p) => (
                  <li key={p.id} style={{ opacity: p.voided ? 0.6 : 1 }}>
                    <span style={{ textDecoration: p.voided ? 'line-through' : 'none' }}>{usd(p.amount)} · {p.methodLabel} · received {day(p.receivedOn ? p.receivedOn + 'T12:00:00' : '')}{p.note ? ' · ' + p.note : ''}</span>
                    <span className="hint"> · recorded by {p.recordedBy}{p.voided ? ' · VOIDED: ' + p.voidReason : ''}</span>
                    {!p.voided && voidFor !== p.id && <button type="button" style={{ marginLeft: 8 }} onClick={() => { setVoidFor(p.id); setVoidReason(''); }}>Void…</button>}
                    {voidFor === p.id && (
                      <span className="row" style={{ marginTop: 4 }}>
                        <input aria-label="Reason for voiding" placeholder="Why? (for example: typed the wrong amount)" maxLength={200} style={{ flex: 1, minWidth: 220 }} value={voidReason} onChange={(e) => setVoidReason(e.target.value)} />
                        <button type="button" className="primary" disabled={saving || voidReason.trim().length < 3} onClick={() => voidPayment(p.id)}>Yes, void it</button>
                        <button type="button" onClick={() => setVoidFor('')}>Cancel</button>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {detail.status === 'DEPOSIT_PAID' && detail.balance > 0 && !setupNeeded ? (
              <form className="row" onSubmit={(e) => { e.preventDefault(); savePayment(); }} aria-label="Record a payment received in person">
                <label>Amount received $<input inputMode="decimal" aria-label="Amount received" style={{ width: 110 }} value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
                <label>How paid <select aria-label="How it was paid" value={method} onChange={(e) => setMethod(e.target.value)}>{METHOD_OPTIONS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
                <label>Date received <input type="date" aria-label="Date received" value={receivedOn} max={todayET()} onChange={(e) => setReceivedOn(e.target.value)} /></label>
                <input aria-label="Note (optional, staff only)" placeholder="Note (optional, only staff see it)" maxLength={200} style={{ flex: 1, minWidth: 200 }} value={note} onChange={(e) => setNote(e.target.value)} />
                <button type="submit" className="primary" disabled={saving}>{saving ? 'Saving…' : 'Record payment'}</button>
              </form>
            ) : (!setupNeeded && <p className="hint">{detail.status === 'PAID' ? 'This booking is paid in full.' : 'Only a booking with a confirmed online deposit and a balance can take a payment here.'}</p>)}
            {formMsg && <div className="msg" role={formMsg.bad ? 'alert' : 'status'} style={{ color: formMsg.bad ? '#ffb4b4' : undefined }}>{formMsg.text}</div>}
          </section>
        )}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead><tr style={{ textAlign: 'left' }}>{['', 'Date', 'Invoice', 'Email', 'Class', 'Status', 'Total', 'Paid', 'Balance', 'Payment'].map((h) => <th key={h} scope="col" style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.invoiceNumber}>
                  <td style={{ padding: '6px 8px' }}><input type="checkbox" aria-label={'Select ' + r.invoiceNumber} checked={picked.includes(r.invoiceNumber)} onChange={() => toggle(r.invoiceNumber)} style={{ width: 18, height: 18 }} /></td>
                  <td style={{ padding: '6px 8px' }}>{day(r.date)}</td><td style={{ padding: '6px 8px' }}>{r.invoiceNumber}</td><td style={{ padding: '6px 8px' }}>{r.email}</td>
                  <td style={{ padding: '6px 8px' }}>{r.course}{r.delivery === 'Live online' ? ' 💻' : ''}</td><td style={{ padding: '6px 8px' }}>{LABEL[r.status] || r.status}</td>
                  <td style={{ padding: '6px 8px' }}>{usd(r.total)}</td><td style={{ padding: '6px 8px' }}>{usd(r.paid)}</td><td style={{ padding: '6px 8px' }}>{usd(r.balance)}</td>
                  <td style={{ padding: '6px 8px' }}>{isPaid(r) && <button type="button" onClick={() => openDetail(r)} aria-label={(r.status === 'DEPOSIT_PAID' && r.balance > 0 ? 'Record payment for ' : 'Payment history for ') + r.invoiceNumber}>{r.status === 'DEPOSIT_PAID' && r.balance > 0 ? 'Record payment' : 'History'}</button>}</td>
                </tr>
              ))}
              {!rows.length && loading && [0, 1, 2, 3].map((i) => <tr key={'s' + i} aria-hidden="true"><td colSpan={10} style={{ padding: '10px 8px' }}><div className="fifs-skel" /></td></tr>)}
              {!rows.length && !loading && <tr><td colSpan={10} style={{ padding: 18, textAlign: 'center', color: 'var(--text-muted)' }}>No bookings match.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="msg" role="status">{loading ? 'Loading payments…' : msg}</div>
      </section>
    </div>
  );
}
