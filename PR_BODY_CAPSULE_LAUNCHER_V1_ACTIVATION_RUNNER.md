# Capsule Launcher v1 Activation Runner

## Exact Atlas Entry / Dani Approval

Approved working Atlas entry:

```text
Capsule Launcher v1 Activation Runner:
Launcher prepares, validates, diagnoses and emits local public-safe evidence for a future Capsule activation handoff.

Bridge:
Console private preview / Activation Pack
-> Launcher local
-> Doctor
-> Dry-run
-> Evidence Pack
-> Future Console/Runtime handoff.

Runtime decides.
Launcher prepares/verifies/emits public-safe evidence.
Web remains separate.
Dani explicitly approved this out-of-sequence v1 gate.
```

Dani explicitly approved updating `AGENTS.md` / AgentCMD in this PR so the repository boundary reflects the current v1 Activation Runner gate instead of the previous v0.6-C01 focus.

## Summary

Adds a public-safe local Activation Runner for Capsule Launcher v1. The runner validates a deterministic activation pack, prepares local dry-run artifacts, runs a governed doctor, emits an evidence pack and creates a future console handoff summary.

## Why This Gate Exists

This v1 gate bridges Console private preview, Activation Pack, Launcher local validation, Doctor, Dry-run, Evidence Pack and a future Console/Runtime handoff while keeping Runtime authority intact.

## What changed

- Updated `AGENTS.md` / AgentCMD to record the Dani-approved v1 Activation Runner gate.
- Added `docs/v1-activation-runner/CAPSULE_LAUNCHER_V1_SCOPE_APPROVAL.md`.
- Added the executable v1 activation runner contract in `src/activation/v1-activation-runner.mjs`.
- Added a public fixture activation pack.
- Added CLI scripts for validate, doctor, dry-run and evidence generation.
- Added a zero-dependency validator for v1 activation runner safety and determinism.
- Added canonical public file schema validation at the writer boundary, string/numeric phone-like blocking, semantic boundary-value checks, forbidden operational-claim scanning and sanitized CLI summaries that do not echo raw output roots.
- Added writer-level guards for handoff readiness versus doctor status, inconsistent doctor reports, root/workspace alias drift, cross-file doctor/handoff status mismatches and preexisting symlink path segments under the output root.
- Added adversarial tests for unsafe refs, object keys, secret-shaped values, sensitive key names, live claims, phone-like values, false boundary values, canonical public outputs, hostile evidence payloads, unsafe CLI output roots and canonical writer consistency bypasses.
- Added operator, handoff and contract docs under `docs/v1-activation-runner`.
- Added `.capsule-local/` to ignored generated output.

## Commands/scripts added

- `npm run -s capsule:activation:validate`
- `npm run -s capsule:activation:doctor`
- `npm run -s capsule:activation:dry-run`
- `npm run -s capsule:activation:evidence`
- `npm run -s validate:v1-activation-runner`

## Safety boundaries

- Runtime decides.
- Launcher prepares, validates, diagnoses and emits public-safe local evidence.
- Web renders later in a separate PR.
- No live execution.
- No provider credentials or provider calls.
- No customer PII.
- No payment, Stripe or checkout.
- No outbound messaging.
- No calendar booking.
- No provisioning.
- No n8n execution.
- Dry-run is not permission.
- Public-safe summary is not authority.

## Tests/validators run

- `npm run -s capsule:activation:validate` passed.
- `npm run -s capsule:activation:doctor` passed.
- `npm run -s capsule:activation:dry-run` passed and wrote ignored local output under `.capsule-local/v1-activation-runner`.
- `npm run -s capsule:activation:evidence` passed and wrote ignored local output under `.capsule-local/v1-activation-runner`.
- `npm run -s typecheck` passed.
- `npm run -s validate:v1-activation-runner` passed.
- `npm run -s test` passed, 97 tests, 97 pass, 0 fail.
- `npm run -s quality` passed.
- `git diff --check` passed.

## Not included

- No Web Flagship changes.
- No Runtime changes.
- No private runtime code.
- No provider integration.
- No deployment.
- No payment flow, Stripe or checkout.
- No real booking or messaging.
- No n8n execution.
- No outbound messaging.
- No provisioning.
- No secrets or `.env` changes.

## Risks/trade-offs

- The runner uses deterministic fixture output and local generated files, so future private Console consumption still needs a separate reviewed bridge.
- The doctor is intentionally conservative and blocks on missing scripts, fixture files or boundary flags.
- Generated `.capsule-local/` output is useful for local review but is not committed evidence.

## Follow-up recommendations

- Add private Console fixture consumption in a separate approved Web task.
- Add Runtime-side authority validation in a separate approved Runtime task.
- Capture final review evidence after the PR review loop completes.
