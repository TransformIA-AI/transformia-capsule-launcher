# TransformIA Capsule Launcher FAQ v0.6

Atlas scope: `v0.6-H02 + v0.6-H07 unified capability pack`.

## 1. What is TransformIA Capsule Launcher?

It is the public source-available repo for explaining, cloning and validating the TransformIA Capsule launcher surface.

## 2. What is included today?

README, quickstart docs, public-safe template manifests, local/BYOK posture docs, launch-kit docs and validators.

## 3. What is not included?

Private core code, customer material, raw evidence, production workflows, live connector execution, checkout, auth, telemetry, databases, Cloud sync, installers and binaries are not included.

## 4. Why start with a launcher instead of a full runtime?

The launcher makes the product legible and reviewable before execution claims are made. It separates public onboarding from private execution internals.

## 5. Are templates runnable?

No. Templates are manifest previews only.

## 6. Does the repo ask for secrets?

No. Placeholder examples document where future configuration may live, but real secrets must stay out of Git.

## 7. Is there a Cloud Trial?

Cloud Trial is a future handoff path. This repo documents the boundary only.

## 8. Can this be used commercially?

Review `LICENSE.md`. The repository is source-available evaluation material and does not grant unrestricted commercial, SaaS, white-label, managed-service or redistribution rights.

## 9. How do I validate the repo?

Run:

```bash
npm run -s validate:launch-docs
npm run -s quality
```

## 10. What feedback is most useful?

README clarity, quickstart clarity, template usefulness, launch-page objections, local/BYOK expectations and buyer trust gaps.
