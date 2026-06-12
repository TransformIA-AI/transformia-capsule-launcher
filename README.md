# TransformIA Capsule Launcher

Public bootstrap context for the TransformIA Capsule Launcher repository.

This repository is the future public distribution surface for TransformIA Capsule Launcher. It will support local/BYOK onboarding, public-safe templates, download/readiness documentation and a clean path toward TransformIA Cloud.

## Current status

Bootstrap context only.

The next Atlas PR is:

```text
v0.6-C01
docs(launcher): define Capsule Launcher public repo strategy
```

## What this repository is

- A public distribution and onboarding surface for TransformIA Capsule.
- A future launcher/readme/download surface.
- A place for public-safe templates and examples.
- A bridge from local/BYOK usage toward paid/cloud paths.

## What this repository is not

- Not the private TransformIA runtime.
- Not the private core.
- Not a production launcher yet.
- Not a working installer yet.
- Not a connector execution system.
- Not a payment, Stripe, auth, database or cloud-sync implementation.
- Not a place for customer data, secrets, raw evidence, private workflows or proprietary runtime internals.

## Operating rule

Private core stays private. Public launcher stays public-safe.

Runtime decides. Launcher distributes and guides. Public templates demonstrate safely.

## Before running Codex

Codex must read:

1. `AGENTS.md`
2. `docs/PROJECT_MEMORY.md`
3. `docs/ATLAS_V06C_HANDOFF.md`
4. `docs/AGENT_ORCHESTRATION.md`
5. `docs/SECURITY_AND_PUBLIC_BOUNDARIES.md`
6. `docs/DEVELOPMENT_EVIDENCE_LOG_PER_PR_SLICE.md`

Then Codex may execute the next Atlas PR: `v0.6-C01`.

## Validation

```bash
npm run -s validate:bootstrap-context
npm run -s quality
```


## License and intellectual property

This repository is public source-available, not open source.

All rights are reserved unless expressly granted in `LICENSE.md`. Public visibility on GitHub does not grant production, commercial, redistribution, SaaS, white-label, managed-service or private-runtime rights.

Do not copy private TransformIA runtime logic, customer data, connector payloads, secrets, internal prompts or proprietary orchestration material into this repository.

See:

```text
LICENSE.md
NOTICE.md
docs/IP_AND_LICENSE_BOUNDARY.md
```
