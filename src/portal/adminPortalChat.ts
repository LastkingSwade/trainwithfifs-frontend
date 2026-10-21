// Admin Hub > Live Chat Command: the members who have push notifications on (students and clients), and a direct chat with each one.
// Staff see only what the server sends for this list. Message text is written with textContent only. A reply is sent as Kai.
import { type ChatMsg, renderLog, callApi, describeError, panelVisible } from './portalChat';
const w: any = typeof window === 'undefined' ? {} : window;
interface MemberRow { userId: string; name: string; role: 'student' | 'client'; devices: number; unread: number; lastAt: string | null }
const POLL_MS = 20000, MAX = 1000;
const ROLE = { student: '🎓 Student', client: '🛡️ Client' } as const;

export function installAdminPortalChat(): void {
  if (typeof document === 'undefined' || w.__fifsAdminPortalChat) return;
  const host = document.querySelector<HTMLElement>('[data-admin-member-chat]'); if (!host) return;
  w.__fifsAdminPortalChat = true;

  const head = document.createElement('div'); head.className = 'amc-head';
  const title = document.createElement('h4'); title.className = 'amc-title'; title.id = 'amc-title'; title.textContent = '👥 Members with push notifications';
  const note = document.createElement('p'); note.className = 'amc-note'; note.textContent = 'Students and clients who turned alerts on for their device, plus anyone who has already written to you. Pick someone to chat with them.';
  const refreshBtn = document.createElement('button'); refreshBtn.type = 'button'; refreshBtn.className = 'amc-btn'; refreshBtn.textContent = '↻ Refresh';
  head.append(title, refreshBtn, note);
  const err = document.createElement('p'); err.className = 'amc-err'; err.setAttribute('role', 'alert'); err.hidden = true;
  const layout = document.createElement('div'); layout.className = 'amc-layout';
  const list = document.createElement('ul'); list.className = 'amc-list'; list.setAttribute('aria-labelledby', 'amc-title');
  const pane = document.createElement('section'); pane.className = 'amc-pane'; pane.setAttribute('aria-live', 'off');
  const paneTitle = document.createElement('h5'); paneTitle.className = 'amc-pane-title'; paneTitle.textContent = 'Choose a member to see their chat';
  const log = document.createElement('ol'); log.className = 'amc-log pc-log'; log.setAttribute('role', 'log'); log.setAttribute('aria-live', 'polite'); log.setAttribute('aria-relevant', 'additions'); log.setAttribute('aria-labelledby', 'amc-pane-title-id');
  paneTitle.id = 'amc-pane-title-id';
  const form = document.createElement('form'); form.className = 'amc-form'; form.noValidate = true;
  const box = document.createElement('textarea'); box.className = 'pc-input'; box.rows = 2; box.maxLength = MAX; box.placeholder = 'Write a reply. It is sent as Kai.'; box.setAttribute('aria-label', 'Reply to this member'); box.disabled = true;
  const row = document.createElement('div'); row.className = 'pc-row';
  const status = document.createElement('p'); status.className = 'amc-status'; status.setAttribute('role', 'status');
  const send = document.createElement('button'); send.type = 'submit'; send.className = 'pc-send'; send.textContent = '✉️ Send reply'; send.disabled = true;
  row.append(status, send); form.append(box, row);
  pane.append(paneTitle, log, form);
  layout.append(list, pane);
  host.textContent = ''; host.append(head, err, layout);

  let members: MemberRow[] = []; let selected: MemberRow | null = null; let busy = false; let lastSig = '';
  const showErr = (m: string) => { err.textContent = m; err.hidden = !m; };
  const setStatus = (m: string) => { status.textContent = m; };

  function paintList() {
    list.textContent = '';
    if (!members.length) { const li = document.createElement('li'); li.className = 'amc-empty'; li.textContent = 'No members yet. They appear here once they turn on alerts on a device, or when they write to you.'; list.append(li); return; }
    for (const m of members) {
      const li = document.createElement('li');
      const b = document.createElement('button'); b.type = 'button'; b.className = 'amc-item'; b.setAttribute('aria-pressed', String(selected?.userId === m.userId));
      const name = document.createElement('span'); name.className = 'amc-name'; name.textContent = m.name;
      const meta = document.createElement('span'); meta.className = 'amc-meta'; meta.textContent = `${ROLE[m.role]} · 📲 ${m.devices} ${m.devices === 1 ? 'device' : 'devices'}`;
      b.append(name, meta);
      if (m.unread > 0) { const badge = document.createElement('span'); badge.className = 'amc-unread'; badge.textContent = `🔴 ${m.unread} new`; badge.setAttribute('aria-label', `${m.unread} new messages`); b.append(badge); }
      b.addEventListener('click', () => { void select(m); });
      li.append(b); list.append(li);
    }
  }

  async function loadList(): Promise<void> {
    try {
      const d = await callApi('adminPortalChatMembers', {});
      members = Array.isArray(d?.members) ? d.members : [];
      showErr(''); paintList();
    } catch (e: any) { showErr(describeError(e)); }
  }

  async function loadThread(force = false): Promise<void> {
    if (!selected || busy) return;
    const me = selected;
    try {
      const d = await callApi('adminPortalChatThread', { userId: me.userId });
      if (selected?.userId !== me.userId) return;   // another member was picked while this loaded
      const msgs: ChatMsg[] = Array.isArray(d?.messages) ? d.messages : [];
      const sig = msgs.map((m) => m.id + m.read).join('|');
      if (force || sig !== lastSig) { renderLog(log, msgs, 'staff', 'No messages yet with ' + me.name + '.'); lastSig = sig; }
      box.disabled = false; send.disabled = false;
    } catch (e: any) { showErr(describeError(e)); }
  }

  async function select(m: MemberRow): Promise<void> {
    selected = m; lastSig = ''; paneTitle.textContent = `💬 ${m.name} (${ROLE[m.role]})`;
    box.value = ''; box.disabled = true; send.disabled = true; setStatus(''); log.textContent = '';
    paintList();
    await loadThread(true);
    void loadList();
    box.focus();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!selected) return;
    const text = box.value.trim();
    if (!text) { setStatus('Type a reply first.'); box.focus(); return; }
    busy = true; send.disabled = true; setStatus('Sending…');
    let d: any = null;
    try {
      d = await callApi('adminPortalChatReply', { userId: selected.userId, text });
      box.value = ''; lastSig = '';
    } catch (er: any) { setStatus(describeError(er)); box.value = text; }
    finally { busy = false; send.disabled = false; }
    if (d) {
      setStatus(d.pushed ? '✅ Sent. Their phone got a notification.'
        : d.held ? '✅ Saved. It is outside 8am to 8pm Eastern, so their notification goes out in the morning. They will see it in their portal.'
        : '✅ Saved. They have no device on, so they will see it in their portal.');
      await loadThread(true);
    }
  });
  box.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !(e as any).isComposing) { e.preventDefault(); form.requestSubmit(); } });
  refreshBtn.addEventListener('click', () => { void loadList(); void loadThread(true); });

  // Loads the list and the open chat while the Live Chat console is on screen: at once, then every 20 seconds.
  let last = 0;
  window.setInterval(() => {
    if (document.visibilityState !== 'visible' || !panelVisible(host)) return;
    if (Date.now() - last < POLL_MS) return;
    last = Date.now(); void loadList(); void loadThread();
  }, 2000);
}
