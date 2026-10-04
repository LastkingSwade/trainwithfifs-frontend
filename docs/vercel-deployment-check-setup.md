# Vercel release gate: operator setup and acceptance

## Verified deployment record (2026-10-04)

- **Commit:** `dadc45625491faff050b97928b5ee12ca1046212`.
- **Environment:** Vercel **Preview**, not Production or a confirmed staging environment.
- **GitHub deployment ID:** `6839154340`; Vercel deployment status was `success`.
- **Preview URL:** https://trainwithfifs-frontend-ra48js6x8-lastkingswade.vercel.app
- **CI:** GitHub Actions run [37191590497](https://github.com/LastkingSwade/trainwithfifs-frontend/actions/runs/37191590497) passed for this exact SHA, including the named registration E2E step.
- **Not verified:** A Vercel Deployment Check definition or run attached to this deployment, any Production blocking/promotion behavior, and any staging promotion scenario. A successful Preview deployment is not evidence of any of these.

## Vercel and GitHub configuration checklist

### Vercel project and required check

- [ ] Confirm the intended Vercel project by its immutable project ID. Use this same ID for `VERCEL_PROJECT_ID`; confirm the API-reported `projectId` of the target deployment matches it. Do not rely on project display names alone.
- [ ] Create a Deployment Check named **FIFS release verification** in that project. Configure it as required/blocking for the **Production** target, with `requires: build-ready` and `blocks: deployment-promotion` (not `none`, advisory-only, or alias-only if the goal is to hold promotion). Save the returned immutable check ID as `VERCEL_CHECK_ID`.
- [ ] Read the check definition back through Vercel and verify its ID, project, required lifecycle point, blocking action, and Production target. Vercel documents checks as holding production deployments until required checks pass, before assigning custom production domains. [1](https://vercel.com/docs/deployment-checks)
- [ ] Confirm `VERCEL_TOKEN` can read deployment/check definitions and create/update check runs for that project only; add `VERCEL_TEAM_ID` only for a team-scoped project. Store values as GitHub Actions secrets, never in source or logs.

### Vercel-to-GitHub dispatch and exact deployment binding

- [ ] Configure the Vercel/GitHub integration to dispatch `repository_dispatch` with event type `vercel.deployment.ready` for the intended Production project/target. Confirm GitHub receives the event with `client_payload.id` (Vercel deployment ID), `client_payload.environment` exactly `production`, and `client_payload.git.sha` as the full 40-character commit SHA. A missing field must fail closed.
- [ ] In GitHub Actions, confirm the workflow file `.github/workflows/production-deployment-verification.yml` exists on the default branch and listens for exactly that dispatch type. Confirm the repository's Actions policy permits the dispatch workflow to run.
- [ ] Set repository (or appropriately protected environment) secrets `VERCEL_TOKEN`, `VERCEL_CHECK_ID`, and `VERCEL_PROJECT_ID`; set `VERCEL_TEAM_ID` only if needed. Keep staging credentials/check IDs isolated in a separate staging project and separate test workflow or repository secrets. Never temporarily replace Production credentials with staging credentials in the live release workflow.
- [ ] For each event, verify the workflow uses the event's deployment ID in `POST /v2/deployments/{deploymentId}/check-runs` with the configured `checkId`; then retrieve that same deployment by ID and compare its returned ID, project ID, Production target, ready state, and Git SHA to the event. Vercel's API creates a check run under the deployment-specific endpoint, which is the key binding to the exact deployment. [2](https://vercel.com/docs/rest-api/checks-v2/create-a-check-run)
- [ ] Require the workflow to validate the exact merged `main` SHA, successful CI for the unchanged PR head (including registration E2E), and the check-update API response's check-run ID, deployment ID, check ID, completed status, and conclusion. Do not accept latest-deployment lookup, a commit-only status, an unmatched CI run, or an unconfirmed API update.
- [ ] In the Vercel deployment details, confirm the **FIFS release verification** run is attached to the same deployment ID and SHA from the dispatch, and displays pending/running before evaluation and the final result after evaluation. Vercel documents check runs as associated with a specific deployment. [3](https://vercel.com/docs/checks/creating-checks)

### Safe proof that promotion is blocked and then allowed

- [ ] Do not use the production Vercel project for a failure-injection test. Use a separate staging Vercel project with no production domain, customer traffic, or production environment variables, and an isolated check, dispatch installation, token, and project ID.
- [ ] For a known-good staging deployment based on a merged commit with successful exact-head CI, observe the deployment ID/SHA, check ID/run ID, and state. Keep the check pending and verify no production alias/promotion is assigned; then complete the exact deployment check as succeeded and verify promotion occurs only afterward.
- [ ] On isolated staging only, repeat with missing/mismatched SHA, missing/failed required CI evidence, and unavailable check updates. Confirm each leaves the deployment unpromoted and the check failed or pending. Never bypass a pending/failed gate.
- [ ] Capture deployment ID, full SHA, project/target, redacted dispatch payload, Actions run URL and required-step outcomes, Vercel check ID/run ID and result, observed promotion/alias state, and timestamps. Record failures separately from successful cases.
- [ ] Before calling the gate verified, independently inspect the actual Production project's check definition, dispatch subscription, and secret references; confirm they point to the intended Production project and immutable check ID. Restore staging-only settings and verify no Production settings/secrets were changed.

## End-to-end acceptance criteria

1. **Known-good case:** Use an approved test deployment tied to a merged PR. Dispatch contains the correct deployment ID/SHA and Production environment; the Vercel deployment record matches its ID, Production target, project ID, and SHA; the deployment SHA is the exact merged `main` PR commit; successful CI for that PR's unchanged head includes every required step below. The workflow completes the Vercel check as `succeeded`, and promotion occurs only after it passes.
2. **Pending hold:** Leave the required check pending. Expected: no Production promotion/alias; deployment remains held until the check is completed.
3. **Missing metadata:** Remove deployment ID or SHA from a test dispatch. Expected: workflow fails, no success result; when a deployment ID exists, report failure on that deployment. With no ID, record the workflow failure because attachment is impossible; the required Vercel check remains pending and blocks promotion.
4. **SHA/project/environment mismatch:** Test dispatch SHA differing from the Vercel deployment SHA, incorrect project, non-Production target, and a SHA not equal to a merged PR commit on `main`. Expected: deployment-specific check fails, no promotion, and no fallback to another or latest deployment.
5. **Missing/failed/stale CI:** Test no matching run, queued run exceeding the bounded wait, failed latest run, missing required step, Node 22 guard failure, and PR head changed after CI. Expected: check fails; no stale or partial evidence is accepted.
6. **Unavailable update:** Simulate transient and persistent Vercel API update failures. Expected: bounded retries; workflow fails visibly and does not claim Vercel recorded a result. If the check remains pending, Production stays blocked; operator investigates rather than bypassing.
7. **Failure evidence:** For every case, save Actions run link/log excerpt, deployment ID/SHA, check-run ID and confirmed Vercel result or explicit update failure, and observed promotion state. Never record secrets.

## Required CI evidence

Require a completed successful GitHub Actions `CI` run for the associated PR's exact, unchanged head SHA, with these named steps all successful:

- `Verify PR head is current`
- `Verify Node.js 22`
- `Install dependencies`
- `Run typecheck`
- `Run tests` (security suite via `npm test`)
- `Run registration E2E` (`npm run test:e2e`, public registration + confirmation/session/UID-link tests)
- `Run release-gate tests` (`npm run test:release-gate`, missing SHA/CI, mismatched SHA, absent required evidence, and unconfirmed Vercel updates)
- `Run build`

Recheck the live PR head and the same successful Actions run immediately before accepting evidence. E2E is required: the CI step must be present and successful on the exact unchanged PR head. A passing CI job without the named E2E step is insufficient.

## Prioritized remaining milestones

1. **Implementation — deployment-bound check (in progress in this PR):** merge the workflow and this operator guide; create the Vercel blocking check definition; configure dispatch and secrets. Done when a production-target Vercel dispatch creates/updates a check run attached to that exact deployment and fails closed on missing/mismatched evidence.
2. **Verification — CI and workflow behavior:** pass PR CI for the exact PR head; validate known-good and failure cases above in an approved safe environment; verify pending/failed checks prevent promotion and success releases it. Done when captured evidence shows both blocking and successful promotion behavior. E2E is required by the release check and must pass in CI.
3. **Staging signup — separate blocked milestone:** confirm a non-production staging URL and Supabase project, allowed Auth redirect/callback settings, and a dedicated confirmation-capable test identity; supply its password only through the approved secret mechanism. Run the smoke test only against staging, then verify the persisted client row's `user_id` equals the authenticated Supabase Auth UID. Done when sanitized evidence records staging target/project and exact UID equality. **Never run this signup test in Production.**

## Failure-case automated tests

`npm run test:release-gate` verifies the fail-closed evidence validator rejects a missing deployment SHA, an absent CI run, a CI run for a different PR head, and absent/failed required steps (including registration E2E). It also verifies that an unavailable, incomplete, or wrong Vercel check-update response is not accepted as confirmation. Run it locally alongside `npm run test:e2e`; CI requires both named steps.

The deployment workflow reports the Vercel check as successful only after the API response confirms the same check-run ID, deployment ID, configured check ID, completed status, and expected conclusion. If the update cannot be confirmed, the GitHub run fails and the deployment check must be treated as pending/blocked. Never bypass the block manually.
