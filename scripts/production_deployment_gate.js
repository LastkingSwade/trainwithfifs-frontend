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

function appendSummary(lines) {
  const path = process.env.GITHUB_STEP_SUMMARY;
  if (path) fs.appendFileSync(path, `${lines.join('\n')}\n`);
}

async function main() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !fs.existsSync(eventPath)) throw new Error('GitHub event payload is unavailable; cannot verify deployment identity.');
  const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
  const payload = event.client_payload || {};
  const deploymentId = payload.id;
  const token = process.env.VERCEL_TOKEN;
  const checkId = process.env.VERCEL_CHECK_ID;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;
  if (!token || !checkId || !projectId) throw new Error('Missing VERCEL_TOKEN, VERCEL_CHECK_ID, or VERCEL_PROJECT_ID GitHub Actions secret; no check result was claimed.');
  if (typeof deploymentId !== 'string' || !deploymentId.trim()) {
    appendSummary(['## FIFS Production Deployment Check: BLOCKED', '', 'FAIL: event deployment ID is missing. A deployment-specific check cannot be attached; the required Vercel check must remain pending/blocking.', 'Action: inspect the Vercel dispatch payload and resend with client_payload.id.']);
    throw new Error('Missing client_payload.id; cannot attach a check run to a deployment.');
  }

  const query = new URLSearchParams({ projectId });
  if (teamId) query.set('teamId', teamId);
  const base = `https://api.vercel.com/v2/deployments/${encodeURIComponent(deploymentId)}/check-runs`;
  const created = responseObject(await requestJson(`${base}?${query}`, { method: 'POST', token, body: { checkId } }));
  const checkRunId = created && created.id;
  if (!checkRunId || created.deploymentId !== deploymentId || created.checkId !== checkId) {
    appendSummary(['## FIFS Production Deployment Check: BLOCKED', '', `FAIL: Vercel did not confirm a check run attached to deployment ${deploymentId} with configured check ${checkId}.`, 'Action: inspect the Vercel create-check response and project/check configuration; leave promotion blocked.']);
    throw new Error('Vercel create-check response did not confirm the expected check-run, deployment, and check IDs.');
  }

  const runUrl = `https://api.vercel.com/v2/deployments/${encodeURIComponent(deploymentId)}/check-runs/${encodeURIComponent(checkRunId)}?${query}`;
  const repo = process.env.GITHUB_REPOSITORY || '';
  const runLink = repo && process.env.GITHUB_RUN_ID ? `https://github.com/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}` : '';
  const outputUrl = runLink || 'https://github.com';
  const update = async (conclusion, errors) => {
    const summary = errors.length ? errors.join('\n') : 'Exact deployment ID, full commit SHA, Production environment, project, and READY state verified.';
    const result = responseObject(await requestJson(runUrl, {
      method: 'PATCH', token,
      body: {
        status: 'completed', conclusion,
        completedAt: Date.now(),
        conclusionText: summary.slice(0, 500),
        externalId: process.env.GITHUB_RUN_ID || checkRunId,
        externalUrl: outputUrl,
        output: { title: conclusion === 'succeeded' ? 'FIFS deployment identity verified' : 'FIFS deployment verification blocked', summary: summary.slice(0, 5000) },
      },
    }));
    if (!result || result.id !== checkRunId || result.deploymentId !== deploymentId || result.checkId !== checkId || result.status !== 'completed' || result.conclusion !== conclusion) {
      throw new Error('Vercel did not confirm the exact completed check-run ID, deployment ID, check ID, status, and conclusion. Treat the check as pending/blocked.');
    }
  };

  try {
    const deployment = await requestJson(`https://api.vercel.com/v13/deployments/${encodeURIComponent(deploymentId)}?${query}`, { token });
    const result = evaluateDeployment({ event, deployment, expectedDeploymentId: deploymentId });
    const lines = [
      `## FIFS Production Deployment Check: ${result.passed ? 'PASS' : 'BLOCKED'}`,
      '',
      `- Deployment ID: \`${deploymentId}\``,
      `- Commit SHA: \`${payload.git && payload.git.sha || 'missing'}\``,
      `- Environment: \`${payload.environment || 'missing'}\``,
      `- Vercel check ID/run ID: \`${checkId}\` / \`${checkRunId}\``,
      ...(runLink ? [`- GitHub Actions run: ${runLink}`] : []),
      '',
      '| Evidence | Expected | Actual | Result |',
      '|---|---|---|---|',
      ...result.evidence.map(item => `| ${item.field} | ${String(item.expected ?? '—')} | ${String(item.actual ?? 'missing')} | ${item.result} |`),
      '',
      ...(result.errors.length ? ['### Required action', ...result.errors.map(error => `- ${error}`)] : ['Exact deployment identity and Production target verified.']),
    ];
    if (result.passed) {
      await update('succeeded', []);
      appendSummary(lines);
      console.log(`Deployment ${deploymentId} verified; Vercel check ${checkRunId} completed as succeeded.`);
      return;
    }
    await update('failed', result.errors);
    appendSummary(lines);
    throw new Error(result.errors.join(' '));
  } catch (error) {
    if (error && error.message && !error.message.startsWith('Deployment ')) {
      appendSummary([
        '## FIFS Production Deployment Check: BLOCKED', '',
        `- Deployment ID: \`${deploymentId}\``,
        `- Vercel check ID/run ID: \`${checkId}\` / \`${checkRunId}\``,
        '- Result: verification or Vercel result confirmation failed; do not promote.',
        `- Action: ${String(error.message).replace(/[\r\n]/g, ' ').slice(0, 800)}`,
      ]);
    }
    throw error;
  }
}

module.exports = { evaluateDeployment };
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
