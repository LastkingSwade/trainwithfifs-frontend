'use client';

import { useEffect, useRef, useState } from 'react';
import { CODE_KEY, CODE_PATTERN, CONTACT_PHONE, CONTACT_PHONE_HREF, GROUP_STEPS, HELP_ITEMS, META_KEY, WHAT_IS_A_GROUP_CODE, buildShareMessage, friendlyCodeError, mailtoHref, seatsSummary, shareSubject, smsHref } from './groupCopy';
import type { GroupMeta } from './groupCopy';
import './group.css';

// Shown to the person who booked for a party, on the page Stripe sends them back to after payment.
export default function GroupCodePanel() {
  const [meta, setMeta] = useState<GroupMeta | null>(null);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get('booking_confirmed') !== 'true') return;
      const code = sessionStorage.getItem(CODE_KEY) || '';
      if (!CODE_PATTERN.test(code)) return;
      let extra: Partial<GroupMeta> = {};
      try { extra = JSON.parse(sessionStorage.getItem(META_KEY) || '{}') || {}; } catch { /* no extra details: the share text still works */ }
      setMeta({ code, course: typeof extra.course === 'string' ? extra.course : undefined, dates: typeof extra.dates === 'string' ? extra.dates : undefined, size: Number(extra.size) > 1 ? Number(extra.size) : undefined });
    } catch { /* storage unavailable: nothing to show */ }
  }, []);

  if (!meta) return null;
  const dismiss = () => { try { sessionStorage.removeItem(CODE_KEY); sessionStorage.removeItem(META_KEY); } catch { /* ignore */ } setMeta(null); };
  const copy = async () => {
    try { await navigator.clipboard.writeText(meta.code); } catch {
      const t = document.createElement('textarea'); t.value = meta.code; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); } catch { /* ignore */ } t.remove();
    }
    setCopied(true); window.setTimeout(() => setCopied(false), 2000);
  };
  const share = async () => {
    const nav = navigator as Navigator & { share?: (d: { title?: string; text?: string }) => Promise<void> };
    if (typeof nav.share === 'function') { try { await nav.share({ title: shareSubject(meta), text: buildShareMessage(meta) }); return; } catch { /* cancelled: fall through to the links */ } }
    panelRef.current?.querySelector('.group-share-links')?.classList.add('is-open');
  };
  const checkStatus = async () => {
    setBusy(true); setStatus('Checking...');
    try {
      const res = await fetch('/api/fifs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'validatePodCode', code: meta.code }) });
      const data = await res.json();
      setStatus(data && data.valid === true ? seatsSummary(meta.size, Number(data.seatsLeft)) : friendlyCodeError(data && data.error));
    } catch { setStatus('Could not check right now. Please try again in a minute.'); }
    setBusy(false);
  };

  return (
    <section className="group-panel" role="region" aria-label="Your group code" ref={panelRef}>
      <h2 className="group-title">Payment received. Now get your party in.</h2>
      <ol className="group-steps" aria-label="Steps for booking a group">
        {GROUP_STEPS.map((s, i) => (
          <li key={s} className={i < 2 ? 'is-done' : i === 2 ? 'is-now' : ''}><span className="group-step-n">{i < 2 ? '✓' : i + 1}</span>{s}</li>
        ))}
      </ol>
      <div className="group-code-label">Your group code (also called a pod code)</div>
      <div className="group-code" aria-live="polite">{meta.code}</div>
      <div className="group-actions">
        <button type="button" className="group-btn group-btn-main" onClick={copy}>{copied ? 'Copied' : 'Copy code'}</button>
        <button type="button" className="group-btn group-btn-main" onClick={share}>Share with your party</button>
      </div>
      <div className="group-share-links">
        <a className="group-btn" href={smsHref(meta)}>Text it</a>
        <a className="group-btn" href={mailtoHref(meta)}>Email it</a>
      </div>
      <p className="group-note">Send the code to everyone coming with you. Each person types it into the booking form (the Group Code box), and the class and date fill in by themselves.</p>
      <div className="group-status-row">
        <button type="button" className="group-btn" onClick={checkStatus} disabled={busy}>See how many have joined</button>
        <span className="group-status" role="status">{status}</span>
      </div>
      <details className="group-help">
        <summary>What is a group code? And what if something goes wrong?</summary>
        <p>{WHAT_IS_A_GROUP_CODE}</p>
        <dl>{HELP_ITEMS.map((h) => (<div key={h.q}><dt>{h.q}</dt><dd>{h.a}</dd></div>))}</dl>
        <p>Need a person? <a href={CONTACT_PHONE_HREF}>Call {CONTACT_PHONE}</a>.</p>
      </details>
      <button type="button" className="group-btn group-done" onClick={dismiss}>Got it</button>
    </section>
  );
}
