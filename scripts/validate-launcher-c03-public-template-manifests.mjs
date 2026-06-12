import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const issues = [];

const schemaVersion = "transformia-capsule-template-manifest.v0.6-c03";
const requiredSafetyFlags = [
  "noPrivateRuntime",
  "noConnectorExecution",
  "noCustomerData",
  "noSecrets",
  "noRegulatedAdvice",
  "noPayment",
  "noTelemetry",
  "manifestOnly",
];

const manifestFiles = [
  "templates/manifests/lead-intake-capsule.manifest.json",
  "templates/manifests/appointment-prep-capsule.manifest.json",
  "templates/manifests/faq-knowledge-capsule.manifest.json",
  "templates/manifests/evidence-value-review-capsule.manifest.json",
  "templates/manifests/local-byok-starter-capsule.manifest.json",
];

const requiredFiles = [
  "README.md",
  "templates/README.md",
  "templates/manifests/README.md",
  "templates/manifests/template-manifest.schema.json",
  ...manifestFiles,
  "docs/PUBLIC_TEMPLATE_MANIFEST_SCHEMA.md",
  "docs/TEMPLATE_MANIFEST_CATALOG.md",
  "docs/TEMPLATE_SAFETY_REVIEW_CHECKLIST.md",
  "docs/PUBLIC_TEMPLATES_BOUNDARY.md",
  "docs/release/TRANSFORMIA_CAPSULE_LAUNCHER_V0_6_C03_PUBLIC_TEMPLATE_MANIFESTS_STATUS.md",
  "scripts/validate-bootstrap-context.mjs",
  "scripts/validate-launcher-public-repo-strategy.mjs",
  "scripts/validate-launcher-c02-readme-quickstart-install-promise.mjs",
  "scripts/validate-launcher-c03-public-template-manifests.mjs",
  "package.json",
];

const binaryExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".pdf",
  ".docx",
  ".zip",
  ".ico",
  ".exe",
  ".dmg",
  ".pkg",
  ".tar",
  ".gz",
  ".tgz",
  ".7z",
]);

const excludedScanDirs = new Set([".git", "node_modules", "dist", "build", "coverage"]);
const claimScanExtensions = new Set([".md", ".txt", ".json", ".yml", ".yaml"]);
const claimScanExactFiles = new Set([".gitignore"]);
const claimScanExcludedFiles = new Set([
  "package-lock.json",
  "npm-shrinkwrap.json",
  "yarn.lock",
  "pnpm-lock.yaml",
]);

const forbiddenPositiveClaims = [
  ["active", "execution"].join(" "),
  ["run", "this", "template"].join(" "),
  ["execute", "this", "capsule"].join(" "),
  ["working", "template"].join(" "),
  ["production", "template"].join(" "),
  ["production", "ready"].join(" "),
  ["connector", "execution", "enabled"].join(" "),
  ["CRM", "integration", "active"].join(" "),
  ["WhatsApp", "send", "active"].join(" "),
  ["calendar", "booking", "active"].join(" "),
  ["chatbot", "live"].join(" "),
  ["API", "key", "required", "now"].join(" "),
  [".env", "required", "now"].join(" "),
  ["payment", "active"].join(" "),
  ["Stripe", "live"].join(" "),
  ["ROI", "guaranteed"].join(" "),
  ["compliance", "certified"].join(" "),
  ["open", "source"].join(" "),
  ["MIT", "license"].join(" "),
  ["free", "commercial", "use"].join(" "),
  ["private", "runtime", "included"].join(" "),
];

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
  const output = runGit(["ls-files"]);
  return output ? output.split(/\r?\n/).filter(Boolean) : [];
}

function claimScanFilesFromSources(tracked, fallbackFiles) {
  const source = tracked.length > 0 ? tracked : fallbackFiles;
  return source.filter(isTrackedTextFileForClaimScan);
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
    "manifest only",
    "manifest-only",
    "boundary",
    "approval",
    "approved",
    "unless",
    "excluded",
    "avoid",
    "implying",
  ];
  return isBoundaryListFragment(line) || boundaryMarkers.some((marker) => lower.includes(marker));
}

function hasPositiveForbiddenClaim(text, phrase) {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(escaped, "i");
  const lines = text.split(/\r?\n/);

  return lines.some((line) => {
    if (!pattern.test(line)) return false;
    return !isNegatedOrBoundaryLine(line);
  });
}

function assertForbiddenClaimRegressionChecks() {
  const phrase = ["production", "ready"].join(" ");
  const cases = [
    {
      name: "positive claim alone fails",
      text: ["TransformIA Capsule Launcher is", phrase + "."].join(" "),
      expected: true,
    },
    {
      name: "earlier-line negation does not exempt positive claim",
      text: [["No", "installer", "yet."].join(" "), "", ["TransformIA Capsule Launcher is", phrase + "."].join(" ")].join("\n"),
      expected: true,
    },
    {
      name: "same-line negation passes",
      text: ["TransformIA Capsule Launcher is not", phrase + "."].join(" "),
      expected: false,
    },
    {
      name: "forbidden label passes",
      text: ["Forbidden:", phrase + "."].join(" "),
      expected: false,
    },
  ];

  for (const item of cases) {
    const actual = hasPositiveForbiddenClaim(item.text, phrase);
    addIssue(actual === item.expected, `forbidden-claim regression failed: ${item.name}`);
  }
}

function assertClaimScanSourceRegressionChecks() {
  const tracked = ["README.md"];
  const fallback = ["tmp-review.md", "README.md"];
  const selected = claimScanFilesFromSources(tracked, fallback);
  addIssue(!selected.includes("tmp-review.md"), "untracked tmp-review.md synthetic example must not affect claim scan when tracked files exist");
  addIssue(selected.includes("README.md"), "tracked claim scan source must include tracked text files");
}

function assertIncludes(text, pattern, message) {
  addIssue(pattern.test(text), message);
}

function parseJson(path) {
  try {
    return JSON.parse(read(path));
  } catch (error) {
    issues.push(`${path} must parse as JSON: ${error.message}`);
    return null;
  }
}

for (const file of requiredFiles) addIssue(exists(file), `required file missing: ${file}`);

const packageJson = parseJson("package.json");
if (packageJson) {
  addIssue(packageJson.name === "transformia-capsule-launcher", "package name must remain transformia-capsule-launcher");
  addIssue(packageJson.license === "SEE LICENSE IN LICENSE.md", "package license must point to LICENSE.md");
  addIssue(
    packageJson.scripts?.["validate:launcher-c03-public-template-manifests"] === "node scripts/validate-launcher-c03-public-template-manifests.mjs",
    "package script validate:launcher-c03-public-template-manifests must exist",
  );
  const quality = packageJson.scripts?.quality || "";
  addIssue(quality.includes("validate:bootstrap-context"), "quality must include bootstrap validator");
  addIssue(quality.includes("validate:launcher-public-repo-strategy"), "quality must include C01 validator");
  addIssue(quality.includes("validate:launcher-c02-readme-quickstart-install-promise"), "quality must include C02 validator");
  addIssue(quality.includes("validate:launcher-c03-public-template-manifests"), "quality must include C03 validator");
}

const schema = parseJson("templates/manifests/template-manifest.schema.json");
if (schema) {
  addIssue(schema.properties?.schemaVersion?.const === schemaVersion, "schema must fix the C03 schemaVersion");
  addIssue(schema.properties?.publicSafe?.const === true, "schema must require publicSafe true");
  for (const flag of requiredSafetyFlags) {
    addIssue(schema.properties?.safetyFlags?.properties?.[flag]?.const === true, `schema must require safety flag ${flag}`);
  }
}

for (const file of manifestFiles) {
  const manifest = parseJson(file);
  if (!manifest) continue;
  const text = read(file).toLowerCase();

  addIssue(manifest.schemaVersion === schemaVersion, `${file} must use C03 schemaVersion`);
  addIssue(manifest.publicSafe === true, `${file} must set publicSafe true`);
  addIssue(manifest.status === "public_manifest_only", `${file} must use public_manifest_only status`);
  for (const flag of requiredSafetyFlags) {
    addIssue(manifest.safetyFlags?.[flag] === true, `${file} must set safety flag ${flag} true`);
  }

  addIssue(text.includes("no private runtime"), `${file} must say no private runtime`);
  addIssue(text.includes("no connector execution"), `${file} must say no connector execution`);
  addIssue(text.includes("no customer data"), `${file} must say no customer data`);
  addIssue(text.includes("no secrets"), `${file} must say no secrets`);
  addIssue(text.includes("no payment"), `${file} must say no payment`);
  addIssue(text.includes("not executable"), `${file} must say not executable`);
  addIssue(text.includes("manifest only") || text.includes("manifest-only"), `${file} must say manifest only`);
  addIssue(text.includes("no regulated advice"), `${file} must say no regulated advice`);
  addIssue(text.includes("no telemetry"), `${file} must say no telemetry`);
}

const readme = exists("README.md") ? read("README.md") : "";
const templatesReadme = exists("templates/README.md") ? read("templates/README.md") : "";
const manifestsReadme = exists("templates/manifests/README.md") ? read("templates/manifests/README.md") : "";
const catalog = exists("docs/TEMPLATE_MANIFEST_CATALOG.md") ? read("docs/TEMPLATE_MANIFEST_CATALOG.md") : "";
const schemaDoc = exists("docs/PUBLIC_TEMPLATE_MANIFEST_SCHEMA.md") ? read("docs/PUBLIC_TEMPLATE_MANIFEST_SCHEMA.md") : "";
const checklist = exists("docs/TEMPLATE_SAFETY_REVIEW_CHECKLIST.md") ? read("docs/TEMPLATE_SAFETY_REVIEW_CHECKLIST.md") : "";
const statusDoc = exists("docs/release/TRANSFORMIA_CAPSULE_LAUNCHER_V0_6_C03_PUBLIC_TEMPLATE_MANIFESTS_STATUS.md") ? read("docs/release/TRANSFORMIA_CAPSULE_LAUNCHER_V0_6_C03_PUBLIC_TEMPLATE_MANIFESTS_STATUS.md") : "";
const validatorSource = exists("scripts/validate-launcher-c03-public-template-manifests.mjs") ? read("scripts/validate-launcher-c03-public-template-manifests.mjs") : "";

assertIncludes(readme, /Public template manifests/i, "README must include Public template manifests section");
assertIncludes(readme, /docs\/TEMPLATE_MANIFEST_CATALOG\.md/, "README must link template manifest catalog");
assertIncludes(readme, /templates\/manifests\/README\.md/, "README must link manifests README");
assertIncludes(readme, /not executable/i, "README must say manifests are not executable");
assertIncludes(readme, /do not include customer data, secrets or prompts/i, "README must block customer data, secrets and prompts");

assertIncludes(templatesReadme, /templates\/manifests/i, "templates README must point to templates/manifests");
assertIncludes(templatesReadme, /no executable templates yet/i, "templates README must say no executable templates yet");
assertIncludes(templatesReadme, /no customer data/i, "templates README must say no customer data");
assertIncludes(templatesReadme, /no secrets/i, "templates README must say no secrets");
assertIncludes(templatesReadme, /no private runtime/i, "templates README must say no private runtime");

assertIncludes(manifestsReadme, /public manifest files only/i, "manifests README must say public manifest files only");
assertIncludes(manifestsReadme, /not executable templates/i, "manifests README must say not executable templates");
assertIncludes(manifestsReadme, /C03 does not ship a template runner/i, "manifests README must block template runner claims");
assertIncludes(manifestsReadme, /future launcher may render/i, "manifests README must mention future picker rendering");

assertIncludes(schemaDoc, /schema purpose|Purpose/i, "schema doc must document purpose");
assertIncludes(schemaDoc, /Manifest-only boundary/i, "schema doc must document manifest-only boundary");
assertIncludes(schemaDoc, /Forbidden data/i, "schema doc must document forbidden data");
assertIncludes(schemaDoc, /Relationship to private runtime/i, "schema doc must document private runtime relationship");
assertIncludes(schemaDoc, /Relationship to Cloud handoff/i, "schema doc must document Cloud handoff relationship");

for (const file of manifestFiles) {
  const id = file.split("/").pop().replace(".manifest.json", "");
  assertIncludes(catalog, new RegExp(id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `catalog must list ${id}`);
}
assertIncludes(catalog, /templateId/i, "catalog must include templateId");
assertIncludes(catalog, /businessJob/i, "catalog must include businessJob");
assertIncludes(catalog, /day1UserBenefit/i, "catalog must include day1UserBenefit");
assertIncludes(catalog, /Future implementation requirement/i, "catalog must include future implementation requirement");

for (const phrase of [
  "No PII",
  "No secrets",
  "No customer data",
  "No raw evidence",
  "No prompt text",
  "No private runtime code",
  "No connector payloads",
  "No regulated advice",
  "No payment claims",
  "No live execution claims",
  "No ROI guarantees",
  "No compliance certification",
  "Source-available/IP posture is preserved",
]) {
  assertIncludes(checklist, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), `checklist must include ${phrase}`);
}

assertIncludes(statusDoc, /C01 merged in PR #1/i, "status doc must include C01 inherited state");
assertIncludes(statusDoc, /C02 merged in PR #2/i, "status doc must include C02 inherited state");
assertIncludes(statusDoc, /v0\.6-C04[\s\S]*feat\(config\): add local\/BYOK config placeholder/, "status doc must include C04 next PR");

addIssue(!validatorSource.includes(["window", "Start"].join("")), "validator must not contain context-window state");
addIssue(!validatorSource.includes(["lines", "slice", "(", "window", "Start"].join("")), "validator must not inspect earlier lines for claim negation");
addIssue(!validatorSource.includes(["repository", "Files"].join("")), "claim scan source must not use legacy repo-file union");
addIssue(validatorSource.includes("claimScanFilesFromSources"), "validator must expose claimScanFilesFromSources regression path");
addIssue(validatorSource.includes(["ls", "files"].join("-")), "validator must use git ls-files when available");
assertForbiddenClaimRegressionChecks();
assertClaimScanSourceRegressionChecks();

const trackedClaimFiles = claimScanFiles();
addIssue(trackedClaimFiles.includes("AGENTS.md"), "claim scan must include AGENTS.md from tracked text scanning");
addIssue(trackedClaimFiles.includes("LICENSE.md"), "claim scan must include LICENSE.md from tracked text scanning");
addIssue(trackedClaimFiles.includes("NOTICE.md"), "claim scan must include NOTICE.md from tracked text scanning");
addIssue(trackedClaimFiles.includes("README.md"), "claim scan must include README.md from tracked text scanning");
addIssue(trackedClaimFiles.includes("package.json"), "claim scan must include package.json from tracked text scanning");
addIssue(trackedClaimFiles.includes("docs/IP_AND_LICENSE_BOUNDARY.md"), "claim scan must include docs/IP_AND_LICENSE_BOUNDARY.md from tracked text scanning");
addIssue(trackedClaimFiles.includes("docs/TEMPLATE_MANIFEST_CATALOG.md"), "claim scan must include C03 catalog after staging/tracking");
addIssue(trackedClaimFiles.some((file) => file.startsWith("templates/manifests/")), "claim scan must include C03 manifests after staging/tracking");

for (const file of trackedClaimFiles) {
  const text = read(file);
  for (const phrase of forbiddenPositiveClaims) {
    addIssue(!hasPositiveForbiddenClaim(text, phrase), `forbidden positive claim in ${file}: ${phrase}`);
  }
}

const artifactFiles = artifactScanFiles();
const envFiles = artifactFiles.filter((file) => /(^|\/)\.env(\.|$)/.test(file));
addIssue(envFiles.length === 0, `.env file must not be committed: ${envFiles.join(", ")}`);

const binaryFiles = artifactFiles.filter(isBinaryArtifact);
addIssue(binaryFiles.length === 0, `binary artifacts must not be committed: ${binaryFiles.join(", ")}`);

const base = resolvePrBase();
const changedFiles = changedFilesFromBase(base);
addIssue(Boolean(base), "PR-base aware changed-file detection could not resolve a base");
addIssue(changedFiles.includes("templates/manifests/template-manifest.schema.json"), "PR-base changed files must include manifest schema");
addIssue(changedFiles.includes("scripts/validate-launcher-c03-public-template-manifests.mjs"), "PR-base changed files must include C03 validator");

if (issues.length > 0) {
  console.error("TransformIA Capsule Launcher C03 public template manifests validation failed:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("TransformIA Capsule Launcher C03 public template manifests validation passed.");
console.log(`Changed-file base: ${base}`);
console.log(`Claim scan files: ${trackedClaimFiles.join(", ")}`);
console.log(`Changed files from base: ${changedFiles.length > 0 ? changedFiles.join(", ") : "none"}`);
