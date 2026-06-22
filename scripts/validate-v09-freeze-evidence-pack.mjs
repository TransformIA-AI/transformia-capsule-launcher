import { existsSync, readFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { join } from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const exists = (path) => existsSync(join(root, path));
const read = (path) => readFileSync(join(root, path), 'utf8');
const normalize = (path) => path.replaceAll('\\', '/');

const packPath = 'docs/v0.9/V0_9_FREEZE_EVIDENCE_PACK.md';
const manifestPath = 'docs/v0.9/evidence/v0_9_freeze_evidence_manifest.public.json';
const templatePath = 'docs/v0.9/evidence/LOCAL_EVIDENCE_CAPTURE_TEMPLATE.md';
const validatorPath = 'scripts/validate-v09-freeze-evidence-pack.mjs';
const requiredL01Artifacts = [
  'docs/v0.9/SAAS_ACTIVATION_PACK_HANDOFF_L01.md',
  'docs/v0.9/V0_9_FREEZE_CANDIDATE.md',
  'scripts/validate-v09-saas-activation-pack-handoff.mjs',
  'scripts/validate-v09-freeze-candidate.mjs'
];

for (const file of [packPath, manifestPath, templatePath, validatorPath, ...requiredL01Artifacts]) {
  if (!exists(file)) fail(`missing required file: ${file}`);
}

let pkg = {};
try { pkg = JSON.parse(read('package.json')); } catch (error) { fail(`package.json must parse as JSON: ${error.message}`); }
if (pkg.scripts?.['validate:v09-freeze-evidence-pack'] !== 'node scripts/validate-v09-freeze-evidence-pack.mjs') {
  fail('package script missing: validate:v09-freeze-evidence-pack');
}
for (const scriptName of ['validate:v09-saas-activation-pack-handoff', 'validate:v09-freeze-candidate']) {
  if (!pkg.scripts?.[scriptName]) fail(`required Launcher L01 validator is not registered: ${scriptName}`);
}
if (!pkg.scripts?.quality?.includes('validate:v09-freeze-evidence-pack')) {
  fail('quality must include validate:v09-freeze-evidence-pack');
}

let manifest = null;
try { manifest = JSON.parse(read(manifestPath)); } catch (error) { fail(`manifest must parse as JSON: ${error.message}`); }

const allowedFreezeStatuses = new Set(['freeze_ready', 'freeze_blocked', 'freeze_candidate_pending_external_evidence']);
const allowedEvidenceStatuses = new Set(['verified', 'present_unverified', 'missing', 'blocked', 'pending_external_evidence', 'not_applicable']);
const requiredIds = [
  'W01', 'W02', 'W03', 'W04', 'W05',
  'B01', 'B02', 'B03', 'B04', 'B05',
  'L01',
  'X01', 'X02', 'X03', 'X04', 'X05', 'X06', 'X07'
];

function getEvidenceLabel(item) {
  const id = typeof item?.id === 'string' && item.id ? item.id : '<missing-id>';
  const area = typeof item?.area === 'string' && item.area ? item.area : '<missing-area>';
  const name = typeof item?.name === 'string' && item.name ? item.name : '<missing-name>';
  return `${id} (${area}: ${name})`;
}

function assertFreezeReadyEvidenceComplete(candidateManifest, report = fail) {
  if (!Array.isArray(candidateManifest?.pendingExternalEvidence)) {
    report('freeze_ready requires pendingExternalEvidence to exist as an empty array');
    return;
  }
  if (candidateManifest.pendingExternalEvidence.length > 0) {
    report('manifest cannot be freeze_ready while pendingExternalEvidence is non-empty');
  }
  if (!Array.isArray(candidateManifest?.requiredEvidence) || candidateManifest.requiredEvidence.length === 0) {
    report('freeze_ready requires requiredEvidence to exist as a non-empty array');
    return;
  }
  const byId = new Map(candidateManifest.requiredEvidence.map((item) => [item?.id, item]));
  const missingIds = requiredIds.filter((id) => !byId.has(id));
  if (missingIds.length > 0) {
    report(`freeze_ready requires all canonical required evidence ids; missing ids: ${missingIds.join(', ')}`);
  }
  const nonVerified = candidateManifest.requiredEvidence
    .filter((item) => item?.status !== 'verified')
    .map((item) => `${getEvidenceLabel(item)} status=${String(item?.status ?? '<missing-status>')}`);
  if (nonVerified.length > 0) {
    report(`freeze_ready requires every requiredEvidence item to be verified; non-verified evidence: ${nonVerified.join('; ')}`);
  }
}

if (manifest) {
  if (manifest.publicSafe !== true) fail('manifest.publicSafe must be true');
  if (manifest.version !== 'v0.9') fail('manifest.version must be v0.9');
  if (!allowedFreezeStatuses.has(manifest.status)) fail(`manifest.status is invalid: ${manifest.status}`);
  if (!Array.isArray(manifest.requiredEvidence)) fail('manifest.requiredEvidence must be an array');
  if (!Array.isArray(manifest.pendingExternalEvidence)) fail('manifest.pendingExternalEvidence must be an array');
  const byId = new Map((manifest.requiredEvidence || []).map((item) => [item.id, item]));
  const missingRequiredIds = requiredIds.filter((id) => !byId.has(id));
  if (missingRequiredIds.length > 0) fail(`required evidence items missing from manifest: ${missingRequiredIds.join(', ')}`);
  for (const id of ['W01', 'W02', 'W03', 'W04', 'W05']) if (byId.get(id)?.area !== 'WEB') fail(`manifest Web item invalid or removed: ${id}`);
  for (const id of ['B01', 'B02', 'B03', 'B04', 'B05']) if (byId.get(id)?.area !== 'RUNTIME') fail(`manifest Runtime item invalid or removed: ${id}`);
  if (byId.get('L01')?.area !== 'LAUNCHER') fail('manifest Launcher L01 item invalid or removed');
  for (const id of ['X01', 'X02', 'X03', 'X04', 'X05', 'X06', 'X07']) if (byId.get(id)?.area !== 'CROSS-REPO') fail(`manifest Cross-repo item invalid or removed: ${id}`);
  for (const item of manifest.requiredEvidence || []) {
    for (const field of ['repo', 'expectedArtifact', 'observedArtifact', 'prOrMergeCommit', 'validationCommand', 'status', 'notes', 'blocker']) {
      if (!(field in item)) fail(`required proof field missing for ${item.id || '<unknown>'}: ${field}`);
    }
    if (!allowedEvidenceStatuses.has(item.status)) fail(`invalid evidence status for ${item.id}: ${item.status}`);
  }
  if (manifest.status === 'freeze_ready') {
    assertFreezeReadyEvidenceComplete(manifest);
  }
}

const docs = [packPath, manifestPath, templatePath, 'docs/v0.9/V0_9_FREEZE_CANDIDATE.md'].filter(exists).map(read).join('\n');
for (const phrase of [
  'freeze_candidate_pending_external_evidence',
  'Never claim `freeze_ready` from docs alone',
  'Web W01-W05',
  'Runtime B01-B05',
  'Launcher-specific L01 evidence only'
]) {
  if (!docs.includes(phrase)) fail(`freeze evidence docs missing required phrase: ${phrase}`);
}

const unsafeClaimPatterns = [
  /\bproduction live execution\b/i,
  /\blive production execution\b/i,
  /\bproduction execution enabled\b/i,
  /\benables production live execution\b/i,
  /\bsupports production live execution\b/i,
  /\bready for production live execution\b/i,
  /(^|[^a-z])automatic purchase/i,
  /(^|[^a-z])instant provisioning/i,
  /(^|[^a-z])compliance certified/i,
  /(^|[^a-z])guaranteed ROI/i,
  /(^|[^a-z])payment connected(?!\.)/i,
  /(^|[^a-z])auth connected(?!\.)/i
];
const allowedSafeClaimPatterns = [
  /\bdoes not enable production live execution\b/gi,
  /\bdoes not mean production live execution\b/gi,
  /\bno production live execution(?: is enabled)?\b/gi,
  /\bproduction live execution remains blocked\b/gi,
  /\bproduction live execution is not enabled\b/gi,
  /\bproduction live execution is out of scope\b/gi,
  /\bnot production live execution\b/gi,
  /\bdoes not mean payment provider connected\b/gi,
  /\bdoes not mean auth provider connected\b/gi,
  /\bdoes not mean enterprise compliance certification\b/gi,
  /\bdoes not mean ROI guarantee\b/gi
];
function stripAllowedSafeClaims(text) {
  let next = text;
  for (const pattern of allowedSafeClaimPatterns) next = next.replace(pattern, '');
  return next;
}
function assertNoForbiddenClaims(text, report = fail) {
  const claimScanText = stripAllowedSafeClaims(text);
  for (const pattern of unsafeClaimPatterns) if (pattern.test(claimScanText)) report(`forbidden claim phrase found: ${pattern}`);
}
assertNoForbiddenClaims(docs);

function makeEvidenceItem(id, area, status = 'verified') {
  return {
    id,
    area,
    name: `${id} regression fixture`,
    repo: area.toLowerCase(),
    expectedArtifact: 'regression fixture expected artifact',
    observedArtifact: 'regression fixture observed artifact',
    prOrMergeCommit: 'regression-fixture',
    validationCommand: 'regression-fixture',
    status,
    notes: 'regression fixture',
    blocker: status === 'verified' ? '' : 'regression fixture blocker'
  };
}

function runRegressionSelfChecks() {
  const baseFreezeReadyManifest = {
    status: 'freeze_ready',
    pendingExternalEvidence: [],
    requiredEvidence: [
      ...['W01', 'W02', 'W03', 'W04', 'W05'].map((id) => makeEvidenceItem(id, 'WEB')),
      ...['B01', 'B02', 'B03', 'B04', 'B05'].map((id) => makeEvidenceItem(id, 'RUNTIME')),
      makeEvidenceItem('L01', 'LAUNCHER'),
      ...['X01', 'X02', 'X03', 'X04', 'X05', 'X06', 'X07'].map((id) => makeEvidenceItem(id, 'CROSS-REPO'))
    ]
  };
  const expectFreezeReadyFailure = (id, status) => {
    const fixture = JSON.parse(JSON.stringify(baseFreezeReadyManifest));
    const item = fixture.requiredEvidence.find((candidate) => candidate.id === id);
    item.status = status;
    const localErrors = [];
    assertFreezeReadyEvidenceComplete(fixture, (message) => localErrors.push(message));
    if (!localErrors.some((message) => message.includes(id) && message.includes(`status=${status}`))) {
      fail(`freeze_ready regression fixture did not fail for ${id} status=${status}`);
    }
  };
  const missingCrossRepoFixture = JSON.parse(JSON.stringify(baseFreezeReadyManifest));
  missingCrossRepoFixture.requiredEvidence = missingCrossRepoFixture.requiredEvidence.filter((item) => !String(item.id).startsWith('X'));
  const missingCrossRepoErrors = [];
  assertFreezeReadyEvidenceComplete(missingCrossRepoFixture, (message) => missingCrossRepoErrors.push(message));
  if (!missingCrossRepoErrors.some((message) => message.includes('missing ids: X01, X02, X03, X04, X05, X06, X07'))) {
    fail('freeze_ready regression fixture did not fail when X01-X07 were omitted');
  }
  for (const [id, status] of [
    ['W01', 'pending_external_evidence'],
    ['X01', 'pending_external_evidence'],
    ['X02', 'pending'],
    ['X03', 'missing'],
    ['X03', 'skipped'],
    ['X03', 'draft'],
    ['X03', 'blocked'],
    ['X03', 'unknown'],
    ['X03', 'not_applicable'],
    ['X05', 'pending_external_evidence'],
    ['X07', 'pending_external_evidence']
  ]) {
    expectFreezeReadyFailure(id, status);
  }
  const passingErrors = [];
  assertFreezeReadyEvidenceComplete(baseFreezeReadyManifest, (message) => passingErrors.push(message));
  if (passingErrors.length > 0) fail(`freeze_ready verified regression fixture failed unexpectedly: ${passingErrors.join('; ')}`);

  for (const claim of [
    'This enables production live execution.',
    'This enables production live execution',
    'This supports production live execution.'
  ]) {
    const localErrors = [];
    assertNoForbiddenClaims(claim, (message) => localErrors.push(message));
    if (!localErrors.length) fail(`unsafe claim regression fixture did not fail: ${claim}`);
  }
  for (const claim of [
    'This does not enable production live execution.',
    'No production live execution is enabled.',
    'Production live execution remains blocked.'
  ]) {
    const localErrors = [];
    assertNoForbiddenClaims(claim, (message) => localErrors.push(message));
    if (localErrors.length) fail(`safe claim regression fixture failed unexpectedly: ${claim}`);
  }
}
runRegressionSelfChecks();

const secretPatterns = [
  /sk_live_[A-Za-z0-9_]+/i,
  /ghp_[A-Za-z0-9_]{20,}/i,
  /AKIA[0-9A-Z]{16}/,
  /BEGIN (RSA |EC |OPENSSH |PRIVATE )?PRIVATE KEY/,
  /(?:api[_-]?key|secret|token|password)\s*[:=]\s*['\"][^'\"]{8,}['\"]/i
];
for (const pattern of secretPatterns) if (pattern.test(docs)) fail(`secret/token/API-key-like string found: ${pattern}`);
const piiPatterns = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /(?:\+\d[\d .-]{7,}\d|\b\d{3}[-. ]\d{3}[-. ]\d{3,4}\b)/
];
for (const pattern of piiPatterns) if (pattern.test(docs)) fail(`PII-shaped string found: ${pattern}`);

const publicCtaPattern = /(?:href|url|cta|target|route|sourceRoute|publicRoute|public CTA)[^\n]{0,80}(\/case-zero|\/pilot|\/cockpit|\/connectors|\/private|\/demo\/cockpit|\/demo\/flujo|\/portal-vivo)/i;
if (publicCtaPattern.test(docs)) fail('private route appears as a public CTA');

const validatorSource = exists(validatorPath) ? read(validatorPath) : '';
for (const token of ['execFileSync', 'spawnSync', 'PR_BASE_SHA', 'GITHUB_EVENT_PATH', 'GITHUB_BASE_REF', 'gitDiffNames', 'ls-files', 'requiredIds', 'manifest.requiredEvidence']) {
  if (!validatorSource.includes(token)) fail(`validator missing real-check token: ${token}`);
}
if (/execFileSync\([^,]+\+|spawnSync\([^,]+\+/.test(validatorSource)) fail('validator must not build shell command strings');
const prohibitedBranchGateMessage = ['unexpected', 'branch', 'for', 'this', 'task'].join(' ');
if (validatorSource.includes(prohibitedBranchGateMessage)) fail('validator must not hard-fail on branch names');
if (/branch['"],\s*['"]--show-current['"][\s\S]{0,240}fail\s*\(/.test(validatorSource)) fail('validator must not use git branch --show-current as a hard fail condition');
if (/docs\/v09-freeze-evidence-pack[\s\S]{0,160}fail\s*\(/.test(validatorSource)) fail('validator must not gate execution on the feature branch name');

function git(args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim().split(/\r?\n/).filter(Boolean).map(normalize) : [];
}
function gitScalar(args) {
  try { return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim(); } catch { return ''; }
}
function baseCandidates() {
  const out = [];
  for (const key of ['PR_BASE_SHA', 'GITHUB_BASE_SHA', 'BASE_SHA']) if (process.env[key]) out.push(process.env[key]);
  if (process.env.GITHUB_EVENT_PATH && existsSync(process.env.GITHUB_EVENT_PATH)) {
    try {
      const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
      if (event.pull_request?.base?.sha) out.push(event.pull_request.base.sha);
      if (event.pull_request?.base?.ref) out.push(`origin/${event.pull_request.base.ref}`);
    } catch (error) { fail(`could not parse GITHUB_EVENT_PATH: ${error.message}`); }
  }
  if (process.env.GITHUB_BASE_REF) out.push(`origin/${process.env.GITHUB_BASE_REF}`);
  out.push('origin/main', 'main', 'HEAD^');
  return out;
}
function gitDiffNames(base) {
  let files = git(['diff', '--name-only', `${base}...HEAD`]);
  if (!files.length) files = git(['diff', '--name-only', `${base}..HEAD`]);
  return files;
}
const changed = new Set();
for (const base of baseCandidates()) {
  const files = gitDiffNames(base);
  if (files.length) { files.forEach((file) => changed.add(file)); break; }
}
for (const args of [['diff', '--name-only'], ['diff', '--name-only', '--cached'], ['ls-files', '--others', '--exclude-standard']]) {
  git(args).forEach((file) => changed.add(file));
}
if (!changed.size) fail('changed-file guard found no files; validator must inspect real changed files');

const allowedChanged = new Set([packPath, manifestPath, templatePath, validatorPath, 'package.json', 'docs/v0.9/V0_9_FREEZE_CANDIDATE.md']);
for (const file of changed) {
  if (!exists(file)) continue;
  const isAllowedTaskFile = allowedChanged.has(file);
  const text = read(file);
  if (!isAllowedTaskFile) continue;
  for (const pattern of secretPatterns) if (pattern.test(text)) fail(`changed file contains secret-shaped material: ${file}`);
  for (const pattern of piiPatterns) if (pattern.test(text)) fail(`changed file contains PII-shaped material: ${file}`);
  if (file !== validatorPath && publicCtaPattern.test(text)) fail(`changed file exposes private route as public CTA: ${file}`);
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}
console.log('v0.9 freeze evidence pack validator passed.');
