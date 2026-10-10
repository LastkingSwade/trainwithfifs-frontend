// Boot-sequence intro: every timing value in one place. The sequence always plays to the end (no ceiling); the visitor can skip any time.
// Total with the defaults: 300 + 1190 + 500 + 350 + 400 + 13 x 40 + 700 + 400 = 4360 ms.
export const BOOT = {
  blankMs: 300,              // black screen with the cursor blinking
  typeMsPerChar: 35,         // title typing speed
  holdAfterTitleMs: 500,     // pause after the title is typed
  grantedMsPerChar: 25,      // "ACCESS GRANTED" typing speed
  holdAfterGrantedMs: 400,   // pause on ACCESS GRANTED (the glow pulse plays at its start)
  welcomeMsPerChar: 40,      // "WELCOME AGENT" typing speed
  holdAfterWelcomeMs: 700,   // pause on WELCOME AGENT before the page appears
  fadeMs: 400,               // overlay fade-out
  skipFadeMs: 150,           // fade-out when the visitor skips
  failsafeMs: 15000,         // the page is released no matter what after this long (a CSS-only backup fires at 16 s). Far above the sequence, so it never cuts it short
} as const;

export const BOOT_TITLE = 'FUTURE INITIATIVE FIREARM SERVICES';
export const BOOT_GRANTED = 'ACCESS GRANTED';
export const BOOT_WELCOME = 'WELCOME AGENT';
export const BOOT_DONE_EVENT = 'fifs:boot-complete';

export const BOOT_TOTAL_MS = BOOT.blankMs + BOOT_TITLE.length * BOOT.typeMsPerChar + BOOT.holdAfterTitleMs + BOOT_GRANTED.length * BOOT.grantedMsPerChar + BOOT.holdAfterGrantedMs + BOOT_WELCOME.length * BOOT.welcomeMsPerChar + BOOT.holdAfterWelcomeMs + BOOT.fadeMs;

// Runs in <head> before the first paint, so it runs on every full page load and reload (including hard refresh) and never on client-side route changes.
// Marks the page as booting on the plain home page only. No boot for: other routes, links with a hash or a password-reset/sign-in token,
// reduced motion, or search and speed-test bots. The timer here is the guarantee that the page can never stay hidden.
export const BOOT_GATE_SCRIPT = `(function(){try{var d=document.documentElement,l=location;if(l.pathname!=='/')return;if((l.hash&&l.hash!=='#')||/access_token=|[?&]code=|type=recovery/.test(l.search+l.hash))return;if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;if(/bot|crawl|spider|slurp|lighthouse|headless|preview/i.test(navigator.userAgent))return;d.setAttribute('data-boot','on');setTimeout(function(){if(d.hasAttribute('data-boot')){d.removeAttribute('data-boot');try{window.dispatchEvent(new Event('${BOOT_DONE_EVENT}'))}catch(e){}}},${BOOT.failsafeMs});}catch(e){}})();`;
