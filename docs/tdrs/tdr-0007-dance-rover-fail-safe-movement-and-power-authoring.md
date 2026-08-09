# TDR 0007: Dance Rover fail-safe movement and power authoring

- Status: Accepted
- Date: 2026-08-09

Dance Rover publishes five learner-safe C++-style simulator functions. The
function reference documents straight direction and speed, turn direction and
speed, timing, repeat count and emergency stop. Speed is bounded to 0–60
percent, waits and repeats are bounded, and every observable result is private
simulator telemetry. The contract grants no PWM, DOM, network, storage,
browser or physical-hardware authority.

The hardware projection mirrors the reusable Pico core plus the incremental
dual driver, matching motors, chassis/wheels/caster and switched protected
motor supply. Every component remains pending bench test,
compatibility-unclaimed and physically ineligible. The adult guide owns exact
model matching, supply ratings, common-ground verification, secured moving
parts, lifted-wheel direction and emergency-stop tests, watchdog recovery
firmware and physical evidence. Learner-facing code and agents cannot control,
approve or export a physical rover build.

The existing additive robotics validator remains the enforcement authority. It
rejects manifest/version drift, missing complete or incremental items,
verification claims on unverified components, unsafe website hardware control,
missing adult power safeguards and badge/evidence mismatches. Consuming sites
must additionally compose the robotics feature flag, catalog capability and
entitlement boundary before showing a workspace.

Rollback is additive: consumers can remain on the previous package version or
ignore this export. Published module versions are unchanged, and the robotics
rollout flag remains the remote kill switch for all site adapters.
