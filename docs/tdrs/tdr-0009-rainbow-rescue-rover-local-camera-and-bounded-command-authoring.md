# TDR 0009: Rainbow Rescue Rover local camera and bounded command authoring

- Status: Accepted
- Date: 2026-08-09

Rainbow Rescue Rover publishes five learner-safe integration-simulator
functions. They document one labelled simulated colour, one left/centre/right
target zone, one bounded serial-command label, a 250–1000 ms heartbeat and a
fail-safe stop. Every website result is deterministic private-simulator
telemetry. The contract grants no camera, frame, serial, GPIO, PWM, DOM,
network, storage, browser or physical-hardware authority.

The complete projection contains the reusable Pico core, a bench-signed
Obstacle Explorer, Pi Zero 2 W, Camera Module 3 with the correct Zero-series
ribbon, supported storage and regulated Pi power. The incremental projection
contains those four camera-rover additions. All eight records remain pending
bench test, compatibility-unclaimed and physically ineligible. Camera Module 3
frames, saved calibration images and confidence measurements stay on the
family Raspberry Pi and cannot be submitted to Plasius, a module agent or a
published project.

The adult guide owns camera-ribbon inspection, local colour calibration,
separate Pi and switched motor power, bounded serial protocol, heartbeat and
link-loss recovery, known-good Pico firmware, lifted-wheel tests and physical
evidence. Learner-facing code and agents cannot control, approve or export a
physical rover build, and the website never opens a camera or serial port or
activates motors.

The additive robotics validator rejects manifest drift, unverified
compatibility claims, unsafe website hardware control, missing adult power
safeguards and badge/evidence mismatches. Consuming adapters must additionally
compose the robotics feature flag, catalog capability and entitlement boundary.

Rollback is additive: consumers can stay on the prior package release or
ignore this export. Published module versions remain immutable, and
`learning.junior-coder.robotics.enabled` remains the remote kill switch.
