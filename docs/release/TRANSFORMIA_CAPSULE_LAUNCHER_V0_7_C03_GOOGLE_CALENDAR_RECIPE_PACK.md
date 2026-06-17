# v0.7-C03 Google Calendar Recipe Pack

## Purpose

This release adds the public Google Calendar recipe pack and local Install Doctor checks for TransformIA Capsule Launcher. It makes installability visible without claiming that the launcher connects Google Calendar or performs provider work.

## Files

- `connectors/recipes/google-calendar/*.recipe.json`
- `connectors/recipes/google-calendar/README.md`
- `connectors/recipes/README.md`
- `connectors/examples/google-calendar.local.config.example.json`
- `scripts/validate-connector-recipes.mjs`
- `scripts/doctor.mjs`
- `package.json`
- `connectors/README.md`
- `README.md`

## Recipes included

- `google-calendar.availability-check`: `preview_only` availability summary setup shape.
- `google-calendar.create-event-draft`: `approval_gated` event-draft handoff shape.
- `google-calendar.booking-link-prep`: `contract_only` booking-link preparation shape.

## Relationship to runtime v0.7-C01

Runtime v0.7-C01 remains the authority for Google Calendar connector behavior, provider authentication, governed execution and policy enforcement. This launcher pack only documents public recipe metadata.

## Relationship to web v0.7-C02

Web v0.7-C02 can render Google Calendar setup and availability UI. This launcher pack gives the public repo a matching recipe and Doctor surface, without importing web code.

## Relationship to launcher v0.7-A03

This pack builds on the v0.7-A03 Connector Kit catalog and Install Doctor shell. It adds recipe enumeration, recipe validation and recipe-aware Doctor guidance.

## Local config example

`connectors/examples/google-calendar.local.config.example.json` shows the safe shape for local/BYOK validation: tenant alias, selected template, enabled connector, Cloud handoff URL and enabled recipe identifiers. It contains no secrets or private provider data.

## Install Doctor behavior

Install Doctor loads connector manifests, Doctor messages and all recipe files. It reports recipe pack health, missing recipe configuration, approval posture and Capsule Cloud handoff guidance. If local config is absent, Doctor still runs and prints safe setup guidance.

## No-secret posture

Recipes and examples contain no credentials, provider identifiers, customer records or raw connector payloads.

## No-provider-call posture

The launcher does not call Google, perform OAuth, refresh tokens, create events or complete provider setup.

## No-live-n8n posture

The recipe pack does not deploy n8n workflows, create live webhooks or include n8n execution instructions.

## Approval-gated event creation

The event-draft recipe is explicitly `approval_gated`. It describes a governed handoff shape only and does not create calendar events.

## Next step

Depending on roadmap priority, the next launcher connector milestone can be v0.7-D01 WhatsApp Template Manager recipes or v0.7-E01 n8n recipe autoinstall bridge.
