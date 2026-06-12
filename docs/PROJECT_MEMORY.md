# TransformIA Capsule Launcher Project Memory

## Current phase

TransformIA is in v0.6: Paid Capsule Launch Foundation.

The previous block, v0.6-B, established pricing, checkout posture, entitlement enforcement, trial/upgrade state, web rendering and billing portal link posture.

This repository starts the next block:

```text
v0.6-C - Public Capsule Launcher and Downloads
```

## Last known merged milestones

- Runtime B05 entitlement enforcement merged in PR #465.
  - Merge commit: `f5f99fbd9da099ed7e0feb12eb64ec80b2a1008d`
- Runtime B06-R trial/upgrade state merged in PR #466.
  - Merge commit: `c502225b0516b46dcdbf7eeb9eea456091a8310f`
  - Merged at: `2026-06-12T02:22:54Z`
- Web B06-W trial/upgrade rendering merged in PR #95.
  - Merge commit: `b8ae3acd6c30825e0aee2f264cbd03d997665aa8`
  - Merged at: `2026-06-12T13:35:18Z`
- Web B07 billing portal link posture merged in PR #96.
  - Merge commit: `9b1875d32146e3f041a36d2dced730633a53636a`
  - Merged at: `2026-06-12T14:07:38Z`

## Next Atlas PR

```text
v0.6-C06
feat(web): add download and launcher CTA surface
```

## Strategic interpretation

The launcher repo is public. The private runtime remains private.

The launcher is the acquisition and distribution surface for local/BYOK users and future Capsule downloads. It should make the product installable and understandable without exposing private runtime logic.

## Non-negotiable boundary

Do not leak private runtime internals into this public repo.

Do not imply production readiness before the installer/download path exists.

Do not implement cloud, Stripe, auth, DB, telemetry, provider execution, connector execution or live automation in C05.


## License posture

The launcher repository is public source-available, not open source.

License source of truth: `LICENSE.md`.

Default rule: all rights reserved except limited evaluation/contribution rights expressly granted in the custom license.

## v0.6-C01 memory

- The TransformIA Capsule Launcher repository was bootstrapped as the public distribution and onboarding surface for the launcher.
- The repository keeps an IP-protected source-available posture through `LICENSE.md`, `NOTICE.md` and `docs/IP_AND_LICENSE_BOUNDARY.md`.
- C01 formalizes the public repo strategy before quickstart, public templates, installer or download work.
- Private core remains private: no private runtime source, customer material, secrets, connector workflows or proprietary orchestration logic belongs here.
- Next C02 should add README, quickstart and install-promise guidance without claiming an installer or exposing private runtime internals.


## v0.6-C02 memory

- C01 merged and formalized the public repo strategy.
- C02 upgrades README, quickstart and install promise docs for day-1 repo usefulness.
- No installer, binary or private runtime exists in this repository yet.
- P1/P2 learnings are embedded into validators: tracked text scanning, matching-line-only negation, PR-base changed-file detection and license/IP posture protection.
- Next C03 should add public Capsule template manifests without private runtime material, customer data, secrets or live connector execution.

## v0.6-C03 memory

- C03 adds a public Capsule template manifest catalog only.
- The five manifests are non-executable, public-safe previews for future launcher/template picker surfaces.
- Private core remains private: no private runtime code, connector execution, customer data, secrets, prompts, raw evidence, payment, telemetry or regulated advice belongs in the manifests.
- C03 keeps source-available/IP posture unchanged.
- Next C04 introduces a local/BYOK config placeholder if Atlas agrees.


## v0.6-C04 memory

- C04 adds local/BYOK config scaffold only.
- `.env.example` is placeholder-only and is not a real credential file.
- No real credentials, provider execution or runtime adapter is introduced.
- Issue #4 lessons are now codified in `docs/CODEX_PR_AND_VALIDATOR_GUARDRAILS.md`.
- Next C05 should add launch assets while keeping public wording honest and source-available/IP safe.


## v0.6-C05 memory

- C05 adds launch copy assets only for Product Hunt, GitHub, X, LinkedIn and future demo narration.
- No posting, submission, analytics, tracking, Product Hunt launch, X thread publication or LinkedIn publication is performed by this repo.
- Launch assets remain source-available/IP-safe and keep private runtime, executable launcher, installer, provider execution, runnable templates, payment, Cloud sync, auth, DB and telemetry out of scope.
- Next C06 connects the web CTA/download surface honestly without claiming unavailable launcher execution.
