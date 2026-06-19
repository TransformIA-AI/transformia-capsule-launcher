import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const root = process.cwd();
const manifestDir = join(root, 'connectors', 'manifests');
const recipeDir = join(root, 'connectors', 'recipes');
const restaurantKitManifestPath = join(root, 'templates', 'restaurant-golden-kit', 'manifest.json');
const messagesPath = join(root, 'connectors', 'doctor', 'doctor-messages.json');
const defaultConfigPath = join(root, 'connectors', 'examples', 'local.config.example.json');
const managedStackManifestPath = join(root, 'bootstrap', 'stack', 'managed.stack.manifest.json');
const selfHostStackManifestPath = join(root, 'bootstrap', 'stack', 'self-host.stack.manifest.json');
const suppliedConfigPath = process.argv[2] ? resolve(process.argv[2]) : defaultConfigPath;
const unsafeConfigKeyPattern = /token|secret|apiKey|webhook|credential|password|provider|account|tenantId/i;

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    console.error(`Install Doctor no puede leer ${label}. Revisa la estructura del catálogo público.`);
    process.exit(1);
  }
}

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function loadManifests() {
  return readdirSync(manifestDir)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => readJson(join(manifestDir, file), `manifest ${file}`));
}

function loadRecipes() {
  return walk(recipeDir)
    .filter((file) => file.endsWith('.recipe.json'))
    .sort()
    .map((file) => ({ file, recipe: readJson(file, `recipe ${basename(file)}`) }));
}

function safeKeyName(key) {
  return typeof key === 'string' && !unsafeConfigKeyPattern.test(key) ? key : 'configuración segura requerida';
}

function safeConnectorLabel(connectorId) {
  return typeof connectorId === 'string' && /^[a-z0-9-]+$/.test(connectorId) && !unsafeConfigKeyPattern.test(connectorId)
    ? connectorId
    : 'conector no reconocido';
}

if (!existsSync(manifestDir) || !existsSync(messagesPath)) {
  console.error('Install Doctor no puede encontrar el catálogo público de conectores.');
  process.exit(1);
}

const manifests = loadManifests();
const manifestById = new Map(manifests.map((manifest) => [manifest.connectorId, manifest]));
const messages = readJson(messagesPath, 'mensajes Doctor');
const messageCodes = new Set(messages.map((message) => message.errorCode));
const recipes = loadRecipes();
const recipeById = new Map(recipes.map(({ recipe }) => [recipe.recipeId, recipe]));
const restaurantKit = existsSync(restaurantKitManifestPath) ? readJson(restaurantKitManifestPath, 'Restaurant Golden Kit manifest') : null;
const structuralErrors = [];

for (const manifest of manifests) {
  for (const field of ['connectorId','displayName','launchPriority','status','doctorMessageRefs','localConfigRequirements','publicSafe','noSecretsIncluded','noProviderCall','noLiveExecution']) {
    if (!(field in manifest)) structuralErrors.push(`${manifest.connectorId ?? 'manifest'}: falta ${field}`);
  }
  for (const ref of manifest.doctorMessageRefs ?? []) {
    if (!messageCodes.has(ref)) structuralErrors.push(`${manifest.connectorId}: mensaje Doctor no encontrado`);
  }
  if (manifest.publicSafe !== true || manifest.noSecretsIncluded !== true || manifest.noProviderCall !== true || manifest.noLiveExecution !== true) {
    structuralErrors.push(`${manifest.connectorId}: postura pública inválida`);
  }
}

for (const { recipe, file } of recipes) {
  const manifest = manifestById.get(recipe.connectorId);
  if (!manifest) structuralErrors.push(`${basename(file)}: conector no encontrado`);
  if (!recipe.recipeId || recipeById.get(recipe.recipeId) !== recipe) structuralErrors.push(`${basename(file)}: recipeId duplicado o inválido`);
  if (recipe.publicSafe !== true || recipe.noSecretsIncluded !== true || recipe.noProviderCall !== true || recipe.noLiveExecution !== true || recipe.noN8nLiveInstall !== true || recipe.noWebhookIncluded !== true || recipe.noRealTenantData !== true) {
    structuralErrors.push(`${recipe.recipeId ?? basename(file)}: postura de receta inválida`);
  }
  for (const action of recipe.requiredConnectorActions ?? []) {
    if (!manifest?.allowedActions?.includes(action)) structuralErrors.push(`${recipe.recipeId}: acción no declarada por manifest`);
  }
  for (const ref of recipe.doctorMessageRefs ?? []) {
    if (!messageCodes.has(ref)) structuralErrors.push(`${recipe.recipeId}: mensaje Doctor no encontrado`);
  }
}

if (structuralErrors.length) {
  console.error('Install Doctor encontró errores estructurales en el catálogo público.');
  for (const _error of structuralErrors) console.error('- Revisa los manifests, recetas y mensajes Doctor.');
  process.exit(1);
}

console.log('Connector catalog OK.');
if (recipes.some(({ recipe }) => recipe.connectorId === 'google-calendar')) console.log('Google Calendar recipe pack OK.');
if (recipes.some(({ recipe }) => recipe.connectorId === 'whatsapp-template-manager')) console.log('WhatsApp Template Manager recipe pack OK.');

let config = null;
if (existsSync(suppliedConfigPath)) {
  config = readJson(suppliedConfigPath, 'configuración local');
} else {
  console.log('Falta configuración local. Puedes usar Capsule Cloud para conectar proveedores reales.');
  console.log('La instalación real se completa desde Capsule Cloud.');
}

if (config) {
  const enabled = Array.isArray(config.enabledConnectors) ? config.enabledConnectors : [];
  const enabledRecipes = Array.isArray(config.enabledRecipes) ? config.enabledRecipes : [];
  if (restaurantKit && config.selectedTemplate === 'restaurant' && Array.isArray(config.restaurantUseCases)) {
    const requiredConnectors = restaurantKit.requiredConnectors ?? [];
    const requiredRecipes = restaurantKit.requiredRecipes ?? [];
    const missingConnectors = requiredConnectors.filter((connectorId) => !enabled.includes(connectorId));
    const missingRecipes = requiredRecipes.filter((recipeId) => !enabledRecipes.includes(recipeId));
    const requiredLocalKeys = ['tenantAlias', 'selectedTemplate', 'eworkerName', 'enabledConnectors', 'enabledRecipes', 'restaurantUseCases'];
    const missingLocalKeys = requiredLocalKeys.filter((key) => !(key in config));
    if (!missingConnectors.length && !missingRecipes.length && !missingLocalKeys.length) console.log('Restaurant Golden Kit OK.');
    else console.log('Restaurant Golden Kit requiere revisar conectores, recetas o configuración local.');
    console.log('Aitana can be renamed in Capsule Cloud.');
    console.log('No booking is confirmed from launcher.');
    console.log('No WhatsApp message is sent from launcher.');
  }
  console.log(`Configuración local detectada para plantilla: ${config.selectedTemplate ? 'configurada' : 'sin plantilla'}.`);
  if (!enabled.length) console.log('Falta elegir conectores en la configuración local.');

  for (const connectorId of enabled) {
    const manifest = manifestById.get(connectorId);
    if (!manifest) {
      console.log(`El conector "${safeConnectorLabel(connectorId)}" no está soportado por este catálogo público. Revisa el siguiente pack o usa Capsule Cloud.`);
      continue;
    }

    const missingKeys = (manifest.localConfigRequirements ?? [])
      .filter((key) => !(key in config))
      .map(safeKeyName);

    if (missingKeys.length) {
      console.log(`${manifest.displayName}: falta configuración local para ${missingKeys.join(', ')}.`);
      console.log('Puedes completar la configuración local o usar Capsule Cloud para conectar proveedores reales.');
    } else {
      console.log(`${manifest.displayName}: configuración local requerida presente.`);
    }

    const connectorRecipes = recipes.map(({ recipe }) => recipe).filter((recipe) => recipe.connectorId === connectorId);
    if (connectorRecipes.length) {
      const selectedRecipes = enabledRecipes.length
        ? enabledRecipes.map((recipeId) => recipeById.get(recipeId)).filter((recipe) => recipe?.connectorId === connectorId)
        : connectorRecipes;
      const unknownRecipes = enabledRecipes.filter((recipeId) => !recipeById.has(recipeId));
      for (const _unknown of unknownRecipes) console.log('Hay una receta local no reconocida. Revisa connectors/recipes/README.md.');
      if (!enabledRecipes.length) console.log('Falta configuración local para activar estas recetas.');

      const requiredRecipeKeys = new Set(selectedRecipes.flatMap((recipe) => recipe.requiredLocalConfigKeys ?? []));
      const missingRecipeKeys = [...requiredRecipeKeys].filter((key) => !(key in config)).map(safeKeyName);
      if (missingRecipeKeys.length) console.log(`Falta configuración local para activar estas recetas: ${missingRecipeKeys.join(', ')}.`);
      if (connectorId === 'google-calendar' && selectedRecipes.some((recipe) => recipe.actionMode === 'approval_gated' || recipe.requiresApproval === true)) console.log('La creación de eventos requiere aprobación humana.');
      if (connectorId === 'whatsapp-template-manager') {
        if (selectedRecipes.some((recipe) => recipe.actionMode === 'approval_gated' || recipe.requiresApproval === true)) console.log('Seleccionar una plantilla no envía mensajes.');
        console.log('La aprobación real de plantillas se completa desde Capsule Cloud o el proveedor.');
      }
      console.log('La instalación real se completa desde Capsule Cloud.');
    }
  }
}

for (const manifest of manifests) {
  if (manifest.connectorId === 'google-calendar') {
    console.log('Google Calendar requiere Capsule Cloud para conexión real.');
  } else if (manifest.connectorId === 'whatsapp-template-manager') {
    console.log('WhatsApp Template Manager requiere revisión de plantillas aprobadas.');
  } else {
    console.log(`${manifest.displayName}: ${manifest.status === 'stretch' ? 'stretch preview' : 'coming soon'}.`);
  }
}

if (existsSync(managedStackManifestPath) && existsSync(selfHostStackManifestPath)) {
  console.log('Stack bootstrap manifests OK.');
  console.log('Managed Cloud handoff is a plan, not a deploy.');
  console.log('Self-host local stack bootstrap is plan-only.');
  console.log('No Docker, n8n, provider or database service is started from launcher.');
  console.log('Private runtime is not included.');
}

console.log('Governed Deploy Doctor available.');
console.log('Rollback Doctor available.');
console.log('Secret safety checks available.');
console.log('No deploy, rollback or secret access is performed by launcher.');
console.log('Install Doctor no requiere credenciales reales y no llama a proveedores.');
