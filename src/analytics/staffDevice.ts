// A device where Admin Hub alerts are on belongs to staff, so its visits are not counted in the website telemetry and do not trigger "someone is visiting" alerts.
// It is a single marker kept in THIS browser only (localStorage), set when alerts are on and removed when they are turned off. Nothing about it is sent to the server.
export const STAFF_DEVICE_KEY = 'fifs_staff_device';

/** Is this browser a staff device (admin alerts on)? Storage can be blocked: then it is not a staff device, and visits are counted as normal. */
export function isStaffDevice(store: Pick<Storage, 'getItem'> | null = typeof localStorage !== 'undefined' ? localStorage : null): boolean {
  try { return !!store && store.getItem(STAFF_DEVICE_KEY) === '1'; } catch { return false; }
}

/** Mark or unmark this browser. Never throws. */
export function setStaffDevice(on: boolean, store: Pick<Storage, 'setItem' | 'removeItem'> | null = typeof localStorage !== 'undefined' ? localStorage : null): void {
  try { if (!store) return; if (on) store.setItem(STAFF_DEVICE_KEY, '1'); else store.removeItem(STAFF_DEVICE_KEY); } catch { /* storage blocked: nothing to mark */ }
}
