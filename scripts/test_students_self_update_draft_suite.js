/**
 * TrainWithFIFS - STATIC TEXT checks for the DRAFT students self-update / classes policy proposal
 *
 * IMPORTANT: this is a static text test. The SQL is read as text and is NEVER executed here. Passing it does NOT show
 * that the SQL is syntactically valid, that it works against Supabase, that it is safe for production, or that any
 * live-state assumption still holds. The Production values below were returned by read-only preflight queries run on
 * 2026-10-08 and are a snapshot: the SQL recomputes each from the live database and stops on any difference, and its
 * gate (reviewed_preflight and owner_accepts_classes_replacement) must stay closed in the committed file.
 *
 * What it guards: the draft stays inert until the owner closes the gate; its only changes are REVOKE UPDATE from
 * authenticated and anon plus one admin-only ALTER POLICY on public.classes; SELECT, PUBLIC, other privileges and every
 * other policy are never touched; effective (not just table-level) UPDATE is checked and rolls back on failure; and the
 * preflight stays read-only and covers storage policies, triggers and effective privileges. It also feeds the checker a
 * set of deliberately unsafe variants and requires each to be rejected.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf-8');
const stripSqlComments = (sql) => sql.replace(/--.*$/gm, '');
const noStrings = (s) => s.replace(/E?'(?:[^']|'')*'/g, "''");

let passed = 0, failed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log(`  ✓ PASS: ${name}`); }
  catch (e) { failed++; console.log(`  ✗ FAIL: ${name}\n      ${e.message}`); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

// Values returned by Production on 2026-10-08 (preflight Q4, Q13, Q27, Q28, Q10, Q9). The draft must pin exactly these.
const PINS = {
  students_policy_fingerprint: '77496562807ce3ab98e340e14f5e7720',
  dependents_fingerprint: 'a92d2e5ed54ed7368c6a99431ffee545',
  outside_public_policies_fingerprint: 'ca65b953038aa206886a063b2685bcbf',
  triggers_fingerprint: 'd41d8cd98f00b204e9800998ecf8427e',
  classes_policy_fingerprint: 'ba5eeb13c196edad6b2f13388b434bb0',
  other_classes_policies_fingerprint: 'b538edf609d742cb6bc0021b0309ff79'
};
const FINGERPRINT_NAMES = ['students_policy_fingerprint', 'dependents_fingerprint', 'outside_public_policies_fingerprint', 'triggers_fingerprint', 'classes_policy_fingerprint', 'other_classes_policies_fingerprint'];

/** Returns a list of violations for a draft SQL text. An empty list means every static rule holds. */
function checkDraft(raw) {
  const v = [];
  const sql = stripSqlComments(raw);
  const firstExecute = sql.indexOf('execute ');
  const count = (re, text = sql) => (text.match(re) || []).length;

  // Inert as committed
  if (!/^-- DRAFT\. UNVERIFIED\. NOT PRODUCTION-READY\. NOT APPLIED/.test(raw)) v.push('missing DRAFT/UNVERIFIED/NOT APPLIED label');
  if (!/PRODUCTION EVIDENCE/.test(raw) || !/2026-10-08/.test(raw) || !/stays CLOSED/.test(raw)) v.push('missing the Production-evidence statement (date, snapshot, gate stays closed)');
  if (!/reviewed_preflight constant boolean := false;/.test(sql)) v.push('reviewed_preflight must be false');
  if (!/owner_accepts_classes_replacement constant boolean := false;/.test(sql)) v.push('owner_accepts_classes_replacement must be false');
  if (/old_classes_predicate_was_only_is_admin/.test(raw)) v.push('the inaccurate "only the is_admin lookup" attestation must not exist');
  for (const name of FINGERPRINT_NAMES) if (!new RegExp(`${name} constant text := '${PINS[name]}';`).test(sql)) v.push(`${name} must be pinned to the Production value`);
  if (!/classes_policy_name constant text := 'Admins have full access to classes';/.test(sql)) v.push('the classes policy name must be pinned');
  if (!/expected_classes_policy_cmd constant text := 'ALL';/.test(sql)) v.push("the classes policy command must be pinned to 'ALL'");
  if (!/expected_classes_policy_roles constant text := '\{public\}';/.test(sql)) v.push("the classes policy roles must be pinned to '{public}'");
  for (const m of [/NOT READY: the owner has not recorded a review/, /one or more pinned fingerprints are empty/, /expected_classes_policy_cmd and expected_classes_policy_roles are empty/, /has not accepted that the replacement drops BOTH clauses of the old classes predicate/]) if (!m.test(sql)) v.push(`missing gate failure ${m}`);
  if (!/not an unchanged predicate|NOT an unchanged predicate/i.test(raw)) v.push('the header must say the replacement is not an unchanged predicate');
  if (!/^\s*begin;/im.test(sql) || !/\bcommit;\s*$/im.test(sql.trim())) v.push('must be begin; ... commit;');
  if (count(/^\s*do \$\$/gim) !== 1) v.push('exactly one DO block expected');

  // The only changes: two UPDATE revokes and one ALTER POLICY
  const privilegeStatements = (sql.match(/execute\s+'(?:revoke|grant)[^']*'/gi) || []).map((s) => s.replace(/\s+/g, ' ').toLowerCase());
  const allowed = ["execute 'revoke update on public.students from authenticated'", "execute 'revoke update on public.students from anon'"];
  if (privilegeStatements.length !== 2 || !allowed.every((a) => privilegeStatements.includes(a))) v.push(`privilege statements must be exactly the two UPDATE revokes, found: ${privilegeStatements.join(' | ') || 'none'}`);
  if (/\b(revoke|grant)\b[^;']*\bselect\b/i.test(noStrings(sql)) || /execute\s+'[^']*\bselect\b[^']*'/i.test(sql)) v.push('SELECT must never be revoked or granted');
  if (/execute\s+'[^']*\bpublic\s*'/i.test(sql.replace(/public\./gi, ''))) v.push('PUBLIC must never be revoked automatically');
  if (/\b(maintain|truncate|references|trigger)\b[^;']*\bfrom\b/i.test(privilegeStatements.join(' ')) || /revoke\s+(insert|delete)/i.test(privilegeStatements.join(' '))) v.push('A2 privileges must not be in the default transaction');
  if (/drop policy|create policy/i.test(sql)) v.push('no policy may be dropped or created');
  if (count(/alter policy/gi) !== 1 || !/'alter policy %I on public\.classes%s%s'/.test(sql)) v.push('exactly one ALTER POLICY, on public.classes, with no TO/RENAME clause');
  if (/classes_allowed_roles|students_update_policies_to_drop/.test(sql)) v.push('owner role choice and optional policy drops must not exist');
  if (/\balter\s+table\b|\binsert\s+into\b|\bupdate\s+public\.|\bdelete\s+from\b|\b(create|drop)\s+(index|table|trigger|publication)\b|alter publication|enable row level security|disable row level security|force row level security/i.test(noStrings(sql))) v.push('no data, schema, trigger, publication, or RLS-setting changes');
  if (/(grant|revoke)[^';]*service_role/i.test(privilegeStatements.join(' '))) v.push('service_role privileges must not change');

  // Admin-only trusted expression
  const expr = (sql.match(/\$e\$exists \([\s\S]*?\)\$e\$/) || [''])[0];
  if (expr.length < 300) v.push('could not isolate the classes expression');
  else {
    if (!/auth\.jwt\(\) -> 'app_metadata'/.test(expr) || !/claims\.m -> 'role'/.test(expr) || !/claims\.m -> 'roles'/.test(expr)) v.push('expression must read app_metadata role and roles');
    if (!/jsonb_array_length\(pick\.chosen\) = 1/.test(expr) || !/lower\(btrim\(/.test(expr)) v.push('expression must mirror the server rule (one-element array, lower, trim)');
    if (!/\) = 'admin'\s*\n?\s*\)\$e\$/.test(expr)) v.push("expression must compare with exactly = 'admin'");
    if (/instructor|staff|user_metadata|email|is_admin|students|auth\.uid|user_id|\bin \(\s*'(admin|instructor|staff)'|= any\s*\(/i.test(expr)) v.push('expression must be admin-only and use only the trusted claim');
  }

  // Preserve command and roles; verify before and after
  if (count(/live_cmd <> expected_classes_policy_cmd or live_roles <> expected_classes_policy_roles/g) !== 2) v.push('classes command and roles must be verified before and after');

  // Fingerprints: every one compared before the first change; students/outside/triggers/other-classes re-checked after
  for (const name of FINGERPRINT_NAMES) {
    const at = sql.search(new RegExp(`<> ${name}\\b`));
    if (at < 0) v.push(`${name} is never compared`);
    else if (firstExecute < 0 || at > firstExecute) v.push(`${name} must be compared before the first change`);
  }
  for (const name of ['students_policy_fingerprint', 'outside_public_policies_fingerprint', 'triggers_fingerprint', 'other_classes_policies_fingerprint']) {
    if (count(new RegExp(`<> ${name}\\b`, 'g')) < 2) v.push(`${name} must be re-checked after the change`);
  }
  if (!/dependents_excl_before <> dependents_excl_after/.test(sql)) v.push('dependent policies must be compared before and after');

  // Stops
  for (const m of [/browser-readable views are built on students or classes/, /browser-callable security-definer functions use students/, /service_role does not hold SELECT, INSERT, UPDATE and DELETE/, /PUBLIC holds UPDATE on public\.students/, /authenticated cannot select from public\.students at the start/, /must have a USING expression and no WITH CHECK/, /not the pinned two-clause definition/]) if (!m.test(sql)) v.push(`missing stop ${m}`);
  if (!/qual ilike '%service_role%' and qual ilike '%is_admin%' and qual ilike '%students%'/.test(sql)) v.push('the old classes policy must be checked to contain the service_role clause and the students/is_admin lookup');
  if (!/if not has_using or has_check then/.test(sql)) v.push('the stop must trigger when the policy lacks USING or has a WITH CHECK');
  if (count(/a\.grantee = 0 and a\.privilege_type = 'UPDATE'/g) !== 2) v.push('PUBLIC UPDATE must be checked at table and column level');

  // Effective UPDATE, after the revokes, rolls back
  const effectiveAt = sql.search(/for rec in select unnest\(array\['anon', 'authenticated'\]\)/);
  if (effectiveAt < 0 || firstExecute < 0 || effectiveAt < firstExecute) v.push('effective UPDATE must be checked for anon and authenticated after the revokes');
  for (const fn of ['has_table_privilege', 'has_any_column_privilege', 'has_column_privilege']) {
    if (!new RegExp(`${fn}\\(rec\\.role_name::name, 'public\\.students'[^)]*'UPDATE'\\)`).test(sql)) v.push(`${fn} UPDATE check is missing`);
  }
  if (!/Post-check failed: % still has effective UPDATE on public\.students/.test(sql)) v.push('residual effective UPDATE must raise');

  // SELECT unchanged, per role and per column
  if (count(/has_column_privilege\('(authenticated|anon)', 'public\.students', a\.attname, 'SELECT'\)/g) !== 4) v.push('effective SELECT per column must be recorded before and after for both roles');
  if (!/coalesce\(select_cols_auth_before, ''\) <> coalesce\(select_cols_auth_after, ''\)/.test(sql) || !/coalesce\(select_cols_anon_before, ''\) <> coalesce\(select_cols_anon_after, ''\)/.test(sql)) v.push('SELECT columns must be compared before and after');
  if (!/before_select_policies, ''\) <> coalesce\(after_select_policies/.test(sql)) v.push('SELECT-granting policies must be compared before and after');

  // service_role before and after; classes result
  for (const priv of ['select', 'insert', 'update', 'delete']) if (!new RegExp(`has_table_privilege\\('service_role', 'public\\.students', '${priv}'\\)`).test(sql)) v.push(`service_role ${priv} must be checked on its own`);
  for (const m of [/the classes policy still references is_admin or students/, /not an admin-only check of app_metadata with no WITH CHECK/, /another classes policy changed/, /row level security is not enabled on public\.classes/]) if (!m.test(sql)) v.push(`missing classes post-check ${m}`);
  if (!/!~\* '\(instructor\|staff\|user_metadata\|email\|service_role\)'/.test(sql) || !/and with_check is null\s*\n\s*\) then/.test(sql)) v.push('the classes post-check must forbid instructor, staff, user_metadata, email and service_role, and require no WITH CHECK');
  return v;
}

async function main() {
  const route = read('src/app/api/fifs/route.ts');
  const page = read('src/app/page.tsx');
  const script = read('public/scripts/TrainWithFIFS_scripts.js');
  const draftRaw = read('docs/supabase/DRAFT-students-self-update-and-classes-policy.sql');
  const preRaw = read('docs/supabase/DRAFT-students-self-update-and-classes-preflight.sql');
  const readme = read('docs/supabase/DRAFT-students-self-update-and-classes-README.md');
  const sql = stripSqlComments(draftRaw);

  console.log('NOTE: static text test only. It does not prove the SQL is valid or correct, or that any live-state fact is true.');

  console.log('\n[SECTION A: What the repository shows]');
  await test('The browser never queries or updates students or classes', async () => {
    for (const [name, text] of Object.entries({ 'page.tsx': page, 'TrainWithFIFS_scripts.js': script })) assert(!/\.from\(\s*['"`](students|classes)['"`]\s*\)/.test(text), `${name} queries students or classes directly`);
  });
  await test('The public class list uses the anonymous client, so a public classes policy must be left alone', async () => {
    const at = route.indexOf("case 'getClasses'");
    assert(/getPublicClient\(\)/.test(route.slice(at, at + 500)) && /is_active/.test(route.slice(at, at + 500)), 'getClasses must read active classes with the public client');
  });
  await test('The server has an admin-only helper that the draft expression mirrors, and the app never writes classes', async () => {
    assert(/function isAdmin\(user: any\)[\s\S]*?role === 'admin'/.test(route), 'isAdmin() must compare to admin only');
    assert(!/from\('classes'\)\s*\.(insert|update|upsert|delete)/.test(route.replace(/\s+/g, ' ')), 'the server now writes classes; re-check the draft');
  });
  await test('Every server read or write of students uses the service-role client', async () => {
    for (const c of route.split(/\n\s*case '/).slice(1)) {
      if (!/from\(\s*['"`]students['"`]\s*\)|from\(profileTable\)/.test(c)) continue;
      assert(/supabase\s*=\s*getPrivilegedClient\(\)/.test(c) && !/supabase\s*=\s*getPublicClient\(\)/.test(c), `case ${c.slice(0, c.indexOf("'"))} touches students without the service-role client`);
    }
  });

  console.log('\n[SECTION B0: The pinned Production values]');
  await test('Every pinned fingerprint is a well-formed 32-character hex digest, and all six are distinct except none repeated', async () => {
    for (const [name, value] of Object.entries(PINS)) assert(/^[0-9a-f]{32}$/.test(value), `${name} is not a 32-character hex digest`);
    const nonEmpty = Object.entries(PINS).filter(([n]) => n !== 'triggers_fingerprint').map(([, v]) => v);
    assert(new Set(nonEmpty).size === nonEmpty.length, 'two different fingerprints are identical, which suggests a copy error');
    assert(PINS.triggers_fingerprint === 'd41d8cd98f00b204e9800998ecf8427e', 'the empty-trigger-set fingerprint must be the md5 of the empty string');
    assert(require('crypto').createHash('md5').update('').digest('hex') === PINS.triggers_fingerprint, 'the empty-set fingerprint does not equal md5 of nothing');
  });

  console.log('\n[SECTION B: The draft SQL (text rules)]');
  await test('The draft satisfies every static rule', async () => {
    const violations = checkDraft(draftRaw);
    assert(violations.length === 0, `violations:\n        - ${violations.join('\n        - ')}`);
  });
  await test('A2 is documented only as optional follow-up risk, with MAINTAIN named, and A3 code does not exist', async () => {
    assert(/MAINTAIN/.test(draftRaw) && /not touched|intentionally left alone/i.test(draftRaw), 'the SQL header must name MAINTAIN as untouched');
    assert(!/execute '(?:revoke|grant)[^']*\b(insert|delete|truncate|references|trigger|maintain)\b/i.test(sql), 'A2 privileges must not be revoked');
    assert(!/drop policy/i.test(sql), 'no policy may be dropped');
  });
  await test('The draft is kept outside any auto-applied folder', async () => {
    assert(!fs.existsSync(path.join(ROOT, 'supabase/migrations')), 'a supabase/migrations folder exists');
  });

  console.log('\n[SECTION C: Deliberately unsafe variants must be rejected]');
  const R = (a, b) => (text) => { assert(text.includes(a), `mutation anchor not found: ${a.slice(0, 50)}`); return text.replace(a, b); };
  const UNSAFE = {
    'gate opened': R('reviewed_preflight constant boolean := false;', 'reviewed_preflight constant boolean := true;'),
    'owner acceptance opened': R('owner_accepts_classes_replacement constant boolean := false;', 'owner_accepts_classes_replacement constant boolean := true;'),
    'the inaccurate only-is_admin attestation reintroduced': R('owner_accepts_classes_replacement constant boolean := false;', 'owner_accepts_classes_replacement constant boolean := false;\n  old_classes_predicate_was_only_is_admin constant boolean := false;'),
    'a pinned fingerprint altered': R("students_policy_fingerprint constant text := '77496562807ce3ab98e340e14f5e7720';", "students_policy_fingerprint constant text := '00000000000000000000000000000000';"),
    'the classes fingerprint blanked': R("classes_policy_fingerprint constant text := 'ba5eeb13c196edad6b2f13388b434bb0';", "classes_policy_fingerprint constant text := '';"),
    'pinned classes command changed': R("expected_classes_policy_cmd constant text := 'ALL';", "expected_classes_policy_cmd constant text := 'SELECT';"),
    'pinned classes roles changed': R("expected_classes_policy_roles constant text := '{public}';", "expected_classes_policy_roles constant text := '{authenticated}';"),
    'two-clause definition check removed': R("and qual ilike '%service_role%' and qual ilike '%is_admin%' and qual ilike '%students%'", ''),
    'WITH CHECK stop removed': R('if not has_using or has_check then', 'if not has_using then'),
    'post-check allows service_role in the new policy': R("(instructor|staff|user_metadata|email|service_role)", '(instructor|staff|user_metadata|email)'),
    'A2 restored (INSERT/DELETE/...)': R("  execute 'revoke update on public.students from anon';", "  execute 'revoke update on public.students from anon';\n  execute 'revoke insert, delete, truncate, references, trigger on public.students from anon';"),
    'MAINTAIN revoked': R("  execute 'revoke update on public.students from anon';", "  execute 'revoke update on public.students from anon';\n  execute 'revoke maintain on public.students from authenticated';"),
    'SELECT revoked': R("  execute 'revoke update on public.students from anon';", "  execute 'revoke update on public.students from anon';\n  execute 'revoke select on public.students from authenticated';"),
    'revoked from PUBLIC': R("  execute 'revoke update on public.students from anon';", "  execute 'revoke update on public.students from anon';\n  execute 'revoke update on public.students from public';"),
    'service_role revoked': R("  execute 'revoke update on public.students from anon';", "  execute 'revoke update on public.students from anon';\n  execute 'revoke update on public.students from service_role';"),
    'a privilege granted': R("  execute 'revoke update on public.students from anon';", "  execute 'revoke update on public.students from anon';\n  execute 'grant select on public.students to anon';"),
    'a policy dropped': R("  execute 'revoke update on public.students from anon';", "  execute 'revoke update on public.students from anon';\n  execute 'drop policy students_own_update on public.students';"),
    'a policy created': R("  execute 'revoke update on public.students from anon';", "  execute 'revoke update on public.students from anon';\n  execute 'create policy x on public.students for select using (true)';"),
    'a change made before the checks': R('  -- ---------------------------------------------------------------- 1. Gate', "  execute 'revoke update on public.students from anon';\n  -- ---------------------------------------------------------------- 1. Gate"),
    'classes also open to staff': R("end, E' \\t\\n\\r\\f\\v')) = 'admin'", "end, E' \\t\\n\\r\\f\\v')) in ('admin', 'staff')"),
    'classes trusts user_metadata': R("auth.jwt() -> 'app_metadata' as m", "auth.jwt() -> 'user_metadata' as m"),
    'classes policy roles changed with TO': R("'alter policy %I on public.classes%s%s'", "'alter policy %I on public.classes to public%s%s'"),
    'command and roles check removed': R('live_cmd <> expected_classes_policy_cmd or live_roles <> expected_classes_policy_roles', 'false'),
    'any-column UPDATE check removed': R("or has_any_column_privilege(rec.role_name::name, 'public.students', 'UPDATE')", 'or false'),
    'per-column UPDATE check removed': R("and has_column_privilege(rec.role_name::name, 'public.students', a.attname, 'UPDATE')", 'and false'),
    'PUBLIC UPDATE stop removed': R("a.grantee = 0 and a.privilege_type = 'UPDATE'\n  ) or exists", "a.grantee = 0 and a.privilege_type = 'NONE'\n  ) or exists"),
    'storage policy comparison removed': R('if cur <> outside_public_policies_fingerprint then', 'if false then'),
    'trigger comparison removed': R('if cur <> triggers_fingerprint then', 'if false then'),
    'SELECT column comparison removed': R("if coalesce(select_cols_auth_before, '') <> coalesce(select_cols_auth_after, '')", 'if false'),
    'service_role guard removed': R('raise exception \'Stopped: service_role does not hold SELECT, INSERT, UPDATE and DELETE on public.students directly.\';', 'null;')
  };
  for (const [label, mutate] of Object.entries(UNSAFE)) {
    await test(`Rejected: ${label}`, async () => {
      const violations = checkDraft(mutate(draftRaw));
      assert(violations.length > 0, 'the unsafe variant passed every rule');
    });
  }

  console.log('\n[SECTION D: Preflight (text rules)]');
  const preNo = noStrings(stripSqlComments(preRaw));
  const statements = preNo.split(';').map((s) => s.trim()).filter(Boolean);
  await test('The preflight has 28 numbered queries, every statement is a SELECT, and none writes or changes privileges', async () => {
    const numbers = [...preRaw.matchAll(/^-- (\d+)\. /gm)].map((m) => Number(m[1]));
    assert(numbers.join(',') === Array.from({ length: 28 }, (_, i) => i + 1).join(','), `query numbers are not 1..28 in order: ${numbers.join(',')}`);
    assert(statements.length === 28, `expected 28 statements, found ${statements.length}`);
    for (const s of statements) assert(/^select\b/i.test(s), `non-SELECT statement: ${s.slice(0, 60)}`);
    assert(!/\b(insert\s+into|update\s+\w|delete\s+from|drop\s|alter\s|create\s+(table|policy|index|function|trigger)|grant\s+\w+\s+on|revoke\s|truncate\s|set\s+(local\s+)?role)\b/i.test(preNo), 'a write keyword appears outside generated restore text');
  });
  await test('It covers effective privileges, PUBLIC UPDATE, inheritance, storage and outside-public policies, and triggers', async () => {
    for (const [label, m] of [['effective table/any-column', /has_any_column_privilege\(r\.oid, 'public\.students', 'UPDATE'\)/], ['effective per column', /has_column_privilege\('authenticated', 'public\.students', a\.attname, 'UPDATE'\)/], ['inheritance', /pg_auth_members/], ['PUBLIC UPDATE', /a\.grantee = 0 and a\.privilege_type = 'UPDATE'/], ['outside public', /schemaname <> 'public'\s*\n\s*and \(coalesce\(qual, ''\)/], ['storage.objects', /schemaname = 'storage' and tablename = 'objects'/], ['triggers on both tables', /tgrelid in \('public\.students'::regclass, 'public\.classes'::regclass\)/], ['invoices and scoresheets', /'invoices', 'student_scoresheets'/], ['server version', /server_version/]]) {
      assert(m.test(preRaw), `preflight is missing: ${label}`);
    }
  });
  await test('It still captures names, definitions, restore statements, and the gate fingerprints', async () => {
    for (const [label, m] of [['students policies', /policyname, permissive, roles, cmd, qual as using_expression, with_check/], ['restore create', /create policy %I on public\.students/], ['students fingerprint', /as students_policy_fingerprint/], ['table grants restore', /grant %s on public\.students to %s/], ['column grants restore', /grant %s \(%I\) on public\.students/], ['classes restore alter', /alter policy %I on public\.classes/], ['classes fingerprints', /as classes_policy_fingerprint/], ['dependents fingerprint', /as dependents_fingerprint/], ['outside-public fingerprint', /as outside_public_policies_fingerprint/], ['triggers fingerprint', /as triggers_fingerprint/]]) assert(m.test(preRaw), `preflight is missing: ${label}`);
  });
  await test('The new fingerprints are computed identically in the preflight and in the draft', async () => {
    const fmt = (text, re) => (text.match(re) || [])[0];
    const outside = /format\('%s\|%s\|%s\|%s\|%s\|%s\|%s\|%s', schemaname, tablename, policyname, permissive, cmd, roles::text, coalesce\(qual, ''\), coalesce\(with_check, ''\)\)/;
    const trig = /format\('%s\|%s\|%s\|%s', tgrelid::regclass::text, tgname, tgenabled, pg_get_triggerdef\(oid\)\)/;
    assert(fmt(preRaw, outside) && fmt(preRaw, outside) === fmt(sql, outside), 'outside-public fingerprint expressions differ');
    assert(fmt(preRaw, trig) && fmt(preRaw, trig) === fmt(sql, trig), 'triggers fingerprint expressions differ');
  });
  await test('The preflight reads no student rows: the only table read is a COUNT of is_admin; auth.users is never read', async () => {
    const reads = statements.filter((s) => /from\s+(public\.)?students\b/i.test(s));
    assert(reads.length === 1 && /select count\(\*\) as admin_flagged_students from public\.students where is_admin is true/i.test(reads[0]), 'only the count-only is_admin query may read students');
    assert(!/auth\.users/i.test(preNo), 'the preflight must not read auth.users');
  });

  console.log('\n[SECTION E: Runbook]');
  await test('The runbook states the evidence status, the fixed scope, the remaining risk, and that static tests are not proof', async () => {
    for (const [label, m] of [
      ['draft label', /DRAFT\. UNVERIFIED\. NOT PRODUCTION-READY\. NOT STAGING-READY/], ['production evidence snapshot', /Production evidence \(a snapshot\)/], ['evidence date', /2026-10-08/],
      ['gate stays closed', /stays \*\*closed\*\*/], ['owner acceptance gate', /owner_accepts_classes_replacement/], ['two-clause predicate', /two clauses/], ['not an unchanged predicate', /not an unchanged `is_admin` lookup/],
      ['service_role clause dropped', /`service_role` clause/], ['ALL and public preserved', /command \(`ALL`\) and roles \(`\{public\}`\) are\s+preserved and verified/],
      ['UPDATE only', /REVOKE UPDATE ON public\.students.*from `authenticated` and from `anon`\. Nothing else/s], ['SELECT untouched', /never revoked or altered/],
      ['dependents of SELECT incl storage', /storage\.objects` policy "Students view own scoresheet files strictly by user_id"/], ['A2 removed with MAINTAIN named', /A2 \(removed\)[\s\S]*MAINTAIN/], ['A3 removed', /A3 \(removed\)/], ['no PUBLIC revoke', /No `PUBLIC` revoke, ever/],
      ['effective UPDATE checks', /Effective UPDATE is gone/], ['PUBLIC UPDATE stop', /`PUBLIC` holding `UPDATE`/], ['triggers none', /No triggers on `students` or `classes`/],
      ['reachability unknown', /do not\s+establish which of them can be reached from outside|does not\s+establish which paths are reachable|do not establish which paths are reachable/], ['follow-up: portal_password', /portal_password/],
      ['follow-up: documents bucket', /`documents` storage bucket/], ['follow-up: public invoice inserts', /Public invoice inserts/], ['follow-up: email-based admin policy', /Email-based access in the students admin policy/], ['follow-up: other grants', /DELETE`, `TRUNCATE`, `REFERENCES`, `TRIGGER` and `MAINTAIN`/],
      ['admin test expects staff denied', /instructor and staff do not/], ['rollback needs captured policies', /requires restoring the policies and grants captured by the\s+preflight/],
      ['static tests not proof', /not proof the SQL is syntactically valid or works against Supabase/]]) {
      assert(m.test(readme), `README is missing: ${label}`);
    }
  });

  console.log('\n[SECTION F: No secrets or personal data]');
  await test('The draft files contain no keys, tokens or email addresses', async () => {
    for (const [name, text] of Object.entries({ draft: draftRaw, preflight: preRaw, readme })) {
      assert(!/eyJ[A-Za-z0-9_-]{20,}|sb_(secret|publishable)_|(sk|rk)_(live|test)_|re_[A-Za-z0-9]{16,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}/i.test(text), `${name} contains something that looks like a secret or an email address`);
    }
  });

  console.log('\n(Reminder: static text checks only. The SQL has not been executed and is not verified. The pinned Production values are a 2026-10-08 snapshot that the SQL itself re-checks against the live database.)');
  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
  console.log('================================================================');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error('Suite crashed:', e && e.stack); process.exit(1); });
