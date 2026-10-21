// The device side of push notifications: ask permission when the person taps the button (never automatically), subscribe this browser, and tell the website so.
// Nothing here is stored in the page; the browser keeps the subscription itself. The website answers only for the signed-in person (see the pushStatus, pushSubscribe and pushUnsubscribe actions).
export type Support = 'ok' | 'needs-install' | 'unsupported';
/** iPhone and iPad only deliver push to an app that was added to the Home Screen; everything else needs the three browser features. */
export function supportFor(i: { serviceWorker: boolean; pushManager: boolean; notification: boolean; ios: boolean; standalone: boolean }): Support {
  if (i.ios && !i.standalone) return 'needs-install';
  return i.serviceWorker && i.pushManager && i.notification ? 'ok' : 'unsupported';
}
export type CardState = 'hidden' | 'needs-install' | 'blocked' | 'off' | 'on';
export function cardState(i: { enabled: boolean; support: Support; permission: string; subscribed: boolean }): CardState {
  if (!i.enabled || i.support === 'unsupported') return 'hidden';
  if (i.support === 'needs-install') return 'needs-install';
  if (i.permission === 'denied') return 'blocked';
  return i.subscribed && i.permission === 'granted' ? 'on' : 'off';
}
/** The server's public key (URL-safe text) as the bytes the browser wants. */
export function keyBytes(b64: string): Uint8Array {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4); const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/')); const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i); return out;
}

type Call = (action: string, payload?: Record<string, unknown>) => Promise<any>;
const w: any = typeof window === 'undefined' ? {} : window;
export function deviceSupport(): Support {
  let ios = false, standalone = false;
  try { ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1); standalone = !!(w.matchMedia && w.matchMedia('(display-mode: standalone)').matches) || (navigator as any).standalone === true; } catch { /* unknown */ }
  return supportFor({ serviceWorker: 'serviceWorker' in navigator, pushManager: 'PushManager' in w, notification: 'Notification' in w, ios, standalone });
}
export async function readState(call: Call): Promise<{ state: CardState; key: string; topics: string[]; endpoint: string }> {
  const support = deviceSupport(); let status: any = null; let endpoint = '';
  try {
    endpoint = ''; if (support === 'ok') { const reg = await navigator.serviceWorker.getRegistration(); const sub = reg ? await reg.pushManager.getSubscription() : null; endpoint = sub ? sub.endpoint : ''; }
    status = await call('pushStatus', endpoint ? { endpoint } : {});
  } catch { return { state: 'hidden', key: '', topics: [], endpoint: '' }; }
  const permission = 'Notification' in w ? Notification.permission : 'default';
  return { state: cardState({ enabled: !!(status && status.enabled), support, permission, subscribed: !!(status && status.subscribed) }), key: String((status && status.publicKey) || ''), topics: Array.isArray(status && status.topics) ? status.topics.map(String) : [], endpoint };
}
export async function turnOn(call: Call, key: string): Promise<{ ok: boolean; message: string }> {
  try {
    const permission = await Notification.requestPermission(); // must be called from the person's tap
    if (permission !== 'granted') return { ok: false, message: permission === 'denied' ? 'Notifications are blocked for this site. You can allow them in your browser or phone settings.' : 'No problem. You can turn reminders on whenever you like.' };
    const reg = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.ready);
    const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) as BufferSource }));
    await call('pushSubscribe', { subscription: sub.toJSON() });
    return { ok: true, message: 'Reminders are on for this device.' };
  } catch (e: any) { return { ok: false, message: String((e && e.message) || '').slice(0, 160) || 'Could not turn on reminders right now. Please try again.' }; }
}
export async function turnOff(call: Call): Promise<{ ok: boolean; message: string }> {
  try {
    const reg = await navigator.serviceWorker.getRegistration(); const sub = reg ? await reg.pushManager.getSubscription() : null;
    if (sub) { const endpoint = sub.endpoint; await sub.unsubscribe(); await call('pushUnsubscribe', { endpoint }); }
    return { ok: true, message: 'Reminders are off for this device.' };
  } catch { return { ok: false, message: 'Could not turn off reminders right now. Please try again.' }; }
}
