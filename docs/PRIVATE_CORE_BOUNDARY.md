# Private Core Boundary

## Purpose

This document defines the boundary between the public TransformIA Capsule Launcher repository and the private TransformIA runtime / Exocortex core.

The launcher distributes, documents and guides. The private runtime decides and executes.

## Must never be included

This repository must never include:

- private runtime source;
- Exocortex core implementation;
- proprietary orchestration logic;
- production connector credentials;
- customer workspaces;
- raw evidence;
- API keys;
- payment secrets;
- internal runbooks;
- private agent prompts;
- n8n production workflows;
- customer data;
- private repo clone instructions;
- internal paths or secrets.

## Allowed public references

This repository may include public-safe references to:

- conceptual architecture;
- public-safe capabilities;
- local/BYOK promise;
- future Cloud handoff;
- high-level diagrams in future approved PRs;
- public template examples after sanitization.

Allowed references must remain descriptive and boundary-oriented. They must not provide private implementation steps, internal paths, private clone instructions, credentials, workflows, prompts or customer material.

## Review rule

If a proposed change needs private runtime details to be useful, it does not belong in this public repository unless Dani explicitly approves a public-safe abstraction.

If there is uncertainty, stop and create `DECISION_NEEDED.md` from `docs/DECISION_NEEDED_TEMPLATE.md`.
