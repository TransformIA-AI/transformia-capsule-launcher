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

## A08 dotfile/config scan update

Common secret-bearing dotfiles and config files are scanned line by line, including `.npmrc`, `.netrc`, `.pypirc`, `kubeconfig`, `Dockerfile` and `Makefile`. Key and certificate files remain blocked as credential-bearing files.

## A08 provider-prefixed and text-source scan update

Provider-prefixed key names such as `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `DATABASE_PASSWORD` and `MY_WEBHOOK_URL` are detected when they appear in assignment-like lines with non-placeholder values. Common text/source/config files such as `.sh`, `.py`, `.ts`, `.tsx`, `.toml`, `.ini` and `.html` are scanned. The scanner remains pattern-based and conservative.

## A08 policy refactor update

Placeholder safety is value-based, not prose/comment-based: comments such as `example` or `must stay outside` do not make a non-placeholder sensitive assignment safe. Standard credential paths such as `.aws/credentials`, `.aws/config`, `.kube/config` and `.docker/config.json` are scanned line by line. The scanner remains static, conservative and inspection-only.

## A08 source declaration scan update

JavaScript and TypeScript source declarations such as `const`, `let`, `var` and `export const` are parsed for sensitive assignment keys. Placeholder-safe source declarations remain allowed, but non-placeholder provider-prefixed assignments are blocked. Standard credential paths such as `.aws/credentials` remain covered.

## A08 Dockerfile ARG/ENV scan update

Dockerfile `ARG KEY=value`, `ENV KEY=value` and `ENV KEY value` forms are parsed for sensitive assignments. `ARG KEY` without a default value is not treated as a leaked secret by itself. Placeholder Dockerfile values remain allowed, and the scanner remains pattern-based and conservative.

## A08 scanner allowlist safety update

Internal validator/scanner allowlists never suppress hard token, private-key, webhook or customer-data findings. Allowlisted scanner or validator fixture lines may only suppress non-hard internal pattern false positives.
