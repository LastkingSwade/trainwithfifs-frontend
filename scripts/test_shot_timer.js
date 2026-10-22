/**
 * TrainWithFIFS - the shot timer in the Range Journal (offline)
 * Logic: random 1-4 second wait, shot detection (loud enough, not the timer's own beep, not an echo), splits, par time, notes line.
 * Safety and privacy: the microphone is only asked for when the person presses Start, is only used to read loudness, is never recorded, saved or sent, and is switched off on stop and on close.
 * The one site-wide change (the microphone allowed for this site only) is pinned exactly.
 */
const fs = require('fs'); const path = require('path');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const L = require(path.join(ROOT, 'src/portal/shotTimerLogic.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
const code = (p) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

(async () => {
  await test('the wait before the beep is random between 1 and 4 seconds, never outside that, whatever the random source says', () => {
    eq(L.randomDelayMs(() => 0), 1000); eq(L.randomDelayMs(() => 1), 4000); eq(L.randomDelayMs(() => 0.5), 2500); eq(L.randomDelayMs(() => -3), 1000); eq(L.randomDelayMs(() => 99), 4000); eq(L.randomDelayMs(() => NaN), 1000);
    for (let i = 0; i < 500; i++) { const d = L.randomDelayMs(); assert(d >= 1000 && d <= 4000, 'out of range ' + d); }
    assert(new Set(Array.from({ length: 50 }, () => L.randomDelayMs())).size > 10, 'actually varies');
  });
  await test('a sound counts as a shot only if it is loud enough, after the beep\'s own dead zone, and not an echo of the last shot', () => {
    const th = 0.5; assert(L.isShot(0.9, th, 1500, null) === true, 'plain shot'); assert(L.isShot(0.49, th, 1500, null) === false, 'too quiet'); assert(L.isShot(0.5, th, 1500, null) === true, 'exactly at the threshold counts');
    assert(L.DEAD_AFTER_BEEP_MS >= 300 && L.DEAD_AFTER_BEEP_MS <= 600, 'dead zone must cover the 250 ms beep and stay short: ' + L.DEAD_AFTER_BEEP_MS); assert(L.isShot(0.9, th, 250, null) === false, 'the timer\'s own beep (250 ms) must not count'); assert(L.isShot(0.9, th, 0, null) === false, 'nothing counts at the instant of the beep'); assert(L.isShot(0.9, th, L.DEAD_AFTER_BEEP_MS, null) === true, 'just after the dead zone');
    assert(L.MIN_GAP_MS >= 60 && L.MIN_GAP_MS <= 150, 'echo gap must be short enough for fast strings and long enough to skip echoes: ' + L.MIN_GAP_MS); assert(L.isShot(0.9, th, 2000, 40) === false, 'an echo 40 ms after a shot is not a shot'); assert(L.isShot(0.9, th, 2000, 0) === false, 'the same instant is not a second shot'); assert(L.isShot(0.9, th, 2000, L.MIN_GAP_MS) === true, 'a real second shot'); assert(L.isShot(0.9, th, 2000, 200) === true, 'a fast double tap 200 ms later counts'); assert(L.isShot(NaN, th, 2000, null) === false, 'garbage level is not a shot');
  });
  await test('sensitivity runs from 1 (very loud only) to 10 (quiet sounds), is always between 0 and 1, and gets steadily more sensitive', () => {
    eq(L.thresholdFor(1), 0.9); eq(L.thresholdFor(10), 0.1); let prev = 2; for (let s = 1; s <= 10; s++) { const t = L.thresholdFor(s); assert(t > 0 && t < 1 && t < prev, 'monotonic at ' + s); prev = t; }
    eq(L.thresholdFor(0), L.thresholdFor(1)); eq(L.thresholdFor(99), L.thresholdFor(10)); eq(L.thresholdFor('x'), L.thresholdFor(5));
  });
  await test('splits are the time since the previous shot (the first is the draw time), shots stay in order, and there are never more than 60', () => {
    let s = []; s = L.addShot(s, 1420); s = L.addShot(s, 1800); s = L.addShot(s, 2250); eq(s.map((x) => [x.n, x.atMs, x.splitMs]), [[1, 1420, 1420], [2, 1800, 380], [3, 2250, 450]]);
    eq(L.addShot(s, 2000).length, 3, 'a time before the last shot is ignored'); eq(L.addShot(s, NaN).length, 3); eq(L.addShot(s, -5).length, 3);
    let big = []; for (let i = 1; i <= 80; i++) big = L.addShot(big, i * 200); eq(big.length, L.MAX_SHOTS);
  });
  await test('the summary gives count, first shot, total, average, best and worst split (and "nothing yet" when there are no shots, no split for one shot)', () => {
    let s = []; for (const t of [1420, 1800, 2250]) s = L.addShot(s, t); eq(L.summarize(s), { count: 3, firstMs: 1420, totalMs: 2250, avgSplitMs: 415, bestSplitMs: 380, worstSplitMs: 450 });
    eq(L.summarize([]), { count: 0, firstMs: null, totalMs: null, avgSplitMs: null, bestSplitMs: null, worstSplitMs: null }); eq(L.summarize(L.addShot([], 900)).avgSplitMs, null);
  });
  await test('par time accepts 0.5 to 60 seconds as a plain number and nothing else; times show as seconds with two decimals', () => {
    eq(L.parseParSeconds('2'), 2); eq(L.parseParSeconds('1.75'), 1.75); eq(L.parseParSeconds(' 0.5 '), 0.5); eq(L.parseParSeconds('60'), 60); eq(L.parseParSeconds(''), null);
    for (const bad of ['0.4', '61', '-1', 'abc', '1,5', '1.234', '1e2', '99.9']) assert(L.parseParSeconds(bad) === null, 'rejects ' + bad);
    eq(L.fmt(1234), '1.23'); eq(L.fmt(0), '0.00'); eq(L.fmt(null), '-'); eq(L.fmt(NaN), '-');
  });
  await test('the notes line has numbers only (count, first, total, splits, par): no firearm details, nothing personal', () => {
    let s = []; for (const t of [1420, 1800, 2250]) s = L.addShot(s, t); const n = L.noteLine(s, 2); assert(/^Shot timer: 3 shots, first 1\.42s, total 2\.25s, avg split 0\.4\ds, best split 0\.38s, par 2s\.$/.test(n), n); eq(L.noteLine([], null), '');
    assert(/^Shot timer: 1 shot, first 0\.90s, total 0\.90s\.$/.test(L.noteLine(L.addShot([], 900), null)), 'singular, no splits');
  });
  await test('the microphone is only asked for inside the Start button\'s action (never on page load or when the journal opens), with the sound filters off, and only the loudness is read', () => {
    const c = code('src/portal/ShotTimer.tsx'); assert((c.match(/getUserMedia\(/g) || []).length === 1, 'asked in one place'); const at = c.indexOf('const start = async'); const end = c.indexOf('const tap =');
    assert(at > 0 && c.indexOf('getUserMedia(') > at && c.indexOf('getUserMedia(') < end, 'only inside start'); assert(/echoCancellation: false, noiseSuppression: false, autoGainControl: false/.test(c), 'filters off so a short loud sound is not hidden');
    assert(/getByteTimeDomainData/.test(c) && !/MediaRecorder|createScriptProcessor|AudioWorklet|createMediaStreamDestination|decodeAudioData|new Blob|FileReader/.test(c), 'only reads the level; nothing is recorded');
  });
  await test('nothing is stored or sent: no network, storage, cookies, logging or HTML injection in the timer', () => {
    const c = code('src/portal/ShotTimer.tsx') + code('src/portal/shotTimerLogic.ts'); assert(!/fetch\(|XMLHttpRequest|sendBeacon|WebSocket|localStorage|sessionStorage|indexedDB|document\.cookie|callFifsBackend|console\.|innerHTML|dangerouslySetInnerHTML/.test(c), 'no storage, network or injection');
  });
  await test('the microphone and audio engine are switched off when a string stops, when Stop or Clear is pressed, and when the journal closes (the component unmounts)', () => {
    const c = code('src/portal/ShotTimer.tsx'); const td = c.slice(c.indexOf('const teardown ='), c.indexOf('useEffect(() => teardown')); assert(/getTracks\(\)\.forEach\(\(t\) => t\.stop\(\)\)/.test(td), 'the cleanup function stops the microphone tracks'); assert(/ctx\.current\.close\(\)/.test(c), 'audio engine closed'); assert(/useEffect\(\(\) => teardown, \[teardown\]\)/.test(c), 'unmount cleanup');
    const fin = c.slice(c.indexOf('const finish ='), c.indexOf('const record =')); assert(/getTracks\(\)\.forEach/.test(fin) && /clearInterval\(pollI/.test(fin) && /ctx\.current\.close\(\)/.test(fin), 'finish switches the microphone off and closes the audio engine'); const stop = c.slice(c.indexOf('const stop ='), c.indexOf('const reset ='));
    assert(/teardown\(\)/.test(stop), 'stopping while waiting switches it off'); assert(/const reset = \(\) => \{ teardown\(\)/.test(c), 'clear switches it off');
  });
  await test('a refused or missing microphone never breaks the timer: it says so plainly and the tap button still works; the timer\'s own beep cannot count as a shot', () => {
    const c = code('src/portal/ShotTimer.tsx'); assert(/setMic\('denied'\)/.test(c) && /setMic\('unavailable'\)/.test(c) && /microphone is blocked/.test(c) && /Use the tap button/.test(c), 'plain messages'); assert(/phase === 'running' && <button[^>]*rj-t-tap/.test(c), 'tap button while running');
    assert(/isShot\(peak, thresholdFor\(sensRef\.current\), t, /.test(c), 'detection goes through the tested rule'); assert(/DEAD_AFTER_BEEP_MS/.test(read('src/portal/shotTimerLogic.ts')), 'dead zone defined');
  });
  await test('a string ends by itself (2 minutes or 60 shots), the start beep is a real beep plus a visible GO cue, and a lower beep marks the par time', () => {
    const c = code('src/portal/ShotTimer.tsx'); assert(/t >= MAX_RUN_MS\) finish\(/.test(c) && /next\.length >= MAX_SHOTS\) finish\(/.test(c), 'limits'); assert(/beep\(1800, 250\)/.test(c) && /setGo\(true\)/.test(c) && /GO! Shoot now\./.test(c), 'beep and visible GO'); assert(/beep\(900, 450\)/.test(c) && /parS \* 1000/.test(c), 'par beep');
    assert(/randomDelayMs\(\)/.test(c), 'random wait is used');
  });
  await test('it is usable with a screen reader and a keyboard: status announced, big labelled buttons at least 48px, a visible GO cue that does not rely on sound, visible focus, nothing animated', () => {
    const c = code('src/portal/ShotTimer.tsx'); assert(/role="status" aria-live="assertive"/.test(c), 'announced'); assert(/aria-valuetext/.test(c) && /aria-invalid/.test(c) && /aria-describedby="rj-par-help"/.test(c), 'labelled inputs');
    const css = read('src/portal/rangeJournal.css'); assert(/\.rj-t-actions button, \.rj-t-ghost \{ min-height: 52px/.test(css), '52px buttons'); assert(/\.rj-t-go \{ border-color: #34d399/.test(css), 'visible GO'); assert(/:focus-visible \{ outline: 3px solid #00e5ff/.test(css.slice(css.indexOf('Shot timer inside'))), 'focus');
    const after = css.slice(css.indexOf('Shot timer inside')); assert(!/animation|transition|@keyframes/.test(after), 'nothing moves, so reduced motion needs no special case and the journal\'s no-animation rule holds');
  });
  await test('the live shot list sits directly under the buttons, above the settings, so splits can be read while shooting on a phone', () => {
    const c = code('src/portal/ShotTimer.tsx'); assert(c.indexOf('rj-t-results') > c.indexOf('rj-t-actions') && c.indexOf('rj-t-results') < c.indexOf('rj-t-settings'), 'results between the buttons and the settings'); assert(c.indexOf('Wear hearing and eye protection') > c.indexOf('rj-t-actions') && c.indexOf('Wear hearing and eye protection') < c.indexOf('rj-t-settings'), 'the hearing-protection and privacy note is still shown, just below the results'); assert(/Nothing is recorded, saved or sent/.test(c), 'privacy line kept');
  });
  await test('the timer sits in the journal and works even if the journal data cannot load; "Add to my session notes" only appends numbers to the form the person is already filling in', () => {
    const j = code('src/portal/RangeJournalPanel.tsx'); const tAt = j.indexOf('<ShotTimer'); assert(tAt > 0 && tAt < j.indexOf('Loading your journal') && tAt < j.indexOf('data.available'), 'before the data-dependent parts'); assert(/notes: \(f\.notes \? f\.notes\.trim\(\) \+ '\\n' : ''\) \+ line/.test(j), 'appends to notes only');
    assert(/openRangeJournal = \(opts\?: \{ section\?: string \}\)/.test(j) && /rj-timer-start/.test(j), 'can open straight to the timer');
  });
  await test('the home dashboard card also offers a Shot timer button that opens the journal at the timer, and the first button still opens the journal', () => {
    const l = code('src/portal/rangeLauncher.ts'); assert(/rj-launch-timer/.test(l) && /openRangeJournal\?\.\(\{ section: 'timer' \}\)/.test(l) && /openRangeJournal\?\.\(\)\)/.test(l), 'both buttons'); assert(/rj-launch-actions/.test(l), 'grouped');
    const css = read('src/portal/rangeJournal.css'); assert(/\.rj-launch-timer \{[^}]*min-height: 52px/.test(css), '52px');
  });
  await test('the only site-wide change is one line: the microphone is allowed for this site only; the camera and location stay blocked and no other security header changed', () => {
    const cfg = read('next.config.ts'); assert(/value: "camera=\(\), microphone=\(self\), geolocation=\(\)",/.test(cfg), 'permissions policy'); assert(!/microphone=\*|microphone=\("https?:|microphone=\(\*\)/.test(cfg), 'not open to other sites'); assert(/Content-Security-Policy/.test(cfg), 'CSP still there');
    const origin = require('child_process').spawnSync('git', ['diff', '-U0', 'main', '--', 'next.config.ts'], { cwd: ROOT, encoding: 'utf8' }).stdout || ''; if (origin) { const rem = origin.split('\n').filter((l) => l.startsWith('-') && !l.startsWith('---')); const add = origin.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++'));
      assert(rem.length === 1 && /microphone=\(\)/.test(rem[0]), 'exactly the microphone value was replaced'); assert(add.some((l) => /microphone=\(self\)/.test(l)), 'with self'); }
  });
  console.log(`\nShot timer: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
