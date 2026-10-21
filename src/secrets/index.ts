import { printKernelBanner } from './kernel';
import { installNightOps } from './nightOps';
import { installFooterBadge } from './shotTimer';

/** Starts the FIFS secrets (see EASTER_EGGS.md). Safe to call more than once; does nothing on the server. */
export function installSecrets(): void {
  if (typeof window === 'undefined') return;
  printKernelBanner(); installNightOps(); installFooterBadge();
}
