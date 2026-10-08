/**
 * TrainWithFIFS - Offline tests for scripts/ops/fifs_schema_dump.sh and the evidence queries
 *
 * The script is NEVER executed against a database here, and no network, Docker, or Supabase CLI is used. What runs:
 *  - `bash -n` (syntax check only);
 *  - the script's pure functions, sourced into bash, with obviously fake credentials: the URL builder and the
 *    password encoder (including a '#' that must become %23);
 *  - the script's refusal when an output file already exists (it exits before any prompt, Docker check, or download);
 *  - static checks of the script text and the SQL evidence file.
 * Passing these does not show the live dump works. Live execution and review of its output remain owner actions.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SCRIPT = path.join(ROOT, 'scripts/ops/fifs_schema_dump.sh');
const script = fs.readFileSync(SCRIPT, 'utf-8');
// docs/supabase/ is deliberately kept out of the public repository, so Section D runs only where those
// private files exist (the owner's machine) and is reported as SKIPPED, never silently passed, elsewhere.
const queriesPath = path.join(ROOT, 'docs/supabase/storage-and-privilege-evidence-queries.sql');
const runbookPath = path.join(ROOT, 'docs/supabase/schema-dump-runbook.md');
const docsPresent = fs.existsSync(queriesPath) && fs.existsSync(runbookPath);
const queries = docsPresent ? fs.readFileSync(queriesPath, 'utf-8') : '';
const runbook = docsPresent ? fs.readFileSync(runbookPath, 'utf-8') : '';

let passed = 0, failed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log(`  ✓ PASS: ${name}`); }
  catch (e) { failed++; console.log(`  ✗ FAIL: ${name}\n      ${e.message}`); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

const REF = 'ufqnmcincwnlyiwsmzcq';
const FAKE_TEMPLATE = `postgresql://postgres.${REF}:[YOUR-PASSWORD]@db.example.invalid:5432/postgres`;
// Fake password with characters that break URLs: # @ : / ? & % space [ ] quotes and non-ASCII.
const FAKE_PASSWORD = "p#ss w@rd:/?&%[x]'\"é~_.-";
const percentEncode = (s) => [...Buffer.from(s, 'utf-8')].map((b) => (/[A-Za-z0-9_.~-]/.test(String.fromCharCode(b)) ? String.fromCharCode(b) : '%' + b.toString(16).toUpperCase().padStart(2, '0'))).join('');

function build(template, password, extraEnv = {}) {
  const code = `source "${SCRIPT}"; URL=""; fifs_build_db_url "$T" "$P" URL; rc=$?; printf '%s' "$URL"; exit $rc`;
  return spawnSync('bash', ['-c', code], { encoding: 'utf-8', env: { ...process.env, T: template, P: password, ...extraEnv } });
}

async function main() {
  console.log('\n[SECTION A: Syntax and structure]');
  await test('bash accepts the script (syntax check only, nothing is executed)', async () => {
    const r = spawnSync('bash', ['-n', SCRIPT], { encoding: 'utf-8' });
    assert(r.status === 0, `bash -n failed: ${r.stderr}`);
  });
  await test('The script is strict, never traces, and restricts file permissions', async () => {
    assert(/^set -euo pipefail$/m.test(script) && /^set \+x$/m.test(script) && /^umask 077$/m.test(script), 'missing strict mode, set +x, or umask 077');
    assert(!/set\s+-[a-zA-Z]*x|xtrace|BASH_XTRACEFD/.test(script), 'tracing must never be enabled');
    assert(/chmod 600/.test(script), 'outputs must be made owner-readable only');
  });
  await test('Only the expected Production project and a pinned CLI are used; the dump is schema-only', async () => {
    assert(/EXPECTED_REF="ufqnmcincwnlyiwsmzcq"/.test(script), 'the project ref must be pinned');
    assert(/CLI="supabase@\d+\.\d+\.\d+"/.test(script), 'the CLI version must be pinned');
    assert(!/--data-only|--role-only|--use-copy|--linked|--local|pg_dumpall/.test(script), 'no data, role, or alternate-target flags');
    assert(/db dump --db-url/.test(script) && /--schema storage/.test(script), 'expected the main dump and the optional storage dump');
    assert(!/\b(curl|wget|psql|nc)\b/.test(script.replace(/^#.*$/gm, '')), 'no other network or database clients');
  });
  await test('Nothing prints, logs, or persists the URL or password', async () => {
    const code = script.replace(/^\s*#.*$/gm, '');
    assert(!/(echo|printf)\s[^\n]*\$\{?(FIFS_DB_URL|FIFS_DB_PASSWORD|password|encoded|url)\b/.test(code.replace(/printf '%s' "\$password" \| fifs_encode_password/, '').replace(/printf -v "\$target" '%s' "\$url"/, '').replace(/printf '%s\\n' "\$FIFS_DB_PASSWORD"/, '')), 'a secret variable is printed');
    assert(!/\btee\b|>>\s|history|logger/.test(code), 'no tee, appends, history, or logging');
    assert(/trap 'unset FIFS_DB_PASSWORD FIFS_DB_URL template' EXIT/.test(code), 'secrets must be unset on exit');
    assert(/read -rs FIFS_DB_PASSWORD/.test(code), 'the password must be read silently');
    assert(/grep -qF -f <\(printf/.test(code), 'the password check must not put the password on a command line');
  });
  await test('It refuses before any prompt, Docker check, or download when an output already exists', async () => {
    assert(script.indexOf('already exists') < script.indexOf('docker info') && script.indexOf('docker info') < script.indexOf('IFS= read -r template'), 'refusal checks must come first');
  });

  console.log('\n[SECTION B: Password encoding and URL building (fake values only)]');
  await test('A password with # @ : / ? & % space brackets quotes and non-ASCII is fully percent-encoded', async () => {
    const r = build(FAKE_TEMPLATE, FAKE_PASSWORD);
    assert(r.status === 0, `exit ${r.status}: ${r.stderr}`);
    assert(r.stdout === FAKE_TEMPLATE.replace('[YOUR-PASSWORD]', percentEncode(FAKE_PASSWORD)), `unexpected URL: ${r.stdout}`);
    assert(r.stdout.includes('%23') && !r.stdout.includes('#'), 'a # in the password must become %23');
    assert(!/\s/.test(r.stdout) && !r.stdout.includes('[YOUR-PASSWORD]'), 'no whitespace or leftover placeholder');
    assert(!(r.stdout + r.stderr).includes(FAKE_PASSWORD), 'the raw password must never appear in output');
  });
  await test('A plain password is only substituted; the rest of the template is untouched', async () => {
    const r = build(FAKE_TEMPLATE, 'plainPassword123');
    assert(r.status === 0 && r.stdout === FAKE_TEMPLATE.replace('[YOUR-PASSWORD]', 'plainPassword123'), r.stdout);
  });
  await test('It refuses bad templates and never echoes the password or the pasted string', async () => {
    const cases = {
      'no placeholder (a real password pasted in)': `postgresql://postgres.${REF}:RealSecret9@db.example.invalid:5432/postgres`,
      'a # in the pasted string': `postgresql://postgres.${REF}:abc#def@db.example.invalid:5432/postgres`,
      'two placeholders': `postgresql://postgres.${REF}:[YOUR-PASSWORD]@db.example.invalid/[YOUR-PASSWORD]`,
      'wrong project': 'postgresql://postgres.otherprojectref000000:[YOUR-PASSWORD]@db.example.invalid:5432/postgres',
      'wrong scheme': `https://postgres.${REF}:[YOUR-PASSWORD]@db.example.invalid:5432/postgres`,
      'whitespace': `postgresql://postgres.${REF}:[YOUR-PASSWORD]@db.example.invalid:5432/post gres`
    };
    for (const [label, template] of Object.entries(cases)) {
      const r = build(template, FAKE_PASSWORD);
      assert(r.status !== 0, `${label}: expected a refusal`);
      assert(r.stdout === '', `${label}: nothing may be produced`);
      const out = r.stdout + r.stderr;
      assert(!out.includes(FAKE_PASSWORD) && !out.includes('RealSecret9') && !out.includes('abc#def'), `${label}: a secret or the pasted string was echoed`);
      assert(/Refusing/.test(r.stderr), `${label}: expected a clear refusal message`);
    }
  });
  await test('An empty password is refused', async () => {
    const r = build(FAKE_TEMPLATE, '');
    assert(r.status !== 0 && /password is empty/.test(r.stderr), r.stderr);
  });

  console.log('\n[SECTION C: Running the script directly]');
  await test('With an output already present it exits immediately, prompts nothing, and touches nothing else', async () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'fifs-dump-test-'));
    fs.mkdirSync(path.join(home, 'Desktop'));
    const existing = path.join(home, 'Desktop', 'fifs-production-schema-review.sql');
    fs.writeFileSync(existing, 'placeholder');
    const before = fs.readdirSync(path.join(home, 'Desktop')).sort().join(',');
    const r = spawnSync('bash', [SCRIPT], { encoding: 'utf-8', input: '', env: { PATH: process.env.PATH, HOME: home } });
    assert(r.status === 1 && /already exists/.test(r.stderr) && /Nothing was run/.test(r.stderr), `got ${r.status}: ${r.stderr}`);
    assert(fs.readFileSync(existing, 'utf-8') === 'placeholder', 'the existing file must not be modified');
    assert(fs.readdirSync(path.join(home, 'Desktop')).sort().join(',') === before, 'no other file may be created');
    assert(!/Paste|password/i.test(r.stdout), 'it must not prompt');
    fs.rmSync(home, { recursive: true, force: true });
  });

  console.log('\n[SECTION D: Evidence queries and runbook]');
  if (!docsPresent) {
    console.log('  - SKIPPED: Section D (4 tests) needs docs/supabase/, which is kept out of this repository.');
  } else {
  await test('Every evidence query is a read-only SELECT', async () => {
    const noComments = queries.replace(/--.*$/gm, '');
    const statements = noComments.split(';').map((s) => s.trim()).filter(Boolean);
    assert(statements.length === 10, `expected 10 queries, found ${statements.length}`);
    for (const s of statements) assert(/^select\b/i.test(s), `non-SELECT statement: ${s.slice(0, 60)}`);
    assert(!/\b(insert\s+into|update\s+\w|delete\s+from|drop\s|alter\s|create\s|grant\s|revoke\s|truncate\s|set\s)/i.test(noComments), 'a write keyword appears');
  });
  await test('The queries cover storage policies, triggers, effective privileges and inheritance, and read no student rows', async () => {
    for (const [label, m] of [['storage policies', /schemaname = 'storage' and tablename = 'objects'/], ['non-public references', /schemaname <> 'public'/], ['triggers', /pg_trigger/], ['effective column privileges', /has_column_privilege/], ['any-column privilege', /has_any_column_privilege/], ['role inheritance', /pg_auth_members/], ['invoices and scoresheets', /'invoices', 'student_scoresheets'/], ['server version', /server_version/]]) {
      assert(m.test(queries), `missing coverage: ${label}`);
    }
    assert(!/from\s+(public\.)?students\b/i.test(queries.replace(/--.*$/gm, '')), 'no query may read the students table');
    assert(!/auth\.users/i.test(queries), 'no query may read auth.users');
  });
  await test('The runbook states what is unverified and keeps live execution with the owner', async () => {
    for (const [label, m] of [['never run', /never been run/i], ['owner-only', /owner-only/i], ['%23 handling', /%23/], ['storage flag unverified', /unverified/i], ['accepted ps risk', /ps/], ['review before sharing', /Review the file yourself/], ['replaces unrevised copy', /Desktop\/fifs_schema_dump\.sh/]]) {
      assert(m.test(runbook), `runbook is missing: ${label}`);
    }
  });
  await test('No file contains a real-looking secret or an email address', async () => {
    for (const [name, text] of Object.entries({ script, queries, runbook })) {
      assert(!/eyJ[A-Za-z0-9_-]{20,}|sb_(secret|publishable)_|(sk|rk)_(live|test)_|re_[A-Za-z0-9]{16,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}/i.test(text.replace(/@db\.example\.invalid/g, '')), `${name} looks like it contains a secret or an email address`);
    }
  });

  }
  console.log('\n(Reminder: offline logic and static checks only. The dump has not been run; live execution is an owner action.)');
  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
  console.log('================================================================');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error('Suite crashed:', e && e.stack); process.exit(1); });
