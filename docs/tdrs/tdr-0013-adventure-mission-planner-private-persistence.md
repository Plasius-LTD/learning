# TDR 0013: Adventure Mission Planner uses private bounded persistence

- Status: Accepted
- Date: 2026-08-09

## Context

A young learner should be able to practise semantic HTML, validation, arrays,
state and local persistence without entering real plans or accidentally sending
information. The same exercise must remain understandable without animation or
visual layout, and provider availability must not control completion.

## Decision

Mission one supplies fictional heading, mission, day and validation values for
a private planner simulator. Five learner-visible functions define the whole
runtime boundary. The starter deliberately disables simulated local save, then
one `MissionBoundedSuggestionV1` proposes the exact Boolean change required for
the supplied mission to survive a simulated restart.

The learner predicts the restart result, reviews labelled removed and added
lines, and explicitly accepts or rejects the immutable suggestion. A semantic
text summary exposes the same state as the visual preview. Deterministic checks
remain the only score authority.

## Safeguards

- No names, contact details, real locations or arbitrary free-form values.
- No network, external scripts, tracking, transmitting forms or server storage.
- Simulated local save is scoped to the private mission preview.
- The action icon, diff and restart evidence have keyboard and text equivalents.
- Rejection preserves source; authored guidance works without an AI provider.
- Protected boundary tests and facilitator answers remain physically separate.

## Verification

Contract tests validate the canonical nine-stage journey, complete five-function
reference, learner-only artifacts, one permitted diff, explicit accept/reject,
software-only disclosure, deterministic completion and protected separation.
