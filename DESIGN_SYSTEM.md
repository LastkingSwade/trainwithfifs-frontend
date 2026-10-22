# FIFS visual system: NOIR is the standard

The site has one design layer: **NOIR** (`src/noir/noir.css`, with `src/noir/components.tsx`, `contrast.ts` and the short arrival/vault moments in `src/noir/NoirMoments.tsx`).
The older "organic" skin (rounded glass surfaces, capsule tags, reticle corners, a script that added classes to boxes) was **retired** so the two could stop fighting each other. Nothing of it remains: no stylesheet, no script, no `data-organic` markers.

## How it is switched
- NOIR is **on for everyone**. The `<html>` tag carries `data-noir="on"` (set in `src/app/layout.tsx`).
- Kill switch: set the environment variable `NEXT_PUBLIC_NOIR` to exactly `off` and redeploy, and the page is marked `data-noir="off"`; every NOIR rule is scoped to `:root[data-noir="on"]`, so none of them apply. Nothing is stored, so there is nothing to clean up.
- `globals.css` stays append-only. New look rules go in `src/noir/noir.css` (or a new file loaded after it), always scoped to `:root[data-noir="on"]`.

## Rules we keep
- Colours come from the NOIR tokens (`--noir-void`, `--noir-obsidian`, `--noir-titanium`, `--noir-elevated`, `--noir-amber`, `--noir-cyan`, `--noir-ivory`, `--noir-muted`, `--noir-border`); every text pairing is checked in `scripts/test_noir_n1.js` (WCAG AA).
- Emoji and the cyan/amber accents the owner likes are kept; the highlighted cards (featured / combo / VIP, next step) keep their own accent treatment.
- Touch targets stay at least 44px. Focus rings are always visible.
- Motion is short (160 to 650 ms), uses only transform and opacity, never loops, and collapses to an instant change for people who ask for reduced motion.
- The boot intro, the CRT look, "Hack Detected", the hidden terminal, the HUD graphics and the calendar rules are not touched by NOIR.
- No blur filters on cards (only the fixed bars and sheets that already had them).
