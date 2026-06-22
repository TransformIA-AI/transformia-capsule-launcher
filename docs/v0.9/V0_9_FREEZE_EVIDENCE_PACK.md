# v0.9 Freeze Evidence Pack

## Executive decision

- **Status:** `freeze_candidate_pending_external_evidence`.
- **Global freeze declaration:** not declared by this repository.
- **Reason:** Launcher L01 evidence is present in this repository, but Web W01-W05 and Runtime B01-B05 evidence must be verified from their owning repositories or manual audit records before v0.9 can be declared `freeze_ready`.

This pack is evidence control, not feature implementation. It prevents optimistic freeze claims when required cross-repo proof is not available in the public Launcher repository.

## Scope

- **Release target:** v0.9 Self-Service Cloud & Private Workspace.
- **Purpose:** make TransformIA operable as SaaS, not just a demo.
- **Repository role:** Capsule Launcher records public-safe Launcher evidence and points to external proof required from Web and Runtime.

## Evidence status taxonomy

| Status | Meaning |
|---|---|
| `verified` | Required artifact and validation proof are available and reviewed. |
| `present_unverified` | Artifact is referenced or present, but proof is incomplete. |
| `missing` | Required artifact is absent from accessible evidence. |
| `blocked` | Evidence indicates the item cannot satisfy freeze requirements. |
| `pending_external_evidence` | Evidence is owned outside this repository and must be supplied separately. |
| `not_applicable` | Item is not required for this freeze decision. |

## Required proof fields per item

Each required item must record:

- `repo`
- `expected artifact`
- `observed artifact`
- `PR number or merge commit if known`
- `validation command`
- `status`
- `notes`
- `blocker if not verified`

## Required evidence matrix

| Area | Item | Expected artifact | Observed artifact | PR or merge commit if known | Validation command | Status | Notes | Blocker if not verified |
|---|---|---|---|---|---|---|---|---|
| WEB | W01 Self-Service Private Workspace Shell | Web PR, route evidence, smoke output | Not stored in Launcher | Pending external Web evidence | Web-owned smoke command | `pending_external_evidence` | Web evidence must come from Web repo or deployment audit. | External Web proof required. |
| WEB | W02 SaaS Product Landing + Pricing + Trial CTA | Web PR, pricing/trial CTA audit, smoke output | Not stored in Launcher | Pending external Web evidence | Web-owned smoke command | `pending_external_evidence` | Must prove public-safe pricing and trial CTA without purchase/provisioning overclaim. | External Web proof required. |
| WEB | W03 Onboarding Wizard & Capsule Activation Flow | Web PR, activation flow audit, smoke output | Not stored in Launcher | Pending external Web evidence | Web-owned smoke command | `pending_external_evidence` | Must prove guided activation surface without claiming automatic provisioning. | External Web proof required. |
| WEB | W04 Portal Vivo WOW Demo Surface | Web PR, deployed demo smoke, screenshots if needed | Not stored in Launcher | Pending external Web evidence | Web-owned smoke command | `pending_external_evidence` | Must prove public demo surface without exposing quarantined routes as CTA. | External Web proof required. |
| WEB | W05 Billing, Usage & BYOK UI Preview | Web PR, UI audit, smoke output | Not stored in Launcher | Pending external Web evidence | Web-owned smoke command | `pending_external_evidence` | Must remain preview/clarity unless provider integrations are separately verified. | External Web proof required. |
| RUNTIME | B01 Organizations / Workspaces / Memberships / RBAC | Runtime PR or audit evidence | Not stored in Launcher | Pending external Runtime evidence | Runtime-owned audit command | `pending_external_evidence` | Runtime is source of truth for authority and membership semantics. | External Runtime proof required. |
| RUNTIME | B02 Usage / Metering / Billing Ledger | Runtime PR or audit evidence | Not stored in Launcher | Pending external Runtime evidence | Runtime-owned audit command | `pending_external_evidence` | Must prove ledger semantics without fake billing claims. | External Runtime proof required. |
| RUNTIME | B03 Plan Entitlements / Trial State Machine | Runtime PR or audit evidence | Not stored in Launcher | Pending external Runtime evidence | Runtime-owned audit command | `pending_external_evidence` | Must prove entitlement and trial transitions. | External Runtime proof required. |
| RUNTIME | B04 Business Memory Retrieval / Customer Timeline | Runtime PR or audit evidence | Not stored in Launcher | Pending external Runtime evidence | Runtime-owned audit command | `pending_external_evidence` | Must prove retrieval/timeline behavior without customer data in this repo. | External Runtime proof required. |
| RUNTIME | B05 BYOK / Credential Readiness | Runtime PR or audit evidence | Not stored in Launcher | Pending external Runtime evidence | Runtime-owned audit command | `pending_external_evidence` | Must prove credential readiness without storing secret material. | External Runtime proof required. |
| LAUNCHER | L01 SaaS Activation Pack Handoff | Launcher docs, executable validators and public-safe activation pack checks | `docs/v0.9/SAAS_ACTIVATION_PACK_HANDOFF_L01.md`, `docs/v0.9/V0_9_FREEZE_CANDIDATE.md`, `scripts/validate-v09-saas-activation-pack-handoff.mjs`, `scripts/validate-v09-freeze-candidate.mjs` | Merge `82c90a7` / PR #16 | `npm run -s validate:v09-saas-activation-pack-handoff` and `npm run -s validate:v09-freeze-candidate` | `present_unverified` | Present in this repository. Must be re-run in this PR and after merge to be counted as verified for final freeze. | Post-merge command output still required. |
| CROSS-REPO | public-to-private authority boundary | Cross-repo audit notes | Launcher boundary docs present; external Web/Runtime proof pending | Pending external evidence | Repo-specific quality gates | `pending_external_evidence` | Public repo must not import private runtime authority. | External Web/Runtime proof required. |
| CROSS-REPO | no fake live claims | Cross-repo claim scan | Launcher validator added in this PR; external scans pending | Pending external evidence | Repo-specific claim validators | `pending_external_evidence` | Claims must match implemented evidence. | External scan outputs required. |
| CROSS-REPO | no auto purchase/provisioning claims | Cross-repo claim scan | Launcher validator added in this PR; external scans pending | Pending external evidence | Repo-specific claim validators | `pending_external_evidence` | Public copy must not imply auto purchase or provisioning. | External scan outputs required. |
| CROSS-REPO | no raw secrets/PII in fixtures/docs | Cross-repo secret/PII scan | Launcher validator added in this PR; external scans pending | Pending external evidence | Repo-specific secret/PII validators | `pending_external_evidence` | Fixture and docs must stay public-safe. | External scan outputs required. |
| CROSS-REPO | route quarantine still active | Cross-repo route audit | Launcher L01 route quarantine present; external route evidence pending | Pending external evidence | Repo-specific route validators | `pending_external_evidence` | Quarantined routes must not become public CTA targets. | External route proof required. |
| CROSS-REPO | quality gates passed | Quality outputs from Web, Runtime and Launcher | Launcher gates run in this PR; external gates pending | Pending external evidence | `npm run -s quality` plus external equivalents | `pending_external_evidence` | All owning repos must provide command output. | External quality outputs required. |
| CROSS-REPO | post-merge smoke captured | Smoke record after merge | Not yet captured | Pending post-merge evidence | Manual smoke commands | `pending_external_evidence` | Required after merge before global freeze. | Post-merge smoke evidence required. |

## v0.9 freeze decision rules

- If any required Web, Runtime or Launcher item is `missing`, the decision is `freeze_blocked`.
- If Launcher L01 is verified but Web or Runtime evidence is not accessible in this repository, the decision is `freeze_candidate_pending_external_evidence`.
- If all required evidence is `verified` and post-merge smoke passes, the decision is `freeze_ready`.
- Never claim `freeze_ready` from docs alone.
- Never claim `freeze_ready` if any validator is marker-only.
- Never claim `freeze_ready` if any component claims live execution without gated evidence.

## What this freeze does NOT mean

- It does not mean production live execution.
- It does not mean payment provider connected.
- It does not mean auth provider connected.
- It does not mean customer provisioning is automatic.
- It does not mean enterprise compliance certification.
- It does not mean ROI guarantee.

## What this freeze DOES mean

- The public SaaS offer is explainable.
- The activation handoff exists.
- The Launcher can produce public-safe activation pack evidence.
- v0.9 can be used as a controlled demo/freeze candidate if external evidence confirms Web and Runtime surfaces.

## Manual evidence checklist

- [ ] Production smoke for Web routes.
- [ ] Launcher quality command output.
- [ ] Runtime B01-B05 audit or PR evidence.
- [ ] Web W01-W05 audit or PR evidence.
- [ ] Screenshots if needed.
- [ ] Local evidence pack path placeholder: `<local-evidence-pack-path>`.
- [ ] Owner sign-off.
