# FIFS NOIR: how to turn it on, what was measured, and how to turn it off

NOIR is a visual layer that is **off by default**. It turns on only when the environment variable `NEXT_PUBLIC_NOIR` is exactly `on`. Set it in a Vercel **Preview** environment first; leave Production unset until you have looked at it.
To turn it off, remove the variable (or set anything other than `on`) and redeploy. Nothing is stored and no data changes, so there is nothing to clean up.

## What each stage added (all behind the flag)
- N1: colour tokens, a display font for titles (Cormorant Garamond, loaded at build time), a shared panel and heading.
- N2: bottom bars and the Hub and Armory sheets; the existing panels get the NOIR surface (text colours and accents untouched); hover, pressed, current-tab and focus states.
- N3: a once-per-session arrival settle, a vault entrance, screen motion, a gold ring on earned badges, a still ambient light.
- N4: lighter lighting on phones, no ambient light for "more contrast" users or in print, and size and cost limits enforced by a test.

## Measurements (local production build, headless Chrome, 2026-10-22)
| Check | main | NOIR off | NOIR on |
|---|---|---|---|
| Permit page pixels at 320, 390, 768, 1024, 1280 px | baseline | **identical** to main at all five widths | differs on purpose (new look) |
| Sideways overflow at those widths | none | none | none |
| Layout shift (CLS) | 0 | 0 | 0 |
| First paint, permit page, phone (5 loads) | 60-104 ms | 52-60 ms | 52-80 ms |
| Tab size (visible bars) | 64x56 and up | same | same (all at least 44x44) |
| Animations running after 2.5 s | the site's own HUD set | same set | same set (NOIR adds none that keep running) |
| JS shared by all pages | n/a | 103 kB | 103 kB |
| Page JS for `/` and `/permits` | n/a | 182 kB / 1.14 kB | 182 kB / 1.14 kB |
| Stylesheet size shipped to everyone | 309,268 bytes | about 314,600 bytes | about 314,600 bytes |

The home page's slow "largest paint" (about 8.6 s) is the same on main, with NOIR off and with NOIR on: it comes from the existing boot intro and hero, not from NOIR.

## Not measured
Real signed-in screens, a real phone, battery use, a screen reader, and real-world network speeds. Timings above are from a fast local machine and only show that NOIR makes no measurable difference there.
