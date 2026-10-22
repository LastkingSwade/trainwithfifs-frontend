// When the one-time "arrival" settle may play. Pure, so it can be tested: it only ever says yes once per browser session, never with reduced motion, and only when the NOIR flag is on
// and a member's tabs are showing (so it never plays on the public site, the boot intro or the admin screens).
export const ARRIVE_KEY = 'fifs-noir-arrived-v1';
export const ARRIVE_MS = 900;
export function shouldArrive(s: { flagOn: boolean; reducedMotion: boolean; alreadyArrived: boolean; tabsOn: boolean; booting: boolean }): boolean {
  return s.flagOn && s.tabsOn && !s.reducedMotion && !s.alreadyArrived && !s.booting;
}
