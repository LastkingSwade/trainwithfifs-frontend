# Vercel release gate: operator setup and acceptance

## Operator setup checklist

- [ ] In the correct Vercel project, create a custom Deployment Check named **FIFS release verification**; set it to require `build-ready` and block `deployment-promotion`. Keep the check ID.
- [ ] Configure the Vercel-to-GitHub repository dispatch integration for `vercel.deployment.ready` and Production deployments. Confirm the payload provides deployment `id`, `environment`, and `git.sha`.
- [ ] In GitHub Actions secrets, configure `VERCEL_TOKEN`, `VERCEL_CHECK_ID`, and `VERCEL_PROJECT_ID`; configure `VERCEL_TEAM_ID` if required by the account. Grant the token only the project/check access needed. Never commit credentials.
- [ ] Add `.github/workflows/production-deployment-verification.yml` and merge it only after PR checks pass. Confirm the workflow can receive the Vercel dispatch.
- [ ] Test on a non-production or otherwise approved safe test deployment. Verify Vercel holds Production alias/promotion while the required check is pending or failed, and promotes only after success.
- [ ] Record deployment ID/SHA/environment, PR number/head SHA, Actions run ID/URL, required step results, Vercel check run ID/result, promotion outcome, and timestamps. Redact tokens and personal data.

## End-to-end acceptance criteria

1. **Known-good case:** Use an approved test deployment tied to a merged PR. Dispatch contains the correct deployment ID/SHA and Production environment; the Vercel deployment record matches its ID, Production target, project ID, and SHA; the deployment SHA is the exact merged `main` PR commit; successful CI for that PR's unchanged head includes every required step below. The workflow completes the Vercel check as `succeeded`, and promotion occurs only after it passes.
2. **Pending hold:** Leave the required check pending. Expected: no Production promotion/alias; deployment remains held until the check is completed.
3. **Missing metadata:** Remove deployment ID or SHA from a test dispatch. Expected: workflow fails, no success result; when a deployment ID exists, report failure on that deployment. With no ID, record the workflow failure because attachment is impossible; the required Vercel check remains pending and blocks promotion.
4. **SHA/project/environment mismatch:** Test dispatch SHA differing from the Vercel deployment SHA, incorrect project, non-Production target, and a SHA not equal to a merged PR commit on `main`. Expected: deployment-specific check fails, no promotion, and no fallback to another or latest deployment.
5. **Missing/failed/stale CI:** Test no matching run, queued run exceeding the bounded wait, failed latest run, missing required step, Node 22 guard failure, and PR head changed after CI. Expected: check fails; no stale or partial evidence is accepted.
6. **Unavailable update:** Simulate transient and persistent Vercel API update failures. Expected: bounded retries; workflow fails visibly and does not claim Vercel recorded a result. If the check remains pending, Production stays blocked; operator investigates rather than bypassing.
7. **Failure evidence:** For every case, save Actions run link/log excerpt, deployment ID/SHA, check-run ID and confirmed Vercel result or explicit update failure, and observed promotion state. Never record secrets.

## Required CI evidence (E2E explicitly excluded for now)

Require a completed successful GitHub Actions `CI` run for the associated PR's exact, unchanged head SHA, with these named steps all successful:

- `Verify PR head is current`
- `Verify Node.js 22`
- `Install dependencies`
- `Run typecheck`
- `Run tests` (currently the security suite via `npm test`)
- `Run build`

Recheck the live PR head and the same successful Actions run immediately before accepting evidence. **Do not claim E2E evidence:** the current workflow has no dedicated E2E command. Add and pass that command in CI before making E2E a release requirement or reporting E2E as verified.

## Prioritized remaining milestones

1. **Implementation — deployment-bound check (in progress in this PR):** merge the workflow and this operator guide; create the Vercel blocking check definition; configure dispatch and secrets. Done when a production-target Vercel dispatch creates/updates a check run attached to that exact deployment and fails closed on missing/mismatched evidence.
2. **Verification — CI and workflow behavior:** pass PR CI for the exact PR head; validate known-good and failure cases above in an approved safe environment; verify pending/failed checks prevent promotion and success releases it. Done when captured evidence shows both blocking and successful promotion behavior. E2E remains explicitly excluded until a dedicated CI command exists and passes.
3. **Staging signup — separate blocked milestone:** confirm a non-production staging URL and Supabase project, allowed Auth redirect/callback settings, and a dedicated confirmation-capable test identity; supply its password only through the approved secret mechanism. Run the smoke test only against staging, then verify the persisted client row's `user_id` equals the authenticated Supabase Auth UID. Done when sanitized evidence records staging target/project and exact UID equality. **Never run this signup test in Production.**
