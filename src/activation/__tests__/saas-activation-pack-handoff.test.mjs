import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const domain = readFileSync(new URL('../saas-activation-pack-handoff.ts', import.meta.url), 'utf8');
const writer = readFileSync(new URL('../saas-activation-pack-writer.ts', import.meta.url), 'utf8');
test('v0.9-L01 domain exports required helpers and statuses', () => {
  for (const name of ['buildCaseZeroActivationIntentFixture','buildDefaultSaaSActivationIntent','validateActivationIntent','buildOrganizationWorkspaceDraft','buildPlanTrialDraft','buildByokReadinessDraft','buildCommissioningChecklist','buildSaaSActivationPack','validateSaaSActivationPack','toPublicSaaSActivationPackSummary','buildV09FreezeCandidateSummary','buildActivationPackFileManifest','computeActivationPackFingerprint','computeStableChecksum']) assert.match(domain, new RegExp(`export function ${name}`));
  for (const status of ['blocked_quarantined_route','blocked_byok_secret_material','blocked_region_assumption','blocked_unsupported_plan','freeze_candidate_ready']) assert.match(domain, new RegExp(status));
});
test('v0.9-L01 blocks required bypass classes statically', () => {
  for (const route of ['/case-zero','/pilot','/cockpit','/connectors','/private','/demo/cockpit','/demo/flujo','/portal-vivo']) assert.match(domain, new RegExp(route.replace(/[/-]/g, (m) => `\\${m}`)));
  for (const token of ['automaticPurchaseFlow: false','instantProvisioning: false','readyForGoLive: false','commercialReviewRequired: true','secretMaterialIncluded: false','blocked_checklist_cannot_be_ready','fingerprint_covers_safety_fields']) assert.match(domain, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});
test('writer has explicit traversal guard and allowed filenames', () => {
  assert.match(writer, /blocked_path_traversal/);
  assert.match(writer, /relative\(root, target\)/);
  assert.match(writer, /buildActivationPackFileManifest/);
});
test('activation module has no provider/network/auth/payment imports', () => {
  assert.doesNotMatch(domain + writer, /fetch\s*\(|axios|stripe|supabase|firebase|auth0|postgres|mysql|mongodb|hubspot|salesforce|analytics|crm/i);
});

test('P2-1 BYOK blocked readiness is a validation blocker and freezes blocked', () => {
  assert.match(domain, /readinessStatus\.startsWith\('blocked_'\)/);
  assert.match(domain, /blockers\.push\(pack\.byokReadinessDraft\.readinessStatus\)/);
  assert.match(domain, /blocked_plan_not_allowed/);
  assert.match(domain, /pack\.validationReport\.ok === true \? 'freeze_candidate_ready' : 'freeze_blocked'/);
});
test('P2-2 Case Zero fixture avoids sensitive public notes', () => {
  const fixtureLine = domain.match(/buildCaseZeroActivationIntentFixture[\s\S]*?notesPublicSafe: '([^']+)'/);
  assert.ok(fixtureLine);
  assert.doesNotMatch(fixtureLine[1], /credential|secret|token|key|password|provider/i);
  assert.match(fixtureLine[1], /Setup references are reviewed by TransformIA before any external connection\./);
});
test('P2-3 summary is computed after final validation and participates in fingerprint', () => {
  assert.match(domain, /pack\.validationReport = validateSaaSActivationPack\(pack\); pack\.publicSafeSummary = toPublicSaaSActivationPackSummary\(pack\); pack\.fingerprint = computeActivationPackFingerprint\(pack\)/);
  assert.match(domain, /status: pack\.validationReport\.status/);
  assert.match(domain, /const \{ fingerprint, validationReport, \.\.\.rest \} = pack/);
});
