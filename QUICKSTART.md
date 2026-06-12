# Quickstart: TransformIA Capsule Launcher v0.6-C04

This quickstart is the day-1 path for a public visitor to clone and validate the launcher repository in under 5 minutes.

## Prerequisites

- Git.
- Node.js 20+ or compatible modern Node.
- npm.

No API key is required now. No real `.env` credential file is required now. No private runtime clone is required.

## 1. Clone the public repository

```bash
git clone https://github.com/TransformIA-AI/transformia-capsule-launcher.git
cd transformia-capsule-launcher
```

Expected time: under 1 minute on a typical developer machine.

## 2. Validate the repository

```bash
npm run -s quality
```

Expected time: under 5 minutes total for clone plus validation.

This runs the bootstrap validator, the C01 public repo strategy validator, the C02 README/quickstart/install-promise validator, the C03 public template manifest validator and the C04 local/BYOK config scaffold validator.

## 3. Optional: inspect the config placeholder

```bash
cat .env.example
cat config/local-byok.config.example.json
```

This is inspection only. Do not create a real `.env` file, do not add API keys, do not configure providers and do not run local capsules from this scaffold.

## 4. Read the boundaries

Read these before assuming runtime behavior:

- `README.md`
- `docs/LAUNCHER_PUBLIC_REPO_STRATEGY.md`
- `docs/PRIVATE_CORE_BOUNDARY.md`
- `docs/INSTALL_PROMISE_BOUNDARY.md`
- `docs/LOCAL_BYOK_QUICKSTART.md`
- `docs/LOCAL_BYOK_CONFIG_SCAFFOLD.md`
- `docs/BYOK_SECRET_HANDLING_BOUNDARY.md`
- `docs/CLOUD_HANDOFF_BOUNDARY.md`
- `LICENSE.md`
- `NOTICE.md`

## 5. Understand the local/BYOK promise

Local/BYOK means a future launcher path where users keep local control and use their own keys without committing secrets. C04 adds placeholder config only.

C04 does not ask for API keys. C04 does not create a real `.env` credential file. C04 does not configure providers. C04 does not enable local capsule execution.

## What works today

- Public documentation.
- Zero-dependency validators.
- Public launcher strategy.
- Private-core boundary docs.
- Source-available/IP boundary docs.
- Quickstart promise and local validation.
- Placeholder-only local/BYOK config scaffold.

## What does not work today

- No executable launcher.
- No installer.
- No private runtime.
- No runnable templates yet.
- No provider execution.
- No connector execution.
- No Cloud sync.
- No payment.

## Troubleshooting

### npm unavailable

Run the validators directly with Node:

```bash
node scripts/validate-bootstrap-context.mjs
node scripts/validate-launcher-public-repo-strategy.mjs
node scripts/validate-launcher-c02-readme-quickstart-install-promise.mjs
node scripts/validate-launcher-c03-public-template-manifests.mjs
node scripts/validate-launcher-c04-local-byok-config-scaffold.mjs
```

### Node unavailable

Install Node.js 20+ or a compatible modern Node runtime, then rerun `npm run -s quality`.

### Validation failure

Read the failing message. The validators are designed to catch missing docs, weakened boundaries, forbidden positive claims, committed real `.env` files, binary assets and license/IP posture regressions.

### Wrong repo

If package metadata, workspace path or git remote indicates another TransformIA repo, stop. Expected repository: `TransformIA-AI/transformia-capsule-launcher`.

## Next step

Next Atlas PR:

```text
v0.6-C05
docs(launch): add Product Hunt, GitHub and X launch assets
```
