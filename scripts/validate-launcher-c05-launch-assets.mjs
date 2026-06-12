import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const issues = [];

const requiredFiles = [
  "launch/README.md",
  "launch/product-hunt-draft.md",
  "launch/github-launch-copy.md",
  "launch/x-launch-thread.md",
  "launch/linkedin-founder-post.md",
  "launch/demo-narrative.md",
  "launch/launch-checklist.md",
  "launch/claim-safe-messaging-matrix.md",
  "docs/LAUNCH_ASSETS_BOUNDARY.md",
  "docs/release/TRANSFORMIA_CAPSULE_LAUNCHER_V0_6_C05_LAUNCH_ASSETS_STATUS.md",
  "scripts/validate-launcher-c05-launch-assets.mjs",
  "package.json",
  "README.md",
];

const launchAssetFiles = [
  "launch/README.md",
  "launch/product-hunt-draft.md",
  "launch/github-launch-copy.md",
  "launch/x-launch-thread.md",
  "launch/linkedin-founder-post.md",
  "launch/demo-narrative.md",
  "launch/launch-checklist.md",
  "launch/claim-safe-messaging-matrix.md",
  "docs/LAUNCH_ASSETS_BOUNDARY.md",
  "docs/release/TRANSFORMIA_CAPSULE_LAUNCHER_V0_6_C05_LAUNCH_ASSETS_STATUS.md",
];

const binaryExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf", ".docx", ".zip", ".ico", ".exe", ".dmg", ".pkg", ".tar", ".gz", ".tgz", ".7z"]);
const excludedScanDirs = new Set([".git", "node_modules", "dist", "build", "coverage"]);
const claimScanExtensions = new Set([".md", ".txt", ".json", ".yml", ".yaml"]);
const claimScanExactFiles = new Set([".gitignore", ".env.example"]);
const claimScanExcludedFiles = new Set(["package-lock.json", "npm-shrinkwrap.json", "yarn.lock", "pnpm-lock.yaml"]);

const forbiddenPositiveClaims = [
  "This launcher is production ready",
  "This repo is open source",
  "Run BYOK capsules today",
  "Provider is configured",
  "Templates are executable",
  "Stripe live",
  "run capsules locally today",
  "executable launcher is available",
  "one-click installer",
  "active local/BYOK execution",
  "API keys supported today",
  "Cloud sync is active",
  "payment/Stripe is active",
  "payment is active",
  "private runtime included",
  "connector execution enabled",
  "customer portal active",
  "subscription active",
  "free commercial use",
  "live chatbot",
  "runnable templates",
];

const forbiddenPositiveClaimPatterns = [
  /\bproduction[-\s]ready\b/i,
  /\bproduction\s+readiness\s+(?:is\s+)?(?:proven|guaranteed|certified)\b/i,
  /\bopen\s+source\b/i,
  /\bfree\s+commercial\s+use\b/i,
  /\brun\s+(?:byok\s+)?capsules?\s+(?:locally\s+)?today\b/i,
  /\b(?:local|byok)\s+capsule\s+execution\s+(?:is\s+)?(?:active|enabled|available)\b/i,
  /\bexecutable\s+launcher\s+(?:is\s+)?(?:available|included|ready)\b/i,
  /\b(?:install|download)\s+the\s+launcher\b/i,
  /\bone[-\s]click\s+(?:setup|installer|install)\b/i,
  /\bproviders?\s+(?:is|are)\s+configured\b/i,
  /\bbyok\s+provider\s+(?:is\s+)?configured\b/i,
  /\bapi\s+keys?\s+(?:are\s+)?supported\s+today\b/i,
  /\bcloud\s+sync\s+(?:is\s+)?active\b/i,
  /\b(?:payment|stripe)\s+(?:is\s+)?active\b/i,
  /\bstripe\s+live\b/i,
  /\bprivate\s+runtime\s+included\b/i,
  /\btemplates?\s+(?:is|are)\s+executable\b/i,
  /\bconnector\s+execution\s+(?:is\s+)?enabled\b/i,
  /\bcustomer\s+portal\s+(?:is\s+)?active\b/i,
  /\bsubscription\s+(?:is\s+)?active\b/i,
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

function splitGitLines(output) {
  return output ? output.split(/\r?\n/).filter(Boolean) : [];
}

function trackedFiles() {
  return splitGitLines(runGit(["ls-files"]));
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
  const committed = splitGitLines(runGit(["diff", "--name-only", `${base}...HEAD`]));
  const workspace = splitGitLines(runGit(["diff", "--name-only", base]));
  return [...new Set([...committed, ...workspace])].sort();
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
    "future",
    "draft",
    "disabled",
    "approval",
    "boundary",
    "implying",
    "out of scope",
  ];
  return isBoundaryListFragment(line) || boundaryMarkers.some((marker) => lower.includes(marker));
}

function hasPositiveForbiddenClaim(text, phrase) {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return hasPositiveForbiddenClaimPattern(text, new RegExp(escaped, "i"));
}

function hasPositiveForbiddenClaimPattern(text, pattern) {
  return text.split(/\r?\n/).some((line) => pattern.test(line) && !isNegatedOrBoundaryLine(line));
}

function hasAnyPositiveForbiddenClaim(text) {
  return forbiddenPositiveClaims.some((phrase) => hasPositiveForbiddenClaim(text, phrase)) || forbiddenPositiveClaimPatterns.some((pattern) => hasPositiveForbiddenClaimPattern(text, pattern));
}

function hasUrlShortenerOrTracking(text) {
  return text.split(/\r?\n/).some((line) => {
    if (isNegatedOrBoundaryLine(line)) return false;
    return /https?:\/\/(?:bit\.ly|t\.co|tinyurl\.com|goo\.gl|ow\.ly|buff\.ly|rebrand\.ly|cutt\.ly|lnkd\.in)\b/i.test(line) || /[?&](?:utm_[a-z0-9_]+|fbclid|gclid|mc_cid|mc_eid)=/i.test(line);
  });
}

function hasAnalyticsOrTrackingPixel(text) {
  return text.split(/\r?\n/).some((line) => {
    if (isNegatedOrBoundaryLine(line)) return false;
    return /\b(?:analytics|tracking\s+pixel|pixel\s+tracking|google\s+analytics|posthog|segment|mixpanel|plausible|gtag|gtm)\b/i.test(line);
  });
}

function assertForbiddenClaimRegressionChecks() {
  const cases = [
    ["This launcher is production ready.", true],
    ["This repo is open source.", true],
    ["Run BYOK capsules today.", true],
    ["Provider is configured.", true],
    ["Templates are executable.", true],
    ["Stripe live.", true],
    ["This launcher is not production ready.", false],
    ["This repo is source-available, not open source.", false],
    ["Do not say: Run BYOK capsules today.", false],
    ["No provider is configured.", false],
    ["Templates are not executable.", false],
    ["No Stripe live flow exists.", false],
    [["This launcher is not production ready.", "This launcher is production ready."].join("\n"), true],
  ];

  for (const [text, shouldFail] of cases) {
    const detected = hasAnyPositiveForbiddenClaim(text);
    addIssue(detected === shouldFail, `forbidden-claim regression failed for ${JSON.stringify(text)}: expected ${shouldFail ? "forbidden" : "allowed"}`);
  }

  const selected = claimScanFilesFromSources(["README.md"], ["tmp-review.md", "docs/untracked.md"]);
  addIssue(selected.length === 1 && selected[0] === "README.md", "tracked claim scan must ignore untracked scratch files when tracked files exist");
  const fallback = claimScanFilesFromSources([], ["README.md", "tmp-review.md"]);
  addIssue(fallback.includes("README.md") && fallback.includes("tmp-review.md"), "claim scan fallback must work without tracked files");
}

function validateRequiredFiles() {
  for (const file of requiredFiles) addIssue(exists(file), `${file} must exist`);
}

function validatePackage() {
  const pkg = parseJson("package.json");
  if (!pkg) return;
  addIssue(pkg.name === "transformia-capsule-launcher", "package name must remain transformia-capsule-launcher");
  addIssue(pkg.license === "SEE LICENSE IN LICENSE.md", "package license must remain SEE LICENSE IN LICENSE.md");
  addIssue(pkg.scripts?.["validate:launcher-c05-launch-assets"] === "node scripts/validate-launcher-c05-launch-assets.mjs", "package script validate:launcher-c05-launch-assets must exist");
  const quality = pkg.scripts?.quality ?? "";
  for (const script of [
    "validate:bootstrap-context",
    "validate:launcher-public-repo-strategy",
    "validate:launcher-c02-readme-quickstart-install-promise",
    "validate:launcher-c03-public-template-manifests",
    "validate:launcher-c04-local-byok-config-scaffold",
    "validate:launcher-c05-launch-assets",
  ]) {
    addIssue(quality.includes(`npm run -s ${script}`), `quality must include ${script}`);
  }
}

function validateContent() {
  const readme = read("README.md");
  addIssue(readme.includes("launch/README.md"), "README must link launch/README.md");
  addIssue(readme.includes("No launch has been executed by this repository"), "README must say no launch has been executed");

  const launchReadme = read("launch/README.md");
  for (const required of ["copy drafts only", "No paid campaign", "No Product Hunt submission", "No posting to X or LinkedIn", "No analytics", "No tracking", "No external network calls", "No private TransformIA runtime"]) {
    addIssue(launchReadme.includes(required), `launch/README.md must include ${required}`);
  }

  const productHunt = read("launch/product-hunt-draft.md");
  for (const required of ["TransformIA Capsule Launcher", "A public source-available launcher surface for future local/BYOK governed AI work capsules.", "## Short description", "## Problem", "## What exists today", "## What does not exist yet", "## Audience", "## First comment draft by founder", "## Makers notes", "## FAQ", "## Launch checklist"]) {
    addIssue(productHunt.includes(required), `product-hunt draft must include ${required}`);
  }

  const github = read("launch/github-launch-copy.md");
  for (const required of ["## Repo short description", "## GitHub About text suggestion", "## README hero copy", "## Pinned repo description", "## Release note draft", "## Issue templates future note", "## Stars/watch/fork CTA"]) {
    addIssue(github.includes(required), `github launch copy must include ${required}`);
  }

  const xThread = read("launch/x-launch-thread.md");
  const postCount = (xThread.match(/^## Post \d+/gm) ?? []).length;
  addIssue(postCount >= 7 && postCount <= 10, "X thread must contain 7-10 posts");
  for (const required of ["[GitHub repo link]", "source-available", "local/BYOK", "template manifest", "config scaffold", "private runtime", "Stars, issues"]) {
    addIssue(xThread.toLowerCase().includes(required.toLowerCase()), `X thread must include ${required}`);
  }

  const linkedin = read("launch/linkedin-founder-post.md");
  for (const required of ["public repository", "template manifest catalog", "local/BYOK", "private TransformIA runtime remains private", "builders, operators, SMEs", "source-available"]) {
    addIssue(linkedin.includes(required), `LinkedIn post must include ${required}`);
  }

  const demo = read("launch/demo-narrative.md");
  for (const required of ["60-90 second demo narrative", "not a real execution script", "Show the TransformIA Capsule Launcher README", "npm run -s quality", "template manifest", "local/BYOK config scaffold", "private runtime remains private", "Cloud handoff"] ) {
    addIssue(demo.toLowerCase().includes(required.toLowerCase()), `demo narrative must include ${required}`);
  }

  const checklist = read("launch/launch-checklist.md");
  for (const required of ["## Pre-launch", "Verify validators", "Verify license/IP", "Verify no secrets", "Verify no false claims", "Verify C04 is merged", "Verify GitHub description", "Verify repo topics", "## Launch", "Product Hunt draft review", "## Post-launch", "prepare C06 web CTA", "do not merge external contributions without IP review"] ) {
    addIssue(checklist.toLowerCase().includes(required.toLowerCase()), `launch checklist must include ${required}`);
  }

  const matrix = read("launch/claim-safe-messaging-matrix.md");
  addIssue(matrix.includes("Allowed claim | Safer wording | Forbidden stronger version | Why"), "claim-safe matrix must include required table headers");
  for (const required of ["local/BYOK", "templates", "Config scaffold", "Install promise", "Cloud handoff", "Source-available", "Private core", "Validation", "Execution", "Provider config", "Payment", "Production readiness", "run BYOK capsules today", "templates are executable", "open source"]) {
    addIssue(matrix.toLowerCase().includes(required.toLowerCase()), `claim-safe matrix must cover ${required}`);
  }

  const boundary = read("docs/LAUNCH_ASSETS_BOUNDARY.md");
  for (const required of ["draft launch assets", "No auto-posting", "No external submission", "No Product Hunt submission performed", "No analytics", "No tracking", "No paid ads", "No claim escalation", "source-available", "Private core remains private", "Claim review checklist"]) {
    addIssue(boundary.includes(required), `launch assets boundary must include ${required}`);
  }

  const status = read("docs/release/TRANSFORMIA_CAPSULE_LAUNCHER_V0_6_C05_LAUNCH_ASSETS_STATUS.md");
  for (const required of ["C01 merged", "C02 merged", "C03 merged", "C04 merged", "public repo strategy exists", "quickstart", "Public-safe template manifests exist", "local/BYOK config scaffold exists", "## Purpose", "## What this PR adds", "## What this PR does not add", "## Safety boundaries", "## IP/license boundaries", "## Validation", "## Known P1/P2 learnings applied", "v0.6-C06", "feat(web): add download and launcher CTA surface"]) {
    addIssue(status.includes(required), `C05 status doc must include ${required}`);
  }
}

function validateClaims() {
  for (const file of launchAssetFiles) {
    const text = read(file);
    for (const phrase of forbiddenPositiveClaims) addIssue(!hasPositiveForbiddenClaim(text, phrase), `forbidden positive launch claim in ${file}: ${phrase}`);
    for (const pattern of forbiddenPositiveClaimPatterns) addIssue(!hasPositiveForbiddenClaimPattern(text, pattern), `forbidden positive launch claim in ${file}: ${pattern}`);
    addIssue(!hasUrlShortenerOrTracking(text), `${file} must not include URL shorteners or tracking parameters`);
    addIssue(!hasAnalyticsOrTrackingPixel(text), `${file} must not include active analytics/tracking pixel claims`);
  }

  for (const file of claimScanFiles()) {
    const text = read(file);
    for (const phrase of forbiddenPositiveClaims) addIssue(!hasPositiveForbiddenClaim(text, phrase), `forbidden positive repository claim in ${file}: ${phrase}`);
    for (const pattern of forbiddenPositiveClaimPatterns) addIssue(!hasPositiveForbiddenClaimPattern(text, pattern), `forbidden positive repository claim in ${file}: ${pattern}`);
  }
}

function validateArtifacts() {
  const files = artifactScanFiles();
  for (const file of files) {
    addIssue(!isBinaryArtifact(file), `binary asset must not be committed or staged: ${file}`);
    addIssue(file === ".env.example" || !/(^|\/)\.env(\.|$)/.test(file), `real .env files are forbidden: ${file}`);
  }
}

function validateLicenseNoticeUnchanged() {
  const changed = changedFilesFromBase(resolvePrBase());
  addIssue(!changed.includes("LICENSE.md"), "LICENSE.md must remain unchanged in C05");
  addIssue(!changed.includes("NOTICE.md"), "NOTICE.md must remain unchanged in C05");
}

function validateValidatorGuardrails() {
  const source = read("scripts/validate-launcher-c05-launch-assets.mjs");
  addIssue(source.includes("claimScanFilesFromSources"), "validator must expose claim scan source regression path");
  addIssue(source.includes("trackedFiles()"), "validator must use tracked files for normal claim scan");
  const earlierLineContextPhrase = ["previous-line", "context"].join(" ");
  const diffNoveltyPhrase = ["diff-specific", "novelty"].join(" ");
  const c05AllowlistPhrase = ["C05-only", "docs", "allowlist"].join(" ");
  addIssue(!source.includes(earlierLineContextPhrase), "validator must not use earlier-line context windows for negation");
  addIssue(!source.includes(diffNoveltyPhrase), "validator must not use PR-diff novelty checks inside quality");
  addIssue(!source.includes(c05AllowlistPhrase), "validator must not use a hard-coded C05 docs-only allowlist for global claim scan");
}

validateRequiredFiles();
validatePackage();
validateContent();
validateClaims();
validateArtifacts();
validateLicenseNoticeUnchanged();
validateValidatorGuardrails();
assertForbiddenClaimRegressionChecks();

if (issues.length) {
  console.error("C05 launch assets validation failed:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("C05 launch assets validation passed.");
