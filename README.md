# TransformIA Capsule Launcher

Prepare the public local/BYOK path for governed AI work capsules, with a clear handoff to TransformIA Cloud.

[status: v0.6-C04] [license: source-available] [private core: not included] [installer: promise only] [local/BYOK: config scaffold only] [templates: manifest only]

TransformIA Capsule Launcher is the public distribution, onboarding and download surface for TransformIA Capsule. It makes the local/BYOK path understandable without exposing the private TransformIA runtime, Exocortex core, customer material, production connector workflows or proprietary orchestration logic.

## Day-1 status

```text
v0.6-C04
feat(config): add local/BYOK config scaffold
```

- Public launcher distribution surface.
- Docs, validation, quickstart promise, public template manifests and local/BYOK config placeholders are available for first visitors.
- Five public-safe Capsule template manifests are available as manifest-only previews.
- `.env.example` exists as placeholder-only documentation; real secrets must never be committed.
- No executable launcher yet.
- No installer yet.
- No private runtime included.
- C01 public repo strategy and C02 README/quickstart/install-promise boundaries remain the foundation.
- Bootstrap context only has been superseded by the C01/C02 public launcher docs while preserving bootstrap safety checks.
- Inherited foundation: v0.6-C01 docs(launcher): define Capsule Launcher public repo strategy.

## Quickstart under 5 minutes

Prerequisites: Git, Node.js 20+ or compatible modern Node, and npm.

```bash
git clone https://github.com/TransformIA-AI/transformia-capsule-launcher.git
cd transformia-capsule-launcher
npm run -s quality
```

That command validates the bootstrap context, the C01 public repo strategy, the C02 README/quickstart/install-promise boundary, the C03 public template manifest boundary and the C04 local/BYOK config scaffold. It does not ask for API keys, does not create a real `.env` file, does not clone a private runtime and does not configure connectors.

For step-by-step guidance, see [`QUICKSTART.md`](QUICKSTART.md).

## What this repository is

- The public distribution and onboarding shell for TransformIA Capsule Launcher.
- The day-1 README, quickstart, install-promise and validation surface.
- The public-safe place for sanitized Capsule template manifests.
- The documentation boundary for local/BYOK onboarding and future Cloud handoff.
- A validator-protected surface that blocks false production, install, payment, cloud and private-core claims.

## What this repository is not

- Not the private TransformIA runtime or Exocortex core.
- Not a bundled private core. The private runtime/core is not included.
- Not an executable launcher in C04.
- Not a working installer in C04.
- Not a binary release, archive or package release in C04.
- Not active local capsule execution in C04.
- Not a configured BYOK provider path in C04.
- Not a connector execution system.
- Not a payment, Stripe, checkout, customer portal, auth, database, telemetry, analytics or cloud-sync implementation.
- Not a place for customer data, secrets, raw evidence, private workflows, internal runbooks, private prompts or proprietary runtime internals.


## Local/BYOK config scaffold

C04 adds placeholder config only. The repository now shows where future local/BYOK configuration will live, but it does not enable local capsule execution.

- `.env.example` exists as a placeholder sample; real secrets must never be committed.
- `config/local-byok.config.example.json` is declarative and non-executable.
- No local launcher execution exists yet.
- No provider is configured.
- No private runtime is included.

See [`config/README.md`](config/README.md) and [`docs/LOCAL_BYOK_CONFIG_SCAFFOLD.md`](docs/LOCAL_BYOK_CONFIG_SCAFFOLD.md).

## Public template manifests

C03 adds a manifest catalog only. These manifests are public-safe previews of future Capsule template directions. They are not executable, do not include the private runtime, do not execute connectors and do not include customer data, secrets or prompts.

Use the catalog to understand the first five public template directions, their business jobs, conceptual inputs, safety boundaries and future implementation requirements:

- [`docs/TEMPLATE_MANIFEST_CATALOG.md`](docs/TEMPLATE_MANIFEST_CATALOG.md)
- [`templates/manifests/README.md`](templates/manifests/README.md)

C03 does not change the C02 quickstart into a runnable template path. The current quickstart remains clone-and-validate only.

## Local/BYOK/control promise

The launcher strategy is local/BYOK first: users should eventually be able to bring their own keys, keep local control and evaluate the public launcher path without committing secrets and without exposing private runtime internals.

C04 adds a placeholder-only config scaffold for that promise. It does not request API keys, does not configure providers and does not add an executable launcher yet. See [`docs/LOCAL_BYOK_QUICKSTART.md`](docs/LOCAL_BYOK_QUICKSTART.md) and [`docs/BYOK_SECRET_HANDLING_BOUNDARY.md`](docs/BYOK_SECRET_HANDLING_BOUNDARY.md).

## Install promise boundary

C02 makes the install promise visible, but it does not ship an installer, binary, archive, package release or executable launcher. The current install action is cloning the public repo and running validation.

Future install guidance should remain under-five-minute, minimal-dependency, local/BYOK-first and explicit about what exists before claiming availability. See [`docs/INSTALL_PROMISE_BOUNDARY.md`](docs/INSTALL_PROMISE_BOUNDARY.md).

## GIF placeholder

The future README/demo GIF is documented as a placeholder only. C02 adds no GIF file, screenshot, binary asset or fake UI. See [`docs/GIF_PLACEHOLDER_PLAN.md`](docs/GIF_PLACEHOLDER_PLAN.md).

## TransformIA Cloud handoff

TransformIA Cloud is a future handoff path, not a C04 implementation. The Cloud upgrade path will be documented in future PRs and is tracked at [`docs/CLOUD_HANDOFF_BOUNDARY.md`](docs/CLOUD_HANDOFF_BOUNDARY.md).

C02 includes no Cloud auth, no Cloud sync, no customer portal, no subscription state, no tenant state, no payment and no Stripe flow.

## Source-available/IP posture

This repository is public source-available, not open source.

The operative license is `LICENSE.md`: TransformIA Capsule Launcher Source-Available Evaluation License v0.1. Public visibility does not grant production, commercial, redistribution, SaaS, white-label, managed-service, private-runtime or TransformIA branding rights.

See:

```text
LICENSE.md
NOTICE.md
docs/IP_AND_LICENSE_BOUNDARY.md
```

## Repo structure

```text
README.md                                      day-1 public landing page
QUICKSTART.md                                  under-five-minute clone and validate path
docs/LAUNCHER_PUBLIC_REPO_STRATEGY.md          C01 public repo strategy
docs/PRIVATE_CORE_BOUNDARY.md                  private runtime protection boundary
docs/PUBLIC_TEMPLATES_BOUNDARY.md              future public template safety boundary
docs/INSTALL_PROMISE_BOUNDARY.md               install promise boundary
docs/LOCAL_BYOK_QUICKSTART.md                  future local/BYOK control path
docs/CLOUD_HANDOFF_BOUNDARY.md                 future TransformIA Cloud handoff boundary
docs/GIF_PLACEHOLDER_PLAN.md                   future GIF placeholder plan
docs/README_BADGES_AND_DISCOVERY.md            truthful badges and discovery posture
scripts/validate-bootstrap-context.mjs         bootstrap validator
scripts/validate-launcher-public-repo-strategy.mjs C01 validator
scripts/validate-launcher-c02-readme-quickstart-install-promise.mjs C02 validator
scripts/validate-launcher-c03-public-template-manifests.mjs C03 validator
templates/README.md                            public templates boundary README
templates/manifests/README.md                  public manifest folder guide
templates/manifests/template-manifest.schema.json public manifest schema
templates/manifests/*.manifest.json            public-safe manifest previews
```

## Validation commands

Run the full available quality sequence:

```bash
npm run -s validate:bootstrap-context
npm run -s validate:launcher-public-repo-strategy
npm run -s validate:launcher-c02-readme-quickstart-install-promise
npm run -s validate:launcher-c03-public-template-manifests
npm run -s quality
git diff --check
git status --short
```

If `npm` is unavailable, run the Node validators directly:

```bash
node scripts/validate-bootstrap-context.mjs
node scripts/validate-launcher-public-repo-strategy.mjs
node scripts/validate-launcher-c02-readme-quickstart-install-promise.mjs
node scripts/validate-launcher-c03-public-template-manifests.mjs
```

## Roadmap

Current Atlas milestone:

```text
v0.6-C04
feat(config): add local/BYOK config scaffold
```

Previous public visitor milestone:

```text
v0.6-C02
feat(launcher): add README, quickstart and install promise
```

Next Atlas PR after C03:

```text
v0.6-C04
feat(config): add local/BYOK config placeholder
```

Expected future sequence:

- C03: public Capsule template manifests after sanitization.
- C04, if Atlas scopes it: local/BYOK configuration scaffold without committed keys.
- Later approved PRs: download packaging boundaries, installer documentation and Cloud handoff refinement.

## Contribution boundary

Contributions should improve downloadability, public-safe onboarding, local/BYOK usability, private-core protection, template safety, install clarity, buyer/user legibility, upgrade-path clarity, validation against false claims or reproducible launcher readiness.

Do not add private runtime code, customer material, secrets, binary assets, installer artifacts, connector execution, payment/auth/database/cloud-sync/telemetry implementation or license posture changes without explicit Dani approval.

## Operating rule

Private core remains private. Launcher distributes, documents and guides. Runtime decides. Web renders. Dani approves.

## Next Atlas PR

```text
v0.6-C05
docs(launch): add Product Hunt, GitHub and X launch assets
```
