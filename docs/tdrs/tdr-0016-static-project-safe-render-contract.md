# TDR 0016: Public projects render trusted models, never learner source

- Status: Accepted
- Date: 2026-08-09

## Context

Even heavily filtered HTML or JavaScript supplied by a learner can create an
unexpected execution or data boundary. The three launch web projects already
use bounded parsers with fictional choices, so their visible outcome can be
represented without carrying executable code into the public surface.

## Decision

`StaticProjectSafeRenderV1` is a discriminated union of three strict render
models. Every text, number, layout, command and state value is selected from a
closed set. Completion-specific safeguards such as saved restart state,
reduced motion and confirmed robot commands are literal `true` requirements.

The snapshot validator checks module/render agreement and every field in the
closed set. Adapters retain raw source privately if needed, store only its
digest in the portable contract, and use trusted renderer code for public HTML.

## Verification

Package tests cover valid records, incomplete assessment, mandatory-safety
failure, missing scan evidence, module/render mismatch, values outside the
allow-list, stale approval statements, insecure URLs, slug mismatch and invalid
publication lifecycles.
