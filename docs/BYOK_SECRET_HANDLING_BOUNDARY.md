# BYOK Secret Handling Boundary

## Permanent rule

Never commit real secrets.

This includes provider keys, tokens, private certificates, bearer tokens, customer credentials, payment secrets and any value that can authorize access to a third-party or private TransformIA system.

## C04 status

- `.env.example` is placeholder only.
- Real `.env` files are forbidden except for the committed `.env.example` sample.
- Real provider credentials are not accepted in C04.
- Future credential storage is not implemented.
- No key validation exists.
- No provider calls exist.
- No network calls exist.
- No telemetry exists.

## Placeholder-only sample

`.env.example` documents planned variable categories without active provider secret names. It must keep placeholder values such as `placeholder_only`, `planned_local_byok`, `not_configured` or future-local-only text that cannot authenticate anything.

## Forbidden files

Do not commit `.env`, `.env.local`, `.env.production`, `.env.development`, `.env.staging` or any real environment file variant. Future validators should allow `.env.example` only when all values remain placeholder-only.

## Future credential storage

A future Atlas PR may define credential storage, rotation, validation or provider setup. Until that PR exists and is approved, this repository must not accept, validate, store or transmit BYOK credentials.
