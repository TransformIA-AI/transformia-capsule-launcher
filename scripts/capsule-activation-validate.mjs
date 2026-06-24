import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildDefaultV1ActivationPack, validateV1ActivationPack } from '../src/activation/v1-activation-runner.mjs';

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function loadActivationPack() {
  const inputPath = argValue('--pack');
  if (!inputPath) return buildDefaultV1ActivationPack();
  return JSON.parse(readFileSync(resolve(inputPath), 'utf8'));
}

const pack = loadActivationPack();
const report = validateV1ActivationPack(pack);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
