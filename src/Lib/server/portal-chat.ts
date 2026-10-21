// Portal chat: a constant, private chat between each student or client and their instructor (table: scripts/sql/20261025_portal_messages.sql).
// Rules: a member reads and writes only their own thread (found from the verified login); staff reach threads only through the Admin Hub routes; text is plain and capped;
// push notifications say only that there is a message, never what it says. Messages are kept 12 months. Nothing here is ever shown to anyone else.
import { sendToUsers, notifyStaff } from './push';
import { withinSendWindow, URL_FOR, type PersonRole } from './push-logic';

export const CHAT_MAX = 1000, KEEP_DAYS = 365, THREAD_LIMIT = 200, INSTRUCTOR = 'Kai';
const DAY = 86400000;
const likeEscape = (v: string) => v.replace(/[\\%_]/g, (c) => '\\' + c);

/** Plain text only: control characters become spaces, the ends are trimmed, and the text must have 1 to 1000 characters. */
export function cleanBody(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ').replace(/\r\n?/g, '\n').trim();
  return s.length >= 1 && s.length <= CHAT_MAX ? s : null;
}

/** Which kind of account this login belongs to. Null means it is neither a student nor a client, so there is no chat. */
export async function memberRole(sb: any, userId: string): Promise<PersonRole | null> {
  const st = await sb.from('students').select('user_id').eq('user_id', userId).maybeSingle();
  if (st.error) throw new Error('lookup failed');
  if (st.data) return 'student';
  const cl = await sb.from('clients').select('user_id').eq('user_id', userId).maybeSingle();
  if (cl.error) throw new Error('lookup failed');
  return cl.data ? 'client' : null;
}

async function fullNameFor(sb: any, userId: string): Promise<string> {
  for (const t of ['students', 'clients']) {
    const r = await sb.from(t).select('full_name').eq('user_id', userId).maybeSingle();
    if (!r.error && r.data?.full_name) return String(r.data.full_name).trim().split(/\s+/)[0].slice(0, 40);
  }
  return '';
}

export type ChatMessage = { id: string; sender: 'member' | 'staff'; body: string; at: string; read: boolean };
const shape = (r: any): ChatMessage => ({ id: String(r.id), sender: r.sender === 'staff' ? 'staff' : 'member', body: String(r.body || ''), at: String(r.created_at || ''), read: !!r.read_at });

async function threadFor(sb: any, memberUserId: string): Promise<ChatMessage[]> {
  const r = await sb.from('portal_messages').select('id, sender, body, created_at, read_at').eq('member_user_id', memberUserId).order('created_at', { ascending: false }).limit(THREAD_LIMIT);
  if (r.error) throw new Error('thread load failed');
  return (Array.isArray(r.data) ? r.data : []).reverse().map(shape);
}
async function markRead(sb: any, memberUserId: string, from: 'member' | 'staff', now: Date) {
  // Reading marks the OTHER side's messages as read: staff reading marks member messages; a member reading marks staff messages.
  await sb.from('portal_messages').update({ read_at: now.toISOString() }).eq('member_user_id', memberUserId).eq('sender', from).is('read_at', null);
}

/** The member's own thread (opening it marks the instructor's messages as read). */
export async function memberThread(sb: any, userId: string, now: Date = new Date()): Promise<{ ok: true; messages: ChatMessage[]; instructor: string } | { ok: false; status: number; error: string }> {
  const role = await memberRole(sb, userId).catch(() => 'error' as const);
  if (role === 'error') return { ok: false, status: 503, error: 'Chat is unavailable right now. Please try again in a minute.' };
  if (!role) return { ok: false, status: 403, error: 'Chat is only for students and clients.' };
  await markRead(sb, userId, 'staff', now);
  return { ok: true, messages: await threadFor(sb, userId), instructor: INSTRUCTOR };
}

/** The member writes to their instructor. Staff are alerted (generic text). */
export async function memberSend(sb: any, userId: string, input: unknown, now: Date = new Date()): Promise<{ ok: true; message: ChatMessage } | { ok: false; status: number; error: string }> {
  const body = cleanBody(input);
  if (!body) return { ok: false, status: 400, error: `Type a message (up to ${CHAT_MAX} characters).` };
  const role = await memberRole(sb, userId).catch(() => 'error' as const);
  if (role === 'error') return { ok: false, status: 503, error: 'Your message could not be sent right now. Please try again in a minute.' };
  if (!role) return { ok: false, status: 403, error: 'Chat is only for students and clients.' };
  const ins = await sb.from('portal_messages').insert({ member_user_id: userId, sender: 'member', body, created_at: now.toISOString() }).select('id, sender, body, created_at, read_at').maybeSingle();
  if (ins.error || !ins.data) return { ok: false, status: 503, error: 'Your message could not be sent right now. Please try again in a minute.' };
  try { await notifyStaff(sb, '💬 Live chat: new portal message', now); } catch { /* the message is saved; the alert is best effort */ }
  return { ok: true, message: shape(ins.data) };
}

export interface MemberRow { userId: string; name: string; role: PersonRole; devices: number; unread: number; lastAt: string | null }

/** Staff: members who have push notifications on, plus anyone who already has a chat thread. Names come from the student or client record. */
export async function staffMembers(sb: any): Promise<{ ok: true; members: MemberRow[] } | { ok: false; status: number; error: string }> {
  const pushRows = await sb.from('push_subscriptions').select('user_id, role').in('role', ['student', 'client']);
  if (pushRows.error) return { ok: false, status: 503, error: 'Could not load the members right now.' };
  const devices = new Map<string, { role: PersonRole; n: number }>();
  for (const r of Array.isArray(pushRows.data) ? pushRows.data : []) {
    const cur = devices.get(r.user_id) || { role: r.role as PersonRole, n: 0 }; cur.n += 1; devices.set(r.user_id, cur);
  }
  const threads = await sb.from('portal_messages').select('member_user_id, sender, read_at, created_at').order('created_at', { ascending: false }).limit(5000);
  if (threads.error) return { ok: false, status: 503, error: 'Could not load the chat threads right now.' };
  const unread = new Map<string, number>(); const lastAt = new Map<string, string>();
  for (const m of Array.isArray(threads.data) ? threads.data : []) {
    const id = String(m.member_user_id);
    if (!lastAt.has(id)) lastAt.set(id, String(m.created_at));
    if (m.sender === 'member' && !m.read_at) unread.set(id, (unread.get(id) || 0) + 1);
  }
  const ids = Array.from(new Set([...Array.from(devices.keys()), ...Array.from(lastAt.keys())]));
  const members: MemberRow[] = [];
  for (const id of ids) {
    const d = devices.get(id);
    const role = d?.role || (await memberRole(sb, id).catch(() => null));
    if (!role) continue;   // not a student or client any more: not listed
    members.push({ userId: id, name: await fullNameFor(sb, id) || (role === 'client' ? 'Client' : 'Student'), role, devices: d?.n || 0, unread: unread.get(id) || 0, lastAt: lastAt.get(id) || null });
  }
  members.sort((a, b) => (b.unread - a.unread) || String(b.lastAt || '').localeCompare(String(a.lastAt || '')) || a.name.localeCompare(b.name));
  return { ok: true, members };
}

/** Staff: one member's thread (opening it marks the member's messages as read). */
export async function staffThread(sb: any, memberUserId: string, now: Date = new Date()): Promise<{ ok: true; messages: ChatMessage[]; name: string } | { ok: false; status: number; error: string }> {
  const role = await memberRole(sb, memberUserId).catch(() => 'error' as const);
  if (role === 'error') return { ok: false, status: 503, error: 'Could not load this chat right now.' };
  if (!role) return { ok: false, status: 404, error: 'That person is not a student or client.' };
  await markRead(sb, memberUserId, 'member', now);
  return { ok: true, messages: await threadFor(sb, memberUserId), name: await fullNameFor(sb, memberUserId) };
}

/** Staff: reply. If the send window is closed the message is saved and the push waits for the daily nudge. */
export async function staffSend(sb: any, memberUserId: string, input: unknown, now: Date = new Date()): Promise<{ ok: true; message: ChatMessage; pushed: boolean; held: boolean } | { ok: false; status: number; error: string }> {
  const body = cleanBody(input);
  if (!body) return { ok: false, status: 400, error: `Type a message (up to ${CHAT_MAX} characters).` };
  const role = await memberRole(sb, memberUserId).catch(() => 'error' as const);
  if (role === 'error') return { ok: false, status: 503, error: 'Your reply could not be saved right now.' };
  if (!role) return { ok: false, status: 404, error: 'That person is not a student or client.' };
  const ins = await sb.from('portal_messages').insert({ member_user_id: memberUserId, sender: 'staff', body, created_at: now.toISOString() }).select('id, sender, body, created_at, read_at, notified_at').maybeSingle();
  if (ins.error || !ins.data) return { ok: false, status: 503, error: 'Your reply could not be saved right now. Nothing was sent.' };
  const payload = chatPayload(role);
  const rep = withinSendWindow(now) ? await sendToUsers(sb, [memberUserId], payload, now, { ignoreTopic: true }).catch(() => null) : null;
  const pushed = !!rep && rep.sent > 0;
  if (pushed) await sb.from('portal_messages').update({ notified_at: now.toISOString() }).eq('id', ins.data.id);
  return { ok: true, message: shape(ins.data), pushed, held: !withinSendWindow(now) };
}

export const chatPayload = (role: PersonRole) => ({ title: '💬 New message from Kai', body: 'Open your portal to read it.', url: URL_FOR[role], tag: 'portal-chat', topic: 'news' as const });

/** The daily job: one generic nudge per member who has an unnotified staff message. Also removes messages older than 12 months. Never sends outside the send window. */
export async function sendChatNudges(sb: any, now: Date = new Date()): Promise<{ nudged: number; purged: boolean }> {
  const cutoff = new Date(now.getTime() - KEEP_DAYS * DAY).toISOString();
  const purge = await sb.from('portal_messages').delete().lt('created_at', cutoff);
  const purged = !purge?.error;
  if (!withinSendWindow(now)) return { nudged: 0, purged };
  const pending = await sb.from('portal_messages').select('id, member_user_id').eq('sender', 'staff').is('notified_at', null).limit(500);
  if (pending.error || !Array.isArray(pending.data)) return { nudged: 0, purged };
  const byUser = new Map<string, string[]>();
  for (const r of pending.data) byUser.set(r.member_user_id, [...(byUser.get(r.member_user_id) || []), String(r.id)]);
  let nudged = 0;
  for (const [userId, rowIds] of Array.from(byUser.entries())) {
    const role = await memberRole(sb, userId).catch(() => null); if (!role) continue;
    const rep = await sendToUsers(sb, [userId], chatPayload(role), now, { ignoreTopic: true }).catch(() => null);
    if (rep && rep.sent > 0) nudged += 1;
    if (rep && rep.skipped !== 'not-configured') await sb.from('portal_messages').update({ notified_at: now.toISOString() }).in('id', rowIds);
  }
  return { nudged, purged };
}
