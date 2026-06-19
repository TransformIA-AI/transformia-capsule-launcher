import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, extname, join, relative } from 'node:path';

const root = process.cwd();
const ignoredDirs = new Set(['.git','node_modules','dist','build','coverage','.next']);
const scanExtensions = new Set(['.js','.mjs','.json','.md','.txt','.yml','.yaml','.example']);
const placeholderPattern = /(<[^>]+>|YOUR_[A-Z0-9_]+|REPLACE_WITH_[A-Z0-9_]+|example|placeholder|public-safe|boundary|no secrets|no secret|not include|must stay outside|does not ask|sin credenciales|no requiere)/i;
const sensitiveKeyPattern = /["']?\b(api[_-]?key|apiKey|access[_-]?token|accessToken|refresh[_-]?token|refreshToken|client[_-]?secret|clientSecret|private[_-]?key|privateKey|provider[_-]?payload|providerPayload|webhook[_-]?url|webhookUrl|password|credential|secret)\b["']?\s*[:=]/i;
const tokenValuePattern = /\b(sk-[A-Za-z0-9_-]{16,}|xox[baprs]-[A-Za-z0-9-]{16,}|gh[pousr]_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16})\b/;
const privateKeyPattern = /-----BEGIN [A-Z ]*PRIVATE KEY-----/;
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

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (ignoredDirs.has(entry.name)) return [];
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

export function isSensitiveCredentialFilename(filePath) {
  const name = basename(filePath);
  return sensitiveCredentialBasenames.has(name) || sensitiveCredentialExtensions.has(extname(name).toLowerCase());
}

export function isSecretBearingTextFilename(filePath) {
  return secretBearingTextBasenames.has(basename(filePath));
}

export function shouldScanSecretSafetyPath(path) {
  const rel = relative(root, path);
  if (rel.includes(`${'.git'}/`)) return false;
  if (isSensitiveCredentialFilename(path)) return true;
  if (isSecretBearingTextFilename(path)) return true;
  if (basename(path) === '.env.example') return true;
  if (basename(path).startsWith('.env') && basename(path) !== '.env.example') return true;
  return scanExtensions.has(extname(path)) || path.endsWith('.example.json');
}

function safeContext(line, rel) {
  if (tokenValuePattern.test(line) || privateKeyPattern.test(line) || webhookUrlPattern.test(line)) return false;
  if (rel.endsWith('.env.example')) return placeholderPattern.test(line);
  return placeholderPattern.test(line);
}

export function inspectSecretSafetyLine(line, rel = 'in-memory-check.json') {
  if (/scripts\/validate-.*\.mjs$/.test(rel) && /credential-shaped string|forbidden|pattern\.test/.test(line)) return [];
  const finding = [];
  if (privateKeyPattern.test(line) && !safeContext(line, rel)) finding.push('private_key_block');
  if (tokenValuePattern.test(line) && !safeContext(line, rel)) finding.push('token_or_api_key_value');
  if (webhookUrlPattern.test(line) && !safeContext(line, rel)) finding.push('webhook_url');
  if (sensitiveKeyPattern.test(line) && !safeContext(line, rel)) finding.push('sensitive_key_name_outside_safe_context');
  if (customerDataPattern.test(line) && !safeContext(line, rel)) finding.push('raw_customer_data_pattern');
  return finding;
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

const invoked = import.meta.url === `file://${process.argv[1]}`;
if (invoked) {
  const report = runSecretSafetyCheck();
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.ok ? 0 : 1;
}
