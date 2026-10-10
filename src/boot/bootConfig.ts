// Boot-sequence intro: every timing value in one place. It looks like a plain computer terminal: a blinking cursor, then "Access Granted .....",
// then "Loading Future Initiative Training Grounds", the screen clears, "Welcome Agent" appears on the first line, the text glitches and dissolves,
// and a CRT-TV switch-on plays: a bright line stretches across the screen, then opens to reveal the home page. The sequence always plays to the end (no ceiling); the visitor can skip any time.
// Total with the defaults: 1500 + 560 + 750 + 450 + 1008 + 800 + 200 + 910 + 650 + 800 + 700 + 700 + 300 = 9328 ms.
export const BOOT = {
  blankMs: 1500,             // empty terminal with a blinking cursor
  accessMsPerChar: 40,       // "Access Granted" typing speed
  dotMsPerChar: 150,         // the trailing dots are typed more slowly
  holdAfterAccessMs: 450,    // pause before the next line
  loadingMsPerChar: 24,      // "Loading Future Initiative Training Grounds" typing speed
  holdAfterLoadingMs: 800,   // pause on the finished loading line
  clearMs: 200,              // the screen is cleared (blank beat)
  welcomeMsPerChar: 70,      // "Welcome Agent" typing speed
  holdAfterWelcomeMs: 650,   // pause on Welcome Agent
  glitchMs: 800,             // the text glitches
  dissolveMs: 700,           // the glitching text breaks up and dissipates
  crtMs: 700,                // CRT-TV switch-on: a dot stretches into a line, then the black opens from the middle to show the home page
  fadeMs: 300,               // overlay fade-out that reveals the home page
  skipFadeMs: 150,           // fade-out when the visitor skips
  failsafeMs: 24000,         // the page is released no matter what after this long (a CSS-only backup fires at 26 s). Far above the sequence, so it never cuts it short
} as const;

export const BOOT_ACCESS = 'Access Granted';
export const BOOT_DOTS = ' .....';
export const BOOT_LOADING = 'Loading ';
export const BOOT_BRAND = 'Future Initiative Training Grounds';   // the only text in the business colours
export const BOOT_WELCOME = 'Welcome Agent';
export const BOOT_DONE_EVENT = 'fifs:boot-complete';

export const BOOT_TOTAL_MS = BOOT.blankMs + BOOT_ACCESS.length * BOOT.accessMsPerChar + BOOT_DOTS.length * BOOT.dotMsPerChar + BOOT.holdAfterAccessMs
  + (BOOT_LOADING.length + BOOT_BRAND.length) * BOOT.loadingMsPerChar + BOOT.holdAfterLoadingMs + BOOT.clearMs + BOOT_WELCOME.length * BOOT.welcomeMsPerChar
  + BOOT.holdAfterWelcomeMs + BOOT.glitchMs + BOOT.dissolveMs + BOOT.crtMs + BOOT.fadeMs;

// Runs in <head> before the first paint, so it runs on every full page load and reload (including hard refresh) and never on client-side route changes.
// Marks the page as booting on the plain home page only. No boot for: other routes, links with a hash, a password-reset/sign-in token or a group code (gcode),
// reduced motion, or search and speed-test bots. The timer here is the guarantee that the page can never stay hidden.
export const BOOT_GATE_SCRIPT = `(function(){try{var d=document.documentElement,l=location;if(l.pathname!=='/')return;if((l.hash&&l.hash!=='#')||/access_token=|[?&]code=|[?&]gcode=|type=recovery/.test(l.search+l.hash))return;if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;if(/bot|crawl|spider|slurp|lighthouse|headless|preview/i.test(navigator.userAgent))return;d.setAttribute('data-boot','on');setTimeout(function(){if(d.hasAttribute('data-boot')){d.removeAttribute('data-boot');try{window.dispatchEvent(new Event('${BOOT_DONE_EVENT}'))}catch(e){}}},${BOOT.failsafeMs});}catch(e){}})();`;
