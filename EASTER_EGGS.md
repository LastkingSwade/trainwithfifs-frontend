# FIFS secrets (easter eggs)

Four hidden extras. None of them blocks booking, the Student Portal sign-in or anything else, none stores or sends personal data, and every one of them is off for people who ask their device for reduced motion (anything that moves is switched off; the simple on/off states still work).

| # | Name | How to find it | What happens | How to leave |
|---|------|----------------|--------------|--------------|
| 1 | **The Kernel signature** (under the hood) | Open the browser's developer tools (F12, or right-click, Inspect) and look at the Console | A styled FIFS banner, "Instructor Wade [ The Kernel ]", and the 4 Universal Firearm Safety Rules | Nothing to leave. Printed once per page load. |
| 2 | **Night-Ops / Red-Dot HUD** (keyboard) | On a computer, type `fifs` or `nvg` anywhere on the site except inside a text box | The whole site turns phosphor green, with a thin telemetry bar at the bottom (mode, Eastern time, "SAFETY: ON"). Type it again for red-dot crimson, and a third time to turn it off. | Press `Esc`, press the **Exit** button on the bar, or type the word again until it turns off. Reloading the page also clears it. |
| 3 | **Shot Timer** (micro-game) | Triple-click (or triple-tap, or press Enter three times on) the small **FIFS badge** at the very bottom of any page | A floating "draw to first shot" timer: "Standby…" for 1.5 to 3.5 seconds, then BEEP and a flash. Tap the big pad as fast as you can. Grades: **Grandmaster** (0.60 s or faster), **Maryland Qualified** (within the 1.25 s par), **Needs Dry-Fire Practice**. Tapping early is a false start. Your best time is remembered in that browser only. | `Esc`, or the ✕ button. The 🔊 button mutes the beep. |
| 4 | **Off-Paper 404** (custom not-found page) | Visit any address that does not exist, for example `trainwithfifs.com/missed-the-target` | A qualification target (MSP Form 29-14 style) with the shot off the paper. Use the arrow buttons or the arrow keys to adjust windage and elevation until you are on paper, then on the center. | The big "Return to the firing line" button goes to the home page; "Course roster" goes to the class list. |

## Notes for the owner
- The footer badge is new: a small, quiet FIFS mark with the school name at the bottom of every page. It does nothing on a single click.
- The secrets never listen while someone is typing in a form box, and they ignore keys held with Ctrl, Cmd or Alt, so normal browser shortcuts are untouched. They do not clash with the existing hidden terminal (`↑ ↑ g u n s`) or the admin shortcuts.
- Where the code lives: `src/secrets/` (`kernel.ts`, `nightOps.ts`, `shotTimer.ts`, `OffPaper.tsx`, `logic.ts`, `secrets.css`) and `src/app/not-found.tsx`. Tests: `scripts/test_secrets.js`.
- To remove any one of them, delete its line in `src/secrets/index.ts` (the 404 page is `src/app/not-found.tsx`).
