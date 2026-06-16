import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const root = process.cwd();
const manifestDir = 'connectors/manifests';
const canonicalManifestIds = ['google-calendar','whatsapp-template-manager','hubspot','calendly','airtable','google-sheets'];
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
const manifestPathFor = (file) => `${manifestDir}/${file}`;

function listManifestFiles() {
  if (!existsSync(join(root, manifestDir))) return [];
  return readdirSync(join(root, manifestDir))
    .filter((file) => file.endsWith('.json'))
    .sort();
}

function validateManifestRecord({ file, raw, manifest, seenConnectorIds, messageMap, collect = fail }) {
  const path = manifestPathFor(file);
  const expectedConnectorId = basename(file, '.json');

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(raw)) collect(`${path} contains forbidden secret/live/provider wording: ${pattern}`);
  }
  for (const field of requiredFields) {
    if (!(field in manifest)) collect(`${path} missing ${field}`);
  }
  if (manifest.connectorId !== expectedConnectorId) collect(`${path} connectorId must match filename (${expectedConnectorId})`);
  if (seenConnectorIds.has(manifest.connectorId)) collect(`${path} duplicates connectorId ${manifest.connectorId}`);
  seenConnectorIds.add(manifest.connectorId);
  if (!categories.has(manifest.category)) collect(`${manifest.connectorId} has invalid category`);
  if (!authTypes.has(manifest.authType)) collect(`${manifest.connectorId} has invalid authType`);
  if (!priorities.has(manifest.launchPriority)) collect(`${manifest.connectorId} has invalid launchPriority`);
  if (!statuses.has(manifest.status)) collect(`${manifest.connectorId} has invalid status`);
  if (primaryIds.has(manifest.connectorId) && manifest.launchPriority !== 'v0_7_primary') collect(`${manifest.connectorId} must be v0_7_primary`);
  if (nonPrimaryIds.includes(manifest.connectorId) && manifest.launchPriority === 'v0_7_primary') collect(`${manifest.connectorId} must not be primary for v0.7-A03`);
  if (nonPrimaryIds.includes(manifest.connectorId) && manifest.status === 'available_for_cloud_setup') collect(`${manifest.connectorId} must not be operational in v0.7-A03`);
  for (const booleanField of ['publicSafe','noSecretsIncluded','noProviderCall','noLiveExecution']) {
    if (manifest[booleanField] !== true) collect(`${manifest.connectorId} must set ${booleanField}: true`);
  }
  if (!Array.isArray(manifest.doctorMessageRefs)) collect(`${manifest.connectorId} doctorMessageRefs must be an array`);
  for (const ref of manifest.doctorMessageRefs ?? []) {
    if (!messageMap.has(ref)) collect(`${manifest.connectorId} references missing doctor message ${ref}`);
  }
}

function sampleManifest(overrides = {}) {
  return {
    connectorId: 'synthetic-extra',
    displayName: 'Synthetic Extra',
    displayNameEs: 'Synthetic Extra',
    category: 'storage',
    authType: 'contract_only',
    launchPriority: 'coming_soon',
    status: 'coming_soon',
    allowedActions: ['Preview safe setup'],
    requiresApprovalActions: ['Perform governed action'],
    riskLevel: 'low',
    rollbackStrategy: 'No launcher rollback is needed for this synthetic validation case.',
    doctorMessageRefs: ['connector_not_supported_yet'],
    localConfigRequirements: ['tenantAlias'],
    cloudRequired: true,
    publicSafe: true,
    noSecretsIncluded: true,
    noProviderCall: true,
    noLiveExecution: true,
    ...overrides
  };
}

function assertSyntheticManifestGuards(messageMap) {
  const cases = [
    {
      name: 'extra manifest containing forbidden token wording',
      file: 'synthetic-extra.json',
      manifest: sampleManifest({ allowedActions: ['accessToken must never appear'] }),
      expected: 'forbidden secret/live/provider wording'
    },
    {
      name: 'duplicate connectorId',
      file: 'synthetic-extra.json',
      manifest: sampleManifest({ connectorId: 'google-calendar' }),
      seenConnectorIds: new Set(['google-calendar']),
      expected: 'duplicates connectorId'
    },
    {
      name: 'filename connectorId mismatch',
      file: 'different-name.json',
      manifest: sampleManifest({ connectorId: 'synthetic-extra' }),
      expected: 'connectorId must match filename'
    }
  ];

  for (const testCase of cases) {
    const syntheticFailures = [];
    const raw = JSON.stringify(testCase.manifest);
    validateManifestRecord({
      file: testCase.file,
      raw,
      manifest: testCase.manifest,
      seenConnectorIds: testCase.seenConnectorIds ?? new Set(),
      messageMap,
      collect: (message) => syntheticFailures.push(message)
    });
    if (!syntheticFailures.some((message) => message.includes(testCase.expected))) {
      fail(`synthetic guard failed for ${testCase.name}`);
    }
  }
}

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

const manifestFiles = listManifestFiles();
if (!manifestFiles.length) fail('connectors/manifests/*.json is empty or missing');
for (const id of canonicalManifestIds) {
  if (!manifestFiles.includes(`${id}.json`)) fail(`required canonical manifest ${id}.json is missing`);
}

const seenConnectorIds = new Set();
for (const file of manifestFiles) {
  const path = manifestPathFor(file);
  const raw = read(path);
  let manifest;
  try { manifest = JSON.parse(raw); } catch { fail(`${path} is invalid JSON`); continue; }
  validateManifestRecord({ file, raw, manifest, seenConnectorIds, messageMap });
}
assertSyntheticManifestGuards(messageMap);

const connectorReadme = existsSync(join(root, 'connectors/README.md')) ? read('connectors/README.md') : '';
for (const phrase of ['Connector Kits','What this catalog is','What this catalog is not','Primary v0.7 connectors','Secondary/stretch connectors','How Install Doctor works','Local/BYOK vs Capsule Cloud','Security posture','No secrets in this repo','No provider calls from this launcher','Future v0.7-B OAuth handoff','Future Restaurant Golden Kit','Connector manifests describe installable capabilities. They do not prove a connector is connected, healthy or installed.']) {
  if (!connectorReadme.includes(phrase)) fail(`connectors/README.md missing required phrase: ${phrase}`);
}

const pkg = parseJson('package.json');
if (pkg.scripts?.['validate:connector-manifests'] !== 'node scripts/validate-connector-manifests.mjs') fail('package.json missing validate:connector-manifests script');
if (pkg.scripts?.doctor !== 'node scripts/doctor.mjs') fail('package.json missing doctor script');
if (!pkg.scripts?.quality?.includes('validate:connector-manifests')) fail('quality script must include validate:connector-manifests');

const doctorSource = read('scripts/doctor.mjs');
for (const requiredDoctorSnippet of ['enabledConnectors', 'localConfigRequirements', 'manifestById', 'safeKeyName', 'safeConnectorLabel']) {
  if (!doctorSource.includes(requiredDoctorSnippet)) fail(`doctor.mjs must validate local config requirements: missing ${requiredDoctorSnippet}`);
}

const scannedFiles = ['connectors/README.md','connectors/doctor/doctor-messages.json','connectors/examples/local.config.example.json','scripts/doctor.mjs', ...manifestFiles.map((file) => manifestPathFor(file))];
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
console.log(`Connector manifest validation OK. Scanned ${manifestFiles.length} manifest files.`);
