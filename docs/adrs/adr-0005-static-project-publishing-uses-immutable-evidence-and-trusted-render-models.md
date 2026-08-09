# ADR 0005: Static project publishing uses immutable evidence and trusted render models

- Status: Accepted
- Date: 2026-08-09

## Context

Junior Coder web projects need an optional adult-approved public view without
turning learner code into an open hosting service. Publishing must not give an
agent, assessment adapter or learner source authority to create a public page.
The learning package must also remain independent of identity, HTTP, storage
and cloud-provider choices.

## Decision

The package defines three separate version-one records:

1. an immutable private snapshot with deterministic completion and scanner
   evidence plus an allow-listed safe render model;
2. an adult approval bound to the exact snapshot digest; and
3. an unlisted publication pointer with an HTTPS random slug and explicit
   lifecycle timestamps.

The public render union contains only bounded fictional values for Adventure
Mission Planner, Creature Care Dashboard and Robot Mission Control. Raw source
is represented by its digest and character count, never by executable public
content. Consumers must render the safe model with trusted code.

## Consequences

- An assessment or agent still cannot publish.
- Adult approval cannot silently follow a later private draft.
- Hosting adapters can change origin without changing the immutable snapshot.
- Expiry, renewal and unpublish change the publication pointer, not source.
- Identity linkage, persistence, HTTP headers and rendering remain adapter
  responsibilities outside `@plasius/learning`.

## Rollback

Consumers can stop creating or serving publications while retaining immutable
snapshot and approval evidence. Existing package exports remain additive.
