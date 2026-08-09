# ADR 0006: Contextual voice help is manifest-bound and transient

- Status: Accepted
- Date: 2026-08-09

## Context

Junior Coder needs the same command documentation through pointer, touch,
keyboard, screen-reader and spoken interactions. Microphone input belongs to a
child-safeguarding boundary and must not become open chat, a new assessment
authority or reusable learner data. Generated speech may be shared only when it
comes from canonical non-personal course text.

## Decision

The package defines additive version-one contracts that:

1. bind every help identifier to an immutable module and manifest version;
2. record Guardian voice consent separately from general AI consent and permit
   only the private-edge transcription route;
3. fix microphone input at ten seconds and two MiB with request-memory-only
   audio and transcript retention;
4. limit question outcomes to a closed intent and action vocabulary;
5. keep score, reward, publication and hardware authority false; and
6. describe spoken help using an authoritative text digest and canonical ID,
   with global `system-generic`, exact-only reuse and no learner content.

The package does not accept audio, synthesize speech, persist consent, evaluate
capabilities or call a provider. Consuming adapters own those boundaries and
must fail closed independently.

## Consequences

- A help request cannot carry source code or arbitrary synthesis text in its
  identifier.
- A transcript may be returned for temporary learner confirmation but cannot
  become durable evidence.
- Provider and cache implementations may change without changing learning
  ownership or consent semantics.
- Read-aloud can remain available when microphone input is unavailable.

## Rollback

Consumers can disable microphone and synthesis routes while retaining the
additive contracts. Existing catalog, assessment and mission contracts remain
unchanged.
