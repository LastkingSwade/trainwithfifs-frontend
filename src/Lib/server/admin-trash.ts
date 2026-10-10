// "Recently deleted" for the two destructive admin actions (delete student, delete client). Right before a delete, a copy of the record and
// its closest related rows is saved here, server-only, for 30 days. Staff can put it back from the Admin Hub. The route checks the staff
// role BEFORE calling anything here. A sign-in (login) is NOT restored: the person gets a fresh invite after the record is back.
export type TrashKind = 'student' | 'client';
export interface TrashItem { id: string; kind: TrashKind; label: string; deletedBy: string; deletedAt: string; expiresAt: string; counts: Record<string, number> }
export type TrashResult<T = {}> = ({ ok: true } & T) | { ok: false; status: number; message: string };

export const TRASH_DAYS = 30;
const SPEC: Record<TrashKind, { main: string; related: Array<{ table: string; col: string; from: 'student_id' | 'client_id' | 'user_id' }> }> = {
  student: { main: 'students', related: [{ table: 'invoices', col: 'student_id', from: 'student_id' }, { table: 'enrollments', col: 'user_id', from: 'user_id' }, { table: 'messages', col: 'student_id', from: 'student_id' }] },
  client: { main: 'clients', related: [{ table: 'user_permits', col: 'client_id', from: 'client_id' }] },
};
const NO_LOGIN = ['user_id'];   // restored rows never point at a sign-in that was removed

/** Copies the record and its related rows into the trash. Returns the trash id, or null when it could not be saved (the delete then goes on without undo). */
export async function saveToTrash(supabase: any, kind: TrashKind, mainRow: Record<string, any> | null | undefined, label: string, deletedBy: string): Promise<string | null> {
  try {
    if (!mainRow) return null;
    const spec = SPEC[kind]; const bundle: Record<string, any[]> = { [spec.main]: [mainRow] };
    for (const rel of spec.related) {
      const key = mainRow[rel.from]; if (!key) { bundle[rel.table] = []; continue; }
      const { data, error } = await supabase.from(rel.table).select('*').eq(rel.col, key);
      if (error) return null;               // an incomplete copy would give a false sense of safety
      bundle[rel.table] = Array.isArray(data) ? data : [];
    }
    const expires = new Date(Date.now() + TRASH_DAYS * 86400000).toISOString();
    const { data, error } = await supabase.from('admin_trash').insert({ kind, label: String(label || '').slice(0, 160), deleted_by: String(deletedBy || '').slice(0, 160), bundle, expires_at: expires }).select('id').maybeSingle();
    if (error || !data?.id) return null;
    return String(data.id);
  } catch (err: any) { console.warn('[Trash] save unavailable:', err?.message); return null; }
}

export async function listTrash(supabase: any): Promise<TrashResult<{ items: TrashItem[] }>> {
  try {
    await supabase.from('admin_trash').delete().lt('expires_at', new Date().toISOString());
    const { data, error } = await supabase.from('admin_trash').select('id, kind, label, deleted_by, created_at, expires_at, bundle').is('restored_at', null).order('created_at', { ascending: false }).limit(100);
    if (error || !Array.isArray(data)) return { ok: false, status: 503, message: 'Recently deleted is not set up yet. Run the database script first.' };
    return { ok: true, items: data.map((r: any) => ({ id: String(r.id), kind: r.kind === 'client' ? 'client' as const : 'student' as const, label: String(r.label || ''), deletedBy: String(r.deleted_by || ''), deletedAt: String(r.created_at || ''), expiresAt: String(r.expires_at || ''),
      counts: Object.fromEntries(Object.entries(r.bundle || {}).map(([t, rows]) => [t, Array.isArray(rows) ? rows.length : 0])) })) };
  } catch (err: any) { console.warn('[Trash] list unavailable:', err?.message); return { ok: false, status: 503, message: 'Could not load recently deleted.' }; }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function restoreFromTrash(supabase: any, id: unknown, restoredBy: string): Promise<TrashResult<{ restored: Record<string, number>; skipped: string[]; note: string }>> {
  const trashId = String(id ?? '');
  if (!UUID.test(trashId)) return { ok: false, status: 400, message: 'Choose an item to restore.' };
  try {
    const { data: item, error } = await supabase.from('admin_trash').select('id, kind, bundle, expires_at, restored_at').eq('id', trashId).maybeSingle();
    if (error) return { ok: false, status: 503, message: 'Could not load that item.' };
    if (!item || item.restored_at) return { ok: false, status: 404, message: 'That item is not in recently deleted any more.' };
    if (Date.parse(item.expires_at) < Date.now()) return { ok: false, status: 410, message: 'That item expired and can no longer be restored.' };
    const kind: TrashKind = item.kind === 'client' ? 'client' : 'student'; const spec = SPEC[kind];
    const mainRows: any[] = (item.bundle || {})[spec.main] || []; const main = mainRows[0];
    if (!main) return { ok: false, status: 422, message: 'This item has no record to restore.' };

    // Never overwrite or duplicate a record that exists now.
    const idCol = kind === 'student' ? 'student_id' : 'client_id';
    for (const [col, val] of [['id', main.id], [idCol, main[idCol]], ['email', main.email]] as Array<[string, any]>) {
      if (!val) continue;
      const { data: clash, error: cErr } = await supabase.from(spec.main).select('id').eq(col, val).limit(1);
      if (cErr) return { ok: false, status: 503, message: 'Could not check for an existing record.' };
      if (Array.isArray(clash) && clash.length) return { ok: false, status: 409, message: `A ${kind} with the same ${col === 'id' ? 'record' : col === 'email' ? 'email' : 'ID'} already exists, so nothing was restored.` };
    }
    const clean = (row: any) => { const r = { ...row }; for (const c of NO_LOGIN) if (c in r) r[c] = null; return r; };
    const ins = await supabase.from(spec.main).insert(clean(main));
    if (ins.error) return { ok: false, status: 500, message: 'Could not restore the record. Nothing was changed.' };
    const restored: Record<string, number> = { [spec.main]: 1 }; const skipped: string[] = [];
    for (const rel of spec.related) {
      const rows: any[] = (item.bundle || {})[rel.table] || []; if (!rows.length) continue;
      const r = await supabase.from(rel.table).insert(rows.map(clean));
      if (r.error) skipped.push(rel.table); else restored[rel.table] = rows.length;
    }
    await supabase.from('admin_trash').update({ restored_at: new Date().toISOString(), restored_by: String(restoredBy).slice(0, 160) }).eq('id', trashId);
    return { ok: true, restored, skipped, note: 'Their sign-in was not restored. Send a new invite so they can log in again.' };
  } catch (err: any) { console.warn('[Trash] restore failed:', err?.message); return { ok: false, status: 500, message: 'Could not restore. Nothing was changed.' }; }
}
