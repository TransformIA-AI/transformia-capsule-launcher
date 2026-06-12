# TransformIA Capsule Launcher v0.6-C04 Local/BYOK Config Scaffold Status

## Exact Atlas entry

```text
v0.6-C04
feat(config): add local/BYOK config scaffold
```

## Inherited state

- C01 merged in PR #1.
- C02 merged in PR #2.
- C03 merged in PR #3.
- Public manifests exist under `templates/manifests/`.
- Guardrails from issue #4 are folded into `docs/CODEX_PR_AND_VALIDATOR_GUARDRAILS.md`.

## Purpose

C04 makes the public repo feel closer to a future local/BYOK launcher by showing where placeholder configuration will live while keeping the repo declarative, non-executable and private-core protected.

## What this PR adds

- Placeholder-only `.env.example`.
- `config/local-byok.config.example.json`.
- `config/local-byok.config.schema.json`.
- Config folder README.
- Local/BYOK config scaffold documentation.
- BYOK secret-handling boundary documentation.
- Config placeholder schema documentation.
- Codex PR and validator guardrails from issue #4 learnings.
- C04 validator and package quality integration.

## What this PR does not add

- No executable launcher.
- No installer.
- No runtime adapter.
- No provider adapter.
- No LLM call.
- No API client.
- No connector execution.
- No private runtime dependency.
- No real local execution.
- No real BYOK setup.
- No auth, database, Cloud sync, telemetry, payment, Stripe, checkout or customer portal.
- No real secrets.
- No real `.env` credential file.

## Safety boundaries

Private core remains private. Launcher distributes, documents and guides. Runtime decides. Web renders. Dani approves.

C04 allows `.env.example` only as placeholder documentation. Real environment files and real credentials remain forbidden.

## IP/license boundaries

This repository remains public source-available, not open source. C04 does not change `LICENSE.md`, `NOTICE.md`, `docs/IP_AND_LICENSE_BOUNDARY.md` or `AGENTS.md`.

## Validation

C04 validation covers:

- bootstrap context validator;
- C01 public repo strategy validator;
- C02 README/quickstart/install-promise validator;
- C03 public template manifests validator;
- C04 local/BYOK config scaffold validator;
- `npm run -s quality`;
- `git diff --check`;
- `git status --short`.

## Known P1/P2 learnings applied

- `.env.example` is allowed but real `.env` files remain forbidden.
- Claim scans use tracked files in normal git mode.
- Negation is matching-line-only.
- Previous-line context does not exempt positive claims.
- Quality validators validate durable state, not current diff novelty.
- Schema and validator required fields are compared where relevant.
- Public wording does not imply active local execution before implementation.
- Source-available/IP posture remains protected.

## Next PR according to Atlas

```text
v0.6-C05
docs(launch): add Product Hunt, GitHub and X launch assets
```
