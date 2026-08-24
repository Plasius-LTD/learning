# Road Hopper Rally reference-module catalog design

## Catalog projection

Junior Coder path `1.4.0` contains nineteen module records. Road Hopper Rally is
module `2.1.0`, estimated at 450 minutes across Board, Hopper, Traffic, River,
Rules and Game missions. Paddle Pulse remains `2.0.0`; the other seventeen
records remain version `1.1.0`.

The Road Hopper record describes product metadata, materials, pricing, rubric,
agents and its completion badge. Its `externalContent` field identifies the
independently released course implementation:

- package: `@plasius/learning-road-hopper-rally`
- version: `1.1.0`
- export: `ROAD_HOPPER_RALLY_COURSE_V3`
- schema version: `3`
- digest: canonical manifest JSON SHA-256

## Consumer checks

A consumer deliberately selecting path `1.4.0` resolves the exact package,
imports only the entry point appropriate to its trust boundary, canonicalizes
the exported manifest, verifies schema `3` and compares the digest. Any
mismatch fails closed. The browser must never import the package's
server-evaluator entry point.

The learner projection provides one typed activity for each stage in the
Learn → Predict → Build → Run → Assess → Inspect → Fix → Explain → Reward
cycle. Consumers collect the evidence required by the active activity; they do
not expose a generic stage-completion control or infer that one assessment
completed an entire mission.

The catalog rubric keeps the protected final assessment mandatory. Backend
adapters own authoritative re-execution and completion evidence; frontend
scores and traces are informational only.

## Compatibility

The external-content field is optional, so older serialized module records do
not gain a property. A SHA-256 regression fixture covers the serialized `1.1.0`
path. The immutable `1.2.0` and `1.3.0` paths retain Road Hopper `2.0.0` and
its package `1.0.0` reference. The mission-authoring contracts and their
existing Road Hopper exemplar are unchanged.
