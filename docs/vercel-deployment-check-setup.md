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
Run date/time (UTC):
Operator:
Vercel project ID:
Environment/target: [isolated staging / Production read-only configuration review]
Deployment ID:
Full commit SHA (40 characters):
Dispatch event type and required fields verified: [yes/no; evidence link]
Matching PR and exact head SHA:
GitHub Actions run ID and URL:
Required CI evidence: [Node 22, install, typecheck, security tests, registration E2E, release-gate tests, build; list each pass/fail]
Vercel check ID:
Vercel check-run ID:
Check-run result: [pending / succeeded / failed / update unavailable or unconfirmed]
Check result confirmed in Vercel for this exact deployment ID and SHA: [yes/no; evidence link]
Observed staging-promotion outcome: [blocked while pending/failed / successful only after check passed / not tested]
Promotion or alias evidence and timestamp:
Actions/Vercel evidence links (secrets redacted):
Exceptions or operator notes:
Overall scenario: [PASS / FAIL / UNVERIFIED]
```

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
