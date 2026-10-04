# Vercel release gate: operator runbook and evidence

## Previously verified deployment (2026-10-04)

- **Full commit SHA:** `dadc45625491faff050b97928b5ee12ca1046212`.
- **Environment:** Vercel **Preview**, not Production or a confirmed staging environment.
- **GitHub deployment ID:** `6839154340`; Vercel deployment status was `success`.
- **Preview URL:** https://trainwithfifs-frontend-ra48js6x8-lastkingswade.vercel.app
- **CI:** GitHub Actions run [37191590497](https://github.com/LastkingSwade/trainwithfifs-frontend/actions/runs/37191590497) passed for this exact SHA, including registration E2E.
- **Not verified:** A Deployment Check definition/run attached to this deployment, Production blocking/promotion behavior, or either staging-promotion scenario. A successful Preview deployment proves none of those.

## Ordered operator runbook

Follow these steps in order. Do not proceed past a failed step. A screenshot or API response is evidence only when it identifies the relevant immutable ID and target; redact tokens, secrets, and personal data.

### 1. Establish the correct Vercel project and isolated test target

1. Identify the intended Vercel Production project by its immutable project ID, not its display name. Record that ID as `VERCEL_PROJECT_ID`.
2. Identify a separate staging Vercel project for failure-injection and promotion tests. It must have no Production domain, customer traffic, or Production environment variables. Record its project ID separately.
3. Confirm which project and deployment targets the dispatch subscription will receive. Keep staging credentials, project/check IDs, dispatch installation, and test workflow isolated from Production settings.

**PASS evidence:** Both project IDs and their intended roles are recorded; staging is demonstrably separate and non-production.

**FAIL:** Project identity or staging isolation is uncertain, or staging shares Production configuration. Stop; do not run promotion tests.

### 2. Create and read back the required Vercel Deployment Check

1. In the intended Vercel project, create a check named **FIFS release verification**.
2. Configure it as required/blocking for the **Production** target, with the Vercel lifecycle/action settings that hold promotion until the check passes (`requires: build-ready` and `blocks: deployment-promotion`, where those are the configured values). Do not use advisory-only, `none`, or alias-only behavior for a promotion gate.
3. Read the saved definition back from Vercel. Record its immutable check ID as `VERCEL_CHECK_ID` and verify the returned project ID, target, lifecycle point, and blocking action.

**PASS evidence:** Read-back shows the expected check ID and Production project/target, required lifecycle point, and blocking promotion action.

**FAIL:** The definition cannot be read back, its target/project differs, or blocking behavior is not explicit. Do not claim the gate is configured. Vercel reference: [Deployment Checks](https://vercel.com/docs/deployment-checks).

### 3. Configure and verify deployment dispatch

1. Configure the Vercel/GitHub integration to send `repository_dispatch` with event type `vercel.deployment.ready` for the intended project and target.
2. Verify a test event arrives in GitHub with `client_payload.id` (deployment ID), `client_payload.environment` exactly `production` for the Production integration, and `client_payload.git.sha` as the full 40-character commit SHA.
3. Confirm the default branch contains `.github/workflows/production-deployment-verification.yml`, that it listens for exactly this event type, and that repository Actions policy permits the workflow to run.

**PASS evidence:** A redacted event record contains the exact event type, deployment ID, environment, and full SHA; the default-branch workflow and Actions policy are verified.

**FAIL:** Any required field is absent or malformed, the event is sent for the wrong project/target, or the workflow/policy is unavailable. The workflow must fail closed; no check may be reported successful. Do not substitute a latest-deployment lookup. If the workflow file is not on the default branch, stop and resolve that before enabling dispatch.

### 4. Configure credentials without mixing environments

1. Add `VERCEL_TOKEN`, `VERCEL_CHECK_ID`, and `VERCEL_PROJECT_ID` as GitHub Actions secrets for the Production workflow. Add `VERCEL_TEAM_ID` only if the project is team-scoped.
2. Confirm the token can read the target deployment and check definition and create/update check runs for the intended project only.
3. Configure separate staging credentials and IDs in the isolated staging workflow/project. Never temporarily replace Production secrets with staging values.

**PASS evidence:** Secret names and environment scope are visible in GitHub settings; an approved read-only/API validation confirms token access to the intended project and check. Do not copy secret values into the record.

**FAIL:** Token scope, project, or check identity is unconfirmed, or staging and Production values share an unsafe scope. Do not dispatch a live release event.

### 5. Verify exact deployment binding and fail-closed evidence checks

For a test deployment, verify the workflow:

1. Uses the event's deployment ID in Vercel's deployment-specific check-run endpoint, then retrieves that same deployment by ID.
2. Compares the returned deployment ID, project ID, Production target, ready state, and Git SHA to the event. The SHA must be the exact merged `main` commit for the associated PR.
3. Finds successful CI for the PR's exact, unchanged head SHA and verifies every required CI step listed below. Recheck the live PR head and the same successful Actions run immediately before accepting the evidence.
4. Completes the check run only after Vercel's API response confirms the same check-run ID, deployment ID, configured check ID, completed status, and expected conclusion.
5. Reports a failure, never success, for missing/mismatched SHA, project or target; absent, stale, mismatched, queued-too-long or failed CI; missing required evidence; changed PR head; or unavailable/unconfirmed Vercel updates. With no deployment ID, record the workflow failure; attachment is impossible and the required Vercel check must remain pending/blocking.

**PASS evidence:** Vercel's deployment details show the check run attached to the exact deployment ID and SHA, with a confirmed final result; the Actions run shows all required evidence passed for the unchanged exact PR head.

**FAIL:** Any ID/SHA/target/evidence mismatch, absent field, or unconfirmed API update. No success result is accepted and no promotion is allowed. Vercel reference: [Create a check run](https://vercel.com/docs/rest-api/checks-v2/create-a-check-run).

### 6. Prove hold and release behavior on isolated staging only

Never inject failures or test promotion in the Production Vercel project.

1. **Known-good release:** On the isolated staging project, use a test deployment based on an approved merged commit with successful exact-head CI. Record deployment ID/SHA and check ID/run ID. Leave the check pending and verify the deployment remains unpromoted and has no assigned production-like alias. Then complete that exact deployment's check successfully and verify promotion occurs only after the passing result.
2. **Fail-closed cases:** On isolated staging only, test missing/mismatched SHA, missing/failed required CI evidence, and unavailable check updates. For each case, verify the deployment remains unpromoted and the check is failed or pending. Never bypass a pending/failed check.
3. **Production configuration review:** Separately inspect the actual Production project's check definition, dispatch subscription, and secret references. Confirm the intended Production project and immutable check ID without running failure injection or a signup/promotion test there. Restore staging-only settings and confirm no Production settings/secrets changed.

**PASS evidence:** Separate records show (a) pending check = promotion blocked, (b) successful exact-deployment check = promotion allowed only afterward, and (c) each injected staging failure = no promotion. The Production read-only review independently matches its intended project/check configuration.

**FAIL:** Any pending/failed staging check permits promotion, a passing check is not bound to the tested deployment, or Production settings were altered during staging tests. Stop and treat the release gate as unverified.

### 7. Capture and review the verification record

Complete one record per deployment/scenario using the template below. Store GitHub Actions links and sanitized Vercel evidence. Record failed scenarios separately from successful ones. Never include credentials, tokens, passwords, or unnecessary personal data.

**PASS:** Required identifiers, results, timestamps, and promotion observation are present and internally consistent.

**FAIL:** A required field is unknown or evidence refers to a different deployment/SHA. Mark the scenario **UNVERIFIED**, not passed.

## Verification record template

Copy once per test case. Use the exact, full commit SHA and immutable deployment/check IDs. For an unavailable check result or API error, state that explicitly rather than inferring success.

```text
Scenario name: [known-good / pending-hold / missing-or-mismatched-SHA / missing-or-failed-CI / unavailable-check-update / other]
Run start/end (UTC):
Evidence capture time(s) (UTC):
Operator:
Vercel project ID (link/API evidence):
Environment/target (config evidence): [isolated staging / Production read-only configuration review]
Deployment ID (Vercel deployment link/API evidence):
Full commit SHA (40 characters; GitHub/Vercel evidence):
Dispatch event type and required fields verified: [yes/no; sanitized event/run link]
Matching PR and exact head SHA:
GitHub Actions run ID and URL (run summary + required-step results):
Required CI evidence: [Node 22, install, typecheck, security tests, registration E2E, release-gate tests, build; list each pass/fail]
Vercel check ID (definition read-back link):
Vercel check-run ID (deployment-specific link/API evidence):
Check-run result: [pending / succeeded / failed / update unavailable or unconfirmed]
Check result confirmed in Vercel for this exact deployment ID and SHA: [yes/no; evidence link]
Observed staging-promotion outcome: [blocked while pending/failed / successful only after check passed / not tested]
Promotion/alias evidence link and observed timestamp(s) (UTC):
Actions/Vercel evidence links (include IDs; secrets/personal data redacted):
Exceptions or operator notes:
Overall scenario: [PASS / FAIL / UNVERIFIED]
```

## Evidence retention by verification-record field

Keep one evidence folder or ticket per scenario. Retain links to authoritative GitHub/Vercel records wherever possible; use screenshots only to preserve UI state that is not otherwise exposed. Every capture should show the page/API context, UTC timestamp, and the relevant immutable ID. Avoid screenshots containing secret values; redact tokens, passwords, email addresses, and unrelated personal data. Keep raw webhook payloads out of tickets unless sanitized.

| Record field | Retain this evidence | Timestamp to record |
|---|---|---|
| Scenario and operator | Run/ticket link; operator initials/name and purpose | Test start and end, UTC |
| Vercel project ID and environment/target | Vercel project Settings or API response showing immutable project ID; project target configuration; for staging, evidence it is isolated from Production | Capture time, UTC; note configuration review time |
| Deployment ID and full SHA | Vercel deployment details URL or API response showing both fields; GitHub deployment/event details showing the same deployment ID and full SHA; retain full 40-character SHA, not only an abbreviated display | Deployment created/ready time and capture time, UTC |
| Dispatch event type and required fields | GitHub Actions run/event details or sanitized `repository_dispatch` evidence with event type, deployment ID, environment, and full SHA. Preserve an immutable run link; do not include secret headers or credentials | Event received time and workflow start time, UTC |
| Matching PR and exact head SHA | GitHub PR URL and head SHA evidence; link the exact Actions run and show the head did not change at final recheck | CI completion and final head-recheck times, UTC |
| Actions run ID/URL and required CI evidence | Canonical Actions run URL plus run summary; retain job/step results for Node 22, install, typecheck, security, registration E2E, release-gate tests, and build. For failures, keep the failed-step log excerpt and run conclusion | Run start/end and final evidence recheck, UTC |
| Vercel check ID and check-run ID | Vercel check definition page/API read-back for immutable check ID and scope; deployment-specific check-run details/API response showing check-run ID, deployment ID, check ID, completed state and conclusion | Check created/updated/completed time, UTC |
| Check result confirmed for exact deployment | Vercel deployment details link/screenshot or API response where deployment ID, full SHA, attached check-run ID and final result are visible together; Actions result is supporting evidence, not a substitute for Vercel confirmation | Vercel confirmation time, UTC |
| Staging-promotion outcome | Before/after Vercel deployment details or API evidence for alias/domain/promotion state tied to the same deployment ID; capture pending/failed state before check completion and successful state only after pass. Label Production configuration review as read-only, not a promotion test | Each state transition and observation, UTC |
| Promotion/alias evidence | Vercel deployment/alias page or API response identifying the deployment and alias state; include timestamp and the exact deployment ID/SHA | Immediately before and after the relevant check transition, UTC |
| Exceptions/notes and final disposition | Actions run link and relevant short log excerpt; Vercel check/deployment evidence; note missing evidence explicitly. Do not infer results from a queued run or from a different SHA | Observation time, UTC |

**Evidence integrity rule:** links should resolve to the same deployment ID and full SHA recorded in the row. A screenshot that omits those identifiers is context only, not proof of binding. If the UI truncates a SHA, pair the screenshot with an API response or GitHub page that exposes the full SHA. Record timestamps in UTC (ISO 8601 preferred, e.g. `2026-10-04T09:34:00Z`) and distinguish event time from screenshot/capture time. Keep evidence according to the repository's normal access and retention policy.

## Troubleshooting: failure signal → likely cause → next action

Do not continue to later steps after a fail condition. Do not bypass a pending or failed Production gate. Use only isolated staging for failure injection; Production checks below are read-only unless an explicitly approved release is being processed.

| Runbook step | Fail evidence | Likely cause | Operator next action |
|---|---|---|---|
| 1. Project and test target | Project ID missing/does not match; staging has Production domain, traffic, variables, or shared credentials | Wrong Vercel project selected, similarly named project, or staging is not actually isolated | Stop testing. Re-identify projects by immutable IDs; establish a separate non-production staging project and remove shared Production configuration before any test. |
| 2. Check definition | Check cannot be read back, wrong project/target, not required, or promotion-blocking action absent | Check created in wrong project, configuration saved with advisory/alias-only behavior, or insufficient access | Do not call the gate configured. Correct the check in the intended project, read it back, compare immutable ID and blocking settings, and retain new evidence. |
| 3. Dispatch and workflow | No event/run; wrong event type; deployment ID, `production`, or full SHA missing; workflow absent from default branch or not triggered | Integration subscription/filter or payload mapping is wrong; Actions policy blocks dispatch; workflow event name/branch is wrong | Inspect sanitized event delivery and workflow triggers/policy. Correct subscription/payload or Actions policy; resend only a safe test event. Missing deployment ID means no deployment-attached result is possible, so the required check must remain pending. |
| 4. Credentials and isolation | Vercel API returns unauthorized/forbidden; project/check lookup fails; staging call reaches Production or vice versa | Token expired/under-scoped, wrong team/project/check ID, or secrets are scoped to the wrong environment | Stop dispatches. Validate secret names and environment scope without exposing values; obtain least-privilege project access and correct IDs. Keep staging and Production secrets separate; rerun read-only validation before proceeding. |
| 5. Exact binding/evidence | Returned deployment ID/project/target/SHA differs; no matching successful CI; CI queued/failed/stale; PR head changed; required step absent; check update unconfirmed | Wrong deployment/event pairing, stale run or wrong PR head, missing CI step, timing/race, API outage, or malformed Vercel response | Treat as failure. Inspect the exact event, deployment-by-ID response, PR head, Actions run and named steps. Rerun CI for the current exact head if appropriate; retry only bounded API retries. Do not look up “latest” deployment or claim success without Vercel confirmation. |
| 6. Staging promotion proof | Pending/failed staging check still promotes, passing check is not bound to the deployment, failure injection hits Production, or Production settings changed | Check is not truly blocking, test isolation is broken, check-run is attached to another deployment, or staging secrets/config were mixed | Stop the test immediately and treat the gate as unverified. Preserve evidence, restore staging-only configuration, inspect Vercel target/check binding and aliases, and confirm Production configuration is unchanged. Do not attempt a Production failure test. |
| 7. Verification record | IDs/SHA disagree, timestamps absent, screenshots omit identifiers, link is inaccessible, or required result is inferred rather than recorded | Evidence captured from different deployments, UI truncation, missing API/run link, or incomplete operator notes | Mark **UNVERIFIED**. Retrieve the authoritative GitHub/Vercel run or API record for the same IDs; add UTC event/capture timestamps and full SHA. If evidence cannot be recovered, repeat only in the approved safe environment. |

For a Vercel update timeout or unavailable check API, record the Actions run and error response, use only the workflow's bounded retry behavior, and inspect the exact deployment's check state in Vercel. If Vercel still shows pending, promotion must stay blocked. Escalate the integration/API issue; never manually mark the gate successful or bypass it.

## Required CI evidence

Require a completed, successful GitHub Actions `CI` run for the associated PR's exact, unchanged head SHA, with every named step successful:

- `Verify PR head is current`
- `Verify Node.js 22`
- `Install dependencies`
- `Run typecheck`
- `Run tests` (security suite via `npm test`)
- `Run registration E2E` (`npm run test:e2e`, public registration + confirmation/session/UID-link tests)
- `Run release-gate tests` (`npm run test:release-gate`, missing SHA/CI, mismatched SHA, absent required evidence, and unconfirmed Vercel updates)
- `Run build`

A successful run without the named registration E2E and release-gate test steps is insufficient. Recheck the live PR head and the same successful Actions run immediately before accepting evidence.

## Previously documented milestones

1. **Implementation:** Workflow, CI evidence checks, and this operator guide must be present on the default branch; Vercel's blocking check and dispatch/secrets must be configured. Complete only when a Production-target dispatch creates or updates a check run attached to that exact deployment and fails closed on missing/mismatched evidence.
2. **Verification:** Pass CI for the exact PR head and validate known-good and failure cases in an approved safe environment. Complete only when captured evidence proves pending/failed checks block and a successful exact-deployment check permits promotion afterward.
3. **Staging signup (separate, blocked milestone):** Confirm a non-production staging URL and Supabase project, allowed Auth redirect/callback settings, and a dedicated confirmation-capable test identity. Supply its password only through the approved secret mechanism. Run the signup smoke test only against staging and verify the persisted client row's `user_id` equals the authenticated Supabase Auth UID. Complete only with sanitized evidence of the staging target/project and exact UID equality. **Never run this signup test in Production.**

## Automated failure-case tests

`npm run test:release-gate` verifies the fail-closed evidence validator rejects a missing deployment SHA, an absent CI run, a CI run for a different PR head, and absent/failed required steps (including registration E2E). It also verifies that an unavailable, incomplete, or wrong Vercel check-update response is not accepted as confirmation. Run it alongside `npm run test:e2e`; CI requires both named steps.

The deployment workflow reports the Vercel check as successful only after the API response confirms the same check-run ID, deployment ID, configured check ID, completed status, and expected conclusion. If the update cannot be confirmed, the GitHub run fails and the deployment check must be treated as pending/blocked. Never bypass the block manually.
