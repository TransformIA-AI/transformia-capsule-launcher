# Local/BYOK Quickstart Boundary

## Purpose

This document explains the future local/BYOK path without requiring keys or provider configuration in C04.

## Meaning

Local/BYOK means user-owned keys and local control in a future launcher path. The user should be able to understand what runs locally, what keys they own, what is not committed and how the private core remains private.

## C04 status

- C04 adds placeholder-only `.env.example`.
- C04 does not ask for API keys.
- C04 does not create a real `.env` credential file.
- C04 does not configure providers.
- C04 does not add an executable launcher yet.
- C04 documents the config scaffold and validates public-safe wording.

## Config scaffold

C04 adds a BYOK config scaffold according to Atlas. The scaffold keeps secrets out of git, avoids active provider assumptions and documents that local/BYOK setup is still planned. See `docs/LOCAL_BYOK_CONFIG_SCAFFOLD.md`.

## Key safety

No keys should ever be committed. No secrets, tokens, private certificates, raw connector payloads or customer material belong in this repository.
