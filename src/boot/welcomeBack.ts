// The name shown in "Welcome Back Agent <name>": the first word of the full name on the signed-in person's own portal record. Plain text only; nothing is stored.
export function firstName(record: unknown): string {
  const n = record && typeof record === 'object' ? String((record as { fullName?: unknown }).fullName ?? '') : '';
  const w = n.replace(/[\u0000-\u001f\u007f-\u009f<>]/g, ' ').trim().split(/\s+/)[0] || '';
  return w.slice(0, 24);
}
/** The name from whichever portal record the restore has loaded (student first, then client). */
export function nameFromPortals(w: { __fifsStudentPortalRecord?: unknown; __fifsClientPortalRecord?: unknown }): string {
  return firstName(w.__fifsStudentPortalRecord) || firstName(w.__fifsClientPortalRecord);
}
