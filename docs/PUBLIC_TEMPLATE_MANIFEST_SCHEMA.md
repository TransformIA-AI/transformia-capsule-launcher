# Public Template Manifest Schema

## Purpose

`templates/manifests/template-manifest.schema.json` defines the public-safe manifest contract for C03 Capsule template previews.

The schema exists so the launcher repository can show concrete template directions without exposing private runtime behavior, customer data, connector payloads, prompts or execution semantics.

## Manifest-only boundary

A manifest is a descriptive contract. It is not executable, not a customer Capsule, not a private runtime template and not a workflow.

C03 does not add a template runner. C03 does not add connector execution. C03 does not add live automation. C03 does not add payment, auth, database, telemetry, Cloud sync or private runtime code.

## Required fields

Every manifest must include:

- `schemaVersion`: `transformia-capsule-template-manifest.v0.6-c03`;
- `templateId`;
- `slug`;
- `displayName`;
- `status`: `public_manifest_only` for C03;
- `category`;
- `targetUser`;
- `businessJob`;
- `valueHypothesis`;
- `day1UserBenefit`;
- `inputs.publicSafeExamples`;
- `inputs.forbiddenData`;
- `outputs.publicSafeOutputs`;
- `outputs.nonGoals`;
- `runtimeBoundary`;
- `connectorBoundary`;
- `dataBoundary`;
- `complianceBoundary`;
- `ipBoundary`;
- `cloudHandoffBoundary`;
- `localByokBoundary`;
- `safetyFlags`;
- `futureImplementationNotes`;
- `publicSafe: true`.

## Safety flags

Every C03 manifest must set these flags to `true`:

- `noPrivateRuntime`;
- `noConnectorExecution`;
- `noCustomerData`;
- `noSecrets`;
- `noRegulatedAdvice`;
- `noPayment`;
- `noTelemetry`;
- `manifestOnly`.

## Forbidden data

Manifest fields must not require or include:

- customer data;
- PII;
- email addresses;
- phone numbers;
- DNI values;
- customer IDs;
- tenant IDs;
- API keys;
- provider keys;
- connector payloads;
- prompt text;
- raw evidence;
- private runtime paths;
- payment or subscription IDs.

## Non-goals

C03 manifests do not provide:

- executable launcher behavior;
- installer behavior;
- binary releases;
- private runtime access;
- connector execution;
- n8n workflows;
- customer workspaces;
- secrets;
- regulated advice;
- payment flows;
- telemetry;
- ROI guarantees;
- compliance certification.

## Future launcher usage

A later launcher surface may render manifests in a picker or catalog. That future surface must continue to label them according to their implemented status and must not imply runtime execution before runtime, connector, data, Cloud and approval boundaries exist.

## Relationship to private runtime

The private TransformIA runtime remains the authority for Work Units, policies, evidence, approvals, enforcement and execution semantics. Public manifests may describe future directions only at a generic, public-safe level.

## Relationship to Cloud handoff

Each manifest includes a `cloudHandoffBoundary` so future Cloud behavior remains an explicit handoff path. C03 does not implement Cloud auth, Cloud sync, tenant state, customer portal, subscription state, payment or Stripe behavior.
