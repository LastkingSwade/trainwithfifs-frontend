// Portal chat: a constant chat area in the Student and Client portals, between the signed-in person and their instructor. No name or phone to type: the server knows who
// is signed in. Plain text only (every message is written with textContent), polite screen-reader announcements, 44px targets, and no motion when reduced motion is on.
// Server rules live in src/Lib/server/portal-chat.ts. This file only shows the person's own thread.
const w: any = typeof window === 'undefined' ? {} : window;
export type Viewer = 'member' | 'staff';
export interface ChatMsg { id: string; sender: 'member' | 'staff'; body: string; at: string; read: boolean }
const POLL_MS = 20000, MAX = 1000;

export function timeLabel(iso: string): string {
  const d = new Date(iso); if (Number.isNaN(d.getTime())) return '';
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** One message bubble. Mine is cyan (company colour), theirs amber; the sender is named in words, never by colour alone. */
export function bubble(m: ChatMsg, viewer: Viewer): HTMLElement {
  const mine = (viewer === 'member') === (m.sender === 'member');
  const li = document.createElement('li'); li.className = 'pc-msg ' + (mine ? 'pc-mine' : 'pc-theirs'); li.dataset.id = m.id;
  const who = document.createElement('span'); who.className = 'pc-who';
  who.textContent = mine ? (viewer === 'member' ? 'You' : 'Kai') : (viewer === 'member' ? '🛡️ Kai' : '🎓 Member');
  const body = document.createElement('div'); body.className = 'pc-body'; body.textContent = m.body;
  const when = document.createElement('time'); when.className = 'pc-time'; when.dateTime = m.at; when.textContent = timeLabel(m.at) + (mine && m.read ? ' · ✓✓ read' : '');
  li.append(who, body, when);
  return li;
}

/** Replaces the log's messages. Scrolls to the newest only if the person was already near the bottom (so reading older messages is never interrupted). */
export function renderLog(log: HTMLElement, msgs: ChatMsg[], viewer: Viewer, empty: string): void {
  const nearBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 60 || log.childElementCount === 0;
  log.textContent = '';
  if (!msgs.length) { const p = document.createElement('p'); p.className = 'pc-empty'; p.textContent = empty; log.append(p); return; }
  const frag = document.createDocumentFragment(); msgs.forEach((m) => frag.append(bubble(m, viewer))); log.append(frag);
  if (nearBottom) log.scrollTop = log.scrollHeight;
}

export function describeError(e: any): string { return String((e && (e.message || e.error)) || 'Something went wrong. Please try again.'); }
export const callApi = (action: string, payload: Record<string, unknown>): Promise<any> => (typeof w.callFifsBackend === 'function' ? w.callFifsBackend(action, payload) : Promise.reject(new Error('The site is still loading. Please try again in a moment.')));
/** Is the portal panel this chat sits in on screen? (The chat area itself starts hidden until it has loaded, so its own size cannot tell us.) */
export const panelVisible = (el: HTMLElement): boolean => { const p = (el.closest('[id$="subpanel-chat"]') || el.parentElement) as HTMLElement | null; return !!p && p.offsetParent !== null; };

/** Builds one portal's chat area inside its host. Returns a tick the installer calls. */
function build(host: HTMLElement): { tick(): void } {
  const viewer: Viewer = 'member';
  const head = document.createElement('div'); head.className = 'pc-head';
  const title = document.createElement('h3'); title.className = 'pc-title'; title.id = host.dataset.portalChat + '-chat-title'; title.textContent = '💬 Chat with me';
  const sub = document.createElement('p'); sub.className = 'pc-sub'; sub.textContent = 'Your private line to your instructor. Your messages stay in this chat, so you never need to type your name or number.';
  head.append(title, sub);
  const log = document.createElement('ol'); log.className = 'pc-log'; log.setAttribute('role', 'log'); log.setAttribute('aria-live', 'polite'); log.setAttribute('aria-relevant', 'additions'); log.setAttribute('aria-labelledby', title.id);
  const err = document.createElement('p'); err.className = 'pc-err'; err.setAttribute('role', 'alert'); err.hidden = true;
  const form = document.createElement('form'); form.className = 'pc-form'; form.noValidate = true;
  const label = document.createElement('label'); label.className = 'pc-label'; label.htmlFor = host.dataset.portalChat + '-chat-text'; label.textContent = 'Message me';
  const box = document.createElement('textarea'); box.id = label.htmlFor; box.className = 'pc-input'; box.rows = 2; box.maxLength = MAX; box.placeholder = 'Ask about your class, your permit or what to bring…';
  const row = document.createElement('div'); row.className = 'pc-row';
  const count = document.createElement('span'); count.className = 'pc-count'; count.setAttribute('aria-live', 'off');
  const send = document.createElement('button'); send.type = 'submit'; send.className = 'pc-send'; send.textContent = '✉️ Send';
  row.append(count, send); form.append(label, box, row);
  host.textContent = ''; host.append(head, log, err, form);
  host.classList.add('pc-card');

  let busy = false, loaded = false, lastSig = '';
  const showErr = (msg: string) => { err.textContent = msg; err.hidden = !msg; };
  const updateCount = () => { count.textContent = `${box.value.length} / ${MAX}`; };
  box.addEventListener('input', updateCount); updateCount();
  box.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !(e as any).isComposing) { e.preventDefault(); form.requestSubmit(); } });

  async function refresh(): Promise<void> {
    if (busy) return;
    try {
      const d = await callApi('portalChatGet', {});
      if (!d || !Array.isArray(d.messages)) return;
      host.hidden = false; loaded = true;
      const sig = d.messages.map((m: ChatMsg) => m.id + m.read).join('|');
      if (sig !== lastSig) { renderLog(log, d.messages, viewer, 'No messages yet. Say hello, or ask a question about your class or permit.'); lastSig = sig; }
      showErr('');
    } catch (e: any) {
      // Signed out or not a student or client: the chat stays hidden. Only a real problem for someone who is signed in is shown.
      if (loaded) showErr(describeError(e));
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = box.value.trim();
    if (!text) { showErr('Type a message first.'); box.focus(); return; }
    busy = true; send.disabled = true; showErr('');
    let sent = false;
    try {
      await callApi('portalChatSend', { text });
      box.value = ''; updateCount(); lastSig = ''; sent = true;
    } catch (er: any) { showErr(describeError(er)); box.value = text; updateCount(); }
    finally { busy = false; send.disabled = false; }
    if (sent) await refresh();   // show the new message straight away
  });

  // Loads once the portal is on screen (retried every 15 seconds if it fails), then every 20 seconds while it stays on screen.
  let last = 0;
  return {
    tick() {
      if (document.visibilityState !== 'visible' || !panelVisible(host)) return;
      const gap = loaded ? POLL_MS : 15000;
      if (Date.now() - last < gap) return;
      last = Date.now(); void refresh();
    },
  };
}

export function installPortalChat(): void {
  if (typeof document === 'undefined' || w.__fifsPortalChat) return; w.__fifsPortalChat = true;
  const hosts = Array.from(document.querySelectorAll<HTMLElement>('[data-portal-chat]'));
  if (!hosts.length) return;
  const areas = hosts.map((h) => build(h));
  window.setInterval(() => areas.forEach((a) => a.tick()), 2000);
}
