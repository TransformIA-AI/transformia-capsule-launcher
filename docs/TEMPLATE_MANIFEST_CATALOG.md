# Template Manifest Catalog

## Exact Atlas entry

```text
v0.6-C03
feat(templates): add public Capsule template manifests
```

## Catalog boundary

This catalog lists public-safe Capsule template manifests only. They are not executable, do not include the private runtime, do not execute connectors and do not include customer data, secrets, prompts, raw evidence, payment behavior, telemetry or regulated advice.

## Manifests

| templateId | displayName | category | businessJob | day1UserBenefit | Non-executable boundary | Future implementation requirement |
|---|---|---|---|---|---|---|
| `tpl_lead_intake_capsule` | Lead Intake Capsule | `lead_intake` | Structure inbound interest into a reviewable intake before any human follow-up decision. | A visitor sees how a Capsule could turn leads into reviewable work without forms, CRM sync, email send or WhatsApp actions. | Manifest only; not executable and no connector execution. | Requires separate private runtime, approved data boundary and connector review before any live action exists. |
| `tpl_appointment_prep_capsule` | Appointment Prep Capsule | `appointment_prep` | Prepare an agenda and checklist before a human meeting so the reviewer can arrive with clear context. | A visitor sees how a Capsule could prepare a meeting checklist without calendar connector access, invites or automated booking. | Manifest only; not executable and no calendar action. | Requires separate private runtime, approved scheduling/data boundary and connector review before any live action exists. |
| `tpl_faq_knowledge_capsule` | FAQ Knowledge Capsule | `knowledge_faq` | Turn public FAQ and knowledge snippets into a reviewable answer surface for later human approval. | A visitor sees how a Capsule could structure public FAQ snippets without provider calls, a live chatbot or regulated advice. | Manifest only; not executable and no live answer surface. | Requires separate private runtime, approved provider/data boundary and review semantics before any live answer surface exists. |
| `tpl_evidence_value_review_capsule` | Evidence Value Review Capsule | `evidence_value_review` | Show how work evidence could become a value and review summary without storing raw evidence here. | A visitor sees how a Capsule could explain value review structure without raw evidence, legal audit proof or compliance certification. | Manifest only; not executable and no evidence validation. | Requires separate private runtime, approved evidence boundary and review semantics before any live review exists. |
| `tpl_local_byok_starter_capsule` | Local BYOK Starter Capsule | `local_byok_starter` | Explain the future local/BYOK setup path before any provider configuration or secret handling exists. | A visitor sees the future local/BYOK direction without API keys requested, .env creation or provider configuration. | Manifest only; not executable and no provider configuration. | Requires a later approved local/BYOK config placeholder and secret-handling boundary before any provider setup exists. |

## Files

- [`templates/manifests/template-manifest.schema.json`](../templates/manifests/template-manifest.schema.json)
- [`templates/manifests/lead-intake-capsule.manifest.json`](../templates/manifests/lead-intake-capsule.manifest.json)
- [`templates/manifests/appointment-prep-capsule.manifest.json`](../templates/manifests/appointment-prep-capsule.manifest.json)
- [`templates/manifests/faq-knowledge-capsule.manifest.json`](../templates/manifests/faq-knowledge-capsule.manifest.json)
- [`templates/manifests/evidence-value-review-capsule.manifest.json`](../templates/manifests/evidence-value-review-capsule.manifest.json)
- [`templates/manifests/local-byok-starter-capsule.manifest.json`](../templates/manifests/local-byok-starter-capsule.manifest.json)
