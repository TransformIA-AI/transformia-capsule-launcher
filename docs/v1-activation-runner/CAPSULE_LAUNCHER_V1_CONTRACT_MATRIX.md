# Capsule Launcher v1 Contract Matrix

## Activation pack contract

| Field | Required | Rule |
|---|---:|---|
| `activationPackId` | yes | safe ref |
| `tenantDraftId` | yes | safe ref |
| `workspaceRef` | yes | safe ref |
| `organizationRef` | yes | safe ref |
| `template` | yes | allowlisted public template |
| `vertical` | yes | allowlisted public vertical |
| `planPath` | yes | allowlisted review path |
| `activationMode` | yes | dry-run or deterministic fixture mode |
| `runtimeMode` | yes | `runtime_authority_required` |
| `launcherMode` | yes | deterministic launcher mode |
| `requestedChannels` | yes | non-live placeholders only |
| `boundaries` | yes | all required boundary booleans set to true |
| `safetyFlags` | yes | all required safety booleans set to true |
| `generatedAt` | yes | deterministic fixture timestamp |
| `publicSafe` | yes | true |

## Required boundaries

| Boundary | Required value | Meaning |
|---|---:|---|
| `noLiveExecution` | true | dry-run is not permission |
| `noProviderConnection` | true | No provider credentials and no provider call |
| `noSecrets` | true | no private material in the pack |
| `noPaymentCapture` | true | No payment capture |
| `noOutboundMessaging` | true | No outbound messaging |
| `noCalendarBooking` | true | No calendar booking |
| `noProvisioning` | true | No provisioning |
| `runtimeAuthorityRequired` | true | Runtime remains authority |
| `dryRunIsNotPermission` | true | dry-run cannot become live state |
| `publicSafe` | true | safe to review in this public repo |

## Dry-run step shape

Each dry-run step must include:

- `stepId`
- `label`
- `status`
- `reasonCodes`
- `publicSafe`
- `noLiveExecution`
- `evidenceExpected`

Provider-related steps must stay in `requires_provider_commissioning` or another blocked/non-live state. They must not be marked as real provider completion.

## Doctor checks

The governed doctor checks:

- repo and package structure;
- required scripts;
- required fixture files;
- activation pack validity;
- generated output public-safe shape;
- no secrets;
- no provider endpoints;
- no checkout or payment capture;
- no outbound messaging;
- no calendar booking;
- no runtime execution.

## Console handoff shape

The future console handoff includes:

- `launcherStatus`
- `activationReadiness`
- `doctorStatus`
- `evidencePackReady`
- `localWorkspacePrepared`
- `runtimeCommissioningRequired`
- `providerCommissioningRequired`
- `lastDryRunSummary`
- `publicReasonCodes`
- `boundaries`

The handoff is a public-safe bridge shape only. It is not Web Console implementation and not Runtime authority.
