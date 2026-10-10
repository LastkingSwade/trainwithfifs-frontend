'use client';

import { useEffect, useState } from 'react';
import { CONTACT_PHONE, CONTACT_PHONE_HREF } from './groupCopy';
import './group.css';

interface Group { course: string; dates: string; seatsTotal: number; seatsTaken: number; seatsOpen: number; members: Array<{ label: string; state: string; organizer: boolean }> | null }

// The organizer's private link from their confirmation email: /?group=FIFS-POD-XXXX&gt=<token>. Shows seats and who has paid.
export default function GroupStatusPanel() {
  const [link, setLink] = useState<{ code: string; token: string } | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const code = (q.get('group') || '').toUpperCase();
      const token = q.get('gt') || '';
      if (!/^FIFS-POD-[A-Z0-9]{4}$/.test(code) || !token) return;
      setLink({ code, token });
      q.delete('gt'); q.delete('group'); // keep the private token out of the address bar and history
      const rest = q.toString();
      window.history.replaceState(null, '', window.location.pathname + (rest ? '?' + rest : '') + window.location.hash);
    } catch { /* no link to show */ }
  }, []);

  const call = async (action: 'groupStatus' | 'groupRemind') => {
    const res = await fetch('/api/fifs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, code: link?.code, token: link?.token }) });
    return { ok: res.ok, data: await res.json().catch(() => ({})) };
  };

  useEffect(() => {
    if (!link) return;
    let alive = true;
    (async () => {
      setBusy(true);
      try {
        const { ok, data } = await call('groupStatus');
        if (!alive) return;
        if (ok && data.group) setGroup(data.group); else setMessage(String(data.error || 'This link is not valid.'));
      } catch { if (alive) setMessage('Could not load your group right now. Please try again in a minute.'); }
      if (alive) setBusy(false);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [link]);

  if (!link) return null;
  const remind = async () => {
    setBusy(true); setMessage('Sending...');
    try {
      const { ok, data } = await call('groupRemind');
      setMessage(ok ? (data.sent > 0 ? `Reminder sent to ${data.sent} ${data.sent === 1 ? 'person' : 'people'} who have not finished paying.` : 'Nobody is waiting on a payment right now.') : String(data.error || 'Could not send a reminder.'));
    } catch { setMessage('Could not send a reminder right now.'); }
    setBusy(false);
  };

  return (
    <section className="group-panel group-status-panel" role="region" aria-label="Your group">
      <h2 className="group-title">Your group</h2>
      {group && (
        <>
          <p className="group-note" style={{ marginTop: 0 }}><strong>{group.course}</strong>{group.dates ? `, ${group.dates}` : ''}</p>
          <p className="group-status">{group.seatsTaken} of {group.seatsTotal} seats taken. {group.seatsOpen} still open.</p>
          {group.members === null ? (
            <p className="group-note">The list of who has joined is not available yet. The seat count above is current.</p>
          ) : (
            <ul className="group-members">
              {group.members.map((m, i) => (<li key={i}><span>{m.label}{m.organizer ? ' (you)' : ''}</span><span className="group-member-state">{m.state}</span></li>))}
            </ul>
          )}
          <div className="group-actions">
            <button type="button" className="group-btn group-btn-main" onClick={remind} disabled={busy}>Remind people who have not paid</button>
          </div>
          <p className="group-note">People who have not used your code yet cannot be reached from here. Send them the code again from your confirmation email. Need help? <a href={CONTACT_PHONE_HREF} style={{ color: 'var(--accent-cyan, #00e5ff)' }}>Call {CONTACT_PHONE}</a>.</p>
        </>
      )}
      <p className="group-status" role="status">{message}</p>
      <button type="button" className="group-btn group-done" onClick={() => setLink(null)}>Close</button>
    </section>
  );
}
