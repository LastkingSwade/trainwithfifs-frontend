/**
 * TrainWithFIFS - no function is declared twice in the main script (offline)
 * public/scripts/TrainWithFIFS_scripts.js used to declare 32 functions more than once (some four times). In JavaScript only the last copy of a function declared this way ever runs, so the
 * earlier copies were dead code, and it was impossible to tell which copy was live. That hid a real bug (the sign-out that left people on the student sign-in page). The dead copies were
 * removed (and every one of the script's 296 functions was checked to be exactly the same afterwards in a real browser). This test keeps it that way: a second declaration of any name in the
 * same scope fails the build, so changes are always made in the one real copy.
 */
const fs = require('fs'); const path = require('path'); const ts = require('typescript');
const ROOT = path.resolve(__dirname, '..');
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };

/** Names declared more than once as `function name(...)` directly in the same list of statements (the file, a function body or a block), with their line numbers. */
function duplicates(text, name = 'x.js') {
  const sf = ts.createSourceFile(name, text, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS); const found = []; const line = (p) => sf.getLineAndCharacterOfPosition(p).line + 1;
  const list = (stmts, where) => { const by = new Map(); for (const st of stmts) if (ts.isFunctionDeclaration(st) && st.name) { const n = st.name.text; (by.get(n) || by.set(n, []).get(n)).push(line(st.getStart())); } for (const [n, lines] of by) if (lines.length > 1) found.push(`${n} (${where}) at lines ${lines.join(', ')}`); };
  const walk = (node) => { if (ts.isSourceFile(node)) list(node.statements, 'file'); else if (ts.isBlock(node)) list(node.statements, 'block at line ' + line(node.getStart())); ts.forEachChild(node, walk); };
  walk(sf); return { found, errors: sf.parseDiagnostics.length };
}
const main = fs.readFileSync(path.join(ROOT, 'public/scripts/TrainWithFIFS_scripts.js'), 'utf8');

(async () => {
  await test('the main script parses cleanly and declares no function twice in the same scope', () => {
    const r = duplicates(main); assert(r.errors === 0, 'the script has ' + r.errors + ' syntax errors'); assert(r.found.length === 0, 'duplicate declarations (only the last copy ever runs, so edit the one real copy and delete the other): ' + r.found.join('; '));
  });
  await test('the checker itself works: it finds a repeated function at the top of a file, inside a function and inside a block, ignores different names, and reports syntax errors', () => {
    assert(duplicates('function a(){return 1}\nfunction a(){return 2}').found.length === 1, 'top level');
    assert(duplicates('function outer(){ function a(){} function a(){} }').found.length === 1, 'inside a function'); assert(duplicates('if (x) { function a(){} function a(){} }').found.length === 1, 'inside a block');
    assert(duplicates('function a(){}\nfunction b(){}\nfunction c(){}').found.length === 0, 'different names are fine'); assert(duplicates('function a(){} var a2 = function a(){};').found.length === 0, 'a function expression is not a declaration'); assert(duplicates('function a(){ ').errors > 0, 'syntax errors are seen');
    assert(duplicates('function a(){}\nfunction f(){ function a(){} }').found.length === 0, 'the same name in two different scopes is fine');
  });
  await test('the cleanup left a short note where each earlier copy was, so nobody wonders where it went, and the script is still the same size class (no accidental large deletion)', () => {
    assert((main.match(/an earlier copy was removed here/g) || []).length >= 30, 'markers present'); const lines = main.split('\n').length; assert(lines > 10000 && lines < 11000, 'line count ' + lines);
    for (const name of ['logoutStudent', 'fiLogoutClient', 'logoutClient', 'closeAllOverlays', 'toggleReciprocityHubModal', 'lookupClientAccount']) assert(new RegExp('function ' + name + '\\s*\\(').test(main), name + ' still defined exactly once'); 
  });
  console.log(`\nNo duplicate functions: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
