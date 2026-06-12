# Local/BYOK Quickstart Boundary

## Purpose

This document explains the future local/BYOK path without requiring keys or provider configuration in C02.

## Meaning

Local/BYOK means user-owned keys and local control in a future launcher path. The user should be able to understand what runs locally, what keys they own, what is not committed and how the private core remains private.

## C02 status

- C02 does not ask for API keys.
- C02 does not create `.env`.
- C02 does not configure providers.
- C02 does not add an executable launcher yet.
- C02 documents the promise and validates public-safe wording.

## Future scaffold

C04 may add a BYOK config scaffold according to Atlas, if explicitly scoped and approved. That future scaffold should keep secrets out of git and should avoid provider assumptions until the milestone defines them.

## Key safety

No keys should ever be committed. No secrets, tokens, private certificates, raw connector payloads or customer material belong in this repository.
