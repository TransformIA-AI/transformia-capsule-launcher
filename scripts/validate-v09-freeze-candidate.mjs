import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
const root = process.cwd(); const errors = []; const read = (p) => readFileSync(join(root,p),'utf8'); const exists = (p) => existsSync(join(root,p)); const fail = (m) => errors.push(m);
for (const f of ['scripts/validate-v09-saas-activation-pack-handoff.mjs','docs/v0.9/V0_9_FREEZE_CANDIDATE.md','docs/v0.9/SAAS_ACTIVATION_PACK_HANDOFF_L01.md','src/activation/saas-activation-pack-handoff.ts','src/activation/fixtures/case-zero-saas-activation.fixture.ts']) if (!exists(f)) fail(`missing freeze candidate dependency: ${f}`);
const pkg = JSON.parse(read('package.json'));
for (const s of ['validate:v09-saas-activation-pack-handoff','validate:v09-freeze-candidate']) if (!pkg.scripts?.[s]) fail(`package script missing: ${s}`);
const l01 = spawnSync('node', ['scripts/validate-v09-saas-activation-pack-handoff.mjs'], { cwd: root, encoding: 'utf8' }); if (l01.status !== 0) fail(`L01 validator does not pass conceptually: ${l01.stderr || l01.stdout}`);

const domain = exists('src/activation/saas-activation-pack-handoff.ts') ? read('src/activation/saas-activation-pack-handoff.ts') : '';
if (!domain.includes("pack.validationReport.ok === true ? 'freeze_candidate_ready' : 'freeze_blocked'")) fail('freeze candidate builder must block validationReport.ok false packs.');
if (!domain.includes("pack.validationReport = validateSaaSActivationPack(pack); pack.publicSafeSummary = toPublicSaaSActivationPackSummary(pack); pack.fingerprint = computeActivationPackFingerprint(pack)")) fail('activation pack summary must be based on final validation report.');
if (!domain.includes("pack.byokReadinessDraft.readinessStatus.startsWith('blocked_')")) fail('blocked BYOK readiness must fail pack validation.');
const all = ['src/activation/saas-activation-pack-handoff.ts','src/activation/saas-activation-pack-writer.ts','docs/v0.9/V0_9_FREEZE_CANDIDATE.md','docs/v0.9/SAAS_ACTIVATION_PACK_HANDOFF_L01.md'].filter(exists).map(read).join('\n');
for (const p of [/fetch\s*\(/i,/axios/i,/stripe/i,/auth0|supabase|firebase/i,/postgres|mysql|mongodb/i,/process\.env/i]) if (p.test(all)) fail(`freeze candidate forbidden surface: ${p}`);
const doc = exists('docs/v0.9/V0_9_FREEZE_CANDIDATE.md') ? read('docs/v0.9/V0_9_FREEZE_CANDIDATE.md') : '';
for (const phrase of ['Web W01-W05, Runtime B01-B05 and Launcher L01 evidence','Final freeze happens after merge and post-merge cross-repo smoke/evidence','No live execution is introduced','No provider connection is introduced','No payment/auth integration is introduced']) if (!doc.includes(phrase)) fail(`freeze doc missing phrase: ${phrase}`);
if (!all.includes('publicSafe: true') || !all.includes('freeze_candidate_ready')) fail('generated or fixture activation pack public-safe/freeze evidence missing.');
if (errors.length) { console.error(errors.map(e=>`- ${e}`).join('\n')); process.exit(1); }
console.log('v0.9 launcher freeze-candidate validator passed.');
