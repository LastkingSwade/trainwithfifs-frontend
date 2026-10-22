# Permit Center: verification record (2026-10-21)

The Permit Center shows a guide to the public only when **every fact has a check date and an official source** (`publishable` in `src/permits/logic.ts`). This file records what was checked, how, and what was **not** verified.

## Published: Maryland (checked 2026-10-21)
Read on the Maryland State Police pages linked in the guide:
- Wear & Carry Permit: https://mdsp.maryland.gov/firearms-permits-professional-licenses/wear-carry-permit
- Handgun Qualification License: https://mdsp.maryland.gov/Organization/Pages/CriminalInvestigationBureau/LicensingDivision/Firearms/HandgunQualificationLicense.aspx

| Topic | What the official page says | In the guide |
|---|---|---|
| Authority | MSP Licensing Division, online Licensing Portal | yes |
| Who can apply | 21+, or active military; disqualifiers listed on the page | summarized, with a note that the guide cannot decide eligibility |
| Training | 16-hour initial (within 2 years before applying), 8-hour renewal, Qualified Handgun Instructor, MSP 29-14 score sheet | yes |
| Fees | $125 initial, $75 renewal; fingerprints extra; non-refundable | yes |
| Processing | Final decision within 90 days; first permit valid 2 years, renewal 3 years; start renewal 90 days early; renew 14+ days before expiry to keep carrying | yes |
| HQL | Required before buy/rent/receive; 4-hour course within 3 years; live-fire not beyond 15 yards; $50 / $20; decision within 30 days; valid 10 years | yes |
| Residency rule | **Not stated on the page** | shown as "not available yet" |
| Live-fire for the Wear & Carry course | **Not described on the page** | left out |
| Replacement fee | The page contradicts itself ($20 in the list, $10 in the FAQ) | left out |
| Fingerprint fee amount | Not on the page | "extra" only |
| "Last updated" date | The page has none (only "September 2025: application question addition") | each fact shows our check date |

The class PDF (instructor lesson plan) was used only to understand the class; its statutes, cases and jury instructions are **not** published, and its live-fire scoring (not on an official page) is not in the guide.

### Existing site text that differs from the official pages (reported, see the change log in the pull summary)
1. **Processing times.** The FAQ says HQL "14 to 30 days" and Wear & Carry "45 to 90 days". The state publishes a *maximum* of 30 days (HQL) and 90 days (Wear & Carry). The FAQ numbers are "typical" figures the state does not publish.
2. **Renewal window.** The Renewal Center said permits are "completely suspended" if they expire before renewal is processed. The MSP says: renew at least 14 days before expiration to keep carrying until a decision; if it expires, reapply as a new applicant.
3. **Qualification score.** The Renewal Center paired "25-round BPHC" with "175/250". Per the MSP course material, the 25-round Basic Practical Handgun Course passes at 90 of 125 points; 175 of 250 belongs to the 50-round Security Professionals course.

## Reciprocity facts used in the guides (checked 2026-10-21, see docs/RECIPROCITY-CHECK.md)
- Maryland does not recognize other states' permits (MSP Wear & Carry page).
- Virginia lists Maryland among recognized states (21+, photo ID; changes from July 1, 2027).
- Pennsylvania does not recognize Maryland permits (Attorney General page).
- Florida and Arizona: **not verified**; shown as "Not yet reviewed".

## Drafts (not published): Virginia, Florida, Arizona, Pennsylvania
Gathered from official pages on 2026-10-21 and kept out of the public site (production shows "Guide in review"; preview builds show the content under a DRAFT banner). Nothing in them has been reviewed. Known conflicts to resolve before publishing:
- **Virginia:** the statute and regulations require two photographs, the State Police page describes one; a 2026 bill (HB916) may change the section; processing time not gathered.
- **Florida:** the $97 out-of-state total comes from application instructions with partly unclear fee text; accepted training courses and processing time not gathered.
- **Arizona:** sources conflict on whether a U.S. citizen who lives in another state may apply; the fee page looks old; application steps and processing time not gathered; permitless-carry rules not re-checked.
- **Pennsylvania:** York County's own pages conflict on the fee and payment method (and changed from July 1, 2026); non-resident training rule not gathered; other counties may refuse non-resident applicants.

## To publish a draft
Check each fact against its official page, replace `verifiedOn: null` with the check date, resolve each caution, then set `status: 'published'` and add the page to `public/sitemap.xml`. The page refuses to publish (it shows "Guide in review") if any fact lacks a date or an official `.gov` source.
