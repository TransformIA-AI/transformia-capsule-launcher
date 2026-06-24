import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  ActivationRunnerWriteBlockedError,
  V1_ACTIVATION_RUNNER_REQUIRED_FILES,
  V1_ACTIVATION_RUNNER_REQUIRED_SCRIPTS,
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
  'docs/v1-activation-runner/CAPSULE_LAUNCHER_V1_OPERATOR_GUIDE.md'
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
for (const exported of [
  'buildDefaultV1ActivationPack',
  'validateV1ActivationPack',
  'buildLocalWorkspaceSkeleton',
  'runActivationDoctor',
  'buildDryRunActivationPlan',
  'buildActivationEvidencePack',
  'buildConsoleHandoffSummary',
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
  "buildSafeDerivedId('dad'"
]) {
  if (!source.includes(phrase)) fail(`runner source missing required safety token: ${phrase}`);
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
for (const heading of ['Summary', 'What changed', 'Commands/scripts added', 'Safety boundaries', 'Tests/validators run', 'Not included', 'Risks/trade-offs', 'Follow-up recommendations']) {
  if (!prBody.includes(`## ${heading}`)) fail(`PR body missing section: ${heading}`);
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
    /\bnot production live\b/gi
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
  new RegExp(`${'sk' + '_live_'}[A-Za-z0-9_]+`, 'i'),
  new RegExp(`${'pk' + '_live_'}[A-Za-z0-9_]+`, 'i'),
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
  const text = read(file);
  const forbiddenShortName = new RegExp(`\\b${'D' + 'AF'}\\b`);
  const forbiddenLegacyName = new RegExp(`\\b(?:${'CL' + 'AW'}|${'HER' + 'MES'})\\b`, 'i');
  if (!isValidatorSelf && forbiddenShortName.test(text)) fail(`forbidden DAD typo term found: ${file}`);
  if (!isValidatorSelf && forbiddenLegacyName.test(text)) fail(`forbidden legacy local name found: ${file}`);
  const externalTerms = ['fe' + 'tch(', 'ax' + 'ios', 'su' + 'pabase', 'fi' + 'rebase', 'post' + 'gres', 'my' + 'sql', 'mongo' + 'db'];
  if (!isValidatorSelf && externalTerms.some((term) => text.toLowerCase().includes(term))) fail(`changed file introduces external implementation surface: ${file}`);
  if (!file.includes('__tests__/') && !isValidatorSelf) {
    for (const pattern of secretPatterns) if (pattern.test(text)) fail(`changed file contains secret-shaped material: ${file}`);
    for (const pattern of piiPatterns) if (pattern.test(text)) fail(`changed file contains PII-shaped material: ${file}`);
  }
  if (!isValidatorSelf) assertNoForbiddenClaims(text, file);
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

const liveSnakeKey = ['live', '_', 'execution', '_', 'enabled'].join('');
const bookingSnakeKey = ['booking', '_', 'created'].join('');
const providerEndpointKey = ['provider', '_', 'endpoint'].join('');
for (const [key, value] of [[liveSnakeKey, true], [bookingSnakeKey, true], [providerEndpointKey, 'provider_placeholder']]) {
  const report = validateV1ActivationPack(buildDefaultV1ActivationPack({ nestedLiveSurface: [{ [key]: value }] }));
  if (report.ok || !report.blockers.includes(`blocked_assertive_live_field:root.nestedLiveSurface.0.${key}`)) {
    fail(`normalized live/assertive key fixture did not fail: ${key}`);
  }
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
