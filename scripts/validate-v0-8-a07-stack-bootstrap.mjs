import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'bootstrap/README.md',
  'bootstrap/stack/managed.stack.manifest.json',
  'bootstrap/stack/self-host.stack.manifest.json',
  'bootstrap/schema/stack-bootstrap-manifest.schema.json',
  'bootstrap/examples/local-stack.config.example.json',
  'bootstrap/examples/managed-cloud-handoff.example.json',
  'scripts/bootstrap-stack-plan.mjs',
  'docs/infra/MANAGED_SELF_HOST_LOCAL_STACK_BOOTSTRAP_v0_8_A07.md',
  'docs/release/TRANSFORMIA_CAPSULE_LAUNCHER_V0_8_A07_MANAGED_SELF_HOST_LOCAL_STACK_BOOTSTRAP.md'
];
const requiredFields = [
  'schemaVersion','atlasItem','bootstrapMode','stackRef','displayName','publicSafe','sourceAvailableBoundary','privateCoreIncluded','noSecretsIncluded','noProviderCall','noLiveExecution','noN8nExecution','noWebhookServer','noDatabaseProvisioning','noBinaryInstaller','noDockerStart','noCloudDeploy','humanApprovalRequiredBeforeLive','components','requiredLocalCapabilities','excludedCapabilities','operatorNextSteps','validationCommands','publicSafeSummary'
];
const trueFlags = ['publicSafe','sourceAvailableBoundary','noSecretsIncluded','noProviderCall','noLiveExecution','noN8nExecution','noWebhookServer','noDatabaseProvisioning','noBinaryInstaller','noDockerStart','noCloudDeploy','humanApprovalRequiredBeforeLive'];
const errors = [];

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

function readJson(path) {
  try { return JSON.parse(read(path)); }
  catch { errors.push(`${path}: invalid JSON`); return null; }
}

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) errors.push(`${file}: missing`);
}

const schema = existsSync(join(root, 'bootstrap/schema/stack-bootstrap-manifest.schema.json')) ? readJson('bootstrap/schema/stack-bootstrap-manifest.schema.json') : null;
if (schema) {
  for (const field of requiredFields) {
    if (!schema.requiredFields?.includes(field)) errors.push(`schema missing required field ${field}`);
  }
}

const manifests = [
  ['bootstrap/stack/managed.stack.manifest.json', 'managed_cloud_handoff'],
  ['bootstrap/stack/self-host.stack.manifest.json', 'self_host_local_plan']
];
for (const [file, expectedMode] of manifests) {
  const manifest = existsSync(join(root, file)) ? readJson(file) : null;
  if (!manifest) continue;
  for (const field of requiredFields) if (!(field in manifest)) errors.push(`${file}: missing ${field}`);
  if (manifest.atlasItem !== 'v0.8-A07') errors.push(`${file}: wrong atlasItem`);
  if (manifest.bootstrapMode !== expectedMode) errors.push(`${file}: wrong bootstrapMode`);
  if (manifest.privateCoreIncluded !== false) errors.push(`${file}: privateCoreIncluded must be false`);
  for (const flag of trueFlags) if (manifest[flag] !== true) errors.push(`${file}: ${flag} must be true`);
  for (const field of ['components','requiredLocalCapabilities','excludedCapabilities','operatorNextSteps','validationCommands']) {
    if (!Array.isArray(manifest[field]) || manifest[field].length === 0) errors.push(`${file}: ${field} must be a non-empty array`);
  }
}

for (const example of ['bootstrap/examples/local-stack.config.example.json','bootstrap/examples/managed-cloud-handoff.example.json']) {
  const config = existsSync(join(root, example)) ? readJson(example) : null;
  if (!config) continue;
  if (config.atlasItem !== 'v0.8-A07') errors.push(`${example}: wrong atlasItem`);
  if (config.planOnly !== true || config.publicSafe !== true) errors.push(`${example}: must be public-safe and plan-only`);
  if (config.privateCoreIncluded !== false) errors.push(`${example}: privateCoreIncluded must be false`);
  for (const flag of ['noSecretsIncluded','noProviderCall','noLiveExecution']) if (config[flag] !== true) errors.push(`${example}: ${flag} must be true`);
}

function listFiles(dir) {
  if (!existsSync(join(root, dir))) return [];
  return readdirSync(join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const rel = `${dir}/${entry.name}`;
    return entry.isDirectory() ? listFiles(rel) : [rel];
  });
}

const scannedFiles = [
  'README.md',
  'package.json',
  ...listFiles('bootstrap'),
  'docs/infra/MANAGED_SELF_HOST_LOCAL_STACK_BOOTSTRAP_v0_8_A07.md',
  'docs/release/TRANSFORMIA_CAPSULE_LAUNCHER_V0_8_A07_MANAGED_SELF_HOST_LOCAL_STACK_BOOTSTRAP.md',
  'scripts/bootstrap-stack-plan.mjs'
].filter((file) => existsSync(join(root, file)) && statSync(join(root, file)).isFile());

const forbiddenClaims = [
  [/production ready/i, 'production ready claim'],
  [/one-click installer/i, 'one-click installer claim'],
  [/starts Docker/i, 'starts Docker claim'],
  [/deploys cloud/i, 'deploys cloud claim'],
  [/docker compose up/i, 'Docker compose execution claim'],
  [/docker run/i, 'Docker run claim'],
  [/n8n start/i, 'n8n start claim'],
  [/supabase start/i, 'Supabase start claim'],
  [/databaseUrl/i, 'database URL field'],
  [/accessToken/i, 'access token field'],
  [/apiKey/i, 'API key field'],
  [/webhookUrl/i, 'webhook URL field'],
  [/private runtime clone/i, 'private runtime clone text'],
  [/gh repo clone TransformIA-AI\/transformia-exocortex-runtime/i, 'private runtime clone command'],
  [/customer data/i, 'customer data material claim'],
  [/raw evidence/i, 'raw evidence material claim']
];

for (const file of scannedFiles) {
  const text = read(file);
  for (const [pattern, label] of forbiddenClaims) {
    const allowBoundary = /does not include customer data|No raw connector payloads, raw evidence|customer data and live connector execution stay out|customer material, raw evidence/i.test(text);
    if (pattern.test(text) && !(allowBoundary && (label.includes('customer data') || label.includes('raw evidence')))) errors.push(`${file}: forbidden ${label}`);
  }
  if (/sk-[A-Za-z0-9]{12,}|xox[baprs]-|-----BEGIN PRIVATE KEY-----/i.test(text)) errors.push(`${file}: credential-shaped string`);
  if (/https?:\/\/(hooks|webhook)\./i.test(text)) errors.push(`${file}: webhook URL`);
}

const planner = existsSync(join(root, 'scripts/bootstrap-stack-plan.mjs')) ? read('scripts/bootstrap-stack-plan.mjs') : '';
const plannerForbidden = [
  ['fetch' + '(', 'network fetch'],
  ['axios', 'axios'],
  ['node:http', 'node:http'],
  ['node:https', 'node:https'],
  ['child_process', 'child process'],
  ['prisma', 'prisma']
];
for (const [needle, label] of plannerForbidden) if (planner.includes(needle)) errors.push(`scripts/bootstrap-stack-plan.mjs: forbidden ${label}`);

const requiredPlannerSourceSnippets = [
  "['managed', 'managed_cloud_handoff']",
  "['self-host', 'self_host_local_plan']",
  'Unknown bootstrap mode.',
  'Config bootstrapMode is unknown.',
  'Config bootstrapMode differs from selected mode.',
  'return config.bootstrapMode;',
  "return 'self_host_local_plan';"
];
for (const snippet of requiredPlannerSourceSnippets) {
  if (!planner.includes(snippet)) errors.push(`scripts/bootstrap-stack-plan.mjs missing guardrail source: ${snippet}`);
}
if (/modeArg\s*===\s*['"]self-host['"]\s*\?\s*['"]self_host_local_plan['"]\s*:\s*modeArg\s*===\s*['"]managed['"]\s*\?\s*['"]managed_cloud_handoff['"]\s*:\s*['"]self_host_local_plan['"]/s.test(planner)) {
  errors.push('scripts/bootstrap-stack-plan.mjs still falls back from unknown --mode to self_host_local_plan');
}
if (/config\.bootstrapMode\s*&&\s*config\.bootstrapMode\s*!==\s*[^\n]+warnings\.push/s.test(planner)) {
  errors.push('scripts/bootstrap-stack-plan.mjs still treats config/mode mismatch as warning-only');
}

function runPlanner(args, expectedStatus, expectedText) {
  const result = spawnSync(process.execPath, ['scripts/bootstrap-stack-plan.mjs', ...args], {
    cwd: root,
    encoding: 'utf8'
  });
  if (result.status !== expectedStatus) errors.push(`planner ${args.join(' ')} exited ${result.status}, expected ${expectedStatus}`);
  const output = `${result.stdout}\n${result.stderr}`;
  if (expectedText && !output.includes(expectedText)) errors.push(`planner ${args.join(' ')} missing output: ${expectedText}`);
}

runPlanner(['--mode', 'managedd'], 1, 'Unknown bootstrap mode.');
runPlanner(['--mode', 'local'], 1, 'Unknown bootstrap mode.');
runPlanner(['--config', 'bootstrap/examples/managed-cloud-handoff.example.json'], 0, 'Mode: managed_cloud_handoff');
runPlanner(['--mode', 'self-host', '--config', 'bootstrap/examples/managed-cloud-handoff.example.json'], 1, 'Config bootstrapMode differs from selected mode.');
runPlanner(['--mode', 'managed', '--config', 'bootstrap/examples/local-stack.config.example.json'], 1, 'Config bootstrapMode differs from selected mode.');
runPlanner(['--mode', 'managedd', '--json'], 1, '"ok": false');

const docText = ['README.md','bootstrap/README.md','docs/infra/MANAGED_SELF_HOST_LOCAL_STACK_BOOTSTRAP_v0_8_A07.md','docs/release/TRANSFORMIA_CAPSULE_LAUNCHER_V0_8_A07_MANAGED_SELF_HOST_LOCAL_STACK_BOOTSTRAP.md']
  .filter((file) => existsSync(join(root, file)))
  .map(read)
  .join('\n')
  .toLowerCase();
for (const phrase of ['no live','no credentials','private core is not included','human approval']) {
  if (!docText.includes(phrase)) errors.push(`docs missing phrase: ${phrase}`);
}

if (errors.length) {
  console.error('v0.8-A07 stack bootstrap validation failed.');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('v0.8-A07 stack bootstrap validation OK.');
