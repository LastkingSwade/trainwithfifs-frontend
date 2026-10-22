// Vault photos: a phone photo is often 2 to 6 MB, but the Vault takes files up to 3 MB. Instead of turning the photo away, it is shrunk right here on the phone, before anything is sent
// (the Vault then encrypts it on the server exactly as it does every file). Photos already small enough are never touched. The shrunk copy is a plain JPEG with no location or camera
// details in it (re-drawing a picture drops them). Nothing leaves the device here; this file only prepares the file the person chose.
export const ATTEMPTS: readonly { side: number; quality: number }[] = [
  { side: 2400, quality: 0.85 }, { side: 2400, quality: 0.72 }, { side: 2000, quality: 0.72 }, { side: 1600, quality: 0.7 }, { side: 1600, quality: 0.55 }, { side: 1200, quality: 0.55 },
];
export const TARGET_FRACTION = 0.92; // aim a little under the limit so the encoded request stays safely inside it

/** The size to draw at: the longest side is at most `maxSide`, the picture is never made bigger, and the shape is kept. */
export function fitSize(w: number, h: number, maxSide: number): { w: number; h: number } {
  const W = Math.max(1, Math.round(w)), H = Math.max(1, Math.round(h)); const long = Math.max(W, H); if (long <= maxSide) return { w: W, h: H };
  const k = maxSide / long; return { w: Math.max(1, Math.round(W * k)), h: Math.max(1, Math.round(H * k)) };
}
export const isHeic = (type: string): boolean => /^image\/hei[cf]$/i.test(String(type || ''));
/** Only photos that are too big (or in the iPhone's HEIC format, which the Vault cannot store as it is) are prepared. PDFs and small photos go through unchanged. */
export function needsPrep(type: string, size: number, maxBytes: number): boolean {
  const t = String(type || ''); return /^image\//i.test(t) && (size > maxBytes || isHeic(t));
}

const toBlob = (c: HTMLCanvasElement, q: number): Promise<Blob | null> => new Promise((res) => c.toBlob((b) => res(b), 'image/jpeg', q));
/** Draws the picture at most `side` pixels on its longest side (white behind any transparent part) and encodes it as a plain JPEG. */
async function encode(pic: { src: CanvasImageSource; w: number; h: number }, side: number, quality: number): Promise<Blob | null> {
  const d = fitSize(pic.w, pic.h, side); const c = document.createElement('canvas'); c.width = d.w; c.height = d.h; const x = c.getContext('2d'); if (!x) return null;
  x.fillStyle = '#fff'; x.fillRect(0, 0, d.w, d.h); x.drawImage(pic.src, 0, 0, d.w, d.h); const b = await toBlob(c, quality); c.width = 0; c.height = 0; return b && b.size > 0 ? b : null;
}
async function decode(file: File): Promise<{ src: CanvasImageSource; w: number; h: number; close: () => void } | null> {
  try { const b = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions); return { src: b, w: b.width, h: b.height, close: () => b.close() }; } catch { /* try the older way */ }
  try {
    const url = URL.createObjectURL(file); const img = new Image(); img.decoding = 'async'; img.src = url; await img.decode(); URL.revokeObjectURL(url);
    return { src: img, w: img.naturalWidth, h: img.naturalHeight, close: () => undefined };
  } catch { return null; }
}

export type PrepResult = { ok: true; file: File; shrunk: boolean } | { ok: false; message: string };
export async function prepPhoto(file: File, maxBytes: number): Promise<PrepResult> {
  if (!needsPrep(file.type, file.size, maxBytes)) return { ok: true, file, shrunk: false };
  const pic = await decode(file); if (!pic || !pic.w || !pic.h) return { ok: false, message: 'This browser cannot open that photo. Take the photo again, or choose a JPG or PNG.' };
  try {
    for (const a of ATTEMPTS) {
      const d = fitSize(pic.w, pic.h, a.side); const c = document.createElement('canvas'); c.width = d.w; c.height = d.h; const x = c.getContext('2d'); if (!x) break;
      x.fillStyle = '#fff'; x.fillRect(0, 0, d.w, d.h); x.drawImage(pic.src, 0, 0, d.w, d.h);
      const b = await toBlob(c, a.quality); c.width = 0; c.height = 0;
      if (b && b.size > 0 && b.size <= maxBytes * TARGET_FRACTION) return { ok: true, shrunk: true, file: new File([b], (file.name || 'photo').replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' }) };
    }
  } finally { pic.close(); }
  return { ok: false, message: 'That photo could not be made small enough. Try taking it again a little closer, or choose a smaller photo.' };
}

// ---- Armory photos: ALWAYS re-drawn (even a small photo), so no location, camera or text details travel with it; plus a small preview for the list. ----
export const ARMORY_MAX_BYTES = 1_500_000, ARMORY_THUMB_MAX = 40_000;
export const ARMORY_ATTEMPTS: readonly { side: number; quality: number }[] = [{ side: 2000, quality: 0.82 }, { side: 2000, quality: 0.7 }, { side: 1600, quality: 0.7 }, { side: 1600, quality: 0.55 }, { side: 1200, quality: 0.55 }];
export const THUMB_ATTEMPTS: readonly { side: number; quality: number }[] = [{ side: 320, quality: 0.7 }, { side: 320, quality: 0.55 }, { side: 240, quality: 0.5 }, { side: 200, quality: 0.4 }];
export type ArmoryPrep = { ok: true; main: Blob; thumb: Blob } | { ok: false; message: string };
export async function prepArmoryPhoto(file: File): Promise<ArmoryPrep> {
  if (!/^image\//i.test(String(file && file.type))) return { ok: false, message: 'Please choose a photo (a picture file).' };
  const pic = await decode(file); if (!pic || !pic.w || !pic.h) return { ok: false, message: 'This browser cannot open that photo. Take the photo again, or choose a JPG or PNG.' };
  try {
    let main: Blob | null = null; for (const a of ARMORY_ATTEMPTS) { const b = await encode(pic, a.side, a.quality); if (b && b.size <= ARMORY_MAX_BYTES * TARGET_FRACTION) { main = b; break; } }
    if (!main) return { ok: false, message: 'That photo could not be made small enough. Try taking it again a little closer, or choose a smaller photo.' };
    let thumb: Blob | null = null; for (const a of THUMB_ATTEMPTS) { const b = await encode(pic, a.side, a.quality); if (b && b.size <= ARMORY_THUMB_MAX) { thumb = b; break; } }
    if (!thumb) return { ok: false, message: 'That photo could not be prepared. Please choose another.' };
    return { ok: true, main, thumb };
  } finally { pic.close(); }
}
export const blobToBase64 = (b: Blob): Promise<string> => new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result).split(',')[1] || ''); r.onerror = () => reject(new Error('Could not read that photo.')); r.readAsDataURL(b); });
