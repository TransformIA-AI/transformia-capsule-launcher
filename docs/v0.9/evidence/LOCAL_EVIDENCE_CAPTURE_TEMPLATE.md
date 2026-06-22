# Local Evidence Capture Template for v0.9 Freeze

This is a template only. Do not store secrets, customer PII, private URLs, raw connector payloads or local machine-specific absolute paths in committed evidence.

## Web production smoke

- Date/time: `<timestamp>`
- Environment label: `<public-env-label>`
- Routes checked: `<routes>`
- Command or manual procedure: `<command-or-procedure>`
- Result: `<pass/fail/pending>`
- Notes: `<public-safe-notes>`

## Web PR evidence

- W01 evidence: `<PR-or-audit-reference>`
- W02 evidence: `<PR-or-audit-reference>`
- W03 evidence: `<PR-or-audit-reference>`
- W04 evidence: `<PR-or-audit-reference>`
- W05 evidence: `<PR-or-audit-reference>`

## Runtime PR evidence

- B01 evidence: `<PR-or-audit-reference>`
- B02 evidence: `<PR-or-audit-reference>`
- B03 evidence: `<PR-or-audit-reference>`
- B04 evidence: `<PR-or-audit-reference>`
- B05 evidence: `<PR-or-audit-reference>`

## Launcher PR evidence

- L01 evidence: `<PR-or-merge-reference>`
- Freeze evidence pack evidence: `<PR-or-merge-reference>`

## Commands run

| Command | Result | Notes |
|---|---|---|
| `<command>` | `<pass/fail/pending>` | `<public-safe-notes>` |

## Screenshots/captures

- Capture reference: `<screenshot-or-capture-reference>`
- Public-safe review complete: `<yes/no>`

## Decision

- Decision: `<freeze_ready/freeze_blocked/freeze_candidate_pending_external_evidence>`
- Rationale: `<public-safe-rationale>`

## Blockers

- `<blocker-or-none>`

## Owner sign-off

- Owner: `<name-or-role>`
- Date: `<date>`
- Sign-off: `<approved/rejected/pending>`
