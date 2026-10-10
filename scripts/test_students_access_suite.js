/**
 * TrainWithFIFS - students-table access suite (STATIC)
 *
 * IMPORTANT: these are static checks. The SQL files are read as text and are NEVER executed here, so none of this
 * proves the migration works in Supabase. Proof comes only from the staging verification steps in
 * docs/supabase/students-access-README.md. What these tests do guard:
 *  1. The code the lock-down relies on (the browser never queries public.students; Realtime handlers use only the
 *     event type; every server students access uses the service-role client).
 *  2. The server's exact staff-role rule, pinned by running the real isStaffOrAdmin() from route.ts, so a change
 *     there forces a review of the SQL policy that mirrors it.
 *  3. The text of the migration and preflight: fail-closed gate and safeguards, narrow scope, trusted-claim-only
 *     role logic, and a strictly read-only preflight.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf-8');
const stripSqlComments = (sql) => sql.replace(/--.*$/gm, '');

let passed = 0, failed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log(`  ✓ PASS: ${name}`); }
  catch (e) { failed++; console.log(`  ✗ FAIL: ${name}\n      ${e.message}`); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

async function main() {
  const page = read('src/app/page.tsx');
  const script = read('public/scripts/TrainWithFIFS_scripts.js');
  const route = read('src/app/api/fifs/route.ts');
  const webhook = read('src/app/api/stripe/webhook/route.ts');
  const booking = read('src/Lib/server/booking-checkout.ts');
  const migration = read('docs/supabase/students-access-hardening.sql');
  const preflight = read('docs/supabase/students-access-preflight.sql');
  const readme = read('docs/supabase/students-access-README.md');
  const sql = stripSqlComments(migration);
  const preSql = stripSqlComments(preflight);

  console.log('\n[SECTION A: What the lock-down relies on]');
  await test('Browser code never queries or writes public.students', async () => {
    const browserFiles = { 'page.tsx': page, 'TrainWithFIFS_scripts.js': script, 'client.ts': read('src/Lib/supabase/client.ts'), 'recovery-client.ts': read('src/Lib/supabase/recovery-client.ts'), 'reset-password/page.tsx': read('src/app/reset-password/page.tsx') };
    for (const [name, text] of Object.entries(browserFiles)) {
      assert(!/\.from\(\s*['"`]students['"`]\s*\)/.test(text), `${name} queries students directly`);
      assert(!/\/rest\/v1\/students/.test(text), `${name} calls the students REST endpoint directly`);
    }
  });
  await test('The Realtime students handler uses only the event type, never the row payload', async () => {
    const start = script.indexOf("table: 'students'");
    assert(start > 0, 'could not find the students subscription');
    const handler = script.slice(start, script.indexOf("table: 'student_scoresheets'", start));
    assert(/payload\.eventType/.test(handler), 'expected the handler to read the event type');
    assert(!/payload\.(new|old|record)\b/.test(handler), 'the handler must not depend on row data');
  });
  await test('Every server read or write of students uses the service-role client', async () => {
    for (const [name, text] of Object.entries({ 'fifs/route.ts': route, 'stripe/webhook/route.ts': webhook, 'booking-checkout.ts': booking })) {
      assert(!/getPublicClient\(\)\s*\.from\(\s*['"`]students/.test(text), `${name} reads students through the public client`);
    }
    for (const c of route.split(/\n\s*case '/).slice(1)) {
      const name = c.slice(0, c.indexOf("'"));
      if (!/from\(\s*['"`]students['"`]\s*\)|from\(profileTable\)/.test(c)) continue;
      assert(/supabase\s*=\s*getPrivilegedClient\(\)/.test(c) && !/supabase\s*=\s*getPublicClient\(\)/.test(c), `case ${name} touches students without the service-role client`);
    }
    assert(/getPrivilegedClient\(\)\s*\.from\(\s*['"`]students/.test(booking), 'booking-checkout must use the service-role client for students');
    assert(/supabase\s*=\s*getPrivilegedClient\(\)/.test(webhook), 'the Stripe webhook must use the service-role client');
  });

  console.log('\n[SECTION B: The server staff-role rule the policy must mirror (real helper, run here)]');
  const helperStart = route.indexOf('function isStaffOrAdmin(');
  const helperEnd = route.indexOf('\n}\n', helperStart) + 3;
  const helperJs = ts.transpileModule(route.slice(helperStart, helperEnd), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const sandbox = {}; vm.createContext(sandbox); vm.runInContext(helperJs + '\nthis.isStaffOrAdmin = isStaffOrAdmin;', sandbox);
  const server = (meta) => sandbox.isStaffOrAdmin(meta === undefined ? { id: 'u' } : { id: 'u', app_metadata: meta });
  // [app_metadata, server result, policy result]. The policy must equal the server, except where documented as stricter.
  const VECTORS = [
    [{ role: 'admin' }, true, true], [{ role: ' Instructor ' }, true, true], [{ role: 'STAFF' }, true, true],
    [{ role: '', roles: 'staff' }, true, true], [{ role: null, roles: 'admin' }, true, true],
    [{ role: false, roles: 'staff' }, true, true], [{ role: 0, roles: 'instructor' }, true, true],
    [{ roles: 'staff' }, true, true], [{ role: ['admin'] }, true, true], [{ role: '', roles: ['staff'] }, true, true],
    [{ role: ['admin', 'staff'] }, false, false], [{ role: [], roles: 'staff' }, false, false],
    [{ role: 'student', roles: 'admin' }, false, false], [{ role: 'client' }, false, false],
    [{ role: {} }, false, false], [{ role: true }, false, false], [{ role: 1 }, false, false], [{}, false, false], [undefined, false, false],
    [{ role: [['admin']] }, true, false] // server accepts via String(); the policy is stricter and denies
  ];
  await test('The server helper behaves exactly as documented for every shape in the README table', async () => {
    for (const [meta, expectedServer] of VECTORS) assert(server(meta) === expectedServer, `server(${JSON.stringify(meta)}) was ${server(meta)}, expected ${expectedServer}`);
  });
  await test('The policy model never allows more than the server (documented stricter cases only)', async () => {
    // Model of the SQL's documented rules (not the SQL itself): role if truthy else roles; string, or a one-element
    // array of one string; lower + trim; must be admin/instructor/staff.
    const model = (meta) => {
      if (!meta) return false;
      const truthy = (v) => !(v === undefined || v === null || v === false || v === 0 || v === '');
      const chosen = truthy(meta.role) ? meta.role : meta.roles;
      const text = typeof chosen === 'string' ? chosen : (Array.isArray(chosen) && chosen.length === 1 && typeof chosen[0] === 'string' ? chosen[0] : null);
      return text !== null && ['admin', 'instructor', 'staff'].includes(text.toLowerCase().trim());
    };
    for (const [meta, serverResult, policyResult] of VECTORS) {
      assert(model(meta) === policyResult, `model(${JSON.stringify(meta)}) was ${model(meta)}, documented ${policyResult}`);
      assert(!(model(meta) && !serverResult), `the policy would allow what the server denies: ${JSON.stringify(meta)}`);
    }
  });
  await test('The SQL policy text implements those rules and only those claims', async () => {
    const policy = (sql.match(/create policy[\s\S]*?\n  \);/i) || [''])[0];
    assert(policy.length > 200, 'could not isolate the policy');
    assert(/for select/i.test(policy) && /to authenticated/i.test(policy), 'the policy must be read-only for authenticated');
    assert(/auth\.jwt\(\)\s*->\s*'app_metadata'/.test(policy), 'the policy must read the app_metadata claim');
    assert(/claims\.m\s*->\s*'role'/.test(policy) && /claims\.m\s*->\s*'roles'/.test(policy), 'the policy must handle role and the roles fallback');
    assert(/jsonb_typeof/.test(policy) && /'string'/.test(policy) && /'array'/.test(policy) && /jsonb_array_length\(pick\.chosen\) = 1/.test(policy), 'the policy must handle strings and one-element arrays');
    assert(/'false'::jsonb/.test(policy) && /'0'::jsonb/.test(policy) && /= ''/.test(policy), 'the policy must treat empty, false and 0 roles as absent, like the server');
    assert(/lower\(btrim\(/.test(policy) && /in \('admin', 'instructor', 'staff'\)/.test(policy), 'the policy must lower-case, trim, and allow admin/instructor/staff');
    assert(!/user_metadata|email|is_admin|auth\.uid|user_id|raw_app_meta_data/i.test(policy), 'the policy must use only the trusted app_metadata claim');
  });

  console.log('\n[SECTION C: Migration safeguards (text checks only; the SQL is not executed)]');
  await test('The committed file cannot run as-is: the review gate is closed and the fingerprint is empty', async () => {
    assert(/reviewed_preflight constant boolean := false;/.test(sql), 'reviewed_preflight must default to false in the committed file');
    assert(/expected_policy_fingerprint constant text := '';/.test(sql), 'expected_policy_fingerprint must be empty in the committed file');
    assert(/NOT READY/.test(migration.split('\n')[0]), 'the first line must say NOT READY TO APPLY');
    assert(/raise exception 'NOT READY: the owner has not recorded a review/.test(sql) && /raise exception 'NOT READY: expected_policy_fingerprint is empty/.test(sql), 'both gate failures must raise');
  });
  await test('Policies are dropped only after the live policy fingerprint matches the reviewed one', async () => {
    const compareAt = sql.search(/current_fingerprint <> expected_policy_fingerprint/);
    const firstDrop = sql.search(/drop policy/i);
    assert(compareAt > 0 && firstDrop > compareAt, 'the fingerprint comparison must come before any DROP POLICY');
    assert((sql.match(/drop policy/gi) || []).length === 1, 'exactly one DROP POLICY (inside the reviewed-set loop) is allowed');
    assert(/raise exception 'Stopped: the live policies on public\.students/.test(sql), 'a mismatch must raise');
  });
  await test('The migration and the preflight compute the policy fingerprint identically', async () => {
    const expr = (t) => (t.match(/format\('%s\|%s\|%s\|%s\|%s\|%s', policyname, permissive, cmd, roles::text, coalesce\(qual, ''\), coalesce\(with_check, ''\)\)/) || [])[0];
    assert(expr(sql) && expr(sql) === expr(preSql), 'the fingerprint expressions differ');
    assert(/E'\\n' order by policyname/.test(sql) && /E'\\n' order by policyname/.test(preSql), 'the ordering must be identical');
  });
  await test('It stops, instead of guessing, on every other dependency it was not designed for', async () => {
    for (const pattern of [/to_regclass\('public\.students'\) is null/, /policies on other tables reference students/, /browser-readable views expose students/, /browser-callable security-definer functions use students/, /service_role does not hold SELECT, INSERT, UPDATE and DELETE/]) {
      assert(pattern.test(sql), `missing guard: ${pattern}`);
    }
  });
  await test('It re-checks the result and rolls back if the end state is wrong', async () => {
    for (const pattern of [/Post-check failed: row level security is not enabled/, /not exactly students_staff_read/, /anon still holds a privilege/, /authenticated still holds a write-level privilege/, /authenticated cannot select/, /service_role lost access/]) {
      assert(pattern.test(sql), `missing post-check: ${pattern}`);
    }
    for (const priv of ['select', 'insert', 'update', 'delete']) assert(new RegExp(`has_table_privilege\\('service_role', 'public\\.students', '${priv}'\\)`).test(sql), `service_role ${priv} must be checked on its own`);
    assert(/^\s*begin;/im.test(sql) && /\bcommit;\s*$/im.test(sql.trim()), 'expected begin; ... commit;');
  });
  await test('Scope is limited to access controls on public.students', async () => {
    const objects = [...sql.matchAll(/\balter table\s+(\S+)/gi)].map((m) => m[1]);
    assert(objects.length === 1 && objects[0] === 'public.students', `alter table must target only public.students: ${objects}`);
    for (const m of sql.matchAll(/\b(?:revoke|grant)\b[^;]*?\bon\s+(\S+)/gi)) assert(m[1] === 'public.students', `grant/revoke must target public.students, found ${m[1]}`);
    assert(/enable row level security/i.test(sql) && !/disable row level security|force row level security|bypassrls/i.test(sql), 'RLS may only be enabled');
    assert(!/alter publication|create publication|drop publication/i.test(sql), 'the Realtime publication must not change');
    assert(!/\b(create|drop|alter)\s+(unique\s+)?index\b|add column|drop column|alter column|rename|create table|drop table|truncate\s+table|create trigger|drop trigger/i.test(sql), 'no schema, index or trigger changes');
    assert(!/\binsert\s+into\b|\bupdate\s+public\.|\bdelete\s+from\b/i.test(sql), 'no data changes');
    assert((sql.match(/create policy/gi) || []).length === 1, 'exactly one policy may be created');
    assert(!/\b(grant|revoke)\b[^;]*\bservice_role\b/i.test(sql), 'service_role privileges must not be granted or revoked');
    assert(!/grant\s+(insert|update|delete|truncate|all)/i.test(sql), 'no write privilege may be granted');
  });
  await test('The file is kept outside supabase/migrations and says it is not applied', async () => {
    assert(!fs.existsSync(path.join(ROOT, 'supabase/migrations')), 'a supabase/migrations folder exists; review before adding files there');
    assert(/NOT APPLIED/.test(migration), 'the file must say it is not applied');
  });

  console.log('\n[SECTION D: Preflight]');
  // String literals (the generated restore statements contain semicolons) are blanked before splitting statements.
  const preNoStrings = preSql.replace(/E?'(?:[^']|'')*'/g, "''");
  const statements = preNoStrings.split(';').map((s) => s.trim()).filter(Boolean);
  await test('Every preflight statement is a SELECT, with no writes or privilege changes', async () => {
    assert(statements.length === 14, `expected 14 queries, found ${statements.length}`);
    for (const s of statements) assert(/^select\b/i.test(s), `non-SELECT statement: ${s.slice(0, 60)}`);
    assert(!/\b(insert\s+into|update\s+\w|delete\s+from|drop\s|alter\s|create\s+(table|policy|index|function|trigger)|grant\s+\w+\s+on|revoke\s|truncate\s|set\s+(local\s+)?role)\b/i.test(preNoStrings), 'a write keyword appears outside generated restore text');
  });
  await test('The preflight records what is needed to review and restore (policy names, definitions, grants, fingerprint)', async () => {
    assert(/policyname, permissive, roles, cmd, qual as using_expression, with_check/.test(preSql), 'query 2 must list names and definitions');
    assert(/create policy %I on public\.students/.test(preSql), 'query 3 must generate CREATE POLICY restore statements');
    assert(/as policy_fingerprint/.test(preSql), 'query 4 must produce the fingerprint');
    assert(/aclexplode\(coalesce\(c\.relacl/.test(preSql) && /grant %s on public\.students to %s/.test(preSql), 'query 5 must generate table GRANT restore statements');
    assert(/aclexplode\(att\.attacl\)/.test(preSql) && /grant %s \(%I\) on public\.students/.test(preSql), 'query 6 must generate column GRANT restore statements');
  });
  await test('The preflight never reads student rows and reads auth.users only as aggregate role shapes', async () => {
    assert(!/from\s+(public\.)?students\b/i.test(preSql), 'the preflight selects from the students table itself');
    const q14 = statements[13];
    assert(/from auth\.users/i.test(q14) && /count\(\*\)/i.test(q14) && /group by/i.test(q14), 'query 14 must be an aggregate over auth.users');
    assert(!/\b(email|phone|id|user_id|raw_user_meta_data|encrypted_password)\b/i.test(q14.replace(/raw_app_meta_data/g, '')), 'query 14 must not select identifying columns');
    assert(statements.slice(0, 13).every((s) => !/auth\.users/i.test(s)), 'only query 14 may touch auth.users');
  });

  console.log('\n[SECTION E: Runbook]');
  await test('The README states the gate, role behavior, verification, rollback, and what is unverified', async () => {
    for (const [label, pattern] of [
      ['not ready status', /NOT READY TO APPLY/], ['review gate', /reviewed_preflight/], ['fingerprint gate', /expected_policy_fingerprint/],
      ['role fallback behavior', /app_metadata\.roles/], ['token snapshot caveat', /Token snapshot/], ['student verification', /"role":"student"/],
      ['staff verification', /"role":"instructor"/], ['anon verification', /set local role anon/],
      ['rollback needs captured policies', /Rollback requires restoring the policies and grants captured by the preflight/],
      ['staff realtime untested', /staff Realtime behavior has not been verified/],
      ['static tests are not proof', /static tests do not replace/i], ['service role unaffected', /service role bypasses RLS/i]]) {
      assert(pattern.test(readme), `README is missing: ${label}`);
    }
  });

  console.log('\n[SECTION F: No secrets or personal data]');
  await test('The SQL files and README contain no keys, tokens or email addresses', async () => {
    for (const [name, text] of Object.entries({ migration, preflight, readme })) {
      assert(!/eyJ[A-Za-z0-9_-]{20,}|sb_(secret|publishable)_|(sk|rk)_(live|test)_|re_[A-Za-z0-9]{16,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}/i.test(text), `${name} contains something that looks like a secret or an email address`);
    }
  });

  console.log('\n(Reminder: static checks only. The SQL has not been executed against any database.)');
  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
  console.log('================================================================');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error('Suite crashed:', e && e.stack); process.exit(1); });
