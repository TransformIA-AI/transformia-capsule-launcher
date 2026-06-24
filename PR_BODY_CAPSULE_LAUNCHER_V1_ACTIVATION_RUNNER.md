# Capsule Launcher v1 Activation Runner

## Summary

Adds a public-safe local Activation Runner for Capsule Launcher v1. The runner validates a deterministic activation pack, prepares local dry-run artifacts, runs a governed doctor, emits an evidence pack and creates a future console handoff summary.

## What changed

- Added the executable v1 activation runner contract in `src/activation/v1-activation-runner.mjs`.
- Added a public fixture activation pack.
- Added CLI scripts for validate, doctor, dry-run and evidence generation.
- Added a zero-dependency validator for v1 activation runner safety and determinism.
- Added node:test coverage for valid packs, unsafe refs, secret-shaped inputs, missing boundaries, dry-run generation, evidence generation, doctor status and console handoff shape.
- Added operator, handoff and contract docs under `docs/v1-activation-runner`.
- Added `.capsule-local/` to ignored generated output.

## Commands/scripts added

- `npm run -s capsule:activation:validate`
- `npm run -s capsule:activation:doctor`
- `npm run -s capsule:activation:dry-run`
- `npm run -s capsule:activation:evidence`
- `npm run -s validate:v1-activation-runner`

## Safety boundaries

- No live execution.
- No provider credentials.
- No customer PII.
- No payment capture.
- No outbound messaging.
- No calendar booking.
- No provisioning.
- Runtime remains authority.
- dry-run is not permission.
- Launcher output is public-safe evidence and handoff only.

## Tests/validators run

- `npm ci` failed because this repository does not contain `package-lock.json` or `npm-shrinkwrap.json`.
- `npm run -s capsule:activation:validate` passed.
- `npm run -s capsule:activation:doctor` passed.
- `npm run -s capsule:activation:dry-run` passed and wrote ignored local output under `.capsule-local/v1-activation-runner`.
- `npm run -s capsule:activation:evidence` passed and wrote ignored local output under `.capsule-local/v1-activation-runner`.
- `npm run -s typecheck` passed.
- `npm run -s validate:v1-activation-runner` passed.
- `npm run -s test` passed, 26 tests.
- `npm run -s quality` passed.

## Not included

- No provider integration.
- No Web changes.
- No Runtime changes.
- No deployment.
- No payment flow.
- No real booking or messaging.
- No secret handling implementation.

## Risks/trade-offs

- The runner uses deterministic fixture output and local generated files, so future private Console consumption will still need a separate reviewed bridge.
- The doctor is intentionally conservative and blocks on missing scripts, fixture files or boundary flags.
- Generated `.capsule-local/` output is useful for local review but is not committed evidence.

## Follow-up recommendations

- Add private Console fixture consumption in a separate approved Web task.
- Add Runtime-side authority validation in a separate approved Runtime task.
- Capture final review evidence after the PR review loop completes.
