'use strict';
const assert = require('node:assert/strict');
const { REQUIRED_CI_STEPS, validateEvidence, isCheckUpdateConfirmed } = require('./release_gate_validation');

const eventSha = 'a'.repeat(40);
const prHead = 'b'.repeat(40);
const deployment = { id: 'dpl_test', gitSource: { sha: eventSha }, target: 'production', readyState: 'READY', projectId: 'prj_test' };
const ciRun = { id: 42, status: 'completed', conclusion: 'success', head_sha: prHead };
const ciJobs = { jobs: [{ steps: REQUIRED_CI_STEPS.map((name) => ({ name, conclusion: 'success' })) }] };
const base = { eventSha, deployment, ciRun, ciJobs, expectedProjectId: 'prj_test', expectedPrHeadSha: prHead };
function test(name, fn) { fn(); console.log(`✓ ${name}`); }

test('accepts exact deployment and complete required CI evidence', () => assert.equal(validateEvidence(base), null));
test('rejects missing dispatch or deployment SHA', () => {
  assert.match(validateEvidence({ ...base, eventSha: '' }), /SHA is missing/);
  assert.match(validateEvidence({ ...base, deployment: { ...deployment, gitSource: {} } }), /deployment SHA is missing/);
});
test('rejects absent CI run', () => assert.match(validateEvidence({ ...base, ciRun: null }), /CI run is missing/));
test('rejects CI run with mismatched SHA', () => assert.match(validateEvidence({ ...base, ciRun: { ...ciRun, head_sha: 'c'.repeat(40) } }), /does not match/));
test('rejects missing or unsuccessful required CI evidence', () => {
  const incomplete = { jobs: [{ steps: ciJobs.jobs[0].steps.filter((step) => step.name !== 'Run registration E2E') }] };
  assert.match(validateEvidence({ ...base, ciJobs: incomplete }), /Run registration E2E/);
  const failed = { jobs: [{ steps: ciJobs.jobs[0].steps.map((step) => step.name === 'Run registration E2E' ? { ...step, conclusion: 'failure' } : step) }] };
  assert.match(validateEvidence({ ...base, ciJobs: failed }), /Run registration E2E/);
});
test('confirms only the exact completed Vercel check update', () => {
  const expected = { checkRunId: 'cr_1', deploymentId: 'dpl_test', checkId: 'check_1', conclusion: 'succeeded' };
  assert.equal(isCheckUpdateConfirmed({ id: 'cr_1', deploymentId: 'dpl_test', checkId: 'check_1', status: 'completed', conclusion: 'succeeded' }, expected), true);
  assert.equal(isCheckUpdateConfirmed(null, expected), false);
  assert.equal(isCheckUpdateConfirmed({ id: 'cr_1', deploymentId: 'dpl_test', checkId: 'check_1', status: 'running', conclusion: 'succeeded' }, expected), false);
  assert.equal(isCheckUpdateConfirmed({ id: 'other', deploymentId: 'dpl_test', checkId: 'check_1', status: 'completed', conclusion: 'succeeded' }, expected), false);
});
console.log('All release-gate tests passed.');
