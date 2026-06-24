import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

export const V1_ACTIVATION_RUNNER_GENERATED_AT = '2026-06-24T00:00:00.000Z';
export const V1_ACTIVATION_RUNNER_OUTPUT_ROOT = '.capsule-local/v1-activation-runner';

export const V1_ACTIVATION_RUNNER_REQUIRED_SCRIPTS = {
  'capsule:activation:validate': 'node scripts/capsule-activation-validate.mjs',
  'capsule:activation:doctor': 'node scripts/capsule-activation-doctor.mjs',
  'capsule:activation:dry-run': 'node scripts/capsule-activation-dry-run.mjs',
  'capsule:activation:evidence': 'node scripts/capsule-activation-evidence.mjs',
  'validate:v1-activation-runner': 'node scripts/validate-v1-activation-runner.mjs'
};

export const V1_ACTIVATION_RUNNER_REQUIRED_FILES = [
  'src/activation/v1-activation-runner.mjs',
  'src/activation/v1-activation-runner.ts',
  'src/activation/fixtures/capsule-v1-activation-pack.fixture.mjs',
  'src/activation/__tests__/v1-activation-runner.test.mjs',
  'scripts/capsule-activation-validate.mjs',
  'scripts/capsule-activation-doctor.mjs',
  'scripts/capsule-activation-dry-run.mjs',
  'scripts/capsule-activation-evidence.mjs',
  'scripts/validate-v1-activation-runner.mjs',
  'docs/v1-activation-runner/CAPSULE_LAUNCHER_V1_ACTIVATION_RUNNER_HANDOFF.md',
  'docs/v1-activation-runner/CAPSULE_LAUNCHER_V1_CONTRACT_MATRIX.md',
  'docs/v1-activation-runner/CAPSULE_LAUNCHER_V1_OPERATOR_GUIDE.md'
];

export const V1_ACTIVATION_RUNNER_WRITABLE_FILES = [
  'README_ACTIVATION_RUNNER.md',
  'activation-pack.public.json',
  'doctor-report.public.json',
  'dry-run-plan.public.json',
  'activation-evidence-pack.public.json',
  'console-handoff-summary.public.json',
  'local-workspace-skeleton.public.json',
  'workspace/config/launcher.config.public.json',
  'workspace/status/activation-status.public.json',
  'workspace/status/doctor-status.public.json',
  'workspace/plans/dry-run-plan.public.json',
  'workspace/evidence/activation-evidence-pack.public.json',
  'workspace/handoff/console-handoff-summary.public.json'
];

const SAFE_REF = /^[a-z][a-z0-9_]{2,80}$/;
const SAFE_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const ALLOWED_TEMPLATES = new Set(['restaurant_golden_kit', 'generic_public_activation', 'local_byok_starter']);
const ALLOWED_VERTICALS = new Set(['restaurant', 'generic', 'local_byok']);
const ALLOWED_PLAN_PATHS = new Set(['local_byok_review_path', 'starter_review_path', 'operator_review_path']);
const ALLOWED_ACTIVATION_MODES = new Set(['local_self_service_dry_run', 'deterministic_fixture']);
const ALLOWED_RUNTIME_MODES = new Set(['runtime_authority_required']);
const ALLOWED_LAUNCHER_MODES = new Set(['deterministic_fixture', 'local_workspace_simulation']);
const ALLOWED_CHANNELS = new Set(['console_handoff', 'local_workspace', 'operator_review_placeholder']);
const REQUIRED_TRUE_FLAGS = [
  'noLiveExecution',
  'noProviderConnection',
  'noSecrets',
  'noPaymentCapture',
  'noOutboundMessaging',
  'noCalendarBooking',
  'noProvisioning',
  'runtimeAuthorityRequired',
  'dryRunIsNotPermission',
  'publicSafe'
];
const REQUIRED_TRUE_FLAG_SET = new Set(REQUIRED_TRUE_FLAGS);
const CANONICAL_ACTIVATION_PACK_FIELDS = [
  'activationPackId',
  'tenantDraftId',
  'workspaceRef',
  'organizationRef',
  'template',
  'vertical',
  'planPath',
  'activationMode',
  'runtimeMode',
  'launcherMode',
  'requestedChannels',
  'boundaries',
  'safetyFlags',
  'generatedAt',
  'publicSafe'
];
const CANONICAL_ACTIVATION_PACK_FIELD_SET = new Set(CANONICAL_ACTIVATION_PACK_FIELDS);
const CANONICAL_PUBLIC_OUTPUT_KEYS = new Set([
  ...CANONICAL_ACTIVATION_PACK_FIELDS,
  ...REQUIRED_TRUE_FLAGS,
  'activationEvidencePackId',
  'activationPackFingerprint',
  'activationReadiness',
  'activationStatus',
  'blockedLiveDisabledReasonCodes',
  'blockedReasonCodes',
  'blockers',
  'boundaryStatus',
  'calendarBooking',
  'checkId',
  'checkedInvariants',
  'checks',
  'checksum',
  'consoleHandoffSummary',
  'containsSecrets',
  'dadRef',
  'deterministic',
  'deterministicActionDossier',
  'details',
  'doctorReportId',
  'doctorStatus',
  'dryRunPlan',
  'dryRunPlanId',
  'dryRunStatus',
  'evidenceExpected',
  'evidencePackReady',
  'executionAuthority',
  'explicitBoundaries',
  'files',
  'generatedArtifacts',
  'ignoredOutputRoot',
  'label',
  'lastDryRunSummary',
  'launcherStatus',
  'launcherStatusSummary',
  'localWorkspaceId',
  'localWorkspacePrepared',
  'localWorkspaceSkeleton',
  'noBookingWasCreated',
  'noOutboundMessageWasSent',
  'noPaymentWasCaptured',
  'noProviderWasCalled',
  'noProvisioningWasPerformed',
  'noSecretsIncluded',
  'ok',
  'outboundMessaging',
  'path',
  'paymentCapture',
  'providerCommissioningRequired',
  'providerConnection',
  'provisioning',
  'publicReasonCodes',
  'purpose',
  'reasonCodes',
  'runtimeAuthorityRequired',
  'runtimeCommissioningRequired',
  'runtimeRemainsAuthority',
  'status',
  'stepCount',
  'stepId',
  'steps',
  'validationReport',
  'validationStatus',
  'warnings',
  'workspaceSkeleton'
]);
const LIVE_ENDPOINT_PATTERN = /\b(?:https?:\/\/|wss?:\/\/|ftp:\/\/)/i;
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_PATTERN = /(?:\+\d[\d .-]{7,}\d|\b\d{3}[-. ]\d{3}[-. ]\d{3,4}\b)/;
const SECRET_VALUE_PATTERN = new RegExp(
  [
    'sk' + '_live_',
    'pk' + '_live_',
    'gh' + 'p_[A-Za-z0-9_]{20,}',
    'AKIA[0-9A-Z]{16}',
    'BEGIN\\s+(?:RSA\\s+|EC\\s+|OPENSSH\\s+|PRIVATE\\s+)?PRIVATE\\s+KEY',
    '(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|credential|private[_-]?key)\\s*[:=]',
    'Bearer\\s+[A-Za-z0-9._-]{12,}'
  ].join('|'),
  'i'
);
const LIVE_ASSERTIVE_KEYS = new Set([
  'runtimeExecutionEnabled',
  'liveExecutionEnabled',
  'bookingCreated',
  'messageSent',
  'paymentCaptured',
  'provisioned',
  'deployed'
]);
const NONEMPTY_ASSERTIVE_KEYS = new Set([
  'providerEndpoint',
  'providerUrl',
  'checkoutUrl',
  'paymentIntent',
  'customerEmail',
  'customerPhone'
]);
const PUBLIC_PAYLOAD_KEY_NAMES = new Set([
  'providerEndpoint',
  'providerUrl',
  'providerDetails',
  'providerPayload',
  'providerCredential',
  'providerCredentials',
  'checkoutUrl',
  'paymentIntent',
  'paymentMethod',
  'paymentPayload',
  'customerEmail',
  'customerPhone',
  'customerContact',
  'customerPayload',
  'contactEmail',
  'contactPhone',
  'contactPayload'
]);
const SENSITIVE_KEY_NAMES = new Set([
  ['api', 'key'],
  ['access', 'token'],
  ['refresh', 'token'],
  ['auth', 'token'],
  ['bearer', 'token'],
  ['pass', 'word'],
  ['pass'],
  ['sec', 'ret'],
  ['client', 'sec', 'ret'],
  ['private', 'key'],
  ['creden', 'tial'],
  ['creden', 'tials'],
  ['provider', 'creden', 'tial'],
  ['provider', 'creden', 'tials'],
  ['stri', 'pe', 'sec', 'ret'],
  ['webhook', 'sec', 'ret'],
  ['oauth', 'client', 'sec', 'ret'],
  ['session', 'token']
].map((parts) => parts.join('')));

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]));
  }
  return value;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(base, overrides) {
  if (!isPlainObject(overrides)) return clone(base);
  const merged = clone(base);
  for (const [key, value] of Object.entries(overrides)) {
    if (isPlainObject(value) && isPlainObject(merged[key])) merged[key] = deepMerge(merged[key], value);
    else merged[key] = clone(value);
  }
  return merged;
}

function addIssue(issues, code) {
  if (!issues.includes(code)) issues.push(code);
}

function normalizeKeyName(key) {
  return String(key ?? '').replace(/[^a-z0-9]/gi, '').toLowerCase();
}

const NORMALIZED_LIVE_ASSERTIVE_KEYS = new Set([...LIVE_ASSERTIVE_KEYS].map(normalizeKeyName));
const NORMALIZED_NONEMPTY_ASSERTIVE_KEYS = new Set([...NONEMPTY_ASSERTIVE_KEYS].map(normalizeKeyName));
const NORMALIZED_PUBLIC_PAYLOAD_KEY_NAMES = new Set([...PUBLIC_PAYLOAD_KEY_NAMES].map(normalizeKeyName));
const NORMALIZED_CANONICAL_PUBLIC_OUTPUT_KEYS = new Set([...CANONICAL_PUBLIC_OUTPUT_KEYS].map(normalizeKeyName));

function safeRefOrInvalid(value, fallback) {
  return typeof value === 'string' && SAFE_REF.test(value) ? value : fallback;
}

function buildSafeDerivedId(prefix, value, fallback) {
  return `${prefix}_${safeRefOrInvalid(value, fallback)}`;
}

function buildPublicPackRefs(pack, validationReport = validateV1ActivationPack(pack)) {
  const useRawRefs = validationReport.ok === true;
  return {
    activationPackId: useRawRefs ? safeRefOrInvalid(pack?.activationPackId, 'invalid_activation_pack') : 'invalid_activation_pack',
    workspaceRef: useRawRefs ? safeRefOrInvalid(pack?.workspaceRef, 'invalid_workspace') : 'invalid_workspace',
    tenantDraftId: useRawRefs ? safeRefOrInvalid(pack?.tenantDraftId, 'invalid_tenant_draft') : 'invalid_tenant_draft',
    organizationRef: useRawRefs ? safeRefOrInvalid(pack?.organizationRef, 'invalid_organization') : 'invalid_organization'
  };
}

function buildPublicBoundaryStatus(pack) {
  return Object.fromEntries(REQUIRED_TRUE_FLAGS.map((flag) => [
    flag,
    pack?.boundaries?.[flag] === true && pack?.safetyFlags?.[flag] === true
  ]));
}

function hasNonEmptyPublicValue(value) {
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') return Object.keys(value).length > 0;
  return Boolean(value);
}

function isUnsafeKeyMaterial(key) {
  const text = String(key ?? '');
  return LIVE_ENDPOINT_PATTERN.test(text) || EMAIL_PATTERN.test(text) || PHONE_PATTERN.test(text) || SECRET_VALUE_PATTERN.test(text);
}

function safePathForKey(path, key, forceUnsafe = false) {
  const text = String(key ?? '');
  if (forceUnsafe || isUnsafeKeyMaterial(text) || !/^[A-Za-z0-9_-]{1,100}$/.test(text)) return `${path}.<unsafe_key>`;
  return `${path}.${text}`;
}

function isUnsafePublicKeyName(key) {
  const normalizedKey = normalizeKeyName(key);
  return isUnsafeKeyMaterial(key)
    || SENSITIVE_KEY_NAMES.has(normalizedKey)
    || NORMALIZED_LIVE_ASSERTIVE_KEYS.has(normalizedKey)
    || NORMALIZED_NONEMPTY_ASSERTIVE_KEYS.has(normalizedKey)
    || NORMALIZED_PUBLIC_PAYLOAD_KEY_NAMES.has(normalizedKey);
}

function validateSafeRef(issues, path, value) {
  if (typeof value !== 'string' || !SAFE_REF.test(value)) addIssue(issues, `invalid_safe_ref:${path}`);
}

function validateAllowed(issues, path, value, allowed) {
  if (typeof value !== 'string' || !allowed.has(value)) addIssue(issues, `invalid_allowed_value:${path}`);
}

export function collectUnsafePublicMaterial(value, path = 'root', issues = [], options = {}) {
  if (typeof value === 'string') {
    if (LIVE_ENDPOINT_PATTERN.test(value)) addIssue(issues, `blocked_live_endpoint:${path}`);
    if (EMAIL_PATTERN.test(value) || PHONE_PATTERN.test(value)) addIssue(issues, `blocked_pii_like_value:${path}`);
    if (SECRET_VALUE_PATTERN.test(value)) addIssue(issues, `blocked_secret_like_value:${path}`);
    return issues;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectUnsafePublicMaterial(entry, `${path}.${index}`, issues, options));
    return issues;
  }
  if (value && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) {
      const normalizedKey = normalizeKeyName(key);
      const keyIsSensitive = SENSITIVE_KEY_NAMES.has(normalizedKey);
      const keyIsUnsafe = isUnsafePublicKeyName(key);
      const keyPath = safePathForKey(path, key, keyIsUnsafe);
      const isCanonicalPublicKey = NORMALIZED_CANONICAL_PUBLIC_OUTPUT_KEYS.has(normalizedKey);
      if (isUnsafeKeyMaterial(key)) addIssue(issues, `blocked_unsafe_key_name:${keyPath}`);
      if (keyIsSensitive) addIssue(issues, `blocked_sensitive_key_name:${keyPath}`);
      if (NORMALIZED_LIVE_ASSERTIVE_KEYS.has(normalizedKey) && entry) addIssue(issues, `blocked_assertive_live_field:${keyPath}`);
      if (NORMALIZED_NONEMPTY_ASSERTIVE_KEYS.has(normalizedKey) && hasNonEmptyPublicValue(entry)) addIssue(issues, `blocked_assertive_live_field:${keyPath}`);
      if (!isCanonicalPublicKey && NORMALIZED_PUBLIC_PAYLOAD_KEY_NAMES.has(normalizedKey) && hasNonEmptyPublicValue(entry)) {
        addIssue(issues, `blocked_public_payload_key_name:${keyPath}`);
      }
      if (options.blockUnknownKeys === true && options.allowedKeys && !options.allowedKeys.has(key)) {
        addIssue(issues, `blocked_unknown_public_output_key:${safePathForKey(path, key, keyIsUnsafe)}`);
      }
      collectUnsafePublicMaterial(entry, keyPath, issues, options);
    }
  }
  return issues;
}

function collectUnknownActivationPackFields(pack, issues) {
  for (const key of Object.keys(pack)) {
    if (!CANONICAL_ACTIVATION_PACK_FIELD_SET.has(key)) addIssue(issues, `unknown_activation_pack_field:${safePathForKey('root', key, isUnsafePublicKeyName(key))}`);
  }
  for (const field of ['boundaries', 'safetyFlags']) {
    const value = pack[field];
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      addIssue(issues, `activation_pack_${field}_must_be_object`);
      continue;
    }
    for (const key of Object.keys(value)) {
      if (!REQUIRED_TRUE_FLAG_SET.has(key)) addIssue(issues, `unknown_activation_pack_field:${safePathForKey(`root.${field}`, key, isUnsafePublicKeyName(key))}`);
    }
  }
}

export function computeActivationRunnerDigest(value) {
  return createHash('sha256').update(JSON.stringify(canonicalize(value))).digest('hex');
}

export function buildDefaultV1ActivationPack(overrides = {}) {
  const base = {
    activationPackId: 'activation_pack_v1_public_fixture',
    tenantDraftId: 'tenantdraft_capsule_v1_public',
    workspaceRef: 'workspace_capsule_v1_public',
    organizationRef: 'org_capsule_v1_public',
    template: 'restaurant_golden_kit',
    vertical: 'restaurant',
    planPath: 'local_byok_review_path',
    activationMode: 'local_self_service_dry_run',
    runtimeMode: 'runtime_authority_required',
    launcherMode: 'local_workspace_simulation',
    requestedChannels: ['console_handoff', 'local_workspace', 'operator_review_placeholder'],
    boundaries: {
      noLiveExecution: true,
      noProviderConnection: true,
      noSecrets: true,
      noPaymentCapture: true,
      noOutboundMessaging: true,
      noCalendarBooking: true,
      noProvisioning: true,
      runtimeAuthorityRequired: true,
      dryRunIsNotPermission: true,
      publicSafe: true
    },
    safetyFlags: {
      noLiveExecution: true,
      noProviderConnection: true,
      noSecrets: true,
      noPaymentCapture: true,
      noOutboundMessaging: true,
      noCalendarBooking: true,
      noProvisioning: true,
      runtimeAuthorityRequired: true,
      dryRunIsNotPermission: true,
      publicSafe: true
    },
    generatedAt: V1_ACTIVATION_RUNNER_GENERATED_AT,
    publicSafe: true
  };
  return deepMerge(base, overrides);
}

export function validateV1ActivationPack(pack = buildDefaultV1ActivationPack()) {
  const blockers = [];
  const warnings = [];
  if (!pack || typeof pack !== 'object' || Array.isArray(pack)) {
    return {
      ok: false,
      status: 'blocked_invalid_activation_pack',
      blockers: ['activation_pack_must_be_object'],
      warnings,
      checkedInvariants: [],
      checksum: computeActivationRunnerDigest({ status: 'blocked_invalid_activation_pack' }),
      publicSafe: true
    };
  }

  collectUnknownActivationPackFields(pack, blockers);
  validateSafeRef(blockers, 'activationPackId', pack.activationPackId);
  validateSafeRef(blockers, 'tenantDraftId', pack.tenantDraftId);
  validateSafeRef(blockers, 'workspaceRef', pack.workspaceRef);
  validateSafeRef(blockers, 'organizationRef', pack.organizationRef);
  validateAllowed(blockers, 'template', pack.template, ALLOWED_TEMPLATES);
  validateAllowed(blockers, 'vertical', pack.vertical, ALLOWED_VERTICALS);
  validateAllowed(blockers, 'planPath', pack.planPath, ALLOWED_PLAN_PATHS);
  validateAllowed(blockers, 'activationMode', pack.activationMode, ALLOWED_ACTIVATION_MODES);
  validateAllowed(blockers, 'runtimeMode', pack.runtimeMode, ALLOWED_RUNTIME_MODES);
  validateAllowed(blockers, 'launcherMode', pack.launcherMode, ALLOWED_LAUNCHER_MODES);

  if (!Array.isArray(pack.requestedChannels) || pack.requestedChannels.length === 0) addIssue(blockers, 'requested_channels_required');
  else {
    for (const [index, channel] of pack.requestedChannels.entries()) {
      if (typeof channel !== 'string' || !ALLOWED_CHANNELS.has(channel)) addIssue(blockers, `invalid_requested_channel:${index}`);
    }
  }

  if (pack.generatedAt !== V1_ACTIVATION_RUNNER_GENERATED_AT || !SAFE_TIMESTAMP.test(String(pack.generatedAt ?? ''))) {
    addIssue(blockers, 'generated_at_must_be_deterministic_fixture_timestamp');
  }
  if (pack.publicSafe !== true) addIssue(blockers, 'activation_pack_must_be_public_safe');
  for (const flag of REQUIRED_TRUE_FLAGS) {
    if (pack.boundaries?.[flag] !== true) addIssue(blockers, `missing_boundary:${flag}`);
    if (pack.safetyFlags?.[flag] !== true) addIssue(blockers, `missing_safety_flag:${flag}`);
  }

  for (const issue of collectUnsafePublicMaterial(pack)) addIssue(blockers, issue);

  const ok = blockers.length === 0;
  return {
    ok,
    status: ok ? 'valid_public_safe_activation_pack' : 'blocked_invalid_activation_pack',
    blockers,
    warnings,
    checkedInvariants: [
      'safe_refs_only',
      'deterministic_timestamp',
      'no_live_execution',
      'no_provider_connection',
      'no_secrets',
      'no_payment_capture',
      'no_outbound_messaging',
      'no_calendar_booking',
      'no_provisioning',
      'runtime_authority_required',
      'dry_run_is_not_permission',
      'public_safe_output'
    ],
    checksum: computeActivationRunnerDigest({ pack, blockers, warnings }),
    publicSafe: true
  };
}

function buildCanonicalFlagObject(value) {
  return Object.fromEntries(REQUIRED_TRUE_FLAGS.map((flag) => [flag, value?.[flag] === true]));
}

export function buildCanonicalPublicV1ActivationPack(pack = buildDefaultV1ActivationPack()) {
  const validationReport = validateV1ActivationPack(pack);
  if (!validationReport.ok) throw new ActivationRunnerWriteBlockedError(validationReport.blockers);
  return assertPublicSafeOutput({
    activationPackId: pack.activationPackId,
    tenantDraftId: pack.tenantDraftId,
    workspaceRef: pack.workspaceRef,
    organizationRef: pack.organizationRef,
    template: pack.template,
    vertical: pack.vertical,
    planPath: pack.planPath,
    activationMode: pack.activationMode,
    runtimeMode: pack.runtimeMode,
    launcherMode: pack.launcherMode,
    requestedChannels: [...pack.requestedChannels],
    boundaries: buildCanonicalFlagObject(pack.boundaries),
    safetyFlags: buildCanonicalFlagObject(pack.safetyFlags),
    generatedAt: V1_ACTIVATION_RUNNER_GENERATED_AT,
    publicSafe: true
  }, 'activation-pack.public.json');
}

export function computeActivationPackFingerprint(pack = buildDefaultV1ActivationPack()) {
  const validationReport = validateV1ActivationPack(pack);
  const activationPack = validationReport.ok
    ? buildCanonicalPublicV1ActivationPack(pack)
    : { status: validationReport.status, activationPackId: buildPublicPackRefs(pack, validationReport).activationPackId, publicSafe: true };
  return computeActivationRunnerDigest({ activationPack });
}

export function buildLocalWorkspaceSkeleton(pack = buildDefaultV1ActivationPack()) {
  const validationReport = validateV1ActivationPack(pack);
  const publicRefs = buildPublicPackRefs(pack, validationReport);
  return assertPublicSafeOutput({
    localWorkspaceId: buildSafeDerivedId('local_workspace', publicRefs.workspaceRef, 'invalid_workspace'),
    activationPackId: publicRefs.activationPackId,
    status: validationReport.ok ? 'workspace_skeleton_prepared' : 'workspace_skeleton_blocked',
    ignoredOutputRoot: V1_ACTIVATION_RUNNER_OUTPUT_ROOT,
    files: [
      { path: 'workspace/config/launcher.config.public.json', purpose: 'Public-safe launcher config stub without private material.', publicSafe: true, containsSecrets: false },
      { path: 'workspace/status/activation-status.public.json', purpose: 'Activation state for local review only.', publicSafe: true, containsSecrets: false },
      { path: 'workspace/status/doctor-status.public.json', purpose: 'Doctor status snapshot.', publicSafe: true, containsSecrets: false },
      { path: 'workspace/plans/dry-run-plan.public.json', purpose: 'Deterministic dry-run plan.', publicSafe: true, containsSecrets: false },
      { path: 'workspace/evidence/activation-evidence-pack.public.json', purpose: 'Public-safe activation evidence pack.', publicSafe: true, containsSecrets: false },
      { path: 'workspace/handoff/console-handoff-summary.public.json', purpose: 'Future console handoff summary.', publicSafe: true, containsSecrets: false }
    ],
    boundaries: buildPublicBoundaryStatus(pack),
    generatedAt: V1_ACTIVATION_RUNNER_GENERATED_AT,
    publicSafe: true
  }, 'local-workspace-skeleton.public.json');
}

export function buildDryRunActivationPlan(pack = buildDefaultV1ActivationPack()) {
  const validationReport = validateV1ActivationPack(pack);
  const publicRefs = buildPublicPackRefs(pack, validationReport);
  const validationStatus = validationReport.ok ? 'passed' : 'blocked';
  const dryRunStatus = validationReport.ok ? 'dry_run_ready_no_live_execution' : 'dry_run_blocked_invalid_pack';
  const steps = [
    {
      stepId: 'validate_activation_pack',
      label: 'Validate public-safe activation pack.',
      status: validationStatus,
      reasonCodes: validationReport.ok ? ['activation_pack_valid'] : validationReport.blockers,
      publicSafe: true,
      noLiveExecution: true,
      evidenceExpected: 'validation_report_public_json'
    },
    {
      stepId: 'prepare_local_workspace',
      label: 'Prepare deterministic local workspace skeleton.',
      status: validationReport.ok ? 'prepared' : 'blocked',
      reasonCodes: validationReport.ok ? ['workspace_skeleton_prepared'] : ['activation_pack_validation_required'],
      publicSafe: true,
      noLiveExecution: true,
      evidenceExpected: 'local_workspace_skeleton_public_json'
    },
    {
      stepId: 'prepare_runtime_handoff_placeholder',
      label: 'Prepare runtime handoff placeholder for later private authority review.',
      status: validationReport.ok ? 'placeholder_ready' : 'blocked',
      reasonCodes: ['runtime_authority_required', 'handoff_is_not_execution'],
      publicSafe: true,
      noLiveExecution: true,
      evidenceExpected: 'console_handoff_summary_public_json'
    },
    {
      stepId: 'prepare_channel_placeholders',
      label: 'Prepare non-live channel placeholders.',
      status: validationReport.ok ? 'requires_provider_commissioning' : 'blocked',
      reasonCodes: ['provider_commissioning_required', 'no_provider_connection', 'no_outbound_messaging', 'no_calendar_booking'],
      publicSafe: true,
      noLiveExecution: true,
      evidenceExpected: 'dry_run_plan_public_json'
    },
    {
      stepId: 'prepare_evidence_pack',
      label: 'Prepare public-safe activation evidence pack.',
      status: validationReport.ok ? 'prepared' : 'blocked',
      reasonCodes: validationReport.ok ? ['evidence_pack_ready'] : ['activation_pack_validation_required'],
      publicSafe: true,
      noLiveExecution: true,
      evidenceExpected: 'activation_evidence_pack_public_json'
    },
    {
      stepId: 'mark_live_execution_disabled',
      label: 'Mark live execution disabled and runtime authority required.',
      status: 'live_disabled',
      reasonCodes: ['dry_run_is_not_permission', 'runtime_authority_required', 'no_live_execution'],
      publicSafe: true,
      noLiveExecution: true,
      evidenceExpected: 'boundary_status_public_json'
    }
  ];

  return assertPublicSafeOutput({
    dryRunPlanId: buildSafeDerivedId('dry_run_plan', publicRefs.activationPackId, 'invalid_activation_pack'),
    activationPackId: publicRefs.activationPackId,
    status: dryRunStatus,
    validationStatus: validationReport.status,
    steps,
    noLiveExecution: true,
    providerCommissioningRequired: true,
    runtimeAuthorityRequired: true,
    generatedAt: V1_ACTIVATION_RUNNER_GENERATED_AT,
    publicSafe: true
  }, 'dry-run-plan.public.json');
}

export function buildConsoleHandoffSummary(pack = buildDefaultV1ActivationPack()) {
  const validationReport = validateV1ActivationPack(pack);
  const dryRunPlan = buildDryRunActivationPlan(pack);
  return assertPublicSafeOutput({
    launcherStatus: validationReport.ok ? 'activation_prepared_for_review' : 'activation_blocked',
    activationReadiness: validationReport.ok ? 'dry_run_ready_no_live_execution' : 'blocked_invalid_activation_pack',
    doctorStatus: 'doctor_required_before_handoff',
    evidencePackReady: validationReport.ok,
    localWorkspacePrepared: validationReport.ok,
    runtimeCommissioningRequired: true,
    providerCommissioningRequired: true,
    lastDryRunSummary: {
      dryRunPlanId: dryRunPlan.dryRunPlanId,
      status: dryRunPlan.status,
      stepCount: dryRunPlan.steps.length,
      noLiveExecution: true
    },
    publicReasonCodes: validationReport.ok
      ? ['dry_run_ready_no_live_execution', 'runtime_authority_required', 'provider_commissioning_required']
      : validationReport.blockers,
    boundaries: {
      dryRunIsNotPermission: true,
      runtimeRemainsAuthority: true,
      noProviderWasCalled: true,
      noBookingWasCreated: true,
      noPaymentWasCaptured: true,
      noOutboundMessageWasSent: true,
      noProvisioningWasPerformed: true
    },
    generatedAt: V1_ACTIVATION_RUNNER_GENERATED_AT,
    publicSafe: true
  }, 'console-handoff-summary.public.json');
}

function readPackageJson(root) {
  try {
    return JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  } catch (error) {
    return { scripts: {}, __readError: error.message };
  }
}

function makeDoctorCheck(checkId, passed, reasonCodes, details = {}) {
  return {
    checkId,
    status: passed ? 'passed' : 'blocked',
    reasonCodes,
    details,
    publicSafe: true
  };
}

export function runActivationDoctor(options = {}) {
  const root = options.root ?? process.cwd();
  const pack = options.activationPack ?? buildDefaultV1ActivationPack();
  const packageJson = readPackageJson(root);
  const validationReport = validateV1ActivationPack(pack);
  const publicRefs = buildPublicPackRefs(pack, validationReport);
  const dryRunPlan = buildDryRunActivationPlan(pack);
  const workspaceSkeleton = buildLocalWorkspaceSkeleton(pack);
  const generatedSurface = { validationReport, dryRunPlan, workspaceSkeleton, consoleHandoffSummary: buildConsoleHandoffSummary(pack) };
  const unsafeGeneratedIssues = collectUnsafePublicMaterial(generatedSurface, 'root', [], {
    allowedKeys: CANONICAL_PUBLIC_OUTPUT_KEYS,
    blockUnknownKeys: true
  });
  const checks = [];

  const requiredStructure = ['package.json', 'scripts', 'src/activation', 'docs'];
  const missingStructure = requiredStructure.filter((path) => !existsSync(join(root, path)));
  checks.push(makeDoctorCheck('repo_package_structure', missingStructure.length === 0, missingStructure.length ? missingStructure.map((path) => `missing:${path}`) : ['repo_structure_present']));

  const missingScripts = Object.entries(V1_ACTIVATION_RUNNER_REQUIRED_SCRIPTS)
    .filter(([name, command]) => packageJson.scripts?.[name] !== command)
    .map(([name]) => name);
  checks.push(makeDoctorCheck('required_scripts_registered', missingScripts.length === 0, missingScripts.length ? missingScripts.map((script) => `missing_script:${script}`) : ['required_scripts_present']));

  const missingFiles = V1_ACTIVATION_RUNNER_REQUIRED_FILES.filter((path) => !existsSync(join(root, path)));
  checks.push(makeDoctorCheck('required_fixture_files_present', missingFiles.length === 0, missingFiles.length ? missingFiles.map((path) => `missing_file:${path}`) : ['required_files_present']));

  checks.push(makeDoctorCheck('activation_pack_valid', validationReport.ok, validationReport.ok ? ['activation_pack_valid'] : validationReport.blockers));
  checks.push(makeDoctorCheck('generated_output_public_safe', unsafeGeneratedIssues.length === 0, unsafeGeneratedIssues.length ? unsafeGeneratedIssues : ['generated_output_public_safe']));
  checks.push(makeDoctorCheck('no_live_provider_endpoints_configured', pack.boundaries?.noProviderConnection === true, pack.boundaries?.noProviderConnection === true ? ['no_provider_connection'] : ['provider_connection_not_disabled']));
  checks.push(makeDoctorCheck('no_checkout_payment_enabled', pack.boundaries?.noPaymentCapture === true, pack.boundaries?.noPaymentCapture === true ? ['no_payment_capture'] : ['payment_capture_not_disabled']));
  checks.push(makeDoctorCheck('no_outbound_messaging_enabled', pack.boundaries?.noOutboundMessaging === true, pack.boundaries?.noOutboundMessaging === true ? ['no_outbound_messaging'] : ['outbound_messaging_not_disabled']));
  checks.push(makeDoctorCheck('no_calendar_booking_enabled', pack.boundaries?.noCalendarBooking === true, pack.boundaries?.noCalendarBooking === true ? ['no_calendar_booking'] : ['calendar_booking_not_disabled']));
  checks.push(makeDoctorCheck('no_runtime_execution_enabled', pack.boundaries?.noLiveExecution === true && pack.runtimeMode === 'runtime_authority_required', pack.boundaries?.noLiveExecution === true ? ['no_live_execution', 'runtime_authority_required'] : ['runtime_execution_not_disabled']));

  const blocked = checks.filter((check) => check.status === 'blocked');
  return assertPublicSafeOutput({
    doctorReportId: buildSafeDerivedId('doctor_report', publicRefs.activationPackId, 'invalid_activation_pack'),
    status: blocked.length ? 'blocked' : 'passed',
    checks,
    blockedReasonCodes: blocked.flatMap((check) => check.reasonCodes),
    generatedAt: V1_ACTIVATION_RUNNER_GENERATED_AT,
    publicSafe: true
  }, 'doctor-report.public.json');
}

const ALLOWED_DOCTOR_STATUSES = new Set(['passed', 'blocked', 'not_run']);

function normalizeDoctorStatus(status) {
  return ALLOWED_DOCTOR_STATUSES.has(status) ? status : 'blocked';
}

export function buildActivationEvidencePack(pack = buildDefaultV1ActivationPack(), options = {}) {
  const validationReport = options.validationReport ?? validateV1ActivationPack(pack);
  const publicRefs = buildPublicPackRefs(pack, validationReport);
  const doctorReport = options.doctorReport ?? { status: 'not_run', checks: [], blockedReasonCodes: ['doctor_not_run'], publicSafe: true };
  const doctorStatus = normalizeDoctorStatus(doctorReport.status);
  const dryRunPlan = options.dryRunPlan ?? buildDryRunActivationPlan(pack);
  const localWorkspaceSkeleton = options.localWorkspaceSkeleton ?? buildLocalWorkspaceSkeleton(pack);
  const consoleHandoffSummary = options.consoleHandoffSummary ?? buildConsoleHandoffSummary(pack);
  const boundaryStatus = {
    dryRunIsNotPermission: true,
    noProviderWasCalled: true,
    noBookingWasCreated: true,
    noPaymentWasCaptured: true,
    noOutboundMessageWasSent: true,
    noProvisioningWasPerformed: true,
    runtimeRemainsAuthority: true,
    noSecretsIncluded: true
  };

  return assertPublicSafeOutput({
    activationEvidencePackId: buildSafeDerivedId('activation_evidence_pack', publicRefs.activationPackId, 'invalid_activation_pack'),
    activationPackId: publicRefs.activationPackId,
    activationPackFingerprint: computeActivationPackFingerprint(pack),
    doctorStatus,
    dryRunStatus: dryRunPlan.status,
    boundaryStatus,
    generatedArtifacts: V1_ACTIVATION_RUNNER_WRITABLE_FILES.map((path) => ({ path, publicSafe: true, deterministic: true })),
    blockedLiveDisabledReasonCodes: [
      'dry_run_is_not_permission',
      'no_live_execution',
      'no_provider_connection',
      'no_calendar_booking',
      'no_payment_capture',
      'no_outbound_messaging',
      'no_provisioning',
      'runtime_authority_required',
      'provider_commissioning_required'
    ],
    consoleHandoffSummary,
    launcherStatusSummary: {
      launcherStatus: consoleHandoffSummary.launcherStatus,
      activationReadiness: consoleHandoffSummary.activationReadiness,
      doctorStatus,
      evidencePackReady: validationReport.ok && doctorStatus === 'passed',
      localWorkspacePrepared: localWorkspaceSkeleton.status === 'workspace_skeleton_prepared',
      runtimeCommissioningRequired: true,
      providerCommissioningRequired: true,
      publicReasonCodes: consoleHandoffSummary.publicReasonCodes
    },
    deterministicActionDossier: {
      dadRef: buildSafeDerivedId('dad', publicRefs.activationPackId, 'invalid_activation_pack'),
      status: 'public_safe_placeholder_ready',
      executionAuthority: 'runtime_required',
      noLiveExecution: true,
      publicSafe: true
    },
    explicitBoundaries: [
      'dry_run_is_not_permission',
      'no_provider_was_called',
      'no_booking_was_created',
      'no_payment_was_captured',
      'no_outbound_message_was_sent',
      'runtime_remains_authority',
      'no_provisioning_was_performed'
    ],
    validationReport,
    generatedAt: V1_ACTIVATION_RUNNER_GENERATED_AT,
    publicSafe: true
  }, 'activation-evidence-pack.public.json');
}

export class ActivationRunnerWriteBlockedError extends Error {
  constructor(blockers = []) {
    super(`activation_runner_write_blocked:${blockers.join(',')}`);
    this.name = 'ActivationRunnerWriteBlockedError';
    this.blockers = [...blockers];
    this.publicSafe = true;
  }
}

export function assertPublicSafeOutput(value, context = 'public_output') {
  const issues = collectUnsafePublicMaterial(value, 'root', [], {
    allowedKeys: CANONICAL_PUBLIC_OUTPUT_KEYS,
    blockUnknownKeys: true
  });
  if (issues.length) {
    throw new ActivationRunnerWriteBlockedError(issues.map((issue) => `blocked_public_output:${context}:${issue}`));
  }
  return value;
}

function validateDoctorReportOverride(doctorReport) {
  if (typeof doctorReport === 'undefined') return [];
  return collectUnsafePublicMaterial(doctorReport, 'root.doctorReport', [], {
    allowedKeys: CANONICAL_PUBLIC_OUTPUT_KEYS,
    blockUnknownKeys: true
  });
}

function publicJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function publicJsonOutput(filename, value) {
  return publicJson(assertPublicSafeOutput(value, filename));
}

function assertInside(root, target) {
  const rel = relative(root, target);
  if (rel.startsWith('..') || rel === '..' || rel.includes(`..${sep}`) || resolve(target) !== target) {
    throw new Error('blocked_path_traversal');
  }
}

function buildWorkspaceConfig(pack) {
  return assertPublicSafeOutput({
    activationPackId: pack.activationPackId,
    workspaceRef: pack.workspaceRef,
    launcherMode: pack.launcherMode,
    runtimeMode: pack.runtimeMode,
    providerConnection: 'disabled',
    outboundMessaging: 'disabled',
    calendarBooking: 'disabled',
    paymentCapture: 'disabled',
    provisioning: 'disabled',
    publicSafe: true
  }, 'workspace/config/launcher.config.public.json');
}

function buildActivationStatus(pack, validationReport) {
  return assertPublicSafeOutput({
    activationPackId: pack.activationPackId,
    status: validationReport.ok ? 'prepared_for_dry_run' : 'blocked',
    noLiveExecution: true,
    runtimeAuthorityRequired: true,
    providerCommissioningRequired: true,
    publicSafe: true
  }, 'workspace/status/activation-status.public.json');
}

export function buildActivationRunnerWritableFiles(pack = buildDefaultV1ActivationPack(), options = {}) {
  const validationReport = validateV1ActivationPack(pack);
  if (!validationReport.ok) throw new ActivationRunnerWriteBlockedError(validationReport.blockers);
  const overrideIssues = validateDoctorReportOverride(options.doctorReport);
  if (overrideIssues.length) throw new ActivationRunnerWriteBlockedError(overrideIssues.map((issue) => `blocked_doctor_report_override:${issue}`));
  const canonicalPack = buildCanonicalPublicV1ActivationPack(pack);
  const doctorReport = runActivationDoctor({ root: options.root ?? process.cwd(), activationPack: canonicalPack });
  if (doctorReport.status !== 'passed') throw new ActivationRunnerWriteBlockedError(doctorReport.blockedReasonCodes ?? ['doctor_blocked']);
  const dryRunPlan = buildDryRunActivationPlan(canonicalPack);
  const localWorkspaceSkeleton = buildLocalWorkspaceSkeleton(canonicalPack);
  const consoleHandoffSummary = buildConsoleHandoffSummary(canonicalPack);
  const activationEvidencePack = buildActivationEvidencePack(canonicalPack, { validationReport, doctorReport, dryRunPlan, localWorkspaceSkeleton, consoleHandoffSummary });
  const readme = `# Capsule Launcher v1 Activation Runner\n\nPublic-safe deterministic activation output. This output is a dry-run evidence and handoff package only. It does not call providers, create bookings, capture payment, send outbound messages, provision runtime state or grant live permission.\n\nActivation pack fingerprint: ${activationEvidencePack.activationPackFingerprint}\n`;
  const files = {
    'README_ACTIVATION_RUNNER.md': assertPublicSafeOutput(readme, 'README_ACTIVATION_RUNNER.md'),
    'activation-pack.public.json': publicJsonOutput('activation-pack.public.json', canonicalPack),
    'doctor-report.public.json': publicJsonOutput('doctor-report.public.json', doctorReport),
    'dry-run-plan.public.json': publicJsonOutput('dry-run-plan.public.json', dryRunPlan),
    'activation-evidence-pack.public.json': publicJsonOutput('activation-evidence-pack.public.json', activationEvidencePack),
    'console-handoff-summary.public.json': publicJsonOutput('console-handoff-summary.public.json', consoleHandoffSummary),
    'local-workspace-skeleton.public.json': publicJsonOutput('local-workspace-skeleton.public.json', localWorkspaceSkeleton),
    'workspace/config/launcher.config.public.json': publicJsonOutput('workspace/config/launcher.config.public.json', buildWorkspaceConfig(canonicalPack)),
    'workspace/status/activation-status.public.json': publicJsonOutput('workspace/status/activation-status.public.json', buildActivationStatus(canonicalPack, validationReport)),
    'workspace/status/doctor-status.public.json': publicJsonOutput('workspace/status/doctor-status.public.json', { doctorReportId: doctorReport.doctorReportId, status: doctorReport.status, publicSafe: true }),
    'workspace/plans/dry-run-plan.public.json': publicJsonOutput('workspace/plans/dry-run-plan.public.json', dryRunPlan),
    'workspace/evidence/activation-evidence-pack.public.json': publicJsonOutput('workspace/evidence/activation-evidence-pack.public.json', activationEvidencePack),
    'workspace/handoff/console-handoff-summary.public.json': publicJsonOutput('workspace/handoff/console-handoff-summary.public.json', consoleHandoffSummary)
  };
  const expected = new Set(V1_ACTIVATION_RUNNER_WRITABLE_FILES);
  for (const filename of Object.keys(files)) {
    if (!expected.has(filename) || filename.includes('..')) throw new Error('unexpected_activation_runner_filename');
  }
  return files;
}

export function buildActivationRunnerDryRunWritableFiles(pack = buildDefaultV1ActivationPack()) {
  const validationReport = validateV1ActivationPack(pack);
  if (!validationReport.ok) throw new ActivationRunnerWriteBlockedError(validationReport.blockers);
  const canonicalPack = buildCanonicalPublicV1ActivationPack(pack);
  const dryRunPlan = buildDryRunActivationPlan(canonicalPack);
  const localWorkspaceSkeleton = buildLocalWorkspaceSkeleton(canonicalPack);
  return {
    'dry-run-plan.public.json': publicJsonOutput('dry-run-plan.public.json', dryRunPlan),
    'local-workspace-skeleton.public.json': publicJsonOutput('local-workspace-skeleton.public.json', localWorkspaceSkeleton),
    'workspace/config/launcher.config.public.json': publicJsonOutput('workspace/config/launcher.config.public.json', buildWorkspaceConfig(canonicalPack)),
    'workspace/status/activation-status.public.json': publicJsonOutput('workspace/status/activation-status.public.json', buildActivationStatus(canonicalPack, validationReport)),
    'workspace/plans/dry-run-plan.public.json': publicJsonOutput('workspace/plans/dry-run-plan.public.json', dryRunPlan)
  };
}

export function writeActivationRunnerFiles(files, outputRoot) {
  if (!outputRoot || String(outputRoot).includes('..')) throw new Error('explicit_safe_output_root_required');
  const root = resolve(outputRoot);
  const written = [];
  mkdirSync(root, { recursive: true });
  for (const [filename, content] of Object.entries(files)) {
    if (filename.includes('..')) throw new Error('unexpected_activation_runner_filename');
    const target = resolve(join(root, filename));
    assertInside(root, target);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content, 'utf8');
    written.push(target);
  }
  return written;
}

export function writeActivationRunnerEvidencePack(pack = buildDefaultV1ActivationPack(), outputRoot = V1_ACTIVATION_RUNNER_OUTPUT_ROOT, options = {}) {
  return writeActivationRunnerFiles(buildActivationRunnerWritableFiles(pack, options), outputRoot);
}

export function writeActivationRunnerDryRun(pack = buildDefaultV1ActivationPack(), outputRoot = V1_ACTIVATION_RUNNER_OUTPUT_ROOT) {
  return writeActivationRunnerFiles(buildActivationRunnerDryRunWritableFiles(pack), outputRoot);
}
