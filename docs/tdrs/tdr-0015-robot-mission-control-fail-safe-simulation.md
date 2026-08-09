# TDR 0015: Robot Mission Control remains a fail-safe simulation

- Status: Accepted
- Date: 2026-08-09

## Context

A young learner should be able to practise commands, state machines, safety
confirmations, telemetry and responsive charts without the website opening a
serial port or controlling physical hardware. Visual charts must have equivalent
text telemetry, and provider availability must not control completion.

## Decision

Mission one supplies command, telemetry-rate and chart-mode values for a private
mission-control simulator. Five learner-visible functions define the whole
runtime boundary. The starter deliberately leaves safety confirmation off, so
the simulated state machine stays in `STOP`. One `MissionBoundedSuggestionV1`
proposes the exact Boolean confirmation change.

The learner predicts the transition, reviews labelled removed and added lines,
and explicitly accepts or rejects the immutable suggestion. The chart and text
telemetry expose the same bounded samples. Deterministic checks remain the only
score authority.

## Safeguards

- Only supplied commands, rates and chart modes are accepted.
- An unconfirmed command cannot move the simulator away from `STOP`.
- Serial output is labelled simulation data; Web Serial is never opened.
- The website cannot activate motors, cameras or any physical device.
- No network, external scripts, personal data or background tasks.
- Rejection preserves source; authored guidance works without an AI provider.
- Protected boundary tests and facilitator answers remain physically separate.

## Verification

Contract tests validate the canonical nine-stage journey, complete five-function
reference, learner-only artifacts, one permitted diff, explicit accept/reject,
software-only disclosure, deterministic completion and protected separation.
