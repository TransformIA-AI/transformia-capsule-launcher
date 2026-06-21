import { existsSync, readFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { join } from 'node:path';
const root = process.cwd(); const errors = [];
const required = ['src/activation/saas-activation-pack-handoff.ts','src/activation/saas-activation-pack-writer.ts','src/activation/fixtures/case-zero-saas-activation.fixture.ts','src/activation/__tests__/saas-activation-pack-handoff.test.ts','docs/v0.9/SAAS_ACTIVATION_PACK_HANDOFF_L01.md','docs/v0.9/V0_9_FREEZE_CANDIDATE.md'];
const helpers = ['buildCaseZeroActivationIntentFixture','buildDefaultSaaSActivationIntent','validateActivationIntent','buildOrganizationWorkspaceDraft','buildPlanTrialDraft','buildByokReadinessDraft','buildCommissioningChecklist','buildSaaSActivationPack','validateSaaSActivationPack','toPublicSaaSActivationPackSummary','buildV09FreezeCandidateSummary','buildActivationPackFileManifest','computeActivationPackFingerprint','computeStableChecksum'];
const statuses = ['draft_received','validation_failed','review_required','ready_for_operator_review','blocked_invalid_scope','blocked_sensitive_input','blocked_missing_human_review','blocked_byok_secret_material','blocked_region_assumption','blocked_unsupported_plan','blocked_quarantined_route','freeze_candidate_ready'];
const quarantined = ['/case-zero','/pilot','/cockpit','/connectors','/private','/demo/cockpit','/demo/flujo','/portal-vivo'];
const forbidden = [/fetch\s*\(/i,/axios/i,/stripe/i,/supabase/i,/firebase/i,/auth0/i,/postgres|mysql|mongodb/i,/analytics/i,/crm/i,/hubspot|salesforce/i,/process\.env/i,/sk_live_/i,/ghp_[A-Za-z0-9_]{20,}/i,/@[a-z0-9.-]+\.[a-z]{2,}/i];
function fail(m){ errors.push(m); } function read(p){ return readFileSync(join(root,p),'utf8'); } function exists(p){ return existsSync(join(root,p)); }
for (const f of required) if (!exists(f)) fail(`missing required file: ${f}`);
const domain = exists(required[0]) ? read(required[0]) : ''; const writer = exists(required[1]) ? read(required[1]) : ''; const docs = ['docs/v0.9/SAAS_ACTIVATION_PACK_HANDOFF_L01.md','docs/v0.9/V0_9_FREEZE_CANDIDATE.md'].filter(exists).map(read).join('\n');
for (const h of helpers) if (!domain.includes(`export function ${h}`)) fail(`missing exported helper: ${h}`);
for (const s of statuses) if (!domain.includes(s)) fail(`missing status: ${s}`);
for (const r of quarantined) if (!domain.includes(r)) fail(`missing blocked route: ${r}`);
for (const name of ['toPublicSaaSActivationPackSummary','buildV09FreezeCandidateSummary','computeStableChecksum','computeActivationPackFingerprint']) if (!domain.includes(name)) fail(`missing required helper reference: ${name}`);
if (!domain.includes("pack.byokReadinessDraft.readinessStatus.startsWith('blocked_')") || !domain.includes('blockers.push(pack.byokReadinessDraft.readinessStatus)')) fail('blocked BYOK readiness must create a validation blocker.');
if (!domain.includes("pack.validationReport.ok === true ? 'freeze_candidate_ready' : 'freeze_blocked'")) fail('freeze candidate summary must use validationReport.ok, not blocker count alone.');
if (!domain.includes("pack.validationReport = validateSaaSActivationPack(pack); pack.publicSafeSummary = toPublicSaaSActivationPackSummary(pack); pack.fingerprint = computeActivationPackFingerprint(pack)")) fail('buildSaaSActivationPack must compute summary after final validation and fingerprint last.');
const caseZeroNoteMatch = domain.match(/buildCaseZeroActivationIntentFixture[\s\S]*?notesPublicSafe: '([^']+)'/);
if (!caseZeroNoteMatch) fail('Case Zero fixture note missing.');
else if (/credential|secret|token|key|password|provider/i.test(caseZeroNoteMatch[1])) fail('Case Zero fixture note contains sensitive vocabulary.');

if (!writer.includes('relative(root, target)') || !writer.includes('blocked_path_traversal') || !writer.includes('buildActivationPackFileManifest')) fail('writer must normalize path, block traversal and use allowed manifest.');
const packageJson = JSON.parse(read('package.json'));
if (packageJson.scripts?.['validate:v09-saas-activation-pack-handoff'] !== 'node scripts/validate-v09-saas-activation-pack-handoff.mjs') fail('package script missing for L01 validator.');
if (!packageJson.scripts?.quality?.includes('validate:v09-saas-activation-pack-handoff')) fail('quality must include L01 validator.');
for (const [i, pattern] of forbidden.entries()) if (pattern.test(domain + writer)) fail(`forbidden activation surface pattern ${i}: ${pattern}`);
if (/production[- ]ready/i.test(docs)) fail('docs contain unsafe production-ready wording.');
function git(args){ const r = spawnSync('git', args, { cwd: root, encoding: 'utf8' }); return r.status === 0 ? r.stdout.trim().split(/\r?\n/).filter(Boolean) : []; }
function baseCandidates(){ const out = []; for (const k of ['PR_BASE_SHA','GITHUB_BASE_SHA','BASE_SHA']) if (process.env[k]) out.push(process.env[k]); if (process.env.GITHUB_EVENT_PATH && existsSync(process.env.GITHUB_EVENT_PATH)) { try { const e = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')); if (e.pull_request?.base?.sha) out.push(e.pull_request.base.sha); if (e.pull_request?.base?.ref) out.push(`origin/${e.pull_request.base.ref}`); } catch {} } if (process.env.GITHUB_BASE_REF) out.push(`origin/${process.env.GITHUB_BASE_REF}`); out.push('origin/main','main','HEAD^'); return out; }
let changed = new Set(); for (const b of baseCandidates()) { let files = git(['diff','--name-only',`${b}...HEAD`]); if (!files.length) files = git(['diff','--name-only',`${b}..HEAD`]); if (files.length) { files.forEach(f=>changed.add(f.replaceAll('\\','/'))); break; } }
for (const args of [['diff','--name-only'],['diff','--name-only','--cached'],['ls-files','--others','--exclude-standard']]) git(args).forEach(f=>changed.add(f.replaceAll('\\','/')));
if (!changed.size) fail('changed-file guard found no files; validator must inspect real changed files.');
for (const file of changed) { if (!exists(file) || file.includes('node_modules/') || file.startsWith('scripts/validate-v0-') || file.includes('validate-v09-') || file.includes('__tests__/')) continue; const text = read(file); if (/fetch\s*\(|axios|stripe|auth0|supabase|firebase|postgres|mysql|mongodb|process\.env/i.test(text)) fail(`changed file introduces forbidden surface: ${file}`); if (/sk_live_|ghp_[A-Za-z0-9_]{20,}|BEGIN PRIVATE KEY/i.test(text)) fail(`changed file contains secret-shaped material: ${file}`); if (/\/(case-zero|pilot|cockpit|connectors|private|portal-vivo)\b/.test(text) && !file.includes('saas-activation-pack-handoff') && !file.includes('validate-v09-saas')) fail(`changed file mentions quarantined route as possible target: ${file}`); }
if (errors.length) { console.error(errors.map(e=>`- ${e}`).join('\n')); process.exit(1); }
console.log('v0.9-L01 SaaS activation pack handoff validator passed.');
