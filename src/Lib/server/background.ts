import * as nextServer from 'next/server';

/** Runs a job after the answer has been sent (so it never slows a booking, payment or visit down). Falls back to simply starting it when that is not available. Never throws. */
export function runAfterResponse(job: () => Promise<unknown>): void {
  const run = () => { try { return job().then(() => undefined, () => undefined); } catch { return Promise.resolve(); } };
  try { const after = (nextServer as any).after; if (typeof after === 'function') { after(run); return; } } catch { /* not inside a request: start it directly */ }
  void run();
}
