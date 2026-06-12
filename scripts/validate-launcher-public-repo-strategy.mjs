import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const issues = [];

const requiredFiles = [
  "README.md",
  "AGENTS.md",
  "LICENSE.md",
  "NOTICE.md",
  "package.json",
  "scripts/validate-bootstrap-context.mjs",
  "scripts/validate-launcher-public-repo-strategy.mjs",
  "docs/LAUNCHER_PUBLIC_REPO_STRATEGY.md",
  "docs/PRIVATE_CORE_BOUNDARY.md",
  "docs/PUBLIC_TEMPLATES_BOUNDARY.md",
  "docs/INSTALL_PROMISE_BOUNDARY.md",
  "docs/release/TRANSFORMIA_CAPSULE_LAUNCHER_V0_6_C01_PUBLIC_REPO_STRATEGY_STATUS.md",
  "docs/IP_AND_LICENSE_BOUNDARY.md",
  "templates/README.md",
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
  ["production", "ready"].join(" "),
  ["one-click", "installer", "active"].join(" "),
  ["installer", "available", "now"].join(" "),
  ["binary", "download", "available", "now"].join(" "),
  ["payment", "active"].join(" "),
  ["Stripe", "live"].join(" "),
  ["customer", "portal", "active"].join(" "),
  ["subscription", "active"].join(" "),
  ["cloud", "sync", "active"].join(" "),
  ["private", "runtime", "included"].join(" "),
  ["live", "connector", "execution", "enabled"].join(" "),
  ["open", "source"].join(" "),
  ["MIT", "license"].join(" "),
  ["Apache-2.0", "license"].join(" "),
  ["public", "domain"].join(" "),
  ["free", "commercial", "use"].join(" "),
  ["white-label", "allowed"].join(" "),
  ["SaaS", "use", "allowed"].join(" "),
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

function changedFilesFromBase(base) {
  if (!base) return [];
  const output = runGit(["diff", "--name-only", `${base}...HEAD`]);
  return output ? output.split(/\r?\n/).filter(Boolean) : [];
}

function trackedFiles() {
  const output = runGit(["ls-files"]);
  return output ? output.split(/\r?\n/).filter(Boolean) : [];
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

function trackedTextFilesForClaimScan(repoFiles) {
  return repoFiles.filter(isTrackedTextFileForClaimScan);
}

function isNegatedOrBoundaryLine(lines, index) {
  const windowStart = Math.max(0, index - 12);
  const context = lines.slice(windowStart, index + 1).join("\n").toLowerCase();
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
    "permission",
    "approved",
    "approval",
    "implying",
  ];
  return boundaryMarkers.some((marker) => context.includes(marker));
}

function hasPositiveForbiddenClaim(text, phrase) {
  const regexSpecialChars = new Set([".", "*", "+", "?", "^", "$", "{", "}", "(", ")", "|", "[", "]", "\\"]);
  const escaped = phrase
    .split("")
    .map((char) => (regexSpecialChars.has(char) ? "\\" + char : char))
    .join("");
  const pattern = new RegExp(escaped, "i");
  const lines = text.split(/\r?\n/);

  return lines.some((line, index) => {
    if (!pattern.test(line)) return false;
    return !isNegatedOrBoundaryLine(lines, index);
  });
}

for (const file of requiredFiles) addIssue(exists(file), `required file missing: ${file}`);

const pkg = exists("package.json") ? JSON.parse(read("package.json")) : {};
const readme = exists("README.md") ? read("README.md") : "";
const strategy = exists("docs/LAUNCHER_PUBLIC_REPO_STRATEGY.md") ? read("docs/LAUNCHER_PUBLIC_REPO_STRATEGY.md") : "";
const privateCore = exists("docs/PRIVATE_CORE_BOUNDARY.md") ? read("docs/PRIVATE_CORE_BOUNDARY.md") : "";
const templates = exists("docs/PUBLIC_TEMPLATES_BOUNDARY.md") ? read("docs/PUBLIC_TEMPLATES_BOUNDARY.md") : "";
const install = exists("docs/INSTALL_PROMISE_BOUNDARY.md") ? read("docs/INSTALL_PROMISE_BOUNDARY.md") : "";
const status = exists("docs/release/TRANSFORMIA_CAPSULE_LAUNCHER_V0_6_C01_PUBLIC_REPO_STRATEGY_STATUS.md") ? read("docs/release/TRANSFORMIA_CAPSULE_LAUNCHER_V0_6_C01_PUBLIC_REPO_STRATEGY_STATUS.md") : "";
const ipBoundary = exists("docs/IP_AND_LICENSE_BOUNDARY.md") ? read("docs/IP_AND_LICENSE_BOUNDARY.md") : "";
const license = exists("LICENSE.md") ? read("LICENSE.md") : "";
const notice = exists("NOTICE.md") ? read("NOTICE.md") : "";
const validatorSource = exists("scripts/validate-launcher-public-repo-strategy.mjs") ? read("scripts/validate-launcher-public-repo-strategy.mjs") : "";
const repoFiles = trackedFiles().length > 0 ? trackedFiles() : walk();
const filesForClaimScan = trackedTextFilesForClaimScan(repoFiles);

addIssue(pkg.name === "transformia-capsule-launcher", "package.json name must remain transformia-capsule-launcher");
addIssue(pkg.license === "SEE LICENSE IN LICENSE.md", "package.json license must remain SEE LICENSE IN LICENSE.md");
addIssue(Boolean(pkg.scripts?.["validate:bootstrap-context"]), "package.json must include validate:bootstrap-context");
addIssue(Boolean(pkg.scripts?.["validate:launcher-public-repo-strategy"]), "package.json must include validate:launcher-public-repo-strategy");
addIssue(
  pkg.scripts?.quality === "npm run -s validate:bootstrap-context && npm run -s validate:launcher-public-repo-strategy",
  "package.json quality must run bootstrap and C01 validator"
);

addIssue(readme.includes("TransformIA Capsule Launcher"), "README must contain TransformIA Capsule Launcher");
addIssue(/private runtime\/core is not included/i.test(readme), "README must state private runtime/core is not included");
addIssue(/v0\.6-C01/.test(readme), "README must include v0.6-C01");
addIssue(/v0\.6-C02/.test(readme), "README must include v0.6-C02 next PR");

addIssue(/launcher is distribution, not core/i.test(strategy), "strategy doc must say launcher is distribution, not core");
addIssue(/public templates are separate from private runtime/i.test(strategy), "strategy doc must say public templates are separate from private runtime");
addIssue(/source-available, not open source/i.test(strategy), "strategy doc must preserve source-available posture");

addIssue(/private runtime source/i.test(privateCore), "private core boundary must block private runtime source");
addIssue(/secrets/i.test(privateCore), "private core boundary must block secrets");
addIssue(/private repo clone instructions/i.test(privateCore), "private core boundary must block private repo clone instructions");

addIssue(/no PII/i.test(templates), "public templates boundary must block PII");
addIssue(/no customer data/i.test(templates), "public templates boundary must block customer data");
addIssue(/no secrets/i.test(templates), "public templates boundary must block secrets");
addIssue(/C01 only defines the template boundary/i.test(templates), "public templates boundary must state C01 only defines boundary");

addIssue(/C01 does not ship an installer/i.test(install), "install promise boundary must say C01 does not ship installer");
addIssue(/no binary release/i.test(install), "install promise boundary must say no binary release in C01");

addIssue(/v0\.6-C01/.test(status), "status doc must include v0.6-C01");
addIssue(/v0\.6-C02/.test(status), "status doc must include v0.6-C02");
addIssue(/B07 web billing portal link posture merged/i.test(status), "status doc must include inherited B07 state");

addIssue(/public source-available, not open source/i.test(ipBoundary), "license/IP boundary must remain source-available, not open source");
addIssue(/Source-Available Evaluation License/i.test(license), "LICENSE must preserve source-available evaluation posture");
addIssue(/public source-available/i.test(notice), "NOTICE must preserve public source-available posture");
addIssue(exists("LICENSE.md"), "LICENSE.md must exist");
addIssue(exists("NOTICE.md"), "NOTICE.md must exist");
addIssue(exists("docs/IP_AND_LICENSE_BOUNDARY.md"), "docs/IP_AND_LICENSE_BOUNDARY.md must exist");

addIssue(!validatorSource.includes(["const", "filesForClaimScan", "=", "["].join(" ")), "validator must not use a hard-coded filesForClaimScan allowlist");
addIssue(validatorSource.includes("trackedTextFilesForClaimScan"), "validator must define trackedTextFilesForClaimScan");
addIssue(validatorSource.includes(["ls", "files"].join("-")), "validator must use git ls-files when available");
addIssue(filesForClaimScan.includes("AGENTS.md"), "claim scan must include AGENTS.md from tracked text scanning");
addIssue(filesForClaimScan.includes("LICENSE.md"), "claim scan must include LICENSE.md from tracked text scanning");
addIssue(filesForClaimScan.includes("NOTICE.md"), "claim scan must include NOTICE.md from tracked text scanning");
addIssue(filesForClaimScan.includes("docs/IP_AND_LICENSE_BOUNDARY.md"), "claim scan must include docs/IP_AND_LICENSE_BOUNDARY.md from tracked text scanning");
addIssue(filesForClaimScan.some((file) => file.startsWith("docs/") && !requiredFiles.includes(file)), "claim scan must include future/general tracked docs, not only a fixed C01 docs allowlist");

for (const file of filesForClaimScan) {
  const text = read(file);
  for (const phrase of forbiddenPositiveClaims) {
    addIssue(!hasPositiveForbiddenClaim(text, phrase), `forbidden positive claim in ${file}: ${phrase}`);
  }
}

const envFiles = repoFiles.filter((file) => /(^|\/)\.env(\.|$)/.test(file));
addIssue(envFiles.length === 0, `.env file must not be committed: ${envFiles.join(", ")}`);

const binaryFiles = repoFiles.filter(isBinaryArtifact);
addIssue(binaryFiles.length === 0, `binary artifacts must not be committed: ${binaryFiles.join(", ")}`);

const base = resolvePrBase();
const changedFiles = changedFilesFromBase(base);
addIssue(Boolean(base), "PR-base aware changed-file detection could not resolve a base");

if (issues.length > 0) {
  console.error("TransformIA Capsule Launcher C01 strategy validation failed:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("TransformIA Capsule Launcher C01 strategy validation passed.");
console.log(`Changed-file base: ${base}`);
console.log(`Claim scan files: ${filesForClaimScan.join(", ")}`);
console.log(`Changed files from base: ${changedFiles.length > 0 ? changedFiles.join(", ") : "none"}`);
