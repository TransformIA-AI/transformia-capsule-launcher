import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';

const root = process.cwd();
const recipeRoot = join(root, 'connectors', 'recipes');
const manifestDir = join(root, 'connectors', 'manifests');
const messagesPath = join(root, 'connectors', 'doctor', 'doctor-messages.json');
const googleExamplePath = join(root, 'connectors', 'examples', 'google-calendar.local.config.example.json');
const whatsappExamplePath = join(root, 'connectors', 'examples', 'whatsapp-template-manager.local.config.example.json');
const requiredRecipeFiles = [
  'connectors/recipes/google-calendar/availability-check.recipe.json',
  'connectors/recipes/google-calendar/create-event-draft.recipe.json',
  'connectors/recipes/google-calendar/booking-link-prep.recipe.json',
  'connectors/recipes/whatsapp-template-manager/approved-template-catalog.recipe.json',
  'connectors/recipes/whatsapp-template-manager/check-template-approval.recipe.json',
  'connectors/recipes/whatsapp-template-manager/select-template-for-review.recipe.json'
];
const requiredFields = ['recipeId','connectorId','displayName','displayNameEs','description','verticals','templates','actionKind','actionMode','riskLevel','requiresApproval','requiredConnectorActions','requiredLocalConfigKeys','requiredCloudCapabilities','doctorMessageRefs','publicSafe','noSecretsIncluded','noProviderCall','noLiveExecution','noN8nLiveInstall','noWebhookIncluded','noRealTenantData'];
const connectorActionKinds = new Map([
  ['google-calendar', new Set(['check_availability','create_event','generate_booking_link'])],
  ['whatsapp-template-manager', new Set(['list_approved_templates','check_template_approval_status','select_outbound_template'])]
]);
const actionModes = new Set(['contract_only','approval_gated','preview_only','coming_soon']);
const riskLevels = new Set(['low','medium','high']);
const safeLocalKeys = new Set(['tenantAlias','selectedTemplate','enabledConnectors','cloudHandoffUrl','enabledRecipes','templateUseCases']);
const allowedExternalUrls = ['https://transform-ia.com/connectors/google-calendar/setup','https://transform-ia.com/connectors/whatsapp-template-manager/templates'];
const forbiddenPatterns = [
  /accessToken/i, /refreshToken/i, /clientSecret/i, /apiKey/i, /webhookUrl/i, /authorizationCode/i, /invalid_grant/i,
  /wabaId/i, /phoneNumberId/i, /(?<!no)rawTemplateBody/i, /(?<!no)providerPayload/i, /customerPhone/i,
  /WABA ID/i, /phone number ID/i, /raw template body/i, /customer phone/i, /provider payload/i,
  /WhatsApp message sent/i, /template sent/i, /outbound dispatch enabled/i, /provider call completed/i,
  /production ready/i, /live connector/i, /real provider call/i, /fetch\s*\(/i, /axios/i, /XMLHttpRequest/i, /sendBeacon/i,
  /database/i, /n8n API/i, /Evidence Log/i, /attendee email/i, /Google event ID/i, /calendar ID/i,
  /tenantId/i, /provider account/i, /accountId/i, /javascript:/i, /mailto:/i, /\/\/example\.com/i, /https:\/\/example\.com/i,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /\b\+?\d{1,3}[ .-]?\(?\d{2,4}\)?[ .-]?\d{3,4}[ .-]?\d{3,4}\b/
];
let failures = [];
const fail = (message) => failures.push(message);
const read = (path) => readFileSync(path, 'utf8');
const parse = (path) => JSON.parse(read(path));
const rel = (path) => relative(root, path).replaceAll('\\', '/');

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}
function scanForbidden(raw, label, collect = fail) {
  for (const pattern of forbiddenPatterns) if (pattern.test(raw)) collect(`${label} contains forbidden public-safety term: ${pattern}`);
  const urls = raw.match(/https?:\/\/[^"\s)]+|\/\/[^"\s)]+/g) ?? [];
  for (const url of urls) {
    if (url.startsWith('//')) collect(`${label} contains protocol-relative URL`);
    if (url.startsWith('http') && !allowedExternalUrls.includes(url)) collect(`${label} contains unallowlisted external URL`);
  }
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
  if (recipe.connectorId === 'whatsapp-template-manager') {
    for (const field of ['noMessageSend','noOutboundDispatch','noRawTemplateBody','noRawPhoneData','noProviderPayload']) if (recipe[field] !== true) collect(`${label} must set ${field}: true`);
  }
  if (typeof recipe.recipeId !== 'string' || !/^[a-z0-9-]+\.[a-z0-9-]+$/.test(recipe.recipeId ?? '')) collect(`${label} recipeId must be connector-scoped`);
  const fileStem = basename(filePath, '.recipe.json');
  if (typeof recipe.recipeId === 'string' && recipe.recipeId !== `${recipe.connectorId}.${fileStem}`) collect(`${label} recipeId must match connectorId and filename stem`);
  if (context.seenRecipeIds.has(recipe.recipeId)) collect(`${label} duplicates recipeId ${recipe.recipeId}`);
  context.seenRecipeIds.add(recipe.recipeId);
  const manifest = context.manifests.get(recipe.connectorId);
  if (!manifest) collect(`${label} connectorId does not match a connector manifest`);
  if (!connectorActionKinds.get(recipe.connectorId)?.has(recipe.actionKind)) collect(`${label} invalid actionKind for connector manifest`);
  if (!actionModes.has(recipe.actionMode)) collect(`${label} invalid actionMode`);
  if (!riskLevels.has(recipe.riskLevel)) collect(`${label} invalid riskLevel`);
  if (recipe.recipeId === 'google-calendar.create-event-draft' && recipe.actionMode !== 'approval_gated') collect(`${label} create-event-draft must be approval_gated`);
  if (recipe.actionKind === 'create_event' && recipe.requiresApproval !== true) collect(`${label} create_event recipes require approval`);
  if (recipe.recipeId === 'whatsapp-template-manager.select-template-for-review' && !['approval_gated','contract_only'].includes(recipe.actionMode)) collect(`${label} select-template-for-review must be approval_gated or contract_only`);
  if (['whatsapp-template-manager.approved-template-catalog','whatsapp-template-manager.check-template-approval'].includes(recipe.recipeId) && !['preview_only','contract_only'].includes(recipe.actionMode)) collect(`${label} WhatsApp read-only recipes must be preview_only or contract_only`);
  for (const arrayField of ['verticals','templates','requiredConnectorActions','requiredLocalConfigKeys','requiredCloudCapabilities','doctorMessageRefs']) {
    if (!Array.isArray(recipe[arrayField]) || recipe[arrayField].length === 0) collect(`${label} ${arrayField} must be a non-empty array`);
  }
  const allowedActions = new Set(manifest?.allowedActions ?? []);
  for (const action of recipe.requiredConnectorActions ?? []) if (!allowedActions.has(action)) collect(`${label} requiredConnectorActions must exist in manifest`);
  for (const ref of recipe.doctorMessageRefs ?? []) if (!context.messageCodes.has(ref)) collect(`${label} doctorMessageRef does not resolve`);
  for (const key of recipe.requiredLocalConfigKeys ?? []) if (!safeLocalKeys.has(key)) collect(`${label} has unsafe requiredLocalConfigKey`);
  for (const flag of ['publicSafe','noSecretsIncluded','noProviderCall','noLiveExecution','noN8nLiveInstall','noWebhookIncluded','noRealTenantData']) if (recipe[flag] !== true) collect(`${label} must set ${flag}: true`);
}
function validateLocalExample(path, connectorId, recipes) {
  const example = parse(path);
  for (const key of ['tenantAlias','selectedTemplate','enabledConnectors','cloudHandoffUrl','enabledRecipes']) if (!(key in example)) fail(`${rel(path)} missing ${key}`);
  if (connectorId === 'whatsapp-template-manager' && !Array.isArray(example.templateUseCases)) fail(`${rel(path)} missing templateUseCases`);
  if (!example.enabledConnectors?.includes(connectorId)) fail(`${rel(path)} must enable ${connectorId}`);
  for (const recipeId of recipes) if (!example.enabledRecipes?.includes(recipeId)) fail(`${rel(path)} missing ${recipeId}`);
  scanForbidden(JSON.stringify(example), rel(path));
}

for (const path of ['connectors/recipes/README.md','connectors/recipes/google-calendar/README.md','connectors/recipes/whatsapp-template-manager/README.md','scripts/doctor.mjs','connectors/doctor/doctor-messages.json']) if (!existsSync(join(root, path))) fail(`${path} is missing`);
for (const path of requiredRecipeFiles) if (!existsSync(join(root, path))) fail(`${path} is missing`);

const manifests = loadManifests();
const messages = parse(messagesPath);
const messageCodes = new Set(messages.map((message) => message.errorCode));
const recipeFiles = walk(recipeRoot).filter((path) => path.endsWith('.recipe.json')).sort();
if (!recipeFiles.length) fail('no recipe files found by directory enumeration');
const seenRecipeIds = new Set();
for (const file of recipeFiles) {
  try { validateRecipe(JSON.parse(read(file)), read(file), file, { manifests, messageCodes, seenRecipeIds }); }
  catch { fail(`${rel(file)} is invalid JSON`); }
}
const requiredIds = ['google-calendar.availability-check','google-calendar.create-event-draft','google-calendar.booking-link-prep','whatsapp-template-manager.approved-template-catalog','whatsapp-template-manager.check-template-approval','whatsapp-template-manager.select-template-for-review'];
for (const required of requiredIds) if (!seenRecipeIds.has(required)) fail(`canonical recipe ${required} is missing`);

const syntheticBase = {
  recipeId: 'whatsapp-template-manager.synthetic-unsafe', connectorId: 'whatsapp-template-manager', displayName: 'Synthetic', displayNameEs: 'Synthetic', description: 'Synthetic validation case', verticals: ['restaurant'], templates: ['restaurant'], actionKind: 'list_approved_templates', actionMode: 'preview_only', riskLevel: 'low', requiresApproval: false, requiredConnectorActions: ['Review template readiness summary'], requiredLocalConfigKeys: ['tenantAlias'], requiredCloudCapabilities: ['provider_verification_handoff'], doctorMessageRefs: ['template_pending_approval'], publicSafe: true, noSecretsIncluded: true, noProviderCall: true, noLiveExecution: true, noN8nLiveInstall: true, noWebhookIncluded: true, noRealTenantData: true, noMessageSend: true, noOutboundDispatch: true, noRawTemplateBody: true, noRawPhoneData: true, noProviderPayload: true
};
const syntheticCases = [
  { name: 'unsafe payload', recipe: { ...syntheticBase, accessToken: 'blocked' }, expected: 'forbidden public-safety term' },
  { name: 'duplicate recipeId', recipe: { ...syntheticBase, recipeId: 'whatsapp-template-manager.approved-template-catalog' }, seen: new Set(['whatsapp-template-manager.approved-template-catalog']), expected: 'duplicates recipeId' },
  { name: 'unknown extra action', recipe: { ...syntheticBase, requiredConnectorActions: ['Unknown action'] }, expected: 'requiredConnectorActions must exist in manifest' },
  { name: 'doctor ref resolution', recipe: { ...syntheticBase, doctorMessageRefs: ['missing_ref'] }, expected: 'doctorMessageRef does not resolve' },
  { name: 'compact sensitive keys', recipe: { ...syntheticBase, wabaId: 'blocked', phoneNumberId: 'blocked', rawTemplateBody: 'blocked', providerPayload: 'blocked', customerPhone: 'blocked' }, expected: 'forbidden public-safety term' },
  { name: 'protocol relative URL', recipe: { ...syntheticBase, description: 'See //example.com/path' }, expected: 'protocol-relative URL' }
];
for (const testCase of syntheticCases) {
  const localFailures = [];
  validateRecipe(testCase.recipe, JSON.stringify(testCase.recipe), join(root, 'connectors/recipes/whatsapp-template-manager/synthetic-unsafe.recipe.json'), { manifests, messageCodes, seenRecipeIds: testCase.seen ?? new Set() }, (message) => localFailures.push(message));
  if (!localFailures.some((message) => message.includes(testCase.expected))) fail(`synthetic guard failed: ${testCase.name}`);
}

validateLocalExample(googleExamplePath, 'google-calendar', ['google-calendar.availability-check','google-calendar.create-event-draft','google-calendar.booking-link-prep']);
validateLocalExample(whatsappExamplePath, 'whatsapp-template-manager', ['whatsapp-template-manager.approved-template-catalog','whatsapp-template-manager.check-template-approval','whatsapp-template-manager.select-template-for-review']);

const doctorSource = read(join(root, 'scripts', 'doctor.mjs'));
for (const snippet of ['loadRecipes','Google Calendar recipe pack OK.','WhatsApp Template Manager recipe pack OK.','Falta configuración local para activar estas recetas.','Seleccionar una plantilla no envía mensajes.','La aprobación real de plantillas se completa desde Capsule Cloud o el proveedor.','La instalación real se completa desde Capsule Cloud.']) if (!doctorSource.includes(snippet)) fail(`doctor.mjs missing recipe integration snippet: ${snippet}`);

if (failures.length) {
  console.error('Connector recipe validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`Connector recipe validation OK. Scanned ${recipeFiles.length} recipe files by directory enumeration.`);
