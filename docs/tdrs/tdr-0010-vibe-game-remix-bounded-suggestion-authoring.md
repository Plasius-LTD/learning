# TDR 0010: Vibe Game Remix uses bounded, learner-approved suggestions

- Status: Accepted
- Date: 2026-08-09

## Context

Vibe Game Remix Lab teaches young learners how to inspect and evaluate a code
suggestion. An open conversation or an agent that silently edits a project
would hide the reasoning the mission is meant to teach and could expose files,
personal information or answer material outside the current assessment.

## Decision

Mission one publishes one `MissionBoundedSuggestionV1` in the learner-safe
authoring projection. It binds an authored intent and constraints to exactly
one existing learner artifact and supplies labelled before/after snippets.
The only permitted decisions are Accept and Reject, both available by pointer
and keyboard. Accept applies the exact reviewed snapshot; Reject must preserve
the source byte-for-byte.

The deterministic assessment runs before and after the decision. AI is not
required, cannot change a score and cannot apply a diff. Any future provider
adapter must remain bound to the current module, mission, failed criterion and
permitted artifact, and must fall back to the authored suggestion on denial,
timeout, quota or provider failure.

## Safeguards

- No open prompt field or arbitrary project/file selection.
- No network, account, camera, microphone, storage or hardware authority.
- No automatic edit, answer dumping or protected-test projection.
- A visible diff and learner prediction precede approval.
- Assessment and completion remain reproducible without AI.
- Reduced-motion and labelled text alternatives carry the same evidence.

## Verification

Contract tests validate the canonical nine-stage journey, function reference,
single permitted artifact, immutable authored diff, explicit alternatives,
non-AI goals, safety evidence and malformed-suggestion rejection.
