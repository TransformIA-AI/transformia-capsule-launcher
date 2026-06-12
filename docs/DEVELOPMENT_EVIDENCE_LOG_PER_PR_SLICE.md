# Development Evidence Log per PR Slice

## Purpose

Every agent-assisted PR in this repository should leave a public-safe Development Evidence Log in the PR body or a dedicated PR comment.

The goal is traceability, not legal certification.

## Minimum fields

- Task title
- Agent/tool used
- Repository
- Branch name
- Base branch
- Commit hash
- PR number
- Exact Atlas entry
- Changed files
- Scope classification
- Human intent summary
- Prompt summary
- Implementation summary
- Commands executed
- Checks run
- Check results
- Files intentionally not touched
- Non-goals
- Boundary/claim checks
- Known risks
- Trade-offs
- Follow-up recommendations
- Human merge decision
- Merge method

## Scope classification

Use one:

- docs-only
- validator-only
- contract-only
- config
- mixed
- production code
- packaging
- installer

## Boundary and claim review

Every PR must explicitly state whether it introduces:

- private runtime code;
- secrets;
- customer data;
- connector execution;
- live execution;
- network calls;
- payment/Stripe;
- auth;
- database/persistence;
- telemetry;
- binary release;
- installer;
- production readiness claim;
- compliance certification claim.

For C01, expected answer is `No` for all of the above.

## Template

```markdown
### Development Evidence Log

#### Task
- Title:
- Agent/tool:
- Repository:
- Branch:
- Base:
- Commit:
- PR:
- Exact Atlas entry:

#### Scope
- Classification:
- Allowed files:
- Files changed:
- Files explicitly not touched:

#### Human intent
- Summary:
- Acceptance criteria:

#### Agent work summary
- What changed:
- Why:
- Non-goals:

#### Verification
- Commands executed:
- Focused validation:
- Full quality:
- Diff check:
- Other checks:

#### Boundary and claim review
- Private runtime code introduced: No
- Secrets introduced: No
- Customer data introduced: No
- Payment/Stripe introduced: No
- Auth/DB/persistence introduced: No
- Connector/live execution introduced: No
- Installer/binary introduced: No
- Production readiness claimed: No

#### Risks and trade-offs
- Risks:
- Trade-offs:
- Debt created:

#### Human decision
- Decision:
- Merge method:
- Follow-up:
```
