import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildGovernedDeployDoctorReport } from './governed-deploy-doctor.mjs';
import { buildRollbackDoctorReport } from './rollback-doctor.mjs';
import { extractAssignmentKey, inspectSecretSafetyLine, isSecretBearingTextFilename, isSensitiveAssignmentKey, isSensitiveCredentialFilename, runSecretSafetyCheck, shouldScanSecretSafetyPath } from './secret-safety-check.mjs';

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

mustNotMatch('scripts/governed-deploy-doctor.mjs', [/child_process/, /fetch\s*\(/, /https?:\/\//, /docker\b/i, /n8n/i, /stripe/i, /postgres|mysql|mongodb/i, /provider sdk/i], 'deploy execution path');
mustNotMatch('scripts/rollback-doctor.mjs', [/child_process/, /fetch\s*\(/, /https?:\/\//, /rmSync\s*\(/, /unlinkSync\s*\(/, /writeFileSync\s*\(/, /renameSync\s*\(/, /docker\b/i, /provider sdk/i], 'rollback mutation path');
mustContain('scripts/secret-safety-check.mjs', ['runSecretSafetyCheck', 'inspectSecretSafetyLine', 'extractAssignmentKey', 'isSensitiveAssignmentKey', 'isSensitiveCredentialFilename', 'isSecretBearingTextFilename', 'shouldScanSecretSafetyPath', 'secretBearingTextBasenames', '.npmrc', '.netrc', '.pypirc', 'kubeconfig', 'Dockerfile', 'Makefile', 'sensitive_credential_file_not_allowed', 'real_env_file_not_allowed', 'private_key_block', 'webhook_url', 'noSecretsRead', 'if (tokenValuePattern.test(line) || privateKeyPattern.test(line) || webhookUrlPattern.test(line)) return false;']);
mustNotMatch('scripts/secret-safety-check.mjs', [/child_process/, /fetch\s*\(/, /https?:\/\//, /docker\b/i, /n8n/i, /postgres|mysql|mongodb/i], 'secret checker live path');

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

const blockedSecretSamples = [
  `{"${'api' + 'Key'}":"actual-secret"}`,
  `{"${'client' + '_secret'}":"actual-secret"}`,
  `{"${'password'}":"actual-secret"}`,
  `${'api' + '_key'}=actual-secret`,
  `${'OPENAI' + '_API_KEY'}=actual-secret`,
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
  `${'private' + 'Key'}=actual-secret`
];
for (const sample of blockedSecretSamples) {
  if (!inspectSecretSafetyLine(sample, 'in-memory-regression.json').includes('sensitive_key_name_outside_safe_context')) fail('secret scanner regression missed blocked sensitive key sample.');
}
for (const key of ['OPENAI_API_KEY','STRIPE_SECRET_KEY','DATABASE_PASSWORD','MY_WEBHOOK_URL','MY_ACCESS_TOKEN','MY_REFRESH_TOKEN','MY_CLIENT_SECRET','MY_PRIVATE_KEY','PROVIDER_PAYLOAD','databasePassword','clientSecret','privateKey']) {
  if (!isSensitiveAssignmentKey(key)) fail(`secret scanner regression missed sensitive assignment key: ${key}`);
}
if (extractAssignmentKey(`${'OPENAI' + '_API_KEY'}=actual-secret`) !== 'OPENAI_API_KEY') fail('secret scanner regression failed to extract provider-prefixed assignment key.');
const allowedSecretSamples = [
  `{"${'api' + 'Key'}":"REPLACE_WITH_API_KEY"}`,
  `${'api' + '_key'}=REPLACE_WITH_API_KEY`,
  `${'WEBHOOK' + '_URL'}=REPLACE_WITH_WEBHOOK_URL`,
  `${'API' + '_KEY'}=<API_KEY_PLACEHOLDER>`,
  `${'OPENAI' + '_API_KEY'}=REPLACE_WITH_OPENAI_API_KEY`,
  `${'STRIPE' + '_SECRET_KEY'}=<STRIPE_SECRET_KEY_PLACEHOLDER>`,
  `{"${'DATABASE' + '_PASSWORD'}":"REPLACE_WITH_DATABASE_PASSWORD"}`
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

for (const path of ['script.sh','shell.bash','shell.zsh','tool.py','component.ts','component.tsx','view.jsx','index.html','style.css','style.scss','config.toml','settings.ini','service.conf','app.cfg','app.properties','data.xml','data.csv']) {
  if (!shouldScanSecretSafetyPath(path)) fail(`secret scanner regression skipped common text/source path: ${path}`);
}

const blockedSecretBearingTextSamples = [
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

if (errors.length) {
  console.error('v0.8-A08 deploy/rollback/secret doctors validator failed.');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('v0.8-A08 deploy/rollback/secret doctors validator passed.');
