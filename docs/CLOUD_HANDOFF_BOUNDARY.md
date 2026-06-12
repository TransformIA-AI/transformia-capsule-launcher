# TransformIA Cloud Handoff Boundary

## Purpose

This document defines the TransformIA Cloud path without implementing Cloud in this repository.

## Boundary

TransformIA Cloud path will be documented in future PRs. Cloud upgrade path is a handoff, not implemented in this repo.

## C02 non-goals

- No Cloud auth.
- No Cloud sync.
- No payment.
- No Stripe.
- No customer portal.
- No subscription.
- No tenant state.
- No production connector execution.

## Link posture

The public README may link to this boundary as the current TransformIA Cloud handoff placeholder. It must not claim active signup, payment, subscription management, Cloud sync or customer portal behavior unless a later approved PR implements and validates those claims.

## Future requirements

A future Cloud handoff PR should define the target surface, authority boundary, user expectation, data boundary, upgrade language and rollback path before any implementation is discussed.
