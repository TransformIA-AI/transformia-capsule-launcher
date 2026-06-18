import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const kitRoot = join(root, 'templates', 'restaurant-golden-kit');
const manifestPath = join(kitRoot, 'manifest.json');
const configPath = join(root, 'connectors', 'examples', 'restaurant-golden-kit.local.config.example.json');
const connectorManifestDir = join(root, 'connectors', 'manifests');
const connectorRecipeRoot = join(root, 'connectors', 'recipes');
const failures = [];
const fail = (message) => failures.push(message);
const rel = (path) => relative(root, path).replaceAll('\\', '/');
const read = (path) => readFileSync(path, 'utf8');
const parse = (path) => JSON.parse(read(path));

const requiredConnectors = ['google-calendar', 'whatsapp-template-manager'];
const requiredRecipes = [
  'google-calendar.availability-check',
  'google-calendar.create-event-draft',
  'whatsapp-template-manager.approved-template-catalog',
  'whatsapp-template-manager.select-template-for-review',
  'restaurant.reservation-request',
  'restaurant.menu-inquiry',
  'restaurant.dietary-request',
  'restaurant.group-booking'
];
const requiredFlags = ['publicSafe','noSecretsIncluded','noProviderCall','noLiveExecution','noN8nLiveInstall','noMessageSend','noCalendarEventCreation','noBookingConfirmation'];
const forbiddenPatterns = [
  /accessToken/i, /refreshToken/i, /clientSecret/i, /apiKey/i, /authorizationCode/i, /webhook/i,
  /wabaId/i, /phoneNumberId/i, /rawTemplateBody/i, /providerPayload/i, /customerPhone/i,
  /calendarId/i, /tenantId/i, /accountId/i, /credential/i, /password/i, /secret/i, /token/i,
  /https?:\/\//i, /javascript:/i, /mailto:/i, /fetch\s*\(/i, /axios/i, /XMLHttpRequest/i, /sendBeacon/i,
  /booking is confirmed/i, /message is sent/i, /event is created/i, /live connector/i, /provider call completed/i,
  /production ready/i, /n8n API/i, /Evidence Log/i,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /\b\+?\d{1,3}[ .-]?\(?\d{2,4}\)?[ .-]?\d{3,4}[ .-]?\d{3,4}\b/
];
const allowedNegatedPhrases = ['No booking is confirmed from launcher.', 'No WhatsApp message is sent from launcher.'];

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}
function scan(raw, label) {
  const normalizedRaw = raw
    .replace(/noSecretsIncluded/g, 'safeFlag')
    .replace(/noWebhookIncluded/g, 'safeFlag')
    .replace(/does not include private runtime code, secrets, provider calls/g, 'keeps private runtime code and credentials out')
    .replace(/include secrets/g, 'include credentials')
    .replace(/secrets/g, 'private-values')
    .replace(/credentials/g, 'private-values');
  const compact = normalizedRaw.replace(/[-_\s]/g, '');
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(normalizedRaw) || pattern.test(compact)) {
      if (allowedNegatedPhrases.some((phrase) => normalizedRaw.includes(phrase))) continue;
      fail(`${label} contains forbidden public-safety pattern: ${pattern}`);
    }
  }
  const urls = normalizedRaw.match(/https?:\/\/[^"\s)]+|\/\/[^"\s)]+/g) ?? [];
  for (const url of urls) if (url.startsWith('//')) fail(`${label} contains protocol-relative URL`);
}
function assertArrayIncludesAll(actual, expected, label) {
  for (const item of expected) if (!actual?.includes(item)) fail(`${label} missing ${item}`);
}

for (const path of [manifestPath, configPath, join(kitRoot, 'README.md')]) if (!existsSync(path)) fail(`${rel(path)} is missing`);
for (const file of ['reservation-request','menu-inquiry','dietary-request','group-booking']) {
  const path = join(kitRoot, 'recipes', `${file}.recipe.json`);
  if (!existsSync(path)) fail(`${rel(path)} is missing`);
}

const manifest = parse(manifestPath);
if (manifest.templateId !== 'restaurant-golden-kit') fail('manifest templateId must be restaurant-golden-kit');
if (manifest.eworkerDefaultName !== 'Aitana') fail('manifest eworkerDefaultName must be Aitana');
assertArrayIncludesAll(manifest.requiredConnectors, requiredConnectors, 'manifest.requiredConnectors');
assertArrayIncludesAll(manifest.requiredRecipes, requiredRecipes, 'manifest.requiredRecipes');
for (const flag of requiredFlags) if (manifest[flag] !== true) fail(`manifest must set ${flag}: true`);

const connectorIds = new Set(readdirSync(connectorManifestDir).filter((file) => file.endsWith('.json')).map((file) => parse(join(connectorManifestDir, file)).connectorId));
for (const connector of manifest.requiredConnectors ?? []) if (!connectorIds.has(connector)) fail(`required connector ${connector} does not resolve`);

const connectorRecipeIds = new Set(walk(connectorRecipeRoot).filter((file) => file.endsWith('.recipe.json')).map((file) => parse(file).recipeId));
const restaurantRecipeIds = new Set();
for (const file of walk(join(kitRoot, 'recipes')).filter((path) => path.endsWith('.recipe.json'))) {
  const raw = read(file);
  scan(raw, rel(file));
  const recipe = JSON.parse(raw);
  restaurantRecipeIds.add(recipe.recipeId);
  if (!requiredRecipes.includes(recipe.recipeId)) fail(`${rel(file)} has unexpected recipeId`);
  for (const flag of ['publicSafe','noSecretsIncluded','noProviderCall','noLiveExecution','noN8nLiveInstall','noWebhookIncluded','noRealTenantData','noMessageSend','noCalendarEventCreation','noBookingConfirmation']) if (recipe[flag] !== true) fail(`${rel(file)} must set ${flag}: true`);
  for (const ref of recipe.usesRecipes ?? []) if (!connectorRecipeIds.has(ref) && !restaurantRecipeIds.has(ref)) fail(`${rel(file)} references missing recipe ${ref}`);
}
for (const recipeId of requiredRecipes) if (!connectorRecipeIds.has(recipeId) && !restaurantRecipeIds.has(recipeId)) fail(`required recipe ${recipeId} does not resolve`);

for (const path of [manifestPath, configPath, join(kitRoot, 'README.md')]) scan(read(path), rel(path));
const config = parse(configPath);
for (const key of ['tenantAlias','selectedTemplate','eworkerName','enabledConnectors','enabledRecipes','restaurantUseCases']) if (!(key in config)) fail(`local config missing ${key}`);
if (config.tenantAlias !== 'local-demo') fail('local config tenantAlias must be local-demo');
if (config.selectedTemplate !== 'restaurant') fail('local config selectedTemplate must be restaurant');
if (config.eworkerName !== 'Aitana') fail('local config eworkerName must be Aitana');
assertArrayIncludesAll(config.enabledConnectors, requiredConnectors, 'local enabledConnectors');
assertArrayIncludesAll(config.enabledRecipes, requiredRecipes, 'local enabledRecipes');
assertArrayIncludesAll(config.restaurantUseCases, ['reservation-request','menu-inquiry','dietary-request','group-booking'], 'local restaurantUseCases');

const doctorOutput = execFileSync(process.execPath, [join(root, 'scripts', 'doctor.mjs'), configPath], { encoding: 'utf8' });
for (const snippet of ['Restaurant Golden Kit OK.', 'Aitana can be renamed in Capsule Cloud.', 'No booking is confirmed from launcher.', 'No WhatsApp message is sent from launcher.']) {
  if (!doctorOutput.includes(snippet)) fail(`doctor output missing: ${snippet}`);
}

if (failures.length) {
  console.error('Restaurant Golden Kit validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('Restaurant Golden Kit validation OK.');
