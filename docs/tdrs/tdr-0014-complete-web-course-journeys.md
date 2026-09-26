# TDR 0014: Complete editable web course journeys

Status: Accepted for learner-content authoring; host delivery remains pending.
Date: 2026-09-26. Task: #79. Parent Feature: studio #1704; Story: studio #2236.
Inherited remote flag: `learning.junior-coder.workspace.enabled`. The host also
requires its default-disabled `learning.junior-coder.courses-v2.enabled` gate and
existing account-bound learning access. Ordinary bound accounts need no payment;
guardian, publishing and hardware protections remain separate.

## Project and runtime boundary

Each of the three lazy course subpaths exports its versioned `course` and eighteen
learner-visible `practice` questions. Six missions contain the existing nine
activity types, independently authored instruction/help, goals and extensions.
Starter projects contain an HTML fragment (24,000 characters), CSS (16,000) and
pure JavaScript (32,000). Later behaviour is intentionally unfinished; a starter
is a teaching baseline, never a reference solution or proof of capstone success.

The internal web authoring helper shares only file definitions, readable styles
and runtime-binding documentation. It adds no public root import or runtime
dependency. Native headings, labels, meters, buttons, forms and text communicate
state without relying on colour. Styles wrap at narrow widths, preserve focus,
support colour themes and respect reduced motion. Hosts must still verify actual
contrast, keyboard/touch operation, focus retention, screen-reader presentation,
320px layouts and zoom against WCAG 2.2 AA; authored instructions do not prove
those checks passed.

The host compiles supported HTML/CSS with the separately released bounded `/web`
runtime and executes `initialState`, `update` and `view` in its isolated JavaScript
worker with a hard deadline. Only inert nodes, known native properties, text and
explicit action/field metadata enter a sandboxed preview with restrictive CSP.
No learner DOM, network, storage, device clock, external resource or hardware
access is introduced. Preserve native focus/selection when updating the preview;
form submission emits one action and cannot navigate. Never trust client-generated
scores or public formative answers as completion evidence.

## Progressive assessment scope

| Course | Missions 1–3 | Missions 4–6 |
| --- | --- | --- |
| Adventure Mission Planner | Semantic page and truthful empty projection; bounded fields and linked validation errors; atomic record creation and stable identities | Exact-ID revision and non-destructive filtering; whole-snapshot validation/recovery; integrated accessible capstone |
| Creature Care Dashboard | Labelled need data; guarded feed/play accounting; bounded deterministic time | Rest versus pause and fresh reset; truthful bounded history plus naming; integrated accessible capstone |
| Robot Mission Control | Honest disconnected panel; connection and basic telemetry; explicit arming and validated commands | Unconditional STOP and deliberate recovery; expiry, ordering, hazards and bounded history; integrated accessible capstone |

Assess only introduced requirements at intermediate milestones, retaining earlier
ones cumulatively. Do not fail Creature mission two for the history intentionally
taught in mission five, or demand the planner's later storage at its first form
milestone. Final assessment requires the entire documented contract. Read-only
formative predictions have explanatory feedback; build/fix/reward and final
completion need host-verified evidence tied to the current saved source digest.

## Model decisions

Planner records are bounded to twenty, carry stable monotonically allocated IDs
and have validated title, minutes, priority and completion fields. Add and save
are distinct modes. Filtering preserves records and clears editing. Recovery
validates a complete versioned snapshot, including exact keys, unique identities
and counter ordering, before replacing the working plan. Simulated preview
storage lives in model state and is separate from account saves of the project
source; reset must not imply deleting course completion.

Creature time arrives as bounded seconds, with fractional rate calculations and
a one-hour simulation cap. Sleeping changes energy recovery; pause freezes time
and care actions. Successful care transitions alone enter bounded history. Native
meters have text labels, and tick values stay outside live regions to avoid
overwhelming deliberate-action feedback. The creature is fictional game data,
not a claim about caring for real animals.

Control-panel time arrives as bounded millisecond ticks. Connection, safe
observations, arming, prepared fields and actual motor outputs remain separate.
Telemetry is fresh through age 500ms and stale afterwards. Sequence ordering,
strict field validation and explicit hazard checks prevent old or invalid data
renewing permission. STOP, disconnect and fault paths zero/disarm even if fields
or history cannot be processed. Better telemetry never restarts movement without
deliberate arming and a separate command. The host must independently stop its
virtual actuators on execution failure; no course result grants real hardware
permission.

## Validation and delivery

Requirements-derived content tests cover all three manifests, activity/question
identity, editable file bounds, semantic starter structure and nonmutating starter
state/projections/reset. The only code evaluated by these package tests is fixed
version-controlled teaching source in a timed test context, never learner input.
Published subpaths require ESM/CommonJS packaging checks and changed-source LCOV.

Before exposing a course, the host must prove a correct reference implementation
passes each progressive assessment, the incomplete starter and plausible wrong
solutions fail the appropriate later assessments, and malformed/edge cases fail
safely. Include corrupt/duplicate snapshots, resource boundaries, pause/expiry,
direct actions bypassing disabled controls, STOP with invalid fields, stale and
future packets, exhausted counters and execution timeout. Complete account saves,
nine named slots, conflicts, evidence, replay, auth/guardian protections and the
accessible browser journey remain Story #2236 acceptance gates. Package content
publication alone cannot mark any complete playable module delivered.
