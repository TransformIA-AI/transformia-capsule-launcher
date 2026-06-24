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

function failCliArgument(errorCode) {
  console.error(JSON.stringify({
    ok: false,
    status: 'blocked_cli_arguments',
    errorCode,
    publicSafe: true
  }, null, 2));
  process.exit(1);
}

function argValue(name, label) {
  const index = process.argv.indexOf(name);
  if (index < 0) return undefined;
  const value = process.argv[index + 1];
  if (typeof value !== 'string' || value.length === 0) failCliArgument(`missing_cli_value:${label}`);
  if (value.startsWith('--')) failCliArgument(`invalid_cli_value:${label}`);
  return value;
}

function loadActivationPack() {
  const inputPath = argValue('--pack', 'pack');
  if (!inputPath) return buildDefaultV1ActivationPack();
  return JSON.parse(readFileSync(resolve(inputPath), 'utf8'));
}

const outputRoot = argValue('--output', 'output') ?? V1_ACTIVATION_RUNNER_OUTPUT_ROOT;
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
