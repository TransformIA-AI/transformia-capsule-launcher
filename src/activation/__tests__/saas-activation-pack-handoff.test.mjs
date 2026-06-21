import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  buildActivationPackFileManifest,
  buildCaseZeroActivationIntentFixture,
  buildDefaultSaaSActivationIntent,
  buildSaaSActivationPack,
  buildV09FreezeCandidateSummary,
  computeActivationPackFingerprint,
  computeStableChecksum,
  containsSensitivePublicInput,
  normalizeActivationIntentRoute,
  validateActivationIntent,
  validateSaaSActivationPack
} from '../saas-activation-pack-handoff.mjs';
import {
  ActivationPackWriteBlockedError,
  buildActivationPackWritableFiles,
  writeSaaSActivationPack
} from '../saas-activation-pack-writer.mjs';

function tempOutputDir() { return mkdtempSync(join(tmpdir(), 'transformia-l01-')); }
function cleanup(path) { rmSync(path, { recursive: true, force: true }); }

const expectedManifest = [
  'README_ACTIVATION_PACK.md',
  'activation-intent.public.json',
  'activation-pack.public.json',
  'byok-readiness.public.json',
  'commissioning-checklist.public.json',
  'organization-workspace-draft.public.json',
  'plan-trial-draft.public.json',
  'v0.9-freeze-candidate.public.json',
  'validation-report.public.json'
];

test('imports and executes activation helpers under node:test', () => {
  const intent = buildCaseZeroActivationIntentFixture();
  const intentReport = validateActivationIntent(intent);
  const pack = buildSaaSActivationPack(intent);
  assert.equal(intentReport.ok, true);
  assert.equal(pack.validationReport.ok, true);
  assert.equal(validateSaaSActivationPack(pack).ok, true);
  assert.equal(buildV09FreezeCandidateSummary(pack).status, 'freeze_candidate_ready');
  assert.equal(pack.publicSafeSummary.status, pack.validationReport.status);
  assert.equal(computeActivationPackFingerprint(pack), pack.fingerprint);
  assert.equal(computeStableChecksum({ b: 1, a: 2 }), computeStableChecksum({ a: 2, b: 1 }));
});


test('blocks executable numeric PII-like public inputs', () => {
  for (const notesPublicSafe of ['123456789', '123-456-789', '123 456 789', '00000000A']) {
    assert.equal(containsSensitivePublicInput(notesPublicSafe), true);
    const report = validateActivationIntent(buildDefaultSaaSActivationIntent({ notesPublicSafe }));
    assert.equal(report.ok, false);
    assert.ok(report.blockers.includes('blocked_sensitive_input:notesPublicSafe'));
  }
  for (const field of ['contactRef', 'organizationDraftRef', 'workspaceDraftRef']) {
    const report = validateActivationIntent(buildDefaultSaaSActivationIntent({ [field]: '123456789' }));
    assert.equal(report.ok, false);
    assert.ok(report.blockers.includes(`blocked_sensitive_input:${field}`));
  }
  assert.equal(validateActivationIntent(buildCaseZeroActivationIntentFixture()).ok, true);
});

test('normalizes documented public route strings and blocks quarantined routes', () => {
  assert.equal(normalizeActivationIntentRoute('/capsule/pricing'), 'capsule_pricing');
  assert.equal(normalizeActivationIntentRoute('/capsule/demo'), 'capsule_demo');
  assert.equal(normalizeActivationIntentRoute('/diagnostico'), 'diagnostico');
  for (const route of ['/capsule/pricing', '/capsule/demo', '/diagnostico']) {
    assert.equal(validateActivationIntent(buildDefaultSaaSActivationIntent({ sourceRoute: route })).ok, true);
  }
  for (const route of ['/portal-vivo', '/case-zero']) {
    const report = validateActivationIntent(buildDefaultSaaSActivationIntent({ sourceRoute: route }));
    assert.equal(report.ok, false);
    assert.ok(report.blockers.includes('blocked_quarantined_route'));
  }
  assert.equal(validateActivationIntent(buildDefaultSaaSActivationIntent({ sourceRoute: '/unknown-public-route' })).ok, false);
});

test('blocked BYOK-ineligible packs are not freeze-ready', () => {
  for (const operatingPath of ['local_byok', 'enterprise_managed']) {
    const pack = buildSaaSActivationPack(buildDefaultSaaSActivationIntent({ operatingPath, selectedPlanCode: 'capsule_starter' }));
    assert.equal(pack.validationReport.ok, false);
    assert.equal(pack.readyForCommissioning, false);
    assert.ok(pack.validationReport.blockers.includes('blocked_plan_not_allowed'));
    assert.equal(buildV09FreezeCandidateSummary(pack).status, 'freeze_blocked');
    assert.notEqual(pack.publicSafeSummary.status, 'ready_for_operator_review');
  }
});

test('writer fails closed before serializing blocked sensitive packs', () => {
  const sensitive = 'sk_live_public_test_value_should_not_be_written';
  const blockedPack = buildSaaSActivationPack(buildDefaultSaaSActivationIntent({ notesPublicSafe: sensitive }));
  const out = tempOutputDir();
  try {
    assert.equal(blockedPack.validationReport.ok, false);
    assert.throws(() => buildActivationPackWritableFiles(blockedPack), ActivationPackWriteBlockedError);
    assert.throws(() => writeSaaSActivationPack(blockedPack, out), (error) => {
      assert.ok(error instanceof ActivationPackWriteBlockedError);
      assert.ok(error.blockers.includes('blocked_sensitive_input:notesPublicSafe'));
      assert.doesNotMatch(error.message, new RegExp(sensitive));
      return true;
    });
    assert.deepEqual(readdirSync(out), []);
  } finally { cleanup(out); }
});

test('writer writes zero files for URL refs and BYOK blocked plans', () => {
  const cases = [
    buildDefaultSaaSActivationIntent({ organizationDraftRef: 'https://example.invalid/raw' }),
    buildDefaultSaaSActivationIntent({ operatingPath: 'local_byok', selectedPlanCode: 'capsule_starter' })
  ];
  for (const intent of cases) {
    const pack = buildSaaSActivationPack(intent);
    const out = tempOutputDir();
    try {
      assert.equal(pack.validationReport.ok, false);
      assert.throws(() => writeSaaSActivationPack(pack, out), ActivationPackWriteBlockedError);
      assert.deepEqual(readdirSync(out), []);
    } finally { cleanup(out); }
  }
});


test('writer revalidates mutated packs at write time and writes zero files', () => {
  const mutated = buildSaaSActivationPack(buildCaseZeroActivationIntentFixture());
  mutated.intent.notesPublicSafe = '123456789';
  const out = tempOutputDir();
  try {
    assert.equal(mutated.validationReport.ok, true);
    assert.throws(() => buildActivationPackWritableFiles(mutated), (error) => {
      assert.ok(error instanceof ActivationPackWriteBlockedError);
      assert.ok(error.blockers.includes('blocked_sensitive_input:notesPublicSafe'));
      assert.doesNotMatch(error.message, /123456789/);
      return true;
    });
    assert.throws(() => writeSaaSActivationPack(mutated, out), ActivationPackWriteBlockedError);
    assert.deepEqual(readdirSync(out), []);
  } finally { cleanup(out); }
});

test('writer revalidates mutated draft refs before serialization', () => {
  const mutated = buildSaaSActivationPack(buildCaseZeroActivationIntentFixture());
  mutated.organizationWorkspaceDraft.organizationDraftId = 'https://evil.example/token';
  mutated.intent.organizationDraftRef = 'https://evil.example/token';
  const out = tempOutputDir();
  try {
    assert.throws(() => buildActivationPackWritableFiles(mutated), ActivationPackWriteBlockedError);
    assert.throws(() => writeSaaSActivationPack(mutated, out), (error) => {
      assert.ok(error instanceof ActivationPackWriteBlockedError);
      assert.ok(error.blockers.includes('blocked_sensitive_input:organizationDraftRef'));
      assert.doesNotMatch(error.message, /evil\.example|token/);
      return true;
    });
    assert.deepEqual(readdirSync(out), []);
  } finally { cleanup(out); }
});

test('writer writes only expected files for allowed Case Zero pack', () => {
  const pack = buildSaaSActivationPack(buildCaseZeroActivationIntentFixture());
  const out = tempOutputDir();
  try {
    const files = writeSaaSActivationPack(pack, out).map((file) => file.split('/').pop()).sort();
    assert.deepEqual(files, expectedManifest);
    assert.deepEqual(readdirSync(out).sort(), expectedManifest);
    const activationPack = JSON.parse(readFileSync(join(out, 'activation-pack.public.json'), 'utf8'));
    assert.equal(activationPack.validationReport.status, activationPack.publicSafeSummary.status);
    const joined = readdirSync(out).map((file) => readFileSync(join(out, file), 'utf8')).join('\n');
    assert.doesNotMatch(joined, /sk_live|api[_-]?key|access[_-]?token|BEGIN PRIVATE KEY/i);
  } finally { cleanup(out); }
});

test('writer path traversal guard still fails closed', () => {
  const pack = buildSaaSActivationPack(buildCaseZeroActivationIntentFixture());
  assert.throws(() => writeSaaSActivationPack(pack, '../outside-activation-pack'), /explicit_safe_output_root_required/);
});

test('package test exercises executable module path rather than source scan only', () => {
  assert.equal(buildActivationPackFileManifest().length, expectedManifest.length);
  assert.equal(typeof buildSaaSActivationPack, 'function');
  assert.equal(typeof writeSaaSActivationPack, 'function');
});
