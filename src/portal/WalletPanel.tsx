'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import './vault.css';
import { TABS, artFor, counts, docTitle, expiryState, filterDocs, prettyDate, recent, sizeText, tabOf, type VaultDoc, type VaultTab } from './vaultLogic';

interface Status { enabled: boolean; consented: boolean; docs: VaultDoc[]; maxBytes: number; kinds: Record<string, string> }
const toBase64 = (file: File) => new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result).split(',')[1] || ''); r.onerror = () => reject(new Error('Could not read that file.')); r.readAsDataURL(file); });
const EMOJI: Record<string, string> = { permit_card: '🪪', class_certificate: '🎓', hql_approval: '🛡️' };
const emojiFor = (kind: string) => EMOJI[kind] || '📎';

// The signed-in person's own Document Vault. Every call goes to the server, which uses the verified login as the owner; nothing here reads a file's contents
// except to send it for encrypted storage or to open it for its owner.
export default function WalletPanel() {
  const [open, setOpen] = useState(false);
  const [st, setSt] = useState<Status | null>(null);
  const [msg, setMsg] = useState('');
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState('permit_card');
  const [expires, setExpires] = useState('');
  const [agree, setAgree] = useState(false);
  const [confirmId, setConfirmId] = useState('');
  const [menuId, setMenuId] = useState('');
  const [tab, setTab] = useState<VaultTab>('all');
  const [query, setQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [drag, setDrag] = useState(false);
  const panel = useRef<HTMLElement | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const call = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const fn = (window as any).callFifsBackend;
    if (typeof fn !== 'function') throw new Error('The page is still loading.');
    return fn(action, payload);
  }, []);
  const load = useCallback(async () => { try { setSt(await call('walletStatus')); } catch (e: any) { setMsg(e?.message || 'Could not load your vault.'); } }, [call]);
  const showToast = (t: string) => { setToast(t); if (toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 4500); };

  useEffect(() => { (window as any).openWallet = () => { setOpen(true); setMsg(''); setToast(''); setConfirmId(''); setMenuId(''); setAgree(false); setTab('all'); setQuery(''); setAddOpen(false); load(); }; return () => { delete (window as any).openWallet; if (toastTimer.current) clearTimeout(toastTimer.current); }; }, [load]);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { if (menuId) setMenuId(''); else setOpen(false); return; }
      if (e.key !== 'Tab' || !panel.current) return;
      const f = Array.from(panel.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])')).filter((x) => x.offsetParent !== null);
      if (!f.length) return; const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [open, menuId]);
  useEffect(() => { if (open) window.setTimeout(() => panel.current?.querySelector<HTMLElement>('.vault-close')?.focus(), 60); }, [open]);
  if (!open) return null;

  const accept = async () => { try { await call('walletConsent'); setMsg(''); await load(); } catch (e: any) { setMsg(e?.message || 'Could not save your choice.'); } };
  const upload = async (file: File | undefined) => {
    if (!file || !st) return;
    if (file.size > st.maxBytes) { setMsg('That file is larger than 3 MB. Choose a smaller PDF or photo.'); return; }
    setBusy(true); setMsg('Encrypting and saving…');
    try { await call('walletUpload', { kind, expiresOn: expires || undefined, dataBase64: await toBase64(file) }); setMsg(''); showToast('Your document has been added to your vault.'); setExpires(''); setAddOpen(false); await load(); window.dispatchEvent(new Event('fifs-wallet-changed')); } catch (e: any) { setMsg(e?.message || 'Could not save that file.'); }
    setBusy(false);
  };
  const view = async (d: VaultDoc) => {
    try {
      const r = await call('walletOpen', { id: d.id });
      const bytes = Uint8Array.from(atob(r.dataBase64), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: r.mime }));
      const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.download = r.fileName; document.body.appendChild(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e: any) { setMsg(e?.message || 'Could not open that document.'); }
  };
  const remove = async (d: VaultDoc) => { try { await call('walletDelete', { id: d.id }); setConfirmId(''); setMenuId(''); setMsg(''); showToast('The document was deleted from your vault.'); await load(); window.dispatchEvent(new Event('fifs-wallet-changed')); } catch (e: any) { setConfirmId(''); setMsg(e?.message || 'Could not delete.'); } };

  const docs = st?.docs || [];
  const c = counts(docs);
  const shown = filterDocs(docs, tab, query);
  const art = (d: VaultDoc, small = false) => { const a = artFor(d.kind); return (
    <div className={'vault-art' + (small ? ' small' : '') + (a.seal ? ' sealed' : '') + ' k-' + (EMOJI[d.kind] ? d.kind : 'other')} aria-hidden="true">
      <span className="vault-art-emoji">{emojiFor(d.kind)}</span>
      <b className="vault-art-brand">FIFS</b>
      <span className="vault-art-label">{a.label}</span>
      <i /><i /><i className="short" />
      {a.seal && <b className="vault-seal" />}
    </div>
  ); };

  return (
    <div className="vault-overlay" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <section className="vault" role="dialog" aria-modal="true" aria-labelledby="vault-title" ref={panel}>
        <header className="vault-head">
          <div>
            <span className="vault-bar" aria-hidden="true" />
            <h2 id="vault-title">Your Document Vault</h2>
            <p className="vault-tag">Your training. Your records. All together.</p>
          </div>
          <div className="vault-actions">
            {st && st.enabled && st.consented && <button type="button" className="vault-add" onClick={() => { setAddOpen((v) => !v); setMsg(''); }} aria-expanded={addOpen}><span aria-hidden="true">＋</span> Add document</button>}
            <button type="button" className="vault-close" onClick={() => setOpen(false)} aria-label="Close your vault">✕</button>
          </div>
        </header>

        {!st && !msg && <div className="vault-skel" aria-label="Loading your vault"><i /><i /><i /></div>}
        {st && !st.enabled && <p className="vault-note">The document vault is not available yet. Please check back soon.</p>}

        {st && st.enabled && !st.consented && (
          <div className="vault-consent">
            <p className="vault-lead">🔐 Before you start, please read this:</p>
            <ul>
              <li>This is a private place for <strong>your own</strong> permit card, class certificate, HQL approval or other ID.</li>
              <li>Only you can open your files. Staff cannot see them. Files are encrypted before they are stored.</li>
              <li><strong>Do not upload</strong> firearm serial numbers, photos of firearms, where you keep them at home, or any gun registry-style records. This vault is not for those.</li>
              <li>You can delete any file at any time. If your account is removed, your files are removed too.</li>
            </ul>
            <label className="vault-check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> <span>I understand and want to turn on my document vault.</span></label>
            <button type="button" className="vault-add" disabled={!agree} onClick={accept}>Turn on my vault</button>
          </div>
        )}

        {st && st.enabled && st.consented && (
          <>
            <div className="vault-tools">
              <label className="vault-search"><span aria-hidden="true">🔍</span><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your documents…" aria-label="Search your documents" maxLength={60} /></label>
              <div className="vault-chips" role="tablist" aria-label="Filter documents">
                {TABS.map((t) => <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className={'vault-chip' + (tab === t.key ? ' on' : '')} onClick={() => setTab(t.key)}>{t.label} ({c[t.key]})</button>)}
              </div>
            </div>

            {addOpen && (
              <div className="vault-addpanel">
                <h3>Add a document</h3>
                <div className="vault-addrow">
                  <label>Type
                    <select aria-label="Document type" value={kind} onChange={(e) => setKind(e.target.value)}>{Object.entries(st.kinds).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                  </label>
                  <label>Expires (optional)
                    <input type="date" aria-label="Expiration date (optional)" value={expires} onChange={(e) => setExpires(e.target.value)} />
                  </label>
                </div>
                <label className={'vault-drop' + (drag ? ' on' : '')} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files?.[0]); }}>
                  <span className="vault-drop-ico" aria-hidden="true">📥</span>
                  <strong>{busy ? 'Saving…' : 'Choose a file or drop it here'}</strong>
                  <span>PDF, PNG, JPG or WEBP, up to 3 MB. No firearm serial numbers, gun photos or storage details.</span>
                  <input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" disabled={busy} onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
                </label>
              </div>
            )}

            {docs.length === 0 ? (
              <div className="vault-empty"><span aria-hidden="true">🗂️</span><h3>Your vault is empty</h3><p>Keep your permit card, class certificate or HQL approval close at hand. Only you can open them.</p><button type="button" className="vault-add" onClick={() => setAddOpen(true)}><span aria-hidden="true">＋</span> Add your first document</button></div>
            ) : shown.length === 0 ? (
              <div className="vault-empty"><span aria-hidden="true">🔍</span><h3>No documents match</h3><p>Try a different word, or choose All documents.</p><button type="button" className="vault-chip on" onClick={() => { setQuery(''); setTab('all'); }}>Show everything</button></div>
            ) : (
              <div className="vault-grid">
                {shown.map((d) => { const ex = expiryState(d.expiresOn); return (
                  <article className="vault-card" key={d.id}>
                    {art(d)}
                    <div className="vault-body">
                      <div className="vault-top">
                        <span className="vault-ico" aria-hidden="true">{emojiFor(d.kind)}</span>
                        <h3>{docTitle(d)}</h3>
                        <div className="vault-menu">
                          <button type="button" className="vault-dots" aria-haspopup="menu" aria-expanded={menuId === d.id} aria-label={`More actions for ${docTitle(d)}`} onClick={() => { setMenuId(menuId === d.id ? '' : d.id); setConfirmId(''); }}>⋮</button>
                          {menuId === d.id && <div className="vault-pop" role="menu"><button type="button" role="menuitem" onClick={() => { setConfirmId(d.id); setMenuId(''); }}>🗑️ Delete</button></div>}
                        </div>
                      </div>
                      <p className="vault-meta">Added by you · {prettyDate(d.createdAt)} · {sizeText(d.sizeBytes)}</p>
                      {ex.state !== 'none' && <span className={'vault-exp ' + ex.state}>{ex.text}</span>}
                      {confirmId === d.id ? (
                        <div className="vault-confirm" role="alert"><span>Delete this document? This cannot be undone.</span><span className="vault-confirm-row"><button type="button" className="danger" onClick={() => remove(d)}>Yes, delete</button><button type="button" onClick={() => setConfirmId('')}>Cancel</button></span></div>
                      ) : <button type="button" className="vault-view" onClick={() => view(d)}>View document <span aria-hidden="true">→</span></button>}
                    </div>
                  </article>
                ); })}
              </div>
            )}

            {docs.length > 0 && (
              <div className="vault-lower">
              <section className="vault-recent" aria-label="Recently added">
                <h3>Recently added</h3>
                <ul>
                  {recent(docs).map((d) => (
                    <li key={d.id}>
                      {art(d, true)}
                      <span className="vault-r-name">{docTitle(d)}</span>
                      <span className="vault-r-date">Added {prettyDate(d.createdAt)}</span>
                      <span className="vault-r-tag">{TABS.find((t) => t.key === tabOf(d.kind))?.label}</span>
                    </li>
                  ))}
                </ul>
              </section>
              <aside className="vault-keep"><h3>Keep your records close at hand</h3><p>All of your training documents in one secure place, whenever you need them.</p></aside>
              </div>
            )}
          </>
        )}

        {msg && <div className="vault-msg" role="status">{msg}</div>}
        {toast && <div className="vault-toast" role="status"><span aria-hidden="true">✅</span><div><strong>Done</strong><span>{toast}</span></div><button type="button" aria-label="Dismiss" onClick={() => setToast('')}>✕</button></div>}
      </section>
    </div>
  );
}
