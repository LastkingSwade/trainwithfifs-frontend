import crypto from 'crypto';
import { PDFDocument } from 'pdf-lib';

// Pen-filled MSP 29-14 score sheet (server side). The blank form lives in the PRIVATE `scoresheets` bucket under `_template/` (a folder no student's
// own-folder policy can match) and is read here with the server key. The admin's pen layer (a transparent PNG) is laid over page 1 of that PDF and the
// result is saved through the existing score sheet route. Strokes are kept as small JSON next to it (under `_ink/`, never inside a student's folder) so a sheet
// can be edited again. Saved signature and agency stamps are per signed-in staff member under `_admin/`. Nothing here logs file contents, names or paths.
export const SCORESHEET_BUCKET = 'scoresheets';
export const TEMPLATE_PDF = '_template/msp-29-14-blank.pdf';
export const TEMPLATE_PREVIEW = '_template/msp-29-14-preview.png';
export const TEMPLATE_URL_SECONDS = 120;
export const MAX_INK_PNG_BYTES = 2_500_000;     // the transparent pen layer (before it is laid on the PDF)
export const MAX_INK_JSON_BYTES = 600_000;      // stroke data for editing again
export const MAX_STAMP_BYTES = 400_000;         // a saved signature or agency stamp
export const STAMP_KINDS = ['signature', 'agency'] as const;
export type StampKind = (typeof STAMP_KINDS)[number];

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
export type Bytes = { ok: true; bytes: Buffer } | { ok: false; error: string };

/** Decodes a base64 or data-URL PNG, trusting only its own bytes. */
export function pngFromBase64(raw: unknown, maxBytes: number, label = 'image'): Bytes {
  if (typeof raw !== 'string' || !raw) return { ok: false, error: `The ${label} could not be read.` };
  if (raw.length > Math.ceil(maxBytes / 3) * 4 + 200) return { ok: false, error: `The ${label} is too large.` };
  const m = /^data:([A-Za-z0-9.+\/-]+);base64,/.exec(raw);
  if (m && m[1].toLowerCase() !== 'image/png') return { ok: false, error: `The ${label} must be a PNG.` };
  const b64 = (m ? raw.slice(m[0].length) : raw).replace(/\s+/g, '');
  if (!b64 || !/^[A-Za-z0-9+\/]*={0,2}$/.test(b64)) return { ok: false, error: `The ${label} could not be read.` };
  const bytes = Buffer.from(b64, 'base64');
  if (bytes.length < 40 || bytes.length > maxBytes) return { ok: false, error: `The ${label} is empty or too large.` };
  if (!bytes.subarray(0, 8).equals(PNG_MAGIC)) return { ok: false, error: `The ${label} must be a PNG.` };
  return { ok: true, bytes };
}

/** Lays a transparent PNG over page 1 of the PDF, stretched to the page. The form text stays real PDF text underneath. */
export async function flattenOntoTemplate(templatePdf: Uint8Array, inkPng: Uint8Array): Promise<Uint8Array> {
  const doc = await PDFDocument.load(templatePdf, { ignoreEncryption: false });
  const page = doc.getPage(0);
  const img = await doc.embedPng(inkPng);
  page.drawImage(img, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
  return doc.save();
}

// ---- stroke data (for editing again) ---------------------------------------------------------------------------------------------------
const COLOR = /^#[0-9a-fA-F]{6}$/;
const finite = (n: unknown, lo: number, hi: number) => typeof n === 'number' && Number.isFinite(n) && n >= lo && n <= hi;
export interface InkData { v: 1; strokes: Array<{ c: string; s: number; e: 0 | 1; p: number[][] }>; items: Array<{ id: string; kind: 'text' | 'stamp'; x: number; y: number; size: number; on: boolean; text?: string; stamp?: StampKind; w?: number }> }

/** Checks and rebuilds the stroke data from scratch (only known fields survive). Returns the JSON text to store, or an error. */
export function sanitizeInk(raw: unknown): { ok: true; json: string; data: InkData } | { ok: false; error: string } {
  let obj: any = raw;
  if (typeof raw === 'string') { if (raw.length > MAX_INK_JSON_BYTES) return { ok: false, error: 'The pen data is too large.' }; try { obj = JSON.parse(raw); } catch { return { ok: false, error: 'The pen data could not be read.' }; } }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj) || obj.v !== 1 || !Array.isArray(obj.strokes) || !Array.isArray(obj.items)) return { ok: false, error: 'The pen data is not valid.' };
  if (obj.strokes.length > 4000 || obj.items.length > 40) return { ok: false, error: 'The pen data has too many parts.' };
  const strokes: InkData['strokes'] = []; let points = 0;
  for (const s of obj.strokes) {
    if (!s || typeof s !== 'object' || !COLOR.test(String(s.c)) || !finite(s.s, 0.5, 40) || !Array.isArray(s.p) || s.p.length === 0 || s.p.length > 5000) return { ok: false, error: 'A pen stroke is not valid.' };
    const p: number[][] = [];
    for (const pt of s.p) { if (!Array.isArray(pt) || pt.length !== 3 || !finite(pt[0], -50, 2500) || !finite(pt[1], -50, 3000) || !finite(pt[2], 0, 1)) return { ok: false, error: 'A pen point is not valid.' }; p.push([Math.round(pt[0] * 10) / 10, Math.round(pt[1] * 10) / 10, Math.round(pt[2] * 100) / 100]); }
    points += p.length; if (points > 150_000) return { ok: false, error: 'The pen data has too many points.' };
    strokes.push({ c: String(s.c), s: Number(s.s), e: s.e ? 1 : 0, p });
  }
  const items: InkData['items'] = [];
  for (const it of obj.items) {
    if (!it || typeof it !== 'object' || !/^[a-z0-9_-]{1,40}$/.test(String(it.id)) || !(it.kind === 'text' || it.kind === 'stamp') || !finite(it.x, -50, 2500) || !finite(it.y, -50, 3000) || !finite(it.size, 4, 400)) return { ok: false, error: 'A form item is not valid.' };
    const out: InkData['items'][number] = { id: String(it.id), kind: it.kind, x: it.x, y: it.y, size: it.size, on: !!it.on };
    if (it.kind === 'text') { const t = String(it.text ?? ''); if (t.length > 120 || /[\u0000-\u001f]/.test(t)) return { ok: false, error: 'A typed item is not valid.' }; out.text = t; }
    else { if (!(STAMP_KINDS as readonly string[]).includes(String(it.stamp))) return { ok: false, error: 'A stamp is not valid.' }; out.stamp = it.stamp; if (it.w !== undefined) { if (!finite(it.w, 10, 2500)) return { ok: false, error: 'A stamp size is not valid.' }; out.w = it.w; } }
    items.push(out);
  }
  const data: InkData = { v: 1, strokes, items }; const json = JSON.stringify(data);
  if (Buffer.byteLength(json) > MAX_INK_JSON_BYTES) return { ok: false, error: 'The pen data is too large.' };
  return { ok: true, json, data };
}

const rnd = () => crypto.randomBytes(6).toString('hex');
export const STUDENT_ID_FOLDER = /^[A-Za-z0-9-]{3,40}$/;
export const inkObjectPath = (studentId: string) => `_ink/${studentId}/ink-${Date.now()}-${rnd()}.json`;
export const isInkPathFor = (path: unknown, studentId: string): path is string => typeof path === 'string' && path.startsWith(`_ink/${studentId}/`) && !path.includes('..') && path.length < 140;
export const stampObjectPath = (staffId: string, kind: StampKind) => `_admin/${staffId}-${kind}.png`;
export const isStampKind = (v: unknown): v is StampKind => (STAMP_KINDS as readonly string[]).includes(String(v));
