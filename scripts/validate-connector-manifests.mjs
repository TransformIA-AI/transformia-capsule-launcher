import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const manifestIds = ['google-calendar','whatsapp-template-manager','hubspot','calendly','airtable','google-sheets'];
const primaryIds = new Set(['google-calendar','whatsapp-template-manager']);
const nonPrimaryIds = ['hubspot','calendly','airtable','google-sheets'];
const requiredFields = ['connectorId','displayName','displayNameEs','category','authType','launchPriority','status','allowedActions','requiresApprovalActions','riskLevel','rollbackStrategy','doctorMessageRefs','localConfigRequirements','cloudRequired','publicSafe','noSecretsIncluded','noProviderCall','noLiveExecution'];
const categories = new Set(['calendar','messaging','crm','booking','storage']);
const authTypes = new Set(['oauth2_pkce','apikey','webhook','contract_only']);
const priorities = new Set(['v0_7_primary','secondary','stretch','coming_soon']);
const statuses = new Set(['available_for_cloud_setup','coming_soon','stretch','local_manifest_only']);
const messageActions = new Set(['oauth_reauth','reconnect','contact_support','check_permissions','select_event_type','choose_template','configure_mapping','upgrade_plan','wait_for_provider_approval','open_cloud_handoff','check_local_config']);
const requiredMessages = ['pending_auth','auth_expired','missing_permission','provider_temporarily_unavailable','mapping_required','template_pending_approval','template_rejected','event_type_required','rate_limited','plan_upgrade_required','connector_not_supported_yet','unknown_safe_error','local_config_missing','cloud_handoff_required'];
const forbiddenPatterns = [
  /accessToken/i, /refreshToken/i, /clientSecret/i, /apiKey/, /webhookUrl/i, /invalid_grant/i,
  /OAuth completed/i, /token stored/i, /connector installed/i, /Google Calendar connected/i,
  /WhatsApp message sent/i, /HubSpot synced/i, /booking created/i, /production ready/i,
  /live connector/i, /real provider call/i, /fully operational/i, /provider payload/i,
  /tenantId/i, /accountId/i, /\b\+?\d{1,3}[ .-]?\(?\d{2,4}\)?[ .-]?\d{3,4}[ .-]?\d{3,4}\b/,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
];
const implementationForbidden = [/from ['"]axios['"]/i, /require\(['"]axios['"]\)/i, /\bfetch\s*\(/, /XMLHttpRequest/i, /sendBeacon/i, /n8n API/i, /Evidence Log/i, /database/i, /token storage/i, /OAuth implementation/i];
let failures = [];
const fail = (message) => failures.push(message);
const read = (path) => readFileSync(join(root, path), 'utf8');
const parseJson = (path) => JSON.parse(read(path));

for (const path of ['connectors/README.md','connectors/doctor/doctor-messages.json','connectors/examples/local.config.example.json','scripts/doctor.mjs']) {
  if (!existsSync(join(root, path))) fail(`${path} is missing`);
}

let messages = [];
try { messages = parseJson('connectors/doctor/doctor-messages.json'); } catch { fail('doctor messages JSON is invalid'); }
const messageMap = new Map(messages.map((message) => [message.errorCode, message]));
for (const code of requiredMessages) {
  if (!messageMap.has(code)) fail(`doctor message ${code} is missing`);
}
for (const message of messages) {
  for (const field of ['errorCode','customerMessage','fixLabel','fixAction','severity','publicSafe','containsRawPii','containsSecrets']) {
    if (!(field in message)) fail(`doctor message ${message.errorCode ?? '<unknown>'} missing ${field}`);
  }
  if (!messageActions.has(message.fixAction)) fail(`doctor message ${message.errorCode} has invalid fixAction`);
  if (message.publicSafe !== true || message.containsRawPii !== false || message.containsSecrets !== false) fail(`doctor message ${message.errorCode} is not public-safe`);
}

for (const id of manifestIds) {
  const path = `connectors/manifests/${id}.json`;
  if (!existsSync(join(root, path))) { fail(`${path} is missing`); continue; }
  const raw = read(path);
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(raw)) fail(`${path} contains forbidden secret/live/provider wording: ${pattern}`);
  }
  let manifest;
  try { manifest = JSON.parse(raw); } catch { fail(`${path} is invalid JSON`); continue; }
  for (const field of requiredFields) {
    if (!(field in manifest)) fail(`${path} missing ${field}`);
  }
  if (manifest.connectorId !== id) fail(`${path} connectorId must be ${id}`);
  if (!categories.has(manifest.category)) fail(`${id} has invalid category`);
  if (!authTypes.has(manifest.authType)) fail(`${id} has invalid authType`);
  if (!priorities.has(manifest.launchPriority)) fail(`${id} has invalid launchPriority`);
  if (!statuses.has(manifest.status)) fail(`${id} has invalid status`);
  if (primaryIds.has(id) && manifest.launchPriority !== 'v0_7_primary') fail(`${id} must be v0_7_primary`);
  if (nonPrimaryIds.includes(id) && manifest.launchPriority === 'v0_7_primary') fail(`${id} must not be primary for v0.7-A03`);
  if (nonPrimaryIds.includes(id) && manifest.status === 'available_for_cloud_setup') fail(`${id} must not be operational in v0.7-A03`);
  for (const booleanField of ['publicSafe','noSecretsIncluded','noProviderCall','noLiveExecution']) {
    if (manifest[booleanField] !== true) fail(`${id} must set ${booleanField}: true`);
  }
  if (!Array.isArray(manifest.doctorMessageRefs)) fail(`${id} doctorMessageRefs must be an array`);
  for (const ref of manifest.doctorMessageRefs ?? []) {
    if (!messageMap.has(ref)) fail(`${id} references missing doctor message ${ref}`);
  }
}

const connectorReadme = existsSync(join(root, 'connectors/README.md')) ? read('connectors/README.md') : '';
for (const phrase of ['Connector Kits','What this catalog is','What this catalog is not','Primary v0.7 connectors','Secondary/stretch connectors','How Install Doctor works','Local/BYOK vs Capsule Cloud','Security posture','No secrets in this repo','No provider calls from this launcher','Future v0.7-B OAuth handoff','Future Restaurant Golden Kit','Connector manifests describe installable capabilities. They do not prove a connector is connected, healthy or installed.']) {
  if (!connectorReadme.includes(phrase)) fail(`connectors/README.md missing required phrase: ${phrase}`);
}

const pkg = parseJson('package.json');
if (pkg.scripts?.['validate:connector-manifests'] !== 'node scripts/validate-connector-manifests.mjs') fail('package.json missing validate:connector-manifests script');
if (pkg.scripts?.doctor !== 'node scripts/doctor.mjs') fail('package.json missing doctor script');
if (!pkg.scripts?.quality?.includes('validate:connector-manifests')) fail('quality script must include validate:connector-manifests');

const scannedFiles = ['connectors/README.md','connectors/doctor/doctor-messages.json','connectors/examples/local.config.example.json','scripts/doctor.mjs', ...manifestIds.map((id) => `connectors/manifests/${id}.json`)];
for (const path of scannedFiles) {
  if (!existsSync(join(root, path))) continue;
  const raw = read(path);
  for (const pattern of implementationForbidden) {
    if (pattern.test(raw)) fail(`${path} contains forbidden implementation/network/runtime term: ${pattern}`);
  }
}

if (failures.length) {
  console.error('Connector manifest validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('Connector manifest validation OK.');
