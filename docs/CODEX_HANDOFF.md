# Codex Handoff

## Read first

1. `AGENTS.md`
2. `README.md`
3. `docs/PROJECT_MEMORY.md`
4. `docs/ATLAS_V06C_HANDOFF.md`
5. `docs/AGENT_ORCHESTRATION.md`
6. `docs/SECURITY_AND_PUBLIC_BOUNDARIES.md`
7. `docs/IP_AND_LICENSE_BOUNDARY.md`
8. `docs/DEVELOPMENT_EVIDENCE_LOG_PER_PR_SLICE.md`
9. `docs/LAUNCHER_PUBLIC_REPO_STRATEGY.md`
10. `docs/PRIVATE_CORE_BOUNDARY.md`
11. `docs/PUBLIC_TEMPLATES_BOUNDARY.md`
12. `docs/INSTALL_PROMISE_BOUNDARY.md`

## Current PR

```text
v0.6-C01
docs(launcher): define Capsule Launcher public repo strategy
```

C01 is docs and validation strategy. It does not ship an installer, executable, private runtime, templates, connector execution, payment, auth, DB, telemetry or cloud sync.

## After merge, next PR

```text
v0.6-C02
feat(launcher): add README, quickstart and install promise
```

C02 should build on the C01 public repo strategy and keep the private core boundary intact.
