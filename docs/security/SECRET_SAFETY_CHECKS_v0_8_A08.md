# Secret safety checks v0.8-A08

Exact Atlas item: `v0.8-A08`.

## Purpose

The secret safety checker protects the public source-available launcher from accidental secret-like material while keeping A07 bootstrap planning public-safe.

## Dependency on A07

The checker is part of the A08 hardening layer around A07 managed and self-host bootstrap plans. A07 remains plan-only and must not collect credentials.

## Behavior

Run `npm run -s secrets:check` to perform a static repository scan. The checker blocks real `.env` files, private key blocks, webhook URLs, token/API-key-like values, unsafe secret key names outside safe documentation context and raw customer data patterns.

## Boundary

This is no secret manager and no secret store reader. It does not ask for credentials, access vaults, call providers, perform live execution, deploy, rollback, include private runtime, provision cloud infrastructure, use DB clients, implement auth or add telemetry.

Documented placeholders and `.env.example` remain allowed when they are clearly public-safe examples. Real credentials must stay outside Git and outside this launcher repository.

Only a later approved PR may add real deployment, auth, secret manager integration or rollback execution.

Required explicit A08 boundary wording: no deploy, no rollback, no secret manager, no provider call, no live execution, no private runtime, no cloud provisioning, no DB, no auth, no telemetry.

## A08 review hardening update

The A08 validator now executes the real secret safety scan as part of `npm run -s quality`, so quality fails if `runSecretSafetyCheck()` reports blocked findings. The scanner also covers quoted JSON secret keys, YAML-style keys and equals-style keys across camelCase, snake_case and kebab-case forms while preserving placeholder-safe examples.

## A08 file-scan hardening update

Key and certificate file names such as `id_rsa`, `.pem`, `.key`, `.p12`, `.pfx`, `.cer`, `.crt` and `.csr` are treated as blocked credential-bearing files. `.env.example` placeholders remain allowed, but token-like values, private-key blocks and webhook URLs are blocked even when the line contains placeholder or example wording.
