import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
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
  buildPublicOutputRootSummary,
  collectUnsafePublicMaterial,
  computeActivationPackFingerprint,
  runActivationDoctor,
  validateV1ActivationPack,
  writeActivationRunnerFiles,
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

function assertNoPartialFiles(path) {
  assert.deepEqual(existsSync(path) ? readdirSync(path) : [], []);
}

function publicJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function builderPublicJsonObject(filename) {
  const files = buildActivationRunnerWritableFiles(capsuleV1ActivationPackFixture, { root: process.cwd() });
  return JSON.parse(files[filename]);
}

function assertPublicJsonWriteBlocked(filename, value, expectedPattern, rawValues = []) {
  const out = tempOutputDir();
  try {
    assert.throws(() => writeActivationRunnerFiles({
      [filename]: publicJson(value)
    }, out), (error) => {
      assert.ok(error instanceof ActivationRunnerWriteBlockedError);
      assert.match(error.message, expectedPattern);
      for (const rawValue of rawValues) assert.doesNotMatch(error.message, escapedPattern(rawValue));
      return true;
    });
    assertNoPartialFiles(out);
  } finally {
    cleanup(out);
  }
}

function runActivationCli(script, args = []) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(result.stderr, '');
  return JSON.parse(result.stdout);
}

function testPaymentValue(prefixParts) {
  return `${prefixParts.join('_')}_${'a'.repeat(16)}`;
}

function hostileEvidenceReadyPack() {
  return {
    activationEvidencePackId: 'activation_evidence_pack_capsule_v1_activation_runner',
    activationPackId: 'capsule_v1_activation_runner',
    activationPackFingerprint: 'activation_fingerprint_placeholder',
    doctorStatus: 'blocked',
    dryRunStatus: 'dry_run_blocked_invalid_pack',
    boundaryStatus: {
      dryRunIsNotPermission: true,
      noProviderWasCalled: true,
      noBookingWasCreated: true,
      noPaymentWasCaptured: true,
      noOutboundMessageWasSent: true,
      noProvisioningWasPerformed: true,
      runtimeRemainsAuthority: true,
      noSecretsIncluded: true
    },
    generatedArtifacts: [],
    blockedLiveDisabledReasonCodes: ['dry_run_is_not_permission', 'runtime_authority_required'],
    consoleHandoffSummary: {
      launcherStatus: 'activation_blocked',
      activationReadiness: 'blocked_invalid_activation_pack',
      doctorStatus: 'blocked',
      evidencePackReady: false,
      localWorkspacePrepared: false,
      runtimeCommissioningRequired: true,
      providerCommissioningRequired: true,
      lastDryRunSummary: {
        dryRunPlanId: 'dry_run_plan_capsule_v1_activation_runner',
        status: 'dry_run_blocked_invalid_pack',
        stepCount: 0,
        noLiveExecution: true
      },
      publicReasonCodes: ['activation_pack_validation_required'],
      boundaries: {
        dryRunIsNotPermission: true,
        runtimeRemainsAuthority: true,
        noProviderWasCalled: true,
        noBookingWasCreated: true,
        noPaymentWasCaptured: true,
        noOutboundMessageWasSent: true,
        noProvisioningWasPerformed: true
      },
      generatedAt: '2026-01-01T00:00:00.000Z',
      publicSafe: true
    },
    launcherStatusSummary: {
      launcherStatus: 'activation_prepared_for_review',
      activationReadiness: 'dry_run_ready_no_live_execution',
      doctorStatus: 'blocked',
      evidencePackReady: true,
      localWorkspacePrepared: true,
      runtimeCommissioningRequired: true,
      providerCommissioningRequired: true,
      publicReasonCodes: ['dry_run_ready_no_live_execution']
    },
    deterministicActionDossier: {
      dadRef: 'dad_capsule_v1_activation_runner',
      status: 'public_safe_placeholder_ready',
      executionAuthority: 'runtime_required',
      noLiveExecution: true,
      publicSafe: true
    },
    explicitBoundaries: ['dry_run_is_not_permission'],
    validationReport: {
      ok: false,
      status: 'blocked_invalid_activation_pack',
      blockers: ['invalid_safe_ref:activationPackId'],
      checkedInvariants: [],
      publicSafe: true
    },
    generatedAt: '2026-01-01T00:00:00.000Z',
    publicSafe: true
  };
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

test('invalid pack with fake validation report cannot mark evidence ready', () => {
  const rawRef = 'https://unsafe.example/activation/fake-validation';
  const pack = buildDefaultV1ActivationPack({ activationPackId: rawRef });
  const evidencePack = buildActivationEvidencePack(pack, {
    validationReport: { ok: true, status: 'valid_public_safe_activation_pack', blockers: [], warnings: [], publicSafe: true }
  });

  assert.equal(evidencePack.validationReport.ok, false);
  assert.equal(evidencePack.launcherStatusSummary.evidencePackReady, false);
  assert.equal(evidencePack.dryRunStatus, 'dry_run_blocked_invalid_pack');
  assert.equal(evidencePack.consoleHandoffSummary.launcherStatus, 'activation_blocked');
  assertNoRawMaterial([evidencePack], [rawRef]);
});

test('invalid pack with fake passed doctor report cannot mark evidence ready', () => {
  const rawRef = 'https://unsafe.example/activation/fake-doctor';
  const pack = buildDefaultV1ActivationPack({ workspaceRef: rawRef });
  const evidencePack = buildActivationEvidencePack(pack, {
    doctorReport: {
      doctorReportId: 'doctor_report_fake_passed',
      status: 'passed',
      checks: [],
      blockedReasonCodes: [],
      generatedAt: '2026-06-24T00:00:00.000Z',
      publicSafe: true
    }
  });

  assert.equal(evidencePack.validationReport.ok, false);
  assert.equal(evidencePack.doctorStatus, 'blocked');
  assert.equal(evidencePack.launcherStatusSummary.doctorStatus, 'blocked');
  assert.equal(evidencePack.launcherStatusSummary.evidencePackReady, false);
  assertNoRawMaterial([evidencePack], [rawRef, 'doctor_report_fake_passed']);
});

test('invalid pack with fake ready dry-run plan cannot propagate ready status', () => {
  const rawRef = 'https://unsafe.example/activation/fake-dry-run';
  const pack = buildDefaultV1ActivationPack({ tenantDraftId: rawRef });
  const evidencePack = buildActivationEvidencePack(pack, {
    dryRunPlan: {
      dryRunPlanId: 'dry_run_plan_fake_ready',
      activationPackId: 'activation_pack_v1_public_fixture',
      status: 'dry_run_ready_no_live_execution',
      steps: [],
      publicSafe: true
    }
  });

  assert.equal(evidencePack.validationReport.ok, false);
  assert.equal(evidencePack.dryRunStatus, 'dry_run_blocked_invalid_pack');
  assert.equal(evidencePack.launcherStatusSummary.evidencePackReady, false);
  assertNoRawMaterial([evidencePack], [rawRef, 'dry_run_plan_fake_ready']);
});

test('invalid pack with fake console handoff cannot propagate prepared launcher status', () => {
  const rawRef = 'https://unsafe.example/activation/fake-handoff';
  const pack = buildDefaultV1ActivationPack({ organizationRef: rawRef });
  const evidencePack = buildActivationEvidencePack(pack, {
    consoleHandoffSummary: {
      launcherStatus: 'activation_prepared_for_review',
      activationReadiness: 'dry_run_ready_no_live_execution',
      evidencePackReady: true,
      localWorkspacePrepared: true,
      publicReasonCodes: ['activation_pack_valid'],
      publicSafe: true
    }
  });

  assert.equal(evidencePack.validationReport.ok, false);
  assert.equal(evidencePack.consoleHandoffSummary.launcherStatus, 'activation_blocked');
  assert.equal(evidencePack.launcherStatusSummary.launcherStatus, 'activation_blocked');
  assert.equal(evidencePack.launcherStatusSummary.evidencePackReady, false);
  assertNoRawMaterial([evidencePack], [rawRef]);
});

test('invalid pack with fake workspace skeleton cannot propagate prepared workspace', () => {
  const rawRef = 'https://unsafe.example/activation/fake-skeleton';
  const pack = buildDefaultV1ActivationPack({ workspaceRef: rawRef });
  const evidencePack = buildActivationEvidencePack(pack, {
    localWorkspaceSkeleton: {
      localWorkspaceId: 'local_workspace_fake_prepared',
      activationPackId: 'activation_pack_v1_public_fixture',
      status: 'workspace_skeleton_prepared',
      publicSafe: true
    }
  });

  assert.equal(evidencePack.validationReport.ok, false);
  assert.equal(evidencePack.launcherStatusSummary.localWorkspacePrepared, false);
  assert.equal(evidencePack.launcherStatusSummary.evidencePackReady, false);
  assertNoRawMaterial([evidencePack], [rawRef, 'local_workspace_fake_prepared']);
});

test('unsafe doctor report overrides cannot inject public evidence details', () => {
  const rawEmail = ['person', 'example.invalid'].join('@');
  const overrideCases = [
    { [['provider', 'Url'].join('')]: 'https://provider.example' },
    { [['customer', 'Email'].join('')]: `[${rawEmail}](mailto:${rawEmail})` },
    { [['access', 'Token'].join('')]: 'abc12345678' }
  ];

  for (const details of overrideCases) {
    assert.throws(() => buildActivationEvidencePack(capsuleV1ActivationPackFixture, {
      doctorReport: {
        status: 'passed',
        checks: [{ checkId: 'provider_health', status: 'passed', details }],
        blockedReasonCodes: [],
        publicSafe: true
      }
    }), ActivationRunnerWriteBlockedError);
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
  assert.equal(evidencePack.doctorStatus, 'passed');
  assert.equal(evidencePack.consoleHandoffSummary.launcherStatus, 'activation_prepared_for_review');
  assert.equal(evidencePack.consoleHandoffSummary.activationReadiness, 'dry_run_ready_no_live_execution');
  assert.equal(evidencePack.consoleHandoffSummary.evidencePackReady, true);
  assert.equal(evidencePack.boundaryStatus.noProviderWasCalled, true);
  assert.equal(evidencePack.boundaryStatus.noPaymentWasCaptured, true);
  assert.equal(evidencePack.boundaryStatus.runtimeRemainsAuthority, true);
  assert.ok(evidencePack.explicitBoundaries.includes('dry_run_is_not_permission'));
  assert.doesNotMatch(serialized, /"liveExecutionEnabled"\s*:\s*true/i);
  assert.doesNotMatch(serialized, /"bookingCreated"\s*:\s*true/i);
  assert.doesNotMatch(serialized, /"paymentCaptured"\s*:\s*true/i);
  assert.equal(evidencePack.activationPackFingerprint, computeActivationPackFingerprint(capsuleV1ActivationPackFixture));
});

test('evidence readiness is blocked when doctor status is blocked for an incomplete root', () => {
  const incompleteRoot = tempOutputDir();
  const out = tempOutputDir();
  try {
    const evidencePack = buildActivationEvidencePack(capsuleV1ActivationPackFixture, { root: incompleteRoot });
    const handoffText = JSON.stringify(evidencePack.consoleHandoffSummary);

    assert.equal(evidencePack.validationReport.ok, true);
    assert.equal(evidencePack.doctorStatus, 'blocked');
    assert.equal(evidencePack.dryRunStatus, 'blocked_doctor_not_passed');
    assert.equal(evidencePack.consoleHandoffSummary.launcherStatus, 'activation_blocked');
    assert.equal(evidencePack.consoleHandoffSummary.activationReadiness, 'blocked_doctor_not_passed');
    assert.equal(evidencePack.consoleHandoffSummary.evidencePackReady, false);
    assert.equal(evidencePack.consoleHandoffSummary.localWorkspacePrepared, false);
    assert.equal(evidencePack.launcherStatusSummary.launcherStatus, 'activation_blocked');
    assert.equal(evidencePack.launcherStatusSummary.activationReadiness, 'blocked_doctor_not_passed');
    assert.equal(evidencePack.launcherStatusSummary.evidencePackReady, false);
    assert.ok(evidencePack.consoleHandoffSummary.publicReasonCodes.includes('doctor_not_passed'));
    assert.ok(evidencePack.consoleHandoffSummary.publicReasonCodes.includes('runtime_authority_required'));
    assert.ok(evidencePack.consoleHandoffSummary.publicReasonCodes.includes('provider_commissioning_required'));
    assert.doesNotMatch(handoffText, /activation_prepared_for_review/);
    assert.doesNotMatch(handoffText, /dry_run_ready_no_live_execution/);

    const written = writeActivationRunnerFiles({
      'activation-evidence-pack.public.json': publicJson(evidencePack)
    }, out);
    assert.equal(written.length, 1);
  } finally {
    cleanup(incompleteRoot);
    cleanup(out);
  }
});

test('invalid activation packs keep invalid-pack readiness even with doctor context', () => {
  const pack = buildDefaultV1ActivationPack({ activationPackId: 'https://unsafe.example/activation/invalid' });
  const evidencePack = buildActivationEvidencePack(pack, { root: process.cwd() });
  const handoffText = JSON.stringify(evidencePack.consoleHandoffSummary);

  assert.equal(evidencePack.validationReport.ok, false);
  assert.equal(evidencePack.consoleHandoffSummary.launcherStatus, 'activation_blocked');
  assert.equal(evidencePack.consoleHandoffSummary.activationReadiness, 'blocked_invalid_activation_pack');
  assert.equal(evidencePack.consoleHandoffSummary.evidencePackReady, false);
  assert.equal(evidencePack.launcherStatusSummary.evidencePackReady, false);
  assert.doesNotMatch(handoffText, /activation_prepared_for_review/);
  assert.doesNotMatch(handoffText, /dry_run_ready_no_live_execution/);
});

test('doctor reports safe status for fixture and required repo structure', () => {
  const report = runActivationDoctor({ root: process.cwd(), activationPack: capsuleV1ActivationPackFixture });
  assert.equal(report.status, 'passed');
  assert.ok(report.checks.some((check) => check.checkId === 'required_scripts_registered' && check.status === 'passed'));
  assert.ok(report.checks.some((check) => check.checkId === 'no_runtime_execution_enabled' && check.status === 'passed'));
});

test('console handoff blocks readiness when doctor has not run', () => {
  const handoff = buildConsoleHandoffSummary(capsuleV1ActivationPackFixture);
  const serialized = JSON.stringify(handoff);

  assert.equal(handoff.doctorStatus, 'not_run');
  assert.equal(handoff.launcherStatus, 'activation_blocked');
  assert.equal(handoff.activationReadiness, 'blocked_doctor_not_run');
  assert.equal(handoff.evidencePackReady, false);
  assert.equal(handoff.localWorkspacePrepared, true);
  assert.ok(handoff.publicReasonCodes.includes('doctor_not_run'));
  assert.ok(handoff.publicReasonCodes.includes('runtime_authority_required'));
  assert.ok(handoff.publicReasonCodes.includes('provider_commissioning_required'));
  assert.doesNotMatch(serialized, /activation_prepared_for_review/);
  assert.doesNotMatch(serialized, /dry_run_ready_no_live_execution/);
});

test('console handoff blocks readiness when doctor is blocked', () => {
  const handoff = buildConsoleHandoffSummary(capsuleV1ActivationPackFixture, { doctorStatus: 'blocked' });
  const serialized = JSON.stringify(handoff);

  assert.equal(handoff.doctorStatus, 'blocked');
  assert.equal(handoff.launcherStatus, 'activation_blocked');
  assert.equal(handoff.activationReadiness, 'blocked_doctor_not_passed');
  assert.equal(handoff.evidencePackReady, false);
  assert.ok(handoff.publicReasonCodes.includes('doctor_not_passed'));
  assert.doesNotMatch(serialized, /activation_prepared_for_review/);
  assert.doesNotMatch(serialized, /dry_run_ready_no_live_execution/);
});

test('console handoff allows readiness only when doctor passed', () => {
  const handoff = buildConsoleHandoffSummary(capsuleV1ActivationPackFixture, { doctorStatus: 'passed' });

  assert.equal(handoff.doctorStatus, 'passed');
  assert.equal(handoff.launcherStatus, 'activation_prepared_for_review');
  assert.equal(handoff.activationReadiness, 'dry_run_ready_no_live_execution');
  assert.equal(handoff.evidencePackReady, true);
  assert.ok(handoff.publicReasonCodes.includes('dry_run_ready_no_live_execution'));
});

test('console handoff keeps invalid packs blocked regardless of doctor status', () => {
  const pack = buildDefaultV1ActivationPack({ activationPackId: 'https://unsafe.example/activation/invalid-handoff' });
  const handoff = buildConsoleHandoffSummary(pack, { doctorStatus: 'passed' });
  const serialized = JSON.stringify(handoff);

  assert.equal(handoff.doctorStatus, 'passed');
  assert.equal(handoff.launcherStatus, 'activation_blocked');
  assert.equal(handoff.activationReadiness, 'blocked_invalid_activation_pack');
  assert.equal(handoff.evidencePackReady, false);
  assert.doesNotMatch(serialized, /activation_prepared_for_review/);
  assert.doesNotMatch(serialized, /dry_run_ready_no_live_execution/);
});

test('console handoff output is public-safe and keeps commissioning required', () => {
  const handoff = buildConsoleHandoffSummary(capsuleV1ActivationPackFixture, { doctorStatus: 'passed' });
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

test('writeActivationRunnerFiles rejects unsafe JSON string content before writing', () => {
  const out = tempOutputDir();
  const rawUrl = 'https://unsafe.example';
  try {
    assert.throws(() => writeActivationRunnerFiles({
      'activation-pack.public.json': `${JSON.stringify({ note: rawUrl })}\n`
    }, out), (error) => {
      assert.ok(error instanceof ActivationRunnerWriteBlockedError);
      assert.match(error.message, /blocked_file_content:writeActivationRunnerFiles:activation-pack\.public\.json/);
      assert.doesNotMatch(error.message, escapedPattern(rawUrl));
      return true;
    });
    assertNoPartialFiles(out);
  } finally {
    cleanup(out);
  }
});

test('writeActivationRunnerFiles rejects test payment prefix JSON content before writing', () => {
  const paymentValues = [
    testPaymentValue(['sk', 'test']),
    testPaymentValue(['pk', 'test']),
    testPaymentValue(['rk', 'test']),
    `${['wh', 'sec'].join('')}_${'a'.repeat(16)}`
  ];

  for (const rawValue of paymentValues) {
    const out = tempOutputDir();
    try {
      assert.throws(() => writeActivationRunnerFiles({
        'activation-pack.public.json': `${JSON.stringify({ status: rawValue, publicSafe: true })}\n`
      }, out), (error) => {
        assert.ok(error instanceof ActivationRunnerWriteBlockedError);
        assert.match(error.message, /blocked_secret_like_value:root\.status/);
        assert.doesNotMatch(error.message, escapedPattern(rawValue));
        return true;
      });
      assertNoPartialFiles(out);
    } finally {
      cleanup(out);
    }
  }
});

test('writeActivationRunnerFiles rejects unsafe markdown content before writing', () => {
  const out = tempOutputDir();
  const rawEmail = ['person', 'example.invalid'].join('@');
  try {
    assert.throws(() => writeActivationRunnerFiles({
      'README_ACTIVATION_RUNNER.md': `contact [${rawEmail}](mailto:${rawEmail})`
    }, out), (error) => {
      assert.ok(error instanceof ActivationRunnerWriteBlockedError);
      assert.match(error.message, /blocked_file_content:writeActivationRunnerFiles:README_ACTIVATION_RUNNER\.md/);
      assert.doesNotMatch(error.message, escapedPattern(rawEmail));
      return true;
    });
    assertNoPartialFiles(out);
  } finally {
    cleanup(out);
  }
});

test('writeActivationRunnerFiles rejects test payment prefix markdown content before writing', () => {
  const out = tempOutputDir();
  const rawValue = testPaymentValue(['sk', 'test']);
  try {
    assert.throws(() => writeActivationRunnerFiles({
      'README_ACTIVATION_RUNNER.md': `public sink must block ${rawValue}`
    }, out), (error) => {
      assert.ok(error instanceof ActivationRunnerWriteBlockedError);
      assert.match(error.message, /blocked_secret_like_value:root\.content/);
      assert.doesNotMatch(error.message, escapedPattern(rawValue));
      return true;
    });
    assertNoPartialFiles(out);
  } finally {
    cleanup(out);
  }
});

test('writeActivationRunnerFiles rejects JSON object key PII before writing', () => {
  const out = tempOutputDir();
  const rawEmail = ['person', 'example.invalid'].join('@');
  try {
    assert.throws(() => writeActivationRunnerFiles({
      'activation-pack.public.json': `${JSON.stringify({ review: { [`[${rawEmail}](mailto:${rawEmail})`]: 'ok' } })}\n`
    }, out), (error) => {
      assert.ok(error instanceof ActivationRunnerWriteBlockedError);
      assert.match(error.message, /blocked_unsafe_key_name:root\.review\.<unsafe_key>/);
      assert.doesNotMatch(error.message, escapedPattern(rawEmail));
      return true;
    });
    assertNoPartialFiles(out);
  } finally {
    cleanup(out);
  }
});

test('writeActivationRunnerFiles rejects digit-only phone values in public JSON before writing', () => {
  const rawPhone = '5551234567';
  const out = tempOutputDir();
  try {
    assert.throws(() => writeActivationRunnerFiles({
      'README_ACTIVATION_RUNNER.md': 'Public-safe local activation output.\n',
      'doctor-report.public.json': publicJson({
        doctorReportId: 'doctor_report_public_fixture',
        status: 'blocked',
        checks: [],
        blockedReasonCodes: [rawPhone],
        generatedAt: '2026-06-24T00:00:00.000Z',
        publicSafe: true
      })
    }, out), (error) => {
      assert.ok(error instanceof ActivationRunnerWriteBlockedError);
      assert.match(error.message, /blocked_pii_like_value:root\.blockedReasonCodes\.0/);
      assert.doesNotMatch(error.message, escapedPattern(rawPhone));
      return true;
    });
    assertNoPartialFiles(out);
  } finally {
    cleanup(out);
  }
});

test('writeActivationRunnerFiles rejects numeric phone values in public JSON before writing', () => {
  const rawPhoneNumber = 5551234567;
  const out = tempOutputDir();
  try {
    assert.throws(() => writeActivationRunnerFiles({
      'README_ACTIVATION_RUNNER.md': 'Public-safe local activation output.\n',
      'doctor-report.public.json': publicJson({
        doctorReportId: 'doctor_report_public_fixture',
        status: 'blocked',
        checks: [],
        blockedReasonCodes: [rawPhoneNumber],
        generatedAt: '2026-06-24T00:00:00.000Z',
        publicSafe: true
      })
    }, out), (error) => {
      assert.ok(error instanceof ActivationRunnerWriteBlockedError);
      assert.match(error.message, /blocked_pii_like_value:root\.blockedReasonCodes\.0/);
      assert.doesNotMatch(error.message, escapedPattern(String(rawPhoneNumber)));
      return true;
    });
    assertNoPartialFiles(out);
  } finally {
    cleanup(out);
  }
});

test('writeActivationRunnerFiles rejects numeric phone values in canonical public fields', () => {
  const rawPhoneNumber = 5551234567;
  const handoff = builderPublicJsonObject('console-handoff-summary.public.json');
  handoff.lastDryRunSummary.stepCount = rawPhoneNumber;
  assertPublicJsonWriteBlocked(
    'console-handoff-summary.public.json',
    handoff,
    /blocked_pii_like_value:root\.lastDryRunSummary\.stepCount/,
    [String(rawPhoneNumber)]
  );
});

test('writeActivationRunnerFiles allows small numeric public counters', () => {
  const handoff = builderPublicJsonObject('console-handoff-summary.public.json');
  handoff.lastDryRunSummary.stepCount = 5;
  const cliSummary = assertPublicSafeOutput({
    command: 'capsule:activation:dry-run',
    outputRootMode: 'custom',
    outputRootPublicRef: 'custom_operator_output_root',
    outputRootEchoed: false,
    written: 3,
    publicSafe: true
  }, 'test-cli-summary.public.json');

  const out = tempOutputDir();
  try {
    const written = writeActivationRunnerFiles({
      'console-handoff-summary.public.json': publicJson(handoff)
    }, out);
    assert.equal(written.length, 1);
    assert.equal(cliSummary.written, 3);
  } finally {
    cleanup(out);
  }
});

test('writeActivationRunnerFiles rejects digit-only phone values in canonical evidence strings', () => {
  const rawPhone = '5551234567';
  const files = buildActivationRunnerWritableFiles(capsuleV1ActivationPackFixture, { root: process.cwd() });
  const evidencePack = JSON.parse(files['activation-evidence-pack.public.json']);
  evidencePack.dryRunStatus = rawPhone;

  const out = tempOutputDir();
  try {
    assert.throws(() => writeActivationRunnerFiles({
      'activation-evidence-pack.public.json': publicJson(evidencePack)
    }, out), (error) => {
      assert.ok(error instanceof ActivationRunnerWriteBlockedError);
      assert.match(error.message, /blocked_pii_like_value:root\.dryRunStatus/);
      assert.doesNotMatch(error.message, escapedPattern(rawPhone));
      return true;
    });
    assertNoPartialFiles(out);
  } finally {
    cleanup(out);
  }
});

test('writeActivationRunnerFiles rejects digit-only phone markdown without echoing raw value', () => {
  const rawPhone = '5551234567';
  const out = tempOutputDir();
  try {
    assert.throws(() => writeActivationRunnerFiles({
      'README_ACTIVATION_RUNNER.md': `${rawPhone}\n`
    }, out), (error) => {
      assert.ok(error instanceof ActivationRunnerWriteBlockedError);
      assert.match(error.message, /blocked_pii_like_value:root\.content/);
      assert.doesNotMatch(error.message, escapedPattern(rawPhone));
      return true;
    });
    assertNoPartialFiles(out);
  } finally {
    cleanup(out);
  }
});

test('writeActivationRunnerFiles still rejects plus-prefixed and separated phone values', () => {
  for (const rawPhone of ['+34 600 123 456', '555-123-4567']) {
    const out = tempOutputDir();
    try {
      assert.throws(() => writeActivationRunnerFiles({
        'doctor-report.public.json': publicJson({
          doctorReportId: 'doctor_report_public_fixture',
          status: 'blocked',
          checks: [],
          blockedReasonCodes: [rawPhone],
          generatedAt: '2026-06-24T00:00:00.000Z',
          publicSafe: true
        })
      }, out), (error) => {
        assert.ok(error instanceof ActivationRunnerWriteBlockedError);
        assert.match(error.message, /blocked_pii_like_value:root\.blockedReasonCodes\.0/);
        assert.doesNotMatch(error.message, escapedPattern(rawPhone));
        return true;
      });
      assertNoPartialFiles(out);
    } finally {
      cleanup(out);
    }
  }
});

test('digit-only phone detector does not block generated public-safe outputs or identifiers', () => {
  const files = buildActivationRunnerWritableFiles(capsuleV1ActivationPackFixture, { root: process.cwd() });
  const evidencePack = JSON.parse(files['activation-evidence-pack.public.json']);
  assert.equal(evidencePack.activationPackFingerprint, computeActivationPackFingerprint(capsuleV1ActivationPackFixture));
  assert.equal(evidencePack.generatedAt, '2026-06-24T00:00:00.000Z');
  assert.match(evidencePack.activationEvidencePackId, /^activation_evidence_pack_/);

  const out = tempOutputDir();
  try {
    const written = writeActivationRunnerFiles(files, out);
    assert.equal(written.length, V1_ACTIVATION_RUNNER_WRITABLE_FILES.length);
  } finally {
    cleanup(out);
  }
});

test('writeActivationRunnerFiles writes no partial files when test payment prefix content is present', () => {
  const out = tempOutputDir();
  const rawValue = testPaymentValue(['rk', 'test']);
  try {
    assert.throws(() => writeActivationRunnerFiles({
      'README_ACTIVATION_RUNNER.md': 'Public-safe local activation output.\n',
      'activation-pack.public.json': `${JSON.stringify({ status: rawValue, publicSafe: true })}\n`
    }, out), (error) => {
      assert.ok(error instanceof ActivationRunnerWriteBlockedError);
      assert.doesNotMatch(error.message, escapedPattern(rawValue));
      return true;
    });
    assertNoPartialFiles(out);
  } finally {
    cleanup(out);
  }
});

test('writeActivationRunnerFiles validates all files before writing partial output', () => {
  const out = tempOutputDir();
  const rawUrl = 'https://unsafe.example';
  try {
    assert.throws(() => writeActivationRunnerFiles({
      'README_ACTIVATION_RUNNER.md': 'Public-safe local activation output.\n',
      'activation-pack.public.json': `${JSON.stringify({ note: rawUrl })}\n`
    }, out), (error) => {
      assert.ok(error instanceof ActivationRunnerWriteBlockedError);
      assert.doesNotMatch(error.message, escapedPattern(rawUrl));
      return true;
    });
    assertNoPartialFiles(out);
  } finally {
    cleanup(out);
  }
});

test('writeActivationRunnerFiles writes the validated file snapshot for mutable file maps', () => {
  const files = buildActivationRunnerWritableFiles(capsuleV1ActivationPackFixture, { root: process.cwd() });
  const safeDoctorReport = files['doctor-report.public.json'];
  const unsafeDoctorReport = publicJson({
    ...JSON.parse(safeDoctorReport),
    blockedReasonCodes: [testPaymentValue(['sk', 'test'])]
  });
  let readCount = 0;
  const mutableFiles = {};
  Object.defineProperty(mutableFiles, 'doctor-report.public.json', {
    enumerable: true,
    get() {
      readCount += 1;
      return readCount === 1 ? safeDoctorReport : unsafeDoctorReport;
    }
  });

  const out = tempOutputDir();
  try {
    const written = writeActivationRunnerFiles(mutableFiles, out);
    assert.equal(written.length, 1);
    assert.equal(readCount, 1);
    assert.equal(readFileSync(join(out, 'doctor-report.public.json'), 'utf8'), safeDoctorReport);
  } finally {
    cleanup(out);
  }
});

test('writeActivationRunnerFiles rejects hostile evidence readiness JSON for root and workspace copies before writing', () => {
  for (const filename of [
    'activation-evidence-pack.public.json',
    'workspace/evidence/activation-evidence-pack.public.json'
  ]) {
    const out = tempOutputDir();
    try {
      assert.throws(() => writeActivationRunnerFiles({
        [filename]: publicJson(hostileEvidenceReadyPack())
      }, out), (error) => {
        assert.ok(error instanceof ActivationRunnerWriteBlockedError);
        assert.match(error.message, /blocked_public_file_schema:writeActivationRunnerFiles/);
        assert.match(error.message, /evidence_pack_ready_mismatch/);
        return true;
      });
      assertNoPartialFiles(out);
    } finally {
      cleanup(out);
    }
  }
});

test('writeActivationRunnerFiles rejects ready status claims for blocked evidence', () => {
  for (const filename of [
    'activation-evidence-pack.public.json',
    'workspace/evidence/activation-evidence-pack.public.json'
  ]) {
    const evidence = hostileEvidenceReadyPack();
    evidence.dryRunStatus = 'dry_run_ready_no_live_execution';
    evidence.launcherStatusSummary.evidencePackReady = false;
    evidence.launcherStatusSummary.localWorkspacePrepared = false;
    evidence.consoleHandoffSummary.launcherStatus = 'activation_prepared_for_review';
    evidence.consoleHandoffSummary.activationReadiness = 'dry_run_ready_no_live_execution';
    evidence.consoleHandoffSummary.evidencePackReady = false;
    evidence.consoleHandoffSummary.localWorkspacePrepared = false;

    assertPublicJsonWriteBlocked(
      filename,
      evidence,
      /evidence_ready_claim_for_blocked_activation:root\.(dryRunStatus|launcherStatusSummary\.launcherStatus|consoleHandoffSummary\.launcherStatus)/
    );
  }
});

test('writeActivationRunnerFiles writes builder-produced evidence JSON through canonical schema guard', () => {
  const files = buildActivationRunnerWritableFiles(capsuleV1ActivationPackFixture, { root: process.cwd() });
  for (const filename of [
    'activation-evidence-pack.public.json',
    'workspace/evidence/activation-evidence-pack.public.json'
  ]) {
    const out = tempOutputDir();
    try {
      const written = writeActivationRunnerFiles({ [filename]: files[filename] }, out);
      assert.equal(written.length, 1);
      const parsed = JSON.parse(readFileSync(join(out, filename), 'utf8'));
      assert.equal(parsed.publicSafe, true);
      assert.equal(parsed.launcherStatusSummary.evidencePackReady, true);
    } finally {
      cleanup(out);
    }
  }
});

test('writeActivationRunnerFiles accepts blocked not-run console handoff without ready claims', () => {
  const handoff = buildConsoleHandoffSummary(capsuleV1ActivationPackFixture);
  const out = tempOutputDir();
  try {
    const written = writeActivationRunnerFiles({
      'console-handoff-summary.public.json': publicJson(handoff)
    }, out);
    assert.equal(written.length, 1);
    assert.equal(JSON.parse(readFileSync(join(out, 'console-handoff-summary.public.json'), 'utf8')).doctorStatus, 'not_run');
  } finally {
    cleanup(out);
  }
});

test('writeActivationRunnerFiles rejects handoff readiness that contradicts doctor status', () => {
  for (const filename of [
    'console-handoff-summary.public.json',
    'workspace/handoff/console-handoff-summary.public.json'
  ]) {
    for (const doctorStatus of ['blocked', 'not_run']) {
      const handoff = builderPublicJsonObject('console-handoff-summary.public.json');
      handoff.doctorStatus = doctorStatus;
      assertPublicJsonWriteBlocked(
        filename,
        handoff,
        /handoff_ready_mismatch/
      );
    }
  }
});

test('writeActivationRunnerFiles rejects handoff lastDryRunSummary readiness mismatches', () => {
  const handoff = buildConsoleHandoffSummary(capsuleV1ActivationPackFixture);
  handoff.lastDryRunSummary.status = 'dry_run_ready_no_live_execution';
  assertPublicJsonWriteBlocked(
    'console-handoff-summary.public.json',
    handoff,
    /handoff_last_dry_run_status_mismatch/
  );
});

test('writeActivationRunnerFiles rejects inconsistent doctor report semantics', () => {
  const passedWithBlockedCheck = builderPublicJsonObject('doctor-report.public.json');
  passedWithBlockedCheck.checks[0].status = 'blocked';
  passedWithBlockedCheck.checks[0].reasonCodes = ['activation_pack_validation_required'];
  passedWithBlockedCheck.blockedReasonCodes = ['activation_pack_validation_required'];
  assertPublicJsonWriteBlocked(
    'doctor-report.public.json',
    passedWithBlockedCheck,
    /doctor_report_passed_with_blocked_checks/
  );

  const blockedWithoutEvidence = builderPublicJsonObject('doctor-report.public.json');
  blockedWithoutEvidence.status = 'blocked';
  blockedWithoutEvidence.blockedReasonCodes = [];
  assertPublicJsonWriteBlocked(
    'doctor-report.public.json',
    blockedWithoutEvidence,
    /doctor_report_blocked_without_evidence/
  );

  const unsafeCheckShape = builderPublicJsonObject('doctor-report.public.json');
  unsafeCheckShape.checks[0].publicSafe = false;
  assertPublicJsonWriteBlocked(
    'doctor-report.public.json',
    unsafeCheckShape,
    /doctor_report_check_public_safe_must_be_true:root\.checks\.0\.publicSafe/
  );
});

test('writeActivationRunnerFiles rejects mismatched root and workspace alias JSON', () => {
  const files = buildActivationRunnerWritableFiles(capsuleV1ActivationPackFixture, { root: process.cwd() });
  const workspaceDryRun = JSON.parse(files['workspace/plans/dry-run-plan.public.json']);
  workspaceDryRun.status = 'dry_run_blocked_invalid_pack';
  const out = tempOutputDir();
  try {
    assert.throws(() => writeActivationRunnerFiles({
      'dry-run-plan.public.json': files['dry-run-plan.public.json'],
      'workspace/plans/dry-run-plan.public.json': publicJson(workspaceDryRun)
    }, out), (error) => {
      assert.ok(error instanceof ActivationRunnerWriteBlockedError);
      assert.match(error.message, /alias_mismatch:dry-run-plan\.public\.json:workspace\/plans\/dry-run-plan\.public\.json/);
      return true;
    });
    assertNoPartialFiles(out);
  } finally {
    cleanup(out);
  }
});

test('writeActivationRunnerFiles rejects cross-file doctor status mismatches', () => {
  const files = buildActivationRunnerWritableFiles(capsuleV1ActivationPackFixture, { root: process.cwd() });
  const doctorReport = JSON.parse(files['doctor-report.public.json']);
  doctorReport.status = 'blocked';
  doctorReport.checks = [{
    checkId: 'repo_package_structure',
    status: 'blocked',
    reasonCodes: ['repo_structure_missing'],
    details: {},
    publicSafe: true
  }];
  doctorReport.blockedReasonCodes = ['repo_structure_missing'];
  const out = tempOutputDir();
  try {
    assert.throws(() => writeActivationRunnerFiles({
      'doctor-report.public.json': publicJson(doctorReport),
      'workspace/status/doctor-status.public.json': files['workspace/status/doctor-status.public.json'],
      'console-handoff-summary.public.json': files['console-handoff-summary.public.json']
    }, out), (error) => {
      assert.ok(error instanceof ActivationRunnerWriteBlockedError);
      assert.match(error.message, /cross_file_doctor_status_mismatch/);
      return true;
    });
    assertNoPartialFiles(out);
  } finally {
    cleanup(out);
  }
});

test('writeActivationRunnerFiles rejects evidence and handoff summary mismatches', () => {
  const files = buildActivationRunnerWritableFiles(capsuleV1ActivationPackFixture, { root: process.cwd() });
  const handoff = JSON.parse(files['console-handoff-summary.public.json']);
  handoff.publicReasonCodes = [...handoff.publicReasonCodes, 'operator_review_placeholder'];
  const out = tempOutputDir();
  try {
    assert.throws(() => writeActivationRunnerFiles({
      'activation-evidence-pack.public.json': files['activation-evidence-pack.public.json'],
      'console-handoff-summary.public.json': publicJson(handoff)
    }, out), (error) => {
      assert.ok(error instanceof ActivationRunnerWriteBlockedError);
      assert.match(error.message, /cross_file_handoff_summary_mismatch/);
      return true;
    });
    assertNoPartialFiles(out);
  } finally {
    cleanup(out);
  }
});

test('writeActivationRunnerFiles blocks preexisting symlink path segments under output root', () => {
  const files = buildActivationRunnerWritableFiles(capsuleV1ActivationPackFixture, { root: process.cwd() });
  const out = tempOutputDir();
  const external = tempOutputDir();
  const link = join(out, 'workspace');
  try {
    try {
      symlinkSync(external, link, process.platform === 'win32' ? 'junction' : 'dir');
    } catch {
      return;
    }
    assert.throws(() => writeActivationRunnerFiles({
      'workspace/status/doctor-status.public.json': files['workspace/status/doctor-status.public.json']
    }, out), /blocked_symlink_path_segment|blocked_realpath_escape/);
    assert.equal(existsSync(join(external, 'status', 'doctor-status.public.json')), false);
  } finally {
    cleanup(out);
    cleanup(external);
  }
});

test('writeActivationRunnerFiles blocks final symlink targets without touching external files', () => {
  const out = tempOutputDir();
  const external = tempOutputDir();
  const victim = join(external, 'victim.txt');
  const originalVictim = 'external file must not change';
  const link = join(out, 'README_ACTIVATION_RUNNER.md');
  writeFileSync(victim, originalVictim, 'utf8');
  try {
    try {
      symlinkSync(victim, link, 'file');
    } catch {
      return;
    }
    assert.throws(() => writeActivationRunnerFiles({
      'README_ACTIVATION_RUNNER.md': 'Public-safe local activation output.\n'
    }, out), (error) => {
      assert.match(error.message, /blocked_final_symlink_target/);
      assert.doesNotMatch(error.message, escapedPattern(victim));
      assert.doesNotMatch(error.message, escapedPattern(external));
      return true;
    });
    assert.equal(readFileSync(victim, 'utf8'), originalVictim);
  } finally {
    cleanup(out);
    cleanup(external);
  }
});

test('writeActivationRunnerFiles writes no partial files when a later final target is a symlink', () => {
  const files = buildActivationRunnerWritableFiles(capsuleV1ActivationPackFixture, { root: process.cwd() });
  const out = tempOutputDir();
  const external = tempOutputDir();
  const victim = join(external, 'victim.txt');
  const originalVictim = 'later symlink victim must not change';
  const link = join(out, 'workspace', 'status', 'doctor-status.public.json');
  writeFileSync(victim, originalVictim, 'utf8');
  try {
    mkdirSync(join(out, 'workspace', 'status'), { recursive: true });
    symlinkSync(victim, link, 'file');
  } catch {
    cleanup(out);
    cleanup(external);
    return;
  }
  try {
    assert.throws(() => writeActivationRunnerFiles({
      'README_ACTIVATION_RUNNER.md': files['README_ACTIVATION_RUNNER.md'],
      'workspace/status/doctor-status.public.json': files['workspace/status/doctor-status.public.json']
    }, out), /blocked_final_symlink_target/);
    assert.equal(existsSync(join(out, 'README_ACTIVATION_RUNNER.md')), false);
    assert.equal(readFileSync(victim, 'utf8'), originalVictim);
  } finally {
    cleanup(out);
    cleanup(external);
  }
});

test('writeActivationRunnerFiles overwrites existing regular files inside output root', () => {
  const out = tempOutputDir();
  const target = join(out, 'README_ACTIVATION_RUNNER.md');
  try {
    writeFileSync(target, 'old public-safe content\n', 'utf8');
    writeActivationRunnerFiles({
      'README_ACTIVATION_RUNNER.md': 'new public-safe content\n'
    }, out);
    assert.equal(readFileSync(target, 'utf8'), 'new public-safe content\n');
  } finally {
    cleanup(out);
  }
});

test('writeActivationRunnerFiles rejects false activation status boundary values', () => {
  const cases = [
    {
      value: { ...builderPublicJsonObject('workspace/status/activation-status.public.json'), noLiveExecution: false },
      expected: /invalid_boundary_value:root\.noLiveExecution/
    },
    {
      value: { ...builderPublicJsonObject('workspace/status/activation-status.public.json'), runtimeAuthorityRequired: false },
      expected: /invalid_boundary_value:root\.runtimeAuthorityRequired/
    },
    {
      value: { ...builderPublicJsonObject('workspace/status/activation-status.public.json'), providerCommissioningRequired: false },
      expected: /invalid_boundary_value:root\.providerCommissioningRequired/
    }
  ];

  for (const { value, expected } of cases) {
    assertPublicJsonWriteBlocked('workspace/status/activation-status.public.json', value, expected);
  }
});

test('writeActivationRunnerFiles rejects enabled provider connection config values', () => {
  const config = { ...builderPublicJsonObject('workspace/config/launcher.config.public.json'), providerConnection: 'enabled' };
  assertPublicJsonWriteBlocked(
    'workspace/config/launcher.config.public.json',
    config,
    /invalid_disabled_value:root\.providerConnection/
  );
});

test('writeActivationRunnerFiles rejects false console handoff boundary values', () => {
  const handoff = builderPublicJsonObject('console-handoff-summary.public.json');
  handoff.boundaries.noPaymentWasCaptured = false;
  assertPublicJsonWriteBlocked(
    'console-handoff-summary.public.json',
    handoff,
    /invalid_boundary_value:root\.boundaries\.noPaymentWasCaptured/
  );
});

test('writeActivationRunnerFiles rejects false evidence boundary values', () => {
  const evidence = builderPublicJsonObject('activation-evidence-pack.public.json');
  evidence.boundaryStatus.noPaymentWasCaptured = false;
  assertPublicJsonWriteBlocked(
    'activation-evidence-pack.public.json',
    evidence,
    /invalid_boundary_value:root\.boundaryStatus\.noPaymentWasCaptured/
  );
});

test('writeActivationRunnerFiles rejects dry-run plans with false no-live boundary values', () => {
  const dryRunPlan = { ...builderPublicJsonObject('dry-run-plan.public.json'), noLiveExecution: false };
  assertPublicJsonWriteBlocked(
    'dry-run-plan.public.json',
    dryRunPlan,
    /invalid_boundary_value:root\.noLiveExecution/
  );
});

test('writeActivationRunnerFiles rejects dry-run steps with live payment booking provider claim fields', () => {
  const dryRunPlan = builderPublicJsonObject('dry-run-plan.public.json');
  dryRunPlan.steps[0].paymentCaptured = false;
  assertPublicJsonWriteBlocked(
    'dry-run-plan.public.json',
    dryRunPlan,
    /blocked_dry_run_step_claim_field:root\.steps\.0\.<unsafe_key>/
  );
});

test('writeActivationRunnerFiles rejects forbidden operational claim JSON and markdown before writing', () => {
  const claim = 'payment was captured';
  const jsonOut = tempOutputDir();
  try {
    assert.throws(() => writeActivationRunnerFiles({
      'activation-pack.public.json': publicJson({ status: claim, publicSafe: true })
    }, jsonOut), (error) => {
      assert.ok(error instanceof ActivationRunnerWriteBlockedError);
      assert.match(error.message, /blocked_forbidden_public_claim:root\.status/);
      assert.doesNotMatch(error.message, escapedPattern(claim));
      return true;
    });
    assertNoPartialFiles(jsonOut);
  } finally {
    cleanup(jsonOut);
  }

  const markdownOut = tempOutputDir();
  try {
    assert.throws(() => writeActivationRunnerFiles({
      'README_ACTIVATION_RUNNER.md': `Unsafe status: ${claim}.`
    }, markdownOut), (error) => {
      assert.ok(error instanceof ActivationRunnerWriteBlockedError);
      assert.match(error.message, /blocked_forbidden_public_claim:root\.content/);
      assert.doesNotMatch(error.message, escapedPattern(claim));
      return true;
    });
    assertNoPartialFiles(markdownOut);
  } finally {
    cleanup(markdownOut);
  }
});

test('generated negative safety values remain public-safe under forbidden claim scanning', () => {
  const evidencePack = buildActivationEvidencePack(capsuleV1ActivationPackFixture, {
    doctorReport: runActivationDoctor({ root: process.cwd(), activationPack: capsuleV1ActivationPackFixture })
  });
  const safetyMaterial = {
    status: 'no payment was captured',
    reasonCodes: ['dry_run_is_not_permission', 'runtime_authority_required', 'no_live_execution'],
    noPaymentWasCaptured: evidencePack.boundaryStatus.noPaymentWasCaptured,
    noProviderWasCalled: evidencePack.boundaryStatus.noProviderWasCalled,
    publicSafe: true
  };
  assert.deepEqual(collectUnsafePublicMaterial(safetyMaterial), []);
  assert.equal(assertPublicSafeOutput(evidencePack, 'activation-evidence-pack.public.json').publicSafe, true);
});

test('output root summary sanitizer does not echo URL-shaped values', () => {
  const rawUrl = 'https://unsafe.example/output';
  const summary = buildPublicOutputRootSummary(rawUrl);
  assert.equal(summary.outputRootMode, 'custom');
  assert.equal(summary.outputRootEchoed, false);
  assert.equal(summary.publicSafe, true);
  assertNoRawMaterial([summary], [rawUrl]);
});

test('CLI summaries do not echo unsafe output roots', () => {
  const rawEmail = ['operator', 'example.invalid'].join('@');
  const dryRunBase = tempOutputDir();
  const dryRunOut = join(dryRunBase, rawEmail);
  const rawToken = testPaymentValue(['sk', 'test']);
  const evidenceBase = tempOutputDir();
  const evidenceOut = join(evidenceBase, rawToken);
  try {
    const dryRunSummary = runActivationCli('scripts/capsule-activation-dry-run.mjs', ['--output', dryRunOut]);
    assert.equal(dryRunSummary.publicSafe, true);
    assert.equal(dryRunSummary.outputRootEchoed, false);
    assertNoRawMaterial([dryRunSummary], [rawEmail, dryRunOut]);

    const evidenceSummary = runActivationCli('scripts/capsule-activation-evidence.mjs', ['--output', evidenceOut]);
    assert.equal(evidenceSummary.publicSafe, true);
    assert.equal(evidenceSummary.outputRootEchoed, false);
    assertNoRawMaterial([evidenceSummary], [rawToken, evidenceOut]);
  } finally {
    cleanup(dryRunBase);
    cleanup(evidenceBase);
  }
});

test('buildActivationRunnerWritableFiles propagates requested root into evidence generation', () => {
  const repoRoot = process.cwd();
  const nonRepoCwd = tempOutputDir();
  try {
    process.chdir(nonRepoCwd);
    const files = buildActivationRunnerWritableFiles(capsuleV1ActivationPackFixture, { root: repoRoot });
    const evidence = JSON.parse(files['activation-evidence-pack.public.json']);
    assert.equal(evidence.doctorStatus, 'passed');
    assert.equal(evidence.launcherStatusSummary.evidencePackReady, true);
  } finally {
    process.chdir(repoRoot);
    cleanup(nonRepoCwd);
  }
});
