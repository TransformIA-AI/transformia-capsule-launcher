# TransformIA Capsule Launcher

Public source-available launcher surface for evaluating governed AI work capsules with local/BYOK control clarity, safe template previews and a future TransformIA Cloud handoff.

[status: v0.6-C05] [license: source-available] [private core: not included] [installer: promise only] [local/BYOK: config scaffold only]

[![status](https://img.shields.io/badge/status-v0.6_H02%2BH07-blue)](#roadmap)
[![license](https://img.shields.io/badge/license-source--available-orange)](LICENSE.md)
[![private core](https://img.shields.io/badge/private_core-not_included-lightgrey)](#what-it-does-not-do)
[![local/BYOK](https://img.shields.io/badge/local%2FBYOK-guidance-green)](#local--byok-posture)
[![templates](https://img.shields.io/badge/templates-manifest_previews-purple)](#templates-available)

## Preflight lineage

Bootstrap context only is preserved as the safety baseline, with inherited strategy from `v0.6-C01` before this `v0.6-H02 + v0.6-H07` launch capability pack.

## One-liner

TransformIA Capsule Launcher is the public GitHub-ready entry point for understanding, cloning and validating the TransformIA Capsule onboarding surface while making clear that private runtime/core is not included and that private core code, customer data and live connector execution stay out of this repository.

## What it does

- Explains the public launcher role for TransformIA Capsule.
- Provides a quick clone-and-validate path for first visitors.
- Documents source-available license posture and public-safe boundaries.
- Lists public-safe template manifest previews for future Capsule use cases.
- Describes the local/BYOK posture without asking for real credentials.
- Gives a future Cloud Trial handoff path without implementing Cloud features.
- Maintains validators that protect against false launch, install, payment, connector and private-core claims.
- Provides Product Hunt and GitHub launch-kit documentation for human-reviewed launch preparation.

## What it does not do

- It does not include private TransformIA core code, proprietary orchestration logic, internal prompts, customer material, raw evidence or production workflows.
- It does not execute Capsules, connectors, provider calls, automations, payments, subscriptions, auth, telemetry, databases or cloud sync.
- It does not ship an installer, binary release, archive, package release or one-click setup.
- It does not claim compliance certification, ROI guarantees, unrestricted commercial rights or unrestricted redistribution rights.
- It does not ask for API keys or store secrets.
- It does not authorize dangerous automation or unsupervised execution.

## Quickstart in under 5 minutes

Prerequisites: Git, Node.js 20+ or a compatible modern Node runtime, and npm.

```bash
git clone https://github.com/TransformIA-AI/transformia-capsule-launcher.git
cd transformia-capsule-launcher
npm run -s quality
```

Expected result: validators confirm the public launcher docs, template manifests, local/BYOK placeholders and launch assets are internally consistent.

This quickstart is deliberately validation-only. It does not create a real `.env` file, request credentials, configure providers, clone private code or execute connectors.

For the step-by-step path, see [`QUICKSTART.md`](QUICKSTART.md).

## Public template manifests

Manifest previews are not executable. They do not include customer data, secrets or prompts. See [`templates/manifests/README.md`](templates/manifests/README.md).

## Templates available

Public templates are currently manifest previews only. They describe business jobs, conceptual inputs and safety boundaries without executable connector code, customer data, secrets, prompts or runtime semantics.

Current manifest previews live in [`templates/manifests`](templates/manifests):

- `appointment-prep-capsule.manifest.json`
- `evidence-value-review-capsule.manifest.json`
- `faq-knowledge-capsule.manifest.json`
- `lead-intake-capsule.manifest.json`
- `local-byok-starter-capsule.manifest.json`

Read the catalog in [`docs/TEMPLATE_MANIFEST_CATALOG.md`](docs/TEMPLATE_MANIFEST_CATALOG.md).


## Connector Kits preview

The v0.7-A03 Connector Kits preview publishes a public-safe connector catalog and Install Doctor shell. See [`connectors/README.md`](connectors/README.md).

```bash
npm run -s validate:connector-manifests
npm run -s validate:connector-recipes
npm run -s doctor
```

Real provider connections happen through Capsule Cloud, not this public launcher. The launcher explains kit and recipe readiness, validates manifests and recipes, and keeps provider credentials outside the repo. Google Calendar recipes are public-safe installability descriptions, not proof of provider connection or event creation.

## Local/BYOK config scaffold

The local/BYOK config scaffold is documented in [`config/README.md`](config/README.md) and [`docs/LOCAL_BYOK_CONFIG_SCAFFOLD.md`](docs/LOCAL_BYOK_CONFIG_SCAFFOLD.md). It is placeholder-only and non-executable.

## Local / BYOK posture

The launcher is local/BYOK-first in posture: evaluators should understand where future local configuration will live, how secrets must be handled and what remains outside this public repo.

Current state:

- `.env.example` is placeholder-only documentation.
- [`config/local-byok.config.example.json`](config/local-byok.config.example.json) is declarative and non-executable.
- Real credentials must stay outside Git.
- Provider setup and execution are future approved work, not current launcher behavior.

See [`docs/LOCAL_BYOK_QUICKSTART.md`](docs/LOCAL_BYOK_QUICKSTART.md) and [`docs/BYOK_SECRET_HANDLING_BOUNDARY.md`](docs/BYOK_SECRET_HANDLING_BOUNDARY.md).

## Cloud Trial path

TransformIA Cloud is a future upgrade and onboarding path. This repo may describe the handoff at a public-safe level, but it does not implement Cloud auth, tenants, sync, checkout, subscription state, customer portals, telemetry or hosted execution.

See [`docs/CLOUD_HANDOFF_BOUNDARY.md`](docs/CLOUD_HANDOFF_BOUNDARY.md).

## Security posture

This repo is designed to be public-safe:

- No credentials, tokens, customer workspaces, private certificates or privileged config should be committed.
- No raw connector payloads, raw evidence, private workflows or production runbooks belong here.
- Validators scan for false production, payment, installer, connector, secret and private-core claims.
- Launch assets are draft copy for human review, not evidence that any public launch action has happened.

See [`docs/SECURITY_AND_PUBLIC_BOUNDARIES.md`](docs/SECURITY_AND_PUBLIC_BOUNDARIES.md) and [`docs/PRIVATE_CORE_BOUNDARY.md`](docs/PRIVATE_CORE_BOUNDARY.md).

## Human approval / no dangerous automation by default

The launcher documents and validates. It does not approve work, execute risky actions, make payments, write customer records or bypass human governance. Any future capability that changes execution, payments, auth, data persistence, connector behavior, release packaging or license posture requires explicit Dani approval in a later approved PR.

## Links to TransformIA web / launch page

- Public repo: `https://github.com/TransformIA-AI/transformia-capsule-launcher`
- TransformIA web / launch page: add the final approved URL before public launch.
- Existing launch assets guide: [`launch/README.md`](launch/README.md). No launch has been executed by this repository.
- Product Hunt kit: [`docs/launch/PRODUCT_HUNT_LAUNCH_KIT_v0_6.md`](docs/launch/PRODUCT_HUNT_LAUNCH_KIT_v0_6.md)
- GitHub launch README notes: [`docs/launch/GITHUB_LAUNCH_README_NOTES_v0_6.md`](docs/launch/GITHUB_LAUNCH_README_NOTES_v0_6.md)
- Screenshot and GIF checklist: [`docs/launch/SCREENSHOT_AND_GIF_CHECKLIST_v0_6.md`](docs/launch/SCREENSHOT_AND_GIF_CHECKLIST_v0_6.md)
- Launch FAQ: [`docs/launch/FAQ_v0_6.md`](docs/launch/FAQ_v0_6.md)

## Validation commands

```bash
npm run -s validate:launch-docs
npm run -s quality
git diff --check
git status --short
```

If npm is unavailable, run the launch-docs validator directly:

```bash
node scripts/validate-launch-docs.mjs
```

## Roadmap

Current Atlas capability pack:

```text
v0.6-H02 + v0.6-H07 unified capability pack
docs(launch): add Launcher README and Product Hunt Launch Kit
```

This pack prepares the public README and Product Hunt launch-kit surface. It does not change runtime capabilities.

Atlas PR progression: `v0.6-C02` established README/quickstart/install-promise boundaries, `v0.6-C03 feat(templates): add public Capsule template manifests` added manifest previews, and `v0.6-C05 docs(launch): add Product Hunt, GitHub and X launch assets` added the prior launch-copy foundation.

Near-term public-safe sequence:

- Keep README, quickstart and launch-kit claims validator-protected.
- Add approved screenshots/GIFs only after the visuals match implemented public surfaces.
- Keep template manifests public-safe and non-executable until a future approved implementation PR exists.
- Document the Cloud Trial handoff without implementing checkout, auth, customer portal, telemetry or cloud sync.
- Continue separating launcher documentation from private core behavior.

## License / source posture

This repository is public source-available, not open source.

The operative license is [`LICENSE.md`](LICENSE.md): TransformIA Capsule Launcher Source-Available Evaluation License v0.1. Public visibility does not grant production, commercial, redistribution, SaaS, white-label, managed-service, private-core or TransformIA branding rights.

See [`NOTICE.md`](NOTICE.md) and [`docs/IP_AND_LICENSE_BOUNDARY.md`](docs/IP_AND_LICENSE_BOUNDARY.md).
