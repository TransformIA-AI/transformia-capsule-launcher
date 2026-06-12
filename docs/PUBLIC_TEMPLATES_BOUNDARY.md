# Public Templates Boundary

## Purpose

This document defines what public templates may and may not be in TransformIA Capsule Launcher.

C01 only defines the template boundary. It does not add real templates.

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

## Future C03

A future C03 PR may add public template examples after sanitization and review.

Those examples must remain generic, public-safe and detached from customer material and private runtime implementation.

## C01 scope

C01 defines this boundary only. The current `templates/` directory remains a placeholder.
