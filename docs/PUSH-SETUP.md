# Push notifications: one-time setup

Notifications are built but stay **off** until these three steps are done. Until then the "🔔 Reminders" card never appears in the portals and nothing is sent.

1. **Run the SQL.** In the Supabase SQL editor (production project), paste and run `scripts/sql/20261022_push_subscriptions.sql`. It only adds one new table (`push_subscriptions`).
2. **Make the keys.** On your computer, in the project folder, run `node scripts/make_vapid_keys.js`. It prints three lines.
3. **Add them in Vercel.** Project → Settings → Environment Variables → add `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT` (Production), then redeploy. Never share or commit the private key.

## What is sent, and when
| Notification | Who | When |
|---|---|---|
| 📅 Your class is tomorrow (adds a payment nudge if a balance is due) | Students who turned reminders on | Daily 9am Eastern job (`/api/cron/push-reminders`) |
| 🎯 Class day | Same | Same job, the morning of the class |
| 🛡️ Permit renewal | Clients who turned reminders on **and** opted in to renewal reminders | The existing permit job: 120, 90, 30 and 7 days before expiry |
| 💵 Payment received | The student, right after you record a payment in the Admin Hub | Immediately |
| 📣 FIFS update | Everyone (or only students, or only clients) | When you press **🔔 Notifications → Send now** in the Admin Hub |

- Nothing is sent before 8am or from 8pm Eastern. A note you try to send at night is refused with a clear message.
- Notifications never contain a name, an amount, a permit number or anything about a firearm.
- People turn reminders on or off in their own portal ("🔔 Reminders on this device"). iPhone and iPad only receive them after the app is added to the Home Screen.
- A device that is gone (app removed, notifications blocked) is removed from the list automatically.

## Switching it off
Delete the three environment variables and redeploy: the card disappears and nothing is sent. The table can stay.
