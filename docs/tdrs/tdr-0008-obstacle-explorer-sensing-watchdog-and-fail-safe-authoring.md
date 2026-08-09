# TDR 0008: Obstacle Explorer sensing, watchdog and fail-safe authoring

- Status: Accepted
- Date: 2026-08-09

Obstacle Explorer publishes five learner-safe C++-style simulator functions.
The function reference documents one labelled simulated IR reading, a bounded
blocked-or-clear route choice, one to three recovery attempts, a 250–1000 ms
watchdog and a fail-safe stop. Every observable result is private simulator
telemetry. The contract grants no GPIO, PWM, DOM, network, storage, browser or
physical-hardware authority.

The hardware projection mirrors the reusable Pico core plus a bench-signed
rover and two exact 3.3 V-compatible digital IR obstacle sensors. Every
component remains pending bench test, compatibility-unclaimed and physically
ineligible for this module. The adult guide owns exact model matching, sensor
voltage and calibration, supply ratings, common-ground verification, secured
moving parts, lifted-wheel route and watchdog tests, sensor-failure recovery
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
