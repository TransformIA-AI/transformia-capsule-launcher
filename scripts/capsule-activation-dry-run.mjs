import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  V1_ACTIVATION_RUNNER_OUTPUT_ROOT,
  buildDefaultV1ActivationPack,
  buildDryRunActivationPlan,
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
console.log(JSON.stringify({
  command: 'capsule:activation:dry-run',
  outputRoot,
  written: written.length,
  dryRunPlan: buildDryRunActivationPlan(pack),
  publicSafe: true
}, null, 2));
