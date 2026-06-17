# Google Calendar Recipe Pack

These recipes describe installable capabilities. They do not prove Google Calendar is connected, healthy, or able to create events.

## What this pack enables

- Public-safe visibility of Google Calendar setup recipes for availability review, event-draft handoff and booking-link preparation.
- Local/BYOK shape validation for launcher users who want to inspect required keys before Capsule Cloud setup.
- Install Doctor guidance that explains missing local configuration without exposing secrets.

## What this pack does not do

- It does not perform OAuth, store tokens, call Google, create events, create tenants or deploy workflows.
- It does not prove a provider account is authenticated.
- It does not include customer data, provider payloads or private runtime code.

## Required connector

This pack requires the public `google-calendar` connector manifest in `connectors/manifests/google-calendar.json`.

## Required Capsule Cloud handoff

Capsule Cloud remains responsible for real provider connection, governed status and recovery guidance. The launcher only points to that boundary through a public setup URL shape.

## Local/BYOK setup shape

Use `connectors/examples/google-calendar.local.config.example.json` as a shape-only example. It contains a tenant alias, selected template, enabled connector, Cloud handoff URL and enabled recipe identifiers. It intentionally excludes credentials, provider identifiers and customer records.

## Recipes included

| Recipe | Action mode | Approval posture |
|---|---|---|
| `google-calendar.availability-check` | `preview_only` | Local preview shape only. |
| `google-calendar.create-event-draft` | `approval_gated` | Human approval is required before any future governed event action. |
| `google-calendar.booking-link-prep` | `contract_only` | Contract description only. |

## Approval posture

Event creation is approval-gated. The launcher does not approve, execute or bypass governance for calendar changes.

## Security posture

Recipes are public-safe metadata. They include no secrets, no provider calls, no live execution, no workflow deployment and no real tenant data.

## Future n8n autoinstall handoff

A future approved autoinstall bridge may translate reviewed recipes into deployment instructions. This pack does not deploy n8n workflows or include live webhook configuration.
