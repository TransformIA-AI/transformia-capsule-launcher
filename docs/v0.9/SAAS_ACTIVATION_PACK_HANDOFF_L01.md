# v0.9-L01 SaaS Activation Pack Handoff

## Purpose

L01 turns public activation intent from `/diagnostico`, `/start`, `/capsule`, `/capsule/pricing` or `/capsule/demo` into a deterministic, reviewable, public-safe Activation Pack. It closes the Launcher-side activation handoff for v0.9 without introducing live provisioning.

## Authority boundary

- Launcher plans, validates and guides. It creates drafts, checklists, summaries, manifests and checksums.
- Web renders, explains and converts. Public web intent is non-authoritative input only.
- Runtime decides, validates and governs. Runtime remains the authority for organizations, workspaces, RBAC, usage/billing ledger, plan entitlements, BYOK readiness, memory retrieval, policy and execution.

## Threat model, bypass matrix and fail-closed rules

L01 treats public intent as untrusted. It blocks sensitive refs, URL-shaped refs, secret-shaped content, quarantined routes, unsupported plans, region assumptions, BYOK secret material and checklist blockers. Trial intent cannot become a paid activation, instant provisioning or go-live approval. Managed paths never imply provider access.

## Activation pack structure

The pack includes the selected operating path, organization/workspace draft, plan/trial draft, BYOK readiness posture, region and locale posture, Portal Vivo or Capsule template choice, commissioning checklist, human review requirements, blocked versus ready states, public-safe summary, validation report, file manifest, stable fingerprint and v0.9 freeze-candidate evidence note.

## Generated files

- `activation-intent.public.json`
- `organization-workspace-draft.public.json`
- `plan-trial-draft.public.json`
- `byok-readiness.public.json`
- `commissioning-checklist.public.json`
- `activation-pack.public.json`
- `validation-report.public.json`
- `v0.9-freeze-candidate.public.json`
- `README_ACTIVATION_PACK.md`

## How to use the fixture

Import executable helpers from `src/activation/saas-activation-pack-handoff.mjs` and `src/activation/saas-activation-pack-writer.mjs`. Use `buildCaseZeroActivationIntentFixture()` to create the deterministic Case Zero intent. Then call `buildSaaSActivationPack(intent)`, inspect `validationReport`, and only use the pack as operator-review evidence. The optional writer revalidates the current pack object at write time, checks the fresh `validationReport.ok` before serializing, writes only the allowed public files under an explicit normalized output directory, and blocks traversal. No public activation pack file may be produced unless the current pack object passes final validation at write time.

## Write-time finalization invariant

The writer treats the incoming pack as mutable and untrusted. Before any public serialization, it finalizes a cloned current pack, revalidates every serialized public surface, recomputes the validation report, recomputes the public-safe summary from that final report, and recomputes the fingerprint from the final serialized content. Blocked or mutated unsafe packs write zero files.

## How to validate

Run:

```bash
npm run -s validate:v09-saas-activation-pack-handoff
npm run -s validate:v09-freeze-candidate
```

## Why this is not live provisioning

L01 does not call providers, runtime, web, databases, auth, payment, analytics or CRM systems. It does not write secrets, execute connectors, create tenants, activate trials, purchase plans or go live. Every pack keeps `humanReviewRequired: true` and `readyForGoLive: false`.

## Freeze preparation

L01 creates Launcher-side activation handoff evidence. It prepares the freeze candidate by proving the public handoff can be generated, validated, fingerprinted and reviewed without private-core leakage or live side effects.

## After v0.9 freeze

Post-freeze work may connect this handoff to approved operator workflows only after Dani approval, runtime authority checks, cross-repo evidence and explicit implementation PRs for any live capability.
