# ADR 0004: Robot mission hardware disclosures are additive and fail closed

- Status: Accepted
- Date: 2026-08-09

## Context

The immutable Junior Coder catalog already discloses physical requirements,
but a robotics workspace also needs to distinguish the complete reusable kit
from one module's additions and preserve per-component verification authority.
Mutating published module versions would break the catalog contract. Treating
one manifest-level pending state as a compatibility claim would also let an
unverified component reach learner physical completion.

## Decision

Robot mission-authoring bundles may add a separately versioned hardware
projection keyed to the immutable catalog requirements version. The projection
contains complete-path IDs, incremental IDs, one status record for every
catalog item and adult/simulator safeguards.

The validator requires exact catalog item and quantity parity. An unverified
component cannot claim compatibility or physical-completion eligibility.
Physical export requires adult acknowledgement, the website may never control
hardware, and the physical badge must retain adult-signoff evidence. Simulator
completion and its badge remain available independently.

Camera-equipped modules additionally keep every frame and calibration image on
the family-owned Raspberry Pi. Their browser projections may contain bounded
authored labels and simulator telemetry only: no frame, camera stream, serial
port, network bridge or motor authority crosses into the site or an agent.

## Consequences

- Published catalog paths and module records remain unchanged.
- Guardians can see complete and incremental requirements before action.
- Consumers receive one deterministic authority for fail-closed physical UI.
- Bench-test services may later publish verified successor data without
  weakening the current contract.
- `@plasius/learning` still performs no hardware I/O, persistence or identity
  authorization.

## Rollout

Robotics consumers must compose the catalog capability with
`learning.junior-coder.workspace.enabled` and the default-off
`learning.junior-coder.robotics.enabled` flag. Ignoring the new bundle or
disabling the robotics flag is the rollback path.
