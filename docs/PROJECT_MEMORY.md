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
v0.6-C01
docs(launcher): define Capsule Launcher public repo strategy
```

## Strategic interpretation

The launcher repo is public. The private runtime remains private.

The launcher is the acquisition and distribution surface for local/BYOK users and future Capsule downloads. It should make the product installable and understandable without exposing private runtime logic.

## Non-negotiable boundary

Do not leak private runtime internals into this public repo.

Do not imply production readiness before the installer/download path exists.

Do not implement cloud, Stripe, auth, DB, telemetry, connector execution or live automation in C01.


## License posture

The launcher repository is public source-available, not open source.

License source of truth: `LICENSE.md`.

Default rule: all rights reserved except limited evaluation/contribution rights expressly granted in the custom license.
