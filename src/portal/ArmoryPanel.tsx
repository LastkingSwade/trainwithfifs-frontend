'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import './rangeJournal.css';
import './armory.css';
import { ARMORY_TEXT } from '../shell/tabLogic';
import { MAINT_LABEL, TYPE_INFO, describe, filterItems, lastService, maskSerial, money, reminderFor, reminderText, toCsv, type AItem, type ItemType, type Maint, type MaintKind } from './armoryLogic';
import { prettyDay, todayISO } from './rangeLogic';
import ArmoryDiagram from './ArmoryDiagram';
import { buildInsurancePackage, type PackageDoc } from './insurancePackage';

interface State { enabled: boolean; available: boolean; items: AItem[] }
interface Form { id: string; nickname: string; type: ItemType; make: string; model: string; caliber: string; serial: string; purchasedOn: string; price: string; notes: string; maintenance: Maint[]; serviceEveryMonths: string }
const EMPTY = (): Form => ({ id: '', nickname: '', type: 'handgun', make: '', model: '', caliber: '', serial: '', purchasedOn: '', price: '', notes: '', maintenance: [], serviceEveryMonths: '' });
const fromItem = (i: AItem): Form => ({ id: i.id, nickname: i.nickname, type: i.type, make: i.make, model: i.model, caliber: i.caliber, serial: i.serial, purchasedOn: i.purchasedOn, price: i.price === null ? '' : String(i.price), notes: i.notes, maintenance: i.maintenance.map((m) => ({ ...m })) , serviceEveryMonths: i.serviceEveryMonths ? String(i.serviceEveryMonths) : '' });

// The signed-in person's own private Armory. Every call goes to the server, which uses the verified login as the owner and decrypts records only for that owner. Nothing here is stored in the
// browser; the records are dropped from memory when the panel closes. Staff cannot see them. All text is rendered as text.
export default function ArmoryPanel() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<State | null>(null);
  const [msg, setMsg] = useState('');
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Form | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [confirm, setConfirm] = useState('');
  const [query, setQuery] = useState('');
  const [partsFor, setPartsFor] = useState('');
  const [withSerials, setWithSerials] = useState(false);
  const panel = useRef<HTMLElement | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const call = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const fn = (window as any).callFifsBackend;
    if (typeof fn !== 'function') throw new Error('The page is still loading.');
    return fn(action, payload);
  }, []);
  const load = useCallback(async () => { try { const d = await call('armoryList'); setData({ enabled: d.enabled !== false, available: d.available !== false, items: d.items || [] }); setMsg(''); } catch (e: any) { setMsg(e?.message || 'Could not load your armory.'); } }, [call]);
  const say = (t: string) => { setToast(t); if (toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 4000); };
  const close = useCallback(() => { setOpen(false); setData(null); setForm(null); setRevealed({}); setConfirm(''); setQuery(''); }, []);

  useEffect(() => { (window as any).openArmory = () => { setOpen(true); setMsg(''); setToast(''); setForm(null); setRevealed({}); setConfirm(''); setQuery(''); setData(null); load(); }; return () => { delete (window as any).openArmory; }; }, [load]);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { if (confirm) setConfirm(''); else if (form) setForm(null); else close(); return; }
      if (e.key !== 'Tab' || !panel.current) return;
      const f = Array.from(panel.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]')).filter((x) => x.offsetParent !== null);
      if (!f.length) return; const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [open, confirm, form, close]);
  useEffect(() => { if (open) window.setTimeout(() => panel.current?.querySelector<HTMLElement>('.rj-close')?.focus(), 60); }, [open]);
  if (!open) return null;

  const items = data?.items || []; const shown = filterItems(items, query);
  const run = async (fn: () => Promise<void>) => { setBusy(true); try { await fn(); } catch (e: any) { setMsg(e?.message || 'That did not work. Please try again.'); } finally { setBusy(false); } };
  const setF = (k: keyof Form) => (e: { target: { value: string } }) => setForm((f) => (f ? { ...f, [k]: e.target.value } : f));
  const save = (e: React.FormEvent) => { e.preventDefault(); if (!form) return; void run(async () => { await call('armorySave', { ...form }); setForm(null); setMsg(''); say('✅ Saved and encrypted.'); await load(); }); };
  const del = (id: string) => run(async () => { await call('armoryDelete', { id }); setConfirm(''); say('Item deleted.'); await load(); });
  const wipe = () => run(async () => { await call('armoryDeleteAll'); setConfirm(''); say('Your armory was deleted.'); await load(); });
  const exportCsv = () => { const url = URL.createObjectURL(new Blob([toCsv(items)], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = `fifs-armory-${todayISO()}.csv`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); say('⬇️ Your records were exported. Keep that file private.'); };
  const addMaint = () => setForm((f) => (f ? { ...f, maintenance: [...f.maintenance, { id: '', on: todayISO(), kind: 'cleaning', note: '' }] } : f));
  const setMaint = (idx: number, patch: Partial<Maint>) => setForm((f) => (f ? { ...f, maintenance: f.maintenance.map((m, i) => (i === idx ? { ...m, ...patch } : m)) } : f));
  const delMaint = (idx: number) => setForm((f) => (f ? { ...f, maintenance: f.maintenance.filter((_, i) => i !== idx) } : f));

  return (
    <div className="rj-overlay ar-overlay" data-organic="skip" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <section className="rj ar" role="dialog" aria-modal="true" aria-labelledby="ar-title" ref={panel}>
        <header className="rj-head">
          <div><span className="rj-bar" aria-hidden="true" /><h2 id="ar-title">🛡️ Armory</h2><p className="rj-tag">Encrypted. Private to you. Staff cannot see it.</p></div>
          <button type="button" className="rj-close" onClick={close} aria-label="Close your armory">✕</button>
        </header>

        {msg && <p className="rj-msg" role="alert">⚠️ {msg}</p>}
        <div className="rj-toast" role="status" aria-live="polite">{toast}</div>
        {!data && !msg && <p className="rj-empty">Loading your armory…</p>}
        {data && !data.enabled && (<div className="ar-soon"><h3>{ARMORY_TEXT.title}</h3><p>{ARMORY_TEXT.body}</p></div>)}
        {data && data.enabled && !data.available && <p className="rj-empty">The armory is not set up yet. Please check back soon.</p>}

        {data && data.enabled && data.available && !form && (
          <>
            <p className="rj-note" role="note">🔒 Every record here is encrypted. Please do not enter where you store firearms, safe combinations or home-security details.</p>
            <div className="ar-bar">
              <input type="search" aria-label="Search your armory" placeholder="Search name, make, model or caliber" value={query} onChange={(e) => setQuery(e.target.value)} />
              <button type="button" className="rj-primary" onClick={() => { setForm(EMPTY()); setMsg(''); }} disabled={items.length >= 50}>＋ Add item</button>
            </div>
            {(() => { const due = items.map((i) => ({ i, r: reminderFor(i, todayISO()) })).filter((x) => x.r.state === 'due' || x.r.state === 'soon');
              return due.length ? (<section className="ar-reminders" aria-labelledby="ar-rem-t"><h3 id="ar-rem-t"><span aria-hidden="true">🛠️ </span>Service reminders</h3><p className="rj-note">Shown here when you open your Armory. Nothing is sent to your phone.</p><ul className="rj-list">{due.map((x) => <li key={x.i.id}>{x.i.nickname}: {reminderText(x.r)}</li>)}</ul></section>) : null; })()}
            {items.length === 0 ? <p className="rj-empty">Nothing here yet. Add your first item to start your private records.</p> : shown.length === 0 ? <p className="rj-empty">No items match that search.</p> : (
              <ul className="ar-grid">
                {shown.map((i) => (
                  <li key={i.id} className="ar-card">
                    <div className="ar-top"><span className="ar-ico" aria-hidden="true">{(TYPE_INFO[i.type] || TYPE_INFO.other).emoji}</span><h3>{i.nickname}</h3><span className="rj-pill alt">{(TYPE_INFO[i.type] || TYPE_INFO.other).label}</span></div>
                    {i.unreadable ? <p className="rj-msg">This record could not be read. It may be damaged. You can delete it.</p> : (
                      <>
                        {describe(i) && <p className="ar-desc">{describe(i)}</p>}
                        {i.serial && <p className="ar-serial"><span>Serial:</span> <b aria-live="polite">{revealed[i.id] ? i.serial : maskSerial(i.serial)}</b><button type="button" className="rj-ghost" aria-pressed={!!revealed[i.id]} aria-label={`${revealed[i.id] ? 'Hide' : 'Show'} the serial number for ${i.nickname}`} onClick={() => setRevealed((r) => ({ ...r, [i.id]: !r[i.id] }))}>{revealed[i.id] ? '🙈 Hide' : '👁️ Show'}</button></p>}
                        <p className="ar-meta">{i.purchasedOn ? `Bought ${prettyDay(i.purchasedOn)}` : ''}{i.price !== null ? `${i.purchasedOn ? ' · ' : ''}${money(i.price)}` : ''}</p>
                        <p className="ar-meta">🛠️ {i.maintenance.length ? `${i.maintenance.length} maintenance ${i.maintenance.length === 1 ? 'entry' : 'entries'} · last ${prettyDay(lastService(i))}` : 'No maintenance logged yet'}</p>
                        {(() => { const r = reminderFor(i, todayISO()); return r.state !== 'none' ? <p className={'ar-meta ar-rem ' + r.state}>🛠️ {reminderText(r)}</p> : null; })()}
                        {i.notes && <p className="ar-notes">{i.notes}</p>}
                      </>
                    )}
                    {!i.unreadable && i.type === 'handgun' && <button type="button" className="rj-secondary ar-parts-btn" aria-expanded={partsFor === i.id} aria-controls={`ar-parts-${i.id}`} onClick={() => setPartsFor(partsFor === i.id ? '' : i.id)}>{partsFor === i.id ? '🔼 Hide parts view' : '🔍 Parts view'}</button>}
                    {partsFor === i.id && <div id={`ar-parts-${i.id}`}><ArmoryDiagram /></div>}
                    <div className="ar-actions">
                      {!i.unreadable && <button type="button" className="rj-secondary" onClick={() => { setForm(fromItem(i)); setMsg(''); }}>✏️ Edit</button>}
                      {confirm === 'i' + i.id ? <span className="rj-confirm"><button type="button" className="danger" onClick={() => del(i.id)}>Yes, delete</button><button type="button" onClick={() => setConfirm('')}>Cancel</button></span>
                        : <button type="button" className="rj-ghost" aria-label={`Delete ${i.nickname}`} onClick={() => setConfirm('i' + i.id)}>🗑️</button>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <footer className="rj-foot">
              <label className="ar-pkg-check"><input type="checkbox" checked={withSerials} onChange={(e) => setWithSerials(e.target.checked)} /> Include serial numbers in the insurance package (off unless you tick this)</label>
              <button type="button" className="rj-secondary" disabled={!items.length || busy} onClick={() => run(async () => {
                let docs: PackageDoc[] = [];
                try { const st = await call('walletStatus'); if (st && st.enabled && st.consented && Array.isArray(st.docs)) docs = st.docs.map((d: any) => ({ kindLabel: String(d.kindLabel || 'Document'), createdAt: String(d.createdAt || ''), expiresOn: d.expiresOn || null })); } catch { /* the package lists the armory only */ }
                const url = URL.createObjectURL(new Blob([buildInsurancePackage({ items, docs, includeSerials: withSerials, today: todayISO() })], { type: 'text/csv;charset=utf-8' }));
                const a = document.createElement('a'); a.href = url; a.download = `fifs-insurance-package-${todayISO()}.csv`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); say('🧾 Insurance package downloaded. Keep that file private.');
              })}>🧾 Insurance package (CSV)</button>
              <button type="button" className="rj-secondary" onClick={exportCsv} disabled={!items.length}>⬇️ Export my records (CSV)</button>
              {confirm === 'all' ? <span className="rj-confirm" role="alert"><span>Delete your whole armory? This cannot be undone.</span><button type="button" className="danger" onClick={wipe}>Yes, delete everything</button><button type="button" onClick={() => setConfirm('')}>Cancel</button></span>
                : <button type="button" className="rj-ghost wide" onClick={() => setConfirm('all')} disabled={!items.length}>🗑️ Delete my armory</button>}
            </footer>
          </>
        )}

        {data && data.enabled && data.available && form && (
          <form onSubmit={save} className="rj-card ar-form">
            <h3>{form.id ? 'Edit item' : 'Add item'}</h3>
            <p className="rj-note" role="note">🚫 Please do not enter where you store firearms, safe combinations or home-security details.</p>
            <div className="rj-form">
              <label>Nickname<input type="text" required maxLength={40} placeholder="e.g. Range pistol" value={form.nickname} onChange={setF('nickname')} /></label>
              <label>Type<select value={form.type} onChange={setF('type')}>{(Object.keys(TYPE_INFO) as ItemType[]).map((t) => <option key={t} value={t}>{TYPE_INFO[t].label}</option>)}</select></label>
              <label>Make<input type="text" maxLength={60} value={form.make} onChange={setF('make')} /></label>
              <label>Model<input type="text" maxLength={60} value={form.model} onChange={setF('model')} /></label>
              <label>Caliber<input type="text" maxLength={30} placeholder="e.g. 9mm" value={form.caliber} onChange={setF('caliber')} /></label>
              <label>Serial number (optional)<input type="text" maxLength={40} autoComplete="off" value={form.serial} onChange={setF('serial')} /></label>
              <label>Service every (months, optional)<input type="number" inputMode="numeric" min={1} max={60} placeholder="e.g. 12" value={form.serviceEveryMonths} onChange={setF('serviceEveryMonths')} /></label>
              <label>Purchase date (optional)<input type="date" max={todayISO()} value={form.purchasedOn} onChange={setF('purchasedOn')} /></label>
              <label>Price paid (optional)<input type="text" inputMode="decimal" placeholder="e.g. 549.99" value={form.price} onChange={setF('price')} /></label>
              <label className="rj-wide">Notes<textarea rows={3} maxLength={1000} value={form.notes} onChange={setF('notes')} /></label>
            </div>
            <h3 className="ar-sub">🛠️ Maintenance log</h3>
            {form.maintenance.length === 0 && <p className="rj-empty">No entries yet.</p>}
            <ul className="rj-list">
              {form.maintenance.map((m, idx) => (
                <li key={idx} className="ar-maint">
                  <label>Date<input type="date" required max={todayISO()} value={m.on} onChange={(e) => setMaint(idx, { on: e.target.value })} /></label>
                  <label>Type<select value={m.kind} onChange={(e) => setMaint(idx, { kind: e.target.value as MaintKind })}>{(Object.keys(MAINT_LABEL) as MaintKind[]).map((k) => <option key={k} value={k}>{MAINT_LABEL[k]}</option>)}</select></label>
                  <label className="rj-grow">Note<input type="text" maxLength={200} value={m.note} onChange={(e) => setMaint(idx, { note: e.target.value })} /></label>
                  <button type="button" className="rj-ghost" aria-label={`Remove maintenance entry ${idx + 1}`} onClick={() => delMaint(idx)}>🗑️</button>
                </li>
              ))}
            </ul>
            <button type="button" className="rj-secondary" onClick={addMaint} disabled={form.maintenance.length >= 100}>＋ Add maintenance entry</button>
            <div className="ar-formactions">
              <button type="submit" className="rj-primary" disabled={busy}>{busy ? 'Saving…' : '🔒 Save (encrypted)'}</button>
              <button type="button" className="rj-secondary" onClick={() => setForm(null)} disabled={busy}>Cancel</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
