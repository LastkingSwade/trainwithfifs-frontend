// Prints a new random ARMORY_KEY (64 hex characters = 256 bits). Run: node scripts/make_armory_key.js
// Put it in Vercel as ARMORY_KEY (Production) and ALSO keep a copy in your password manager: if this key is ever lost, the armory records it protects cannot be read again by anyone.
// Never paste it into a chat, a file in the project, or a screenshot.
const crypto = require('crypto');
console.log('ARMORY_KEY=' + crypto.randomBytes(32).toString('hex'));
