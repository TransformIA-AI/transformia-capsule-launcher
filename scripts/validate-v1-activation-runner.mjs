import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
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
  buildPublicOutputRootSummary,
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
  'buildPublicOutputRootSummary',
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
  'validateCanonicalPublicFileObject',
  'blocked_public_file_schema',
  'DIGIT_ONLY_PHONE_VALUE_PATTERN',
  'numberToPublicDecimalIntegerString',
  'hasPhoneLikeValue',
  'hasNumericPhoneLikeValue',
  'collectCanonicalPublicSemanticIssues',
  'collectCanonicalActivationStatusSchemaIssues',
  'collectCanonicalConsoleHandoffReadinessIssues',
  'handoff_ready_mismatch',
  'handoff_last_dry_run_status_mismatch',
  'collectCanonicalDoctorReportSchemaIssues',
  'doctor_report_passed_with_blocked_checks',
  'doctor_report_blocked_without_evidence',
  'collectCanonicalFileMapConsistencyIssues',
  'alias_mismatch',
  'cross_file_doctor_status_mismatch',
  'cross_file_handoff_summary_mismatch',
  'assertNoSymlinkPathSegments',
  'assertNoFinalSymlinkTarget',
  'buildPreflightedWriteTargets',
  'blocked_symlink_path_segment',
  'blocked_final_symlink_target',
  'blocked_dry_run_step_claim_field',
  'collectBlockedEvidenceReadyClaimIssues',
  'evidence_ready_claim_for_blocked_activation',
  'validatedEntries',
  'const validatedFiles = validateActivationRunnerWritableFileMap',
  'invalid_boundary_value',
  'invalid_disabled_value',
  'FORBIDDEN_PUBLIC_CLAIM_VALUE_PATTERNS',
  'blocked_forbidden_public_claim',
  'buildPublicOutputRootSummary',
  'validateDoctorReportOverride',
  'blocked_doctor_report_override',
  'doctorPassed',
  'blocked_doctor_not_passed',
  'blocked_doctor_not_run',
  'doctor_not_passed',
  'doctor_not_run',
  "options.doctorStatus ?? options.doctorReport?.status ?? 'not_run'",
  'buildConsoleHandoffSummary(pack, { doctorReport, doctorStatus })',
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
const dryRunCliSource = exists('scripts/capsule-activation-dry-run.mjs') ? read('scripts/capsule-activation-dry-run.mjs') : '';
const evidenceCliSource = exists('scripts/capsule-activation-evidence.mjs') ? read('scripts/capsule-activation-evidence.mjs') : '';
for (const [label, cliSource] of [
  ['dry-run CLI', dryRunCliSource],
  ['evidence CLI', evidenceCliSource]
]) {
  if (!cliSource.includes('buildPublicOutputRootSummary(outputRoot)')) fail(`${label} must summarize outputRoot without echoing raw values`);
  if (!cliSource.includes('assertPublicSafeOutput({')) fail(`${label} must pass JSON summary through assertPublicSafeOutput`);
  if (/(^|\n)\s*outputRoot\s*,/.test(cliSource) || /\boutputRoot\s*:/.test(cliSource)) fail(`${label} must not print raw outputRoot in its JSON summary`);
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
  'writeActivationRunnerFiles rejects digit-only phone values in public JSON before writing',
  'writeActivationRunnerFiles rejects numeric phone values in public JSON before writing',
  'writeActivationRunnerFiles rejects numeric phone values in canonical public fields',
  'writeActivationRunnerFiles allows small numeric public counters',
  'writeActivationRunnerFiles rejects digit-only phone values in canonical evidence strings',
  'writeActivationRunnerFiles rejects digit-only phone markdown without echoing raw value',
  'writeActivationRunnerFiles still rejects plus-prefixed and separated phone values',
  'digit-only phone detector does not block generated public-safe outputs or identifiers',
  'writeActivationRunnerFiles writes no partial files when test payment prefix content is present',
  'writeActivationRunnerFiles validates all files before writing partial output',
  'writeActivationRunnerFiles writes the validated file snapshot for mutable file maps',
  'writeActivationRunnerFiles rejects hostile evidence readiness JSON for root and workspace copies before writing',
  'writeActivationRunnerFiles rejects ready status claims for blocked evidence',
  'writeActivationRunnerFiles writes builder-produced evidence JSON through canonical schema guard',
  'writeActivationRunnerFiles accepts blocked not-run console handoff without ready claims',
  'writeActivationRunnerFiles rejects handoff readiness that contradicts doctor status',
  'writeActivationRunnerFiles rejects handoff lastDryRunSummary readiness mismatches',
  'writeActivationRunnerFiles rejects inconsistent doctor report semantics',
  'writeActivationRunnerFiles rejects mismatched root and workspace alias JSON',
  'writeActivationRunnerFiles rejects cross-file doctor status mismatches',
  'writeActivationRunnerFiles rejects evidence and handoff summary mismatches',
  'writeActivationRunnerFiles blocks preexisting symlink path segments under output root',
  'writeActivationRunnerFiles blocks final symlink targets without touching external files',
  'writeActivationRunnerFiles writes no partial files when a later final target is a symlink',
  'writeActivationRunnerFiles overwrites existing regular files inside output root',
  'external file must not change',
  'later symlink victim must not change',
  'evidence readiness is blocked when doctor status is blocked for an incomplete root',
  'console handoff blocks readiness when doctor has not run',
  'console handoff blocks readiness when doctor is blocked',
  'console handoff allows readiness only when doctor passed',
  'console handoff keeps invalid packs blocked regardless of doctor status',
  'invalid activation packs keep invalid-pack readiness even with doctor context',
  'writeActivationRunnerFiles rejects false activation status boundary values',
  'writeActivationRunnerFiles rejects enabled provider connection config values',
  'writeActivationRunnerFiles rejects false console handoff boundary values',
  'writeActivationRunnerFiles rejects false evidence boundary values',
  'writeActivationRunnerFiles rejects dry-run plans with false no-live boundary values',
  'writeActivationRunnerFiles rejects dry-run steps with live payment booking provider claim fields',
  'writeActivationRunnerFiles rejects forbidden operational claim JSON and markdown before writing',
  'generated negative safety values remain public-safe under forbidden claim scanning',
  'output root summary sanitizer does not echo URL-shaped values',
  'CLI summaries do not echo unsafe output roots',
  'payment was captured',
  'rawPhoneNumber = 5551234567',
  '5551234567',
  'blocked_doctor_not_passed',
  'blocked_doctor_not_run',
  'doctor_not_passed',
  'doctor_not_run',
  'handoff_ready_mismatch',
  'doctor_report_passed_with_blocked_checks',
  'alias_mismatch',
  'cross_file_doctor_status_mismatch',
  'blocked_symlink_path_segment',
  'blocked_final_symlink_target',
  'noLiveExecution: false',
  'runtimeAuthorityRequired: false',
  "providerConnection: 'enabled'",
  'buildActivationRunnerWritableFiles propagates requested root into evidence generation'
]) {
  if (!activationRunnerTestSource.includes(phrase)) fail(`activation runner tests missing adversarial case: ${phrase}`);
}
if (!activationRunnerTestSource.includes('assert.doesNotMatch(error.message, escapedPattern(rawPhone))')) {
  fail('activation runner tests must verify digit-only phone values are not echoed in blockers');
}
if (!activationRunnerTestSource.includes('assertNoPartialFiles(out)')) {
  fail('activation runner tests must verify no partial writes for blocked digit-only phone values');
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
    /\blive provider called\b/i,
    /\bbooking was created\b/i,
    /\bappointment booked\b/i,
    /\bpayment was captured\b/i,
    /\bpayment captured\b/i,
    /\bcharge captured\b/i,
    /\bcheckout completed\b/i,
    /\boutbound message was sent\b/i,
    /\boutbound message sent\b/i,
    /\bmessage sent to customer\b/i,
    /\bprovisioning complete\b/i,
    /\bprovisioning performed\b/i,
    /\bruntime execution completed\b/i,
    /\bready for production\b/i,
    /\bproduction ready\b/i,
    /\bproduction activation\b/i,
    /\bproduction execution\b/i,
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
  if (!file.includes('__tests__/') && !isValidatorScript) assertNoForbiddenClaims(text, file);
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
if (handoff.doctorStatus !== 'not_run') fail('console handoff without doctor must default to not_run');
if (handoff.launcherStatus !== 'activation_blocked') fail('console handoff without doctor must block launcher status');
if (handoff.activationReadiness !== 'blocked_doctor_not_run') fail('console handoff without doctor must report blocked_doctor_not_run');
if (handoff.evidencePackReady !== false) fail('console handoff without doctor must not mark evidence ready');
if (!handoff.publicReasonCodes.includes('doctor_not_run')) fail('console handoff without doctor missing doctor_not_run reason');
if (/activation_prepared_for_review|dry_run_ready_no_live_execution/.test(JSON.stringify(handoff))) {
  fail('console handoff without doctor leaked ready/prepared status');
}
const passedDoctorHandoff = buildConsoleHandoffSummary(validPack, { doctorStatus: 'passed' });
if (passedDoctorHandoff.launcherStatus !== 'activation_prepared_for_review') fail('console handoff with passed doctor did not become ready');
if (passedDoctorHandoff.activationReadiness !== 'dry_run_ready_no_live_execution') fail('console handoff with passed doctor missing dry-run readiness');
if (passedDoctorHandoff.evidencePackReady !== true) fail('console handoff with passed doctor must mark evidence ready');

const evidencePackA = buildActivationEvidencePack(validPack, { doctorReport, dryRunPlan, localWorkspaceSkeleton: workspaceSkeleton, consoleHandoffSummary: handoff });
const evidencePackB = buildActivationEvidencePack(validPack, { doctorReport, dryRunPlan, localWorkspaceSkeleton: workspaceSkeleton, consoleHandoffSummary: handoff });
if (JSON.stringify(evidencePackA) !== JSON.stringify(evidencePackB)) fail('evidence pack is not deterministic');
if (evidencePackA.activationPackFingerprint !== computeActivationPackFingerprint(validPack)) fail('evidence pack fingerprint mismatch');
for (const boundary of ['dry_run_is_not_permission', 'no_provider_was_called', 'no_booking_was_created', 'no_payment_was_captured', 'no_outbound_message_was_sent', 'runtime_remains_authority']) {
  if (!evidencePackA.explicitBoundaries.includes(boundary)) fail(`evidence pack missing boundary: ${boundary}`);
}
assertNoForbiddenClaims(JSON.stringify(evidencePackA), 'generated evidence pack');
const incompleteDoctorRoot = mkdtempSync(join(tmpdir(), 'transformia-v1-validator-incomplete-root-'));
try {
  const blockedDoctorEvidence = buildActivationEvidencePack(validPack, { root: incompleteDoctorRoot });
  const blockedDoctorHandoffText = JSON.stringify(blockedDoctorEvidence.consoleHandoffSummary);
  if (blockedDoctorEvidence.validationReport.ok !== true) fail('blocked doctor self-check must keep the activation pack valid');
  if (blockedDoctorEvidence.doctorStatus !== 'blocked') fail('blocked doctor self-check did not produce blocked doctor status');
  if (blockedDoctorEvidence.dryRunStatus !== 'blocked_doctor_not_passed') fail('blocked doctor self-check did not gate evidence dry-run status');
  if (blockedDoctorEvidence.consoleHandoffSummary.launcherStatus !== 'activation_blocked') fail('blocked doctor handoff did not block launcher status');
  if (blockedDoctorEvidence.consoleHandoffSummary.activationReadiness !== 'blocked_doctor_not_passed') fail('blocked doctor handoff did not report blocked_doctor_not_passed');
  if (blockedDoctorEvidence.consoleHandoffSummary.evidencePackReady !== false) fail('blocked doctor handoff marked evidence ready');
  if (blockedDoctorEvidence.launcherStatusSummary.evidencePackReady !== false) fail('blocked doctor launcher summary marked evidence ready');
  if (!blockedDoctorEvidence.consoleHandoffSummary.publicReasonCodes.includes('doctor_not_passed')) fail('blocked doctor handoff missing doctor_not_passed reason');
  if (/activation_prepared_for_review|dry_run_ready_no_live_execution/.test(blockedDoctorHandoffText)) {
    fail('blocked doctor handoff leaked ready/prepared status');
  }
  validateActivationRunnerWritableFileMap({
    'activation-evidence-pack.public.json': `${JSON.stringify(blockedDoctorEvidence, null, 2)}\n`
  }, V1_ACTIVATION_RUNNER_WRITABLE_FILES, 'validator_blocked_doctor_evidence_self_check');
} finally {
  rmSync(incompleteDoctorRoot, { recursive: true, force: true });
}

const writableFiles = buildActivationRunnerWritableFiles(validPack, { root, doctorReport });
for (const expected of V1_ACTIVATION_RUNNER_WRITABLE_FILES) {
  if (!Object.hasOwn(writableFiles, expected)) fail(`writable output missing file: ${expected}`);
}
const safeDoctorReportSnapshot = writableFiles['doctor-report.public.json'];
const unsafeDoctorReportSnapshot = `${JSON.stringify({
  ...JSON.parse(safeDoctorReportSnapshot),
  blockedReasonCodes: [[...'sk_test_aaaaaaaaaaaaaaaa'].join('')]
})}\n`;
let mutableFileReadCount = 0;
const mutableFileMap = {};
Object.defineProperty(mutableFileMap, 'doctor-report.public.json', {
  enumerable: true,
  get() {
    mutableFileReadCount += 1;
    return mutableFileReadCount === 1 ? safeDoctorReportSnapshot : unsafeDoctorReportSnapshot;
  }
});
const mutableSnapshotOut = mkdtempSync(join(tmpdir(), 'transformia-v1-validator-snapshot-'));
try {
  writeActivationRunnerFiles(mutableFileMap, mutableSnapshotOut);
  if (mutableFileReadCount !== 1) fail('writer re-read mutable file map after validation instead of writing the validated snapshot');
  if (readFileSync(join(mutableSnapshotOut, 'doctor-report.public.json'), 'utf8') !== safeDoctorReportSnapshot) fail('writer did not write the validated file snapshot');
} finally {
  rmSync(mutableSnapshotOut, { recursive: true, force: true });
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
const digitOnlyPhone = '5551234567';
const digitOnlyPhoneIssues = collectUnsafePublicMaterial({ blockedReasonCodes: [digitOnlyPhone] });
if (!digitOnlyPhoneIssues.includes('blocked_pii_like_value:root.blockedReasonCodes.0')) fail('public material scanner did not detect digit-only phone value');
const numericPhone = 5551234567;
const numericPhoneIssues = collectUnsafePublicMaterial({ blockedReasonCodes: [numericPhone] });
if (!numericPhoneIssues.includes('blocked_pii_like_value:root.blockedReasonCodes.0')) fail('public material scanner did not detect numeric phone value');
try {
  validateActivationRunnerWritableFileMap({
    'doctor-report.public.json': `${JSON.stringify({
      doctorReportId: 'doctor_report_public_fixture',
      status: 'blocked',
      checks: [],
      blockedReasonCodes: [digitOnlyPhone],
      generatedAt: '2026-06-24T00:00:00.000Z',
      publicSafe: true
    })}\n`
  }, V1_ACTIVATION_RUNNER_WRITABLE_FILES, 'validator_digit_phone_self_check');
  fail('file-map sink validator accepted digit-only phone value');
} catch (error) {
  if (!(error instanceof ActivationRunnerWriteBlockedError)) fail(`digit-only phone sink validator must throw ActivationRunnerWriteBlockedError, got ${error.name}`);
  if (!error.message.includes('blocked_pii_like_value:root.blockedReasonCodes.0')) fail('digit-only phone sink validator did not report stable blocker code');
  if (error.message.includes(digitOnlyPhone)) fail('digit-only phone sink validator leaked raw phone value');
}
const digitOnlyPhoneOut = mkdtempSync(join(tmpdir(), 'transformia-v1-validator-phone-'));
try {
  writeActivationRunnerFiles({
    'README_ACTIVATION_RUNNER.md': 'Public-safe local activation output.\n',
    'doctor-report.public.json': `${JSON.stringify({
      doctorReportId: 'doctor_report_public_fixture',
      status: 'blocked',
      checks: [],
      blockedReasonCodes: [digitOnlyPhone],
      generatedAt: '2026-06-24T00:00:00.000Z',
      publicSafe: true
    })}\n`
  }, digitOnlyPhoneOut);
  fail('writeActivationRunnerFiles accepted digit-only phone value');
} catch (error) {
  if (!(error instanceof ActivationRunnerWriteBlockedError)) fail(`digit-only phone writer must throw ActivationRunnerWriteBlockedError, got ${error.name}`);
  if (error.message.includes(digitOnlyPhone)) fail('digit-only phone writer leaked raw phone value');
  if (readdirSync(digitOnlyPhoneOut).length !== 0) fail('digit-only phone writer wrote partial files before validation completed');
} finally {
  rmSync(digitOnlyPhoneOut, { recursive: true, force: true });
}
try {
  validateActivationRunnerWritableFileMap({
    'doctor-report.public.json': `${JSON.stringify({
      doctorReportId: 'doctor_report_public_fixture',
      status: 'blocked',
      checks: [],
      blockedReasonCodes: [numericPhone],
      generatedAt: '2026-06-24T00:00:00.000Z',
      publicSafe: true
    })}\n`
  }, V1_ACTIVATION_RUNNER_WRITABLE_FILES, 'validator_numeric_phone_self_check');
  fail('file-map sink validator accepted numeric phone value');
} catch (error) {
  if (!(error instanceof ActivationRunnerWriteBlockedError)) fail(`numeric phone sink validator must throw ActivationRunnerWriteBlockedError, got ${error.name}`);
  if (!error.message.includes('blocked_pii_like_value:root.blockedReasonCodes.0')) fail('numeric phone sink validator did not report stable blocker code');
  if (error.message.includes(String(numericPhone))) fail('numeric phone sink validator leaked raw phone value');
}
const smallCounterIssues = collectUnsafePublicMaterial({ lastDryRunSummary: { stepCount: 5 }, written: 3 });
if (smallCounterIssues.length) fail(`small public numeric counters were blocked: ${smallCounterIssues.join(',')}`);
const semanticBoundaryCases = [
  {
    filename: 'workspace/status/activation-status.public.json',
    value: { ...JSON.parse(writableFiles['workspace/status/activation-status.public.json']), noLiveExecution: false },
    expected: 'invalid_boundary_value:root.noLiveExecution'
  },
  {
    filename: 'workspace/status/activation-status.public.json',
    value: { ...JSON.parse(writableFiles['workspace/status/activation-status.public.json']), runtimeAuthorityRequired: false },
    expected: 'invalid_boundary_value:root.runtimeAuthorityRequired'
  },
  {
    filename: 'workspace/status/activation-status.public.json',
    value: { ...JSON.parse(writableFiles['workspace/status/activation-status.public.json']), providerCommissioningRequired: false },
    expected: 'invalid_boundary_value:root.providerCommissioningRequired'
  },
  {
    filename: 'workspace/config/launcher.config.public.json',
    value: { ...JSON.parse(writableFiles['workspace/config/launcher.config.public.json']), providerConnection: 'enabled' },
    expected: 'invalid_disabled_value:root.providerConnection'
  },
  {
    filename: 'dry-run-plan.public.json',
    value: { ...JSON.parse(writableFiles['dry-run-plan.public.json']), noLiveExecution: false },
    expected: 'invalid_boundary_value:root.noLiveExecution'
  }
];
const semanticDryRunStepClaim = JSON.parse(writableFiles['dry-run-plan.public.json']);
semanticDryRunStepClaim.steps[0].paymentCaptured = false;
semanticBoundaryCases.push({
  filename: 'dry-run-plan.public.json',
  value: semanticDryRunStepClaim,
  expected: 'blocked_dry_run_step_claim_field:root.steps.0.<unsafe_key>'
});
const semanticHandoff = JSON.parse(writableFiles['console-handoff-summary.public.json']);
semanticHandoff.boundaries.noPaymentWasCaptured = false;
semanticBoundaryCases.push({
  filename: 'console-handoff-summary.public.json',
  value: semanticHandoff,
  expected: 'invalid_boundary_value:root.boundaries.noPaymentWasCaptured'
});
const semanticEvidence = JSON.parse(writableFiles['activation-evidence-pack.public.json']);
semanticEvidence.boundaryStatus.noPaymentWasCaptured = false;
semanticBoundaryCases.push({
  filename: 'activation-evidence-pack.public.json',
  value: semanticEvidence,
  expected: 'invalid_boundary_value:root.boundaryStatus.noPaymentWasCaptured'
});
const blockedEvidenceReadyClaim = JSON.parse(writableFiles['activation-evidence-pack.public.json']);
blockedEvidenceReadyClaim.validationReport.ok = false;
blockedEvidenceReadyClaim.doctorStatus = 'blocked';
blockedEvidenceReadyClaim.dryRunStatus = 'dry_run_ready_no_live_execution';
blockedEvidenceReadyClaim.launcherStatusSummary.evidencePackReady = false;
blockedEvidenceReadyClaim.launcherStatusSummary.launcherStatus = 'activation_prepared_for_review';
blockedEvidenceReadyClaim.launcherStatusSummary.activationReadiness = 'dry_run_ready_no_live_execution';
blockedEvidenceReadyClaim.launcherStatusSummary.localWorkspacePrepared = false;
blockedEvidenceReadyClaim.consoleHandoffSummary.launcherStatus = 'activation_prepared_for_review';
blockedEvidenceReadyClaim.consoleHandoffSummary.activationReadiness = 'dry_run_ready_no_live_execution';
blockedEvidenceReadyClaim.consoleHandoffSummary.evidencePackReady = false;
blockedEvidenceReadyClaim.consoleHandoffSummary.localWorkspacePrepared = false;
semanticBoundaryCases.push({
  filename: 'activation-evidence-pack.public.json',
  value: blockedEvidenceReadyClaim,
  expected: 'evidence_ready_claim_for_blocked_activation:root.dryRunStatus'
});
for (const { filename, value, expected } of semanticBoundaryCases) {
  try {
    validateActivationRunnerWritableFileMap({
      [filename]: `${JSON.stringify(value, null, 2)}\n`
    }, V1_ACTIVATION_RUNNER_WRITABLE_FILES, 'validator_semantic_boundary_self_check');
    fail(`file-map sink validator accepted false semantic boundary: ${filename}`);
  } catch (error) {
    if (!(error instanceof ActivationRunnerWriteBlockedError)) fail(`semantic boundary validator must throw ActivationRunnerWriteBlockedError, got ${error.name}`);
    if (!error.message.includes(expected)) fail(`semantic boundary validator did not report expected blocker ${expected}`);
  }
}
const hostileHandoffReadiness = JSON.parse(writableFiles['console-handoff-summary.public.json']);
hostileHandoffReadiness.doctorStatus = 'blocked';
try {
  validateActivationRunnerWritableFileMap({
    'console-handoff-summary.public.json': `${JSON.stringify(hostileHandoffReadiness, null, 2)}\n`
  }, V1_ACTIVATION_RUNNER_WRITABLE_FILES, 'validator_handoff_readiness_self_check');
  fail('file-map sink validator accepted handoff readiness without passed doctor');
} catch (error) {
  if (!(error instanceof ActivationRunnerWriteBlockedError)) fail(`handoff readiness validator must throw ActivationRunnerWriteBlockedError, got ${error.name}`);
  if (!error.message.includes('handoff_ready_mismatch')) fail('handoff readiness validator did not report stable blocker code');
}
const hostileHandoffLastDryRun = buildConsoleHandoffSummary(validPack);
hostileHandoffLastDryRun.lastDryRunSummary.status = 'dry_run_ready_no_live_execution';
try {
  validateActivationRunnerWritableFileMap({
    'console-handoff-summary.public.json': `${JSON.stringify(hostileHandoffLastDryRun, null, 2)}\n`
  }, V1_ACTIVATION_RUNNER_WRITABLE_FILES, 'validator_handoff_last_dry_run_self_check');
  fail('file-map sink validator accepted handoff lastDryRunSummary readiness mismatch');
} catch (error) {
  if (!(error instanceof ActivationRunnerWriteBlockedError)) fail(`handoff lastDryRunSummary validator must throw ActivationRunnerWriteBlockedError, got ${error.name}`);
  if (!error.message.includes('handoff_last_dry_run_status_mismatch')) fail('handoff lastDryRunSummary validator did not report stable blocker code');
}
const hostileDoctorReport = JSON.parse(writableFiles['doctor-report.public.json']);
hostileDoctorReport.checks[0].status = 'blocked';
hostileDoctorReport.checks[0].reasonCodes = ['activation_pack_validation_required'];
hostileDoctorReport.blockedReasonCodes = ['activation_pack_validation_required'];
try {
  validateActivationRunnerWritableFileMap({
    'doctor-report.public.json': `${JSON.stringify(hostileDoctorReport, null, 2)}\n`
  }, V1_ACTIVATION_RUNNER_WRITABLE_FILES, 'validator_doctor_report_self_check');
  fail('file-map sink validator accepted passed doctor report with blocked checks');
} catch (error) {
  if (!(error instanceof ActivationRunnerWriteBlockedError)) fail(`doctor report validator must throw ActivationRunnerWriteBlockedError, got ${error.name}`);
  if (!error.message.includes('doctor_report_passed_with_blocked_checks')) fail('doctor report validator did not report stable blocker code');
}
const aliasDryRun = JSON.parse(writableFiles['workspace/plans/dry-run-plan.public.json']);
aliasDryRun.status = 'dry_run_blocked_invalid_pack';
try {
  validateActivationRunnerWritableFileMap({
    'dry-run-plan.public.json': writableFiles['dry-run-plan.public.json'],
    'workspace/plans/dry-run-plan.public.json': `${JSON.stringify(aliasDryRun, null, 2)}\n`
  }, V1_ACTIVATION_RUNNER_WRITABLE_FILES, 'validator_alias_consistency_self_check');
  fail('file-map sink validator accepted mismatched root/workspace aliases');
} catch (error) {
  if (!(error instanceof ActivationRunnerWriteBlockedError)) fail(`alias consistency validator must throw ActivationRunnerWriteBlockedError, got ${error.name}`);
  if (!error.message.includes('alias_mismatch:dry-run-plan.public.json:workspace/plans/dry-run-plan.public.json')) fail('alias consistency validator did not report stable blocker code');
}
const crossDoctorReport = JSON.parse(writableFiles['doctor-report.public.json']);
crossDoctorReport.status = 'blocked';
crossDoctorReport.checks = [{
  checkId: 'repo_package_structure',
  status: 'blocked',
  reasonCodes: ['repo_structure_missing'],
  details: {},
  publicSafe: true
}];
crossDoctorReport.blockedReasonCodes = ['repo_structure_missing'];
try {
  validateActivationRunnerWritableFileMap({
    'doctor-report.public.json': `${JSON.stringify(crossDoctorReport, null, 2)}\n`,
    'workspace/status/doctor-status.public.json': writableFiles['workspace/status/doctor-status.public.json'],
    'console-handoff-summary.public.json': writableFiles['console-handoff-summary.public.json']
  }, V1_ACTIVATION_RUNNER_WRITABLE_FILES, 'validator_cross_file_doctor_self_check');
  fail('file-map sink validator accepted cross-file doctor status mismatch');
} catch (error) {
  if (!(error instanceof ActivationRunnerWriteBlockedError)) fail(`cross-file doctor validator must throw ActivationRunnerWriteBlockedError, got ${error.name}`);
  if (!error.message.includes('cross_file_doctor_status_mismatch')) fail('cross-file doctor validator did not report stable blocker code');
}
const crossHandoff = JSON.parse(writableFiles['console-handoff-summary.public.json']);
crossHandoff.publicReasonCodes = [...crossHandoff.publicReasonCodes, 'operator_review_placeholder'];
try {
  validateActivationRunnerWritableFileMap({
    'activation-evidence-pack.public.json': writableFiles['activation-evidence-pack.public.json'],
    'console-handoff-summary.public.json': `${JSON.stringify(crossHandoff, null, 2)}\n`
  }, V1_ACTIVATION_RUNNER_WRITABLE_FILES, 'validator_cross_file_handoff_self_check');
  fail('file-map sink validator accepted evidence/handoff summary mismatch');
} catch (error) {
  if (!(error instanceof ActivationRunnerWriteBlockedError)) fail(`cross-file handoff validator must throw ActivationRunnerWriteBlockedError, got ${error.name}`);
  if (!error.message.includes('cross_file_handoff_summary_mismatch')) fail('cross-file handoff validator did not report stable blocker code');
}
const operationalClaim = 'payment was captured';
try {
  validateActivationRunnerWritableFileMap({
    'workspace/status/activation-status.public.json': `${JSON.stringify({
      activationPackId: 'capsule_v1_activation_runner',
      status: operationalClaim,
      noLiveExecution: true,
      runtimeAuthorityRequired: true,
      providerCommissioningRequired: true,
      publicSafe: true
    })}\n`
  }, V1_ACTIVATION_RUNNER_WRITABLE_FILES, 'validator_operational_claim_self_check');
  fail('file-map sink validator accepted forbidden operational claim');
} catch (error) {
  if (!(error instanceof ActivationRunnerWriteBlockedError)) fail(`operational claim sink validator must throw ActivationRunnerWriteBlockedError, got ${error.name}`);
  if (!error.message.includes('blocked_forbidden_public_claim:root.status')) fail('operational claim sink validator did not report stable blocker code');
  if (error.message.includes(operationalClaim)) fail('operational claim sink validator leaked raw claim value');
}
const safeNegativeClaimIssues = collectUnsafePublicMaterial({
  status: 'no payment was captured',
  reasonCodes: ['dry_run_is_not_permission', 'runtime_authority_required', 'no_live_execution'],
  noPaymentWasCaptured: true,
  publicSafe: true
});
if (safeNegativeClaimIssues.length) fail(`negative safety claim was blocked: ${safeNegativeClaimIssues.join(',')}`);
const hostileEvidence = JSON.parse(writableFiles['activation-evidence-pack.public.json']);
hostileEvidence.validationReport = { ok: false, status: 'blocked_invalid_activation_pack', blockers: ['invalid_safe_ref:activationPackId'], checkedInvariants: [], publicSafe: true };
hostileEvidence.doctorStatus = 'blocked';
hostileEvidence.launcherStatusSummary.evidencePackReady = true;
for (const filename of ['activation-evidence-pack.public.json', 'workspace/evidence/activation-evidence-pack.public.json']) {
  try {
    validateActivationRunnerWritableFileMap({
      [filename]: `${JSON.stringify(hostileEvidence, null, 2)}\n`
    }, V1_ACTIVATION_RUNNER_WRITABLE_FILES, 'validator_hostile_evidence_self_check');
    fail(`file-map sink validator accepted hostile evidence readiness JSON: ${filename}`);
  } catch (error) {
    if (!(error instanceof ActivationRunnerWriteBlockedError)) fail(`hostile evidence validator must throw ActivationRunnerWriteBlockedError, got ${error.name}`);
    if (!error.message.includes('blocked_public_file_schema') || !error.message.includes('evidence_pack_ready_mismatch')) {
      fail(`hostile evidence validator did not report canonical schema blocker: ${filename}`);
    }
  }
}
const unsafeOutputSummary = buildPublicOutputRootSummary(['ht', 'tps://unsafe.example/output'].join(''));
if (unsafeOutputSummary.outputRootEchoed !== false || unsafeOutputSummary.outputRootMode !== 'custom') fail('output root summary did not mark custom root as non-echoed');
if (JSON.stringify(unsafeOutputSummary).includes('unsafe.example')) fail('output root summary leaked raw URL-shaped value');
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
const symlinkOut = mkdtempSync(join(tmpdir(), 'transformia-v1-validator-symlink-'));
const symlinkTarget = mkdtempSync(join(tmpdir(), 'transformia-v1-validator-symlink-target-'));
let symlinkCreated = false;
try {
  try {
    symlinkSync(symlinkTarget, join(symlinkOut, 'workspace'), process.platform === 'win32' ? 'junction' : 'dir');
    symlinkCreated = true;
  } catch {
    symlinkCreated = false;
  }
  if (symlinkCreated) {
    try {
      writeActivationRunnerFiles({
        'workspace/status/doctor-status.public.json': writableFiles['workspace/status/doctor-status.public.json']
      }, symlinkOut);
      fail('writeActivationRunnerFiles accepted a preexisting symlink path segment under output root');
    } catch (error) {
      if (!/blocked_symlink_path_segment|blocked_realpath_escape/.test(error.message)) {
        fail(`symlink path segment guard reported unexpected error: ${error.message}`);
      }
    }
  }
} finally {
  rmSync(symlinkOut, { recursive: true, force: true });
  rmSync(symlinkTarget, { recursive: true, force: true });
}
const finalSymlinkOut = mkdtempSync(join(tmpdir(), 'transformia-v1-validator-final-symlink-'));
const finalSymlinkTarget = mkdtempSync(join(tmpdir(), 'transformia-v1-validator-final-symlink-target-'));
const finalSymlinkVictim = join(finalSymlinkTarget, 'victim.txt');
const finalSymlinkOriginal = 'validator final symlink victim must not change';
writeFileSync(finalSymlinkVictim, finalSymlinkOriginal, 'utf8');
let finalSymlinkCreated = false;
try {
  try {
    symlinkSync(finalSymlinkVictim, join(finalSymlinkOut, 'README_ACTIVATION_RUNNER.md'), 'file');
    finalSymlinkCreated = true;
  } catch {
    finalSymlinkCreated = false;
  }
  if (finalSymlinkCreated) {
    try {
      writeActivationRunnerFiles({
        'README_ACTIVATION_RUNNER.md': writableFiles['README_ACTIVATION_RUNNER.md']
      }, finalSymlinkOut);
      fail('writeActivationRunnerFiles accepted a final symlink target');
    } catch (error) {
      if (!/blocked_final_symlink_target/.test(error.message)) fail(`final symlink guard reported unexpected error: ${error.message}`);
      if (error.message.includes(finalSymlinkVictim) || error.message.includes(finalSymlinkTarget)) fail('final symlink guard leaked raw external path');
    }
    if (readFileSync(finalSymlinkVictim, 'utf8') !== finalSymlinkOriginal) fail('final symlink guard modified external target');
  }
} finally {
  rmSync(finalSymlinkOut, { recursive: true, force: true });
  rmSync(finalSymlinkTarget, { recursive: true, force: true });
}
const partialSymlinkOut = mkdtempSync(join(tmpdir(), 'transformia-v1-validator-partial-symlink-'));
const partialSymlinkTarget = mkdtempSync(join(tmpdir(), 'transformia-v1-validator-partial-symlink-target-'));
const partialSymlinkVictim = join(partialSymlinkTarget, 'victim.txt');
const partialSymlinkOriginal = 'validator partial symlink victim must not change';
writeFileSync(partialSymlinkVictim, partialSymlinkOriginal, 'utf8');
let partialSymlinkCreated = false;
try {
  try {
    mkdirSync(join(partialSymlinkOut, 'workspace', 'status'), { recursive: true });
    symlinkSync(partialSymlinkVictim, join(partialSymlinkOut, 'workspace', 'status', 'doctor-status.public.json'), 'file');
    partialSymlinkCreated = true;
  } catch {
    partialSymlinkCreated = false;
  }
  if (partialSymlinkCreated) {
    try {
      writeActivationRunnerFiles({
        'README_ACTIVATION_RUNNER.md': writableFiles['README_ACTIVATION_RUNNER.md'],
        'workspace/status/doctor-status.public.json': writableFiles['workspace/status/doctor-status.public.json']
      }, partialSymlinkOut);
      fail('writeActivationRunnerFiles wrote before detecting a later final symlink target');
    } catch (error) {
      if (!/blocked_final_symlink_target/.test(error.message)) fail(`partial final symlink guard reported unexpected error: ${error.message}`);
    }
    if (existsSync(join(partialSymlinkOut, 'README_ACTIVATION_RUNNER.md'))) fail('writer produced partial output before final symlink preflight completed');
    if (readFileSync(partialSymlinkVictim, 'utf8') !== partialSymlinkOriginal) fail('partial final symlink guard modified external target');
  }
} finally {
  rmSync(partialSymlinkOut, { recursive: true, force: true });
  rmSync(partialSymlinkTarget, { recursive: true, force: true });
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
