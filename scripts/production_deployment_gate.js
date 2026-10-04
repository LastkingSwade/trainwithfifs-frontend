'use strict';

const https = require('node:https');
const fs = require('node:fs');

function evaluateDeployment({ event, deployment, expectedDeploymentId }) {
  const errors = [];
  const evidence = [];
  const payload = event && event.client_payload ? event.client_payload : {};
  const eventId = payload.id;
  const eventSha = payload.git && payload.git.sha;
  const eventEnvironment = payload.environment;
  const actualId = deployment && deployment.id;
  const actualProjectId = deployment && deployment.projectId;
  const actualTarget = deployment && deployment.target;
  const actualReadyState = deployment && deployment.readyState;
  const actualSha = deployment && deployment.gitSource && deployment.gitSource.sha
    || deployment && deployment.meta && (deployment.meta.githubCommitSha || deployment.meta.githubCommitSha1);

  function check(field, expected, actual, predicate, remediation) {
    const ok = predicate(expected, actual);
    evidence.push({ field, expected, actual: actual === undefined ? null : actual, result: ok ? 'PASS' : 'FAIL' });
    if (!ok) errors.push(`${field}: expected ${String(expected)}, received ${actual === undefined ? 'missing' : String(actual)}. ${remediation}`);
  }

  check('event deployment ID', expectedDeploymentId, eventId,
    (expected, actual) => typeof actual === 'string' && actual.length > 0 && actual === expected,
    'Use the deployment ID from this Vercel event; do not substitute a latest-deployment lookup.');
  check('deployment ID', eventId, actualId,
    (expected, actual) => typeof expected === 'string' && typeof actual === 'string' && expected === actual,
    'Retrieve the deployment by the event ID and confirm the returned deployment ID matches.');
  check('full commit SHA format', '40 hexadecimal characters', eventSha,
    (_expected, actual) => typeof actual === 'string' && /^[0-9a-f]{40}$/i.test(actual),
    'Provide the complete 40-character Git commit SHA in client_payload.git.sha.');
  check('deployment commit SHA', eventSha, actualSha,
    (expected, actual) => typeof expected === 'string' && /^[0-9a-f]{40}$/i.test(expected)
      && typeof actual === 'string' && /^[0-9a-f]{40}$/i.test(actual)
      && expected.toLowerCase() === actual.toLowerCase(),
    'Use a deployment whose Vercel Git SHA exactly matches the event SHA.');
  check('event environment', 'production', eventEnvironment,
    (_expected, actual) => actual === 'production',
    'Dispatch this workflow only for the Production deployment target.');
  check('deployment target', eventEnvironment, actualTarget,
    (expected, actual) => expected === 'production' && actual === 'production',
    'Confirm the Vercel deployment API reports target=production; Preview/staging deployments cannot pass this Production gate.');
  check('deployment ready state', 'READY', actualReadyState,
    (_expected, actual) => typeof actual === 'string' && actual.toUpperCase() === 'READY',
    'Wait for the exact Vercel deployment to reach READY, then process its event again.');
  check('Vercel project ID', process.env.VERCEL_PROJECT_ID, actualProjectId,
    (expected, actual) => typeof expected === 'string' && expected.length > 0 && typeof actual === 'string' && actual === expected,
    'Check VERCEL_PROJECT_ID and confirm the dispatch subscription points to the intended Vercel project.');
  return { passed: errors.length === 0, errors, evidence };
}

function evaluateRequiredCheck({ checks, checkId }) {
  const errors = [];
  const evidence = [];
  const configured = Array.isArray(checks) ? checks.find(check => check && check.id === checkId) : undefined;
  const blocks = configured && configured.blocks;
  const targets = configured && configured.targets;
  const blocking = blocks === 'deployment-promotion';
  const production = Array.isArray(targets) && targets.includes('production');
  evidence.push({ field: 'configured Vercel check', expected: checkId, actual: configured ? configured.id : null, result: configured ? 'PASS' : 'FAIL' });
  evidence.push({ field: 'blocking stage', expected: 'deployment-promotion', actual: blocks || null, result: blocking ? 'PASS' : 'FAIL' });
  evidence.push({ field: 'check target', expected: 'production', actual: Array.isArray(targets) ? targets.join(', ') : null, result: production ? 'PASS' : 'FAIL' });
  if (!configured) errors.push(`Vercel check ${checkId || '(missing VERCEL_CHECK_ID)'} is not configured for this project. In Vercel Project Settings → Deployment Checks, create/select the FIFS verification check, set target to Production and blocking stage to Deployment Promotion, then set VERCEL_CHECK_ID to that check's ID and rerun.`);
  else {
    if (!blocking) errors.push(`Vercel check ${checkId} is not blocking Deployment Promotion (blocks=${blocks || 'missing'}). Edit it in Vercel Project Settings → Deployment Checks, set the blocking stage to Deployment Promotion, then rerun.`);
    if (!production) errors.push(`Vercel check ${checkId} does not target Production. Edit it in Vercel Project Settings → Deployment Checks, enable the Production target, then rerun.`);
  }
  return { passed: errors.length === 0, errors, evidence };
}

function requestJson(url, { method = 'GET', token, body } = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const request = https.request(parsed, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
    }, response => {
      let data = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => {
        let json;
        try { json = data ? JSON.parse(data) : {}; }
        catch { return reject(new Error(`Vercel API returned non-JSON (HTTP ${response.statusCode}).`)); }
        if (response.statusCode < 200 || response.statusCode >= 300) {
          return reject(new Error(`Vercel API ${method} ${parsed.pathname} failed (HTTP ${response.statusCode}): ${JSON.stringify(json).slice(0, 600)}`));
        }
        resolve(json);
      });
    });
    request.setTimeout(15000, () => request.destroy(new Error('Vercel API request timed out after 15 seconds.')));
    request.on('error', reject);
    if (body) request.write(JSON.stringify(body));
    request.end();
  });
}

function responseObject(response) {
  return response && (response.checkRun || response.check_run || response.data || response);
}

function buildRunSummary({ githubRunLink, runId, deploymentId, sha, environment, result, checkRunId, evidence = [], failure = '' }) {
  return [
    `## FIFS Production Deployment Verification: ${result}`,
    '',
    `- Workflow run: ${githubRunLink || runId || 'unavailable'}`,
    `- Deployment ID: \`${deploymentId || 'missing'}\``,
    `- Full commit SHA: \`${sha || 'missing'}\``,
    `- Environment: \`${environment || 'missing'}\``,
    `- Verification result: **${result}**`,
    `- Vercel check run: \`${checkRunId || 'not-created'}\``,
    ...(evidence.length ? ['', '| Evidence | Expected | Actual | Result |', '|---|---|---|---|', ...evidence.map(item => `| ${item.field} | ${String(item.expected ?? '—')} | ${String(item.actual ?? 'missing')} | ${item.result} |`)] : []),
    ...(failure ? ['', `- Action required: ${failure}`] : []),
  ];
}

function appendSummary(lines) {
  const path = process.env.GITHUB_STEP_SUMMARY;
  if (path) fs.appendFileSync(path, `${lines.join('\n')}\n`);
}

async function main() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  let event = {};
  let payload = {};
  let deploymentId = 'missing';
  let sha = 'missing';
  let environment = 'missing';
  let resultLabel = 'BLOCKED';
  let failure = '';
  let evidence = [];
  let checkRunId = 'not-created';
  const repo = process.env.GITHUB_REPOSITORY || '';
  const githubRunLink = repo && process.env.GITHUB_RUN_ID ? `https://github.com/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}` : '';
  try {
    if (!eventPath || !fs.existsSync(eventPath)) throw new Error('GitHub event payload is unavailable; cannot verify deployment identity. Inspect repository_dispatch configuration and provide the event payload.');
    event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
    payload = event.client_payload || {};
    deploymentId = payload.id || 'missing';
    sha = payload.git && payload.git.sha || 'missing';
    environment = payload.environment || 'missing';
    const token = process.env.VERCEL_TOKEN;
    const checkId = process.env.VERCEL_CHECK_ID;
    const projectId = process.env.VERCEL_PROJECT_ID;
    const teamId = process.env.VERCEL_TEAM_ID;
    if (!token || !checkId || !projectId) throw new Error('Missing VERCEL_TOKEN, VERCEL_CHECK_ID, or VERCEL_PROJECT_ID GitHub Actions secret. Add the project-scoped values in repository Actions secrets; no Vercel check result was claimed.');
    if (typeof payload.id !== 'string' || !payload.id.trim()) throw new Error('Missing client_payload.id; configure the Vercel dispatch payload with this deployment ID. A deployment-specific check cannot be attached.');

    const query = new URLSearchParams({ projectId });
    if (teamId) query.set('teamId', teamId);
    const checksQuery = new URLSearchParams();
    if (teamId) checksQuery.set('teamId', teamId);
    const checksUrl = `https://api.vercel.com/v2/projects/${encodeURIComponent(projectId)}/checks${checksQuery.size ? `?${checksQuery}` : ''}`;
    const checksResponse = await requestJson(checksUrl, { token });
    const configuredChecks = evaluateRequiredCheck({ checks: checksResponse.checks, checkId });
    evidence.push(...configuredChecks.evidence);
    if (!configuredChecks.passed) throw new Error(configuredChecks.errors.join(' '));

    const deployment = await requestJson(`https://api.vercel.com/v13/deployments/${encodeURIComponent(payload.id)}?${query}`, { token });
    const identity = evaluateDeployment({ event, deployment, expectedDeploymentId: payload.id });
    evidence.push(...identity.evidence);
    if (!identity.passed) throw new Error(identity.errors.join(' '));

    const base = `https://api.vercel.com/v2/deployments/${encodeURIComponent(payload.id)}/check-runs`;
    const created = responseObject(await requestJson(`${base}?${query}`, { method: 'POST', token, body: { checkId } }));
    checkRunId = created && created.id || 'missing';
    if (!created || !created.id || created.deploymentId !== payload.id || created.checkId !== checkId) throw new Error(`Vercel did not confirm a check run attached to deployment ${payload.id} with configured check ${checkId}. Inspect the create-check API response and project/check configuration; leave promotion blocked.`);

    const runUrl = `${base}/${encodeURIComponent(checkRunId)}?${query}`;
    const outputUrl = githubRunLink || 'https://github.com';
    const update = async (conclusion, errors) => {
      const text = errors.length ? errors.join('\n') : 'Exact deployment ID, full commit SHA, Production environment, project, and READY state verified.';
      const updated = responseObject(await requestJson(runUrl, {
        method: 'PATCH', token,
        body: {
          status: 'completed', conclusion, completedAt: Date.now(), conclusionText: text.slice(0, 500),
          externalId: process.env.GITHUB_RUN_ID || checkRunId, externalUrl: outputUrl,
          output: { title: conclusion === 'succeeded' ? 'FIFS deployment identity verified' : 'FIFS deployment verification blocked', summary: text.slice(0, 5000) },
        },
      }));
      if (!updated || updated.id !== checkRunId || updated.deploymentId !== payload.id || updated.checkId !== checkId || updated.status !== 'completed' || updated.conclusion !== conclusion) throw new Error('Vercel did not confirm the exact completed check-run IDs and conclusion. Treat the check as pending/blocked; do not promote.');
    };
    await update('succeeded', []);
    resultLabel = 'PASS';
  } catch (error) {
    failure = String(error && error.message || error).replace(/[\r\n]/g, ' ').slice(0, 1000);
    resultLabel = 'BLOCKED';
    throw error;
  } finally {
    appendSummary(buildRunSummary({
      githubRunLink, runId: process.env.GITHUB_RUN_ID, deploymentId, sha, environment,
      result: resultLabel, checkRunId, evidence, failure,
    }));
  }
}

module.exports = { evaluateDeployment, evaluateRequiredCheck, buildRunSummary };
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
