# Product Hunt Launch Kit v0.6

Atlas scope: `v0.6-H02 + v0.6-H07 unified capability pack`.

Purpose: prepare Product Hunt copy for TransformIA Capsule Launcher while preserving source-available, public-safe and private-core boundaries. This kit is a draft for human review. It does not submit, schedule, track or automate a Product Hunt launch.

## Tagline

Governed AI work capsules, starting with a safe public launcher.

## Short description

TransformIA Capsule Launcher is a source-available public repo for evaluating the future local/BYOK path for governed AI work capsules, with safe templates, validation and clear boundaries.

## Long description

TransformIA Capsule Launcher gives builders and operators a clear public entry point for understanding TransformIA Capsule without exposing private core code or customer material.

The repo includes a GitHub README, quickstart validation path, public-safe template manifest previews, local/BYOK posture, launch-readiness docs and validators that block misleading claims. It is designed for clarity before execution: users can inspect the strategy, clone the repo and run checks, while the private core remains outside this repository.

This v0.6 launch kit supports GitHub and Product Hunt-style launch preparation. It does not add executable connectors, provider calls, checkout, auth, telemetry, Cloud sync, installers or private runtime behavior.

## Maker comment

Hi Product Hunt! I am Dani, building TransformIA Capsule.

Most AI products jump straight to demos, agents and automation claims. With TransformIA Capsule Launcher, we are starting from the opposite direction: a public, inspectable launch surface that explains what exists, what does not exist and where the safety boundaries are.

This repo is for people who want governed AI work capsules to become understandable before they become executable. You can clone it, run the validators and review the public-safe templates and local/BYOK posture. The private core is not included, and the launcher does not execute connectors or ask for secrets.

I would love feedback on the clarity of the README, the template directions, the local/BYOK promise and what buyers need to see before trusting an AI work-capsule workflow.

## Gallery slide concepts

1. **Hero:** TransformIA Capsule Launcher as the public entry point for governed AI work capsules.
2. **Clone and validate:** Show the under-five-minute GitHub quickstart and validator output.
3. **Template previews:** Show public-safe manifest cards for lead intake, appointment prep, FAQ knowledge and value review.
4. **Safety boundaries:** Show what the launcher does not do: no secrets, no live connectors, no checkout, no private core.
5. **Upgrade path:** Show local/BYOK posture and future TransformIA Cloud Trial handoff as separate, clearly labelled paths.

## FAQ

### 1. Is this the full TransformIA runtime?

No. This is the public launcher, README, quickstart, template-preview and launch-kit surface. Private core code and proprietary orchestration logic are not included.

### 2. Can I run Capsules from this repo today?

No. The current quickstart validates repository readiness and public-safe documentation. It does not execute Capsules or connectors.

### 3. Is it OSS?

No. It is public source-available under `LICENSE.md`. Review the license before using or redistributing anything.

### 4. Does it require API keys?

No. The current repo does not request credentials. `.env.example` is placeholder-only documentation.

### 5. Does it include customer data or examples from real customers?

No. Customer material, raw evidence, production workflows and privileged configuration do not belong in this repo.

### 6. What are template manifests?

They are public-safe previews that describe future Capsule directions, conceptual inputs and safety boundaries. They are not executable workflows.

### 7. What is local/BYOK?

Local/BYOK means the future posture should let evaluators understand local control and bring-your-own-key boundaries without committing secrets. Provider setup is not implemented here.

### 8. What is the Cloud Trial path?

Cloud Trial is a future handoff direction for hosted onboarding. This repo documents the boundary but does not implement hosted auth, sync, checkout or customer portals.

### 9. Does the launcher automate risky actions?

No. Human approval and governance remain explicit boundaries. This public repo does not authorize dangerous automation.

### 10. Who should look at this?

Founders, operators and technical buyers who want to inspect the public onboarding surface for governed AI work capsules before trusting execution claims.

## First 24h plan

### Before launch

- Re-run `npm run -s validate:launch-docs` and `npm run -s quality`.
- Confirm README badges, license wording and repo links are current.
- Confirm screenshots/GIFs are approved and match implemented public surfaces.
- Confirm the Product Hunt maker comment has Dani approval.
- Confirm no launch copy implies live execution, checkout, Cloud sync or private core inclusion.

### Hour 0-2

- Publish Product Hunt page manually after final human approval.
- Pin the GitHub repo and README link in public posts.
- Reply to early comments with clear boundary language.
- Route technical questions to README, FAQ and docs links.

### Hour 2-8

- Share one concise founder post on X and LinkedIn.
- Ask trusted reviewers for feedback on README clarity and buyer objections.
- Capture recurring questions for a later FAQ update.
- Avoid adding unreviewed capability claims in replies.

### Hour 8-24

- Summarize feedback themes.
- Identify confusing sections in README or FAQ.
- Open follow-up issues for docs improvements only.
- Do not merge launch-day changes without normal review and validation.

## Hunter / maker outreach notes

- Position the launch as a public-safe launcher and clarity milestone, not a runtime launch.
- Ask hunters to highlight trust, boundaries, local/BYOK posture and template previews.
- Do not ask anyone to describe the repo as unrestricted commercial software.
- Do not imply Product Hunt feedback grants approval for unsafe claims.

## Social snippets

### X / short

TransformIA Capsule Launcher is live as a public source-available repo: README, quickstart validation, safe template previews and local/BYOK posture for governed AI work capsules.

### LinkedIn / founder

I am publishing the TransformIA Capsule Launcher public repo: a source-available launch surface for governed AI work capsules. It starts with clarity: what exists, what does not exist, how local/BYOK will be approached and how the private core remains protected.

### Community reply

Thanks for checking it out. The current repo is validation and onboarding docs only: no live connectors, no secrets, no checkout and no private core included. Feedback on README clarity and template usefulness is especially valuable.
