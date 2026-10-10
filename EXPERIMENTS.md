# Portal experiments log

Method for every experiment: hypothesis, smallest change, measure, keep or revert, log.
Measures used: full test suite (npm test), type check, build, axe-core accessibility scan of each portal (WCAG 2.1 AA rules, run on the
student, client and admin panels), production bundle size (route "/" and First Load JS), and a tap count for the task.
Honest limits: bundle size and axe are measured; "time to task" is counted in taps, not timed with real people; Lighthouse is not
meaningful for the portals because they sit behind sign-in on the same page (the home page score is unchanged by these files).

Baseline (main @ 3ac14c1): route "/" 121 kB, First Load JS 292 kB. axe violations: student 4, client 0, admin 4.

| # | Portal | Hypothesis | Change | Result | Decision |
|---|--------|------------|--------|--------|----------|
| E001 | Student | The 4 prep checklist boxes have no accessible name, so a screen reader hears "checkbox" only | aria-label on each of the 4 inputs | axe student 4 -> 0 | KEEP |
| E002 | Admin | The 4 tab cards are role=button boxes that already contain a real button (nested controls confuse keyboards and screen readers) | removed role/tabindex from the outer cards; the inner button stays | axe admin 4 -> 0 | KEEP |
| E003 | Student | A first-timer does not know what to bring or where to go; a class-day card cuts "what do I need" questions | card with countdown, bring list, what to expect, directions link | tests pass, axe 0, +~1 kB; taps to find directions: 1 (was: leave the portal) | KEEP |
| E004 | Student | Rebooking takes too many steps | "Book another class" and "Renew my Wear and Carry (8-hour)" buttons on the dashboard | taps to start a renewal booking: 1 (was about 4: tab, booking, find class, select) | KEEP |
| E005 | Student | Students cannot see what they paid | Receipts card from a new server action that returns only the signed-in student's own paid invoices | isolation test: other students, unpaid rows, emails and Stripe ids never returned | KEEP |
| E006 | Student | People ask "do I need an HQL or a permit?" | Maryland requirements guide with official MSP links, labelled informational, not legal advice, no fees or dates that can go stale | links verified against mdsp.maryland.gov search results | KEEP |

After E001-E006: route "/" 123 kB (+2 kB), First Load JS 294 kB. axe violations: student 0, client 0, admin 0. 22 test suites pass.

| # | Portal | Hypothesis | Change | Result | Decision |
|---|--------|------------|--------|--------|----------|
| E007 | Client | Clients forget to renew until it is late; a visible countdown with a next step prompts action | Renewal card: days left, stage message (plenty, window, inside 90 days, passed), checklist | 14/14 browser checks; axe 0; wording avoids any deadline we could not verify (MSP says processing can take up to 90 days) | KEEP |
| E008 | Client | People will not remember a date months out | "Add reminders to my calendar": .ics with 120 days, 90 days and expiry day (made in the browser, nothing sent) | valid file test (CRLF, 3 all-day events, correct dates) | KEEP |
| E009 | Client | Renewing should be one tap | "Book my 8-hour renewal" opens the booking with the renewal class selected | taps: 1 (was about 4) | KEEP |
| E010 | Admin | Finding one student in a long roster is slow | Search box above the roster and the clients table with "Showing X of Y" | typed "lee": 2 of 3 rows kept, rest really hidden; no-match message | KEEP |
| E011 | Admin | Staff live in the keyboard | Shortcuts: g then r/c/m/t switch tabs, / jumps to search, ? lists them, Esc closes; never fire while typing or with Ctrl/Cmd/Alt | 4 pure tests + browser run incl. "typing gr in the search box does nothing" | KEEP |
| E012 | Admin, Client | Blank tables and blank cards look broken | Plain empty states: no students yet, no clients yet, no match, add your expiration date | seen in browser run | KEEP |

After E007-E012: route "/" 126 kB (+5 kB vs baseline), First Load JS 297 kB (+5 kB). axe violations: student 0, client 0, admin 0. 24 test suites pass.

Not done yet in this loop (still planned): undo for destructive admin actions, skeleton loading, remembered preferences, attendance and document-review views for admins, a payments view for admins (needs a new server route; held for approval), certificate and document wallet and reminder emails (held for approval), visual restyle (Part B, held for mockup approval).
