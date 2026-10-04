'use strict';
const assert = require('node:assert/strict');
const { evaluateDeployment } = require('./production_deployment_gate');
process.env.VERCEL_PROJECT_ID = 'prj_test_123';
const sha = 'a'.repeat(40);
const goodEvent = { client_payload: { id: 'dpl_expected_123', environment: 'production', git: { sha } } };
const goodDeployment = { id: 'dpl_expected_123', projectId: 'prj_test_123', target: 'production', readyState: 'READY', gitSource: { sha } };

function expectBlocked(name, event, deployment, expectedId, field, expectedText) {
  const result = evaluateDeployment({ event, deployment, expectedDeploymentId: expectedId });
  assert.equal(result.passed, false, `${name} must block production promotion`);
  assert.ok(result.errors.some(message => message.includes(field)), `${name} must identify ${field} in actionable errors: ${result.errors.join('; ')}`);
  assert.ok(result.errors.some(message => message.toLowerCase().includes(expectedText.toLowerCase())), `${name} must provide a recovery action`);
  const evidence = result.evidence.find(row => row.field === field);
  assert.ok(evidence && evidence.result === 'FAIL', `${name} must record field-level failure evidence`);
}

const valid = evaluateDeployment({ event: goodEvent, deployment: goodDeployment, expectedDeploymentId: goodEvent.client_payload.id });
assert.equal(valid.passed, true, 'matching Production deployment must pass identity validation');
assert.ok(valid.evidence.every(row => row.result === 'PASS'), 'passing result must contain evidence for every checked field');

expectBlocked('mismatched event deployment ID',
  { client_payload: { ...goodEvent.client_payload, id: 'dpl_other_456' } }, goodDeployment,
  'dpl_expected_123', 'event deployment ID', 'Use the deployment ID');
expectBlocked('mismatched returned deployment ID', goodEvent,
  { ...goodDeployment, id: 'dpl_other_456' }, goodEvent.client_payload.id,
  'deployment ID', 'Retrieve the deployment by the event ID');
expectBlocked('mismatched commit SHA', goodEvent,
  { ...goodDeployment, gitSource: { sha: 'b'.repeat(40) } }, goodEvent.client_payload.id,
  'deployment commit SHA', 'exactly matches the event SHA');
expectBlocked('mismatched environment in event',
  { client_payload: { ...goodEvent.client_payload, environment: 'preview' } }, goodDeployment,
  goodEvent.client_payload.id, 'event environment', 'Production deployment target');
expectBlocked('mismatched actual deployment target', goodEvent,
  { ...goodDeployment, target: 'preview' }, goodEvent.client_payload.id,
  'deployment target', 'Preview/staging deployments cannot pass');
expectBlocked('missing or abbreviated SHA',
  { client_payload: { ...goodEvent.client_payload, git: { sha: sha.slice(0, 7) } } }, goodDeployment,
  goodEvent.client_payload.id, 'full commit SHA format', 'complete 40-character');
expectBlocked('deployment not ready', goodEvent,
  { ...goodDeployment, readyState: 'BUILDING' }, goodEvent.client_payload.id,
  'deployment ready state', 'reach READY');

console.log('Production deployment gate tests passed (8 assertions groups, including ID/SHA/environment mismatch fail-closed evidence).');
