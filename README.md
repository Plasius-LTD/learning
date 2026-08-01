# @plasius/learning

`@plasius/learning` is the framework- and infrastructure-neutral contract package for versioned Plasius learning products. It defines learning paths, sellable module versions, course-material and hardware disclosures, deterministic assessment, bounded module-agent roles, evidence, and rewards.

The package does **not** provide HTTP handlers, persistence, authentication, Token accounting, model-provider calls, code execution, or UI components. Those concerns belong in consuming adapters.

## Junior Coder catalog

The initial immutable catalog is exported as
`JUNIOR_CODER_ROBOT_RESCUE_PATH_V1`. The current uniformly priced pilot
catalog is exported as `JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1`, with
`JUNIOR_CODER_ROBOT_RESCUE_PATH_CURRENT` available to adapters that
intentionally follow published successors. Each contains 19 independently
sellable, self-contained project modules:

- 8 original arcade game modules;
- 5 simulator-backed robotics modules;
- 3 constrained Vibe Coding modules;
- 3 web application modules.

Both catalogs remain in `pilot-grant-only` commercial state. The immutable
`1.1.0` modules each cost 50 Tokens (50,000 subunits), carrying a
non-redeemable £5 reference value. Price metadata is not authorization to
enable public checkout.

## Install

```bash
npm install @plasius/learning
```

## Validate a catalog

```ts
import {
  JUNIOR_CODER_ROBOT_RESCUE_PATH_CURRENT,
  assertValidLearningPath,
} from "@plasius/learning";

assertValidLearningPath(JUNIOR_CODER_ROBOT_RESCUE_PATH_CURRENT);
```

## Calculate an assessment

```ts
import { calculateAssessment } from "@plasius/learning";

const result = calculateAssessment(rubric, [
  { criterionId: "build", passed: true },
  { criterionId: "safety", passed: false },
]);

// A mandatory safety failure prevents completion regardless of total score.
console.log(result.score, result.completed);
```

## Validate mission authoring

Mission authoring is additive to the immutable catalog. A bundle contains
physically separate learner and facilitator projections and is checked against
the exact catalog module that owns its rubric, mission and badges.

```ts
import {
  JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1,
  ROAD_HOPPER_RALLY_MISSION_ONE_AUTHORING_V1,
  ROBOT_MAZE_DASH_MISSION_ONE_AUTHORING_V1,
  assertValidMissionAuthoringBundle,
} from "@plasius/learning";

const roadHopper = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "road-hopper-rally",
);
const robotMaze = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "robot-maze-dash",
);

if (!roadHopper || !robotMaze) throw new Error("Junior Coder module is missing");

assertValidMissionAuthoringBundle(
  ROAD_HOPPER_RALLY_MISSION_ONE_AUTHORING_V1,
  roadHopper,
);
assertValidMissionAuthoringBundle(
  ROBOT_MAZE_DASH_MISSION_ONE_AUTHORING_V1,
  robotMaze,
);
```

## Contract rules

- Published IDs and versions are immutable.
- Reference prices are product-copy metadata and never create cash redemption
  rights.
- A module entitlement must bind to an exact module version.
- `admin-test-grant` is distinct from pilot, support and paid purchase sources;
  consuming services must not attach an economy transaction to it.
- Learner material never contains facilitator-only solutions or protected tests.
- Mission stages follow `learn → predict → build → run → assess → inspect → fix
  → explain → reward`, and readiness checks never affect the score.
- Learner evidence and rewards can bind only to visible goals; protected goal
  IDs stay in the facilitator projection.
- Visual-programming missions must provide an equivalent labelled control for
  every drag interaction so learners can complete the same work with keyboard
  or pointer buttons.
- Rubric criteria total exactly 100 points.
- Completion requires a score of at least 80 and every mandatory criterion.
- Module agents may explain evidence and propose a bounded next step, but cannot assign scores or rewards.
- Physical requirements are disclosed by a versioned manifest before purchase.

See [the foundation design](docs/design/junior-coder-catalog-foundation.md),
[the uniform pricing design](docs/design/junior-coder-uniform-pricing.md),
[the mission authoring design](docs/design/junior-coder-mission-authoring.md),
[ADR 0001](docs/adrs/adr-0001-learning-domain-and-catalog-boundary.md), and
[ADR 0002](docs/adrs/adr-0002-immutable-module-repricing-and-admin-test-source.md),
and [ADR 0003](docs/adrs/adr-0003-mission-authoring-manifests-are-additive-and-separated.md).

## Development

```bash
npm ci
npm run lint
npm run typecheck
npm run test:coverage
npm run build
npm run pack:check
```

Node.js 24 is required. Public pull-request code is validated on an isolated
GitHub-hosted Linux runner with read-only workflow permissions. Main-branch CI
and both release jobs explicitly select the approved
`Public CI - Quarantined` self-hosted runner group. `CI_RUNNER_GROUP` /
`CI_RUNNER_LABELS` and `CD_RUNNER_GROUP` / `CD_RUNNER_LABELS` are reserved for
governed operator configuration. The organisation group remains restricted to
allowlisted `main` workflows and selected repositories. Release coverage and
the CycloneDX SBOM are retained even when an external coverage or provenance
service is unavailable. Release tags and GitHub Releases use a current-repository
GitHub App token with explicit Contents and Workflows write permissions; npm
publication continues to use only the protected `NPM_TOKEN`. Both release jobs
install a checksum-pinned GitHub CLI under `RUNNER_TEMP`, so runner images do
not need a mutable system-wide `gh` installation. Publication checks out the
verified current release-branch HEAD, including the workflow tooling used by a
`bump=none` recovery.
