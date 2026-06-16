import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = process.cwd();
const manifestDir = join(root, 'connectors', 'manifests');
const messagesPath = join(root, 'connectors', 'doctor', 'doctor-messages.json');
const defaultConfigPath = join(root, 'connectors', 'examples', 'local.config.example.json');
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

function loadManifests() {
  return readdirSync(manifestDir)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => readJson(join(manifestDir, file), `manifest ${file}`));
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

if (structuralErrors.length) {
  console.error('Install Doctor encontró errores estructurales en el catálogo público.');
  for (const _error of structuralErrors) console.error('- Revisa los manifests de conectores.');
  process.exit(1);
}

console.log('Connector catalog OK.');

let config = null;
if (existsSync(suppliedConfigPath)) {
  config = readJson(suppliedConfigPath, 'configuración local');
} else {
  console.log('Falta configuración local. Puedes usar Capsule Cloud para conectar proveedores reales.');
}

if (config) {
  const enabled = Array.isArray(config.enabledConnectors) ? config.enabledConnectors : [];
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

console.log('Install Doctor no requiere credenciales reales y no llama a proveedores.');
