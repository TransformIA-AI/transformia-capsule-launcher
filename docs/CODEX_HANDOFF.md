# Codex Handoff

## Read first

1. `AGENTS.md`
2. `README.md`
3. `QUICKSTART.md`
4. `docs/PROJECT_MEMORY.md`
5. `docs/ATLAS_V06C_HANDOFF.md`
6. `docs/AGENT_ORCHESTRATION.md`
7. `docs/SECURITY_AND_PUBLIC_BOUNDARIES.md`
8. `docs/IP_AND_LICENSE_BOUNDARY.md`
9. `docs/DEVELOPMENT_EVIDENCE_LOG_PER_PR_SLICE.md`
10. `docs/LAUNCHER_PUBLIC_REPO_STRATEGY.md`
11. `docs/PRIVATE_CORE_BOUNDARY.md`
12. `docs/PUBLIC_TEMPLATES_BOUNDARY.md`
13. `docs/INSTALL_PROMISE_BOUNDARY.md`
14. `docs/LOCAL_BYOK_QUICKSTART.md`
15. `docs/GIF_PLACEHOLDER_PLAN.md`
16. `docs/CLOUD_HANDOFF_BOUNDARY.md`
17. `docs/README_BADGES_AND_DISCOVERY.md`
18. `docs/release/TRANSFORMIA_CAPSULE_LAUNCHER_V0_6_C02_README_QUICKSTART_INSTALL_PROMISE_STATUS.md`
19. `docs/PUBLIC_TEMPLATE_MANIFEST_SCHEMA.md`
20. `docs/TEMPLATE_MANIFEST_CATALOG.md`
21. `docs/TEMPLATE_SAFETY_REVIEW_CHECKLIST.md`
22. `docs/release/TRANSFORMIA_CAPSULE_LAUNCHER_V0_6_C03_PUBLIC_TEMPLATE_MANIFESTS_STATUS.md`

## Current PR

```text
v0.6-C03
feat(templates): add public Capsule template manifests
```

C03 is docs, manifest-contract, validation and package-script scope. It adds public-safe, non-executable Capsule template manifests without shipping an executable launcher, installer, binary, private runtime, connector execution, payment, auth, DB, telemetry or Cloud sync.

## After merge, next PR

```text
v0.6-C04
feat(config): add local/BYOK config placeholder
```

C04 should add a local/BYOK config placeholder only if Atlas confirms that scope, while keeping secrets and provider configuration out of git.
