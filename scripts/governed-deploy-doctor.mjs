import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const managedPath = join(root, 'bootstrap', 'stack', 'managed.stack.manifest.json');
const selfHostPath = join(root, 'bootstrap', 'stack', 'self-host.stack.manifest.json');
const rollbackPath = join(root, 'bootstrap', 'rollback', 'rollback-plan.example.json');
const allowedModes = new Set(['all', 'managed', 'self-host']);
const allowedStatuses = new Set([
  'plan_ready_for_operator_review',
  'blocked_missing_a07_bootstrap',
  'blocked_secret_risk',
  'blocked_private_core_boundary',
  'blocked_false_production_claim',
  'blocked_missing_rollback_plan',
  'blocked_unknown_stack_mode'
]);

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function selectedManifestPaths(mode) {
  if (mode === 'managed') return [managedPath];
  if (mode === 'self-host') return [selfHostPath];
  return [managedPath, selfHostPath];
}

function parseArgs(argv) {
  const args = { mode: 'all', json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--json') args.json = true;
    else if (arg === '--mode') args.mode = argv[index + 1] ?? 'all', index += 1;
    else if (arg.startsWith('--mode=')) args.mode = arg.slice('--mode='.length);
  }
  return args;
}

export function buildGovernedDeployDoctorReport(options = {}) {
  const mode = options.mode ?? 'all';
  const blockers = [];
  const warnings = [];
  const checks = [];
  const publicReasonCodes = [];

  if (!allowedModes.has(mode)) {
    blockers.push('Unknown stack mode. Use managed, self-host or omit --mode for both plans.');
    publicReasonCodes.push('blocked_unknown_stack_mode');
  }

  const paths = allowedModes.has(mode) ? selectedManifestPaths(mode) : [];
  for (const path of paths) {
    if (!existsSync(path)) {
      blockers.push('Missing A07 bootstrap manifest required before A08 deploy readiness review.');
      publicReasonCodes.push('blocked_missing_a07_bootstrap');
      continue;
    }
    const manifest = readJson(path);
    checks.push({ check: `manifest:${manifest.bootstrapMode ?? 'unknown'}`, ok: true, file: path.replace(`${root}/`, '') });
    if (manifest.noSecretsIncluded !== true) blockers.push('Bootstrap manifest does not assert noSecretsIncluded.');
    if (manifest.privateCoreIncluded !== false) blockers.push('Bootstrap manifest violates private core boundary.');
    if (manifest.noCloudDeploy !== true || manifest.noLiveExecution !== true || manifest.noProviderCall !== true) blockers.push('Bootstrap manifest must remain plan-only with no live/provider/deploy action.');
    if (manifest.noSecretsIncluded !== true) publicReasonCodes.push('blocked_secret_risk');
    if (manifest.privateCoreIncluded !== false) publicReasonCodes.push('blocked_private_core_boundary');
    if (manifest.noCloudDeploy !== true || manifest.noLiveExecution !== true || manifest.noProviderCall !== true) publicReasonCodes.push('blocked_false_production_claim');
  }

  if (!existsSync(rollbackPath)) {
    blockers.push('Missing rollback plan example. Deploy readiness must be reversible as an operator-reviewed plan.');
    publicReasonCodes.push('blocked_missing_rollback_plan');
  } else {
    checks.push({ check: 'rollback-plan-example-present', ok: true, file: 'bootstrap/rollback/rollback-plan.example.json' });
  }

  if (!checks.length && !blockers.length) warnings.push('No stack manifest was selected for review.');
  const deployReadinessStatus = blockers.length ? (publicReasonCodes[0] ?? 'blocked_false_production_claim') : 'plan_ready_for_operator_review';

  if (!allowedStatuses.has(deployReadinessStatus)) blockers.push('Internal status is not an allowed A08 deploy readiness status.');

  return {
    sourceContract: 'launcher_v0_8_a08_governed_deploy_doctor_report',
    ok: blockers.length === 0,
    mode,
    deployReadinessStatus,
    blockers: [...new Set(blockers)],
    warnings,
    checks,
    publicReasonCodes: [...new Set(publicReasonCodes.length ? publicReasonCodes : ['plan_ready_for_operator_review'])],
    publicSafeSummary: 'Inspection-only deploy readiness report. Launcher reviews public A07 bootstrap manifests and rollback-plan presence; it does not deploy, start services, connect providers, read secrets or include private runtime.',
    noDeployPerformed: true,
    noProviderCall: true,
    noLiveExecution: true,
    noSecretsRead: true,
    noPrivateRuntimeIncluded: true
  };
}

function printHuman(report) {
  console.log('Governed Deploy Doctor available.');
  console.log(`Mode: ${report.mode}`);
  console.log(`Deploy readiness status: ${report.deployReadinessStatus}`);
  for (const check of report.checks) console.log(`OK: ${check.check}`);
  for (const warning of report.warnings) console.log(`Warning: ${warning}`);
  for (const blocker of report.blockers) console.log(`Blocker: ${blocker}`);
  console.log(report.publicSafeSummary);
  console.log('No deploy, provider call, live execution, secret read or private runtime inclusion was performed.');
}

const invoked = import.meta.url === `file://${process.argv[1]}`;
if (invoked) {
  const args = parseArgs(process.argv.slice(2));
  const report = buildGovernedDeployDoctorReport({ mode: args.mode });
  if (args.json) console.log(JSON.stringify(report, null, 2));
  else printHuman(report);
  process.exitCode = report.ok ? 0 : 1;
}
