# Armory: one-time setup and what it protects

The Armory is each member's private place for their own equipment records (nickname, type, make, model, caliber, optional serial number, purchase details, notes and a maintenance log). It stays "coming soon" until the two steps below are done.

## Setup (owner)
1. **Make the key.** In the project folder run `node scripts/make_armory_key.js`. It prints one line: `ARMORY_KEY=...` (64 characters).
2. **Keep a copy.** Save that line in your **password manager** right now. If this key is ever lost, the records it protects **cannot be recovered by anyone**. Never paste it into a chat, a project file or a screenshot.
3. **Add it in Vercel.** Project → Settings → Environment Variables → add `ARMORY_KEY` (Production) with that value, then redeploy.
4. **Run the SQL.** In the Supabase SQL editor (production project) run `scripts/sql/20261028_armory_items.sql`. It only adds one new table.

## Photos (optional second step)
Members can attach up to **4 photos to each item (25 in all)**. This needs one more SQL script and no new key.
1. **Run the SQL.** In the Supabase SQL editor (production project) run `scripts/sql/20261029_armory_photos.sql`. It adds one table (`armory_photos`) and one **private** storage area (`armory`, 2 MB per file). Nothing existing changes. It is safe to run twice.
2. **Nothing else.** Photos use the same `ARMORY_KEY` and the same per-member keys as the records, so there is no new secret.
3. Until step 1 is done, the Armory works exactly as before and photo buttons simply say photos are not set up yet.

How photos are protected: each photo is shrunk and re-drawn on the member's phone (which removes any location or camera details inside it), then **encrypted on the server (AES-256-GCM, a different key per member, tied to its owner and item)** before it is stored. The server also refuses any JPEG that still carries location, camera or text details. A small encrypted preview is kept in the table so the list is quick. Only the owner can see, open or delete a photo; there is no staff screen or API, and photos are never logged, sent in notifications, shown to the AI guide, or put in the insurance package or the CSV exports. Deleting an item deletes its photos; deleting an account deletes the photo records.

## What is protected, and how
- Every item is **one encrypted blob** (AES-256-GCM). The make, model, caliber, serial number, notes and maintenance log are all inside it. The database holds only an id, the member's login id, a key version, the blob and two dates.
- Each member has a **different key**, derived from `ARMORY_KEY`. A blob is tied to its owner and item, so it cannot be moved to another person, and any change to it is detected.
- There is **no staff screen and no staff API** for the Armory. Nothing from it goes into push notifications, Discord alerts, logs, visit analytics, the chat, or the AI guide.
- A member can export their records, delete one item, or delete everything. Deleting an account deletes its records. Up to 50 items per member.

## The honest limit
This is **server-side encryption**, like the Document Vault. It is **not end-to-end encryption**: the website has to decrypt a member's records to show them to that member. It protects against a copied database and against anyone browsing records. Someone who had **both** the secret key and the database could decrypt them. Treat `ARMORY_KEY` like a vault key.

## Replacing the key later (rotation)
Each record stores a key version. A new version can be added next to the old one and records re-saved under it, so a key can be changed without losing data. Until that is set up, do not change or delete `ARMORY_KEY`.

## Switching it off
Remove `ARMORY_KEY` and redeploy: the Armory goes back to "coming soon" and refuses every request. The table and the encrypted records stay as they are.
