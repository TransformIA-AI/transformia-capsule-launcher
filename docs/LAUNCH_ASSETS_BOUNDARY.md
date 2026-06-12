# Launch assets boundary

C05 adds draft launch assets for TransformIA Capsule Launcher. These assets help humans prepare Product Hunt, GitHub, X and LinkedIn copy without escalating claims beyond what the repo actually contains.

## What launch assets are

- Draft copy for public review.
- Human-editable messaging material.
- A repository-local record of claim-safe launch positioning.
- A validation target for false launch claims.

## What launch assets are not

- No auto-posting.
- No external submission.
- No Product Hunt submission performed.
- No analytics.
- No tracking.
- No tracking pixels.
- No paid ads.
- No campaign automation.
- No executable launcher.
- No installer.
- No runtime or provider execution.

## Source-available/IP posture

Launch copy must preserve the repository's source-available evaluation license posture. It must not describe the repo as open for unrestricted commercial, SaaS, redistribution, white-label or production use.

The source of truth remains `LICENSE.md`, `NOTICE.md` and `docs/IP_AND_LICENSE_BOUNDARY.md`.

## Private core boundary

Private core remains private. Launch copy may describe the private runtime at a conceptual boundary level only. It must not include private runtime source, schemas, prompts, connector workflows, customer data, raw evidence or proprietary orchestration logic.

## No claim escalation

Launch assets must not turn planned or placeholder surfaces into active capabilities. A claim is unsafe if it implies that this repository already ships capsule execution, an installer, provider setup, runnable templates, Cloud sync, payment, customer portal, auth, DB, telemetry or production readiness.

## Claim review checklist

Before any launch text is copied into a public channel:

- Run `npm run -s quality`.
- Review `launch/claim-safe-messaging-matrix.md`.
- Confirm the text says source-available, not open source.
- Confirm the text says local/BYOK is planned or documented, not executable.
- Confirm the text says template manifests are previews, not runnable templates.
- Confirm the text says the config scaffold is placeholder-only.
- Confirm the text says private runtime is not included.
- Confirm no Product Hunt, X, LinkedIn, analytics or tracking action is implied by repository files.
- Confirm Dani has reviewed the final public wording.
