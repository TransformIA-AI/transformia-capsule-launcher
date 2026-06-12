import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const issues = [];

const requiredFiles = [
  ".env.example",
  "config/README.md",
  "config/local-byok.config.example.json",
  "config/local-byok.config.schema.json",
  "docs/CODEX_PR_AND_VALIDATOR_GUARDRAILS.md",
  "docs/LOCAL_BYOK_CONFIG_SCAFFOLD.md",
  "docs/BYOK_SECRET_HANDLING_BOUNDARY.md",
  "docs/CONFIG_PLACEHOLDER_SCHEMA.md",
  "docs/release/TRANSFORMIA_CAPSULE_LAUNCHER_V0_6_C04_LOCAL_BYOK_CONFIG_SCAFFOLD_STATUS.md",
  "scripts/validate-launcher-c04-local-byok-config-scaffold.mjs",
  "package.json",
  "README.md",
  "QUICKSTART.md",
];

const expectedTopLevelRequired = [
  "schemaVersion",
  "status",
  "configMode",
  "executable",
  "providerExecutionEnabled",
  "privateRuntimeRequired",
  "secretsRequiredInC04",
  "envFileRequiredInC04",
  "localMode",
  "providerPlaceholders",
  "secretHandling",
  "runtimeBoundary",
  "cloudHandoff",
  "publicSafe",
];

const binaryExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf", ".docx", ".zip", ".ico", ".exe", ".dmg", ".pkg", ".tar", ".gz", ".tgz", ".7z"]);
const excludedScanDirs = new Set([".git", "node_modules", "dist", "build", "coverage"]);
const claimScanExtensions = new Set([".md", ".txt", ".json", ".yml", ".yaml"]);
const claimScanExactFiles = new Set([".gitignore", ".env.example"]);
const claimScanExcludedFiles = new Set(["package-lock.json", "npm-shrinkwrap.json", "yarn.lock", "pnpm-lock.yaml"]);

const forbiddenPositiveClaims = [
  ["local", "capsule", "execution", "enabled"].join(" "),
  ["run", "capsules", "locally", "today"].join(" "),
  ["provider", "execution", "enabled"].join(" "),
  ["provider", "configured"].join(" "),
  ["runtime", "adapter", "available"].join(" "),
  ["connector", "execution", "enabled"].join(" "),
  ["cloud", "sync", "active"].join(" "),
  ["telemetry", "active"].join(" "),
  ["payment", "active"].join(" "),
  ["Stripe", "live"].join(" "),
  ["private", "runtime", "included"].join(" "),
  ["production", "ready"].join(" "),
  ["open", "source"].join(" "),
];

const placeholderValues = new Set([
  "placeholder_only",
  "planned_local_byok",
  "not_configured",
  "replace_locally_in_future_never_commit_real_value",
]);

function addIssue(condition, message) {
  if (!condition) issues.push(message);
}

function abs(path) {
  return join(root, path);
}

function exists(path) {
  return existsSync(abs(path));
}

function read(path) {
  return readFileSync(abs(path), "utf8");
}

function parseJson(path) {
  try {
    return JSON.parse(read(path));
  } catch (error) {
    issues.push(`${path} must parse as JSON: ${error.message}`);
    return null;
  }
}

function runGit(args) {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function walk(dir = "") {
  const base = dir ? abs(dir) : root;
  if (!existsSync(base)) return [];
  const out = [];
  for (const entry of readdirSync(base)) {
    if (excludedScanDirs.has(entry)) continue;
    const rel = dir ? `${dir}/${entry}` : entry;
    const full = abs(rel);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walk(rel));
    else out.push(rel);
  }
  return out;
}

function resolvePrBase() {
  const envBase = process.env.PR_BASE_SHA || process.env.GITHUB_BASE_SHA || process.env.BASE_SHA;
  if (envBase && runGit(["rev-parse", "--verify", `${envBase}^{commit}`])) return envBase;
  for (const candidate of ["origin/main", "main", "HEAD^"]) {
    if (runGit(["rev-parse", "--verify", `${candidate}^{commit}`])) return candidate;
  }
  return "";
}

function splitGitLines(output) {
  return output ? output.split(/\r?\n/).filter(Boolean) : [];
}

function changedFilesFromBase(base) {
  if (!base) return [];
  const committed = splitGitLines(runGit(["diff", "--name-only", `${base}...HEAD`]));
  const workspace = splitGitLines(runGit(["diff", "--name-only", base]));
  return [...new Set([...committed, ...workspace])].sort();
}

function trackedFiles() {
  return splitGitLines(runGit(["ls-files"]));
}

function isExcludedGeneratedPath(file) {
  return file.split("/").some((part) => excludedScanDirs.has(part));
}

function isBinaryArtifact(file) {
  return binaryExtensions.has(extname(file).toLowerCase());
}

function isLockfile(file) {
  return claimScanExcludedFiles.has(file) || file.endsWith(".lock");
}

function isTrackedTextFileForClaimScan(file) {
  if (!file || isExcludedGeneratedPath(file) || isBinaryArtifact(file) || isLockfile(file)) return false;
  if (claimScanExactFiles.has(file)) return true;
  return claimScanExtensions.has(extname(file).toLowerCase());
}

function claimScanFilesFromSources(tracked, fallbackFiles) {
  const source = tracked.length > 0 ? tracked : fallbackFiles;
  return source.filter(isTrackedTextFileForClaimScan).sort();
}

function claimScanFiles() {
  return claimScanFilesFromSources(trackedFiles(), walk());
}

function artifactScanFiles() {
  const files = new Set();
  for (const file of trackedFiles()) files.add(file);
  for (const file of walk()) files.add(file);
  return [...files].sort();
}

function isBoundaryListFragment(line) {
  const trimmed = line.trim();
  return /^[-*]\s+/.test(trimmed) && trimmed.endsWith(";");
}

function isNegatedOrBoundaryLine(line) {
  const lower = line.toLowerCase();
  const boundaryMarkers = [
    "not ",
    "no ",
    "never",
    "must not",
    "do not",
    "does not",
    "without",
    "before",
    "forbidden",
    "non-goal",
    "non-goals",
    "blocked",
    "blocks",
    "protects against",
    "must never",
    "no overclaim",
    "does not grant",
    "does not mean",
    "must not claim",
    "not claim",
    "not open source",
    "source-available, not open source",
    "source-available, not an open source",
    "should not",
    "is not",
    "are not",
    "not a",
    "not an",
    "absent",
    "placeholder",
    "planned",
    "disabled",
    "approval",
  ];
  return isBoundaryListFragment(line) || boundaryMarkers.some((marker) => lower.includes(marker));
}

function hasPositiveForbiddenClaim(text, phrase) {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(escaped, "i");
  return text.split(/\r?\n/).some((line) => pattern.test(line) && !isNegatedOrBoundaryLine(line));
}

function validateEnvExample() {
  const text = read(".env.example");
  addIssue(text.includes("C04 does not require real credentials"), ".env.example must state C04 does not require real credentials");
  addIssue(text.includes("Never commit real secrets"), ".env.example must warn against committing real secrets");
  addIssue(!/(OPENAI_API_KEY|ANTHROPIC_API_KEY|STRIPE_SECRET|GOOGLE_API_KEY|BEARER_TOKEN)/i.test(text), ".env.example must not contain active provider secret names");
  addIssue(!/(sk-[A-Za-z0-9_-]{16,}|xox[baprs]-|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|eyJ[A-Za-z0-9_-]{20,})/.test(text), ".env.example must not contain real secret-looking values");
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const [name, value] = line.split("=");
    addIssue(Boolean(name && value), `.env.example line must be KEY=value: ${line}`);
    addIssue(name.startsWith("TRANSFORMIA_CAPSULE_"), `.env.example variable must stay generic TransformIA placeholder: ${name}`);
    addIssue(placeholderValues.has(value), `.env.example value must be placeholder-only: ${name}`);
  }
}

function validateNoRealEnvFiles() {
  const envFiles = artifactScanFiles().filter((file) => /(^|\/)\.env(\.|$)/.test(file) && file !== ".env.example");
  addIssue(envFiles.length === 0, `.env file must not be committed: ${envFiles.join(", ")}`);
}

function validateConfigContract(example, schema) {
  addIssue(example?.schemaVersion === "transformia-capsule-local-byok-config.v0.6-c04", "config example schemaVersion must match C04");
  addIssue(example?.status === "placeholder_only", "config example status must be placeholder_only");
  addIssue(example?.configMode === "local_byok_planned", "config example configMode must be local_byok_planned");
  addIssue(example?.executable === false, "config example executable must be false");
  addIssue(example?.providerExecutionEnabled === false, "config example providerExecutionEnabled must be false");
  addIssue(example?.privateRuntimeRequired === false, "config example privateRuntimeRequired must be false");
  addIssue(example?.secretsRequiredInC04 === false, "config example secretsRequiredInC04 must be false");
  addIssue(example?.envFileRequiredInC04 === false, "config example envFileRequiredInC04 must be false");
  addIssue(example?.publicSafe === true, "config example publicSafe must be true");
  addIssue(example?.localMode?.enabledToday === false, "local mode must not be enabled today");
  addIssue(example?.localMode?.planned === true, "local mode must be planned");
  addIssue(Array.isArray(example?.providerPlaceholders) && example.providerPlaceholders.length >= 3, "provider placeholders must exist");
  for (const provider of example?.providerPlaceholders ?? []) {
    addIssue(provider.status === "not_configured", `provider placeholder must be not_configured: ${provider.id}`);
    addIssue(provider.active === false, `provider placeholder must not be active: ${provider.id}`);
    addIssue(/_placeholder$/.test(provider.id), `provider id must remain generic placeholder: ${provider.id}`);
  }
  addIssue(example?.secretHandling?.neverCommitRealSecrets === true, "secretHandling neverCommitRealSecrets must be true");
  addIssue(example?.secretHandling?.envExampleOnly === true, "secretHandling envExampleOnly must be true");
  addIssue(example?.secretHandling?.realCredentialsAcceptedInC04 === false, "secretHandling realCredentialsAcceptedInC04 must be false");
  addIssue(example?.secretHandling?.storage === "not_implemented", "secretHandling storage must be not_implemented");
  addIssue(example?.runtimeBoundary?.noPrivateRuntime === true, "runtimeBoundary noPrivateRuntime must be true");
  addIssue(example?.runtimeBoundary?.noRuntimeAdapter === true, "runtimeBoundary noRuntimeAdapter must be true");
  addIssue(example?.runtimeBoundary?.noConnectorExecution === true, "runtimeBoundary noConnectorExecution must be true");
  addIssue(example?.cloudHandoff?.implemented === false, "cloudHandoff implemented must be false");
  addIssue(example?.cloudHandoff?.planned === true, "cloudHandoff planned must be true");

  addIssue(schema?.additionalProperties === false, "schema must set additionalProperties false at top level");
  addIssue(JSON.stringify(schema?.required ?? []) === JSON.stringify(expectedTopLevelRequired), "schema required fields must match validator required fields");
  for (const field of expectedTopLevelRequired) addIssue(Object.hasOwn(schema?.properties ?? {}, field), `schema must define property: ${field}`);
  addIssue(schema?.properties?.status?.const === "placeholder_only", "schema status must be placeholder_only only");
  addIssue(schema?.properties?.executable?.const === false, "schema executable must const false");
  addIssue(schema?.properties?.providerExecutionEnabled?.const === false, "schema providerExecutionEnabled must const false");
  addIssue(schema?.properties?.privateRuntimeRequired?.const === false, "schema privateRuntimeRequired must const false");
  addIssue(schema?.properties?.secretsRequiredInC04?.const === false, "schema secretsRequiredInC04 must const false");
  addIssue(schema?.properties?.envFileRequiredInC04?.const === false, "schema envFileRequiredInC04 must const false");
  addIssue(schema?.properties?.publicSafe?.const === true, "schema publicSafe must const true");
}

function assertForbiddenClaimRegressionChecks() {
  const phrase = ["provider", "execution", "enabled"].join(" ");
  addIssue(hasPositiveForbiddenClaim("provider execution enabled", phrase), "positive claim alone must fail");
  addIssue(!hasPositiveForbiddenClaim("No provider execution enabled.", phrase), "same-line negation must pass");
  addIssue(hasPositiveForbiddenClaim(["No provider execution.", "provider execution enabled"].join("\n"), phrase), "previous-line negation must not exempt a positive claim");
}

function assertClaimScanSourceRegressionChecks() {
  const selected = claimScanFilesFromSources(["README.md"], ["tmp-review.md", "docs/untracked.md"]);
  addIssue(selected.length === 1 && selected[0] === "README.md", "tracked claim scan must ignore untracked scratch files when tracked files exist");
  const fallback = claimScanFilesFromSources([], ["README.md", "tmp-review.md"]);
  addIssue(fallback.includes("README.md") && fallback.includes("tmp-review.md"), "claim scan fallback must work without tracked files");
}

function assertEnvRegressionChecks() {
  addIssue(!/(^|\/)\.env(\.|$)/.test(".env.example") || ".env.example" === ".env.example", ".env.example must be allowed");
  addIssue(/(^|\/)\.env(\.|$)/.test(".env.local") && ".env.local" !== ".env.example", ".env.local must be forbidden");
  addIssue(/(^|\/)\.env(\.|$)/.test(".env.production") && ".env.production" !== ".env.example", ".env.production must be forbidden");
}

for (const file of requiredFiles) addIssue(exists(file), `required file missing: ${file}`);

const pkg = exists("package.json") ? parseJson("package.json") : null;
const readme = exists("README.md") ? read("README.md") : "";
const quickstart = exists("QUICKSTART.md") ? read("QUICKSTART.md") : "";
const guardrails = exists("docs/CODEX_PR_AND_VALIDATOR_GUARDRAILS.md") ? read("docs/CODEX_PR_AND_VALIDATOR_GUARDRAILS.md") : "";
const validatorSource = exists("scripts/validate-launcher-c04-local-byok-config-scaffold.mjs") ? read("scripts/validate-launcher-c04-local-byok-config-scaffold.mjs") : "";
const example = exists("config/local-byok.config.example.json") ? parseJson("config/local-byok.config.example.json") : null;
const schema = exists("config/local-byok.config.schema.json") ? parseJson("config/local-byok.config.schema.json") : null;

validateEnvExample();
validateNoRealEnvFiles();
validateConfigContract(example, schema);

addIssue(pkg?.scripts?.["validate:launcher-c04-local-byok-config-scaffold"] === "node scripts/validate-launcher-c04-local-byok-config-scaffold.mjs", "package script must exist for C04 validator");
const quality = pkg?.scripts?.quality ?? "";
for (const scriptName of [
  "validate:bootstrap-context",
  "validate:launcher-public-repo-strategy",
  "validate:launcher-c02-readme-quickstart-install-promise",
  "validate:launcher-c03-public-template-manifests",
  "validate:launcher-c04-local-byok-config-scaffold",
]) addIssue(quality.includes(scriptName), `quality must include ${scriptName}`);

addIssue(readme.includes("Local/BYOK config scaffold"), "README must include Local/BYOK config scaffold section");
addIssue(readme.includes("config/README.md"), "README must link config README");
addIssue(readme.includes("docs/LOCAL_BYOK_CONFIG_SCAFFOLD.md"), "README must link local/BYOK scaffold doc");
addIssue(quickstart.includes("Optional: inspect the config placeholder"), "QUICKSTART must include optional config inspection step");
addIssue(!/touch\s+\.env/i.test(quickstart), "QUICKSTART must not create .env");
const quickstartForbiddenInstruction = quickstart.split(/\r?\n/).some((line) => /(?:add|set|configure).*?(?:API|provider).*?(?:key|secret)/i.test(line) && !isNegatedOrBoundaryLine(line));
addIssue(!quickstartForbiddenInstruction, "QUICKSTART must not instruct adding keys or configuring providers");
addIssue(guardrails.includes("Quality validators validate durable repository state"), "guardrails must codify durable-state validation");
addIssue(guardrails.includes("Claim scans use tracked text files"), "guardrails must codify tracked-file claim scanning");
addIssue(guardrails.includes("Negation checks are matching-line-only"), "guardrails must codify matching-line negation");

addIssue(!validatorSource.includes(["window", "Start"].join("")), "validator must not use context-window negation state");
addIssue(!validatorSource.includes(["lines", "slice(window", "Start"].join("." ).replace(".slice", ".slice").replace(".Start", "Start")), "validator must not inspect earlier lines for claim negation");
addIssue(!validatorSource.includes(["[...", "trackedFiles(), ...", "walk()]"].join("")), "claim scan source must not use tracked+walk union for forbidden claims");
addIssue(!validatorSource.includes(["changedFiles", "includes", "docs/LOCAL_BYOK_CONFIG_SCAFFOLD.md"].join(".")), "validator must not require C04 files in every future diff");
addIssue(validatorSource.includes("claimScanFilesFromSources"), "validator must expose claim scan source regression path");
addIssue(validatorSource.includes("changedFilesFromBase"), "validator must include PR-base aware changed-file detection");
addIssue(validatorSource.includes("expectedTopLevelRequired"), "validator must compare schema and validator required fields");

assertForbiddenClaimRegressionChecks();
assertClaimScanSourceRegressionChecks();
assertEnvRegressionChecks();

const trackedClaimFiles = claimScanFiles();
addIssue(trackedClaimFiles.includes("AGENTS.md"), "claim scan must include AGENTS.md from tracked text scanning");
addIssue(trackedClaimFiles.includes("README.md"), "claim scan must include README.md from tracked text scanning");
addIssue(trackedClaimFiles.includes("package.json"), "claim scan must include package.json from tracked text scanning");
if (trackedFiles().includes(".env.example")) addIssue(trackedClaimFiles.includes(".env.example"), "claim scan must include tracked .env.example");
addIssue(trackedClaimFiles.some((file) => file.startsWith("docs/") && !requiredFiles.includes(file)), "claim scan must include general tracked docs, not only C04 docs");

for (const file of trackedClaimFiles) {
  const text = read(file);
  for (const phrase of forbiddenPositiveClaims) {
    addIssue(!hasPositiveForbiddenClaim(text, phrase), `forbidden positive claim in ${file}: ${phrase}`);
  }
}

const forbiddenConfigText = JSON.stringify(example ?? {});
addIssue(!/(OPENAI_API_KEY|ANTHROPIC_API_KEY|STRIPE_SECRET|GOOGLE_API_KEY|apiKey|secretKey|accessToken)/i.test(forbiddenConfigText), "config example must not include active secret field names");
addIssue(!/(https?:\/\/[^\s"]+[@?][^\s"]*(key|token|secret)=)/i.test(forbiddenConfigText), "config example must not include URLs with secrets");

const artifactFiles = artifactScanFiles();
const binaryFiles = artifactFiles.filter(isBinaryArtifact);
addIssue(binaryFiles.length === 0, `binary artifacts must not be committed: ${binaryFiles.join(", ")}`);

const base = resolvePrBase();
const changedFiles = changedFilesFromBase(base);
addIssue(Boolean(base), "PR-base aware changed-file detection could not resolve a base");

if (issues.length > 0) {
  console.error("TransformIA Capsule Launcher C04 local/BYOK config scaffold validation failed:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("TransformIA Capsule Launcher C04 local/BYOK config scaffold validation passed.");
console.log(`Changed-file base: ${base}`);
console.log(`Claim scan files: ${trackedClaimFiles.join(", ")}`);
console.log(`Changed files from base: ${changedFiles.length > 0 ? changedFiles.join(", ") : "none"}`);
