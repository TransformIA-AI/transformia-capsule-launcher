import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';

const root = process.cwd();
const recipeRoot = join(root, 'connectors', 'recipes');
const manifestDir = join(root, 'connectors', 'manifests');
const messagesPath = join(root, 'connectors', 'doctor', 'doctor-messages.json');
const localExamplePath = join(root, 'connectors', 'examples', 'google-calendar.local.config.example.json');
const requiredGoogleFiles = [
  'connectors/recipes/google-calendar/availability-check.recipe.json',
  'connectors/recipes/google-calendar/create-event-draft.recipe.json',
  'connectors/recipes/google-calendar/booking-link-prep.recipe.json'
];
const requiredFields = ['recipeId','connectorId','displayName','displayNameEs','description','verticals','templates','actionKind','actionMode','riskLevel','requiresApproval','requiredConnectorActions','requiredLocalConfigKeys','requiredCloudCapabilities','doctorMessageRefs','publicSafe','noSecretsIncluded','noProviderCall','noLiveExecution','noN8nLiveInstall','noWebhookIncluded','noRealTenantData'];
const actionKinds = new Set(['check_availability','create_event','generate_booking_link']);
const actionModes = new Set(['contract_only','approval_gated','preview_only','coming_soon']);
const riskLevels = new Set(['low','medium','high']);
const safeLocalKeys = new Set(['tenantAlias','selectedTemplate','enabledConnectors','cloudHandoffUrl','enabledRecipes']);
const forbiddenPatterns = [
  /accessToken/i, /refreshToken/i, /clientSecret/i, /apiKey/i, /webhookUrl/i, /authorizationCode/i, /invalid_grant/i,
  /Google Calendar connected/i, /event created in Google/i, /booking confirmed/i, /provider call completed/i,
  /production ready/i, /live connector/i, /real provider call/i, /fetch\s*\(/i, /axios/i, /XMLHttpRequest/i, /sendBeacon/i,
  /database/i, /n8n API/i, /Evidence Log/i, /attendee email/i, /phone number/i, /Google event ID/i, /calendar ID/i,
  /tenantId/i, /provider account/i, /accountId/i,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /\b\+?\d{1,3}[ .-]?\(?\d{2,4}\)?[ .-]?\d{3,4}[ .-]?\d{3,4}\b/
];
let failures = [];
const fail = (message) => failures.push(message);
const read = (path) => readFileSync(path, 'utf8');
const parse = (path) => JSON.parse(read(path));

function rel(path) { return relative(root, path).replaceAll('\\', '/'); }
function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}
function scanForbidden(raw, label, collect = fail) {
  for (const pattern of forbiddenPatterns) if (pattern.test(raw)) collect(`${label} contains forbidden public-safety term: ${pattern}`);
}
function loadManifests() {
  const manifests = new Map();
  for (const file of readdirSync(manifestDir).filter((f) => f.endsWith('.json'))) {
    const manifest = parse(join(manifestDir, file));
    manifests.set(manifest.connectorId, manifest);
  }
  return manifests;
}
function validateRecipe(recipe, raw, filePath, context, collect = fail) {
  const label = rel(filePath);
  scanForbidden(raw, label, collect);
  for (const field of requiredFields) if (!(field in recipe)) collect(`${label} missing ${field}`);
  if (typeof recipe.recipeId !== 'string' || !/^[a-z0-9-]+\.[a-z0-9-]+$/.test(recipe.recipeId ?? '')) collect(`${label} recipeId must be connector-scoped`);
  const fileStem = basename(filePath, '.recipe.json');
  if (typeof recipe.recipeId === 'string' && !recipe.recipeId.includes(fileStem)) collect(`${label} recipeId must include filename stem ${fileStem}`);
  if (context.seenRecipeIds.has(recipe.recipeId)) collect(`${label} duplicates recipeId ${recipe.recipeId}`);
  context.seenRecipeIds.add(recipe.recipeId);
  const manifest = context.manifests.get(recipe.connectorId);
  if (!manifest) collect(`${label} connectorId does not match a connector manifest`);
  if (!actionKinds.has(recipe.actionKind)) collect(`${label} invalid actionKind`);
  if (!actionModes.has(recipe.actionMode)) collect(`${label} invalid actionMode`);
  if (!riskLevels.has(recipe.riskLevel)) collect(`${label} invalid riskLevel`);
  if (recipe.recipeId === 'google-calendar.create-event-draft' && recipe.actionMode !== 'approval_gated') collect(`${label} create-event-draft must be approval_gated`);
  if (recipe.actionKind === 'create_event' && recipe.requiresApproval !== true) collect(`${label} create_event recipes require approval`);
  if (recipe.recipeId?.endsWith('availability-check') && !['preview_only','contract_only'].includes(recipe.actionMode)) collect(`${label} availability-check must be preview_only or contract_only`);
  if (recipe.recipeId?.endsWith('booking-link-prep') && !['preview_only','contract_only'].includes(recipe.actionMode)) collect(`${label} booking-link-prep must be preview_only or contract_only`);
  for (const arrayField of ['verticals','templates','requiredConnectorActions','requiredLocalConfigKeys','requiredCloudCapabilities','doctorMessageRefs']) {
    if (!Array.isArray(recipe[arrayField]) || recipe[arrayField].length === 0) collect(`${label} ${arrayField} must be a non-empty array`);
  }
  const allowedActions = new Set(manifest?.allowedActions ?? []);
  for (const action of recipe.requiredConnectorActions ?? []) if (!allowedActions.has(action)) collect(`${label} requiredConnectorActions must exist in manifest`);
  for (const ref of recipe.doctorMessageRefs ?? []) if (!context.messageCodes.has(ref)) collect(`${label} doctorMessageRef does not resolve`);
  for (const key of recipe.requiredLocalConfigKeys ?? []) if (!safeLocalKeys.has(key)) collect(`${label} has unsafe requiredLocalConfigKey`);
  for (const flag of ['publicSafe','noSecretsIncluded','noProviderCall','noLiveExecution','noN8nLiveInstall','noWebhookIncluded','noRealTenantData']) {
    if (recipe[flag] !== true) collect(`${label} must set ${flag}: true`);
  }
}

for (const path of ['connectors/recipes/README.md','connectors/recipes/google-calendar/README.md','scripts/doctor.mjs', 'connectors/doctor/doctor-messages.json']) {
  if (!existsSync(join(root, path))) fail(`${path} is missing`);
}
for (const path of requiredGoogleFiles) if (!existsSync(join(root, path))) fail(`${path} is missing`);

const manifests = loadManifests();
const messages = parse(messagesPath);
const messageCodes = new Set(messages.map((message) => message.errorCode));
const recipeFiles = walk(recipeRoot).filter((path) => path.endsWith('.recipe.json')).sort();
if (!recipeFiles.length) fail('no recipe files found by directory enumeration');
const seenRecipeIds = new Set();
for (const file of recipeFiles) {
  let recipe;
  const raw = read(file);
  try { recipe = JSON.parse(raw); } catch { fail(`${rel(file)} is invalid JSON`); continue; }
  validateRecipe(recipe, raw, file, { manifests, messageCodes, seenRecipeIds });
}
for (const required of ['google-calendar.availability-check','google-calendar.create-event-draft','google-calendar.booking-link-prep']) {
  if (!seenRecipeIds.has(required)) fail(`canonical recipe ${required} is missing`);
}

const syntheticBase = {
  recipeId: 'google-calendar.synthetic-unsafe', connectorId: 'google-calendar', displayName: 'Synthetic', displayNameEs: 'Synthetic',
  description: 'Synthetic validation case', verticals: ['restaurant'], templates: ['restaurant'], actionKind: 'check_availability',
  actionMode: 'preview_only', riskLevel: 'low', requiresApproval: false,
  requiredConnectorActions: ['Review calendar availability summary'], requiredLocalConfigKeys: ['tenantAlias'], requiredCloudCapabilities: ['provider_oauth_handoff'],
  doctorMessageRefs: ['pending_auth'], publicSafe: true, noSecretsIncluded: true, noProviderCall: true, noLiveExecution: true,
  noN8nLiveInstall: true, noWebhookIncluded: true, noRealTenantData: true
};
const syntheticCases = [
  { name: 'unsafe payload', recipe: { ...syntheticBase, description: 'accessToken should fail' }, expected: 'forbidden public-safety term' },
  { name: 'duplicate recipeId', recipe: { ...syntheticBase, recipeId: 'google-calendar.availability-check' }, seen: new Set(['google-calendar.availability-check']), expected: 'duplicates recipeId' },
  { name: 'unknown extra action', recipe: { ...syntheticBase, requiredConnectorActions: ['Unknown action'] }, expected: 'requiredConnectorActions must exist in manifest' },
  { name: 'doctor ref resolution', recipe: { ...syntheticBase, doctorMessageRefs: ['missing_ref'] }, expected: 'doctorMessageRef does not resolve' }
];
for (const testCase of syntheticCases) {
  const localFailures = [];
  validateRecipe(testCase.recipe, JSON.stringify(testCase.recipe), join(root, 'connectors/recipes/google-calendar/synthetic-unsafe.recipe.json'), {
    manifests, messageCodes, seenRecipeIds: testCase.seen ?? new Set()
  }, (message) => localFailures.push(message));
  if (!localFailures.some((message) => message.includes(testCase.expected))) fail(`synthetic guard failed: ${testCase.name}`);
}

const localExample = parse(localExamplePath);
for (const key of ['tenantAlias','selectedTemplate','enabledConnectors','cloudHandoffUrl','enabledRecipes']) if (!(key in localExample)) fail(`local Google Calendar config example missing ${key}`);
if (!localExample.enabledConnectors?.includes('google-calendar')) fail('local example must enable google-calendar');
for (const recipeId of ['google-calendar.availability-check','google-calendar.create-event-draft','google-calendar.booking-link-prep']) if (!localExample.enabledRecipes?.includes(recipeId)) fail(`local example missing ${recipeId}`);
scanForbidden(JSON.stringify(localExample), rel(localExamplePath));

const doctorSource = read(join(root, 'scripts', 'doctor.mjs'));
for (const snippet of ['loadRecipes', 'Google Calendar recipe pack OK.', 'Falta configuración local para activar estas recetas.', 'La creación de eventos requiere aprobación humana.', 'La instalación real se completa desde Capsule Cloud.']) {
  if (!doctorSource.includes(snippet)) fail(`doctor.mjs missing recipe integration snippet: ${snippet}`);
}

if (failures.length) {
  console.error('Connector recipe validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`Connector recipe validation OK. Scanned ${recipeFiles.length} recipe files by directory enumeration.`);
