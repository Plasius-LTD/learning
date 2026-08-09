# TDR 0011: Vibe Bug Detective uses evidence-led, learner-approved repairs

- Status: Accepted
- Date: 2026-08-09

## Context

Young learners need to distinguish a failing symptom, a supported hypothesis
and a minimal repair. An open conversation or automatic code edit could hide
that reasoning, expose unrelated files or make the AI provider an undeclared
completion dependency.

## Decision

Mission one ships an intentionally broken but structurally valid private
mini-game. Deterministic assessment reports observed leftward movement against
the expected right-side beacon goal. A `MissionBoundedSuggestionV1` proposes
one exact direction-line repair in the sole permitted learner artifact.

The learner records a prediction before seeing the diff, reads labelled
removed and added lines, and explicitly accepts or rejects the immutable
snapshot. Accept runs the same deterministic assessment plus regression checks;
Reject preserves the current source. AI remains optional and cannot edit,
score, pass, reward or reveal protected tests.

## Safeguards

- No open prompt, arbitrary file selection or live provider dependency.
- No network, account, camera, microphone, storage or hardware authority.
- One source line changes; step count and beacon position are preserved.
- Observed and expected evidence is available as text without animation.
- Authored guidance remains available on denial, timeout or provider failure.
- Protected regression targets and answers stay facilitator-only.

## Verification

Contract tests validate the canonical nine-stage journey, complete function
reference, deterministic evidence goal, single permitted artifact, explicit
accept/reject alternatives, non-AI completion and malformed-suggestion
rejection.
