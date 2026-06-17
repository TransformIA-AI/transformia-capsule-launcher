# v0.7-D03 WhatsApp Template Manager Recipe Pack

## Purpose

This release adds the public Capsule Launcher recipe pack and local install check for WhatsApp Template Manager. The pack describes safe template-readiness capabilities without adding provider calls, message delivery, private runtime code or live workflow installation.

## Files

- `connectors/recipes/whatsapp-template-manager/approved-template-catalog.recipe.json`
- `connectors/recipes/whatsapp-template-manager/check-template-approval.recipe.json`
- `connectors/recipes/whatsapp-template-manager/select-template-for-review.recipe.json`
- `connectors/recipes/whatsapp-template-manager/README.md`
- `connectors/examples/whatsapp-template-manager.local.config.example.json`
- `scripts/validate-connector-recipes.mjs`
- `scripts/doctor.mjs`
- `connectors/recipes/README.md`
- `connectors/README.md`

## Recipes included

- `whatsapp-template-manager.approved-template-catalog`: preview-only approved-template catalog readiness.
- `whatsapp-template-manager.check-template-approval`: contract-only template approval status review.
- `whatsapp-template-manager.select-template-for-review`: approval-gated template selection handoff.

## Relationship to runtime v0.7-D01

Runtime v0.7-D01 remains the authority for real WhatsApp Template Manager behavior, provider verification, policy enforcement, approvals and execution semantics. This launcher release only publishes public-safe recipe metadata.

## Relationship to web v0.7-D02

Web v0.7-D02 may render WhatsApp Template Manager UI surfaces. This launcher release does not import web code or implement UI behavior; it documents recipe availability and local Doctor checks.

## Relationship to launcher v0.7-A03

This pack extends the v0.7-A03 Connector Kit catalog and Install Doctor shell. It depends on the existing WhatsApp Template Manager manifest, Doctor messages and connector validation posture.

## Local config example

`connectors/examples/whatsapp-template-manager.local.config.example.json` shows shape-only local/BYOK recipe validation with a local alias, selected template family, enabled connector, Cloud handoff URL, enabled recipe IDs and template use-case labels.

## Install Doctor behavior

Install Doctor loads manifests, Doctor messages and all recipe files. It confirms the WhatsApp Template Manager recipe pack, validates enabled recipe IDs, checks required local config keys and prints human guidance when local recipe config is incomplete. Missing local config does not prevent structural Doctor checks from running.

## No-secret posture

The pack contains no credentials, privileged configuration, real tenant IDs, provider account IDs or provider identifiers.

## No-provider-call posture

The launcher does not call Meta, poll providers, process callbacks or verify real template approval. Provider verification is completed from Capsule Cloud or the provider.

## No-message-send posture

Approved template catalog review, approval status review and template selection do not send messages. Approved template does not mean sendable, and selected template does not mean outbound dispatch.

## No-live-n8n posture

Recipes are installable descriptions, not n8n workflows. This release does not install live workflows, create callbacks or execute connector actions.

## Next step

The next roadmap step is either v0.7-E01 Restaurant Golden Kit or v0.8 WhatsApp Approval Channel, depending on the approved roadmap sequence.
