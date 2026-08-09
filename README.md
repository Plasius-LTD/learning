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

## Validate a Guardian-approved static project

The publishing contracts cover only immutable evidence and safe render models.
HTTP, persistence, identity checks, scanning implementations and hosting remain
consumer responsibilities. A public renderer must consume the allow-listed
`renderModel`; it must never execute learner source.

```ts
import {
  assertValidStaticProjectGuardianApproval,
  assertValidStaticProjectPublication,
  assertValidStaticProjectSnapshot,
} from "@plasius/learning";

assertValidStaticProjectSnapshot(snapshot);
assertValidStaticProjectGuardianApproval(approval);
assertValidStaticProjectPublication(publication);
```

The version-one contract supports the three launch web projects, requires a
score of at least 80 plus mandatory safety evidence, records all eight scanner
checks, binds adult approval to the exact snapshot digest, and requires an
unlisted HTTPS URL with a random slug and explicit expiry.

## Validate mission authoring

Mission authoring is additive to the immutable catalog. A bundle contains
physically separate learner and facilitator projections and is checked against
the exact catalog module that owns its rubric, mission and badges.

```ts
import {
  ADVENTURE_MISSION_PLANNER_MISSION_ONE_AUTHORING_V1,
  BEACON_BOT_MISSION_ONE_AUTHORING_V1,
  CREATURE_CARE_DASHBOARD_MISSION_ONE_AUTHORING_V1,
  DANCE_ROVER_MISSION_ONE_AUTHORING_V1,
  JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1,
  METEOR_SHIELD_MISSION_ONE_AUTHORING_V1,
  OBSTACLE_EXPLORER_MISSION_ONE_AUTHORING_V1,
  PADDLE_PULSE_MISSION_ONE_AUTHORING_V1,
  PIXEL_TRAIL_CHALLENGE_MISSION_ONE_AUTHORING_V1,
  RAINBOW_RESCUE_ROVER_MISSION_ONE_AUTHORING_V1,
  RESCUE_CREW_COMMANDER_MISSION_ONE_AUTHORING_V1,
  ROAD_HOPPER_RALLY_MISSION_ONE_AUTHORING_V1,
  ROBOT_MISSION_CONTROL_MISSION_ONE_AUTHORING_V1,
  ROBOT_MAZE_DASH_MISSION_ONE_AUTHORING_V1,
  SERVO_CREATURE_MISSION_ONE_AUTHORING_V1,
  SKYWING_SPRINT_MISSION_ONE_AUTHORING_V1,
  STAR_DEFENDER_SQUADRON_MISSION_ONE_AUTHORING_V1,
  VIBE_BUG_DETECTIVE_MISSION_ONE_AUTHORING_V1,
  VIBE_GAME_REMIX_LAB_MISSION_ONE_AUTHORING_V1,
  VIBE_IDEA_STUDIO_MISSION_ONE_AUTHORING_V1,
  assertValidMissionAuthoringBundle,
} from "@plasius/learning";

const roadHopper = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "road-hopper-rally",
);
const robotMaze = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "robot-maze-dash",
);
const skywing = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "skywing-sprint",
);
const paddlePulse = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "paddle-pulse",
);
const meteorShield = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "meteor-shield",
);
const rescueCrewCommander = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "rescue-crew-commander",
);
const pixelTrailChallenge = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "pixel-trail-challenge",
);
const starDefenderSquadron = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "star-defender-squadron",
);
const beaconBot = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "beacon-bot",
);
const servoCreature = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "servo-creature",
);
const danceRover = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "dance-rover",
);
const obstacleExplorer = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "obstacle-explorer",
);
const rainbowRescueRover = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "rainbow-rescue-rover",
);
const vibeGameRemixLab = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "vibe-game-remix-lab",
);
const vibeBugDetective = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "vibe-bug-detective",
);
const vibeIdeaStudio = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "vibe-idea-studio",
);
const adventureMissionPlanner = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "adventure-mission-planner",
);
const creatureCareDashboard = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "creature-care-dashboard",
);
const robotMissionControl = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "robot-mission-control",
);

if (
  !roadHopper ||
  !robotMaze ||
  !skywing ||
  !paddlePulse ||
  !meteorShield ||
  !rescueCrewCommander ||
  !pixelTrailChallenge ||
  !starDefenderSquadron ||
  !beaconBot ||
  !servoCreature ||
  !danceRover ||
  !obstacleExplorer ||
  !rainbowRescueRover ||
  !vibeGameRemixLab ||
  !vibeBugDetective ||
  !vibeIdeaStudio ||
  !adventureMissionPlanner ||
  !creatureCareDashboard ||
  !robotMissionControl
) {
  throw new Error("Junior Coder module is missing");
}

assertValidMissionAuthoringBundle(
  ROAD_HOPPER_RALLY_MISSION_ONE_AUTHORING_V1,
  roadHopper,
);
assertValidMissionAuthoringBundle(
  ROBOT_MAZE_DASH_MISSION_ONE_AUTHORING_V1,
  robotMaze,
);
assertValidMissionAuthoringBundle(
  SKYWING_SPRINT_MISSION_ONE_AUTHORING_V1,
  skywing,
);
assertValidMissionAuthoringBundle(
  PADDLE_PULSE_MISSION_ONE_AUTHORING_V1,
  paddlePulse,
);
assertValidMissionAuthoringBundle(
  METEOR_SHIELD_MISSION_ONE_AUTHORING_V1,
  meteorShield,
);
assertValidMissionAuthoringBundle(
  RESCUE_CREW_COMMANDER_MISSION_ONE_AUTHORING_V1,
  rescueCrewCommander,
);
assertValidMissionAuthoringBundle(
  PIXEL_TRAIL_CHALLENGE_MISSION_ONE_AUTHORING_V1,
  pixelTrailChallenge,
);
assertValidMissionAuthoringBundle(
  STAR_DEFENDER_SQUADRON_MISSION_ONE_AUTHORING_V1,
  starDefenderSquadron,
);
assertValidMissionAuthoringBundle(
  BEACON_BOT_MISSION_ONE_AUTHORING_V1,
  beaconBot,
);
assertValidMissionAuthoringBundle(
  SERVO_CREATURE_MISSION_ONE_AUTHORING_V1,
  servoCreature,
);
assertValidMissionAuthoringBundle(
  DANCE_ROVER_MISSION_ONE_AUTHORING_V1,
  danceRover,
);
assertValidMissionAuthoringBundle(
  OBSTACLE_EXPLORER_MISSION_ONE_AUTHORING_V1,
  obstacleExplorer,
);
assertValidMissionAuthoringBundle(
  RAINBOW_RESCUE_ROVER_MISSION_ONE_AUTHORING_V1,
  rainbowRescueRover,
);
assertValidMissionAuthoringBundle(
  VIBE_GAME_REMIX_LAB_MISSION_ONE_AUTHORING_V1,
  vibeGameRemixLab,
);
assertValidMissionAuthoringBundle(
  VIBE_BUG_DETECTIVE_MISSION_ONE_AUTHORING_V1,
  vibeBugDetective,
);
assertValidMissionAuthoringBundle(
  VIBE_IDEA_STUDIO_MISSION_ONE_AUTHORING_V1,
  vibeIdeaStudio,
);
assertValidMissionAuthoringBundle(
  ADVENTURE_MISSION_PLANNER_MISSION_ONE_AUTHORING_V1,
  adventureMissionPlanner,
);
assertValidMissionAuthoringBundle(
  CREATURE_CARE_DASHBOARD_MISSION_ONE_AUTHORING_V1,
  creatureCareDashboard,
);
assertValidMissionAuthoringBundle(
  ROBOT_MISSION_CONTROL_MISSION_ONE_AUTHORING_V1,
  robotMissionControl,
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
- Robotics authoring distinguishes the complete reusable path kit from the
  module's incremental items. Each component carries verification,
  compatibility-claim and physical-completion status.
- Unverified components cannot claim compatibility or physical completion.
  Simulator completion remains separate; physical export and its distinct
  badge require adult acknowledgement and evidence.
- Servo Creature documents its safe 30–150 degree simulator range while every
  physical servo, regulated supply and common-ground arrangement remains
  pending adult bench verification and unavailable to learner code.
- Dance Rover documents bounded direction, 0–60 percent simulated speed,
  timing, repeat and emergency-stop calls while every driver, motor, chassis
  and switched power arrangement remains pending adult lifted-wheel testing.
- Obstacle Explorer documents bounded simulated IR readings, Boolean route
  decisions, recovery attempts, watchdog timing and fail-safe stop while every
  rover and sensor remains pending adult calibration and lifted-wheel testing.
- Rainbow Rescue Rover documents simulated colour, target-zone, serial-command,
  heartbeat and fail-safe-stop planning while Camera Module 3 frames stay on
  the family Raspberry Pi. The website receives no frames, opens no camera or
  serial port, never activates motors, and every physical component remains
  pending adult bench verification.
- Vibe Game Remix Lab exposes one authored, evidence-bound diff against one
  permitted learner artifact. The learner predicts, reviews and explicitly
  accepts or rejects it; rejection preserves source, deterministic completion
  never needs AI, and open chat or automatic edits are outside the contract.
- Vibe Bug Detective starts from visible failing evidence, binds one authored
  repair to the current goal and permitted artifact, and requires learner
  prediction, explicit accept/reject and deterministic regression reruns.
- Vibe Idea Studio binds supplied child-safe idea, audience and acceptance-test
  cards to one permitted template. The learner predicts, reviews and controls
  the exact prototype diff before deterministic tests decide completion.
- Adventure Mission Planner documents semantic structure, validation, arrays,
  state, private simulated local save and an equivalent accessible summary.
  The learner reviews the exact persistence diff; no form transmits data and
  no network, real location or personal information enters the preview.
- Creature Care Dashboard documents components, events, bounded timers, status
  displays, responsive layouts and equivalent reduced-motion feedback. The
  learner controls the exact accessibility diff; no network, real schedule,
  background task or personal information enters the preview.
- Robot Mission Control documents commands, a fail-safe state machine, explicit
  confirmation, bounded telemetry and responsive chart/text views. The learner
  controls the exact confirmation diff; Web Serial, physical hardware and
  automatic approval remain outside the simulator.

See [the foundation design](docs/design/junior-coder-catalog-foundation.md),
[the uniform pricing design](docs/design/junior-coder-uniform-pricing.md),
[the mission authoring design](docs/design/junior-coder-mission-authoring.md),
[ADR 0001](docs/adrs/adr-0001-learning-domain-and-catalog-boundary.md), and
[ADR 0002](docs/adrs/adr-0002-immutable-module-repricing-and-admin-test-source.md),
[ADR 0003](docs/adrs/adr-0003-mission-authoring-manifests-are-additive-and-separated.md),
[ADR 0004](docs/adrs/adr-0004-robot-mission-hardware-disclosures-are-additive-and-fail-closed.md),
[TDR 0006](docs/tdrs/tdr-0006-servo-creature-safe-movement-and-power-authoring.md),
[TDR 0007](docs/tdrs/tdr-0007-dance-rover-fail-safe-movement-and-power-authoring.md),
and [TDR 0008](docs/tdrs/tdr-0008-obstacle-explorer-sensing-watchdog-and-fail-safe-authoring.md).
See also [TDR 0010](docs/tdrs/tdr-0010-vibe-game-remix-bounded-suggestion-authoring.md).
See also [TDR 0011](docs/tdrs/tdr-0011-vibe-bug-detective-evidence-led-repair.md).
See also [TDR 0012](docs/tdrs/tdr-0012-vibe-idea-studio-bounded-goal-prototyping.md).
See also [TDR 0013](docs/tdrs/tdr-0013-adventure-mission-planner-private-persistence.md).
See also [TDR 0014](docs/tdrs/tdr-0014-creature-care-dashboard-bounded-timers-and-motion.md).
See also [TDR 0015](docs/tdrs/tdr-0015-robot-mission-control-fail-safe-simulation.md).

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
