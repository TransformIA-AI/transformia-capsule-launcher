import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  V1_ACTIVATION_RUNNER_OUTPUT_ROOT,
  assertPublicSafeOutput,
  buildActivationEvidencePack,
  buildDefaultV1ActivationPack,
  buildPublicOutputRootSummary,
  runActivationDoctor,
  writeActivationRunnerEvidencePack
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
const doctorReport = runActivationDoctor({ root: process.cwd(), activationPack: pack });
const written = writeActivationRunnerEvidencePack(pack, outputRoot, { root: process.cwd(), doctorReport });
const summary = assertPublicSafeOutput({
  command: 'capsule:activation:evidence',
  ...buildPublicOutputRootSummary(outputRoot),
  written: written.length,
  evidencePack: buildActivationEvidencePack(pack, { root: process.cwd(), doctorReport }),
  publicSafe: true
}, 'capsule-activation-evidence-summary.public.json');
console.log(JSON.stringify(summary, null, 2));
