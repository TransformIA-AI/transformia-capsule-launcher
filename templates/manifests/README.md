# Capsule template manifests

This folder contains public manifest files only. They are sanitized previews of future Capsule template directions for the public launcher repository.

## Boundary

The files in this folder are:

- public-safe manifest contracts;
- descriptive JSON documents;
- not executable templates;
- not customer capsules;
- not private runtime templates;
- not workflows;
- not connector implementations;
- not prompt files.

They include:

- no private runtime;
- no connector execution;
- no prompts;
- no secrets;
- no customer data;
- no raw evidence;
- no regulated advice;
- no payment behavior;
- no telemetry.

## How to read a manifest

Each `*.manifest.json` file describes:

1. the public-safe template identity;
2. the category and target user;
3. the business job it may address in a future implementation;
4. the conceptual public-safe inputs;
5. the outputs a visitor can understand as review artifacts;
6. the non-goals and safety boundaries;
7. the future private runtime, Cloud or local/BYOK requirements.

The `schemaVersion` value is fixed for this sprint:

```text
transformia-capsule-template-manifest.v0.6-c03
```

The `status` value is `public_manifest_only` for every C03 manifest.

## Future launcher usage

A future launcher may render these manifests in a picker so visitors can compare planned Capsule directions. C03 does not ship a template runner, executable launcher, connector layer, private runtime, customer workspace or Cloud implementation.
