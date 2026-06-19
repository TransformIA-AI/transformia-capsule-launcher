import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildGovernedDeployDoctorReport } from './governed-deploy-doctor.mjs';
import { buildRollbackDoctorReport } from './rollback-doctor.mjs';
import { extractAssignment, extractAssignmentKey, extractDockerfileAssignment, inspectSecretSafetyLine, isCredentialPath, isHardSecretValue, isScannerInternalPatternLine, isPlaceholderValue, isSecretBearingTextFilename, isSensitiveAssignmentKey, isSensitiveCredentialFilename, normalizeAssignmentKey, runSecretSafetyCheck, shouldScanSecretSafetyPath } from './secret-safety-check.mjs';

const root = process.cwd();
const errors = [];
const requiredA07 = [
  'bootstrap/README.md','bootstrap/stack/managed.stack.manifest.json','bootstrap/stack/self-host.stack.manifest.json','bootstrap/schema/stack-bootstrap-manifest.schema.json','bootstrap/examples/local-stack.config.example.json','bootstrap/examples/managed-cloud-handoff.example.json','scripts/bootstrap-stack-plan.mjs','scripts/validate-v0-8-a07-stack-bootstrap.mjs','docs/infra/MANAGED_SELF_HOST_LOCAL_STACK_BOOTSTRAP_v0_8_A07.md','docs/release/TRANSFORMIA_CAPSULE_LAUNCHER_V0_8_A07_MANAGED_SELF_HOST_LOCAL_STACK_BOOTSTRAP.md'
];
const requiredA08 = [
  'scripts/governed-deploy-doctor.mjs','scripts/rollback-doctor.mjs','scripts/secret-safety-check.mjs','scripts/validate-v0-8-a08-deploy-rollback-secret-doctors.mjs','bootstrap/rollback/rollback-plan.example.json','bootstrap/schema/rollback-plan.schema.json','docs/infra/GOVERNED_DEPLOY_ROLLBACK_SECRET_DOCTORS_v0_8_A08.md','docs/security/SECRET_SAFETY_CHECKS_v0_8_A08.md','docs/release/TRANSFORMIA_CAPSULE_LAUNCHER_V0_8_A08_GOVERNED_DEPLOY_ROLLBACK_SECRET_DOCTORS.md'
];
const requiredRollbackFields = ['rollbackPlanRef','stackRef','rollbackMode','rollbackAvailable','rollbackStepsPublicSafe','requiredHumanApprovalBeforeRollback','noRollbackPerformed','noDeletePerformed','noProviderCall','noLiveExecution','noSecretsIncluded','evidenceExpected','operatorNextSteps'];

function fail(message) { errors.push(message); }
function read(path) { return readFileSync(join(root, path), 'utf8'); }
function json(path) { return JSON.parse(read(path)); }
function requireFiles(paths, label) { for (const path of paths) if (!existsSync(join(root, path))) fail(`${label} missing: ${path}`); }
function mustContain(path, needles) { const text = read(path); for (const needle of needles) if (!text.includes(needle)) fail(`${path} missing required text: ${needle}`); }
function mustNotMatch(path, patterns, label) { const text = read(path); for (const pattern of patterns) if (pattern.test(text)) fail(`${path} contains forbidden ${label}: ${pattern}`); }

requireFiles(requiredA07, 'A07 dependency');
requireFiles(requiredA08, 'A08 file');

const packageJson = json('package.json');
for (const scriptName of ['doctor:deploy','doctor:rollback','secrets:check','validate:v0-8-a08-deploy-rollback-secret-doctors','validate:v0-8-a07-stack-bootstrap']) {
  if (!packageJson.scripts?.[scriptName]) fail(`package.json missing script: ${scriptName}`);
}
if (!/validate:v0-8-a08-deploy-rollback-secret-doctors/.test(packageJson.scripts?.quality ?? '')) fail('quality script must include A08 validator.');
if (!/validate:v0-8-a07-stack-bootstrap/.test(packageJson.scripts?.quality ?? '')) fail('quality script must retain A07 validator.');

mustNotMatch('scripts/governed-deploy-doctor.mjs', [/child_process/, /fetch\s*\(/, /https?:\/\//, /docker\s+(run|compose|build)|dockerode|from ['\"]docker/i, /n8n/i, /stripe/i, /postgres|mysql|mongodb/i, /provider sdk/i], 'deploy execution path');
mustNotMatch('scripts/rollback-doctor.mjs', [/child_process/, /fetch\s*\(/, /https?:\/\//, /rmSync\s*\(/, /unlinkSync\s*\(/, /writeFileSync\s*\(/, /renameSync\s*\(/, /docker\b/i, /provider sdk/i], 'rollback mutation path');
mustContain('scripts/secret-safety-check.mjs', ['fileURLToPath', 'resolve(process.argv[1]) === fileURLToPath(import.meta.url)', 'isScannerInternalPatternLine', 'runSecretSafetyCheck', 'inspectSecretSafetyLine', 'const|let|var', 'extractAssignment', 'extractDockerfileAssignment', 'normalizeAssignmentKey', 'isSensitiveAssignmentKey', 'isPlaceholderValue', 'isHardSecretValue', 'isSensitiveCredentialFilename', 'isCredentialPath', 'isSecretBearingTextFilename', 'shouldScanSecretSafetyPath', 'credentialPathSuffixes', '.aws/credentials', '.aws/config', '.kube/config', '.docker/config.json', 'secretBearingTextBasenames', '.npmrc', '.netrc', '.pypirc', 'kubeconfig', 'Dockerfile', 'Makefile', 'sensitive_credential_file_not_allowed', 'real_env_file_not_allowed', 'private_key_block', 'webhook_url', 'noSecretsRead']);
mustNotMatch('scripts/secret-safety-check.mjs', [/child_process/, /fetch\s*\(/, /docker\s+(run|compose|build)|dockerode|from ['\"]docker/i, /n8n/i, /postgres|mysql|mongodb/i], 'secret checker live path');

for (const doc of ['docs/infra/GOVERNED_DEPLOY_ROLLBACK_SECRET_DOCTORS_v0_8_A08.md','docs/security/SECRET_SAFETY_CHECKS_v0_8_A08.md','docs/release/TRANSFORMIA_CAPSULE_LAUNCHER_V0_8_A08_GOVERNED_DEPLOY_ROLLBACK_SECRET_DOCTORS.md']) {
  mustContain(doc, ['v0.8-A08','A07','no deploy','no rollback','no secret manager','no provider call','no live execution','no private runtime','no cloud provisioning','no DB','no auth','no telemetry']);
}

mustContain('README.md', ['v0.8-A08 Governed deploy and rollback doctors','npm run -s doctor:deploy','npm run -s doctor:rollback','npm run -s secrets:check','npm run -s validate:v0-8-a08-deploy-rollback-secret-doctors']);
mustNotMatch('README.md', [/production[- ]ready/i, /production readiness/i, /one-click installer/i, /deploys infrastructure/i, /rollback performed/i], 'false production claim');
mustContain('scripts/doctor.mjs', ['Governed Deploy Doctor available.','Rollback Doctor available.','Secret safety checks available.','No deploy, rollback or secret access is performed by launcher.']);

const rollbackSchema = json('bootstrap/schema/rollback-plan.schema.json');
const rollbackExample = json('bootstrap/rollback/rollback-plan.example.json');
for (const field of requiredRollbackFields) {
  if (!rollbackSchema.required?.includes(field)) fail(`rollback schema missing required field: ${field}`);
  if (!(field in rollbackExample)) fail(`rollback example missing required field: ${field}`);
}
if (rollbackExample.rollbackMode !== 'operator_review_plan_only') fail('rollback example must use operator_review_plan_only.');
if (rollbackSchema.properties?.rollbackAvailable?.const !== true) fail('rollback schema must constrain rollbackAvailable to const true.');
if (rollbackSchema.properties?.rollbackAvailable?.type === 'boolean' && !('const' in rollbackSchema.properties.rollbackAvailable)) fail('rollback schema must not allow rollbackAvailable as unconstrained boolean.');
for (const flag of ['requiredHumanApprovalBeforeRollback','noRollbackPerformed','noDeletePerformed','noProviderCall','noLiveExecution','noSecretsIncluded']) if (rollbackExample[flag] !== true) fail(`rollback example flag must be true: ${flag}`);

for (const mode of ['all','managed','self-host']) {
  const report = buildGovernedDeployDoctorReport({ mode });
  if (report.noDeployPerformed !== true || report.noProviderCall !== true || report.noLiveExecution !== true || report.noSecretsRead !== true || report.noPrivateRuntimeIncluded !== true) fail(`deploy doctor unsafe flags for mode ${mode}`);
  if (/deploy performed|deployed successfully|deployment complete/i.test(JSON.stringify(report))) fail(`deploy doctor output implies deployment for mode ${mode}`);
}
const rollbackReport = buildRollbackDoctorReport();
if (rollbackReport.ok !== true) {
  for (const blocker of rollbackReport.blockers ?? []) fail(`checked-in rollback report blocked: ${blocker}`);
  if (!(rollbackReport.blockers ?? []).length) fail('checked-in rollback report is not ok.');
}
if (rollbackReport.rollbackReadinessStatus !== 'rollback_plan_ready_for_operator_review') fail(`checked-in rollback report has unexpected status: ${rollbackReport.rollbackReadinessStatus}`);
if ((rollbackReport.blockers ?? []).length > 0) {
  for (const blocker of rollbackReport.blockers) fail(`checked-in rollback blocker: ${blocker}`);
}
if (rollbackReport.noRollbackPerformed !== true || rollbackReport.noDeletePerformed !== true || rollbackReport.noProviderCall !== true || rollbackReport.noLiveExecution !== true) fail('rollback doctor unsafe flags.');
if (/rollback performed|rolled back successfully|delete performed/i.test(JSON.stringify(rollbackReport))) fail('rollback doctor output implies rollback/delete.');

const secretScanReport = runSecretSafetyCheck();
if (secretScanReport.ok !== true) {
  for (const finding of secretScanReport.blockedFindings ?? []) {
    const location = finding.line ? `${finding.file}:${finding.line}` : finding.file;
    fail(`secret safety scan blocked ${location}: ${finding.reason}`);
  }
  if (!(secretScanReport.blockedFindings ?? []).length) fail('secret safety scan failed without public findings.');
}

for (const script of ['scripts/governed-deploy-doctor.mjs','scripts/rollback-doctor.mjs','scripts/secret-safety-check.mjs']) {
  mustContain(script, ['fileURLToPath', 'resolve(process.argv[1]) === fileURLToPath(import.meta.url)']);
}

if (!isScannerInternalPatternLine('scripts/secret-safety-check.mjs', 'const tokenValuePattern = /fragment-only-regex-declaration/;')) fail('scanner internal helper rejected regex declaration.');
if (!isScannerInternalPatternLine('scripts/validate-launch-docs.mjs', "mustContain('x', ['public reason strings']);")) fail('scanner internal helper rejected validator pattern line.');
if (isScannerInternalPatternLine('src/A08_NEGATIVE.ts', 'const OPENAI_API_KEY = "actual-secret";')) fail('scanner internal helper allowed real source assignment.');

const blockedSecretSamples = [
  `{"${'api' + 'Key'}":"actual-secret"}`,
  `{"${'client' + '_secret'}":"actual-secret"}`,
  `{"${'password'}":"actual-secret"}`,
  `${'api' + '_key'}=actual-secret`,
  `${'OPENAI' + '_API_KEY'}=actual-secret`,
  `${'const OPENAI' + '_API_KEY'} = "actual-secret";`,
  `${'let STRIPE' + '_SECRET_KEY'} = "actual-secret";`,
  `${'var DATABASE' + '_PASSWORD'} = "actual-secret";`,
  `${'export const MY' + '_WEBHOOK_URL'} = "actual-secret";`,
  `${'const client' + 'Secret'} = "actual-secret";`,
  `${'const private' + 'Key'} = "actual-secret";`,
  `${'OPENAI' + '_API_KEY'}=actual-secret # example`,
  `${'OPENAI' + '_API_KEY'}=actual-secret # must stay outside`,
  `${'AWS' + '_ACCESS_KEY_ID'}=actual-secret`,
  `${'AWS' + '_SECRET_ACCESS_KEY'}=actual-secret`,
  `${'STRIPE' + '_SECRET_KEY'}=actual-secret`,
  `${'DATABASE' + '_PASSWORD'}=actual-secret`,
  `${'MY' + '_WEBHOOK_URL'}=actual-secret`,
  `${'MY' + '_ACCESS_TOKEN'}=actual-secret`,
  `${'MY' + '_REFRESH_TOKEN'}=actual-secret`,
  `${'MY' + '_CLIENT_SECRET'}=actual-secret`,
  `${'MY' + '_PRIVATE_KEY'}=actual-secret`,
  `${'PROVIDER' + '_PAYLOAD'}=actual-secret`,
  `{"${'OPENAI' + '_API_KEY'}":"actual-secret"}`,
  `{"${'stripe' + '_secret_key'}":"actual-secret"}`,
  `${'database' + 'Password'}: actual-secret`,
  `${'client' + 'Secret'}=actual-secret`,
  `${'private' + 'Key'}=actual-secret`,
  `${'ARG OPENAI' + '_API_KEY'}=actual-secret`,
  `${'ARG STRIPE' + '_SECRET_KEY'}=actual-secret`,
  `${'ENV OPENAI' + '_API_KEY'} actual-secret`,
  `${'ENV STRIPE' + '_SECRET_KEY'} actual-secret`,
  `${'ENV DATABASE' + '_PASSWORD'} actual-secret`,
  `${'ENV MY' + '_WEBHOOK_URL'} actual-secret`,
  `${'ENV OPENAI' + '_API_KEY'}=actual-secret`,
  `${'ENV OPENAI' + '_API_KEY'} "actual-secret"`
];
for (const sample of blockedSecretSamples) {
  if (!inspectSecretSafetyLine(sample, 'in-memory-regression.json').includes('sensitive_key_name_outside_safe_context')) fail('secret scanner regression missed blocked sensitive key sample.');
}
for (const key of ['OPENAI_API_KEY','STRIPE_SECRET_KEY','DATABASE_PASSWORD','MY_WEBHOOK_URL','MY_ACCESS_TOKEN','MY_REFRESH_TOKEN','MY_CLIENT_SECRET','MY_PRIVATE_KEY','PROVIDER_PAYLOAD','AWS_ACCESS_KEY_ID','AWS_SECRET_ACCESS_KEY','databasePassword','clientSecret','privateKey']) {
  if (!isSensitiveAssignmentKey(key)) fail(`secret scanner regression missed sensitive assignment key: ${key}`);
}
if (extractAssignmentKey(`${'OPENAI' + '_API_KEY'}=actual-secret`) !== 'OPENAI_API_KEY') fail('secret scanner regression failed to extract provider-prefixed assignment key.');
if (extractAssignmentKey(`${'const OPENAI' + '_API_KEY'} = "actual-secret";`) !== 'OPENAI_API_KEY') fail('secret scanner regression failed to extract source declaration assignment key.');
const dockerArgAssignment = extractDockerfileAssignment(`${'ARG OPENAI' + '_API_KEY'}=actual-secret`);
if (dockerArgAssignment?.key !== 'OPENAI_API_KEY' || dockerArgAssignment.value !== 'actual-secret') fail('secret scanner regression failed Dockerfile ARG key=value extraction.');
const dockerEnvAssignment = extractDockerfileAssignment(`${'ENV OPENAI' + '_API_KEY'} actual-secret`);
if (dockerEnvAssignment?.key !== 'OPENAI_API_KEY' || dockerEnvAssignment.value !== 'actual-secret') fail('secret scanner regression failed Dockerfile ENV space-form extraction.');
if (extractDockerfileAssignment(`${'ARG OPENAI' + '_API_KEY'}`) !== null) fail('Dockerfile ARG without default must not be treated as committed secret assignment.');
const extractedAssignment = extractAssignment(`${'OPENAI' + '_API_KEY'}=actual-secret # example`);
if (extractedAssignment?.key !== 'OPENAI_API_KEY' || extractedAssignment.value !== 'actual-secret') fail('secret scanner regression failed value-based assignment extraction.');
if (normalizeAssignmentKey('STRIPE_SECRET_KEY') !== 'stripesecretkey') fail('secret scanner regression failed assignment key normalization.');
if (!isPlaceholderValue('REPLACE_WITH_OPENAI_API_KEY', '.env.example')) fail('secret scanner regression rejected explicit placeholder value.');
if (isPlaceholderValue('actual-secret # example', '.env.example')) fail('secret scanner regression treated prose/comment as placeholder.');
if (!isHardSecretValue(`${'sk-' + '1234567890abcdef'} # example`)) fail('secret scanner regression missed hard token value.');
const allowedSecretSamples = [
  `{"${'api' + 'Key'}":"REPLACE_WITH_API_KEY"}`,
  `${'api' + '_key'}=REPLACE_WITH_API_KEY`,
  `${'WEBHOOK' + '_URL'}=REPLACE_WITH_WEBHOOK_URL`,
  `${'API' + '_KEY'}=<API_KEY_PLACEHOLDER>`,
  `${'OPENAI' + '_API_KEY'}=REPLACE_WITH_OPENAI_API_KEY`,
  `${'STRIPE' + '_SECRET_KEY'}=<STRIPE_SECRET_KEY_PLACEHOLDER>`,
  `${'DATABASE' + '_PASSWORD'}=YOUR_DATABASE_PASSWORD`,
  `${'API' + '_KEY'}=`,
  `{"${'DATABASE' + '_PASSWORD'}":"REPLACE_WITH_DATABASE_PASSWORD"}`,
  `${'const OPENAI' + '_API_KEY'} = "REPLACE_WITH_OPENAI_API_KEY";`,
  `${'export const STRIPE' + '_SECRET_KEY'} = "<STRIPE_SECRET_KEY_PLACEHOLDER>";`,
  `${'const DATABASE' + '_PASSWORD'} = "YOUR_DATABASE_PASSWORD";`,
  `${'ARG OPENAI' + '_API_KEY'}`,
  `${'ARG OPENAI' + '_API_KEY'}=REPLACE_WITH_OPENAI_API_KEY`,
  `${'ENV OPENAI' + '_API_KEY'} REPLACE_WITH_OPENAI_API_KEY`,
  `${'ENV STRIPE' + '_SECRET_KEY'} <STRIPE_SECRET_KEY_PLACEHOLDER>`
];
for (const sample of allowedSecretSamples) {
  if (inspectSecretSafetyLine(sample, '.env.example').length !== 0) fail('secret scanner regression blocked placeholder-safe sample.');
}

const blockedEnvExampleSamples = [
  `${'OPENAI' + '_API_KEY'}=${'sk-' + '1234567890abcdef'} # example`,
  `${'WEBHOOK' + '_URL'}=${'https://' + 'example.com' + '/webhook/abc'}`,
  `${'PRIVATE' + '_KEY'}=${'-----BEGIN ' + 'PRIVATE KEY-----'}`
];
for (const sample of blockedEnvExampleSamples) {
  if (inspectSecretSafetyLine(sample, '.env.example').length === 0) fail('secret scanner regression allowed real token/private-key/webhook pattern in .env.example.');
}

for (const path of ['id_rsa','id_dsa','id_ecdsa','id_ed25519','private.pem','client.key','bundle.p12','bundle.pfx','server.cer','server.crt','request.csr']) {
  if (!isSensitiveCredentialFilename(path)) fail(`secret scanner regression missed sensitive credential filename: ${path}`);
  if (!shouldScanSecretSafetyPath(path)) fail(`secret scanner regression skipped sensitive credential path: ${path}`);
}

for (const path of ['.npmrc','.netrc','.pypirc','kubeconfig','Dockerfile','Makefile','dockerfile','makefile']) {
  if (!isSecretBearingTextFilename(path)) fail(`secret scanner regression missed secret-bearing text filename: ${path}`);
  if (!shouldScanSecretSafetyPath(path)) fail(`secret scanner regression skipped secret-bearing text path: ${path}`);
}

for (const path of ['.aws/credentials','.aws/config','.kube/config','.docker/config.json']) {
  if (!isCredentialPath(path)) fail(`secret scanner regression missed credential path: ${path}`);
  if (!shouldScanSecretSafetyPath(path)) fail(`secret scanner regression skipped credential path: ${path}`);
}
for (const path of [join(root, '.aws', 'credentials'), join(root, '.aws', 'config'), join(root, '.kube', 'config'), join(root, '.docker', 'config.json')]) {
  if (!isCredentialPath(path)) fail(`secret scanner regression missed absolute credential path: ${path}`);
  if (!shouldScanSecretSafetyPath(path)) fail(`secret scanner regression skipped absolute credential path: ${path}`);
}
if (inspectSecretSafetyLine(`${'AWS' + '_ACCESS_KEY_ID'}=actual-secret`, '.aws/credentials').length === 0) fail('secret scanner regression allowed AWS access key in .aws/credentials.');
if (inspectSecretSafetyLine(`${'AWS' + '_SECRET_ACCESS_KEY'}=actual-secret`, '.aws/credentials').length === 0) fail('secret scanner regression allowed AWS secret key in .aws/credentials.');

for (const path of ['script.sh','shell.bash','shell.zsh','tool.py','component.ts','component.tsx','view.jsx','index.html','style.css','style.scss','config.toml','settings.ini','service.conf','app.cfg','app.properties','data.xml','data.csv']) {
  if (!shouldScanSecretSafetyPath(path)) fail(`secret scanner regression skipped common text/source path: ${path}`);
}

const blockedSecretBearingTextSamples = [
  { rel: '.aws/credentials', line: `${'AWS' + '_ACCESS_KEY_ID'}=actual-secret` },
  { rel: '.aws/credentials', line: `${'AWS' + '_SECRET_ACCESS_KEY'}=actual-secret` },
  { rel: '.npmrc', line: `${'TOKEN'}=${'ghp_' + '1234567890abcdefghijklmnop'}` },
  { rel: '.netrc', line: `${'password'}=${'actual-secret'}` },
  { rel: '.pypirc', line: `${'password'}=${'actual-secret'}` },
  { rel: 'kubeconfig', line: `${'access' + 'Token'}=${'actual-secret'}` },
  { rel: 'Dockerfile', line: `${'ENV OPENAI' + '_API_KEY'}=${'sk-' + '1234567890abcdef'}` },
  { rel: 'Makefile', line: `${'API' + '_KEY'}=${'actual-secret'}` },
  { rel: 'script.sh', line: `${'OPENAI' + '_API_KEY'}=actual-secret` },
  { rel: 'tool.py', line: `${'DATABASE' + '_PASSWORD'}=actual-secret` },
  { rel: 'component.ts', line: `${'STRIPE' + '_SECRET_KEY'}=actual-secret` },
  { rel: 'component.tsx', line: `${'MY' + '_WEBHOOK_URL'}=actual-secret` },
  { rel: 'config.toml', line: `${'DATABASE' + '_PASSWORD'}=actual-secret` },
  { rel: 'settings.ini', line: `${'DATABASE' + '_PASSWORD'}=actual-secret` },
  { rel: 'index.html', line: `${'client' + 'Secret'}=actual-secret` }
];
for (const sample of blockedSecretBearingTextSamples) {
  if (inspectSecretSafetyLine(sample.line, sample.rel).length === 0) fail(`secret scanner regression allowed secret-bearing text sample: ${sample.rel}`);
}

const rollbackUnavailableReport = buildRollbackDoctorReport({ planOverride: { ...rollbackExample, rollbackAvailable: false } });
if (rollbackUnavailableReport.ok !== false) fail('rollbackAvailable false must fail rollback readiness.');
if (rollbackUnavailableReport.rollbackReadinessStatus === 'rollback_plan_ready_for_operator_review') fail('rollbackAvailable false must not be ready for operator review.');
if (!rollbackUnavailableReport.publicReasonCodes.includes('blocked_rollback_unavailable')) fail('rollbackAvailable false must emit blocked_rollback_unavailable.');
for (const [field, expectedBlocker] of [
  ['evidenceExpected', 'Rollback plan must include expected evidence.'],
  ['operatorNextSteps', 'Rollback plan must include operator next steps.'],
  ['rollbackStepsPublicSafe', 'Rollback plan must include public-safe rollback steps.']
]) {
  const report = buildRollbackDoctorReport({ planOverride: { ...rollbackExample, [field]: [] } });
  if (report.ok !== false) fail(`${field} empty array must fail rollback readiness.`);
  if (report.rollbackReadinessStatus === 'rollback_plan_ready_for_operator_review') fail(`${field} empty array must not be ready for operator review.`);
  if (!report.blockers.includes(expectedBlocker)) fail(`${field} empty array must emit expected blocker.`);
}

if (errors.length) {
  console.error('v0.8-A08 deploy/rollback/secret doctors validator failed.');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('v0.8-A08 deploy/rollback/secret doctors validator passed.');
