# AGENTS.md

## TransformIA Capsule Launcher

This repository is **TransformIA Capsule Launcher**: the public distribution, onboarding and download surface for TransformIA Capsule.

It exists to make TransformIA Capsule legible and adoptable without exposing the private TransformIA core.

It may contain:

- public README and quickstart material;
- public-safe launcher strategy documents;
- public templates and examples;
- local/BYOK onboarding posture;
- validation scripts that prevent private-core leakage;
- future installer documentation and release packaging boundaries.

It must not contain private runtime code or customer material.

**Core rule:** Private core remains private. Launcher distributes, documents and guides. Runtime decides. Web renders. Dani approves.

---

## 1. Operating principle

Every change must advance at least one of these vectors:

- downloadability;
- public-safe onboarding;
- local/BYOK usability;
- private-core protection;
- template safety;
- install clarity;
- buyer/user legibility;
- upgrade-path clarity;
- validation against false claims;
- reproducible launcher readiness.

If a change does not advance at least one vector, do not make it.

---

## 2. Repository role and authority boundaries

| Layer | Authority | Launcher responsibility |
|---|---|---|
| Private Runtime / Exocortex | Source of truth for Work Units, policies, evidence, approvals, enforcement and execution semantics. | Do not include or reimplement. Reference only at conceptual/public-safe level. |
| Web Flagship | Public showroom and rendered product surfaces. | May be referenced as prior web posture, not imported. |
| Capsule Launcher | Public distribution and onboarding shell. | README, quickstart, public templates, installer posture, local/BYOK guidance and release packaging boundaries. |
| TransformIA Cloud | Future paid/cloud path. | Describe as future handoff only unless explicitly implemented in a later approved PR. |
| n8n / connectors | Intake/execution edge in private stack. | Do not include workflows, credentials or connector implementations. |

Launcher must never authorize capabilities, payments, subscriptions, connector execution, cloud sync or private runtime behavior.

---

## 3. Non-negotiable safety rules

These rules are permanent unless Dani explicitly approves a change.

- Never commit credentials, tokens, API keys, private certificates or privileged configuration.
- Never commit customer data, customer workspaces, raw evidence, raw connector payloads or private workflows.
- Never include private runtime source, proprietary orchestration logic or internal prompts.
- Never add live connector execution.
- Never add payment, Stripe, checkout, customer portal, subscription, auth, database, telemetry or cloud sync implementation unless a future Atlas PR explicitly asks for it and Dani approves.
- Never add external network calls unless explicitly scoped and approved.
- Never add binary releases, installers, archives or compiled artifacts unless the PR explicitly asks for packaging.
- Never claim production readiness, working installer, payment activation, cloud sync, customer portal, private runtime inclusion or autonomous execution unless actually implemented and approved.
- Never auto-merge.
- Never claim tests, validators, builds or scans passed unless they actually ran.


---

## 3.1 License and IP posture

This repository is public source-available, not open source.

The operative license is `LICENSE.md`: TransformIA Capsule Launcher Source-Available Evaluation License v0.1.

Agents must not change license posture without explicit Dani approval.

Forbidden without explicit approval:

- MIT;
- Apache-2.0;
- ISC;
- BSD;
- GPL/AGPL/LGPL;
- EUPL/MPL;
- Creative Commons for software;
- CC0, Unlicense or public domain;
- any wording implying free commercial use, production use, redistribution, SaaS use, white-label use or open-source status.

`package.json` must point to the custom license and must not advertise a permissive or copyleft license.

Public visibility does not grant rights to the private TransformIA runtime, Exocortex core, production connectors, private prompts, customer data or proprietary orchestration logic.

---

## 4. Human approval boundaries

Always require Dani approval before changing:

- this `AGENTS.md` file;
- license posture;
- repository visibility assumptions;
- dependency additions;
- release packaging;
- binary/installer generation;
- any payment, auth, DB, telemetry or cloud-sync implementation;
- any private-runtime reference beyond public-safe conceptual documentation;
- any public claim about compliance, certification, guaranteed ROI or production readiness.

If a task requires a sensitive decision and approval is not already explicit, stop and create `DECISION_NEEDED.md` using `docs/DECISION_NEEDED_TEMPLATE.md`.

Do not continue past that decision until Dani resolves it.

---

## 5. Codex build-chain rules for Capsule Launcher

## Current approved v1 gate: Capsule Launcher v1 Activation Runner

Dani explicitly approves this v1 gate as the current Launcher work item.

This PR is allowed to implement the public-safe local Activation Runner even though the previous current focus referenced v0.6-C01.

Scope allowed:
- activation pack validation;
- canonical public activation pack output;
- local deterministic workspace skeleton;
- activation doctor;
- dry-run plan;
- activation evidence pack;
- future console handoff summary;
- zero-dependency validators;
- public-safe docs and operator guide;
- tests and adversarial regressions.

Scope not allowed:
- Web Flagship changes;
- Runtime changes;
- private runtime code;
- live execution;
- provider calls;
- Stripe/payment/checkout;
- .env/secrets;
- customer PII;
- n8n execution;
- booking;
- outbound messaging;
- provisioning;
- deploy.

Boundary:
Runtime decides and governs.
Launcher prepares, validates and emits public-safe evidence.
Web renders in a separate PR.
Dry-run is not permission.
Public-safe summary is not authority.

## Public output canonicalization rule

Any Launcher output marked public-safe must be produced from canonical allowlisted fields, not raw operator-supplied objects.

Rules:
- scan object keys and values;
- reject or canonicalize unsafe keys;
- reject unknown public pack fields fail-closed;
- never serialize raw activation packs;
- never serialize raw doctor/evidence overrides;
- never include URLs, emails, phone numbers, token-shaped strings, secret-shaped values or customer material in public outputs;
- final public output guards must run before writing files;
- writer correctness must survive hostile serialized objects, not only builder-created objects.

### A. Atlas-first PR scope

Every PR must start from the exact Atlas entry.

Required PR interpretation format:

1. Exact Atlas entry.
2. What this PR builds.
3. What this PR does not build.
4. Safety boundaries.
5. Files allowed.
6. Validators.
7. Acceptance criteria.

Do not invent PRs outside the Atlas unless Dani explicitly asks.

### B. One capability per PR

Keep one milestone slice per PR. Do not combine launcher strategy, quickstart, templates, installer and cloud handoff in one PR unless the Atlas says so.

### C. Private-core protection

- Do not import private runtime code.
- Do not clone or reference private repo internals as implementation instructions.
- Do not copy private runtime files, schemas, fixtures, prompts, workflows, traces or credentials.
- Public docs may describe boundaries and high-level capabilities only.

### D. Validator design

- Validators must be zero-dependency unless a PR explicitly adds dependencies.
- Changed-file checks must use PR-base comparison when git is available.
- Never rely only on `git diff --name-only HEAD`.
- Validators must protect durable repository state, not just the current diff.
- Validators must fail on false production/install/payment/private-core claims.

### E. Public-safe wording

Allowed language:

- public distribution surface;
- local/BYOK promise;
- private core boundary;
- public-safe templates;
- future Cloud handoff;
- install promise boundary;
- readiness, not production guarantee.

Forbidden language unless implemented and approved:

- production-readiness claims;
- active one-click installer claims;
- active payment-flow claims;
- live Stripe integration claims;
- active customer-portal claims;
- active subscription-state claims;
- bundled/private-runtime inclusion claims;
- connector execution enabled;
- autonomous execution without governance.

---

## 6. Quality sequence

For launcher PRs, run the smallest relevant validator first, then the full available quality sequence:

1. relevant milestone validator;
2. `npm run -s quality` if package scripts exist;
3. `git diff --check`;
4. `git status --short`.

If a command cannot run, say exactly why.

---

## 7. PR response requirements

Every Codex final response must include:

- Preflight result;
- Repo verification;
- Exact Atlas entry;
- Files changed;
- Capability summary;
- Validators run;
- Safety boundaries;
- Known P1/P2 regression prevention;
- Commands run and results;
- PR number/link if available;
- Remaining risks;
- No auto-merge confirmation.

---

## 8. Current milestone focus

Current focus:

```text
v1.0-LAUNCHER-ACTIVATION-RUNNER
feat(activation): add Capsule Launcher v1 Activation Runner
```

Approved working Atlas entry:

```text
Capsule Launcher v1 Activation Runner:
Launcher prepares, validates, diagnoses and emits local public-safe evidence for a future Capsule activation handoff.

Bridge:
Console private preview / Activation Pack
-> Launcher local
-> Doctor
-> Dry-run
-> Evidence Pack
-> Future Console/Runtime handoff.

Runtime decides.
Launcher prepares/verifies/emits public-safe evidence.
Web remains separate.
Dani explicitly approved this out-of-sequence v1 gate.
```
