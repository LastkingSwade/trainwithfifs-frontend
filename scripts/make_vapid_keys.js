// Makes the two notification keys (run once, on your own computer): node scripts/make_vapid_keys.js
// Copy the three lines it prints into Vercel > Project > Settings > Environment Variables (Production), then redeploy. Never share the private key or commit it.
const webpush = require('web-push'); const k = webpush.generateVAPIDKeys();
console.log('VAPID_PUBLIC_KEY=' + k.publicKey); console.log('VAPID_PRIVATE_KEY=' + k.privateKey); console.log('VAPID_SUBJECT=mailto:info@trainwithfifs.com');
