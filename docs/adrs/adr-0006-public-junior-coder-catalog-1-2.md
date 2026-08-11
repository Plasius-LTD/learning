# ADR 0006: Publish Junior Coder catalog 1.2.0 as an immutable public snapshot

- Status: Accepted
- Date: 2026-08-09

## Context

Junior Coder catalog 1.1.0 fixed every module price at 50 Tokens but remained a
pilot publication. Offerwall-funded Module Allowances need a stable public
catalog target without mutating historical module or entitlement references.

## Decision

Publish `JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_2` with `catalogState: "public"`.
Every module has version `1.2.0`, retains the 1.1 content and safeguards, and
costs exactly 50 Tokens (50,000 Token subunits). The nominal £5 reference is
display metadata only and never creates cash-redemption rights.

Keep 1.0.0 and 1.1.0 unchanged. Point the explicitly moving `CURRENT` alias at
1.2.0; durable purchase, entitlement and progress records continue to bind an
exact module ID and version.

## Consequences

- Server adapters can expose one public catalog snapshot without rewriting
  existing purchases or grants.
- A later content or price change requires another immutable version.
- Access control, purchasing, allowances and feature rollout remain host
  responsibilities outside this infrastructure-neutral package.
