import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join, relative, sep } from 'node:path';
import { buildActivationPackFileManifest, buildV09FreezeCandidateSummary, validateSaaSActivationPack } from './saas-activation-pack-handoff.mjs';

export class ActivationPackWriteBlockedError extends Error {
  constructor(blockers = []) {
    super(`activation_pack_write_blocked:${blockers.join(',')}`);
    this.name = 'ActivationPackWriteBlockedError';
    this.blockers = [...blockers];
    this.publicSafe = true;
  }
}
function assertInside(root, target) {
  const rel = relative(root, target);
  if (rel.startsWith('..') || rel === '..' || rel.includes(`..${sep}`) || resolve(target) !== target) throw new Error('blocked_path_traversal');
}
function assertWritablePack(pack) {
  const currentReport = pack ? validateSaaSActivationPack(pack) : { ok: false, blockers: ['activation_pack_missing'] };
  if (currentReport.ok !== true) throw new ActivationPackWriteBlockedError(currentReport.blockers ?? ['activation_pack_validation_failed']);
  pack.validationReport = currentReport;
}
function publicJson(value) { return `${JSON.stringify(value, null, 2)}\n`; }
export function buildActivationPackWritableFiles(pack) {
  assertWritablePack(pack);
  return {
    'activation-intent.public.json': publicJson(pack.intent),
    'organization-workspace-draft.public.json': publicJson(pack.organizationWorkspaceDraft),
    'plan-trial-draft.public.json': publicJson(pack.planTrialDraft),
    'byok-readiness.public.json': publicJson(pack.byokReadinessDraft),
    'commissioning-checklist.public.json': publicJson(pack.commissioningChecklist),
    'activation-pack.public.json': publicJson(pack),
    'validation-report.public.json': publicJson(pack.validationReport),
    'v0.9-freeze-candidate.public.json': publicJson(buildV09FreezeCandidateSummary(pack)),
    'README_ACTIVATION_PACK.md': `# TransformIA v0.9 SaaS Activation Pack\n\nPublic-safe, deterministic, non-live handoff package. It does not provision, call providers, call runtime, call web, write secrets, create payments, create auth, write DB rows or send data externally.\n\nFingerprint: ${pack.fingerprint}\n`
  };
}
export function writeSaaSActivationPack(pack, outputRoot) {
  assertWritablePack(pack);
  if (!outputRoot || outputRoot.includes('..')) throw new Error('explicit_safe_output_root_required');
  const root = resolve(outputRoot);
  const files = buildActivationPackWritableFiles(pack);
  const expected = new Set(buildActivationPackFileManifest(pack));
  mkdirSync(root, { recursive: true });
  const written = [];
  for (const [filename, content] of Object.entries(files)) {
    if (!expected.has(filename) || filename.includes('/') || filename.includes('..')) throw new Error('unexpected_activation_pack_filename');
    const target = resolve(join(root, filename));
    assertInside(root, target);
    writeFileSync(target, content, 'utf8');
    written.push(target);
  }
  return written;
}
