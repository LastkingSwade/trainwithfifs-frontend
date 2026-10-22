// The one AES-256-GCM routine the Document Vault, the Armory records and the Armory photos all share.
// Stored layout: [optional 1-byte version] + 12-byte nonce + 16-byte tag + ciphertext. The caller supplies the key and the "bound-in" text (AAD);
// a blob only opens with the same text it was sealed with, so a file cannot be moved to another person or item and any change is detected.
// Changing anything here changes how EXISTING stored data is read, so scripts/test_shared_gcm.js pins sealed samples from before this file existed.
import crypto from 'crypto';

export const NONCE_BYTES = 12, TAG_BYTES = 16;

/** Seals `plain`. With `version`, that one byte is written first (the Vault and photos do this; the Armory records do not). */
export function gcmSeal(key: Buffer, aad: Buffer, plain: Buffer, version?: number): Buffer {
  const iv = crypto.randomBytes(NONCE_BYTES); const c = crypto.createCipheriv('aes-256-gcm', key, iv); c.setAAD(aad);
  const body = Buffer.concat([c.update(plain), c.final()]);
  const parts = [iv, c.getAuthTag(), body]; if (version !== undefined) parts.unshift(Buffer.from([version]));
  return Buffer.concat(parts);
}
/** Opens a blob made by gcmSeal. `hasVersion` says whether a version byte leads the blob (the caller reads and checks that byte itself, because it picks the key). Throws if anything was changed. */
export function gcmOpen(key: Buffer, aad: Buffer, blob: Buffer, hasVersion: boolean): Buffer {
  const o = hasVersion ? 1 : 0; if (blob.length < o + NONCE_BYTES + TAG_BYTES) throw new Error('bad sealed data');
  const d = crypto.createDecipheriv('aes-256-gcm', key, blob.subarray(o, o + NONCE_BYTES)); d.setAAD(aad); d.setAuthTag(blob.subarray(o + NONCE_BYTES, o + NONCE_BYTES + TAG_BYTES));
  return Buffer.concat([d.update(blob.subarray(o + NONCE_BYTES + TAG_BYTES)), d.final()]);
}
