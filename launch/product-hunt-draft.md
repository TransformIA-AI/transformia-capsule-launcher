# Product Hunt draft

## Product name

TransformIA Capsule Launcher

## Tagline

A public source-available launcher surface for future local/BYOK governed AI work capsules.

## Short description

TransformIA Capsule Launcher is the public repository for explaining, validating and preparing the future local/BYOK path for governed AI work capsules, without exposing the private TransformIA runtime.

## Problem

Many AI workflow products jump straight from marketing pages to opaque automation claims. Teams evaluating governed AI work need a clearer public boundary: what is visible, what is planned, what remains private and what must not be assumed before execution exists.

## What exists today

- A public source-available launcher repository.
- README and quickstart validation for repository readiness.
- Public-safe template manifest previews.
- A placeholder-only local/BYOK configuration scaffold.
- Boundary docs for private core separation, install promise limits, Cloud handoff and secret handling.
- Validators that block false public claims before they become launch copy.

## What does not exist yet

- No executable launcher yet.
- No installer, binary, archive or package release yet.
- No local capsule execution in this repository.
- No configured provider path.
- No runnable public templates.
- No private runtime or Exocortex core included.
- No connector execution.
- No payment, Stripe, customer portal, auth, database, telemetry, analytics or Cloud sync.

## Audience

- Builders evaluating governance-first AI product surfaces.
- Operators who want local/BYOK clarity before runtime adoption.
- SMEs and enterprise teams that need honest boundaries before trusting automation.
- Developers who want to inspect public manifests and validation posture before future launcher work lands.

## First comment draft by founder

Thanks for checking out TransformIA Capsule Launcher.

I am building TransformIA Capsule around a simple boundary: public docs should make adoption legible, while the private runtime stays protected until the governed execution path is ready.

This repo is not a runtime release. It is the public launcher surface: README, quickstart validation, public-safe template manifests, a placeholder local/BYOK config scaffold and launch-safe messaging. The goal is to let builders and operators inspect the direction early without pretending execution exists before it does.

Feedback I would value most:

- Is the local/BYOK path understandable?
- Are the private-core boundaries clear enough?
- Which template manifest categories are most useful for SMEs and operators?
- What would you need to see before trusting a future governed launcher?

## Makers notes

- Keep the launch copy source-available/IP-safe.
- Say what exists today and what remains planned.
- Do not imply runtime execution, provider setup, active Cloud sync or payment flows.
- Link to the repository only after Dani reviews the final public wording.

## FAQ

### Is this the TransformIA runtime?

No. The private runtime and Exocortex core are not included.

### Can people execute capsules from this repo today?

No. This repo currently documents and validates the public launcher path. It does not ship capsule execution.

### Are the templates runnable?

No. The public files are manifest-only previews for future template directions.

### Is this repo source-available?

Yes. It uses the custom source-available evaluation license in `LICENSE.md`. Public visibility does not grant production, commercial, SaaS, redistribution or white-label rights.

### Is Product Hunt submission already done?

No. This is a draft for human review only.

## Launch checklist

- Re-run `npm run -s quality`.
- Review `launch/claim-safe-messaging-matrix.md`.
- Confirm C04 local/BYOK config scaffold is present.
- Confirm no secrets, binaries, analytics or tracking parameters were added.
- Confirm Dani approval before posting or submission.
