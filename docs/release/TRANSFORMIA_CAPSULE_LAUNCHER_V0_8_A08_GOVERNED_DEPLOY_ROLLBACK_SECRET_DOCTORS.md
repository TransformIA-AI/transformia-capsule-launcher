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
