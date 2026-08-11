# ADR 0007: External course content is exact and digest-pinned

- Status: Accepted
- Date: 2026-08-11

## Context

Road Hopper Rally has grown from a short catalog exemplar into a six-mission,
54-stage course with a starter project, deterministic engine, original assets
and browser/server evaluators. Keeping those executable concerns in
`@plasius/learning` would make the catalog package a runtime authority and risk
placing server-only assessment scenarios in browser bundles. Mutating the
published `1.1.0` module would also break rollback and existing consumers.

## Decision

`@plasius/learning` remains the immutable catalog authority. Road Hopper Rally
`2.0.0` references `@plasius/learning-road-hopper-rally@1.0.0` by exact package
name, stable version, named export and SHA-256 of the canonical manifest JSON.
The catalog validates the reference but does not import the package.

Path `1.2.0` replaces only the Road Hopper module record. Every other entry is
the same `1.1.0` object, and the published `1.0.0` and `1.1.0` path snapshots
remain available unchanged. The legacy `MissionAuthoringBundleV1` stays bound
to Road Hopper `1.1.0`; the extracted package owns its longer course-manifest
validation and canonical nine-stage cycles.

## Consequences

- Site adapters can load browser-safe exports and server-only evaluators through
  separate package entry points without making the catalog executable.
- Dependency resolution must verify the exact package, version, export and
  digest before exposing a course.
- A content change requires a new package version, digest and catalog module
  version rather than an in-place edit.
- Existing consumers can continue selecting the immutable legacy snapshots.

## Rollout

The package records no rollout state. Site adapters retain capability,
entitlement and stored-feature-flag authority, including legacy fallback while
`learning.junior-coder.road-hopper-v2.enabled` is disabled.
