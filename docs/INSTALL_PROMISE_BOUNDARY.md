# Install Promise Boundary

## Purpose

This document defines what the launcher install promise may say before an installer exists.

## C01 status

C01 does not ship an installer. It does not ship a binary release, archive, package release or executable launcher.

C01 defines the install promise boundary so future docs can be clear without overclaiming.

## C02 direction

C02 may add README, quickstart and install-promise documentation.

The install promise target is local/BYOK first: users should eventually understand how to evaluate the public launcher path locally while keeping their own keys safe.

## Future target

Future install guidance should aim for:

- under 5 minutes for the documented public path;
- minimal dependencies;
- no secrets committed;
- no private runtime leakage;
- clear prerequisites;
- clear distinction between public launcher docs and private runtime behavior.

## No overclaim before implementation

Before an installer exists and is approved, repository wording must not claim that an installer, binary download, one-click setup or package release is available.

C01 includes no binary release and no installer artifact.
