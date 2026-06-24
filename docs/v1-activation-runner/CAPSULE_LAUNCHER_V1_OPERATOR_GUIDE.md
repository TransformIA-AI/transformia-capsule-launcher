# Capsule Launcher v1 Operator Guide

## Purpose

The Capsule Launcher v1 Activation Runner prepares a local, public-safe activation workspace for review. It validates an activation pack, runs a governed doctor, prepares a deterministic dry-run plan, emits evidence, and writes a future console handoff summary.

This is launcher productization. It is not Runtime, Web Flagship, provider integration, deployment, checkout, booking, messaging, provisioning or customer workspace execution.

## Commands

Run from the launcher repo:

```powershell
npm run -s capsule:activation:validate
npm run -s capsule:activation:doctor
npm run -s capsule:activation:dry-run
npm run -s capsule:activation:evidence
npm run -s validate:v1-activation-runner
```

Optional local input:

```powershell
npm run -s capsule:activation:validate -- --pack path\to\activation-pack.public.json
npm run -s capsule:activation:evidence -- --output .capsule-local\v1-activation-runner
```

## Inputs

- `activationPackId`
- `tenantDraftId`
- `workspaceRef`
- `organizationRef`
- `template`
- `vertical`
- `planPath`
- `activationMode`
- `runtimeMode`
- `launcherMode`
- `requestedChannels`
- `boundaries`
- `safetyFlags`
- deterministic `generatedAt`

All refs must be safe refs. No provider credentials. No customer PII. No payment capture. No outbound messaging. No calendar booking. No provisioning.

The runner treats the input pack as untrusted operator input. Public outputs are built from a canonical allowlisted activation pack shape; the raw input pack is never written directly. Unknown top-level fields and unknown nested boundary or safety fields fail closed before writer serialization.

`AGENTS.md` now records the current Dani-approved v1 Activation Runner gate. Evidence readiness is recomputed from canonical public surfaces, not caller-supplied override objects. Raw activation packs and raw doctor or evidence overrides are never public output authority.

## Outputs

Generated output is written under `.capsule-local/v1-activation-runner`, which is ignored and must not be committed.

- `activation-pack.public.json`
- `doctor-report.public.json`
- `dry-run-plan.public.json`
- `activation-evidence-pack.public.json`
- `console-handoff-summary.public.json`
- `local-workspace-skeleton.public.json`
- `workspace/config/launcher.config.public.json`
- `workspace/status/activation-status.public.json`
- `workspace/status/doctor-status.public.json`
- `workspace/plans/dry-run-plan.public.json`
- `workspace/evidence/activation-evidence-pack.public.json`
- `workspace/handoff/console-handoff-summary.public.json`

Every generated JSON surface passes the same public-output guard before it is returned or written. That guard scans object keys and values, omits arbitrary operator payload, and blocks URL-shaped, email-shaped, phone-shaped, token-shaped, sensitive-key and live-claim material.

## Boundaries

- dry-run is not permission.
- Runtime remains authority.
- Launcher output is evidence and handoff, not execution.
- Provider commissioning remains a later reviewed step.
- Web Console may later render the future console handoff, but this repo does not modify Web.
- DAD means Deterministic Action Dossier. The runner emits a public-safe DAD placeholder only.
- Doctor reports used for writer output are recomputed or checked at the public boundary; caller-supplied doctor details are not trusted as public evidence.

## Safe demo flow

1. Run validation.
2. Run doctor.
3. Run dry-run.
4. Run evidence generation.
5. Open the generated public JSON files under `.capsule-local/v1-activation-runner`.
6. Explain that every live boundary remains disabled and that Runtime review is still required.
