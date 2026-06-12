# Config Placeholder Schema

## Purpose

`config/local-byok.config.schema.json` defines the v0.6-C04 placeholder contract for future local/BYOK configuration.

The schema is strict so the example cannot drift into active provider setup, runtime coupling or secret handling.

## Required top-level fields

- `schemaVersion`: must be `transformia-capsule-local-byok-config.v0.6-c04`.
- `status`: must be `placeholder_only`.
- `configMode`: must be `local_byok_planned`.
- `executable`: must be `false`.
- `providerExecutionEnabled`: must be `false`.
- `privateRuntimeRequired`: must be `false`.
- `secretsRequiredInC04`: must be `false`.
- `envFileRequiredInC04`: must be `false`.
- `localMode`: describes that local mode is planned and not enabled today.
- `providerPlaceholders`: lists generic provider slots with `active: false` and `status: not_configured`.
- `secretHandling`: documents placeholder-only secret boundaries.
- `runtimeBoundary`: keeps private runtime, runtime adapter and connector execution absent.
- `cloudHandoff`: marks future Cloud handoff as planned but not implemented.
- `publicSafe`: must be `true`.

## No-execution flags

The no-execution contract depends on these values:

- `executable: false`.
- `providerExecutionEnabled: false`.
- `localMode.enabledToday: false`.
- `runtimeBoundary.noRuntimeAdapter: true`.
- `runtimeBoundary.noConnectorExecution: true`.

## Local/BYOK planned path

C04 documents where future local/BYOK configuration can live. It does not request keys, create real environment files, configure providers or run capsules locally.

## Future extension rules

Future Atlas work may extend this schema only when the milestone explicitly authorizes the capability. Any extension that accepts secrets, enables provider calls, introduces runtime adapters or changes license/IP posture requires explicit Dani approval and updated validators.
