# Governed deploy, rollback and secret doctors v0.8-A08

Exact Atlas item: `v0.8-A08`.

## Purpose

A08 hardens the A07 managed and self-host local stack bootstrap plans with static, public-safe doctors. It helps an operator review whether the launcher bootstrap plan is safe, reversible and secret-clean before any future governed deployment path.

## Dependency on A07

A08 depends on the A07 bootstrap manifests, examples, schema, stack plan script and A07 validator. If A07 artifacts are missing, A08 must fail rather than invent deployment readiness.

## Governed deploy doctor behavior

`npm run -s doctor:deploy` reads the public A07 managed and self-host bootstrap manifests and reports readiness for operator review. It supports managed and self-host mode filtering. It is no deploy, no provider call, no live execution, no private runtime, no cloud provisioning, no DB, no auth and no telemetry.

## Rollback doctor behavior

`npm run -s doctor:rollback` validates the public rollback plan shape only. It is no rollback, no delete, no mutation, no provider call, no live execution, no private runtime, no cloud provisioning, no DB, no auth and no telemetry.

## Secret checks behavior

`npm run -s secrets:check` scans repository files for secret-like patterns, real `.env` files, private key blocks, webhook URLs and unsafe token-like values. It is no secret manager, no credential prompt, no provider call, no live execution, no private runtime, no cloud provisioning, no DB, no auth and no telemetry.

## Boundary

Launcher validates and explains. Runtime decides. Web renders. Dani approves. A08 does not deploy, rollback, start services, connect providers, execute n8n, read secret stores, include private runtime code or provision cloud infrastructure.

Only a later approved PR may add real deployment, auth, secret manager integration or rollback execution.

## A08 review hardening update

Rollback readiness now requires `rollbackAvailable: true`. A rollback plan that declares rollback unavailable is blocked and cannot produce `rollback_plan_ready_for_operator_review`.
