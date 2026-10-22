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
