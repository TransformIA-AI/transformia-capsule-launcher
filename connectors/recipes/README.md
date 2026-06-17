# Connector Recipes

Connector recipes are public-safe capability descriptions for TransformIA Capsule Launcher. They explain which installable recipe shapes exist without proving provider connection or workflow deployment.

## Relationship to Connector Manifests

Every recipe is scoped to a connector manifest under `connectors/manifests`. Recipe actions must bind to actions declared by that manifest, and Doctor message references must resolve to the public Doctor message catalog.

## Relationship to Capsule Cloud

Capsule Cloud remains responsible for real provider connection, governed health state and setup completion. Recipes can point to Cloud handoff requirements, but the launcher does not complete authentication or provider setup.

## Relationship to n8n Autoinstall

Recipes are not n8n workflows. They do not install workflows, create live webhooks or call provider APIs. A future approved bridge may use recipe metadata as public-safe input.

## Current recipe packs

- [Google Calendar Recipe Pack](google-calendar/README.md): availability review, event-draft handoff and booking-link preparation.
- [WhatsApp Template Manager Recipe Pack](whatsapp-template-manager/README.md): approved-template catalog, approval status review and approval-gated template selection handoff.

## Security posture

Recipe packs must be connector-scoped, template-scoped and public-safe. Unknown extra recipe files are scanned by `npm run -s validate:connector-recipes`.

## No secrets in recipes

Recipes must not contain credentials, provider identifiers, customer records, raw payloads, live webhook configuration or private runtime behavior.
