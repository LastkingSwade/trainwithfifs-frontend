// Group code (pod code) input handling, shared by the browser and the server. Pure functions, no browser access.
export const GROUP_CODE_PREFIX = 'FIFS-POD-';
export const GROUP_CODE_PATTERN = /^FIFS-POD-[A-Z0-9]{4}$/;

/**
 * Turns whatever a person typed or pasted into the canonical form FIFS-POD-AB12, or returns an upper-cased best effort
 * (which then fails validation). Accepts lower case, spaces, any kind of dash or stray punctuation, zero-width characters,
 * a missing prefix ("ab12") and a prefix without dashes ("fifspodab12").
 */
export function normalizeGroupCode(value: unknown): string {
  const letters = String(value ?? '').normalize('NFKC').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!letters) return '';
  if (letters.length === 4) return GROUP_CODE_PREFIX + letters;
  if (letters.startsWith('FIFSPOD') && letters.length === 11) return GROUP_CODE_PREFIX + letters.slice(7);
  return letters;
}

/** True for a well-formed code (the format only; it says nothing about whether the code exists). */
export const isGroupCodeFormat = (value: unknown): boolean => GROUP_CODE_PATTERN.test(normalizeGroupCode(value));

/** For logs: never write a whole code. "FIFS-POD-AB12" becomes "FI***". */
export function maskCode(value: unknown): string {
  const s = String(value ?? '').trim();
  return s ? s.slice(0, 2).toUpperCase() + '***' : '(empty)';
}
