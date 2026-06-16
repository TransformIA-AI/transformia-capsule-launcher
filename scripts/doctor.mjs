import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = process.cwd();
const manifestDir = join(root, 'connectors', 'manifests');
const messagesPath = join(root, 'connectors', 'doctor', 'doctor-messages.json');
const defaultConfigPath = join(root, 'connectors', 'examples', 'local.config.example.json');
const suppliedConfigPath = process.argv[2] ? resolve(process.argv[2]) : defaultConfigPath;

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    console.error(`Install Doctor no puede leer ${label}. Revisa la estructura del catálogo público.`);
    process.exit(1);
  }
}

if (!existsSync(manifestDir) || !existsSync(messagesPath)) {
  console.error('Install Doctor no puede encontrar el catálogo público de conectores.');
  process.exit(1);
}

const manifests = readdirSync(manifestDir)
  .filter((file) => file.endsWith('.json'))
  .sort()
  .map((file) => readJson(join(manifestDir, file), `manifest ${file}`));
const messages = readJson(messagesPath, 'mensajes Doctor');
const messageCodes = new Set(messages.map((message) => message.errorCode));
const structuralErrors = [];

for (const manifest of manifests) {
  for (const field of ['connectorId','displayName','launchPriority','status','doctorMessageRefs','publicSafe','noSecretsIncluded','noProviderCall','noLiveExecution']) {
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
  console.log(`Configuración local de ejemplo detectada para plantilla: ${config.selectedTemplate ?? 'sin plantilla'}.`);
  if (!enabled.length) console.log('Falta elegir conectores en la configuración local.');
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
