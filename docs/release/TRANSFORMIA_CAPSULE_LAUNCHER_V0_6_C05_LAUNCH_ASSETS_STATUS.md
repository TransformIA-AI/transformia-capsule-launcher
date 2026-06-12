# TransformIA Capsule Launcher v0.6-C05 launch assets status

## Inherited state

- C01 merged: public repo strategy exists.
- C02 merged: README, quickstart and install-promise boundary exist.
- C03 merged: public manifest catalog exists.
- C04 merged: local/BYOK config scaffold exists.
- Quickstart validation exists.
- Public-safe template manifests exist.
- Local/BYOK config scaffold exists as placeholder-only documentation.

## Purpose

C05 makes the public Capsule Launcher repo launch-ready as a copy and validation surface, without claiming execution, install, local/BYOK provider setup, payment, Cloud or private runtime capabilities.

## What this PR adds

- Product Hunt draft copy.
- GitHub launch copy.
- X launch thread draft.
- LinkedIn founder post draft.
- Future demo narrative.
- Launch checklist.
- Claim-safe messaging matrix.
- Launch assets boundary doc.
- C05 launch-asset validator and package script.
- README, handoff and project memory updates.

## What this PR does not add

- No launch execution.
- No Product Hunt submission.
- No X or LinkedIn posting.
- No analytics or tracking.
- No executable launcher.
- No installer, binary, archive or package release.
- No private runtime or Exocortex core.
- No runnable templates.
- No connector execution.
- No provider execution or provider setup.
- No secrets, customer data or private workflows.
- No payment, Stripe, checkout, customer portal, auth, database, telemetry or Cloud sync.

## Safety boundaries

Launch assets are draft copy only. Every launch claim must be reviewed against `launch/claim-safe-messaging-matrix.md` and `docs/LAUNCH_ASSETS_BOUNDARY.md` before public use.

## IP/license boundaries

The repository remains public source-available under `LICENSE.md`. C05 does not change `LICENSE.md`, `NOTICE.md`, `docs/IP_AND_LICENSE_BOUNDARY.md` or `AGENTS.md`.

## Validation

C05 adds `scripts/validate-launcher-c05-launch-assets.mjs` and `validate:launcher-c05-launch-assets`. `npm run -s quality` now runs bootstrap, C01, C02, C03, C04 and C05 validators.

## Known P1/P2 learnings applied

- Claim scans use tracked text files in normal git mode.
- Matching-line-only negation is required.
- Previous-line negation does not suppress a positive claim.
- Quality validators avoid diff-specific novelty requirements.
- Global claim scan is not limited to a C05-only docs allowlist.
- Synthetic regressions cover blocked execution claims, source-available/IP posture, provider setup, template execution and payment claims.

## Next PR according to Atlas

```text
v0.6-C06
feat(web): add download and launcher CTA surface
```
