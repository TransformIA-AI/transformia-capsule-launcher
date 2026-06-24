import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  ActivationRunnerWriteBlockedError,
  V1_ACTIVATION_RUNNER_WRITABLE_FILES,
  buildActivationEvidencePack,
  buildActivationRunnerWritableFiles,
  buildConsoleHandoffSummary,
  buildDefaultV1ActivationPack,
  buildDryRunActivationPlan,
  buildLocalWorkspaceSkeleton,
  computeActivationPackFingerprint,
  runActivationDoctor,
  validateV1ActivationPack,
  writeActivationRunnerEvidencePack
} from '../v1-activation-runner.mjs';
import { capsuleV1ActivationPackFixture } from '../fixtures/capsule-v1-activation-pack.fixture.mjs';

function tempOutputDir() {
  return mkdtempSync(join(tmpdir(), 'transformia-v1-activation-'));
}

function cleanup(path) {
  rmSync(path, { recursive: true, force: true });
}

test('valid activation pack passes public-safe validation', () => {
  const report = validateV1ActivationPack(capsuleV1ActivationPackFixture);
  assert.equal(report.ok, true);
  assert.equal(report.status, 'valid_public_safe_activation_pack');
  assert.ok(report.checkedInvariants.includes('runtime_authority_required'));
  assert.ok(report.checkedInvariants.includes('dry_run_is_not_permission'));
});

test('unsafe refs fail validation', () => {
  const pack = buildDefaultV1ActivationPack({ workspaceRef: 'https://unsafe.example/workspace' });
  const report = validateV1ActivationPack(pack);
  assert.equal(report.ok, false);
  assert.ok(report.blockers.includes('invalid_safe_ref:workspaceRef'));
  assert.ok(report.blockers.includes('blocked_live_endpoint:root.workspaceRef'));
});

test('secret-like values fail validation without preserving raw material in writer errors', () => {
  const pack = buildDefaultV1ActivationPack({ operatorNote: 'api' + '_key=abc12345678' });
  const report = validateV1ActivationPack(pack);
  assert.equal(report.ok, false);
  assert.ok(report.blockers.includes('blocked_secret_like_value:root.operatorNote'));
  assert.throws(() => buildActivationRunnerWritableFiles(pack), (error) => {
    assert.ok(error instanceof ActivationRunnerWriteBlockedError);
    assert.doesNotMatch(error.message, /abc12345678/);
    return true;
  });
});

test('missing no-live boundary fails validation', () => {
  const pack = buildDefaultV1ActivationPack({ boundaries: { noLiveExecution: false } });
  const report = validateV1ActivationPack(pack);
  assert.equal(report.ok, false);
  assert.ok(report.blockers.includes('missing_boundary:noLiveExecution'));
});

test('dry-run plan is generated with public-safe no-live steps', () => {
  const plan = buildDryRunActivationPlan(capsuleV1ActivationPackFixture);
  assert.equal(plan.status, 'dry_run_ready_no_live_execution');
  assert.equal(plan.noLiveExecution, true);
  assert.ok(plan.steps.length >= 6);
  for (const step of plan.steps) {
    assert.equal(step.publicSafe, true);
    assert.equal(step.noLiveExecution, true);
    assert.equal(typeof step.stepId, 'string');
    assert.ok(Array.isArray(step.reasonCodes));
    assert.equal(typeof step.evidenceExpected, 'string');
  }
  assert.ok(plan.steps.some((step) => step.status === 'requires_provider_commissioning'));
});

test('evidence pack is generated and cannot claim live execution', () => {
  const doctorReport = runActivationDoctor({ root: process.cwd(), activationPack: capsuleV1ActivationPackFixture });
  const evidencePack = buildActivationEvidencePack(capsuleV1ActivationPackFixture, { doctorReport });
  const serialized = JSON.stringify(evidencePack);
  assert.equal(evidencePack.publicSafe, true);
  assert.equal(evidencePack.boundaryStatus.noProviderWasCalled, true);
  assert.equal(evidencePack.boundaryStatus.noPaymentWasCaptured, true);
  assert.equal(evidencePack.boundaryStatus.runtimeRemainsAuthority, true);
  assert.ok(evidencePack.explicitBoundaries.includes('dry_run_is_not_permission'));
  assert.doesNotMatch(serialized, /"liveExecutionEnabled"\s*:\s*true/i);
  assert.doesNotMatch(serialized, /"bookingCreated"\s*:\s*true/i);
  assert.doesNotMatch(serialized, /"paymentCaptured"\s*:\s*true/i);
  assert.equal(evidencePack.activationPackFingerprint, computeActivationPackFingerprint(capsuleV1ActivationPackFixture));
});

test('doctor reports safe status for fixture and required repo structure', () => {
  const report = runActivationDoctor({ root: process.cwd(), activationPack: capsuleV1ActivationPackFixture });
  assert.equal(report.status, 'passed');
  assert.ok(report.checks.some((check) => check.checkId === 'required_scripts_registered' && check.status === 'passed'));
  assert.ok(report.checks.some((check) => check.checkId === 'no_runtime_execution_enabled' && check.status === 'passed'));
});

test('console handoff output is public-safe and keeps commissioning required', () => {
  const handoff = buildConsoleHandoffSummary(capsuleV1ActivationPackFixture);
  assert.equal(handoff.publicSafe, true);
  assert.equal(handoff.evidencePackReady, true);
  assert.equal(handoff.runtimeCommissioningRequired, true);
  assert.equal(handoff.providerCommissioningRequired, true);
  assert.equal(handoff.boundaries.noOutboundMessageWasSent, true);
});

test('workspace skeleton and evidence writer emit deterministic public files', () => {
  const skeleton = buildLocalWorkspaceSkeleton(capsuleV1ActivationPackFixture);
  assert.equal(skeleton.status, 'workspace_skeleton_prepared');
  assert.ok(skeleton.files.every((file) => file.publicSafe === true && file.containsSecrets === false));

  const out = tempOutputDir();
  try {
    const written = writeActivationRunnerEvidencePack(capsuleV1ActivationPackFixture, out, { root: process.cwd() });
    assert.equal(written.length, V1_ACTIVATION_RUNNER_WRITABLE_FILES.length);
    assert.deepEqual(readdirSync(out).sort(), [
      'README_ACTIVATION_RUNNER.md',
      'activation-evidence-pack.public.json',
      'activation-pack.public.json',
      'console-handoff-summary.public.json',
      'doctor-report.public.json',
      'dry-run-plan.public.json',
      'local-workspace-skeleton.public.json',
      'workspace'
    ].sort());
    const evidence = JSON.parse(readFileSync(join(out, 'activation-evidence-pack.public.json'), 'utf8'));
    assert.equal(evidence.publicSafe, true);
    assert.equal(evidence.launcherStatusSummary.evidencePackReady, true);
  } finally {
    cleanup(out);
  }
});
