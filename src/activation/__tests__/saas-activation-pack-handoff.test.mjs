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
