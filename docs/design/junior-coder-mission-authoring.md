# Junior Coder mission authoring and evidence

## Status

Implementation design for `Plasius-LTD/learning#3`, under Story
`Plasius-LTD/plasius-ltd-site#1714`, Feature
`Plasius-LTD/plasius-ltd-site#1704`, and Epic
`Plasius-LTD/plasius-ltd-site#1701`.

The inherited rollout flag is `learning.junior-coder.workspace.enabled`.
Publishing these contracts does not activate learner access.

## Outcome

Add a reusable authoring manifest that turns a catalog mission into a complete,
bounded learning journey:

`Learn → predict → build → run → assess → inspect → fix → explain → reward`

The manifest must be useful to site, sandbox, assessment and printable adapters
without importing HTTP, persistence, identity, economy, UI, cloud, code-execution
or model-provider dependencies into `@plasius/learning`.

## Compatibility boundary

The published `1.0.0` and `1.1.0` learning paths and module records are immutable.
Mission authoring is therefore an additive, separately versioned bundle keyed by
module ID, module version and mission ID. Existing `LearningModuleVersionV1`
records are not mutated or silently enriched.

Each bundle has two physically separate projections:

- a learner manifest containing instructions, readiness checks, starter
  artifacts, visible goals, interactions, accessibility alternatives, evidence,
  side adventures and reward references;
- a facilitator manifest containing protected goals, protected tests,
  solution-bearing artifacts and adult/facilitator prompts.

Consumers may publish only the learner projection. The package validator treats
cross-audience content as an authoring error.

## Contract model

The additive public entry point is `MissionAuthoringBundleV1`:

```text
MissionAuthoringBundleV1
├── version
├── moduleId + moduleVersion + missionId
├── learner
│   ├── estimatedMinutes
│   ├── stages
│   ├── readinessChecks
│   ├── artifacts
│   ├── goals
│   ├── interactions + accessibilityAlternatives
│   ├── evidenceRequirements
│   ├── sideAdventures
│   └── rewardBindings
└── facilitator
    ├── artifacts
    ├── protectedGoals
    └── prompts
```

All references use stable authored IDs. The bundle identifiers must match the
catalog module, module version and mission supplied to the validator. Artifact,
goal, criterion, interaction, accessibility-alternative, evidence,
side-adventure and reward-binding IDs must be unique within their respective
collections. Dangling references fail validation.

### Mission stages

A learner mission contains each of the nine stages exactly once and in the
canonical order. Every stage has child-readable instructions and may reference
learner artifact IDs. A mission lasts 15–25 minutes.

### Readiness and starter artifacts

Readiness checks are explicitly unscored. Starter artifacts declare their kind,
audience and whether they contain a solution. Learner artifacts cannot be answer
keys, protected tests, facilitator notes or otherwise solution-bearing.

Artifact references are metadata rather than file contents or URLs. Storage,
download authorization and signed URL generation remain consumer concerns.

### Goals and deterministic authority

Visible goals remain in the learner manifest. Protected goals remain in the
facilitator manifest. Goal IDs are unique across both projections and reference
known rubric criteria.

Every completion-required goal declares whether AI is required. The validator
rejects AI-dependent completion. At least one completion-required goal must bind
to a mandatory safety rubric criterion. Rubric totals and approved dimension
weights remain deterministic package invariants.

### Accessibility

Interaction requirements declare their primary mode. Pointer-only, drag-only,
audio-only, colour-only and motion-only interactions require an equivalent
alternative such as keyboard, text, shape, symbol or reduced-motion operation.
Alternative references must resolve within the learner manifest and must declare
an equivalent learning outcome.

### Evidence, side adventures and rewards

Evidence requirements reference known goals, collect no personal data and use a
bounded retention class. Side adventures are optional and cannot affect
completion. Reward references are deterministic, non-random and non-convertible
to Tokens.

Learner evidence and reward bindings can reference only visible learner goal
IDs. Protected goal IDs never cross into the learner projection.

Evidence records describe what must be captured (`assessment-result`,
`learner-explanation`, `project-snapshot` or `adult-signoff`) without containing
the evidence itself. Retention is one of `attempt`, `entitlement` or
`adult-signoff`; consumers remain responsible for enforcing the selected policy.

## Exemplar

The package exports one original Road Hopper Rally mission-authoring bundle. It
demonstrates the full stage sequence, an unscored prediction, learner starter
artifacts, visible and protected goals, a keyboard alternative to pointer input,
deterministic evidence, an optional remix and an evidence-bound badge reference.

The exemplar is not a prerequisite for Road Hopper Rally or any other sellable
module. It is an authoring reference and test fixture.

## Validation

The validator receives the authoring bundle and its immutable catalog module,
derives the rubric, mission and badge authorities from that module, and returns
every issue rather than throwing on the first issue. It rejects:

- missing, duplicated or out-of-order stages;
- mission durations outside 15–25 minutes;
- missing or scored readiness checks;
- missing starter artifacts;
- answer or protected-test leakage into learner content;
- learner content in the facilitator projection;
- missing, duplicated or incorrectly projected goals;
- references to unknown rubric criteria;
- invalid rubric totals or dimension weights;
- missing completion-required safety evidence;
- AI-dependent completion;
- inaccessible single-mode interactions or broken alternative references;
- missing, personal-data-bearing or dangling evidence requirements;
- mandatory side adventures; and
- random, Token-convertible or evidence-free rewards.

An assertion helper formats the complete issue list for CI and authoring tools.

## Rollback

The package change has no runtime rollout side effect. Consuming applications
must continue to evaluate `learning.junior-coder.workspace.enabled` and their
capability/entitlement authority before exposing a workspace. A consumer can
roll back by remaining on the previous package version or by ignoring the new
additive exports; published catalog records remain unchanged.

## Verification

- Write validator requirements as tests before runtime implementation.
- Cover the valid exemplar and every failure class.
- Keep every changed runtime source file in combined LCOV at 80% or higher.
- Run lint, typecheck, unit tests with coverage, build, dependency audit and
  public-package inspection.
- Publish only through the approved package CD workflow on the quarantined
  self-hosted runner group.
