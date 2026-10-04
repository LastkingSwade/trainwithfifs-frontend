'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');

function parseJobs(yaml) {
  const lines = yaml.split(/\r?\n/);
  const jobs = {};
  let inJobs = false;
  let current = null;
  for (const line of lines) {
    if (/^jobs:\s*$/.test(line)) { inJobs = true; continue; }
    if (inJobs && /^\S/.test(line)) break;
    const job = line.match(/^  ([A-Za-z0-9_-]+):\s*$/);
    if (inJobs && job) { current = job[1]; jobs[current] = []; continue; }
    if (current) jobs[current].push(line);
  }
  return Object.fromEntries(Object.entries(jobs).map(([id, block]) => [id, block.join('\n')]));
}
function validateWorkflow(yaml) {
  const jobs = parseJobs(yaml);
  if (!jobs['verify-deployment']) return { passed: false, errors: ['Missing verify-deployment job.'] };
  const promotionJobs = Object.entries(jobs).filter(([id]) => /promot|production/i.test(id));
  const errors = [];
  for (const [id, block] of promotionJobs) {
    const needs = block.match(/^    needs:\s*(.+)$/m);
    const ifExpr = block.match(/^    if:\s*(.+)$/m);
    if (!needs || !needs[1].includes('verify-deployment')) errors.push(`Production promotion job "${id}" must declare needs: verify-deployment.`);
    if (ifExpr && /always\(\)|failure\(\)|cancelled\(\)/.test(ifExpr[1])) errors.push(`Production promotion job "${id}" must not override failed dependency gating with ${ifExpr[1]}.`);
  }
  return { passed: errors.length === 0, errors, jobs, promotionJobs: promotionJobs.map(([id]) => id) };
}
const workflowPath = '.github/workflows/production-deployment-verification.yml';
const yaml = fs.readFileSync(workflowPath, 'utf8');
const real = validateWorkflow(yaml);
assert.equal(real.passed, true, real.errors.join('\n'));
assert.ok(real.jobs['verify-deployment'].includes('needs: gate-tests'), 'verification cannot run before gate tests pass');
assert.equal(real.promotionJobs.length, 0, 'this workflow must not add a Production promotion job');
const unsafe = yaml.replace('  verify-deployment:\n', '  promote-production:\n    runs-on: ubuntu-latest\n    steps: []\n\n  verify-deployment:\n');
const unsafeResult = validateWorkflow(unsafe);
assert.equal(unsafeResult.passed, false, 'an ungated Production promotion job must be rejected');
assert.ok(unsafeResult.errors.some(message => message.includes('needs: verify-deployment')), 'failure must explain required dependency');
const safe = yaml.replace('  verify-deployment:\n', '  promote-production:\n    needs: verify-deployment\n    runs-on: ubuntu-latest\n    steps: []\n\n  verify-deployment:\n');
assert.equal(validateWorkflow(safe).passed, true, 'a promotion job dependent on successful verification may pass the structural gate');
console.log('Workflow dependency tests passed: no promotion job added; unsafe promotion rejected; needs: verify-deployment accepted.');
module.exports = { validateWorkflow };
