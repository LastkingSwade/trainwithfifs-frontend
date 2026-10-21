# FIFS Guide: setup and what it does

The FIFS Guide is a "🤖 Ask the FIFS Guide" window in the Hub menu for **signed-in students and clients only**. It answers questions about classes, booking and how to use the portal. It stays "coming soon" until the key below is added.

## Setup (owner)
1. Create an account with the AI provider (Anthropic) and make an API key.
2. **Set a monthly spending limit** in the provider's own dashboard (I suggest $20). That is the hard cap: when it is reached the Guide simply stops answering and shows your phone number.
3. In Vercel add `ANTHROPIC_API_KEY` (Production) with that key, then redeploy. Never paste the key into a chat, a file in the project, or a screenshot.
4. **Review `src/ai/knowledge.ts`.** It is the only place the Guide's knowledge lives, and it is drawn from text already on your site and in your portals. Edit anything you want said differently. The Guide cannot answer outside it.

## What it will and will not do
- Answers only from the approved reference text, and shows which sources it used.
- **Never gives legal advice.** Questions about what is legal or allowed never reach the AI: the member gets a fixed message pointing to the Reciprocity Hub, the Maryland State Police page and Coach Kai.
- It cannot see anyone's records, cannot take actions, and has no access to the database.
- It never shows a link that is not in the approved list, and it removes any other link or markup from an answer before it is shown.

## What is sent, and what is stored
- **Sent to the provider:** only the member's typed question (up to 500 characters), up to six earlier turns of that conversation, and the few reference passages that match. **Not sent:** name, email, account id, any record, document, journal or armory entry.
- **Not stored:** nothing is saved on the server and nothing is logged. The conversation lives only in the member's window and disappears when it is closed.
- Each member can ask 30 questions a day. Questions are limited per minute as well.

## Switching it off
Remove `ANTHROPIC_API_KEY` and redeploy: the Guide goes back to "coming soon" and refuses every request.
