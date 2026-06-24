import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  V1_ACTIVATION_RUNNER_OUTPUT_ROOT,
  assertPublicSafeOutput,
  buildDefaultV1ActivationPack,
  buildDryRunActivationPlan,
  buildPublicOutputRootSummary,
  writeActivationRunnerDryRun
} from '../src/activation/v1-activation-runner.mjs';

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function loadActivationPack() {
  const inputPath = argValue('--pack');
  if (!inputPath) return buildDefaultV1ActivationPack();
  return JSON.parse(readFileSync(resolve(inputPath), 'utf8'));
}

const outputRoot = argValue('--output') ?? V1_ACTIVATION_RUNNER_OUTPUT_ROOT;
const pack = loadActivationPack();
const written = writeActivationRunnerDryRun(pack, outputRoot);
const summary = assertPublicSafeOutput({
  command: 'capsule:activation:dry-run',
  ...buildPublicOutputRootSummary(outputRoot),
  written: written.length,
  dryRunPlan: buildDryRunActivationPlan(pack),
  publicSafe: true
}, 'capsule-activation-dry-run-summary.public.json');
console.log(JSON.stringify(summary, null, 2));
