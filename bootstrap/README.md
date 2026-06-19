# v0.8-A07 Stack bootstrap planning

This folder contains the public-safe stack bootstrap layer for Atlas item `v0.8-A07`.

It provides two deterministic plan contracts:

- managed Cloud handoff planning in `bootstrap/stack/managed.stack.manifest.json`;
- self-host local stack planning in `bootstrap/stack/self-host.stack.manifest.json`.

A07 is plan-only. It does not start Docker, execute n8n, call providers, provision databases, run webhook servers, clone private runtime code, include customer credentials or ship a binary installer.

## Boundaries

- Private core is not included.
- No credentials are requested, read or stored.
- No live execution happens from this launcher.
- Human approval is required before any future live activation.

## Commands

```bash
npm run -s bootstrap:stack-plan
npm run -s bootstrap:stack-plan -- --mode managed
npm run -s bootstrap:stack-plan -- --mode self-host
npm run -s validate:v0-8-a07-stack-bootstrap
```

These commands validate and print public-safe guidance only. They do not deploy a stack.
