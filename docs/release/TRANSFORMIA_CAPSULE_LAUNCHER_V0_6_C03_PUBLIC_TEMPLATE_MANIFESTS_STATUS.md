# TransformIA Capsule Launcher v0.6-C03 Public Template Manifests Status

## Exact Atlas entry

```text
v0.6-C03
feat(templates): add public Capsule template manifests
```

## Inherited state

- C01 merged in PR #1.
- C02 merged in PR #2.
- README, quickstart and install promise docs exist.
- Public templates boundary exists.
- Private core boundary exists.
- Source-available/IP posture exists through `LICENSE.md`, `NOTICE.md` and `docs/IP_AND_LICENSE_BOUNDARY.md`.

## Purpose

C03 adds a public manifest catalog to make future Capsule template directions concrete for day-1 visitors.

The goal is to show template categories, business jobs, conceptual public-safe data expectations and safety boundaries while avoiding executable, runtime or template overclaim.

## What this PR adds

- Public Capsule template manifest schema.
- Five public-safe, non-executable template manifests.
- Manifest folder README.
- Public manifest schema documentation.
- Template manifest catalog.
- Template safety review checklist.
- C03 validator and package script.
- README, templates README, handoff and project memory updates.

## What this PR does not add

- No executable launcher.
- No installer.
- No binary release.
- No package release.
- No private runtime.
- No connector execution.
- No customer data.
- No secrets.
- No payment.
- No Stripe.
- No checkout.
- No customer portal.
- No auth.
- No database.
- No Cloud sync.
- No telemetry.
- No analytics.
- No live execution.
- No runnable templates.
- No private prompts.
- No n8n workflows.
- No API keys.
- No `.env` files.

## Safety boundaries

Private core remains private. Launcher distributes, documents and guides. Runtime decides. Web renders. Dani approves.

C03 protects against false template, runtime, connector, payment, production, compliance, ROI, Cloud and IP/license claims.

## IP/license boundaries

This repository remains public source-available, not open source. C03 does not change `LICENSE.md`, `NOTICE.md`, `docs/IP_AND_LICENSE_BOUNDARY.md` or `AGENTS.md`.

## Validation

C03 validation includes:

- bootstrap context validator;
- C01 public repo strategy validator;
- C02 README/quickstart/install-promise validator;
- C03 public template manifests validator;
- `npm run -s quality`;
- `git diff --check`;
- `git status --short`.

Review feedback addressed: the C03 validator now validates every manifest against all required schema fields, nested required fields, allowed property sets and schema/validator drift checks.

## P1/P2 prevention

- Forbidden claim scanning uses tracked text files in normal git mode.
- Negation checks are matching-line only.
- Previous-line context does not exempt a positive claim.
- Changed-file detection is PR-base aware.
- The source-available/IP posture remains protected.

## Next PR according to Atlas

```text
v0.6-C04
feat(config): add local/BYOK config placeholder
```
