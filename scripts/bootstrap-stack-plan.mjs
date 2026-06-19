import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = process.cwd();
const parsedArgs = parseArgs(process.argv.slice(2));
const modeArg = parsedArgs.mode;
const configPath = parsedArgs.config;
const jsonOutput = parsedArgs.json;
const cliModeMap = new Map([
  ['managed', 'managed_cloud_handoff'],
  ['self-host', 'self_host_local_plan']
]);
const validBootstrapModes = new Set(['managed_cloud_handoff', 'self_host_local_plan']);
const blockers = [];
const warnings = [];
const requiredTrue = ['publicSafe','sourceAvailableBoundary','noSecretsIncluded','noProviderCall','noLiveExecution','noN8nExecution','noWebhookServer','noDatabaseProvisioning','noBinaryInstaller','noDockerStart','noCloudDeploy','humanApprovalRequiredBeforeLive'];

export function parseArgs(argv) {
  const parsed = { mode: null, config: null, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') continue;
    if (arg === '--json') {
      parsed.json = true;
    } else if (arg === '--mode') {
      parsed.mode = argv[index + 1] ?? null;
      index += 1;
    } else if (arg.startsWith('--mode=')) {
      parsed.mode = arg.slice('--mode='.length);
    } else if (arg === '--config') {
      parsed.config = argv[index + 1] ?? null;
      index += 1;
    } else if (arg.startsWith('--config=')) {
      parsed.config = arg.slice('--config='.length);
    }
  }
  return parsed;
}

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    blockers.push(`${label} could not be read as JSON.`);
    return null;
  }
}

function loadConfig(path) {
  if (!path) return null;
  const resolved = resolve(root, path);
  if (!existsSync(resolved)) {
    blockers.push('Provided config path does not exist.');
    return null;
  }
  return readJson(resolved, 'Config');
}

function resolveSelectedMode(config) {
  if (modeArg !== null) {
    if (!cliModeMap.has(modeArg)) {
      blockers.push('Unknown bootstrap mode.');
      return null;
    }
    return cliModeMap.get(modeArg);
  }

  if (config?.bootstrapMode) {
    if (!validBootstrapModes.has(config.bootstrapMode)) {
      blockers.push('Config bootstrapMode is unknown.');
      return null;
    }
    return config.bootstrapMode;
  }

  return 'self_host_local_plan';
}

function validateManifest(manifest, selectedMode) {
  if (!manifest || !selectedMode) return;
  if (manifest.atlasItem !== 'v0.8-A07') blockers.push('Manifest atlasItem must be v0.8-A07.');
  if (manifest.bootstrapMode !== selectedMode) blockers.push('Manifest mode does not match selected mode.');
  if (manifest.privateCoreIncluded !== false) blockers.push('Manifest must state privateCoreIncluded false.');
  for (const flag of requiredTrue) {
    if (manifest[flag] !== true) blockers.push(`Manifest must set ${flag} true.`);
  }
  for (const field of ['components','requiredLocalCapabilities','excludedCapabilities','operatorNextSteps','validationCommands']) {
    if (!Array.isArray(manifest[field]) || manifest[field].length === 0) blockers.push(`Manifest must include non-empty ${field}.`);
  }
  if (typeof manifest.publicSafeSummary !== 'string' || manifest.publicSafeSummary.length < 40) blockers.push('Manifest needs a publicSafeSummary.');
}

function validateConfig(config, selectedMode) {
  if (!config) return;
  if (config.atlasItem !== 'v0.8-A07') blockers.push('Config atlasItem must be v0.8-A07.');
  if (config.bootstrapMode && !validBootstrapModes.has(config.bootstrapMode)) blockers.push('Config bootstrapMode is unknown.');
  if (config.bootstrapMode && selectedMode && config.bootstrapMode !== selectedMode) blockers.push('Config bootstrapMode differs from selected mode.');
  if (config.planOnly !== true || config.publicSafe !== true) blockers.push('Config must be public-safe and plan-only.');
  if (config.privateCoreIncluded !== false) blockers.push('Config must keep privateCoreIncluded false.');
  for (const flag of ['noSecretsIncluded','noProviderCall','noLiveExecution']) {
    if (config[flag] !== true) blockers.push(`Config must set ${flag} true.`);
  }
}

const config = loadConfig(configPath);
const selectedMode = resolveSelectedMode(config);
const manifestPath = selectedMode
  ? join(root, 'bootstrap', 'stack', selectedMode === 'managed_cloud_handoff' ? 'managed.stack.manifest.json' : 'self-host.stack.manifest.json')
  : null;

if (selectedMode && !existsSync(manifestPath)) blockers.push('Requested stack manifest is missing.');
const manifest = selectedMode && existsSync(manifestPath) ? readJson(manifestPath, 'Stack manifest') : null;
validateConfig(config, selectedMode);
validateManifest(manifest, selectedMode);

const plan = {
  sourceContract: 'launcher_v0_8_a07_stack_bootstrap_plan',
  ok: blockers.length === 0,
  bootstrapMode: manifest?.bootstrapMode ?? selectedMode,
  stackRef: manifest?.stackRef ?? null,
  blockers,
  warnings,
  publicReasonCodes: [
    'plan_only',
    'private_core_not_included',
    'no_credentials_requested',
    'no_provider_calls',
    'no_service_start',
    'human_approval_before_live'
  ],
  publicSafeSummary: manifest?.publicSafeSummary ?? 'A07 stack bootstrap plan could not be loaded.',
  noSecretsIncluded: true,
  noProviderCall: true,
  noLiveExecution: true,
  noCloudDeploy: true,
  noBinaryInstaller: true
};

if (jsonOutput) {
  console.log(JSON.stringify(plan, null, 2));
} else {
  console.log(`TransformIA Capsule Launcher A07 stack bootstrap plan`);
  console.log(`Mode: ${plan.bootstrapMode ?? 'unavailable'}`);
  console.log(`Stack ref: ${plan.stackRef ?? 'unavailable'}`);
  console.log(`Status: ${plan.ok ? 'OK' : 'BLOCKED'}`);
  console.log('');
  console.log(plan.publicSafeSummary);
  console.log('');
  console.log('Safety boundaries:');
  console.log('- Private core is not included.');
  console.log('- No credentials are requested, read or stored.');
  console.log('- No provider calls, n8n execution, webhook server, database provisioning, Docker start, Cloud deployment or binary installer are performed.');
  console.log('- Human approval is required before any future live activation.');
  if (manifest?.operatorNextSteps?.length) {
    console.log('');
    console.log('Operator next steps:');
    for (const step of manifest.operatorNextSteps) console.log(`- ${step}`);
  }
  if (warnings.length) {
    console.log('');
    console.log('Warnings:');
    for (const warning of warnings) console.log(`- ${warning}`);
  }
  if (blockers.length) {
    console.log('');
    console.log('Blockers:');
    for (const blocker of blockers) console.log(`- ${blocker}`);
  }
}

process.exit(plan.ok ? 0 : 1);
