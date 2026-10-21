'use client';

import { useCallback, useEffect, useState } from 'react';
import '../online/online.css';

// Admin Hub: send a short note to everyone who turned notifications on. Plain text up to 140 characters; the server checks the staff role, strips links, and only sends between 8am and 8pm
// Eastern. Notifications show no names or amounts; this panel never shows who is subscribed, only how many.
interface Status { configured: boolean; students: number; clients: number; quietHours: boolean }
type Audience = 'all' | 'student' | 'client';
export default function AdminPushPanel() {
  const [open, setOpen] = useState(false);
  const [st, setSt] = useState<Status | null>(null);
  const [text, setText] = useState('');
  const [audience, setAudience] = useState<Audience>('all');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const call = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const fn = (window as any).callFifsBackend;
    if (typeof fn !== 'function') throw new Error('The page is still loading.');
    return fn(action, payload);
  }, []);
  const load = useCallback(async () => { try { setSt(await call('adminPushStatus')); setMsg(''); } catch (e: any) { setMsg(e?.message || 'Could not load.'); } }, [call]);
  useEffect(() => { (window as any).openAdminPush = () => { setOpen(true); setText(''); setMsg(''); load(); }; return () => { delete (window as any).openAdminPush; }; }, [load]);
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [open]);
  if (!open) return null;

  const count = !st ? 0 : audience === 'student' ? st.students : audience === 'client' ? st.clients : st.students + st.clients;
  const send = async () => {
    if (busy || !text.trim()) return; setBusy(true); setMsg('Sending…');
    try { const d = await call('adminPushSend', { text, audience }); setMsg(`✅ Sent to ${d.sent} device${d.sent === 1 ? '' : 's'}${d.failed ? ` (${d.failed} could not be reached)` : ''}.`); setText(''); load(); }
    catch (e: any) { setMsg(e?.message || 'Could not send.'); } finally { setBusy(false); }
  };

  return (
    <div className="online-admin-overlay" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <section className="online-admin" role="dialog" aria-modal="true" aria-label="Send a notification">
        <div className="row" style={{ justifyContent: 'space-between' }}><h2>🔔 Send a notification</h2><button type="button" onClick={() => setOpen(false)}>Close</button></div>
        {st && !st.configured && <p className="hint">⚠️ Notifications are not switched on yet: the two keys have not been added in Vercel. See docs/PUSH-SETUP.md.</p>}
        <p className="hint">A short note that appears on the phones and computers of people who turned reminders on in their portal. Plain text only, up to 140 characters; links are removed. It goes out only between 8am and 8pm Eastern.{st?.quietHours ? ' ⏰ It is outside those hours right now, so sending is paused.' : ''}</p>
        <div className="row"><label>Send to&nbsp;
          <select aria-label="Who gets it" value={audience} onChange={(e) => setAudience(e.target.value as Audience)}><option value="all">Everyone with reminders on</option><option value="student">Students only</option><option value="client">Clients only</option></select></label>
          <span className="hint">{st ? `${count} device${count === 1 ? '' : 's'}` : ''}</span></div>
        <textarea aria-label="Message" maxLength={140} rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Example: Weather update: Saturday's class is on as planned. See you at the range!" style={{ width: '100%', minHeight: 84 }} />
        <div className="row" style={{ justifyContent: 'space-between' }}><span className="hint">{text.length}/140</span>
          <button type="button" className="primary" disabled={busy || !text.trim() || !st?.configured || !!st?.quietHours} onClick={send}>📣 Send now</button></div>
        <div className="msg" role="status">{msg}</div>
      </section>
    </div>
  );
}
