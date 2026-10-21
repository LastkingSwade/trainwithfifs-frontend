// One-off generator for the iPhone/iPad launch screens in public/splash (a dark screen with the FIFS emblem). Run: node scripts/make_splash.js
// Not part of the build or the tests; the generated files are committed. Needs the `sharp` package that Next.js already installs.
const sharp = require('sharp'); const path = require('path');
const ROOT = path.resolve(__dirname, '..');
// [css width, css height, pixel ratio]
const DEVICES = [[440, 956, 3], [402, 874, 3], [393, 852, 3], [430, 932, 3], [390, 844, 3], [375, 812, 3], [414, 896, 3], [414, 896, 2], [414, 736, 3], [375, 667, 2],
  [744, 1133, 2], [768, 1024, 2], [810, 1080, 2], [820, 1180, 2], [834, 1112, 2], [834, 1194, 2], [1024, 1366, 2]];
(async () => {
  for (const [cw, ch, dpr] of DEVICES) {
    const w = cw * dpr, h = ch * dpr, e = Math.round(Math.min(w, h) * 0.36);
    const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><radialGradient id="g" cx="50%" cy="46%" r="55%"><stop offset="0" stop-color="#00e5ff" stop-opacity="0.12"/><stop offset="1" stop-color="#090d16" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="#090d16"/><rect width="100%" height="100%" fill="url(#g)"/></svg>`);
    // The icon is a square with its own dark background: fade its edge into a circle so no box shows against the glow.
    const fade = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${e}" height="${e}"><defs><radialGradient id="m"><stop offset="0.72" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#m)"/></svg>`);
    const emblem = await sharp(path.join(ROOT, 'public/icons/icon-512.png')).resize(e, e).ensureAlpha().composite([{ input: fade, blend: 'dest-in' }]).png().toBuffer();
    const out = path.join(ROOT, `public/splash/splash-${w}x${h}.jpg`);
    const info = await sharp(bg).composite([{ input: emblem, left: Math.round((w - e) / 2), top: Math.round(h * 0.46 - e / 2) }]).jpeg({ quality: 80, mozjpeg: true }).toFile(out);
    console.log(path.basename(out), info.size);
  }
})();
