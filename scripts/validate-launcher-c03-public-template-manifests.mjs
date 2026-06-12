import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const issues = [];

const schemaVersion = "transformia-capsule-template-manifest.v0.6-c03";
const requiredTopLevelFields = [
  "schemaVersion",
  "templateId",
  "slug",
  "displayName",
  "status",
  "category",
  "targetUser",
  "businessJob",
  "valueHypothesis",
  "day1UserBenefit",
  "inputs",
  "outputs",
  "runtimeBoundary",
  "connectorBoundary",
  "dataBoundary",
  "complianceBoundary",
  "ipBoundary",
  "cloudHandoffBoundary",
  "localByokBoundary",
  "safetyFlags",
  "futureImplementationNotes",
  "publicSafe",
];
const requiredInputFields = ["publicSafeExamples", "forbiddenData"];
const requiredOutputFields = ["publicSafeOutputs", "nonGoals"];
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
const allowedCategories = new Set([
  "lead_intake",
  "appointment_prep",
  "knowledge_faq",
  "evidence_value_review",
  "local_byok_starter",
]);

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

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function addContractIssue(contractIssues, condition, message) {
  if (!condition) contractIssues.push(message);
}

function compareLists(label, actual, expected) {
  const actualList = Array.isArray(actual) ? actual : [];
  const missing = expected.filter((field) => !actualList.includes(field));
  const unexpected = actualList.filter((field) => !expected.includes(field));
  addIssue(missing.length === 0, `${label} missing expected fields: ${missing.join(", ")}`);
  addIssue(unexpected.length === 0, `${label} has unvalidated schema-required fields: ${unexpected.join(", ")}`);
}

function requireString(contractIssues, file, manifest, field, minLength) {
  const value = manifest?.[field];
  addContractIssue(contractIssues, typeof value === "string", `${file} field ${field} must be a string`);
  if (typeof value === "string") {
    addContractIssue(contractIssues, value.trim().length >= minLength, `${file} field ${field} must be at least ${minLength} characters`);
  }
}

function requireStringArray(contractIssues, file, owner, field) {
  const value = owner?.[field];
  addContractIssue(contractIssues, Array.isArray(value), `${file} field ${field} must be an array`);
  if (Array.isArray(value)) {
    addContractIssue(contractIssues, value.length > 0, `${file} field ${field} must not be empty`);
    for (const [index, item] of value.entries()) {
      addContractIssue(
        contractIssues,
        typeof item === "string" && item.trim().length > 0,
        `${file} field ${field}[${index}] must be a non-empty string`,
      );
    }
  }
}

function assertAllowedProperties(contractIssues, file, objectName, value, allowedFields) {
  if (!isPlainObject(value)) return;
  const extra = Object.keys(value).filter((field) => !allowedFields.includes(field));
  addContractIssue(contractIssues, extra.length === 0, `${file} ${objectName} has unexpected properties: ${extra.join(", ")}`);
}

function joinedText(value) {
  if (Array.isArray(value)) return value.join(" ").toLowerCase();
  if (typeof value === "string") return value.toLowerCase();
  return "";
}

function mentions(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function validateManifestContract(file, manifest) {
  const contractIssues = [];
  addContractIssue(contractIssues, isPlainObject(manifest), `${file} manifest must be an object`);
  if (!isPlainObject(manifest)) return contractIssues;

  for (const field of requiredTopLevelFields) {
    addContractIssue(contractIssues, Object.hasOwn(manifest, field), `${file} missing required field ${field}`);
  }
  assertAllowedProperties(contractIssues, file, "manifest", manifest, requiredTopLevelFields);

  addContractIssue(contractIssues, manifest.schemaVersion === schemaVersion, `${file} schemaVersion must equal ${schemaVersion}`);
  addContractIssue(
    contractIssues,
    typeof manifest.templateId === "string" && /^tpl_[a-z0-9_]+$/.test(manifest.templateId),
    `${file} templateId must match /^tpl_[a-z0-9_]+$/`,
  );
  addContractIssue(
    contractIssues,
    typeof manifest.slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manifest.slug),
    `${file} slug must match /^[a-z0-9]+(?:-[a-z0-9]+)*$/`,
  );
  requireString(contractIssues, file, manifest, "displayName", 3);
  addContractIssue(contractIssues, manifest.status === "public_manifest_only", `${file} status must be public_manifest_only`);
  addContractIssue(contractIssues, allowedCategories.has(manifest.category), `${file} category must be one of the allowed C03 categories`);
  requireString(contractIssues, file, manifest, "targetUser", 8);
  requireString(contractIssues, file, manifest, "businessJob", 12);
  requireString(contractIssues, file, manifest, "valueHypothesis", 12);
  requireString(contractIssues, file, manifest, "day1UserBenefit", 12);

  addContractIssue(contractIssues, isPlainObject(manifest.inputs), `${file} inputs must be an object`);
  if (isPlainObject(manifest.inputs)) {
    for (const field of requiredInputFields) addContractIssue(contractIssues, Object.hasOwn(manifest.inputs, field), `${file} inputs missing required field ${field}`);
    assertAllowedProperties(contractIssues, file, "inputs", manifest.inputs, requiredInputFields);
    requireStringArray(contractIssues, file, manifest.inputs, "publicSafeExamples");
    requireStringArray(contractIssues, file, manifest.inputs, "forbiddenData");
  }

  addContractIssue(contractIssues, isPlainObject(manifest.outputs), `${file} outputs must be an object`);
  if (isPlainObject(manifest.outputs)) {
    for (const field of requiredOutputFields) addContractIssue(contractIssues, Object.hasOwn(manifest.outputs, field), `${file} outputs missing required field ${field}`);
    assertAllowedProperties(contractIssues, file, "outputs", manifest.outputs, requiredOutputFields);
    requireStringArray(contractIssues, file, manifest.outputs, "publicSafeOutputs");
    requireStringArray(contractIssues, file, manifest.outputs, "nonGoals");
  }

  for (const field of [
    "runtimeBoundary",
    "connectorBoundary",
    "dataBoundary",
    "complianceBoundary",
    "ipBoundary",
    "cloudHandoffBoundary",
    "localByokBoundary",
  ]) {
    requireString(contractIssues, file, manifest, field, 12);
  }

  addContractIssue(contractIssues, isPlainObject(manifest.safetyFlags), `${file} safetyFlags must be an object`);
  if (isPlainObject(manifest.safetyFlags)) {
    for (const flag of requiredSafetyFlags) {
      addContractIssue(contractIssues, Object.hasOwn(manifest.safetyFlags, flag), `${file} safetyFlags missing required field ${flag}`);
      addContractIssue(contractIssues, manifest.safetyFlags[flag] === true, `${file} safetyFlags.${flag} must be true`);
    }
    assertAllowedProperties(contractIssues, file, "safetyFlags", manifest.safetyFlags, requiredSafetyFlags);
  }

  requireStringArray(contractIssues, file, manifest, "futureImplementationNotes");
  addContractIssue(contractIssues, manifest.publicSafe === true, `${file} publicSafe must be true`);

  const forbiddenDataText = joinedText(manifest.inputs?.forbiddenData);
  const nonGoalsBoundaryText = joinedText([
    ...(manifest.outputs?.nonGoals || []),
    manifest.runtimeBoundary,
    manifest.connectorBoundary,
    manifest.dataBoundary,
    manifest.complianceBoundary,
    ...(manifest.futureImplementationNotes || []),
  ]);
  const runtimeText = joinedText(manifest.runtimeBoundary);
  const connectorText = joinedText(manifest.connectorBoundary);
  const dataText = joinedText(manifest.dataBoundary);
  const complianceText = joinedText(manifest.complianceBoundary);
  const ipText = joinedText(manifest.ipBoundary);
  const cloudText = joinedText(manifest.cloudHandoffBoundary);
  const localByokText = joinedText(manifest.localByokBoundary);

  addContractIssue(contractIssues, mentions(forbiddenDataText, [/no customer data/, /customer data/]), `${file} inputs.forbiddenData must reference no customer data`);
  addContractIssue(contractIssues, mentions(forbiddenDataText, [/no pii/, /personal identifiers?/, /email|phone|dni/]), `${file} inputs.forbiddenData must reference no PII`);
  addContractIssue(contractIssues, mentions(forbiddenDataText, [/no secrets?/, /api key/, /provider key/]), `${file} inputs.forbiddenData must reference no secrets`);
  addContractIssue(contractIssues, mentions(forbiddenDataText, [/no (private )?prompts?/, /no prompt text/, /prompt text/]), `${file} inputs.forbiddenData must reference no prompts`);
  addContractIssue(contractIssues, mentions(forbiddenDataText, [/no connector payloads?/, /connector payload/, /calendar payload/]), `${file} inputs.forbiddenData must reference no connector payloads`);

  addContractIssue(contractIssues, mentions(nonGoalsBoundaryText, [/not executable/, /no execution/, /no live execution/]), `${file} outputs.nonGoals or boundaries must reference not executable or no execution`);
  addContractIssue(contractIssues, mentions(nonGoalsBoundaryText, [/no connector execution/]), `${file} outputs.nonGoals or boundaries must reference no connector execution`);
  addContractIssue(contractIssues, mentions(nonGoalsBoundaryText, [/no payment/]) || manifest.safetyFlags?.noPayment === true, `${file} outputs.nonGoals or boundaries must reference no payment`);
  addContractIssue(contractIssues, mentions(nonGoalsBoundaryText, [/no regulated advice/]), `${file} outputs.nonGoals or boundaries must reference no regulated advice`);
  addContractIssue(contractIssues, mentions(runtimeText, [/no private runtime/]), `${file} runtimeBoundary must mention no private runtime`);
  addContractIssue(contractIssues, mentions(connectorText, [/no connector execution/]), `${file} connectorBoundary must mention no connector execution`);
  addContractIssue(contractIssues, mentions(dataText, [/no customer data/]) && mentions(dataText, [/no secrets?/]), `${file} dataBoundary must mention no customer data and no secrets`);
  addContractIssue(
    contractIssues,
    mentions(complianceText, [/no regulated advice/]) && mentions(complianceText, [/no compliance certification/, /no guarantee/, /roi guarantee/]),
    `${file} complianceBoundary must mention no regulated advice and no compliance certification or guarantee`,
  );
  addContractIssue(contractIssues, mentions(ipText, [/source-available/, /license boundary/]), `${file} ipBoundary must mention source-available or license boundary`);
  addContractIssue(contractIssues, mentions(cloudText, [/future cloud handoff/, /not implemented/, /future cloud/]), `${file} cloudHandoffBoundary must mention future Cloud handoff or not implemented`);
  addContractIssue(
    contractIssues,
    mentions(localByokText, [/future/, /planned/, /local\/byok/]) && mentions(localByokText, [/no api keys?/, /no keys?/, /not requested/, /no keys committed/]),
    `${file} localByokBoundary must mention future/planned/local BYOK and no keys committed or requested`,
  );

  return contractIssues;
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function validSyntheticManifest() {
  return {
    schemaVersion,
    templateId: "tpl_synthetic_manifest",
    slug: "synthetic-manifest",
    displayName: "Synthetic Manifest",
    status: "public_manifest_only",
    category: "lead_intake",
    targetUser: "Synthetic reviewer",
    businessJob: "Validate contract behavior safely.",
    valueHypothesis: "A synthetic manifest can prove validator behavior without temp files.",
    day1UserBenefit: "Reviewers can trust required field validation coverage.",
    inputs: {
      publicSafeExamples: ["Generic public-safe example"],
      forbiddenData: ["No PII, no customer data, no secrets, no prompt text and no connector payloads"],
    },
    outputs: {
      publicSafeOutputs: ["Reviewable public-safe output"],
      nonGoals: ["Not executable, no execution, no connector execution, no payment and no regulated advice"],
    },
    runtimeBoundary: "No private runtime is included in this manifest.",
    connectorBoundary: "No connector execution is included in this manifest.",
    dataBoundary: "No customer data and no secrets are included.",
    complianceBoundary: "No regulated advice and no compliance certification or guarantee is provided.",
    ipBoundary: "The source-available license boundary remains preserved.",
    cloudHandoffBoundary: "Future Cloud handoff is not implemented here.",
    localByokBoundary: "Future local/BYOK setup is planned and no API keys are requested.",
    safetyFlags: {
      noPrivateRuntime: true,
      noConnectorExecution: true,
      noCustomerData: true,
      noSecrets: true,
      noRegulatedAdvice: true,
      noPayment: true,
      noTelemetry: true,
      manifestOnly: true,
    },
    futureImplementationNotes: ["Future implementation requires approved boundaries."],
    publicSafe: true,
  };
}

function assertManifestContractRegressionChecks() {
  const base = validSyntheticManifest();
  addIssue(validateManifestContract("synthetic-valid", base).length === 0, "synthetic valid manifest must pass contract validation");

  const cases = [
    ["delete businessJob", (manifest) => delete manifest.businessJob],
    ["delete inputs.forbiddenData", (manifest) => delete manifest.inputs.forbiddenData],
    ["delete outputs.nonGoals", (manifest) => delete manifest.outputs.nonGoals],
    ["delete localByokBoundary", (manifest) => delete manifest.localByokBoundary],
    ["set publicSafe false", (manifest) => { manifest.publicSafe = false; }],
    ["set safetyFlags.noPayment false", (manifest) => { manifest.safetyFlags.noPayment = false; }],
    ["add unexpected top-level field", (manifest) => { manifest.unexpected = true; }],
    ["add unexpected inputs field", (manifest) => { manifest.inputs.unexpected = true; }],
    ["add unexpected outputs field", (manifest) => { manifest.outputs.unexpected = true; }],
    ["add unexpected safetyFlags field", (manifest) => { manifest.safetyFlags.unexpected = true; }],
    ["use invalid templateId", (manifest) => { manifest.templateId = "bad-template"; }],
    ["use invalid slug", (manifest) => { manifest.slug = "Bad_Slug"; }],
    ["use empty futureImplementationNotes", (manifest) => { manifest.futureImplementationNotes = []; }],
  ];

  for (const [name, mutate] of cases) {
    const candidate = cloneJson(base);
    mutate(candidate);
    addIssue(validateManifestContract(`synthetic-${name}`, candidate).length > 0, `manifest contract regression failed: ${name}`);
  }
}

function assertSchemaValidatorRequiredFieldAlignment(schema) {
  if (!schema) return;
  compareLists("schema top-level required fields", schema.required, requiredTopLevelFields);
  compareLists("schema inputs required fields", schema.properties?.inputs?.required, requiredInputFields);
  compareLists("schema outputs required fields", schema.properties?.outputs?.required, requiredOutputFields);
  compareLists("schema safetyFlags required fields", schema.properties?.safetyFlags?.required, requiredSafetyFlags);
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
  assertSchemaValidatorRequiredFieldAlignment(schema);
}

const parsedManifests = new Map();
for (const file of manifestFiles) {
  const manifest = parseJson(file);
  if (!manifest) continue;
  parsedManifests.set(file, manifest);
  for (const issue of validateManifestContract(file, manifest)) issues.push(issue);
}
assertManifestContractRegressionChecks();

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
  const slugFromFile = file.split("/").pop().replace(".manifest.json", "");
  const escapedSlug = slugFromFile.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assertIncludes(catalog, new RegExp(escapedSlug), `catalog must list ${slugFromFile}`);
  addIssue(manifestsReadme.includes("*.manifest.json") || manifestsReadme.includes(slugFromFile), `manifests README must make ${slugFromFile} discoverable`);

  const manifest = parsedManifests.get(file);
  if (manifest) {
    for (const [label, value] of [
      ["templateId", manifest.templateId],
      ["slug", manifest.slug],
      ["category", manifest.category],
      ["displayName", manifest.displayName],
    ]) {
      const escaped = String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      assertIncludes(catalog, new RegExp(escaped), `catalog must include ${label} for ${file}`);
    }
  }
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
assertIncludes(statusDoc, /validates every manifest against all required schema fields/i, "status doc must mention C03 P2 validator feedback");
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
