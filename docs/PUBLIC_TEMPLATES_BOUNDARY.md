# Public Templates Boundary

## Purpose

This document defines what public templates may and may not be in TransformIA Capsule Launcher.

C01 only defines the template boundary. C03 adds public manifest files only; it does not add executable templates.

## Template posture

Public templates are examples. They are public-safe, generic and sanitized teaching material for future users.

Public templates are not customer capsules, private runtime templates, production workflows, regulated workflow guarantees or live connector execution plans.

## Required restrictions

Public templates must contain:

- no PII;
- no customer data;
- no secrets;
- no API keys;
- no production connector credentials;
- no raw evidence;
- no regulated workflow claims;
- no live connector execution;
- no private runtime templates;
- no private prompts;
- no internal runbooks;
- no internal paths.

## C03 manifest catalog

C03 adds public-safe manifests under `templates/manifests/` and documents them in `docs/TEMPLATE_MANIFEST_CATALOG.md`.

Those manifests remain generic, public-safe, non-executable and detached from customer material, connector payloads and private runtime implementation.

## Current scope

The current `templates/` directory contains manifest previews only. It does not contain executable templates, customer capsules, private runtime templates or connector implementations.
