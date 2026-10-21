# FIFS visual system: "organic" skin

The site used to be flat rectangles with hard one-colour outlines. The organic skin makes it feel like soft, layered, hand-made gear: rounded shapes, glass surfaces, light instead of lines, and a few tiny precise details (corner reticles and tick marks) where a boxy frame used to be.

Where it lives: `src/design/organic.css` (the look), `src/design/organic.ts` (finds boxes the CSS cannot name) and `src/design/OrganicSkin.tsx` (starts it after the boot intro). The stylesheet is loaded **after** every other stylesheet and only changes shape, borders, shadows and light. It never changes sizes, positions, text, the boot intro, the CRT look, "Hack Detected", the hidden terminal, the HUD graphics or the calendar.

**Switch it off for the whole site:** add `data-organic="off"` to the `<html>` tag (in `src/app/layout.tsx`). Every rule is written to switch off with it.

## What changed, in plain words
| Before | Now |
|---|---|
| Sharp or lightly rounded rectangles | Big soft squircle corners (about 28 to 34 px), with the four corners very slightly different so nothing is a perfect box |
| One hard coloured line around every card | No line. A bright hairline on the top edge, a hair of inner light and a soft shadow give the card volume. Active and featured cards keep a gentle amber glow instead of an orange outline |
| Flat dark fill | Layered translucent "glass" fill |
| Square tags (`ID: FIFS-4081`, status labels) | Capsules (fully round) with a ring drawn in the tag's own colour at low strength |
| Boxy action buttons | Pills (or large rounded shapes for two-line buttons) with a soft inner glint, and a small springy lift on hover and press |
| Full-frame borders | Two tiny corner reticles (top right amber, bottom left emerald), and a short strip of calibration ticks on one stretch of a card's top edge |
| Flat progress bars | Soft inset tracks with a glowing teal to cyan to amber fill that eases to its length |
| Flat page background | Static soft light bleeding in from the corners (teal top left, amber bottom right) |
| One rigid column of cards | On wide screens the portal cards sit at three slightly different indents. Phones stay full width |

## Tokens (CSS variables)
| Token | Meaning |
|---|---|
| `--og-r-xl`, `--og-r-lg`, `--og-r-md`, `--og-r-sm` | corner sizes: 2.1, 1.75, 1.35, 1.1 rem |
| `--og-pill` | fully round (999px) |
| `--og-glass`, `--og-glass-deep` | the translucent surface fills |
| `--og-edge` | the light that replaces the outline (top hairline, inner light, soft inner shade) |
| `--og-lift` | the soft shadow under a card |
| `--og-glow-teal`, `--og-glow-amber` | the faint coloured glow behind a card |
| `--og-reticle`, `--og-ticks` | the corner reticles and the tick strip, ready to use as a `background-image` layer |
| `--og-spring` | the springy curve used for hover |

## Utility classes
These are added **automatically** by `organic.ts` to boxes, tags and big buttons it finds (including ones built by script or with inline styles). You can also add them by hand.

| Class | Use |
|---|---|
| `og-s` | a surface (card, panel, callout) |
| `og-p` | a capsule tag |
| `og-pb` | a capsule that is also a button (keeps a stronger ring so its edge stays easy to see) |
| `og-c` | a big action button |

To keep something out of the skin, put `data-organic="skip"` on it.

## Rules we keep
- **Edges people need to see stay visible:** text fields, drop-downs, outline buttons, tick boxes and focus rings keep their borders (accessibility needs those at 3:1 contrast). Only decorative card frames are softened.
- **Motion is optional:** every transition lives inside `prefers-reduced-motion: no-preference`. The skin has no animation of its own, only hover and press responses and a progress bar easing to its length.
- **Touch targets** stay at least 44px; the skin never shrinks anything.
- **Performance:** a handful of cheap shadows and gradients, no per-card blur filters. The scanner runs when the browser is idle, a few hundred elements at a time, and only looks at things it has not seen yet.
