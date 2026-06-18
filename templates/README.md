# Public Templates

Public Capsule template manifests now live in [`templates/manifests`](manifests/).

C03 adds a manifest catalog only. The manifest files are public-safe, generic and descriptive previews of future Capsule template directions.

Current boundary:

- no executable templates yet;
- no customer data;
- no secrets;
- no private runtime;
- no connector execution;
- no prompts;
- no raw evidence;
- no payment behavior;
- no telemetry;
- no regulated advice.

Do not place customer capsules, private runtime templates, n8n workflows, connector payloads, prompt files, API keys, provider keys, `.env` files or internal runbooks here.

See:

- [`templates/manifests/README.md`](manifests/README.md)
- [`docs/TEMPLATE_MANIFEST_CATALOG.md`](../docs/TEMPLATE_MANIFEST_CATALOG.md)
- [`docs/TEMPLATE_SAFETY_REVIEW_CHECKLIST.md`](../docs/TEMPLATE_SAFETY_REVIEW_CHECKLIST.md)

## Restaurant Golden Kit

The Restaurant Golden Kit lives in [`templates/restaurant-golden-kit`](restaurant-golden-kit/). It is a public-safe manifest and scenario recipe pack for restaurant onboarding demos using connector recipe references only.

It does not include private runtime code, secrets, provider calls, live workflow installation, message sending, calendar event creation or booking confirmation.
