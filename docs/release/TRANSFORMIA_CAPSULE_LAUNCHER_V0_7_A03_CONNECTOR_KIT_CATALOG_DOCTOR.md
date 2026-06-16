# TransformIA Capsule Launcher v0.7-A03 Connector Kit Catalog and Doctor

## Purpose

v0.7-A03 adds the public Connector Kit catalog and Install Doctor shell for Capsule Launcher. The capability explains and validates connector kit readiness without becoming runtime authority or connecting real providers.

## Files

- `connectors/README.md`
- `connectors/manifests/*.json`
- `connectors/doctor/doctor-messages.json`
- `connectors/examples/local.config.example.json`
- `scripts/validate-connector-manifests.mjs`
- `scripts/doctor.mjs`

## Primary connectors

- Google Calendar
- WhatsApp Template Manager

Both primary entries are available for Capsule Cloud setup handoff and public manifest validation.

## Secondary/stretch connectors

- HubSpot: secondary, coming soon.
- Calendly: secondary, coming soon.
- Airtable: stretch preview.
- Google Sheets: coming soon.

These are not operational launcher integrations.

## Install Doctor behavior

Install Doctor reads public manifests, Doctor messages and an optional local config path. It prints human-readable guidance for missing local setup, Capsule Cloud handoff and template review. It exits non-zero for structural catalog errors only.

## Local/BYOK vs Capsule Cloud

Local/BYOK remains a safe configuration-shape preview. Real provider connection belongs to Capsule Cloud and the approved runtime path, not this public launcher.

## No-secret posture

The catalog and example config include no credentials, tokens, provider account IDs, tenant IDs, phone numbers, emails or privileged configuration.

## No-provider-call posture

The launcher does not call Google Calendar, WhatsApp, HubSpot, Calendly, Airtable, Google Sheets or any provider API.

## No-live posture

The launcher does not execute connector actions, install workflows, create tenants, persist data, write evidence or run live automations.

## Relationship to runtime v0.7-A01

Runtime v0.7-A01 remains the authority for Connector Registry, ConnectorManifest semantics and Capsule Doctor taxonomy. This launcher publishes public-safe kit manifests and validation only.

## Relationship to web v0.7-A02

Web v0.7-A02 projects the marketplace and Doctor-ready install surface. This launcher supplies public catalog files and local Doctor shell language that can align with that surface without importing web code.

## Next step

The next runtime step is v0.7-B01 OAuth PKCE + Token Vault in runtime. That future work must remain outside this PR unless explicitly approved.
