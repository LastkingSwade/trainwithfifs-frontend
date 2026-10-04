# Vercel release gate: operator setup and acceptance

## Operator setup checklist

- [ ] In the correct Vercel project, create a custom Deployment Check named **FIFS release verification**; set it to require `build-ready` and block `deployment-promotion`. Keep the check ID.
- [ ] Configure the Vercel-to-GitHub repository dispatch integration for `vercel.deployment.ready` and Production deployments. Confirm the payload provides deployment `id`, `environment`, and `git.sha`.
- [ ] In GitHub Actions secrets, configure `VERCEL_TOKEN`, `VERCEL_CHECK_ID`, and `VERCEL_PROJECT_ID`; configure `VERCEL_TEAM_ID` if required by the account. Grant the token only the project/check access needed. Never commit credentials.
- [ ] Add `.github/workflows/production-deployment-verification.yml` and merge it only after PR checks pass. Confirm the workflow can receive the Vercel dispatch.
- [ ] Test on a non-production or otherwise approved safe test deployment. Verify Vercel holds Production alias/promotion while the required check is pending or failed, and promotes only after success.
- [ ] Record deployment ID/SHA/environment, PR number/head SHA, Actions run ID/URL, required step results, Vercel check run ID/result, promotion outcome, and timestamps. Redact tokens and personal data.

## Exact Vercel settings and staging-only validation

Configure the check in the Train With FIFS Vercel project under **Project Settings → Deployment Checks** (labels can vary by Vercel plan/UI): create one custom check named **FIFS release verification**, save its immutable check ID, make it **required**, and set the deployment lifecycle trigger to **build ready** (`build-ready`) with the blocking action **deployment promotion** (`deployment-promotion`). Apply it to the **Production environment**. Do not use a non-blocking advisory check. The check is completed by the GitHub workflow for the exact deployment ID; it is not a generic commit status.

Configure Vercel’s GitHub integration/webhook dispatch to send `repository_dispatch` event type `vercel.deployment.ready` for Production deployments only. The payload must include `client_payload.id` (Vercel deployment ID), `client_payload.environment` exactly `production`, and `client_payload.git.sha` (full Git commit SHA). Keep the workflow secrets aligned with the same Vercel project and check: `VERCEL_TOKEN`, `VERCEL_CHECK_ID`, `VERCEL_PROJECT_ID`, and `VERCEL_TEAM_ID` when the project is team-scoped. Never test by changing these secrets to the live production project during a validation run.

**Safe staging acceptance procedure:** use a separate Vercel staging project with no production domain, customer traffic, or production environment variables. Configure that isolated project's Production target with the same required blocking check and dispatch integration; temporarily point a dedicated test workflow/repository secret set to that staging project's token/project/check IDs. Deploy a commit already merged to `main` so the workflow can match the exact merged SHA and successful PR CI evidence. First dispatch a valid event and observe the staging deployment stay unpromoted while the check is pending, then pass and confirm the staging Production alias/promotion becomes Ready only after the Vercel check is `succeeded`. Repeat with a missing SHA, mismatched SHA, absent/failed CI evidence, and a deliberately unavailable check update; each must end failed or pending and leave the staging deployment unpromoted. Capture deployment ID/SHA, dispatch payload with secrets redacted, CI run URL/step outcomes, check-run ID/result, alias/promotion state, and timestamps. Never use a real customer signup or Production project for these tests. Restore dedicated staging configuration after testing and verify the actual production project's check/dispatch/secrets were not altered.

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
