import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { basename, extname, join, relative, resolve } from 'node:path';

const root = process.cwd();
const ignoredDirs = new Set(['.git','node_modules','dist','build','coverage','.next']);
const scanExtensions = new Set(['.js','.mjs','.ts','.tsx','.jsx','.json','.md','.txt','.yml','.yaml','.example','.sh','.bash','.zsh','.env','.py','.html','.css','.scss','.toml','.ini','.conf','.cfg','.properties','.xml','.csv']);
const tokenValuePattern = /\b(sk-[A-Za-z0-9_-]{16,}|xox[baprs]-[A-Za-z0-9-]{16,}|gh[pousr]_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16})\b/;
const privateKeyPattern = new RegExp(`${'-----BEGIN '}[A-Z ]*${'PRIVATE KEY-----'}`);
const webhookUrlPattern = /https?:\/\/[^\s"')]+webhook[^\s"')]+/i;
const customerDataPattern = /\b(customer|tenant|client)\s*(email|phone|address|payload|record)\s*[:=]\s*["'][^"']+["']/i;
const sensitiveCredentialBasenames = new Set(['id_rsa','id_dsa','id_ecdsa','id_ed25519']);
const sensitiveCredentialExtensions = new Set(['.pem','.key','.p12','.pfx','.cer','.crt','.csr']);
const secretBearingTextBasenames = new Set([
  '.npmrc',
  '.yarnrc',
  '.pnpmrc',
  '.netrc',
  '.pypirc',
  '.dockerconfigjson',
  'kubeconfig',
  'config',
  'Dockerfile',
  'Makefile',
  'dockerfile',
  'makefile'
]);
const credentialPathSuffixes = [
  '.aws/credentials',
  '.aws/config',
  '.kube/config',
  '.docker/config.json'
];

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (ignoredDirs.has(entry.name)) return [];
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function normalizePathForPolicy(filePath) {
  return String(filePath ?? '').replaceAll('\\', '/');
}

function normalizedPolicyPaths(filePath) {
  const raw = normalizePathForPolicy(filePath);
  const rel = normalizePathForPolicy(relative(root, filePath));
  return [raw, rel];
}

function stripInlineComment(value) {
  let quote = null;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if ((char === '"' || char === "'") && value[index - 1] !== '\\') quote = quote === char ? null : (quote ?? char);
    if (char === '#' && !quote) return value.slice(0, index).trim();
  }
  return value.trim();
}

function unquote(value) {
  return value.replace(/^(["'])(.*)\1$/, '$2');
}

export function extractDockerfileAssignment(line) {
  const argMatch = line.match(/^\s*ARG\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?:=\s*(.*?))?\s*$/i);
  if (argMatch) {
    if (argMatch[2] === undefined) return null;
    return { key: argMatch[1], value: unquote(stripInlineComment(argMatch[2])) };
  }

  const envMatch = line.match(/^\s*ENV\s+(.+?)\s*$/i);
  if (!envMatch) return null;
  const envBody = envMatch[1].trim();
  const keyValueMatch = envBody.match(/^([A-Za-z_][A-Za-z0-9_]*)=(\S+)/);
  if (keyValueMatch) return { key: keyValueMatch[1], value: unquote(stripInlineComment(keyValueMatch[2])) };
  const spaceFormMatch = envBody.match(/^([A-Za-z_][A-Za-z0-9_]*)\s+(.+?)\s*$/);
  if (spaceFormMatch) return { key: spaceFormMatch[1], value: unquote(stripInlineComment(spaceFormMatch[2])) };
  return null;
}

export function extractAssignment(line) {
  const dockerfileAssignment = extractDockerfileAssignment(line);
  if (dockerfileAssignment) return dockerfileAssignment;

  const sourceDeclaration = line.match(/^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(.*?)\s*;?\s*$/);
  if (sourceDeclaration) return { key: sourceDeclaration[1], value: unquote(stripInlineComment(sourceDeclaration[2])) };

  const match = line.match(/^\s*\{?\s*(?:export\s+|set\s+)?["']?([^"'\s:=]+)["']?\s*[:=]\s*(.*?)\s*[,;}]?\s*$/i);
  if (!match) return null;
  return { key: match[1], value: unquote(stripInlineComment(match[2])) };
}

export function extractAssignmentKey(line) {
  return extractAssignment(line)?.key ?? null;
}

export function normalizeAssignmentKey(key) {
  return typeof key === 'string' ? key.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
}

export function isSensitiveAssignmentKey(key) {
  const normalized = normalizeAssignmentKey(key);
  if (!normalized) return false;
  return normalized.endsWith('apikey')
    || normalized.endsWith('accesskeyid')
    || normalized.endsWith('secretaccesskey')
    || normalized.endsWith('accesstoken')
    || normalized.endsWith('refreshtoken')
    || normalized.endsWith('clientsecret')
    || normalized.endsWith('privatekey')
    || normalized.endsWith('providerpayload')
    || normalized.endsWith('webhookurl')
    || normalized.endsWith('password')
    || normalized.endsWith('credential')
    || normalized.endsWith('secret')
    || normalized.endsWith('secretkey')
    || normalized.includes('apikey')
    || normalized.includes('accesskeyid')
    || normalized.includes('secretaccesskey')
    || normalized.includes('accesstoken')
    || normalized.includes('refreshtoken')
    || normalized.includes('clientsecret')
    || normalized.includes('privatekey')
    || normalized.includes('providerpayload')
    || normalized.includes('webhookurl')
    || normalized.includes('secretkey');
}

function isExampleRel(rel) {
  return rel.endsWith('.env.example') || rel.includes('/examples/') || rel.endsWith('.example') || rel.endsWith('.example.json');
}

export function isPlaceholderValue(value, rel = '') {
  const normalized = unquote(stripInlineComment(String(value ?? ''))).trim();
  if (normalized === '') return isExampleRel(normalizePathForPolicy(rel));
  return /^REPLACE_WITH_[A-Z0-9_]+$/.test(normalized)
    || /^YOUR_[A-Z0-9_]+$/.test(normalized)
    || /^<[A-Z0-9_ -]+>$/.test(normalized)
    || normalized === 'placeholder'
    || normalized === 'example'
    || normalized === 'example_value';
}

export function isHardSecretValue(value) {
  const normalized = String(value ?? '');
  return tokenValuePattern.test(normalized) || privateKeyPattern.test(normalized) || webhookUrlPattern.test(normalized);
}

export function isSensitiveCredentialFilename(filePath) {
  const name = basename(filePath);
  return sensitiveCredentialBasenames.has(name) || sensitiveCredentialExtensions.has(extname(name).toLowerCase());
}

export function isCredentialPath(filePath) {
  return normalizedPolicyPaths(filePath).some((normalized) =>
    credentialPathSuffixes.some((suffix) => normalized === suffix || normalized.endsWith(`/${suffix}`))
  );
}

export function isSecretBearingTextFilename(filePath) {
  return secretBearingTextBasenames.has(basename(filePath));
}

export function shouldScanSecretSafetyPath(path) {
  const rel = normalizePathForPolicy(relative(root, path));
  const raw = normalizePathForPolicy(path);
  if (rel.includes(`${'.git'}/`) || raw.includes(`${'.git'}/`)) return false;
  if (isSensitiveCredentialFilename(path)) return true;
  if (isCredentialPath(path)) return true;
  if (isSecretBearingTextFilename(path)) return true;
  if (basename(path) === '.env.example') return true;
  if (basename(path).startsWith('.env') && basename(path) !== '.env.example') return true;
  return scanExtensions.has(extname(path)) || path.endsWith('.example.json');
}

export function isScannerInternalPatternLine(rel, line) {
  const normalizedRel = normalizePathForPolicy(rel);
  const text = String(line ?? '');
  const assignment = extractAssignment(text);
  if (assignment && isHardSecretValue(assignment.value)) return false;
  if (normalizedRel === 'scripts/secret-safety-check.mjs') {
    return /(?:const\s+\w*Pattern\s*=|Pattern\.test|credentialPathSuffixes|secretBearingTextBasenames|publicReasonCodes|publicSafeSummary|noSecretsRead)/.test(text);
  }
  if (/^scripts\/validate-.*\.mjs$/.test(normalizedRel)) {
    return /mustContain|mustNotMatch|blockedSecretSamples|allowedSecretSamples|blockedEnvExampleSamples|credential-shaped string|forbidden|pattern\.test|public reason|publicReasonCodes|skipped credential path/.test(text)
      || /^\s*\//.test(text);
  }
  return false;
}

export function inspectSecretSafetyLine(line, rel = 'in-memory-check.json') {
  const finding = [];
  const assignment = extractAssignment(line);
  const value = assignment?.value ?? line;

  if (privateKeyPattern.test(value) || privateKeyPattern.test(line)) finding.push('private_key_block');
  if (tokenValuePattern.test(value) || tokenValuePattern.test(line)) finding.push('token_or_api_key_value');
  if (webhookUrlPattern.test(value) || webhookUrlPattern.test(line)) finding.push('webhook_url');
  if (customerDataPattern.test(line) && !(assignment && isPlaceholderValue(assignment.value, rel))) finding.push('raw_customer_data_pattern');

  if (finding.length > 0) return [...new Set(finding)];
  if (isScannerInternalPatternLine(rel, line)) return [];

  if (assignment && isSensitiveAssignmentKey(assignment.key) && !isPlaceholderValue(assignment.value, rel) && !/^(true|false|null|undefined|0|1)$/i.test(assignment.value)) finding.push('sensitive_key_name_outside_safe_context');
  return [...new Set(finding)];
}

export function runSecretSafetyCheck() {
  const blockedFindings = [];
  const warnings = [];
  const files = walk(root).filter(shouldScanSecretSafetyPath).sort();

  for (const file of files) {
    const rel = relative(root, file);
    if (isSensitiveCredentialFilename(file)) {
      blockedFindings.push({ file: rel, reason: 'sensitive_credential_file_not_allowed' });
      continue;
    }
    if (basename(file).startsWith('.env') && basename(file) !== '.env.example') {
      blockedFindings.push({ file: rel, reason: 'real_env_file_not_allowed' });
      continue;
    }
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
      const findings = inspectSecretSafetyLine(line, rel);
      for (const reason of findings) blockedFindings.push({ file: rel, line: index + 1, reason });
    });
  }

  if (!files.length) warnings.push('No public repository files were scanned.');
  return {
    sourceContract: 'launcher_v0_8_a08_secret_safety_report',
    ok: blockedFindings.length === 0,
    scannedFiles: files.length,
    blockedFindings,
    warnings,
    publicSafeSummary: 'Static repository scan only. The checker does not read secret stores, ask for credentials, call providers or perform live execution.',
    noSecretsRead: true,
    noProviderCall: true,
    noLiveExecution: true
  };
}

const invoked = process.argv[1]
  ? resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false;
if (invoked) {
  const report = runSecretSafetyCheck();
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.ok ? 0 : 1;
}
