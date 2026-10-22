# FIFS Guide: setup and what it does

The FIFS Guide is a "🤖 Ask the FIFS Guide" window in the Hub menu for **signed-in students and clients only**. It answers questions about classes, booking and how to use the portal. It stays "coming soon" until the key below is added.

## Setup (owner): free option with Google Gemini (recommended)
1. In Google AI Studio (aistudio.google.com) create an API key. **Do not link a billing account to it**, so it can never charge you.
2. In Vercel add `GEMINI_API_KEY` (Production, Sensitive) with that key, then redeploy. If it is set, the Guide uses Gemini first. The model is `gemini-3.5-flash-lite` unless you set `GEMINI_MODEL`.
3. **What the free tier means:** Google's free tier may use the questions sent to it to improve Google's products, and its limits can change without notice. Only the typed question, a few earlier turns and the matching approved passages are sent, and the window tells members not to enter personal details. If the free limit runs out the Guide shows the friendly "call Coach Kai" message.

## Setup (owner): paid option with Anthropic
1. Create an account with Anthropic and make an API key.
2. **Set a monthly spending limit** in the provider's own dashboard (I suggest $20). That is the hard cap: when it is reached the Guide simply stops answering and shows your phone number.
3. In Vercel add `ANTHROPIC_API_KEY` (Production) with that key, then redeploy (only used when no valid `GEMINI_API_KEY` is set). Never paste the key into a chat, a file in the project, or a screenshot.
4. **Review `src/ai/knowledge.ts`.** It is the only place the Guide's knowledge lives, and it is drawn from text already on your site and in your portals. Edit anything you want said differently. The Guide cannot answer outside it.

## What it will and will not do
- **Crisis messages:** if a member says they want to hurt themselves, the Guide never asks an AI: it answers with a fixed caring message pointing to 988 (call or text, 24/7), 911 and Coach Kai.
- **Knowledge:** it includes the Maryland State Police Wear and Carry course material (safety check, handgun basics, cleaning, storage, live-fire courses, conflict, anger and suicide prevention). The statutes, cases and jury instructions in that PDF are deliberately **not** included: the Guide must not explain the law, so it only lists those topics as part of the class.
- Answers only from the approved reference text, and shows which sources it used.
- **Never gives legal advice.** Questions about what is legal or allowed never reach the AI: the member gets a fixed message pointing to the Reciprocity Hub, the Maryland State Police page and Coach Kai.
- It cannot see anyone's records, cannot take actions, and has no access to the database.
- It never shows a link that is not in the approved list, and it removes any other link or markup from an answer before it is shown.

## What is sent, and what is stored
- **Sent to the provider:** only the member's typed question (up to 500 characters), up to six earlier turns of that conversation, and the few reference passages that match. **Not sent:** name, email, account id, any record, document, journal or armory entry.
- **Not stored:** nothing is saved on the server and nothing is logged. The conversation lives only in the member's window and disappears when it is closed.
- Each member can ask 30 questions a day. Questions are limited per minute as well.

## Switching it off
Remove both `GEMINI_API_KEY` and `ANTHROPIC_API_KEY` and redeploy: the Guide goes back to "coming soon" and refuses every request.
