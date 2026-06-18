# v0.7-F03 Restaurant Golden autoinstall kit

## Exact Atlas entry

`v0.7-F03` adds the Restaurant Golden public autoinstall kit manifest and recipes.

## What this PR builds

- Public `restaurant-golden-kit` manifest.
- Four descriptive restaurant scenario recipes.
- Local config shape example for `Aitana`.
- Restaurant Golden validator and Doctor output coverage.

## What this PR does not build

- Private runtime code.
- Real n8n installation.
- Provider calls.
- Message sending.
- Calendar event creation.
- Booking confirmation.

## Safety boundaries

The launcher only validates public metadata and config shape. The kit declares `noSecretsIncluded`, `noProviderCall`, `noLiveExecution`, `noN8nLiveInstall`, `noMessageSend`, `noCalendarEventCreation` and `noBookingConfirmation`.

## Validators

Run:

```bash
npm run -s validate:connector-manifests
npm run -s validate:connector-recipes
npm run -s validate:restaurant-golden-kit-launcher
npm run -s doctor
npm run -s doctor connectors/examples/restaurant-golden-kit.local.config.example.json
npm run -s quality
git diff --check
```

## Acceptance criteria

The kit is public-safe, recipe references resolve, Doctor prints the Restaurant Golden safety boundary and the quality chain includes the new validator.
