'use client';

import { useCallback, useEffect, useState } from 'react';
import '../online/online.css';

interface Doc { id: string; kind: string; kindLabel: string; mime: string; sizeBytes: number; expiresOn: string | null; createdAt: string }
interface Status { enabled: boolean; consented: boolean; docs: Doc[]; maxBytes: number; kinds: Record<string, string> }
const day = (iso: string) => (iso ? new Date(iso.length === 10 ? iso + 'T12:00:00Z' : iso).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' }) : '');
const kb = (n: number) => (n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
const toBase64 = (file: File) => new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result).split(',')[1] || ''); r.onerror = () => reject(new Error('Could not read that file.')); r.readAsDataURL(file); });

// The signed-in person's own document wallet. Every call goes to the server, which uses the verified login as the owner.
export default function WalletPanel() {
  const [open, setOpen] = useState(false);
  const [st, setSt] = useState<Status | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState('permit_card');
  const [expires, setExpires] = useState('');
  const [agree, setAgree] = useState(false);
  const [confirmId, setConfirmId] = useState('');

  const call = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const fn = (window as any).callFifsBackend;
    if (typeof fn !== 'function') throw new Error('The page is still loading.');
    return fn(action, payload);
  }, []);
  const load = useCallback(async () => { try { setSt(await call('walletStatus')); } catch (e: any) { setMsg(e?.message || 'Could not load your wallet.'); } }, [call]);

  useEffect(() => { (window as any).openWallet = () => { setOpen(true); setMsg(''); setConfirmId(''); setAgree(false); load(); }; return () => { delete (window as any).openWallet; }; }, [load]);
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [open]);
  if (!open) return null;

  const accept = async () => { try { await call('walletConsent'); setMsg(''); await load(); } catch (e: any) { setMsg(e?.message || 'Could not save your choice.'); } };
  const upload = async (file: File | undefined) => {
    if (!file || !st) return;
    if (file.size > st.maxBytes) { setMsg('That file is larger than 3 MB. Choose a smaller PDF or photo.'); return; }
    setBusy(true); setMsg('Encrypting and saving…');
    try { await call('walletUpload', { kind, expiresOn: expires || undefined, dataBase64: await toBase64(file) }); setMsg('Saved to your wallet.'); setExpires(''); await load(); } catch (e: any) { setMsg(e?.message || 'Could not save that file.'); }
    setBusy(false);
  };
  const view = async (d: Doc) => {
    try {
      const r = await call('walletOpen', { id: d.id });
      const bytes = Uint8Array.from(atob(r.dataBase64), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: r.mime }));
      const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.download = r.fileName; document.body.appendChild(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e: any) { setMsg(e?.message || 'Could not open that document.'); }
  };
  const remove = async (d: Doc) => { try { await call('walletDelete', { id: d.id }); setConfirmId(''); setMsg('Deleted.'); await load(); } catch (e: any) { setConfirmId(''); setMsg(e?.message || 'Could not delete.'); } };

  return (
    <div className="online-admin-overlay" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <section className="online-admin" role="dialog" aria-modal="true" aria-label="Document wallet">
        <div className="row" style={{ justifyContent: 'space-between' }}><h2>🔐 My document wallet</h2><button type="button" onClick={() => setOpen(false)}>Close</button></div>
        {!st && <div className="fifs-skel" style={{ height: 60 }} aria-label="Loading" />}
        {st && !st.enabled && <p className="hint">The document wallet is not available yet. Please check back soon.</p>}
        {st && st.enabled && !st.consented && (
          <>
            <p className="hint">Before you start, please read this:</p>
            <ul className="hint" style={{ paddingLeft: 18, lineHeight: 1.6 }}>
              <li>This is a private place for <strong>your own</strong> permit card, class certificate, HQL approval or other ID.</li>
              <li>Only you can open your files. Staff cannot see them. Files are encrypted before they are stored.</li>
              <li><strong>Do not upload</strong> firearm serial numbers, photos of firearms, where you keep them at home, or any gun registry-style records. This wallet is not for those.</li>
              <li>You can delete any file at any time. If your account is removed, your files are removed too.</li>
            </ul>
            <label className="sw"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> I understand and want to turn on my document wallet.</label>
            <div className="row"><button type="button" className="primary" disabled={!agree} onClick={accept}>Turn on my wallet</button></div>
          </>
        )}
        {st && st.enabled && st.consented && (
          <>
            <h3>Add a document</h3>
            <div className="row">
              <select aria-label="Document type" value={kind} onChange={(e) => setKind(e.target.value)}>{Object.entries(st.kinds).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
              <label className="sw" style={{ minHeight: 40 }}>Expires <input type="date" aria-label="Expiration date (optional)" value={expires} onChange={(e) => setExpires(e.target.value)} /></label>
              <label className="sw primary" style={{ cursor: busy ? 'wait' : 'pointer' }}>Choose a file<input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" disabled={busy} style={{ display: 'none' }} onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} /></label>
            </div>
            <p className="hint">PDF, PNG, JPG or WEBP, up to 3 MB. No firearm serial numbers, gun photos or storage details.</p>
            <h3>Your documents</h3>
            {st.docs.length === 0 && <p className="hint">Nothing here yet. Add your permit card or class certificate above.</p>}
            {st.docs.map((d) => (
              <div className="sess" key={d.id}>
                <span><strong>{d.kindLabel}</strong> · {kb(d.sizeBytes)} · added {day(d.createdAt)}{d.expiresOn ? ` · expires ${day(d.expiresOn)}` : ''}</span>
                <span className="row">
                  <button type="button" onClick={() => view(d)}>Open</button>
                  {confirmId === d.id ? (<><button type="button" className="primary" onClick={() => remove(d)}>Yes, delete</button><button type="button" onClick={() => setConfirmId('')}>Cancel</button></>) : <button type="button" onClick={() => setConfirmId(d.id)}>Delete</button>}
                </span>
              </div>
            ))}
          </>
        )}
        <div className="msg" role="status">{msg}</div>
      </section>
    </div>
  );
}
