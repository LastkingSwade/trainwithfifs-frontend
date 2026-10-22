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

---

# Release candidate (stage N5)

**Release-candidate code commit:** `6ae9ea552e5dd4f3abed24ac0ed46f2b268321a3` (branch `feature/noir-n4`; this report was added on top in a docs-only commit on `feature/noir-n5`).
**Base:** `origin/main` = `067928d` (what is live now). The release candidate is 6 commits on top of it: N1, the N1 merge, N2, N2 part 2, N3, N4.

## Change list (15 files, all NOIR; nothing else)
- New: `src/noir/noir.css`, `src/noir/contrast.ts`, `src/noir/components.tsx`, `src/noir/NoirMoments.tsx`, `src/noir/momentsLogic.ts`, `scripts/test_noir_n1.js` to `n4.js`, `docs/NOIR-REPORT.md`.
- Edited: `src/app/layout.tsx` (imports the NOIR stylesheet and display font, sets `data-noir` on the page, mounts one small component only when the flag is on), `package.json` (test chain only, no dependency changes), and four older test files updated deliberately (allow-lists, a regex, one allowed public variable `NEXT_PUBLIC_NOIR`).
- Not touched: anything under `src/app/api`, `src/Lib`, Supabase, SQL, payments, authentication, roles, `public/`, `next.config`, the service worker, `globals.css`, the bottom-bar code and the portals' logic.

## Test evidence (on the release-candidate commit)
- `tsc --noEmit`: pass. Full `npm test` chain: 0 failures. Production build with the flag on: pass. Production build with the flag off: pass.
- NOIR tests: N1 7, N2 8, N3 9, N4 7 checks. Every new check was mutation-tested (deliberately broken and caught), 8 + 2 + 14 + 11 breakages, and the files restored byte for byte.
- Browser (headless Chrome, local production build): with the flag **off**, the permit page is **pixel-identical** to the current site at 320, 390, 768, 1024 and 1280 px, re-checked on this exact commit. Flag on: no sideways overflow, layout shift 0, all visible tabs at least 44x44, no new continuous animation, arrival once per session and skipped with reduced motion.

## Security and compatibility review
- No new network calls, no cookies, no `localStorage`, no HTML injection, no third-party script, stylesheet or dependency. The only runtime code is `NoirMoments`, which sets a short attribute on the page and remembers "already played" in this tab's `sessionStorage`; it reads and sends no member data and is only mounted when the flag is on.
- Armory, Wallet and documents: the vault entrance animates only the empty screen frame. No selector targets records, serials, photos or text, and the test forbids `attr()` and generated text.
- Authentication, roles, payments, permit publishing rules and push are unchanged (no file in those areas is in the change list).
- Display font: self-hosted at build time through the platform's font loader; no request to Google when a visitor loads the site. A build needs internet access to fetch the font once (one build failed on a network blip and passed on retry).
- Accessibility: all text pairings 4.5:1 or better (tested), focus ring always visible, 44px targets, reduced motion, forced-colours and more-contrast handled, print drops decoration.
- Cost: stylesheet grows about 5 KB for everyone (the file ships even with the flag off); JS is unchanged.
- Known not verified: real signed-in sessions, real phones, screen readers, battery, slow networks. The milestone ring is tied to **earned** badges (computed from the member's own journal), not to agency-verified records, because the app has none.

## Rollout (needs the owner's explicit go-ahead; nothing has been deployed)
1. Merge (and push) when approved. With the flag unset, nothing visible changes.
2. In Vercel, add `NEXT_PUBLIC_NOIR=on` to the **Preview** environment only; redeploy a preview and look at it on a phone, signed in as a student and as a client.
3. If happy, add `NEXT_PUBLIC_NOIR=on` to Production and redeploy.

## Rollback
- Fastest: remove `NEXT_PUBLIC_NOIR` (or set it to anything but `on`) in Vercel and redeploy. The whole layer switches off; no data or settings change.
- Full: in Vercel, promote the previous deployment (instant rollback), or `git revert` the six commits (`067928d..6ae9ea5`).
