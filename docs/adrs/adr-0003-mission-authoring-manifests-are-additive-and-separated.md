# ADR 0003: Mission authoring manifests are additive and separated

- Status: Accepted
- Date: 2026-08-01

## Context

The immutable Junior Coder catalog identifies missions, materials, rubrics and
agent roles, but it does not contain enough authoring detail to drive a safe
learner workspace. Adding required fields to published module versions would
silently change their contract, while combining learner and facilitator content
would risk answer and protected-test leakage.

## Decision

`@plasius/learning` will publish separately versioned mission-authoring bundles
keyed to an immutable module version and mission ID.

Each bundle contains distinct learner and facilitator manifests. Learner
manifests can reference only learner-safe artifacts and visible goals.
Facilitator manifests own protected goals, tests, solution artifacts and adult
prompts. A deterministic validator enforces audience separation, the canonical
nine-stage journey, rubric and safety authority, accessibility equivalence,
non-AI completion and evidence-bound rewards.

For Vibe missions, the learner projection may additionally contain one
`MissionBoundedSuggestionV1`. It identifies one permitted learner artifact,
an authored before/after snippet, explicit constraints and mandatory learner
accept/reject approval. Provider-backed suggestions remain an optional adapter
concern and cannot be required for completion.

Vibe Bug Detective reuses this separated contract for an intentionally broken
starter. Its learner projection contains observed-versus-expected evidence and
one exact repair diff, while protected regression values and facilitator
solutions remain in the facilitator projection.

The package remains infrastructure-neutral. It does not execute code, call an AI
provider, persist attempts, authorize accounts or activate a workspace.

## Consequences

- Existing path and module versions remain byte-for-byte compatible.
- Site and sandbox adapters gain one provider-independent authoring authority.
- Protected material has an explicit boundary before HTTP projection.
- Additional module missions can be authored without changing the core catalog
  contract.
- Consumers must deliberately select and project a matching authoring bundle.
- Vibe consumers must show the exact diff and wait for learner approval; they
  cannot reinterpret this contract as open chat or automatic source mutation.

## Rollout

The contracts inherit `learning.junior-coder.workspace.enabled`. The package
does not evaluate that flag; consuming services remain responsible for stored
flag, capability, relationship, entitlement and privacy decisions.
