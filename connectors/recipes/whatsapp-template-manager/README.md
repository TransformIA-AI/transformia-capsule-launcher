# WhatsApp Template Manager Recipe Pack

These recipes describe installable template-management capabilities. They do not prove WhatsApp is connected, that a template is approved by the provider, or that any message can be sent.

## What this pack enables

- Public-safe discovery of approved-template readiness shape.
- Template approval status review language for local/BYOK validation.
- Selection of a template category for governed review before Cloud/runtime verification.
- Doctor guidance for pending or rejected template states.

## What this pack does not do

- It does not send WhatsApp messages or enable outbound delivery.
- It does not call Meta, poll providers, process callbacks or install live workflows.
- It does not include provider identifiers, template bodies, customer phone data or credentials.

## Required connector

This pack requires the public `whatsapp-template-manager` connector manifest in `connectors/manifests/whatsapp-template-manager.json`.

## Required Capsule Cloud handoff

Real provider verification, provider-side template approval and setup completion remain Capsule Cloud/runtime responsibilities. The launcher only validates public metadata and local configuration shape.

## Local/BYOK setup shape

Use `connectors/examples/whatsapp-template-manager.local.config.example.json` as a safe example. It contains only a local alias, selected public template family, enabled recipe IDs, use-case labels and a Cloud handoff URL.

## Recipes included

- `whatsapp-template-manager.approved-template-catalog`: preview-only catalog readiness description.
- `whatsapp-template-manager.check-template-approval`: contract-only approval status description.
- `whatsapp-template-manager.select-template-for-review`: approval-gated template selection handoff.

## Approval posture

Template selection is review-first. Human approval and Capsule Cloud/runtime verification are required before any operational provider action can exist outside this launcher.

## Why approved does not mean sent

A provider-approved template only means the provider may have accepted that template for a separate account context. It does not prove the launcher has a provider connection, usable credentials, recipient consent, delivery eligibility or governed runtime approval.

## Security posture

The pack is connector-scoped, template-scoped and public-safe. Recipes include no credentials, no provider calls, no live execution, no live workflow install, no callbacks, no real tenant data and no raw customer data.

## Future WhatsApp Approval Channel handoff

A future approved roadmap item may add a WhatsApp Approval Channel handoff. That future work must remain explicit, reviewed and separate from this recipe pack.
