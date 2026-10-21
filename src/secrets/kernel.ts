import { SAFETY_RULES } from './logic';

// Tier 1: what anyone who opens the browser's developer tools sees. Printed once per page load; it reads nothing and sends nothing.
const ART = [
  ' _____ ___ _____ ____  ',
  '|  ___|_ _|  ___/ ___| ',
  '| |_   | || |_  \\___ \\ ',
  '|  _|  | ||  _|  ___) |',
  '|_|   |___|_|   |____/ ',
].join('\n');

export interface KernelLine { text: string; css: string }
const CYAN = 'color:#00e5ff;font-weight:700;font-family:monospace';
const AMBER = 'color:#ffb703;font-weight:700';
const DIM = 'color:#94a3b8';
const RULE = 'color:#6ee7b7;font-weight:600';

/** The lines of the banner, as text plus the console style for each. Pure, so it can be tested. */
export function kernelLines(): KernelLine[] {
  return [
    { text: ART, css: CYAN },
    { text: 'FUTURE INITIATIVE FIREARM SERVICES', css: AMBER },
    { text: 'Instructor Wade  [ The Kernel ]  ·  Maryland Wear & Carry · HQL · Defensive Handgun', css: DIM },
    { text: ' ', css: DIM },
    { text: 'THE 4 UNIVERSAL FIREARM SAFETY RULES', css: AMBER },
    ...SAFETY_RULES.map((r, i) => ({ text: `  ${i + 1}. ${r}`, css: RULE })),
    { text: ' ', css: DIM },
    { text: 'Curious how it works? Good. Curiosity makes safe shooters. Come train with us: trainwithfifs.com', css: DIM },
  ];
}

export function printKernelBanner(): void {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { __fifsKernel?: boolean };
  if (w.__fifsKernel) return; w.__fifsKernel = true;
  try { for (const l of kernelLines()) console.info('%c' + l.text, l.css); } catch { /* a locked-down console is fine */ }
}
