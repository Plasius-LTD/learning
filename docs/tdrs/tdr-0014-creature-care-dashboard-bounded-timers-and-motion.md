# TDR 0014: Creature Care Dashboard bounds timers and motion

- Status: Accepted
- Date: 2026-08-09

## Context

A young learner should be able to practise components, events, timers, status
displays and responsive layout without entering personal details, creating real
schedules or starting background work. The same dashboard must remain usable
without decorative motion, and provider availability must not control
completion.

## Decision

Mission one supplies fictional creature, status, timer and layout values for a
private care-dashboard simulator. Five learner-visible functions define the
whole runtime boundary. The starter deliberately leaves reduced motion off,
then one `MissionBoundedSuggestionV1` proposes the exact Boolean change needed
to disable decorative animation while preserving event, timer and status
feedback.

The learner predicts the result, reviews labelled removed and added lines, and
explicitly accepts or rejects the immutable suggestion. A text status exposes
the same component state as the visual preview. Deterministic checks remain the
only score authority.

## Safeguards

- Only supplied fictional creatures, statuses, timers and layouts are accepted.
- Timers are bounded simulation state and never schedule background work.
- No names, real schedules, contact details, network calls, tracking or storage.
- Responsive reflow preserves reading and keyboard order.
- Reduced motion removes decorative animation without removing information.
- Rejection preserves source; authored guidance works without an AI provider.
- Protected boundary tests and facilitator answers remain physically separate.

## Verification

Contract tests validate the canonical nine-stage journey, complete five-function
reference, learner-only artifacts, one permitted diff, explicit accept/reject,
software-only disclosure, deterministic completion and protected separation.
