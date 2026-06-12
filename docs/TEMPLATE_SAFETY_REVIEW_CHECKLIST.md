# Template Safety Review Checklist

Use this checklist before adding or changing any public Capsule template manifest.

## Data safety

- [ ] No PII.
- [ ] No secrets.
- [ ] No customer data.
- [ ] No raw evidence.
- [ ] No prompt text.
- [ ] No private runtime code.
- [ ] No connector payloads.
- [ ] No API keys, provider keys, customer IDs, tenant IDs, payment IDs or subscription IDs.

## Claim safety

- [ ] No regulated advice.
- [ ] No payment claims.
- [ ] No live execution claims.
- [ ] No ROI guarantees.
- [ ] No compliance certification.
- [ ] Manifest-only status is preserved unless a later approved PR explicitly changes scope.
- [ ] Non-executable wording remains visible to readers.

## IP and license safety

- [ ] Source-available/IP posture is preserved.
- [ ] The custom license pointer in `package.json` remains unchanged.
- [ ] `LICENSE.md`, `NOTICE.md`, `docs/IP_AND_LICENSE_BOUNDARY.md` and `AGENTS.md` are not changed without explicit Dani approval.
- [ ] No wording grants production, commercial, redistribution, SaaS, white-label or managed-service rights.

## Runtime and connector safety

- [ ] No private runtime implementation details.
- [ ] No private repo clone instructions.
- [ ] No n8n workflows.
- [ ] No connector implementation.
- [ ] No provider configuration.
- [ ] No `.env` creation requirement.
