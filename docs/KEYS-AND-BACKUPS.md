# Keys, backups and recovery

Written 2026-10-22. This is the "what if" page: what could be lost, how bad it would be, and what to do. **It contains no secret values** (never paste a real key into this file, a chat or a screenshot).

## 1. The two keys that cannot be replaced

| Key | Where it lives | What it protects | If it is lost |
|---|---|---|---|
| `WALLET_KEY` | Vercel environment variable only | Every file in members' **Document Vault** (permit cards, certificates, photos) | Those files **cannot be read by anyone, ever.** Members would have to upload them again. |
| `ARMORY_KEY` | Vercel environment variable only | Every **Armory** record and **Armory photo** (a separate key is derived for each member from this one) | Those records and photos **cannot be read by anyone, ever.** |

These two are the only secrets where losing them means losing data. Everything else can be re-issued.

**Do this now (about 10 minutes, once):**
1. Make sure each key is saved in your **password manager** as its own entry (name it exactly `WALLET_KEY` and `ARMORY_KEY`). Vercel will not show you a value again if it was saved as "sensitive", so the password manager is the real backup.
2. Write down, in the same password-manager entry, the date it was created and the words "do not change without a plan" (see section 4).
3. Tell one trusted person where the password-manager entry is (a recovery plan that only you know about is not a plan).
4. Never change or delete either key in Vercel unless you have followed section 4. Changing it makes everything encrypted with the old one unreadable.

## 2. Secrets that can be re-issued (and what happens meanwhile)

| Secret | Used for | If lost or leaked |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | The website's full access to the database and storage | Re-issue in Supabase (Project Settings > API), update in Vercel, redeploy. The site is down until then. **If it leaks, rotate immediately.** |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Taking payments; confirming them | Re-issue in Stripe, update in Vercel, redeploy. Payments fail until then. |
| `INVOICE_LINK_SECRET` | Signs the 7-day "pay this invoice" links | Set a new one; links already emailed stop working (send new invoices). |
| `CHAT_HMAC_SECRET` | Signs staff-chat sessions | Set a new one; open chats re-establish. |
| `CRON_SECRET` | Lets the daily reminder jobs prove they are Vercel's | Set a new one in Vercel (the jobs pick it up on the next deploy). |
| `VISIT_HASH_SECRET` | Scrambles visitor identifiers in the visit counter | Set a new one; returning-visitor counts restart. |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | Phone-notification identity | **Do not change** (you decided this earlier): every member would have to turn notifications on again. |
| `RESEND_API_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `DISCORD_WEBHOOK_URL` | Email, the FIFS Guide, staff alerts | Re-issue with the provider, update in Vercel, redeploy. The feature is off until then. |

## 3. Database backups: what you have today

- **Plan:** your Supabase organisation is on the **Free** plan (checked 2026-10-22).
- **What that means (per Supabase's published plan terms as I know them, please confirm in the dashboard under Database > Backups):** Free projects do **not** get automatic daily backups, and there is no point-in-time recovery. If the database were damaged or deleted, you may have **no copy** of your students, clients, invoices, waivers and bookings.
- **Storage files** (Vault and Armory photos) are not part of database backups on any plan; they would need their own copy.
- **Free projects are also paused after a week with no activity.** Your site has regular visits so this is unlikely, but it is another reason not to rely on the free tier for customer records.

**Recommended (your decision):**
1. **Upgrade to the Pro plan (about $25 a month).** This gives daily backups kept for 7 days. It is the simplest and strongest fix.
2. **Or** keep the free plan and do a **manual export every week**: Supabase dashboard > Table Editor > each table > Export to CSV, saved in a private folder. This is slower and easy to forget.
3. Either way, also keep a copy of the encrypted storage if you ever need the Vault/Armory files back (Pro does not back these up). A restore drill (section 5) shows what you really have.

## 4. If a key ever has to be changed (rotation), safely
Do not simply replace `WALLET_KEY` or `ARMORY_KEY`. The Armory records already carry a key-version number so a new key can be added next to the old one and records re-saved under it (see `docs/ARMORY-SETUP.md`, "Replacing the key later"). The Vault has no such step yet, so changing `WALLET_KEY` today would lose every Vault file. If a rotation is ever needed, ask for a plan first.

## 5. A restore drill (do once, then once a year)
A backup you have never restored is only a hope.
1. **Keys:** open the password manager entries and confirm both keys are there and are 64 characters (letters a-f and digits).
2. **Database:** (Pro) in Supabase > Database > Backups, confirm yesterday's backup exists. (Free) confirm your latest manual export opens and has your students and clients in it.
3. **A file:** upload a test photo to the Vault and to an Armory item with a test account, open each, delete each. This proves the keys in Vercel still decrypt.
4. Write the date and result at the bottom of this file.

## 6. What happens to files when someone is deleted
When staff **permanently delete** a student or client:
- Their **Document Vault** files and records are removed (storage and database).
- Their **Armory** items and encrypted **photos** are removed (the photo files first, then the rows), before their sign-in is removed.
- Their sign-in is then removed (best effort). Records in "Recently deleted" (invoices, enrollments, messages, permits) follow their own 30-day rule.
- A member can also delete a single item, a single photo, or their whole Armory themselves.

## Drill log
| Date | Who | Keys in password manager | Backup checked | Test file opened | Notes |
|---|---|---|---|---|---|
| (not done yet) | | | | | |
