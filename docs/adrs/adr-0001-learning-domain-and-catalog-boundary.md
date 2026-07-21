# ADR 0001: Learning domain and catalog boundary

- Status: Accepted
- Date: 2026-07-21

## Context

Junior Coder needs versioned, reusable contracts for commercial learning content. Existing game-world training and player-mission packages have different authorities and cannot safely own course purchases, assessment, or educational evidence.

## Decision

Create `@plasius/learning` as an infrastructure-neutral package. It owns domain contracts, invariant validation, deterministic assessment, and published catalog manifests. It imports no HTTP, database, cloud, authentication, economy, model-provider, or UI SDK.

Module versions are immutable. Entitlements and receipts bind to an exact version. Learner and facilitator manifests remain separate. Rollout flags and capabilities are evaluated only by consuming applications.

## Consequences

- Site and future learning products share one stable vocabulary.
- Economy can reference module-version IDs without learning about course content.
- AI and sandbox adapters can be replaced without changing assessment authority.
- Cross-repository publication order is required before site consumption.
