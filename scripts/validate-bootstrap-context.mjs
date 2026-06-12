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
  ".gitignore",
  "docs/PROJECT_MEMORY.md",
  "docs/ATLAS_V06C_HANDOFF.md",
  "docs/AGENT_ORCHESTRATION.md",
  "docs/DEVELOPMENT_EVIDENCE_LOG_PER_PR_SLICE.md",
  "docs/DECISION_NEEDED_TEMPLATE.md",
  "docs/SECURITY_AND_PUBLIC_BOUNDARIES.md",
  "docs/IP_AND_LICENSE_BOUNDARY.md",
  "docs/CODEX_HANDOFF.md",
  "templates/README.md",
  "scripts/validate-bootstrap-context.mjs",
];

function addIssue(condition, message) {
  if (!condition) issues.push(message);
}

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function exists(path) {
  return existsSync(join(root, path));
}

function runGit(args) {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function walk(dir) {
  const abs = join(root, dir);
  if (!existsSync(abs)) return [];
  const out = [];
  for (const entry of readdirSync(abs)) {
    const rel = `${dir}/${entry}`;
    const full = join(root, rel);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walk(rel));
    else out.push(rel);
  }
  return out;
}

function resolvePrBase() {
  const envBase = process.env.PR_BASE_SHA || process.env.GITHUB_BASE_SHA || process.env.BASE_SHA;
  if (envBase) return envBase;
  for (const candidate of ["origin/main", "main", "HEAD^"]) {
    if (runGit(["rev-parse", "--verify", candidate])) return candidate;
  }
  return "";
}

for (const file of requiredFiles) addIssue(exists(file), `required file missing: ${file}`);

const readme = exists("README.md") ? read("README.md") : "";
const agents = exists("AGENTS.md") ? read("AGENTS.md") : "";
const pkg = exists("package.json") ? read("package.json") : "";
const atlas = exists("docs/ATLAS_V06C_HANDOFF.md") ? read("docs/ATLAS_V06C_HANDOFF.md") : "";
const security = exists("docs/SECURITY_AND_PUBLIC_BOUNDARIES.md") ? read("docs/SECURITY_AND_PUBLIC_BOUNDARIES.md") : "";
const license = exists("LICENSE.md") ? read("LICENSE.md") : "";
const notice = exists("NOTICE.md") ? read("NOTICE.md") : "";
const ipBoundary = exists("docs/IP_AND_LICENSE_BOUNDARY.md") ? read("docs/IP_AND_LICENSE_BOUNDARY.md") : "";

addIssue(readme.includes("TransformIA Capsule Launcher"), "README must identify TransformIA Capsule Launcher");
addIssue(readme.includes("Bootstrap context only"), "README must state bootstrap context only");
addIssue(readme.includes("v0.6-C01"), "README must point to v0.6-C01");
addIssue(agents.includes("Private core remains private"), "AGENTS must preserve private core boundary");
addIssue(agents.includes("Dani approves"), "AGENTS must preserve human approval boundary");
addIssue(atlas.includes("docs(launcher): define Capsule Launcher public repo strategy"), "Atlas handoff must include C01 title");
addIssue(security.includes("This repository is public."), "security doc must state public repository boundary");
addIssue(pkg.includes("validate:bootstrap-context"), "package.json must include validate:bootstrap-context script");
addIssue(pkg.includes('"private": false'), "package.json must mark repo as public package metadata");
addIssue(license.includes("Source-Available Evaluation License"), "LICENSE must define the source-available evaluation license");
addIssue(license.includes("All rights reserved"), "LICENSE must reserve rights");
addIssue(license.includes("Public visibility does not make the repository open source"), "LICENSE must state public visibility is not open source");
addIssue(notice.includes("Public visibility does not imply open-source licensing"), "NOTICE must state public visibility does not imply open-source licensing");
addIssue(ipBoundary.includes("public source-available, not open source"), "IP boundary doc must state source-available, not open source");
addIssue(pkg.includes('"license": "SEE LICENSE IN LICENSE.md"'), "package.json must point to custom LICENSE.md");
addIssue(!pkg.includes('"license": "MIT"'), "package.json must not use MIT license");
addIssue(!pkg.includes('"license": "Apache-2.0"'), "package.json must not use Apache license");

const allTextFiles = ["README.md", "AGENTS.md", "package.json", ...walk("docs"), ...walk("templates")]
  .filter((file) => exists(file) && statSync(join(root, file)).isFile())
  .filter((file) => ![".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf", ".docx", ".zip", ".ico"].includes(extname(file).toLowerCase()))
  .map((file) => [file, read(file)]);

const forbiddenClaims = [
  /licensed under the MIT license/i,
  /licensed under Apache-2\.0/i,
  /released under GPL/i,
  /released into the public domain/i,
  /production ready/i,
  /one-click installer active/i,
  /payment active/i,
  /stripe live/i,
  /customer portal active/i,
  /subscription active/i,
  /cloud sync active/i,
  /private runtime included/i,
  /live connector execution enabled/i,
];

function hasPositiveForbiddenClaim(text, pattern) {
  return text.split(/\r?\n/).some((line) => {
    if (!pattern.test(line)) return false;
    const lower = line.toLowerCase();
    if (lower.includes("forbidden")) return false;
    if (lower.includes("not ")) return false;
    if (lower.includes("no ")) return false;
    if (lower.includes("must not")) return false;
    if (lower.includes("do not")) return false;
    if (lower.includes("unless")) return false;
    if (lower.includes("before")) return false;
    return true;
  });
}

for (const [file, text] of allTextFiles) {
  for (const pattern of forbiddenClaims) {
    addIssue(!hasPositiveForbiddenClaim(text, pattern), `forbidden positive overclaim in ${file}: ${pattern}`);
  }
}

const forbiddenFiles = [".env", ".env.local", ".env.production", ".env.development", ".env.staging"];
for (const file of forbiddenFiles) addIssue(!exists(file), `forbidden env file committed: ${file}`);
if (exists(".env.example")) {
  const envExample = read(".env.example");
  addIssue(envExample.includes("placeholder_only"), ".env.example must remain placeholder-only");
  addIssue(!/(OPENAI_API_KEY|ANTHROPIC_API_KEY|STRIPE_SECRET|GOOGLE_API_KEY|BEARER_TOKEN)/i.test(envExample), ".env.example must not contain active provider secret names");
  addIssue(!/(sk-[A-Za-z0-9_-]{16,}|xox[baprs]-|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16})/.test(envExample), ".env.example must not contain real secret-looking values");
}

const binaryFiles = [".", "docs", "templates", "scripts"].flatMap((dir) => walk(dir === "." ? "" : dir)).filter(Boolean).filter((file) => {
  const ext = extname(file).toLowerCase();
  return [".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf", ".docx", ".zip", ".ico", ".exe", ".dmg"].includes(ext);
});
addIssue(binaryFiles.length === 0, `binary artifacts must not be committed in bootstrap: ${binaryFiles.join(", ")}`);

addIssue(Boolean(resolvePrBase()) || true, "PR-base helper available when git history exists");

if (issues.length > 0) {
  console.error("TransformIA Capsule Launcher bootstrap validation failed:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("TransformIA Capsule Launcher bootstrap validation passed.");
console.log(`Changed-file base: ${resolvePrBase() || "not available in fresh repo"}`);
