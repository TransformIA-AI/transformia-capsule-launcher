# Quickstart: TransformIA Capsule Launcher v0.6-C02

This quickstart is the day-1 path for a public visitor to clone and validate the launcher repository in under 5 minutes.

## Prerequisites

- Git.
- Node.js 20+ or compatible modern Node.
- npm.

No API key is required now. No `.env` file is required now. No private runtime clone is required.

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

This runs the bootstrap validator, the C01 public repo strategy validator and the C02 README/quickstart/install-promise validator.

## 3. Read the boundaries

Read these before assuming runtime behavior:

- `README.md`
- `docs/LAUNCHER_PUBLIC_REPO_STRATEGY.md`
- `docs/PRIVATE_CORE_BOUNDARY.md`
- `docs/INSTALL_PROMISE_BOUNDARY.md`
- `docs/LOCAL_BYOK_QUICKSTART.md`
- `docs/CLOUD_HANDOFF_BOUNDARY.md`
- `LICENSE.md`
- `NOTICE.md`

## 4. Understand the local/BYOK promise

Local/BYOK means a future launcher path where users keep local control and use their own keys without committing secrets. C02 documents the promise only.

C02 does not ask for API keys. C02 does not create `.env`. C02 does not configure providers.

## What works today

- Public documentation.
- Zero-dependency validators.
- Public launcher strategy.
- Private-core boundary docs.
- Source-available/IP boundary docs.
- Quickstart promise and local validation.

## What does not work today

- No executable launcher.
- No installer.
- No private runtime.
- No real templates yet.
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
```

### Node unavailable

Install Node.js 20+ or a compatible modern Node runtime, then rerun `npm run -s quality`.

### Validation failure

Read the failing message. The validators are designed to catch missing docs, weakened boundaries, forbidden positive claims, committed `.env` files, binary assets and license/IP posture regressions.

### Wrong repo

If package metadata, workspace path or git remote indicates another TransformIA repo, stop. Expected repository: `TransformIA-AI/transformia-capsule-launcher`.

## Next step

Next Atlas PR:

```text
v0.6-C03
feat(templates): add public Capsule template manifests
```
