import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildDefaultV1ActivationPack, runActivationDoctor } from '../src/activation/v1-activation-runner.mjs';

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function loadActivationPack() {
  const inputPath = argValue('--pack');
  if (!inputPath) return buildDefaultV1ActivationPack();
  return JSON.parse(readFileSync(resolve(inputPath), 'utf8'));
}

const report = runActivationDoctor({ root: process.cwd(), activationPack: loadActivationPack() });
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'passed') process.exitCode = 1;
