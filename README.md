# TransformIA Capsule Launcher

TransformIA Capsule Launcher is the public distribution, onboarding and download surface for TransformIA Capsule.

This repository makes the local/BYOK path understandable without exposing the private TransformIA runtime, Exocortex core, customer material, production connector workflows or proprietary orchestration logic.

## Current status

```text
v0.6-C01
docs(launcher): define Capsule Launcher public repo strategy
```

C01 promotes the bootstrap context into a formal public repository strategy milestone. This is still a strategy and boundary milestone, not a shipped installer or executable launcher.

Bootstrap context only has been superseded by this C01 strategy skeleton while preserving the original bootstrap safety checks.

## What this repository is

- The public repository strategy and distribution shell for TransformIA Capsule Launcher.
- The future home for README, quickstart, install-promise and download guidance.
- The public-safe place for sanitized, generic templates in a later PR.
- The documentation boundary for local/BYOK onboarding and future Cloud handoff.
- A validator-protected surface that blocks false production, install, payment, cloud and private-core claims.

## What this repository is not

- Not the private TransformIA runtime or Exocortex core.
- Not a bundled private core. The private runtime/core is not included.
- Not an executable launcher in C01.
- Not a working installer in C01.
- Not a binary release or package release in C01.
- Not a connector execution system.
- Not a payment, Stripe, checkout, customer portal, auth, database, telemetry, analytics or cloud-sync implementation.
- Not a place for customer data, secrets, raw evidence, private workflows, internal runbooks, private prompts or proprietary runtime internals.

## Operating rule

Private core remains private. Launcher distributes, documents and guides. Runtime decides. Web renders. Dani approves.

## Local/BYOK promise

The launcher strategy is local/BYOK first: users should eventually be able to understand how to bring their own keys and run the public launcher path locally without committing secrets and without exposing private runtime internals.

C01 defines that promise boundary only. A later PR may add quickstart and install-promise documentation.

## Private core boundary

The launcher is distribution, not core. It may describe conceptual architecture and public-safe capabilities, but it must not include private runtime source, Exocortex implementation, proprietary orchestration logic, internal prompts, customer workspaces, raw evidence, production connector credentials or private repo clone instructions.

See `docs/PRIVATE_CORE_BOUNDARY.md`.

## Public templates boundary

Public templates are future sanitized examples. They are not customer capsules, not private runtime templates and not regulated workflow guarantees. They must contain no PII, secrets, customer data, raw evidence or live connector execution logic.

C01 does not add real templates.

See `docs/PUBLIC_TEMPLATES_BOUNDARY.md` and `templates/README.md`.

## Install promise boundary

C01 does not ship an installer, binary, archive or package release. The install promise target is local/BYOK first, with future goals of under-five-minute setup, minimal dependencies, no committed secrets and no private runtime leakage.

No installer or binary availability should be claimed before it exists and is approved.

See `docs/INSTALL_PROMISE_BOUNDARY.md`.

## Future Cloud handoff boundary

TransformIA Cloud is a future handoff path. This repository may describe that direction at a public-safe level, but C01 does not implement cloud sync, auth, database persistence, telemetry, customer portal, subscription state, payment or Stripe flows.

## Roadmap

Current Atlas milestone:

```text
v0.6-C01
docs(launcher): define Capsule Launcher public repo strategy
```

Next Atlas PR:

```text
v0.6-C02
feat(launcher): add README, quickstart and install promise
```

Expected future sequence:

- C02: README, quickstart and install promise.
- C03: public template examples after sanitization.
- Later approved PRs: download packaging boundaries, installer documentation and Cloud handoff refinement.

## Validation

Run the focused C01 validators:

```bash
npm run -s validate:bootstrap-context
npm run -s validate:launcher-public-repo-strategy
npm run -s quality
git diff --check
git status --short
```

If `npm` is unavailable, run the Node validators directly:

```bash
node scripts/validate-bootstrap-context.mjs
node scripts/validate-launcher-public-repo-strategy.mjs
```

## License and intellectual property

This repository is public source-available, not open source.

The operative license is `LICENSE.md`: TransformIA Capsule Launcher Source-Available Evaluation License v0.1. Public visibility does not grant production, commercial, redistribution, SaaS, white-label, managed-service, private-runtime or TransformIA branding rights.

Do not copy private TransformIA runtime logic, customer data, connector payloads, secrets, internal prompts, private runbooks or proprietary orchestration material into this repository.

See:

```text
LICENSE.md
NOTICE.md
docs/IP_AND_LICENSE_BOUNDARY.md
```
