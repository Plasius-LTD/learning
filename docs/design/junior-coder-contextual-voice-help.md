# Junior Coder contextual voice-help contracts

## Purpose

Define one infrastructure-neutral vocabulary for contextual documentation,
Guardian voice consent, explicit short microphone questions and canonical
spoken answers. Runtime adapters remain responsible for accessibility,
authorization, feature flags, storage, private-edge health and provider calls.

## Identifier boundary

`ContextualHelpIdentifierV1` contains only opaque IDs and immutable versions:

`contract → module → module version → manifest version → help kind → help ID`

It contains no source, transcript, arbitrary speech text, account identifier or
assessment score. The four help kinds are command, visual block, generated code
and assessment diagnostic.

## Consent and processing

`GuardianVoiceConsentV1` records the adult actor, child subject, policy version,
granted or withdrawn state, timestamp and the sole version-one processing route
`private-edge-only`. It is intentionally distinct from AI consent.

`VoiceHelpAvailabilityV1` treats read-aloud and microphone availability
independently. Microphone metadata is fixed at a maximum ten seconds and two
MiB. Raw audio and transcripts are request-memory-only.

## Bounded questions

The closed intent list supports command description, inputs, examples, current
assessment failure, the next experiment, repeat, stop and unresolved guidance.
Results may select only documented actions and retain no authority over scores,
rewards, publication or hardware.

The transient transcript exists only so a learner can see what was recognised.
It must be returned with `no-store` and discarded by the consuming adapter when
the current interaction ends.

## Canonical spoken help

`CanonicalSpokenHelpDescriptorV1` carries a canonical text ID and SHA-256
digest, not the authoritative text itself. It requires non-personal,
non-learner `system-generic` content with global exact-only reuse. A server must
resolve the text from its own versioned documentation before synthesis.

## Exclusions

The package contains no microphone capture, HTTP, identity resolution,
entitlement lookup, consent persistence, logging, cache storage, cloud SDK,
transcription, synthesis or model-provider integration.
