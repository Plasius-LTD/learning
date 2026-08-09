# TDR 0012: Vibe Idea Studio uses bounded goals and acceptance tests

- Status: Accepted
- Date: 2026-08-09

## Context

Idea-to-prototype learning should teach children to define an audience, a goal
and evidence of success before asking for code. An open prompt could collect
personal information, produce unreviewable scope or make provider output the
undeclared source of truth.

## Decision

Mission one supplies child-safe idea, audience and acceptance-test cards for a
small rescue-card template. The chosen path states a concrete three-star goal.
The deterministic starter assessment reports the unmet test before one
`MissionBoundedSuggestionV1` proposes an exact star-count change in the sole
permitted learner artifact.

The learner predicts the result, reviews labelled removed and added lines, and
explicitly accepts or rejects the immutable snapshot. The same deterministic
tests run afterwards. AI remains optional and cannot broaden the template,
edit, score, pass, reward, publish or reveal protected tests.

## Safeguards

- No open prompt, free-form content or arbitrary file selection.
- No personal data, network, account, camera, microphone, storage or hardware.
- One documented setting changes; template and supplied message are preserved.
- Cards, diff and acceptance evidence have keyboard and text equivalents.
- Authored guidance remains available when a provider is absent or denied.
- Protected boundary tests and facilitator answers remain separate.

## Verification

Contract tests validate the canonical nine-stage journey, idea-card interaction,
complete function reference, single permitted artifact, explicit accept/reject,
deterministic non-AI completion and malformed-suggestion rejection.
