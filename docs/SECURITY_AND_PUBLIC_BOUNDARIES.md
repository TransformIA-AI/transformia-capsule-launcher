# Security and Public Boundaries

## Permanent boundary

This repository is public.

Do not place private core, customer data, secrets, proprietary runtime logic or internal execution artifacts here.

## Never commit

- credentials;
- API keys;
- private certificates;
- real environment files, except placeholder-only `.env.example`;
- customer workspaces;
- raw evidence;
- raw connector payloads;
- private n8n workflows;
- private runtime files;
- internal prompts;
- payment secrets;
- local paths that reveal private infrastructure.

## Public-safe content allowed

- README and quickstart docs;
- public-safe diagrams in future;
- generic templates;
- install promise boundaries;
- local/BYOK onboarding explanations;
- future Cloud handoff explanations;
- validators that prevent overclaims;
- placeholder-only `.env.example` for the C04 local/BYOK scaffold.

## Claims not allowed before implementation

- production-grade readiness;
- installer available;
- one-click install active;
- active payment flow;
- live Stripe integration;
- active customer portal;
- active subscription state;
- active cloud sync;
- private runtime bundled;
- enabled live connector execution;
- configured provider execution;
- local capsule execution enabled;

## Sensitive future work

The following require explicit Dani approval and a dedicated PR:

- dependencies;
- installer packaging;
- binary releases;
- network calls;
- telemetry;
- auth;
- DB/persistence;
- payment/Stripe;
- cloud sync;
- connector execution.


## License boundary

This repository is public source-available, not open source.

Use `LICENSE.md` as the source of truth. Do not add MIT, Apache, GPL, AGPL, EUPL, Unlicense, CC0, public-domain or other open-source/permissive license language without explicit Dani approval.

No production, commercial, redistribution, SaaS, white-label or managed-service rights are granted by public visibility.
