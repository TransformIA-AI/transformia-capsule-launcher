# Connector Kits

## What this catalog is

This catalog is the public Connector Kit preview for TransformIA Capsule Launcher. It describes which connector capabilities are visible to evaluators, what local configuration shape is expected and which human-readable Doctor messages can explain missing setup.

Connector manifests describe installable capabilities. They do not prove a connector is connected, healthy or installed.

## What this catalog is not

This catalog is not runtime authority. It does not perform provider login, store tokens, call provider APIs, install workflows, create tenants or execute connector actions. The private runtime remains the source of truth for policies, approvals, evidence and execution semantics.

## Primary v0.7 connectors

- Google Calendar: available for Capsule Cloud setup handoff and local manifest validation.
- WhatsApp Template Manager: available for Capsule Cloud setup handoff and template-review guidance.

## Secondary/stretch connectors

- HubSpot: secondary, coming soon.
- Calendly: secondary, coming soon.
- Airtable: stretch preview.
- Google Sheets: coming soon.

These entries are public-safe planning manifests only. They are not provider connections and they do not make operational claims.


## Connector recipes

Recipe packs live in [`connectors/recipes`](recipes/README.md). They extend connector manifests with public-safe installability descriptions and local/BYOK shape checks. A recipe pack being available is not proof that the provider is connected, healthy or deployed.

## WhatsApp Template Manager recipe pack

The WhatsApp Template Manager recipe pack includes approved-template catalog review, template approval status review and approval-gated template selection. These recipes are installable descriptions only: the launcher does not connect WhatsApp, call Meta, store credentials, expose provider identifiers, send messages or enable outbound dispatch.

Run:

```bash
npm run -s validate:connector-recipes
npm run -s doctor connectors/examples/whatsapp-template-manager.local.config.example.json
```

## Google Calendar recipe pack

The Google Calendar recipe pack includes availability review, event-draft handoff and booking-link preparation. These recipes are installable descriptions only: the launcher does not call Google, perform OAuth, store tokens, deploy n8n workflows or create calendar events.

Run:

```bash
npm run -s validate:connector-recipes
npm run -s doctor connectors/examples/google-calendar.local.config.example.json
```

## How Install Doctor works

`npm run doctor` reads the public manifests, Doctor message catalog and an optional local config path. It validates structure and prints customer-readable setup guidance, for example missing local configuration or the need to use Capsule Cloud for provider connection.

Install Doctor does not require real credentials, does not call provider APIs, does not write secrets and exits non-zero only for structural launcher errors.

## Local/BYOK vs Capsule Cloud

Local/BYOK in this launcher means evaluators can inspect the expected configuration shape without committing secrets. Capsule Cloud is the future handoff for real provider connection and governed setup.

The example file at `connectors/examples/local.config.example.json` is shape-only and uses placeholders.

## Security posture

This repo keeps connector kits public-safe:

- Manifests include capability metadata only.
- Customer data and provider payloads do not belong here.
- Runtime internals stay outside this launcher.
- Approval-sensitive actions are declared as requiring approval, not executed.

## No secrets in this repo

Do not commit credentials, tokens, client secrets, provider account IDs, tenant IDs, phone numbers, emails or webhook URLs. The public launcher should remain safe to clone and review.

## No provider calls from this launcher

The launcher validates metadata and explains setup gaps. It does not make network calls, import provider SDKs, submit messages, create calendar events, sync CRM data or create bookings.

## Future v0.7-B OAuth handoff

A later approved runtime milestone can define OAuth PKCE and Token Vault handoff. This launcher only points to the boundary and does not implement the flow.

## Future Restaurant Golden Kit

The Restaurant Golden Kit can use this catalog as public-safe installation language: calendar availability, approved WhatsApp templates and local configuration shape first, with real provider connection handled outside this repo.

## Restaurant Golden Kit

The Restaurant Golden Kit combines Google Calendar recipe references, WhatsApp Template Manager recipe references and restaurant scenario recipes as public launcher metadata. It does not install n8n, call providers, send WhatsApp messages, create calendar events or confirm bookings.

Run:

```bash
npm run -s validate:restaurant-golden-kit-launcher
npm run -s doctor connectors/examples/restaurant-golden-kit.local.config.example.json
```
