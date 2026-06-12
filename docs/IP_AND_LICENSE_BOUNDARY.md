# IP and License Boundary

## Purpose

This document makes the intellectual-property posture of the public TransformIA Capsule Launcher repository explicit for humans and coding agents.

## Default posture

TransformIA Capsule Launcher is public source-available, not open source.

The operative license is:

```text
TransformIA Capsule Launcher Source-Available Evaluation License v0.1
```

Stored in:

```text
LICENSE.md
```

## What public visibility means

Public visibility means the repository can be viewed on GitHub and used as a distribution, documentation and onboarding surface.

It does not mean:

- open-source permission;
- production permission;
- commercial permission;
- redistribution permission;
- permission to clone the product strategy into another business;
- permission to use TransformIA branding;
- permission to access or reproduce the private runtime.

## What agents must protect

Agents must not add any file, wording, package metadata or README section that suggests:

- MIT, Apache, GPL, AGPL, EUPL, Unlicense or public-domain licensing;
- open-source status;
- free commercial use;
- permissive reuse;
- production-ready distribution rights;
- bundled private-runtime claims;
- customer data or connector access included.

## Package metadata

If `package.json` includes a `license` field, it must remain:

```json
"license": "SEE LICENSE IN LICENSE.md"
```

or an equally restrictive/custom pointer approved by Dani.

Do not change it to MIT, Apache-2.0, ISC, BSD, GPL, AGPL, LGPL, EUPL, MPL, CC0, Unlicense or any OSI/open-source license without explicit written approval from Dani.

## Contribution posture

External contributions must be accepted only under the contribution grant in `LICENSE.md`, unless a separate `CONTRIBUTING.md` or CLA is approved later.

Agents must not add community contribution language that weakens the license or implies third parties retain blocking rights over core TransformIA product direction.

## Future decision points

A later PR may decide a different model:

- proprietary all-rights-reserved;
- source-available commercial license;
- dual license;
- Business Source License style model;
- open-core model;
- specific permissive license for isolated templates only.

Until then, this repository remains source-available evaluation only.
