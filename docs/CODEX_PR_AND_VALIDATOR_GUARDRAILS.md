# Codex PR and Validator Guardrails

## Purpose

This document turns repeated review lessons from issue #4 into durable repository context for future Codex runs.

It supplements `AGENTS.md`; it does not weaken `AGENTS.md`, `LICENSE.md`, `NOTICE.md` or `docs/IP_AND_LICENSE_BOUNDARY.md`.

## Atlas-first scope

Every PR must start from the exact Atlas entry and preserve one capability per PR.

Required interpretation before implementation:

1. Exact Atlas entry.
2. What the PR builds.
3. What the PR does not build.
4. Safety boundaries.
5. Files allowed.
6. Validators.
7. Acceptance criteria.

Do not invent PR scope from review comments, local convenience or inferred roadmap pressure. If the Atlas entry does not authorize a capability, keep it out or create `DECISION_NEEDED.md` when Dani approval is required.

## Prompt rules

- Treat user-provided PR scope, allowed files and non-goals as binding unless they conflict with higher-priority instructions.
- Preserve the core rule: Private core remains private. Launcher distributes, documents and guides. Runtime decides. Web renders. Dani approves.
- Do not add dependencies, network calls, private runtime code, provider calls, connector execution, auth, DB, telemetry, payment or release artifacts unless explicitly scoped and approved.
- Capture review feedback in repo docs or validators when the feedback affects future safety, not only in chat memory.

## Validator design rules

- Quality validators validate durable repository state, not PR novelty.
- Quality validators must not require the current diff to contain milestone files that already exist after merge.
- Changed-file detection must be PR-base aware when git is available.
- Claim scans use tracked text files in normal git mode; fallback walking is only for non-git or fresh-repo contexts.
- Claim scans must not union tracked files with untracked scratch files in normal git mode.
- Negation checks are matching-line-only.
- Previous-line or context-window negation must not exempt a positive claim.
- Validators should include self-checks or synthetic regressions for known P1/P2 classes when practical.
- Validators must protect durable repository state and should scan future tracked docs, not only a hard-coded milestone allowlist.

## Claim and overclaim rules

Public wording must not imply active execution before implementation.

Keep these boundaries explicit:

- No executable launcher until implemented and approved.
- No installer until implemented and approved.
- No provider execution until implemented and approved.
- No runtime adapter until implemented and approved.
- No connector execution until implemented and approved.
- No Cloud sync, telemetry, auth, database, payment, Stripe, checkout, portal or subscription implementation until implemented and approved.
- No private runtime inclusion claim.
- No production-readiness, compliance-certification or ROI-guarantee claim.

Safe public wording should describe placeholders, planned paths, readiness boundaries and future handoffs without promising unavailable capability.

## Schema and contract validation rules

- Schema-required fields must be fully validated.
- Validators must compare schema required fields and validator required fields where relevant.
- Strict placeholder contracts should use `additionalProperties: false` when the shape is intended to be closed.
- Boolean safety flags must be validated by value, not only by existence.
- Const/enum values in schemas must be reflected in validator expectations.
- Example files must be parsed and checked against the contract fields that matter for safety.

## License and IP protection rules

This repository is public source-available, not open source.

Do not weaken source-available/IP posture. Do not add permissive, copyleft, public-domain, free-commercial-use, SaaS-use, white-label or redistribution language without explicit Dani approval.

`package.json` must keep `"license": "SEE LICENSE IN LICENSE.md"`.

## Review-feedback learning loop

When review identifies a recurring P1/P2 risk, fold the lesson into at least one durable place:

- a validator self-check;
- a boundary document;
- project memory;
- handoff instructions;
- a release/status document.

Do not rely on a single chat thread to preserve safety lessons.

## PR-body evidence requirements

PR bodies or PR comments should include a Development Evidence Log with:

- Task title.
- Agent/tool.
- Repository.
- Branch.
- Base.
- Commit.
- PR number if available.
- Changed files.
- Scope classification.
- Human intent summary.
- Prompt summary.
- Implementation summary.
- Commands executed.
- Check results.
- Files intentionally not touched.
- Non-goals.
- Boundary/claim checks.
- Known risks.
- Trade-offs.
- Follow-up recommendations.
- Human merge decision pending.

## Known repeated anti-patterns

- Quality validator requiring current PR diff novelty.
- Claim scan over untracked scratch files.
- Previous-line/window negation bypass.
- Incomplete schema validation.
- Active capability wording before implementation.
- Source-available repo must not be described as open source.
