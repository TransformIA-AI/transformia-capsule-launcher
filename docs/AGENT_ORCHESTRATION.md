# Agent Orchestration for TransformIA Capsule Launcher

## Purpose

This document gives Codex and future agents a stable operating pattern for this repo.

## Operating loop

1. Read `AGENTS.md`.
2. Read `docs/PROJECT_MEMORY.md`.
3. Read the relevant Atlas handoff document.
4. Confirm repository identity.
5. State the exact Atlas entry in the PR body.
6. Keep the PR scope narrow.
7. Add or update validators when introducing durable boundaries.
8. Run available checks.
9. Provide a Development Evidence Log.
10. Never auto-merge.

## Repository identity preflight

Before editing, Codex must verify:

- git remote or workspace path contains `transformia-capsule-launcher`;
- package name, if present, is `transformia-capsule-launcher`;
- repo is not `transformia-web-flagship`;
- repo is not `transformia-exocortex-runtime`;
- repo is not `external-pattern-lab-odysseus`.

If wrong, stop.

## Work Unit framing

Every PR should be treated as a Work Unit:

- Goal;
- Source of truth;
- Scope;
- Non-goals;
- Risk boundaries;
- Files changed;
- Validation;
- Handoff.

## Decision protocol

If an agent needs approval for license, dependency, packaging, binary release, network access, auth, payment, telemetry or private-core reference, it must stop and create `DECISION_NEEDED.md`.
