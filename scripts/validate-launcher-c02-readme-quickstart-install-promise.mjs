import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const issues = [];

const requiredFiles = [
  "README.md",
  "QUICKSTART.md",
  "AGENTS.md",
  "LICENSE.md",
  "NOTICE.md",
  "package.json",
  "docs/DAY_1_USER_JOURNEY.md",
  "docs/LOCAL_BYOK_QUICKSTART.md",
  "docs/GIF_PLACEHOLDER_PLAN.md",
  "docs/CLOUD_HANDOFF_BOUNDARY.md",
  "docs/README_BADGES_AND_DISCOVERY.md",
  "docs/release/TRANSFORMIA_CAPSULE_LAUNCHER_V0_6_C02_README_QUICKSTART_INSTALL_PROMISE_STATUS.md",
  "scripts/validate-bootstrap-context.mjs",
  "scripts/validate-launcher-public-repo-strategy.mjs",
  "scripts/validate-launcher-c02-readme-quickstart-install-promise.mjs",
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
const claimScanExactFiles = new Set([".gitignore", ".env.example"]);
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
  ["API", "key", "required", "now"].join(" "),
  [".env", "required", "now"].join(" "),
  ["real", "template", "download", "available"].join(" "),
  ["executable", "launcher", "included"].join(" "),
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

function claimScanFilesFromSources(tracked, fallbackFiles) {
  const source = tracked.length > 0 ? tracked : fallbackFiles;
  return source.filter(isTrackedTextFileForClaimScan);
}

function claimScanFiles() {
  const tracked = trackedFiles();
  return claimScanFilesFromSources(tracked, walk());
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
    "permission",
    "approved",
    "approval",
    "implying",
    "blocked badge posture",
    "boundary",
    "non-goal label",
    "forbidden label",
  ];
  return isBoundaryListFragment(line) || boundaryMarkers.some((marker) => lower.includes(marker));
}

function phrasePattern(phrase) {
  const regexSpecialChars = new Set([".", "*", "+", "?", "^", "$", "{", "}", "(", ")", "|", "[", "]", "\\"]);
  const escaped = phrase
    .split("")
    .map((char) => (regexSpecialChars.has(char) ? "\\" + char : char))
    .join("");
  return new RegExp(escaped, "i");
}

function hasPositiveForbiddenClaim(text, phrase) {
  const pattern = phrasePattern(phrase);
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
      text: `This launcher is ${phrase}.`,
      expected: true,
    },
    {
      name: "earlier-line negation does not exempt positive claim",
      text: `Not ${phrase}.\nThis launcher is ${phrase}.`,
      expected: true,
    },
    {
      name: "same-line negation passes",
      text: `This launcher is not ${phrase}.`,
      expected: false,
    },
    {
      name: "forbidden label passes",
      text: `Forbidden: ${phrase}.`,
      expected: false,
    },
    {
      name: "non-goal label passes",
      text: `Non-goal: ${phrase}.`,
      expected: false,
    },
  ];

  for (const testCase of cases) {
    const actual = hasPositiveForbiddenClaim(testCase.text, phrase);
    addIssue(actual === testCase.expected, `forbidden-claim regression failed: ${testCase.name}`);
  }
}

function assertClaimScanSourceRegressionChecks() {
  const syntheticFiles = claimScanFilesFromSources(["README.md"], ["tmp-review.md", "docs/untracked.md"]);
  addIssue(syntheticFiles.includes("README.md"), "claim-scan source regression failed: tracked README.md must be included");
  addIssue(!syntheticFiles.includes("tmp-review.md"), "claim-scan source regression failed: untracked tmp-review.md must be excluded when tracked files exist");

  const fallbackFiles = claimScanFilesFromSources([], ["README.md", "tmp-review.md"]);
  addIssue(fallbackFiles.includes("README.md"), "claim-scan fallback regression failed: fallback README.md must be included when git metadata is unavailable");
}

function assertIncludes(text, regex, message) {
  addIssue(regex.test(text), message);
}

function assertNotIncludes(text, regex, message) {
  addIssue(!regex.test(text), message);
}

for (const file of requiredFiles) addIssue(exists(file), `${file} must exist`);

const packageJson = exists("package.json") ? JSON.parse(read("package.json")) : {};
const scripts = packageJson.scripts || {};
const readme = exists("README.md") ? read("README.md") : "";
const quickstart = exists("QUICKSTART.md") ? read("QUICKSTART.md") : "";
const gifPlan = exists("docs/GIF_PLACEHOLDER_PLAN.md") ? read("docs/GIF_PLACEHOLDER_PLAN.md") : "";
const cloudBoundary = exists("docs/CLOUD_HANDOFF_BOUNDARY.md") ? read("docs/CLOUD_HANDOFF_BOUNDARY.md") : "";
const badgesDoc = exists("docs/README_BADGES_AND_DISCOVERY.md") ? read("docs/README_BADGES_AND_DISCOVERY.md") : "";
const localByok = exists("docs/LOCAL_BYOK_QUICKSTART.md") ? read("docs/LOCAL_BYOK_QUICKSTART.md") : "";
const statusDoc = exists("docs/release/TRANSFORMIA_CAPSULE_LAUNCHER_V0_6_C02_README_QUICKSTART_INSTALL_PROMISE_STATUS.md")
  ? read("docs/release/TRANSFORMIA_CAPSULE_LAUNCHER_V0_6_C02_README_QUICKSTART_INSTALL_PROMISE_STATUS.md")
  : "";
const validatorSource = exists("scripts/validate-launcher-c02-readme-quickstart-install-promise.mjs")
  ? read("scripts/validate-launcher-c02-readme-quickstart-install-promise.mjs")
  : "";

addIssue(packageJson.name === "transformia-capsule-launcher", "package name must remain transformia-capsule-launcher");
addIssue(packageJson.license === "SEE LICENSE IN LICENSE.md", "package license must remain SEE LICENSE IN LICENSE.md");
addIssue(
  scripts["validate:launcher-c02-readme-quickstart-install-promise"] === "node scripts/validate-launcher-c02-readme-quickstart-install-promise.mjs",
  "package script validate:launcher-c02-readme-quickstart-install-promise must exist",
);
addIssue(/validate:bootstrap-context/.test(scripts.quality || ""), "quality must include bootstrap validator");
addIssue(/validate:launcher-public-repo-strategy/.test(scripts.quality || ""), "quality must include C01 validator");
addIssue(/validate:launcher-c02-readme-quickstart-install-promise/.test(scripts.quality || ""), "quality must include C02 validator");

assertIncludes(readme, /# TransformIA Capsule Launcher/, "README must include hero title");
assertIncludes(readme, /v0\.6-C02/, "README must include v0.6-C02");
assertIncludes(readme, /npm run -s quality/, "README must include quickstart quality command");
assertIncludes(readme, /local\/BYOK/i, "README must include local/BYOK");
assertIncludes(readme, /control/i, "README must include control");
assertIncludes(readme, /source-available, not open source/i, "README must state source-available, not open source");
assertIncludes(readme, /TransformIA Cloud/i, "README must include TransformIA Cloud handoff");
assertIncludes(readme, /\[status: v0\.6-C0[2-9]\]/, "README must include static status badge");
assertIncludes(readme, /\[license: source-available\]/, "README must include static source-available badge");
assertIncludes(readme, /\[private core: not included\]/, "README must include private-core badge");
assertIncludes(readme, /\[installer: promise only\]/, "README must include installer promise badge");
assertIncludes(readme, /\[local\/BYOK: (planned path|config scaffold only)\]/, "README must include local/BYOK badge");
assertIncludes(readme, /v0\.6-C0[3-5][\s\S]*(feat\(templates\): add public Capsule template manifests|docs\(launch\): add Product Hunt, GitHub and X launch assets)/, "README must include Atlas PR progression");
assertNotIncludes(readme, /npm install/i, "README must not require npm install in quickstart");

assertIncludes(quickstart, /under 5 minutes/i, "QUICKSTART must say under 5 minutes");
assertIncludes(quickstart, /Git/i, "QUICKSTART must list Git");
assertIncludes(quickstart, /Node\.js 20\+/i, "QUICKSTART must list Node.js 20+");
assertIncludes(quickstart, /npm/i, "QUICKSTART must list npm");
assertIncludes(quickstart, /npm run -s quality/, "QUICKSTART must include quality command");
assertIncludes(quickstart, /v0\.6-C0[3-5][\s\S]*(feat\(templates\): add public Capsule template manifests|docs\(launch\): add Product Hunt, GitHub and X launch assets)/, "QUICKSTART must include Atlas PR progression");
assertNotIncludes(quickstart, /^\s*API[_ -]?KEY\s*=/im, "QUICKSTART must not include API key assignment");
assertNotIncludes(quickstart, /touch\s+\.env/i, "QUICKSTART must not create .env");
assertNotIncludes(quickstart, /cat\s+>\s*\.env/i, "QUICKSTART must not write .env");
assertNotIncludes(quickstart, /git clone .*runtime/i, "QUICKSTART must not clone private runtime");

assertIncludes(localByok, /user-owned keys/i, "local/BYOK doc must mention user-owned keys");
assertIncludes(localByok, /local control/i, "local/BYOK doc must mention local control");
assertIncludes(localByok, /C0[24] does not ask for API keys/i, "local/BYOK doc must say no API keys are requested");
assertIncludes(localByok, /C0[24] does not create (a real )?`.env`/i, "local/BYOK doc must say no real .env is created");
assertIncludes(localByok, /(C04 may add|C04 adds) a BYOK config scaffold/i, "local/BYOK doc must mention C04 scaffold");
assertIncludes(localByok, /No keys should ever be committed/i, "local/BYOK doc must say no keys should be committed");

assertIncludes(gifPlan, /No actual GIF is added in C02/i, "GIF doc must state no actual GIF in C02");
assertIncludes(gifPlan, /No binary assets are added in C02/i, "GIF doc must state no binary assets in C02");
assertIncludes(gifPlan, /No fake UI is added in C02/i, "GIF doc must state no fake UI in C02");
assertIncludes(gifPlan, /Clone the public repository/i, "GIF doc must include clone checklist");
assertIncludes(gifPlan, /Run repository validation/i, "GIF doc must include validation checklist");
assertIncludes(gifPlan, /local\/BYOK later/i, "GIF doc must include local/BYOK later checklist");
assertIncludes(gifPlan, /Cloud handoff later/i, "GIF doc must include Cloud handoff later checklist");

assertIncludes(cloudBoundary, /Cloud path will be documented in future PRs/i, "Cloud doc must state future PRs");
assertIncludes(cloudBoundary, /handoff, not implemented in this repo/i, "Cloud doc must state handoff is not implemented");
assertIncludes(cloudBoundary, /No Cloud auth/i, "Cloud doc must block Cloud auth");
assertIncludes(cloudBoundary, /No Cloud sync/i, "Cloud doc must block Cloud sync");
assertIncludes(cloudBoundary, /No payment/i, "Cloud doc must block payment");
assertIncludes(cloudBoundary, /No Stripe/i, "Cloud doc must block Stripe");
assertIncludes(cloudBoundary, /No customer portal/i, "Cloud doc must block customer portal");
assertIncludes(cloudBoundary, /No subscription/i, "Cloud doc must block subscription");
assertIncludes(cloudBoundary, /No tenant state/i, "Cloud doc must block tenant state");
assertIncludes(cloudBoundary, /No production connector execution/i, "Cloud doc must block production connector execution");

assertIncludes(badgesDoc, /Static status badge/i, "badges doc must allow static status badge");
assertIncludes(badgesDoc, /No fake CI badge/i, "badges doc must block fake CI badge");
assertIncludes(badgesDoc, /No fake build passing badge/i, "badges doc must block fake build badge");
assertIncludes(badgesDoc, /No fake download count/i, "badges doc must block fake download count");
assertIncludes(badgesDoc, /No fake version release/i, "badges doc must block fake version release");
assertIncludes(badgesDoc, /No production-ready claim/i, "badges doc must block production-ready claim");
assertIncludes(badgesDoc, /No open-source badge/i, "badges doc must block open-source badge");
assertIncludes(badgesDoc, /source-available badge/i, "badges doc must allow source-available badge");
assertIncludes(badgesDoc, /private-core-not-included badge/i, "badges doc must allow private-core-not-included badge");
assertIncludes(badgesDoc, /installer-promise-only badge/i, "badges doc must allow installer-promise-only badge");

assertIncludes(statusDoc, /C01 merged in PR #1/i, "status doc must include C01 PR #1");
assertIncludes(statusDoc, /1af8d7161284f9a89a0a6878ce3395163df6fefd/, "status doc must include C01 merge commit");
assertIncludes(statusDoc, /tracked text files/i, "status doc must include tracked text scan learning");
assertIncludes(statusDoc, /matching-line only/i, "status doc must include matching-line-only learning");
assertIncludes(statusDoc, /v0\.6-C03[\s\S]*feat\(templates\): add public Capsule template manifests/, "status doc must include next PR");

addIssue(!validatorSource.includes(["const", "filesForClaimScan", "=", "["].join(" ")), "validator must not use a hard-coded filesForClaimScan allowlist");
addIssue(validatorSource.includes("claimScanFiles"), "validator must define claimScanFiles");
addIssue(validatorSource.includes(["ls", "files"].join("-")), "validator must use git ls-files when available");
addIssue(!validatorSource.includes(["window", "Start"].join("")), "validator must not use context-window negation state");
addIssue(!validatorSource.includes(["lines", "slice(window", "Start"].join(".").replace(".Start", "Start")), ["validator must not inspect", "earlier", "lines for claim negation"].join(" "));
addIssue(!validatorSource.includes(["previous", "12", "lines"].join(" ")), "validator must not mention or implement prior 12-line context");
addIssue(!validatorSource.includes(["previous", "lines"].join(" ")), ["validator must not use", "earlier-line", "context for claim negation"].join(" "));
addIssue(!validatorSource.includes(["trackedTextFilesForClaimScan", "(repository", "Files())"].join("")), "claim scan must not use the legacy tracked-text repository source");
addIssue(!validatorSource.includes(["repository", "Files()"].join("")), "claim scan must not directly use the legacy repository file source");
addIssue(!validatorSource.includes(["[...", "trackedFiles(), ...", "walk()]"].join("")), "claim scan source must not combine tracked files and fallback walk for claims");
assertForbiddenClaimRegressionChecks();
assertClaimScanSourceRegressionChecks();

const trackedClaimFiles = claimScanFiles();
addIssue(trackedClaimFiles.includes("AGENTS.md"), "claim scan must include AGENTS.md from tracked text scanning");
addIssue(trackedClaimFiles.includes("LICENSE.md"), "claim scan must include LICENSE.md from tracked text scanning");
addIssue(trackedClaimFiles.includes("NOTICE.md"), "claim scan must include NOTICE.md from tracked text scanning");
addIssue(trackedClaimFiles.includes("README.md"), "claim scan must include README.md from tracked text scanning");
addIssue(trackedClaimFiles.includes("package.json"), "claim scan must include package.json from tracked text scanning");
addIssue(trackedClaimFiles.includes("docs/IP_AND_LICENSE_BOUNDARY.md"), "claim scan must include docs/IP_AND_LICENSE_BOUNDARY.md from tracked text scanning");
addIssue(trackedClaimFiles.some((file) => file.startsWith("templates/")), "claim scan must include templates tracked text files");
addIssue(trackedClaimFiles.some((file) => file.startsWith("docs/") && !requiredFiles.includes(file)), "claim scan must include future/general tracked docs, not only a fixed C02 docs allowlist");

for (const file of trackedClaimFiles) {
  const text = read(file);
  for (const phrase of forbiddenPositiveClaims) {
    addIssue(!hasPositiveForbiddenClaim(text, phrase), `forbidden positive claim in ${file}: ${phrase}`);
  }
}

const artifactFiles = artifactScanFiles();
const envFiles = artifactFiles.filter((file) => /(^|\/)\.env(\.|$)/.test(file) && file !== ".env.example");
addIssue(envFiles.length === 0, `.env file must not be committed: ${envFiles.join(", ")}`);
if (exists(".env.example")) {
  const envExample = read(".env.example");
  addIssue(envExample.includes("placeholder_only"), ".env.example must remain placeholder-only");
  addIssue(!/(OPENAI_API_KEY|ANTHROPIC_API_KEY|STRIPE_SECRET|GOOGLE_API_KEY|BEARER_TOKEN)/i.test(envExample), ".env.example must not contain active provider secret names");
  addIssue(!/(sk-[A-Za-z0-9_-]{16,}|xox[baprs]-|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16})/.test(envExample), ".env.example must not contain real secret-looking values");
}

const binaryFiles = artifactFiles.filter(isBinaryArtifact);
addIssue(binaryFiles.length === 0, `binary artifacts must not be committed: ${binaryFiles.join(", ")}`);

const base = resolvePrBase();
const changedFiles = changedFilesFromBase(base);
addIssue(Boolean(base), "PR-base aware changed-file detection could not resolve a base");

if (issues.length > 0) {
  console.error("TransformIA Capsule Launcher C02 README/quickstart/install-promise validation failed:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("TransformIA Capsule Launcher C02 README/quickstart/install-promise validation passed.");
console.log(`Changed-file base: ${base}`);
console.log(`Claim scan files: ${trackedClaimFiles.join(", ")}`);
console.log(`Changed files from base: ${changedFiles.length > 0 ? changedFiles.join(", ") : "none"}`);
