# Managed and self-host local stack bootstrap

## Purpose

Atlas item `v0.8-A07` adds a public-safe bootstrap planning layer for TransformIA Capsule Launcher. It makes managed and self-host deployment posture legible without deploying, executing providers, starting services, cloning private runtime code or writing credentials.

## Exact Atlas item

`v0.8-A07` - managed and self-host local stack bootstrap.

## What A07 builds

- Stack bootstrap manifests for managed Cloud handoff and self-host local planning.
- A local stack plan generator that prints human-readable guidance.
- Public-safe example configuration for plan validation.
- Zero-credential validation around the bootstrap contract.

## What A07 does not build

- It is not a production installer.
- It is not a binary release.
- It is not a real Cloud deployer.
- It is not private runtime provisioning.
- It is not n8n, Supabase, OAuth, WhatsApp or Calendar execution.

## Managed mode

Managed mode describes a future TransformIA Cloud handoff path. The launcher validates the handoff readiness shape only. Customer credentials, managed activation and private runtime operation stay outside this public source-available repository.

## Self-host mode

Self-host mode is local stack planning only. The operator supplies any local services outside this repo after approved scope. The launcher does not run Docker commands, start services, collect credentials, clone runtime code, connect providers or provision databases.

## Private core boundary

Private core is not included. This repo does not contain TransformIA private runtime source, proprietary orchestration logic, internal prompts, customer material, raw evidence or production workflows.

## Credential handling boundary

No credentials are requested, read, generated or stored. Example files only contain public-safe flags and plan metadata. Real credentials must stay outside Git and outside launcher examples.

## No live boundary

No live execution happens from the launcher. Human approval is required before any future live activation.

## No binary installer

A07 ships no binary, archive, package release or executable installer.

## No Cloud deploy

A07 does not deploy Cloud infrastructure. Managed mode is a readiness and handoff plan only.

## No Docker or service start

A07 does not start Docker, n8n, Supabase, provider jobs, webhook servers, databases or model gateways. Those are external prerequisites for a later approved live path.

## Operator next steps

1. Run `npm run -s validate:v0-8-a07-stack-bootstrap`.
2. Run `npm run -s bootstrap:stack-plan` for the default self-host plan.
3. Run `npm run -s bootstrap:stack-plan -- --mode managed` to review managed handoff posture.
4. Run `npm run -s bootstrap:stack-plan -- --mode self-host` to review self-host local planning posture.
5. Keep all credentials and provider setup outside this public repo.
6. Get Dani approval before any live activation work.

## Future A08 dependency

Future A08 work should add deploy doctor, rollback doctor and credential checks before any approved activation path advances.
