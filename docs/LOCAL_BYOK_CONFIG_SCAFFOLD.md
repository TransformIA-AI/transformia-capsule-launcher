# Local/BYOK Config Scaffold

## Purpose

v0.6-C04 adds a public-safe local/BYOK configuration scaffold so visitors can see where future local configuration will live without providing credentials or running capsules locally.

## What C04 adds

- Root `.env.example` with placeholder-only values.
- `config/local-byok.config.example.json` with the declarative config shape.
- `config/local-byok.config.schema.json` with no-execution and no-secret constraints.
- `config/README.md` explaining the placeholder boundary.
- Secret-handling and schema docs for future Atlas work.

## What C04 does not add

- No executable launcher.
- No installer.
- No runtime adapter.
- No provider adapter.
- No LLM call.
- No API client.
- No connector execution.
- No private runtime dependency.
- No real local execution.
- No real BYOK setup.
- No auth, database, Cloud sync, telemetry, payment, Stripe, checkout or customer portal.
- No real secrets.

## `.env.example` boundary

`.env.example` exists because Atlas requires a visible placeholder for future local/BYOK configuration. It is not required to be copied in C04, and it does not contain real credential names or active provider setup.

Real `.env` files remain forbidden. Real secrets must never be committed.

## Config JSON boundary

`config/local-byok.config.example.json` is declarative and non-executable. Its required safety flags keep local execution, provider execution, private runtime dependency, real credentials and Cloud handoff implementation disabled in C04.

## Future local/BYOK path

A later Atlas step may define how users provide their own credentials, where credentials are stored and how a launcher talks to providers. C04 only reserves public-safe shape and language for that future path.

## Runtime and provider boundary

C04 includes no active provider execution and no private runtime dependency. The private runtime remains private, and this public repo does not include runtime adapter code.

## Future Atlas step

The next Atlas PR is:

```text
v0.6-C05
docs(launch): add Product Hunt, GitHub and X launch assets
```
