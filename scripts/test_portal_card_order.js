/**
 * TrainWithFIFS - where the Range Journal card sits, and no leftover Vault references in the client hub (offline)
 * Student portal: the journal card sits between the Personal Student Training Dossier card and the MSP MyLicense Official Portal card.
 * Client portal: the journal card is the first card in the hub list; the Document Vault card (and other redundant Vault mentions) are gone because the Vault is on the bottom tab bar.
 */
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const page = read('src/app/page.tsx');
const block = (a, b) => { const i = page.indexOf(a); const j = page.indexOf(b, i); assert(i > 0 && j > i, 'block ' + a); return page.slice(i, j); };
const student = block('<div className="hidden" id="student-active-dashboard"', '{/* State Dossier Details Modal */}');
const client = block('<div id="client-active-dashboard"', 'Legal & Regulatory Notice:');
const ui = (s) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/style=\{\{[^}]*\}\}/g, '');

(async () => {
  await test('student portal: the journal card sits between the Personal Student Training Dossier card and the MSP MyLicense Official Portal card, inside the same card list', () => {
    const dossier = student.indexOf('Personal Student Training Dossier'), journal = student.indexOf('data-range-journal-launch="student"'), msp = student.indexOf('MSP MyLicense Official Portal'), waiver = student.indexOf('id="portalWaiverCard"');
    assert(dossier > 0 && journal > dossier && journal < msp && msp < waiver, 'order: dossier, journal, MSP, waiver'); assert(student.split('data-range-journal-launch="student"').length === 2, 'exactly one journal host');
    const gridAt = student.lastIndexOf('gridTemplateColumns', journal); assert(gridAt > 0 && student.indexOf('Card 1:') < journal, 'inside the card grid, after card 1'); assert(!/data-range-journal-launch="student"[\s\S]{0,40}<div className="portal-chat-host"/.test(student), 'no longer parked beside the chat box');
  });
  await test('student portal: the chat box still comes after the cards (the greeting and next step stay first)', () => {
    const chat = student.indexOf('data-portal-chat="student"'), journal = student.indexOf('data-range-journal-launch="student"'), greet = student.indexOf('dash-student-name'); assert(greet < journal && journal < chat, 'greeting, then the cards with the journal, then chat');
  });
  await test('client portal: the journal card is the first card in the hub list (before the Reciprocity Hub), and there is still exactly one', () => {
    const grid = client.indexOf('fi-hub-cards-grid'), journal = client.indexOf('data-range-journal-launch="client"'), recip = client.indexOf('CARD 2: 50-STATE RECIPROCITY HUB'); assert(grid > 0 && journal > grid && journal < recip, 'first in the hub grid'); assert(client.split('data-range-journal-launch="client"').length === 2, 'exactly one host');
    assert(client.indexOf('data-portal-chat="client"') > recip, 'chat is still after the hub'); const between = client.slice(grid, journal); assert(!/fi-feature-card/.test(between), 'nothing sits above it in the list');
  });
  await test('client hub: the Document Vault card and its button are gone, and nothing on the client portal still points people to a "Document Vault" or a "Wallet" (the Vault is the bottom tab)', () => {
    assert(!/fi-vault-launch|Open My Document Vault|Your Document Vault/.test(client), 'card removed'); const text = ui(client); assert(!/Document Vault|your Wallet|to your Wallet/i.test(text), 'no leftover wording: ' + (text.match(/.{30}(Document Vault|your Wallet).{30}/i) || [''])[0]);
    assert(/Shows the copy you upload\b(?! to)/.test(client), 'the caption under the permit card no longer mentions a place');
  });
  await test('the other client-facing prompts say Vault (the tab\'s name) and still work: the next-step card still opens it', () => {
    const n = read('src/portal/clientNextStep.ts'), e = read('src/portal/engageLogic.ts'); assert(/Put your permit card in your Vault/.test(n) && !/Document Vault/.test(n.replace(/\/\/.*$/gm, '')), 'next step wording'); assert(/vault: \(\) => w\.openWallet\?\.\(\)/.test(n), 'the action still opens the Vault'); assert(/private Vault so it is never far away/.test(e) && !/Document Vault/.test(e), 'tip wording');
  });
  await test('the Vault itself is untouched and still reachable: the bottom tab opens the same panel and the panel is still mounted for every page', () => {
    assert(/key === 'wallet'\) \{[^}]*w\.openWallet\?\.\(\)/.test(read('src/shell/tabShell.ts')), 'tab opens it'); assert(/WalletPanel/.test(read('src/app/layout.tsx')), 'panel mounted'); assert(/openWallet/.test(read('src/portal/WalletPanel.tsx')), 'panel defines openWallet');
  });
  await test('the journal card fits a grid cell: its layout follows its own cell width (a container query), has no outer margin, and fills the cell, so it lines up with the cards beside it', () => {
    const css = read('src/portal/rangeJournal.css'); assert(/\[data-range-journal-launch\] \{ container-type: inline-size; \}/.test(css) && /@container \(min-width: 640px\)/.test(css), 'container query'); assert(/:root:root \.pcard\.rj-launch \{[^}]*margin: 0; height: 100%/.test(css), 'no margin, full height'); assert(!/@media \(min-width: 700px\) \{ :root:root \.pcard\.rj-launch/.test(css), 'not tied to the screen width any more');
    assert(read('src/portal/rangeLauncher.ts').includes('data-range-journal-launch'), 'the launcher still finds hosts by attribute');
  });
  console.log(`\nPortal card order: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
