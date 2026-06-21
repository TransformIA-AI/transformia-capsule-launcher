import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join, relative, sep } from 'node:path';
import { buildActivationPackFileManifest, buildV09FreezeCandidateSummary, finalizeSaaSActivationPackForWrite } from './saas-activation-pack-handoff.mjs';

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
function finalizeWritablePack(pack) {
  const finalPack = pack ? finalizeSaaSActivationPackForWrite(pack) : null;
  const currentReport = finalPack?.validationReport ?? { ok: false, blockers: ['activation_pack_missing'] };
  if (currentReport.ok !== true) throw new ActivationPackWriteBlockedError(currentReport.blockers ?? ['activation_pack_validation_failed']);
  return finalPack;
}
function publicJson(value) { return `${JSON.stringify(value, null, 2)}\n`; }
function buildActivationPackWritableFilesFromFinalPack(finalPack) {
  return {
    'activation-intent.public.json': publicJson(finalPack.intent),
    'organization-workspace-draft.public.json': publicJson(finalPack.organizationWorkspaceDraft),
    'plan-trial-draft.public.json': publicJson(finalPack.planTrialDraft),
    'byok-readiness.public.json': publicJson(finalPack.byokReadinessDraft),
    'commissioning-checklist.public.json': publicJson(finalPack.commissioningChecklist),
    'activation-pack.public.json': publicJson(finalPack),
    'validation-report.public.json': publicJson(finalPack.validationReport),
    'v0.9-freeze-candidate.public.json': publicJson(buildV09FreezeCandidateSummary(finalPack)),
    'README_ACTIVATION_PACK.md': `# TransformIA v0.9 SaaS Activation Pack\n\nPublic-safe, deterministic, non-live handoff package. It does not provision, call providers, call runtime, call web, write secrets, create payments, create auth, write DB rows or send data externally.\n\nFingerprint: ${finalPack.fingerprint}\n`
  };
}
export function buildActivationPackWritableFiles(pack) {
  const finalPack = finalizeWritablePack(pack);
  return buildActivationPackWritableFilesFromFinalPack(finalPack);
}
export function writeSaaSActivationPack(pack, outputRoot) {
  const finalPack = finalizeWritablePack(pack);
  if (!outputRoot || outputRoot.includes('..')) throw new Error('explicit_safe_output_root_required');
  const root = resolve(outputRoot);
  const files = buildActivationPackWritableFilesFromFinalPack(finalPack);
  const expected = new Set(buildActivationPackFileManifest(finalPack));
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
