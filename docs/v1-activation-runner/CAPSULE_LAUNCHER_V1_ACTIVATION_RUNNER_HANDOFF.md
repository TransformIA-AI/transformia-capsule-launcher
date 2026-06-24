# Capsule Launcher v1 Activation Runner Handoff

## Exact scope

The v1 Activation Runner creates the operational bridge between a public-safe activation pack and a later private Console preview. It stays inside the Launcher repository and produces reviewable local evidence only.

All public output is canonicalized at the Launcher boundary. The runner validates untrusted operator input, rejects unknown activation-pack fields, and writes only allowlisted public shapes. Raw activation packs and caller-supplied doctor details are not serialized directly into evidence.

## What the runner does

- validates a deterministic activation pack;
- prepares a local workspace skeleton under `.capsule-local/v1-activation-runner`;
- runs a governed doctor over repo structure, scripts, fixture files and safety flags;
- generates a deterministic dry-run plan;
- emits a public-safe activation evidence pack;
- emits a future console handoff summary;
- records DAD placeholder metadata for later private authority review.

## What the runner does not do

- No live execution.
- No provider credentials.
- No customer PII.
- No payment capture.
- No outbound messaging.
- No calendar booking.
- No provisioning.
- No deployment.
- No Web changes.
- No Runtime changes.

## Runtime relationship

Runtime remains authority for organizations, workspaces, evidence, governance, approvals and execution semantics. Launcher output can help prepare review state, but dry-run is not permission and candidate state is not execution.

## Web Console relationship

The runner writes `console-handoff-summary.public.json` as a public-safe future console handoff. The Web Console can later consume a private fixture derived from this shape, but this PR does not touch Web and does not add Console code.

## Evidence pack

The evidence pack includes:

- `activationEvidencePackId`
- `activationPackFingerprint`
- doctor status
- dry-run status
- boundary status
- generated artifacts
- blocked live-disabled reason codes
- console handoff summary
- launcher status summary
- DAD placeholder metadata

Required explicit boundaries:

- dry-run is not permission;
- no provider was called;
- no booking was created;
- no payment was captured;
- no outbound message was sent;
- Runtime remains authority;
- no provisioning was performed.

## Future commissioning path

Future provider commissioning must happen in a separate approved PR or private authority flow. That later path must supply reviewed scope, rollback, evidence, approval and secret handling before any external connection can exist.
