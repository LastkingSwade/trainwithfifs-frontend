# UX backlog (100 micro-optimizations)

IDs are fixed so commits can cite them. Status tags in brackets show what actually happened. DONE = built in UX sprint 1 (commit 289bc75). ALREADY LIVE / CHECKED = nothing needed. SKIPPED / NOT BUILT = not done, with the reason where one exists. NA = not applicable to this site. ASK = touches payments, auth or the API and needs the owner's OK. DECIDE = needs a design or content decision. Items in the sprint-1 plan that are untagged below keep their original tag (ASK, DECIDE, NA, DONE) in parentheses.

## A. Perceived Performance & Transitions
- 1 Skeleton rows everywhere [DONE (student portal skeleton; admin tables earlier)]
- 2 Reserve space for images [DONE (5 MB favicon replaced; async image decoding; gallery frames were already fixed-size)]
- 3 Stable booking calendar height [DONE]
- 4 Prefetch booking form (NA)
- 5 Instant button feedback, visual busy state only [DONE (visual spinner only, never blocks a click)]
- 6 Optimistic checklist ticks (DECIDE)
- 7 Lazy-load remaining images [DONE]
- 8 Smooth tab/panel transitions [DONE]
- 9 Keep old rows while refreshing (DECIDE)
- 10 Compress images [PARTLY (favicon only; the Google Drive photos need a decision)]
- 11 Font display swap (NA, no web fonts)
- 12 Defer Stripe script (ASK)
- 13 Cache public data (ASK)
- 14 Checkout redirect progress (ASK)
- 15 Auto retry on network blip (ASK)
- 16 Preserve scroll on modal close [SKIPPED (would fight the script that scrolls to top on tab change)]
- 17 Smooth anchor scroll with offset [DONE]
- 18 Shimmer for wallet and online cards [NOT BUILT]
- 19 Idle-time animations (NA)
- 20 Offline notice [DONE]

## B. Navigation & Flow
- 21 Sticky Book a class button [DONE on About, FAQ and Reviews pages once they scroll (the home page is one screen tall, so it never shows there)]
- 22 Back-to-top button [DONE]
- 23 Breadcrumbs in panels (DECIDE)
- 24 Remember last portal tab [SKIPPED (would change what returning visitors land on; needs a decision)]
- 25 Smart class suggestion (DECIDE)
- 26 Class search (DECIDE)
- 27 Inline FAQ under cards (DECIDE)
- 28 Compare classes row (DECIDE)
- 29 Shortcuts in student/client portals (DECIDE)
- 30 Escape closes any modal [ALREADY LIVE (Escape handler existed)]
- 31 Focus returns after closing [DONE]
- 32 Step indicator in booking (DECIDE)
- 33 Smart date default (ASK, calendar rules)
- 34 Remember form entries (DECIDE, personal data)
- 35 Deep links (DONE)
- 36 Mobile bottom nav [DECLINED by owner]
- 37 Tap-to-call everywhere [NOT BUILT]
- 38 First-timer path (DONE)
- 39 Session-expired notice (ASK)
- 40 Contextual back button in modals [NOT BUILT]

## C. Micro-Delight & Interactive Polish
- 41 Button press feel (DONE)
- 42 Hover lift on cards (DONE)
- 43 Toggle click sound (DECIDE)
- 44 Haptic tap on phones [DONE]
- 45 Confetti on paid booking (DECIDE)
- 46 Checklist completion burst [NOT BUILT]
- 47 Animated price change (DECIDE)
- 48 Typing effect on tips (NA)
- 49 Terminal caret color in inputs [DONE]
- 50 Success checkmark draw [NOT BUILT]
- 51 Progress ring for class prep [NOT BUILT]
- 52 Study streak counter (DECIDE)
- 53 Gentle shake on invalid field [DONE]
- 54 Ripple on tap (NA)
- 55 Seasonal accent (DECIDE)
- 56 Easter egg (DECIDE)
- 57 Tooltips on 👑 and 💻 [DONE]
- 58 Count-up stats (DECIDE)
- 59 Emoji reaction on guides (DECIDE)
- 60 Tab title notification (NA)

## D. Readability & Cognitive Comfort
- 61 Contrast check on all text [CHECKED (Lighthouse accessibility 100, no contrast failures on the home page)]
- 62 Text size A-/A+ [DONE (Aa button, app views, remembered per device)]
- 63 Max line length 65 characters [DONE]
- 64 Line-height 1.5-1.6 [ALREADY FINE (line height is 1.5)]
- 65 Light mode (DECIDE)
- 66 Reduced motion respected everywhere [DONE]
- 67 Calm mode (DECIDE)
- 68 Plain-language summaries (DECIDE)
- 69 Heading hierarchy [NOT BUILT (heading order not audited)]
- 70 Chunked long forms (DECIDE)
- 71 Visible focus rings [DONE]
- 72 44px tap targets [DONE (touch screens)]
- 73 Labels on every field [CHECKED (no unlabeled fields found on the home page)]
- 74 Inline error help [NOT BUILT]
- 75 Consistent readable dates [NOT BUILT]
- 76 Price clarity (DONE)
- 77 Glossary tooltips (DECIDE)
- 78 Print-friendly receipts [DONE (basic print rules; no print button)]
- 79 Language simplification (DECIDE)
- 80 Screen-reader live regions [DONE]

## E. Engagement Loops & Discovery
- 81 Renewal countdown (DONE)
- 82 Permit expiry emails (DONE)
- 83 Calendar reminders (DONE)
- 84 Next best class (DECIDE)
- 85 Saved booking draft (DECIDE)
- 86 Abandoned-booking email (ASK)
- 87 Wishlist (DECIDE)
- 88 Recently viewed (DECIDE)
- 89 Related guides (DECIDE)
- 90 Referral code (DECIDE)
- 91 Group-booking prompt (partly done)
- 92 Review prompt after class (DECIDE)
- 93 Graduate area (DECIDE)
- 94 Wallet reminders (DECIDE)
- 95 Seasonal range tips (DECIDE)
- 96 What's new dot (DECIDE)
- 97 Which-class quiz (partly done)
- 98 Gentle exit-intent prompt (DECIDE)
- 99 Email digest opt-in (DECIDE)
- 100 "Saved just now" indicator [NOT BUILT]

## Results (UX sprint 1, commit 289bc75)
Lighthouse 12.2.1, mobile, home page, local production build, 3 runs each.

| | Before (9b96152) | After (289bc75) |
|---|---|---|
| Performance score | 52 / 71 / 70 | 92 / 92 / 92 |
| LCP | 33.7-34.1 s | 3.0 s |
| CLS | 0.026-0.037 | 0 |
| TBT | 220-250 ms | 130-160 ms |
| Page weight | 6.3 MB | 1.6 MB |
| Accessibility | not measured | 100 |

Cause of most of the weight: `src/app/icon.ico` was a 2039x1872 PNG (4.9 MB), now an 8 KB PNG. Limits: local run with simulated throttling; only the home page can be measured (portals sit behind sign-in); real LCP also depends on the Google Drive images.

## Open
- Stripe is loaded twice (v3 and dahlia). Touches payments, so it needs the owner's OK.
- The ASK and DECIDE items above.
