# TransformIA Capsule Launcher v0.8-A08 governed deploy, rollback and secret doctors

Exact Atlas item: `v0.8-A08`.

## Purpose

This release note documents the A08 hardening layer around A07 stack bootstrap planning. A08 adds inspection-only doctors for governed deploy readiness, rollback plan readiness and repository secret safety.

## Dependency on A07

A08 requires the A07 managed and self-host local stack bootstrap artifacts. The A08 validator checks those files before accepting the new doctors.

## Capability summary

- Governed deploy doctor reviews A07 public bootstrap manifests and rollback-plan presence.
- Rollback doctor validates rollback plan shape and human-approval flags.
- Secret safety checks scan public repo files for secret-like material.
- Unified validator gates files, scripts, docs, schemas, examples, package scripts and safety boundaries.

## Safety boundaries

A08 is no deploy, no rollback, no secret manager, no provider call, no live execution, no private runtime, no cloud provisioning, no DB, no auth and no telemetry. It does not start Docker, execute n8n, connect providers, mutate config, delete files or certify production readiness.

Only a later approved PR may add real deployment, auth, secret manager integration or rollback execution.

## A08 review hardening update

- The A08 validator executes the real secret safety scan during quality.
- Secret safety checks detect quoted JSON secret keys as well as YAML-style and equals-style key forms.
- Rollback readiness requires `rollbackAvailable: true`; `false` blocks readiness.

## A08 file-scan and rollback validator hardening

- Key and certificate files are blocked as credential-bearing files.
- `.env.example` placeholder lines remain allowed, but real token-like values, private-key blocks and webhook URLs are blocked.
- The A08 validator fails if the checked-in rollback doctor report is not OK or contains blockers.

## A08 dotfile/config secret scan hardening

- Common secret-bearing dotfiles and config files are scanned, including `.npmrc`, `.netrc`, `.pypirc`, `kubeconfig`, `Dockerfile` and `Makefile`.
- Key and certificate files remain blocked as credential-bearing files.

## A08 provider-prefixed and text-source secret scan hardening

- Provider-prefixed key names are detected in assignment-like contexts when values are not placeholder-safe.
- Common text/source/config files are scanned, including `.sh`, `.py`, `.ts`, `.tsx`, `.toml`, `.ini` and `.html`.
- The scanner remains pattern-based and conservative.

## A08 secret policy and rollback evidence hardening

- Placeholder safety is now value-based rather than prose/comment-based.
- Standard credential paths such as `.aws/credentials` are scanned line by line.
- Rollback readiness requires non-empty rollback steps, expected evidence and operator next steps.

## A08 source assignment and rollback schema hardening

- JavaScript and TypeScript `const`, `let`, `var` and exported source declarations are scanned for sensitive assignments.
- `rollbackAvailable` is schema-constrained to `true`.
- `.aws/credentials` and standard credential paths remain covered by validator regressions and negative checks.

## A08 Dockerfile ARG/ENV secret scan hardening

- Dockerfile `ARG KEY=value`, `ENV KEY=value` and `ENV KEY value` secret-bearing assignments are detected.
- `ARG KEY` without a default value is not blocked solely by key name.
- Placeholder Dockerfile values remain allowed.
