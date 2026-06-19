import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const rollbackPlanPath = join(root, 'bootstrap', 'rollback', 'rollback-plan.example.json');
const requiredFields = ['rollbackPlanRef','stackRef','rollbackMode','rollbackAvailable','rollbackStepsPublicSafe','requiredHumanApprovalBeforeRollback','noRollbackPerformed','noDeletePerformed','noProviderCall','noLiveExecution','noSecretsIncluded','evidenceExpected','operatorNextSteps'];

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function buildRollbackDoctorReport() {
  const blockers = [];
  const warnings = [];
  const publicReasonCodes = [];
  let plan = null;

  if (!existsSync(rollbackPlanPath)) {
    blockers.push('Missing public-safe rollback plan example.');
    publicReasonCodes.push('blocked_missing_rollback_plan');
  } else {
    plan = readJson(rollbackPlanPath);
    for (const field of requiredFields) if (!(field in plan)) blockers.push(`Rollback plan missing required field: ${field}`);
    if (plan.rollbackMode !== 'operator_review_plan_only') blockers.push('Rollback mode must be operator_review_plan_only.');
    if (plan.requiredHumanApprovalBeforeRollback !== true) blockers.push('Rollback plan must require human approval.');
    if (plan.noRollbackPerformed !== true || plan.noDeletePerformed !== true || plan.noProviderCall !== true || plan.noLiveExecution !== true || plan.noSecretsIncluded !== true) blockers.push('Rollback plan must assert no rollback, delete, provider call, live execution or secrets.');
    if (!Array.isArray(plan.rollbackStepsPublicSafe) || plan.rollbackStepsPublicSafe.length === 0) warnings.push('Rollback plan should include public-safe operator review steps.');
  }

  const ok = blockers.length === 0;
  return {
    sourceContract: 'launcher_v0_8_a08_rollback_doctor_report',
    ok,
    rollbackReadinessStatus: ok ? 'rollback_plan_ready_for_operator_review' : 'blocked_rollback_plan_shape',
    blockers,
    warnings,
    publicReasonCodes: publicReasonCodes.length ? publicReasonCodes : [ok ? 'rollback_plan_ready_for_operator_review' : 'blocked_rollback_plan_shape'],
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

const invoked = import.meta.url === `file://${process.argv[1]}`;
if (invoked) {
  const json = process.argv.includes('--json');
  const report = buildRollbackDoctorReport();
  if (json) console.log(JSON.stringify(report, null, 2));
  else printHuman(report);
  process.exitCode = report.ok ? 0 : 1;
}
