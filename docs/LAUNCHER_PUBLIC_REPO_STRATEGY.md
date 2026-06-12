# Launcher Public Repo Strategy

## Purpose

This document formalizes the v0.6-C01 public repository strategy for TransformIA Capsule Launcher.

The goal is to make TransformIA Capsule legible, downloadable later and safe to evaluate from a public repository without exposing private runtime internals, customer material, secrets or proprietary orchestration logic.

## Product role in TransformIA Capsule

TransformIA Capsule Launcher is the public distribution and onboarding shell for TransformIA Capsule. It is responsible for public documentation, local/BYOK guidance, public-safe examples, install-promise boundaries and future download readiness.

The private runtime remains the authority for Work Units, policy enforcement, evidence, approvals, connector execution and execution semantics.

## Public distribution surface

This repository may contain:

- public README and quickstart documentation;
- public-safe launcher strategy documents;
- local/BYOK onboarding guidance;
- public template placeholders and future sanitized examples;
- validators that prevent false claims and private-core leakage;
- future installer and release packaging boundaries when approved.

## Launcher as distribution, not core

The launcher is distribution, not core. It distributes, documents and guides. It must not implement or include private runtime behavior.

Runtime decides. Web renders. Dani approves.

## Private core boundary

The repository must never include private runtime source, Exocortex core implementation, proprietary orchestration logic, production connector credentials, customer workspaces, raw evidence, API keys, payment secrets, internal runbooks, private agent prompts, n8n production workflows, customer data, private repo clone instructions, internal paths or secrets.

Public references may stay conceptual and public-safe. See `docs/PRIVATE_CORE_BOUNDARY.md`.

## Public templates boundary

Public templates are separate from private runtime. They are future generic, sanitized examples that help users understand capsule shape without exposing customer data, private runtime templates, secrets or live connector execution.

C01 defines the boundary only. Future C03 may add public template examples after sanitization and review.

## Local/BYOK onboarding promise

The public strategy is local/BYOK first. Future onboarding should help evaluators bring their own keys safely, keep secrets out of git and understand what the public launcher can and cannot do.

C01 does not add an executable flow. It defines the promise and safety boundary for later implementation.

## Future Cloud handoff

TransformIA Cloud is a future handoff path, not a C01 implementation. This repository may describe the handoff at a public-safe level, but must not implement cloud sync, auth, database persistence, telemetry, payment, Stripe, checkout, customer portal or subscription state unless a later Atlas PR explicitly scopes it and Dani approves.

## Download, README and quickstart roadmap

The roadmap after C01 is incremental:

1. C02 adds README, quickstart and install-promise documentation.
2. C03 may add sanitized public template examples.
3. Later approved PRs may define download packaging, installer documentation and release boundaries.
4. Cloud handoff language remains conceptual until explicitly implemented elsewhere.

## C01 scope

C01 adds strategy and validation only:

- public repository strategy;
- private core boundary;
- public templates boundary;
- install promise boundary;
- C01 release/status record;
- README upgrade from bootstrap-only posture to C01 skeleton;
- zero-dependency validation for C01 claims and repository state.

## Future PR sequence

Next Atlas PR:

```text
v0.6-C02
feat(launcher): add README, quickstart and install promise
```

Potential later work:

- C03 public template examples after sanitization;
- download/readiness documentation;
- installer boundary documentation;
- future Cloud handoff refinement.

## Non-goals

C01 does not build:

- executable launcher;
- installer;
- binary release;
- package release;
- private runtime;
- connector execution;
- public templates beyond placeholder and boundary wording;
- customer data;
- secrets;
- payment, Stripe, checkout or customer portal;
- auth, database, telemetry, analytics or cloud sync;
- live execution.

## Safety boundaries

C01 protects against:

- private core leakage;
- customer material leakage;
- committed secrets;
- binary or installer artifacts;
- false production, install, payment, cloud or connector claims;
- license posture drift;
- duplicate bootstrap strategy documents with overlapping authority.

## IP/license posture

This repository is public source-available, not open source. The operative license remains `LICENSE.md`, and `package.json` must continue to point to `SEE LICENSE IN LICENSE.md`.

Public visibility does not grant production, commercial, redistribution, SaaS, white-label, managed-service, private-runtime or TransformIA branding rights.

## Acceptance criteria

C01 is accepted when:

- the README states the C01 strategy status and next C02 PR;
- strategy, private-core, templates and install-promise boundary docs exist;
- private core remains private;
- public templates are separate from private runtime;
- install promise is clear without claiming an installer;
- license/IP posture remains source-available and protected;
- validators pass without dependencies;
- no secrets, binaries, private runtime code or customer data are introduced;
- no false production, install, payment, cloud or connector claims are introduced.
