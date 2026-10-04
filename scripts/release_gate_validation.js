'use strict';

const REQUIRED_CI_STEPS = [
  'Verify PR head is current',
  'Verify Node.js 22',
  'Install dependencies',
  'Run typecheck',
  'Run tests',
  'Run registration E2E',
  'Run build'
];

function validateEvidence({ eventSha, deployment, ciRun, ciJobs, expectedProjectId, expectedPrHeadSha }) {
  if (!/^[0-9a-f]{40}$/i.test(eventSha || '')) return 'Deployment SHA is missing or malformed.';
  if (!deployment || !deployment.id) return 'Exact Vercel deployment record is missing.';
  const deploymentSha = deployment.gitSource?.sha || deployment.meta?.githubCommitSha || '';
  if (!deploymentSha) return 'Vercel deployment SHA is missing.';
  if (deploymentSha !== eventSha) return 'Dispatch SHA does not match the Vercel deployment SHA.';
  if (deployment.target !== 'production') return 'Deployment is not a Production target.';
  if ((deployment.readyState || deployment.state) !== 'READY') return 'Deployment is not READY.';
  if (deployment.projectId !== expectedProjectId) return 'Deployment belongs to a different Vercel project.';
  if (!ciRun || !ciRun.id) return 'Matching CI run is missing.';
  if (ciRun.status !== 'completed' || ciRun.conclusion !== 'success') return 'Matching CI run is not completed successfully.';
  if (ciRun.head_sha !== expectedPrHeadSha) return 'CI run SHA does not match the exact PR head SHA.';
  const passed = new Set((ciJobs?.jobs || []).flatMap((job) => (job.steps || [])
    .filter((step) => step.conclusion === 'success').map((step) => step.name)));
  const missing = REQUIRED_CI_STEPS.filter((step) => !passed.has(step));
  if (missing.length) return `Required CI evidence is absent or unsuccessful: ${missing.join(', ')}.`;
  return null;
}

function isCheckUpdateConfirmed(response, { checkRunId, deploymentId, checkId, conclusion }) {
  if (!response || typeof response !== 'object') return false;
  return response.id === checkRunId && response.deploymentId === deploymentId &&
    response.checkId === checkId && response.status === 'completed' &&
    response.conclusion === conclusion;
}

if (require.main === module) {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'check-response') {
    try {
      const [json, checkRunId, deploymentId, checkId, conclusion] = args;
      const confirmed = isCheckUpdateConfirmed(JSON.parse(json), { checkRunId, deploymentId, checkId, conclusion });
      if (!confirmed) {
        console.error('Vercel response did not confirm the exact completed check update.');
        process.exitCode = 1;
      }
    } catch (error) {
      console.error(`Vercel check response is unavailable or invalid: ${error.message}`);
      process.exitCode = 1;
    }
  } else {
    let input = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { input += chunk; });
    process.stdin.on('end', () => {
      try {
        const error = validateEvidence(JSON.parse(input));
        if (error) {
          console.error(`RELEASE_GATE_ERROR: ${error}`);
          process.exitCode = 1;
        }
      } catch (error) {
        console.error(`RELEASE_GATE_ERROR: Invalid evidence payload: ${error.message}`);
        process.exitCode = 1;
      }
    });
  }
}

module.exports = { REQUIRED_CI_STEPS, validateEvidence, isCheckUpdateConfirmed };
