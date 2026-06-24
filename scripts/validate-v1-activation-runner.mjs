import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  ActivationRunnerWriteBlockedError,
  V1_ACTIVATION_RUNNER_REQUIRED_FILES,
  V1_ACTIVATION_RUNNER_REQUIRED_SCRIPTS,
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
  validateActivationRunnerWritableFileMap,
  validateV1ActivationPack,
  writeActivationRunnerFiles,
  writeActivationRunnerEvidencePack
} from '../src/activation/v1-activation-runner.mjs';

const root = process.cwd();
const runtimeEnv = globalThis.process?.env ?? {};
const errors = [];
const fail = (message) => errors.push(message);
const exists = (path) => existsSync(join(root, path));
const read = (path) => readFileSync(join(root, path), 'utf8');
const normalize = (path) => path.replaceAll('\\', '/');

const requiredDocs = [
  'docs/v1-activation-runner/CAPSULE_LAUNCHER_V1_ACTIVATION_RUNNER_HANDOFF.md',
  'docs/v1-activation-runner/CAPSULE_LAUNCHER_V1_CONTRACT_MATRIX.md',
  'docs/v1-activation-runner/CAPSULE_LAUNCHER_V1_OPERATOR_GUIDE.md',
  'docs/v1-activation-runner/CAPSULE_LAUNCHER_V1_SCOPE_APPROVAL.md'
];
const requiredScripts = [
  'scripts/capsule-activation-validate.mjs',
  'scripts/capsule-activation-doctor.mjs',
  'scripts/capsule-activation-dry-run.mjs',
  'scripts/capsule-activation-evidence.mjs',
  'scripts/validate-v1-activation-runner.mjs'
];
const requiredSource = [
  'src/activation/v1-activation-runner.mjs',
  'src/activation/v1-activation-runner.ts',
  'src/activation/fixtures/capsule-v1-activation-pack.fixture.mjs',
  'src/activation/__tests__/v1-activation-runner.test.mjs'
];

for (const file of [...V1_ACTIVATION_RUNNER_REQUIRED_FILES, ...requiredDocs, ...requiredScripts, ...requiredSource, 'PR_BODY_CAPSULE_LAUNCHER_V1_ACTIVATION_RUNNER.md']) {
  if (!exists(file)) fail(`missing required file: ${file}`);
}

let packageJson = {};
try {
  packageJson = JSON.parse(read('package.json'));
} catch (error) {
  fail(`package.json must parse as JSON: ${error.message}`);
}
for (const [name, command] of Object.entries(V1_ACTIVATION_RUNNER_REQUIRED_SCRIPTS)) {
  if (packageJson.scripts?.[name] !== command) fail(`package script mismatch: ${name}`);
}
if (!packageJson.scripts?.quality?.includes('validate:v1-activation-runner')) fail('quality must include validate:v1-activation-runner');
if (!packageJson.scripts?.test?.includes('v1-activation-runner.test.mjs')) fail('npm test must execute v1 activation runner tests');
if (!read('.gitignore').includes('.capsule-local/')) fail('.gitignore must ignore .capsule-local/');

const source = exists('src/activation/v1-activation-runner.mjs') ? read('src/activation/v1-activation-runner.mjs') : '';
const activationRunnerTestSource = exists('src/activation/__tests__/v1-activation-runner.test.mjs') ? read('src/activation/__tests__/v1-activation-runner.test.mjs') : '';
for (const exported of [
  'buildDefaultV1ActivationPack',
  'validateV1ActivationPack',
  'collectUnsafePublicMaterial',
  'assertPublicSafeOutput',
  'validateActivationRunnerWritableFileMap',
  'buildCanonicalPublicV1ActivationPack',
  'buildLocalWorkspaceSkeleton',
  'runActivationDoctor',
  'buildDryRunActivationPlan',
  'buildActivationEvidencePack',
  'buildConsoleHandoffSummary',
  'writeActivationRunnerFiles',
  'writeActivationRunnerEvidencePack',
  'writeActivationRunnerDryRun',
  'computeActivationPackFingerprint'
]) {
  if (!source.includes(`export function ${exported}`)) fail(`missing exported runner helper: ${exported}`);
}
for (const phrase of [
  'dryRunIsNotPermission',
  'noProviderConnection',
  'noPaymentCapture',
  'noOutboundMessaging',
  'noCalendarBooking',
  'runtimeAuthorityRequired',
  'provider_commissioning_required',
  "buildSafeDerivedId('dad'",
  'collectUnsafePublicMaterial',
  'buildCanonicalPublicV1ActivationPack',
  'assertPublicSafeOutput',
  'validateActivationRunnerWritableFileMap',
  'validateDoctorReportOverride',
  'blocked_doctor_report_override',
  'blocked_file_content'
]) {
  if (!source.includes(phrase)) fail(`runner source missing required safety token: ${phrase}`);
}
const writeActivationRunnerFilesSource = source.slice(
  source.indexOf('export function writeActivationRunnerFiles'),
  source.indexOf('export function writeActivationRunnerEvidencePack')
);
const sinkValidatorIndex = writeActivationRunnerFilesSource.indexOf('validateActivationRunnerWritableFileMap');
const sinkMkdirIndex = writeActivationRunnerFilesSource.indexOf('mkdirSync');
const sinkWriteIndex = writeActivationRunnerFilesSource.indexOf('writeFileSync');
if (sinkValidatorIndex === -1 || sinkMkdirIndex === -1 || sinkWriteIndex === -1 || sinkValidatorIndex > sinkMkdirIndex || sinkValidatorIndex > sinkWriteIndex) {
  fail('writeActivationRunnerFiles must validate the full file map before mkdirSync/writeFileSync');
}
if (!source.includes("buildActivationEvidencePack(canonicalPack, { root, doctorReport })")) {
  fail('buildActivationRunnerWritableFiles must pass root into buildActivationEvidencePack');
}
if (source.includes("'activation-pack.public.json': publicJson(pack)") || source.includes('"activation-pack.public.json": publicJson(pack)')) {
  fail('runner writer must not serialize raw activation pack');
}
if (!source.includes("'activation-pack.public.json': publicJsonOutput('activation-pack.public.json', canonicalPack)")) {
  fail('runner writer must serialize canonical activation pack through final guard');
}
if (source.includes('options.validationReport ??') || source.includes('options.dryRunPlan ??') || source.includes('options.localWorkspaceSkeleton ??') || source.includes('options.consoleHandoffSummary ??')) {
  fail('evidence builder must recompute validation, dry-run, skeleton and handoff surfaces instead of trusting overrides');
}
for (const phrase of [
  'invalid pack with fake validation report cannot mark evidence ready',
  'invalid pack with fake passed doctor report cannot mark evidence ready',
  'invalid pack with fake ready dry-run plan cannot propagate ready status',
  'invalid pack with fake console handoff cannot propagate prepared launcher status',
  'invalid pack with fake workspace skeleton cannot propagate prepared workspace',
  'unsafe doctor report overrides cannot inject public evidence details',
  'activation pack validation scans object keys without echoing unsafe key material',
  'unknown activation pack fields fail closed and never reach canonical public output',
  'writeActivationRunnerFiles rejects unsafe JSON string content before writing',
  'writeActivationRunnerFiles rejects test payment prefix JSON content before writing',
  'writeActivationRunnerFiles rejects unsafe markdown content before writing',
  'writeActivationRunnerFiles rejects test payment prefix markdown content before writing',
  'writeActivationRunnerFiles rejects JSON object key PII before writing',
  'writeActivationRunnerFiles writes no partial files when test payment prefix content is present',
  'writeActivationRunnerFiles validates all files before writing partial output',
  'buildActivationRunnerWritableFiles propagates requested root into evidence generation'
]) {
  if (!activationRunnerTestSource.includes(phrase)) fail(`activation runner tests missing adversarial case: ${phrase}`);
}

const docs = requiredDocs.filter(exists).map(read).join('\n');
for (const phrase of [
  'dry-run is not permission',
  'Runtime remains authority',
  'No provider credentials',
  'No customer PII',
  'No payment capture',
  'No outbound messaging',
  'No calendar booking',
  'No provisioning',
  'DAD',
  'future console handoff'
]) {
  if (!docs.includes(phrase)) fail(`docs missing required phrase: ${phrase}`);
}

const prBody = exists('PR_BODY_CAPSULE_LAUNCHER_V1_ACTIVATION_RUNNER.md') ? read('PR_BODY_CAPSULE_LAUNCHER_V1_ACTIVATION_RUNNER.md') : '';
const agents = exists('AGENTS.md') ? read('AGENTS.md') : '';
const scopeApprovalDoc = exists('docs/v1-activation-runner/CAPSULE_LAUNCHER_V1_SCOPE_APPROVAL.md') ? read('docs/v1-activation-runner/CAPSULE_LAUNCHER_V1_SCOPE_APPROVAL.md') : '';
for (const heading of ['Summary', 'What changed', 'Commands/scripts added', 'Safety boundaries', 'Tests/validators run', 'Not included', 'Risks/trade-offs', 'Follow-up recommendations']) {
  if (!prBody.includes(`## ${heading}`)) fail(`PR body missing section: ${heading}`);
}
if (!prBody.includes('## Exact Atlas Entry / Dani Approval')) fail('PR body must include Exact Atlas Entry / Dani Approval section');
for (const staleCount of ['26 tests', '42 tests']) {
  if (prBody.includes(staleCount)) fail(`PR body contains stale ${staleCount} count`);
}
if (!prBody.includes('npm run -s test') || !/`npm run -s test`\s+passed/i.test(prBody)) {
  fail('PR body must report npm run -s test passed without requiring a hardcoded count');
}
for (const phrase of [
  'v1.0-LAUNCHER-ACTIVATION-RUNNER',
  'Dani explicitly approves',
  'Runtime decides',
  'Launcher prepares',
  'Public output canonicalization rule'
]) {
  if (!agents.includes(phrase)) fail(`AGENTS.md missing current v1 gate phrase: ${phrase}`);
}
for (const phrase of [
  'Capsule Launcher v1 Activation Runner',
  'Dani explicitly approved',
  'Runtime decides',
  'Launcher prepares',
  'Web remains separate',
  'No Runtime changes',
  'No Web changes'
]) {
  if (!scopeApprovalDoc.includes(phrase)) fail(`scope approval doc missing phrase: ${phrase}`);
}

function stripAllowedSafeClaims(text) {
  let next = text;
  for (const pattern of [
    /\bno live execution\b/gi,
    /\blive execution disabled\b/gi,
    /\bdry-run is not permission\b/gi,
    /\bruntime remains authority\b/gi,
    /\bno provider was called\b/gi,
    /\bno booking was created\b/gi,
    /\bno payment was captured\b/gi,
    /\bno outbound message was sent\b/gi,
    /\bno provisioning was performed\b/gi,
    /\bdoes not call providers\b/gi,
    /\bdoes not create bookings\b/gi,
    /\bdoes not capture payment\b/gi,
    /\bdoes not send outbound messages\b/gi,
    /\bdoes not provision runtime state\b/gi,
    /\bnot production live\b/gi,
    /\bNever commit customer data\b/gi,
    /\bdoes not grant rights[^.]*customer data[^.]*\./gi,
    /\bNo customer PII\b/gi,
    /\bautonomous execution without governance\b/gi
  ]) {
    next = next.replace(pattern, '');
  }
  return next;
}

function assertNoForbiddenClaims(text, context) {
  const scan = stripAllowedSafeClaims(text);
  for (const pattern of [
    /\blive execution enabled\b/i,
    /\bprovider was called\b/i,
    /\bbooking was created\b/i,
    /\bpayment was captured\b/i,
    /\boutbound message was sent\b/i,
    /\bprovisioning complete\b/i,
    /\bready for production\b/i,
    /\bproduction activation\b/i,
    /\bcustomer data\b/i,
    /\bprovider credential\b/i,
    /\bautonomous execution without governance\b/i
  ]) {
    if (pattern.test(scan)) fail(`forbidden claim found in ${context}: ${pattern}`);
  }
}

const secretPatterns = [
  new RegExp(`${'(^|[^A-Za-z0-9_])(?:s|p|r)k_'}(?:test|live)_[A-Za-z0-9_]{12,}`, 'i'),
  new RegExp(`${'(^|[^A-Za-z0-9_])wh' + 'sec_'}[A-Za-z0-9_]{12,}`, 'i'),
  new RegExp(`${'gh' + 'p_'}[A-Za-z0-9_]{20,}`, 'i'),
  /AKIA[0-9A-Z]{16}/,
  new RegExp(`BEGIN (RSA |EC |OPENSSH |PRIVATE )?PRIVATE KEY`),
  /(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|credential|private[_-]?key)\s*[:=]\s*['"]?[A-Za-z0-9._-]{8,}/i
];
const piiPatterns = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /(?:\+\d[\d .-]{7,}\d|\b\d{3}[-. ]\d{3}[-. ]\d{3,4}\b)/
];

function git(args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim().split(/\r?\n/).filter(Boolean).map(normalize) : [];
}

function gitScalar(args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : '';
}

function baseCandidates() {
  const candidates = [];
  const add = (candidate) => {
    if (candidate && !candidates.includes(candidate)) candidates.push(candidate);
  };
  if (runtimeEnv.GITHUB_BASE_REF) {
    add(`origin/${runtimeEnv.GITHUB_BASE_REF}`);
    add(runtimeEnv.GITHUB_BASE_REF);
  }
  add(runtimeEnv.CI_MERGE_BASE);
  if (runtimeEnv.GITHUB_SHA) add(`${runtimeEnv.GITHUB_SHA}^`);
  add('origin/main');
  add('main');
  add('HEAD^');
  return candidates;
}

function resolveDiffBase(candidates = baseCandidates()) {
  for (const candidate of candidates) {
    const mergeBase = gitScalar(['merge-base', 'HEAD', candidate]);
    if (mergeBase) return { candidate, diffBase: mergeBase, method: 'merge-base' };
    const resolved = gitScalar(['rev-parse', '--verify', candidate]);
    if (resolved) return { candidate, diffBase: candidate, method: 'rev-parse' };
  }
  return null;
}

function changedFiles(options = {}) {
  const changed = new Set();
  const resolvedBase = resolveDiffBase(options.candidates ?? baseCandidates());
  if (resolvedBase) {
    for (const file of git(['diff', '--name-only', `${resolvedBase.diffBase}...HEAD`])) changed.add(file);
    if (!changed.size) {
      for (const file of git(['diff', '--name-only', `${resolvedBase.diffBase}..HEAD`])) changed.add(file);
    }
  }
  for (const file of git(['diff', '--name-only'])) changed.add(file);
  for (const file of git(['diff', '--name-only', '--cached'])) changed.add(file);
  for (const file of git(['ls-files', '--others', '--exclude-standard'])) changed.add(file);
  return [...changed];
}

function runChangedFileBaseSelfChecks() {
  const withBaseRef = (() => {
    const previous = runtimeEnv.GITHUB_BASE_REF;
    runtimeEnv.GITHUB_BASE_REF = 'main';
    const candidates = baseCandidates();
    if (typeof previous === 'undefined') delete runtimeEnv.GITHUB_BASE_REF;
    else runtimeEnv.GITHUB_BASE_REF = previous;
    return candidates;
  })();
  if (withBaseRef[0] !== 'origin/main' || withBaseRef[1] !== 'main') fail('base candidate self-check missing GITHUB_BASE_REF origin/local order');
  const defaultCandidates = baseCandidates();
  for (const candidate of ['origin/main', 'main', 'HEAD^']) {
    if (!defaultCandidates.includes(candidate)) fail(`base candidate self-check missing fallback: ${candidate}`);
  }
  const fallbackOnly = changedFiles({ candidates: ['refs/heads/definitely_missing_v1_activation_runner_base'] });
  if (!Array.isArray(fallbackOnly)) fail('changed-file fallback self-check must return an array');
}

runChangedFileBaseSelfChecks();
const changed = changedFiles();
if (!changed.length) fail('changed-file guard found no files');
for (const file of changed) {
  if (file === '.env' || (file.startsWith('.env.') && file !== '.env.example')) fail(`forbidden env file changed: ${file}`);
  if (!exists(file)) continue;
  const isValidatorSelf = file === 'scripts/validate-v1-activation-runner.mjs';
  const isValidatorScript = file.startsWith('scripts/validate-');
  const text = read(file);
  const forbiddenShortName = new RegExp(`\\b${'D' + 'AF'}\\b`);
  const forbiddenLegacyName = new RegExp(`\\b(?:${'CL' + 'AW'}|${'HER' + 'MES'})\\b`, 'i');
  if (!isValidatorScript && forbiddenShortName.test(text)) fail(`forbidden DAD typo term found: ${file}`);
  if (!isValidatorScript && forbiddenLegacyName.test(text)) fail(`forbidden legacy local name found: ${file}`);
  const externalTerms = ['fe' + 'tch(', 'ax' + 'ios', 'su' + 'pabase', 'fi' + 'rebase', 'post' + 'gres', 'my' + 'sql', 'mongo' + 'db'];
  if (!isValidatorScript && externalTerms.some((term) => text.toLowerCase().includes(term))) fail(`changed file introduces external implementation surface: ${file}`);
  if (!file.includes('__tests__/') && !isValidatorScript) {
    for (const pattern of secretPatterns) if (pattern.test(text)) fail(`changed file contains secret-shaped material: ${file}`);
    for (const pattern of piiPatterns) if (pattern.test(text)) fail(`changed file contains PII-shaped material: ${file}`);
  }
  if (!isValidatorScript) assertNoForbiddenClaims(text, file);
}

assertNoForbiddenClaims(docs, 'docs/v1-activation-runner');
assertNoForbiddenClaims(prBody, 'PR body');

const validPack = buildDefaultV1ActivationPack();
const validReport = validateV1ActivationPack(validPack);
if (!validReport.ok) fail(`valid fixture pack failed validation: ${validReport.blockers.join(',')}`);

const unsafeRefReport = validateV1ActivationPack(buildDefaultV1ActivationPack({ workspaceRef: 'https://unsafe.example/workspace' }));
if (unsafeRefReport.ok || !unsafeRefReport.blockers.includes('blocked_live_endpoint:root.workspaceRef')) fail('unsafe ref fixture did not fail');

const secretLikeFixture = 'api' + '_key=abc12345678';
const secretReport = validateV1ActivationPack(buildDefaultV1ActivationPack({ operatorNote: secretLikeFixture }));
if (secretReport.ok || !secretReport.blockers.includes('blocked_secret_like_value:root.operatorNote')) fail('secret-like fixture did not fail');
try {
  buildActivationRunnerWritableFiles(buildDefaultV1ActivationPack({ operatorNote: secretLikeFixture }));
  fail('writer serialized secret-like pack');
} catch (error) {
  if (!(error instanceof ActivationRunnerWriteBlockedError)) fail(`writer must throw ActivationRunnerWriteBlockedError, got ${error.name}`);
  if (/abc12345678/.test(error.message)) fail('writer leaked raw secret-like fixture value');
}

const objectKeyEmail = ['customer', 'example.invalid'].join('@');
const objectKeyUrl = ['ht', 'tps://unsafe.example'].join('');
const objectKeyToken = `${'gh' + 'p_'}aaaaaaaaaaaaaaaaaaaaaaaa`;
const objectSensitiveKey = ['api', '_', 'key'].join('');
for (const [pack, expectedBlocker, raw] of [
  [buildDefaultV1ActivationPack({ review: { [`[${objectKeyEmail}](mailto:${objectKeyEmail})`]: 'ok' } }), 'blocked_unsafe_key_name:root.review.<unsafe_key>', objectKeyEmail],
  [buildDefaultV1ActivationPack({ review: { [objectKeyUrl]: 'ok' } }), 'blocked_unsafe_key_name:root.review.<unsafe_key>', objectKeyUrl],
  [buildDefaultV1ActivationPack({ review: { [objectSensitiveKey]: 'ok' } }), 'blocked_sensitive_key_name:root.review.<unsafe_key>', objectSensitiveKey],
  [buildDefaultV1ActivationPack({ review: { [objectKeyToken]: 'ok' } }), 'blocked_unsafe_key_name:root.review.<unsafe_key>', objectKeyToken]
]) {
  const report = validateV1ActivationPack(pack);
  if (report.ok || !report.blockers.includes(expectedBlocker)) fail(`object key public-safety fixture did not fail: ${expectedBlocker}`);
  const outputs = [
    report,
    runActivationDoctor({ root, activationPack: pack }),
    buildDryRunActivationPlan(pack),
    buildLocalWorkspaceSkeleton(pack),
    buildActivationEvidencePack(pack),
    buildConsoleHandoffSummary(pack)
  ];
  if (outputs.some((output) => JSON.stringify(output).includes(raw))) fail('object key unsafe material leaked into public output');
  try {
    buildActivationRunnerWritableFiles(pack, { root });
    fail('writer serialized pack with unsafe object key');
  } catch (error) {
    if (!(error instanceof ActivationRunnerWriteBlockedError)) fail(`writer must block unsafe object key pack, got ${error.name}`);
    if (error.message.includes(raw)) fail('writer leaked unsafe object key material in error');
  }
}

const unknownFieldReport = validateV1ActivationPack(buildDefaultV1ActivationPack({ extraOperatorPayload: 'ok' }));
if (unknownFieldReport.ok || !unknownFieldReport.blockers.includes('unknown_activation_pack_field:root.extraOperatorPayload')) fail('unknown top-level activation pack field did not fail closed');
try {
  buildCanonicalPublicV1ActivationPack(buildDefaultV1ActivationPack({ extraOperatorPayload: 'ok' }));
  fail('canonical pack builder accepted unknown top-level field');
} catch (error) {
  if (!(error instanceof ActivationRunnerWriteBlockedError)) fail(`canonical pack builder must throw ActivationRunnerWriteBlockedError, got ${error.name}`);
}

const unsafePublicRef = 'https://unsafe.example/activation/raw-id';
const unsafePublicRefPack = buildDefaultV1ActivationPack({
  activationPackId: unsafePublicRef,
  workspaceRef: unsafePublicRef,
  tenantDraftId: unsafePublicRef,
  organizationRef: unsafePublicRef
});
const unsafePublicRefOutputs = [
  runActivationDoctor({ root, activationPack: unsafePublicRefPack }),
  buildDryRunActivationPlan(unsafePublicRefPack),
  buildLocalWorkspaceSkeleton(unsafePublicRefPack),
  buildActivationEvidencePack(unsafePublicRefPack),
  buildConsoleHandoffSummary(unsafePublicRefPack)
];
for (const output of unsafePublicRefOutputs) {
  if (JSON.stringify(output).includes(unsafePublicRef)) fail('unsafe activation ref leaked into public output');
}

function assertInvalidEvidenceOverrideDoesNotBecomeReady(label, pack, options, rawValues = []) {
  const evidence = buildActivationEvidencePack(pack, options);
  const text = JSON.stringify(evidence);
  if (evidence.validationReport.ok !== false) fail(`${label}: invalid pack was not reflected in evidence validation report`);
  if (evidence.launcherStatusSummary.evidencePackReady !== false) fail(`${label}: fake override marked evidence ready`);
  if (evidence.dryRunStatus === 'dry_run_ready_no_live_execution') fail(`${label}: fake override propagated dry-run ready status`);
  if (evidence.consoleHandoffSummary.launcherStatus === 'activation_prepared_for_review') fail(`${label}: fake override propagated prepared launcher status`);
  if (evidence.launcherStatusSummary.localWorkspacePrepared === true) fail(`${label}: fake override propagated prepared workspace`);
  if (evidence.doctorStatus === 'passed') fail(`${label}: fake override propagated passed doctor status`);
  for (const raw of rawValues) {
    if (text.includes(raw)) fail(`${label}: raw unsafe override/ref leaked into evidence`);
  }
}

assertInvalidEvidenceOverrideDoesNotBecomeReady(
  'fake validation report',
  buildDefaultV1ActivationPack({ activationPackId: unsafePublicRef }),
  { validationReport: { ok: true, status: 'valid_public_safe_activation_pack', blockers: [], publicSafe: true } },
  [unsafePublicRef]
);
assertInvalidEvidenceOverrideDoesNotBecomeReady(
  'fake passed doctor report',
  buildDefaultV1ActivationPack({ workspaceRef: unsafePublicRef }),
  { doctorReport: { status: 'passed', checks: [], blockedReasonCodes: [], publicSafe: true } },
  [unsafePublicRef]
);
assertInvalidEvidenceOverrideDoesNotBecomeReady(
  'fake ready dry-run plan',
  buildDefaultV1ActivationPack({ tenantDraftId: unsafePublicRef }),
  { dryRunPlan: { dryRunPlanId: 'dry_run_plan_fake_ready', status: 'dry_run_ready_no_live_execution', steps: [], publicSafe: true } },
  [unsafePublicRef, 'dry_run_plan_fake_ready']
);
assertInvalidEvidenceOverrideDoesNotBecomeReady(
  'fake prepared handoff',
  buildDefaultV1ActivationPack({ organizationRef: unsafePublicRef }),
  { consoleHandoffSummary: { launcherStatus: 'activation_prepared_for_review', evidencePackReady: true, localWorkspacePrepared: true, publicSafe: true } },
  [unsafePublicRef]
);
assertInvalidEvidenceOverrideDoesNotBecomeReady(
  'fake prepared workspace',
  buildDefaultV1ActivationPack({ workspaceRef: unsafePublicRef }),
  { localWorkspaceSkeleton: { localWorkspaceId: 'local_workspace_fake_prepared', status: 'workspace_skeleton_prepared', publicSafe: true } },
  [unsafePublicRef, 'local_workspace_fake_prepared']
);

const hostileBoundaryUrl = ['ht', 'tps://unsafe.example/boundary-support'].join('');
const hostileBoundaryValue = 'abc12345678';
const hostileBoundaryEmail = ['person', 'example.invalid'].join('@');
const hostileBoundaryKey = ['api', '_', 'key'].join('');
const hostileBoundaryPack = buildDefaultV1ActivationPack({
  boundaries: {
    supportUrl: hostileBoundaryUrl,
    [hostileBoundaryKey]: hostileBoundaryValue,
    customerEmail: `[${hostileBoundaryEmail}](mailto:${hostileBoundaryEmail})`
  }
});
const hostileBoundarySkeleton = buildLocalWorkspaceSkeleton(hostileBoundaryPack);
const hostileBoundaryEvidence = buildActivationEvidencePack(hostileBoundaryPack);
const hostileBoundaryHandoff = buildConsoleHandoffSummary(hostileBoundaryPack);
for (const output of [hostileBoundarySkeleton, hostileBoundaryEvidence, hostileBoundaryHandoff]) {
  const text = JSON.stringify(output);
  for (const raw of [hostileBoundaryUrl, hostileBoundaryValue, hostileBoundaryEmail]) {
    if (text.includes(raw)) fail('hostile boundary payload leaked into public output');
  }
}
for (const [key, value] of Object.entries(hostileBoundarySkeleton.boundaries ?? {})) {
  if (!['noLiveExecution', 'noProviderConnection', 'noSecrets', 'noPaymentCapture', 'noOutboundMessaging', 'noCalendarBooking', 'noProvisioning', 'runtimeAuthorityRequired', 'dryRunIsNotPermission', 'publicSafe'].includes(key) || typeof value !== 'boolean') {
    fail(`public boundary skeleton emitted unexpected key/value: ${key}`);
  }
}

const liveSnakeKey = ['live', '_', 'execution', '_', 'enabled'].join('');
const bookingSnakeKey = ['booking', '_', 'created'].join('');
const providerEndpointKey = ['provider', '_', 'endpoint'].join('');
for (const [key, value] of [[liveSnakeKey, true], [bookingSnakeKey, true], [providerEndpointKey, 'provider_placeholder']]) {
  const report = validateV1ActivationPack(buildDefaultV1ActivationPack({ nestedLiveSurface: [{ [key]: value }] }));
  if (report.ok || !report.blockers.includes('blocked_assertive_live_field:root.nestedLiveSurface.0.<unsafe_key>')) {
    fail(`normalized live/assertive key fixture did not fail: ${key}`);
  }
  if (JSON.stringify(report).includes(key)) fail(`normalized live/assertive key leaked into validation report: ${key}`);
}

const missingBoundaryReport = validateV1ActivationPack(buildDefaultV1ActivationPack({ boundaries: { noLiveExecution: false } }));
if (missingBoundaryReport.ok || !missingBoundaryReport.blockers.includes('missing_boundary:noLiveExecution')) fail('missing no-live boundary did not fail');

const dryRunPlan = buildDryRunActivationPlan(validPack);
if (dryRunPlan.status !== 'dry_run_ready_no_live_execution') fail('dry-run plan did not report no-live readiness');
if (!dryRunPlan.steps.every((step) => step.publicSafe === true && step.noLiveExecution === true && step.evidenceExpected)) fail('dry-run steps lack required safety shape');
if (!dryRunPlan.steps.some((step) => step.reasonCodes.includes('provider_commissioning_required'))) fail('dry-run plan lacks provider commissioning boundary');

const workspaceSkeleton = buildLocalWorkspaceSkeleton(validPack);
if (workspaceSkeleton.status !== 'workspace_skeleton_prepared') fail('workspace skeleton did not prepare fixture');
if (!workspaceSkeleton.files.every((file) => file.publicSafe === true && file.containsSecrets === false)) fail('workspace skeleton files are not public-safe');

const doctorReport = runActivationDoctor({ root, activationPack: validPack });
if (doctorReport.status !== 'passed') fail(`doctor did not pass fixture: ${doctorReport.blockedReasonCodes.join(',')}`);

const handoff = buildConsoleHandoffSummary(validPack);
if (handoff.publicSafe !== true || handoff.runtimeCommissioningRequired !== true || handoff.providerCommissioningRequired !== true) fail('console handoff missing public-safe commissioning boundaries');

const evidencePackA = buildActivationEvidencePack(validPack, { doctorReport, dryRunPlan, localWorkspaceSkeleton: workspaceSkeleton, consoleHandoffSummary: handoff });
const evidencePackB = buildActivationEvidencePack(validPack, { doctorReport, dryRunPlan, localWorkspaceSkeleton: workspaceSkeleton, consoleHandoffSummary: handoff });
if (JSON.stringify(evidencePackA) !== JSON.stringify(evidencePackB)) fail('evidence pack is not deterministic');
if (evidencePackA.activationPackFingerprint !== computeActivationPackFingerprint(validPack)) fail('evidence pack fingerprint mismatch');
for (const boundary of ['dry_run_is_not_permission', 'no_provider_was_called', 'no_booking_was_created', 'no_payment_was_captured', 'no_outbound_message_was_sent', 'runtime_remains_authority']) {
  if (!evidencePackA.explicitBoundaries.includes(boundary)) fail(`evidence pack missing boundary: ${boundary}`);
}
assertNoForbiddenClaims(JSON.stringify(evidencePackA), 'generated evidence pack');

const writableFiles = buildActivationRunnerWritableFiles(validPack, { root, doctorReport });
for (const expected of V1_ACTIVATION_RUNNER_WRITABLE_FILES) {
  if (!Object.hasOwn(writableFiles, expected)) fail(`writable output missing file: ${expected}`);
}
const canonicalPack = buildCanonicalPublicV1ActivationPack(validPack);
const emittedActivationPack = JSON.parse(writableFiles['activation-pack.public.json']);
if (JSON.stringify(emittedActivationPack) !== JSON.stringify(canonicalPack)) fail('writer emitted non-canonical activation pack');
for (const key of Object.keys(emittedActivationPack)) {
  if (!['activationPackId', 'tenantDraftId', 'workspaceRef', 'organizationRef', 'template', 'vertical', 'planPath', 'activationMode', 'runtimeMode', 'launcherMode', 'requestedChannels', 'boundaries', 'safetyFlags', 'generatedAt', 'publicSafe'].includes(key)) {
    fail(`canonical activation pack emitted unexpected key: ${key}`);
  }
}
const overrideEmail = ['person', 'example.invalid'].join('@');
for (const doctorOverride of [
  { status: 'passed', checks: [{ checkId: 'provider_health', status: 'passed', details: { customerEmail: `[${overrideEmail}](mailto:${overrideEmail})` } }], blockedReasonCodes: [], publicSafe: true },
  { status: 'passed', checks: [{ checkId: 'provider_health', status: 'passed', details: { accessToken: 'abc12345678' } }], blockedReasonCodes: [], publicSafe: true },
  { status: 'passed', checks: [{ checkId: 'provider_health', status: 'passed', details: { providerUrl: ['ht', 'tps://provider.example'].join('') } }], blockedReasonCodes: [], publicSafe: true }
]) {
  try {
    buildActivationRunnerWritableFiles(validPack, { root, doctorReport: doctorOverride });
    fail('writer accepted unsafe doctor report override');
  } catch (error) {
    if (!(error instanceof ActivationRunnerWriteBlockedError)) fail(`doctor override must throw ActivationRunnerWriteBlockedError, got ${error.name}`);
    if (/person|abc12345678|provider\.example|accessToken|customerEmail|providerUrl/.test(error.message)) fail('doctor override error leaked raw unsafe material');
  }
}
const guardEmail = ['guard', 'example.invalid'].join('@');
const guardIssues = collectUnsafePublicMaterial({ details: { [`[${guardEmail}](mailto:${guardEmail})`]: 'ok' } });
if (!guardIssues.includes('blocked_unsafe_key_name:root.details.<unsafe_key>')) fail('public material scanner did not detect unsafe object key');
try {
  assertPublicSafeOutput({ details: { customerEmail: guardEmail } }, 'validator_self_check');
  fail('public output final guard accepted unsafe object');
} catch (error) {
  if (!(error instanceof ActivationRunnerWriteBlockedError)) fail(`public output guard must throw ActivationRunnerWriteBlockedError, got ${error.name}`);
  if (error.message.includes(guardEmail)) fail('public output guard leaked raw unsafe value');
}
const sinkUrl = ['ht', 'tps://unsafe.example/sink'].join('');
try {
  validateActivationRunnerWritableFileMap({
    'activation-pack.public.json': `${JSON.stringify({ note: sinkUrl })}\n`
  }, V1_ACTIVATION_RUNNER_WRITABLE_FILES, 'validator_sink_self_check');
  fail('file-map sink validator accepted unsafe JSON content');
} catch (error) {
  if (!(error instanceof ActivationRunnerWriteBlockedError)) fail(`file-map sink validator must throw ActivationRunnerWriteBlockedError, got ${error.name}`);
  if (error.message.includes(sinkUrl)) fail('file-map sink validator leaked raw unsafe URL');
}
const testPaymentValues = [
  `${['sk', 'test'].join('_')}_${'a'.repeat(16)}`,
  `${['pk', 'test'].join('_')}_${'a'.repeat(16)}`,
  `${['rk', 'test'].join('_')}_${'a'.repeat(16)}`,
  `${['sk', 'live'].join('_')}_${'a'.repeat(16)}`,
  `${['pk', 'live'].join('_')}_${'a'.repeat(16)}`,
  `${['rk', 'live'].join('_')}_${'a'.repeat(16)}`,
  `${['wh', 'sec'].join('')}_${'a'.repeat(16)}`
];
for (const rawValue of testPaymentValues) {
  try {
    validateActivationRunnerWritableFileMap({
      'activation-pack.public.json': `${JSON.stringify({ status: rawValue, publicSafe: true })}\n`
    }, V1_ACTIVATION_RUNNER_WRITABLE_FILES, 'validator_payment_prefix_self_check');
    fail('file-map sink validator accepted payment prefix content');
  } catch (error) {
    if (!(error instanceof ActivationRunnerWriteBlockedError)) fail(`payment prefix sink validator must throw ActivationRunnerWriteBlockedError, got ${error.name}`);
    if (error.message.includes(rawValue)) fail('payment prefix sink validator leaked raw value');
  }
}
const markdownPaymentValue = testPaymentValues[0];
try {
  validateActivationRunnerWritableFileMap({
    'README_ACTIVATION_RUNNER.md': `public sink must block ${markdownPaymentValue}`
  }, V1_ACTIVATION_RUNNER_WRITABLE_FILES, 'validator_payment_markdown_self_check');
  fail('file-map sink validator accepted markdown payment prefix content');
} catch (error) {
  if (!(error instanceof ActivationRunnerWriteBlockedError)) fail(`markdown payment prefix sink validator must throw ActivationRunnerWriteBlockedError, got ${error.name}`);
  if (error.message.includes(markdownPaymentValue)) fail('markdown payment prefix sink validator leaked raw value');
}
const sinkOut = mkdtempSync(join(tmpdir(), 'transformia-v1-validator-sink-'));
try {
  writeActivationRunnerFiles({
    'README_ACTIVATION_RUNNER.md': 'Public-safe local activation output.\n',
    'activation-pack.public.json': `${JSON.stringify({ note: sinkUrl })}\n`
  }, sinkOut);
  fail('writeActivationRunnerFiles accepted unsafe content');
} catch (error) {
  if (!(error instanceof ActivationRunnerWriteBlockedError)) fail(`writeActivationRunnerFiles must throw ActivationRunnerWriteBlockedError, got ${error.name}`);
  if (error.message.includes(sinkUrl)) fail('writeActivationRunnerFiles leaked raw unsafe URL');
  if (readdirSync(sinkOut).length !== 0) fail('writeActivationRunnerFiles wrote partial files before validation completed');
} finally {
  rmSync(sinkOut, { recursive: true, force: true });
}
const originalCwd = process.cwd();
const nonRepoCwd = mkdtempSync(join(tmpdir(), 'transformia-v1-validator-root-'));
try {
  process.chdir(nonRepoCwd);
  const rootedFiles = buildActivationRunnerWritableFiles(validPack, { root });
  const rootedEvidence = JSON.parse(rootedFiles['activation-evidence-pack.public.json']);
  if (rootedEvidence.doctorStatus !== 'passed' || rootedEvidence.launcherStatusSummary?.evidencePackReady !== true) {
    fail('buildActivationRunnerWritableFiles did not propagate root into evidence generation');
  }
} finally {
  process.chdir(originalCwd);
  rmSync(nonRepoCwd, { recursive: true, force: true });
}
const writableText = Object.values(writableFiles).join('\n');
for (const pattern of secretPatterns) if (pattern.test(writableText)) fail(`writable output contains secret-shaped material: ${pattern}`);
for (const pattern of piiPatterns) if (pattern.test(writableText)) fail(`writable output contains PII-shaped material: ${pattern}`);
assertNoForbiddenClaims(writableText, 'writable output');

const out = mkdtempSync(join(tmpdir(), 'transformia-v1-validator-'));
try {
  const written = writeActivationRunnerEvidencePack(validPack, out, { root, doctorReport });
  if (written.length !== V1_ACTIVATION_RUNNER_WRITABLE_FILES.length) fail('writer did not emit expected file count');
  if (!readdirSync(out).includes('activation-evidence-pack.public.json')) fail('writer did not emit evidence pack file');
} finally {
  rmSync(out, { recursive: true, force: true });
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}
console.log('v1 activation runner validator passed.');
