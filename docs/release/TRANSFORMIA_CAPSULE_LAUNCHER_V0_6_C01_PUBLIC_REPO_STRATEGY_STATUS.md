# TransformIA Capsule Launcher v0.6-C01 Public Repo Strategy Status

## Inherited state

- B07 web billing portal link posture merged in `transformia-web-flagship`.
- C01 starts the Public Capsule Launcher and Downloads block.
- This repository is public distribution surface only.
- Bootstrap context already exists and is being formalized into the C01 strategy milestone.

## Purpose

C01 defines the public repository strategy for TransformIA Capsule Launcher before quickstart, public templates, installer or download work.

## What this PR adds

- README upgrade from bootstrap context to C01 public strategy skeleton.
- Launcher public repo strategy doc.
- Private core boundary doc.
- Public templates boundary doc.
- Install promise boundary doc.
- C01 release/status record.
- Zero-dependency C01 validator and package script.
- Handoff and project memory updates for the next Atlas PR.

## What this PR does not add

- Executable launcher.
- Installer.
- Binary release.
- Package release.
- Private runtime.
- Connector execution.
- Real public templates.
- Customer data.
- Secrets.
- Payment, Stripe, checkout or customer portal.
- Auth, database, telemetry, analytics or cloud sync.
- Live execution.

## Safety boundaries

- Private core remains private.
- Public launcher distributes, documents and guides.
- Runtime decides.
- Web renders.
- Dani approves.
- No private runtime code, customer data, secrets, binaries, installer, connector execution, payment, auth, DB, telemetry or cloud sync are introduced.

## IP/license boundaries

This repository remains public source-available, not open source.

The operative license remains `LICENSE.md`, and package metadata remains `SEE LICENSE IN LICENSE.md`.

No production, commercial, redistribution, SaaS, white-label, managed-service, private-runtime or TransformIA branding rights are granted by public visibility.

## Validation

Review feedback addressed: the C01 validator now scans tracked text files for forbidden positive install/payment/license/private-core claims instead of only a fixed C01 allowlist.

C01 validation consists of:

```bash
npm run -s validate:bootstrap-context
npm run -s validate:launcher-public-repo-strategy
npm run -s quality
git diff --check
git status --short
```

## Next PR according to Atlas

```text
v0.6-C02
feat(launcher): add README, quickstart and install promise
```
