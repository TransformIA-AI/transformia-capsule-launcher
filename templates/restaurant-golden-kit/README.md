# Restaurant Golden Kit

The Restaurant Golden Kit is a public launcher package for restaurant onboarding demos. It combines Google Calendar recipe references, WhatsApp Template Manager recipe references and restaurant scenario recipes without including private runtime code.

## Included manifest and recipes

- `manifest.json` declares `restaurant-golden-kit`, default eWorker name `Aitana`, required public connectors and required recipe references.
- `recipes/reservation-request.recipe.json` describes availability review plus a human approval path.
- `recipes/menu-inquiry.recipe.json` describes dry-run FAQ guidance when configured locally.
- `recipes/dietary-request.recipe.json` describes human review for dietary needs.
- `recipes/group-booking.recipe.json` describes approval-gated handling when party size is greater than 8.

## Safety boundary

This kit is descriptive launcher metadata only. It does not install n8n, call providers, include secrets, send WhatsApp messages, create calendar events or confirm bookings. Real provider setup and governed execution remain outside this public launcher.

## Local example

Use `connectors/examples/restaurant-golden-kit.local.config.example.json` to inspect the expected local shape. The example uses `local-demo`, selects the restaurant template and keeps all operational identifiers out of the repo.

## Checks

```bash
npm run -s validate:restaurant-golden-kit-launcher
npm run -s doctor connectors/examples/restaurant-golden-kit.local.config.example.json
```
