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
23. `docs/CODEX_PR_AND_VALIDATOR_GUARDRAILS.md`
24. `docs/LOCAL_BYOK_CONFIG_SCAFFOLD.md`
25. `docs/BYOK_SECRET_HANDLING_BOUNDARY.md`
26. `docs/CONFIG_PLACEHOLDER_SCHEMA.md`
27. `docs/release/TRANSFORMIA_CAPSULE_LAUNCHER_V0_6_C04_LOCAL_BYOK_CONFIG_SCAFFOLD_STATUS.md`

## Current PR

```text
v0.6-C04
feat(config): add local/BYOK config scaffold
```

C04 is docs, config-contract, validation and package-script scope. It adds a placeholder-only local/BYOK config scaffold without shipping an executable launcher, installer, binary, private runtime, provider execution, connector execution, payment, auth, DB, telemetry or Cloud sync.

## After merge, next PR

```text
v0.6-C05
docs(launch): add Product Hunt, GitHub and X launch assets
```

C05 should keep launch assets honest, source-available/IP safe and explicit that launcher execution, provider setup, installer packaging and private runtime remain absent until implemented and approved.
