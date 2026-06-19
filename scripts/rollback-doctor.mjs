import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const root = process.cwd();
const rollbackPlanPath = join(root, 'bootstrap', 'rollback', 'rollback-plan.example.json');
const requiredFields = ['rollbackPlanRef','stackRef','rollbackMode','rollbackAvailable','rollbackStepsPublicSafe','requiredHumanApprovalBeforeRollback','noRollbackPerformed','noDeletePerformed','noProviderCall','noLiveExecution','noSecretsIncluded','evidenceExpected','operatorNextSteps'];

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function validateRollbackPlan(plan) {
  const blockers = [];
  const warnings = [];
  const publicReasonCodes = [];

  for (const field of requiredFields) if (!(field in plan)) blockers.push(`Rollback plan missing required field: ${field}`);
  if (plan.rollbackMode !== 'operator_review_plan_only') blockers.push('Rollback mode must be operator_review_plan_only.');
  if (plan.rollbackAvailable !== true) {
    blockers.push('Rollback plan must declare rollbackAvailable true.');
    publicReasonCodes.push('blocked_rollback_unavailable');
  }
  if (plan.requiredHumanApprovalBeforeRollback !== true) blockers.push('Rollback plan must require human approval.');
  if (plan.noRollbackPerformed !== true || plan.noDeletePerformed !== true || plan.noProviderCall !== true || plan.noLiveExecution !== true || plan.noSecretsIncluded !== true) blockers.push('Rollback plan must assert no rollback, delete, provider call, live execution or secrets.');
  if (!Array.isArray(plan.rollbackStepsPublicSafe) || plan.rollbackStepsPublicSafe.length === 0) blockers.push('Rollback plan must include public-safe rollback steps.');
  if (!Array.isArray(plan.evidenceExpected) || plan.evidenceExpected.length === 0) blockers.push('Rollback plan must include expected evidence.');
  if (!Array.isArray(plan.operatorNextSteps) || plan.operatorNextSteps.length === 0) blockers.push('Rollback plan must include operator next steps.');

  return { blockers, warnings, publicReasonCodes };
}

export function buildRollbackDoctorReport(options = {}) {
  const blockers = [];
  const warnings = [];
  const publicReasonCodes = [];
  let plan = options.planOverride ?? null;

  if (!plan) {
    if (!existsSync(rollbackPlanPath)) {
      blockers.push('Missing public-safe rollback plan example.');
      publicReasonCodes.push('blocked_missing_rollback_plan');
    } else {
      plan = readJson(rollbackPlanPath);
    }
  }

  if (plan) {
    const validation = validateRollbackPlan(plan);
    blockers.push(...validation.blockers);
    warnings.push(...validation.warnings);
    publicReasonCodes.push(...validation.publicReasonCodes);
  }

  const ok = blockers.length === 0;
  const blockedStatus = publicReasonCodes.includes('blocked_rollback_unavailable') ? 'blocked_rollback_unavailable' : 'blocked_rollback_plan_shape';
  return {
    sourceContract: 'launcher_v0_8_a08_rollback_doctor_report',
    ok,
    rollbackReadinessStatus: ok ? 'rollback_plan_ready_for_operator_review' : blockedStatus,
    blockers,
    warnings,
    publicReasonCodes: publicReasonCodes.length ? publicReasonCodes : [ok ? 'rollback_plan_ready_for_operator_review' : blockedStatus],
    publicSafeSummary: 'Rollback Doctor validates rollback plan shape only. It does not rollback, delete, mutate config, run shell commands, call providers or perform live execution.',
    noRollbackPerformed: true,
    noDeletePerformed: true,
    noProviderCall: true,
    noLiveExecution: true
  };
}

function printHuman(report) {
  console.log('Rollback Doctor available.');
  console.log(`Rollback readiness status: ${report.rollbackReadinessStatus}`);
  for (const warning of report.warnings) console.log(`Warning: ${warning}`);
  for (const blocker of report.blockers) console.log(`Blocker: ${blocker}`);
  console.log(report.publicSafeSummary);
  console.log('No rollback, delete, provider call or live execution was performed.');
}

const invoked = process.argv[1]
  ? resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false;
if (invoked) {
  const json = process.argv.includes('--json');
  const report = buildRollbackDoctorReport();
  if (json) console.log(JSON.stringify(report, null, 2));
  else printHuman(report);
  process.exitCode = report.ok ? 0 : 1;
}
