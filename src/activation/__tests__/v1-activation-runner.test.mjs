import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  ActivationRunnerWriteBlockedError,
  V1_ACTIVATION_RUNNER_WRITABLE_FILES,
  assertPublicSafeOutput,
  buildActivationEvidencePack,
  buildActivationRunnerWritableFiles,
  buildCanonicalPublicV1ActivationPack,
  buildConsoleHandoffSummary,
  buildDefaultV1ActivationPack,
  buildDryRunActivationPlan,
  buildLocalWorkspaceSkeleton,
  collectUnsafePublicMaterial,
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

function escapedPattern(value) {
  return new RegExp(String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}

function assertNoRawMaterial(outputs, rawValues) {
  for (const output of outputs) {
    const text = typeof output === 'string' ? output : JSON.stringify(output);
    for (const raw of rawValues) assert.doesNotMatch(text, escapedPattern(raw));
  }
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

test('activation pack validation scans object keys without echoing unsafe key material', () => {
  const rawEmail = ['customer', 'example.invalid'].join('@');
  const rawUrl = 'https://unsafe.example';
  const rawTokenKey = `${'gh' + 'p_'}aaaaaaaaaaaaaaaaaaaaaaaa`;
  const sensitiveKey = ['api', '_', 'key'].join('');
  const cases = [
    {
      pack: buildDefaultV1ActivationPack({ review: { [`[${rawEmail}](mailto:${rawEmail})`]: 'ok' } }),
      blocker: 'blocked_unsafe_key_name:root.review.<unsafe_key>',
      rawValues: [rawEmail]
    },
    {
      pack: buildDefaultV1ActivationPack({ review: { [rawUrl]: 'ok' } }),
      blocker: 'blocked_unsafe_key_name:root.review.<unsafe_key>',
      rawValues: [rawUrl]
    },
    {
      pack: buildDefaultV1ActivationPack({ review: { [sensitiveKey]: 'ok' } }),
      blocker: 'blocked_sensitive_key_name:root.review.<unsafe_key>',
      rawValues: [sensitiveKey]
    },
    {
      pack: buildDefaultV1ActivationPack({ review: { [rawTokenKey]: 'ok' } }),
      blocker: 'blocked_unsafe_key_name:root.review.<unsafe_key>',
      rawValues: [rawTokenKey]
    }
  ];

  for (const { pack, blocker, rawValues } of cases) {
    const report = validateV1ActivationPack(pack);
    const doctorReport = runActivationDoctor({ root: process.cwd(), activationPack: pack });
    const dryRunPlan = buildDryRunActivationPlan(pack);
    const workspaceSkeleton = buildLocalWorkspaceSkeleton(pack);
    const evidencePack = buildActivationEvidencePack(pack, { doctorReport, dryRunPlan, localWorkspaceSkeleton: workspaceSkeleton });
    const consoleHandoff = buildConsoleHandoffSummary(pack);

    assert.equal(report.ok, false);
    assert.ok(report.blockers.includes(blocker));
    assert.throws(() => buildActivationRunnerWritableFiles(pack), ActivationRunnerWriteBlockedError);
    assertNoRawMaterial([report, doctorReport, dryRunPlan, workspaceSkeleton, evidencePack, consoleHandoff], rawValues);
  }
});

test('unknown activation pack fields fail closed and never reach canonical public output', () => {
  const pack = buildDefaultV1ActivationPack({ extraOperatorPayload: 'ok' });
  const report = validateV1ActivationPack(pack);
  assert.equal(report.ok, false);
  assert.ok(report.blockers.includes('unknown_activation_pack_field:root.extraOperatorPayload'));
  assert.throws(() => buildCanonicalPublicV1ActivationPack(pack), ActivationRunnerWriteBlockedError);
  assert.throws(() => buildActivationRunnerWritableFiles(pack), ActivationRunnerWriteBlockedError);
});

test('sensitive activation pack key names fail at any nesting level without leaking values', () => {
  const rawValue = 'plain-value-should-not-leak';
  const keyCases = [
    ['api', 'Key'],
    ['api', '_', 'key'],
    ['API', 'KEY'],
    ['access', 'Token'],
    ['access', '_', 'token'],
    ['refresh', 'Token'],
    ['auth', '_', 'token'],
    ['bearer', 'Token'],
    ['pass', 'word'],
    ['pass'],
    ['sec', 'ret'],
    ['client', 'Secret'],
    ['client', '_', 'secret'],
    ['private', 'Key'],
    ['private', '_', 'key'],
    ['creden', 'tial'],
    ['creden', 'tials'],
    ['provider', 'Credential'],
    ['provider', '_', 'credentials'],
    ['stri', 'pe', 'Secret'],
    ['webhook', '_', 'secret'],
    ['oauth', 'Client', 'Secret'],
    ['oauth', '_', 'client', '_', 'secret'],
    ['session', 'Token'],
    ['session', '_', 'token']
  ].map((parts) => parts.join(''));

  for (const keyName of keyCases) {
    const pack = buildDefaultV1ActivationPack({
      nestedReviewSurface: [{ [keyName]: rawValue }]
    });
    const report = validateV1ActivationPack(pack);
    const expectedBlocker = 'blocked_sensitive_key_name:root.nestedReviewSurface.0.<unsafe_key>';
    assert.equal(report.ok, false, keyName);
    assert.ok(report.blockers.includes(expectedBlocker), keyName);
    assert.throws(() => buildActivationRunnerWritableFiles(pack), (error) => {
      assert.ok(error instanceof ActivationRunnerWriteBlockedError);
      assert.match(error.message, new RegExp(expectedBlocker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      assert.doesNotMatch(error.message, new RegExp(rawValue));
      assert.doesNotMatch(error.message, new RegExp(keyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      return true;
    });
  }
});

test('sensitive activation pack key names fail at root, nested object, and array levels', () => {
  const rawValue = 'token-like-value-should-not-leak';
  const keyCases = [
    ['api', 'Key'],
    ['access', 'Token'],
    ['pass', 'word'],
    ['client', 'Secret'],
    ['private', 'Key'],
    ['creden', 'tial']
  ].map((parts) => parts.join(''));

  for (const keyName of keyCases) {
    const fixtures = [
      {
        pack: buildDefaultV1ActivationPack({ [keyName]: rawValue }),
        blocker: 'blocked_sensitive_key_name:root.<unsafe_key>'
      },
      {
        pack: buildDefaultV1ActivationPack({ sensitiveReview: { [keyName]: rawValue } }),
        blocker: 'blocked_sensitive_key_name:root.sensitiveReview.<unsafe_key>'
      },
      {
        pack: buildDefaultV1ActivationPack({ sensitiveReview: [{ [keyName]: rawValue }] }),
        blocker: 'blocked_sensitive_key_name:root.sensitiveReview.0.<unsafe_key>'
      }
    ];

    for (const { pack, blocker } of fixtures) {
      const report = validateV1ActivationPack(pack);
      const doctorReport = runActivationDoctor({ root: process.cwd(), activationPack: pack });
      const dryRunPlan = buildDryRunActivationPlan(pack);
      const workspaceSkeleton = buildLocalWorkspaceSkeleton(pack);
      const evidencePack = buildActivationEvidencePack(pack, { doctorReport, dryRunPlan, localWorkspaceSkeleton: workspaceSkeleton });
      const consoleHandoff = buildConsoleHandoffSummary(pack);

      assert.equal(report.ok, false, blocker);
      assert.ok(report.blockers.includes(blocker), blocker);
      assert.throws(() => buildActivationRunnerWritableFiles(pack), ActivationRunnerWriteBlockedError);
      for (const output of [doctorReport, dryRunPlan, workspaceSkeleton, evidencePack, consoleHandoff]) {
        assert.doesNotMatch(JSON.stringify(output), new RegExp(rawValue));
        assert.doesNotMatch(JSON.stringify(output), new RegExp(keyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      }
    }
  }
});

test('unsafe activation refs do not leak through public output ids', () => {
  const rawUnsafeRef = 'https://unsafe.example/activation/raw-id';
  const pack = buildDefaultV1ActivationPack({
    activationPackId: rawUnsafeRef,
    workspaceRef: rawUnsafeRef,
    tenantDraftId: rawUnsafeRef,
    organizationRef: rawUnsafeRef
  });
  const doctorReport = runActivationDoctor({ root: process.cwd(), activationPack: pack });
  const dryRunPlan = buildDryRunActivationPlan(pack);
  const workspaceSkeleton = buildLocalWorkspaceSkeleton(pack);
  const evidencePack = buildActivationEvidencePack(pack, { doctorReport, dryRunPlan, localWorkspaceSkeleton: workspaceSkeleton });
  const consoleHandoff = buildConsoleHandoffSummary(pack);

  assert.equal(doctorReport.doctorReportId, 'doctor_report_invalid_activation_pack');
  assert.equal(dryRunPlan.dryRunPlanId, 'dry_run_plan_invalid_activation_pack');
  assert.equal(dryRunPlan.activationPackId, 'invalid_activation_pack');
  assert.equal(workspaceSkeleton.localWorkspaceId, 'local_workspace_invalid_workspace');
  assert.equal(workspaceSkeleton.activationPackId, 'invalid_activation_pack');
  assert.equal(evidencePack.activationEvidencePackId, 'activation_evidence_pack_invalid_activation_pack');
  assert.equal(evidencePack.activationPackId, 'invalid_activation_pack');
  assert.equal(evidencePack.deterministicActionDossier.dadRef, 'dad_invalid_activation_pack');
  assert.equal(consoleHandoff.lastDryRunSummary.dryRunPlanId, 'dry_run_plan_invalid_activation_pack');

  for (const output of [doctorReport, dryRunPlan, workspaceSkeleton, evidencePack, consoleHandoff]) {
    assert.doesNotMatch(JSON.stringify(output), new RegExp(rawUnsafeRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('public skeleton, evidence, and handoff do not echo hostile boundary payloads', () => {
  const rawUrl = 'https://unsafe.example/boundary-support';
  const rawValue = 'abc12345678';
  const rawEmail = ['person', 'example.invalid'].join('@');
  const sensitiveKey = ['api', '_', 'key'].join('');
  const pack = buildDefaultV1ActivationPack({
    boundaries: {
      supportUrl: rawUrl,
      [sensitiveKey]: rawValue,
      customerEmail: `[${rawEmail}](mailto:${rawEmail})`
    }
  });
  const doctorReport = runActivationDoctor({ root: process.cwd(), activationPack: pack });
  const dryRunPlan = buildDryRunActivationPlan(pack);
  const workspaceSkeleton = buildLocalWorkspaceSkeleton(pack);
  const evidencePack = buildActivationEvidencePack(pack, { doctorReport, dryRunPlan, localWorkspaceSkeleton: workspaceSkeleton });
  const consoleHandoff = buildConsoleHandoffSummary(pack);
  const canonicalBoundaryKeys = [
    'noLiveExecution',
    'noProviderConnection',
    'noSecrets',
    'noPaymentCapture',
    'noOutboundMessaging',
    'noCalendarBooking',
    'noProvisioning',
    'runtimeAuthorityRequired',
    'dryRunIsNotPermission',
    'publicSafe'
  ];

  assert.equal(validateV1ActivationPack(pack).ok, false);
  assert.deepEqual(Object.keys(workspaceSkeleton.boundaries), canonicalBoundaryKeys);
  assert.ok(Object.values(workspaceSkeleton.boundaries).every((value) => typeof value === 'boolean'));
  assertNoRawMaterial([workspaceSkeleton, evidencePack, consoleHandoff], [rawUrl, rawValue, rawEmail, sensitiveKey]);
});

test('canonical public activation pack contains only allowlisted fields', () => {
  const canonical = buildCanonicalPublicV1ActivationPack(capsuleV1ActivationPackFixture);
  assert.deepEqual(Object.keys(canonical), [
    'activationPackId',
    'tenantDraftId',
    'workspaceRef',
    'organizationRef',
    'template',
    'vertical',
    'planPath',
    'activationMode',
    'runtimeMode',
    'launcherMode',
    'requestedChannels',
    'boundaries',
    'safetyFlags',
    'generatedAt',
    'publicSafe'
  ]);
  assert.deepEqual(Object.keys(canonical.boundaries), Object.keys(canonical.safetyFlags));
  assert.ok(Object.values(canonical.boundaries).every((value) => typeof value === 'boolean'));
  const files = buildActivationRunnerWritableFiles(capsuleV1ActivationPackFixture, { root: process.cwd() });
  const emittedPack = JSON.parse(files['activation-pack.public.json']);
  assert.deepEqual(emittedPack, canonical);
  assert.equal(Object.hasOwn(emittedPack, 'extraOperatorPayload'), false);
});

test('doctor report overrides cannot inject public unsafe details into writer output', () => {
  const rawEmail = ['person', 'example.invalid'].join('@');
  const rawProviderUrl = 'https://provider.example';
  const rawToken = 'abc12345678';
  const overrideCases = [
    {
      doctorReport: {
        status: 'passed',
        checks: [{ checkId: 'provider_health', status: 'passed', details: { customerEmail: `[${rawEmail}](mailto:${rawEmail})` } }],
        blockedReasonCodes: [],
        publicSafe: true
      },
      rawValues: [rawEmail]
    },
    {
      doctorReport: {
        status: 'passed',
        checks: [{ checkId: 'provider_health', status: 'passed', details: { accessToken: rawToken } }],
        blockedReasonCodes: [],
        publicSafe: true
      },
      rawValues: [rawToken, 'accessToken']
    },
    {
      doctorReport: {
        status: 'passed',
        checks: [{ checkId: 'provider_health', status: 'passed', details: { providerUrl: rawProviderUrl } }],
        blockedReasonCodes: [],
        publicSafe: true
      },
      rawValues: [rawProviderUrl]
    }
  ];

  for (const { doctorReport, rawValues } of overrideCases) {
    assert.throws(() => buildActivationRunnerWritableFiles(capsuleV1ActivationPackFixture, { root: process.cwd(), doctorReport }), (error) => {
      assert.ok(error instanceof ActivationRunnerWriteBlockedError);
      assert.match(error.message, /blocked_doctor_report_override/);
      assertNoRawMaterial([error.message], rawValues);
      return true;
    });
  }
});

test('public output guard blocks malicious internal objects', () => {
  const rawEmail = ['guard', 'example.invalid'].join('@');
  const unsafeIssues = collectUnsafePublicMaterial({ details: { [`[${rawEmail}](mailto:${rawEmail})`]: 'ok' } });
  assert.ok(unsafeIssues.includes('blocked_unsafe_key_name:root.details.<unsafe_key>'));
  assert.throws(() => assertPublicSafeOutput({ details: { customerEmail: rawEmail } }, 'malicious-test-output'), (error) => {
    assert.ok(error instanceof ActivationRunnerWriteBlockedError);
    assert.match(error.message, /blocked_public_output:malicious-test-output/);
    assert.doesNotMatch(error.message, escapedPattern(rawEmail));
    return true;
  });
});

test('normalized live and assertive key names fail before writer serialization', () => {
  const mailValue = `[${['person', 'example.invalid'].join('@')}](mailto:${['person', 'example.invalid'].join('@')})`;
  const keyCases = [
    { key: ['live', '_', 'execution', '_', 'enabled'].join(''), value: true },
    { key: ['LIVE', '_', 'EXECUTION', '_', 'ENABLED'].join(''), value: true },
    { key: ['booking', '_', 'created'].join(''), value: true },
    { key: ['payment', '_', 'captured'].join(''), value: true },
    { key: ['runtime', '_', 'execution', '_', 'enabled'].join(''), value: true },
    { key: ['message', '_', 'sent'].join(''), value: true },
    { key: ['Payment', '-', 'Captured'].join(''), value: true },
    { key: ['provider', '_', 'endpoint'].join(''), value: 'provider_placeholder' },
    { key: ['checkout', '_', 'url'].join(''), value: 'checkout_placeholder' },
    { key: ['customer', '_', 'email'].join(''), value: mailValue },
    { key: ['CUSTOMER', '_', 'EMAIL'].join(''), value: mailValue }
  ];

  for (const { key, value } of keyCases) {
    const pack = buildDefaultV1ActivationPack({
      nestedLiveSurface: {
        reviewItems: [{ [key]: value }]
      }
    });
    const report = validateV1ActivationPack(pack);
    const expectedBlocker = 'blocked_assertive_live_field:root.nestedLiveSurface.reviewItems.0.<unsafe_key>';
    assert.equal(report.ok, false, key);
    assert.ok(report.blockers.includes(expectedBlocker), key);
    assert.throws(() => buildActivationRunnerWritableFiles(pack), (error) => {
      assert.ok(error instanceof ActivationRunnerWriteBlockedError);
      assert.match(error.message, new RegExp(expectedBlocker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      assert.doesNotMatch(error.message, /provider_placeholder|checkout_placeholder|person/);
      assert.doesNotMatch(error.message, new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      return true;
    });
  }

  const falseLiveReport = validateV1ActivationPack(buildDefaultV1ActivationPack({
    nestedLiveSurface: { reviewItems: [{ live_execution_enabled: false }] }
  }));
  assert.equal(falseLiveReport.ok, false);
  assert.ok(falseLiveReport.blockers.includes('unknown_activation_pack_field:root.nestedLiveSurface'));
  assert.ok(!falseLiveReport.blockers.includes('blocked_assertive_live_field:root.nestedLiveSurface.reviewItems.0.<unsafe_key>'));
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
