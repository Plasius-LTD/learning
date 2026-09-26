# @plasius/learning

`@plasius/learning` is the framework- and infrastructure-neutral contract package for versioned Plasius learning products. It defines learning paths, sellable module versions, course-material and hardware disclosures, deterministic assessment, bounded module-agent roles, evidence, and rewards.

The package does **not** provide HTTP handlers, persistence, authentication, Token accounting, model-provider calls, code execution, or UI components. Those concerns belong in consuming adapters.

## Junior Coder catalog

The initial immutable catalog is exported as
`JUNIOR_CODER_ROBOT_RESCUE_PATH_V1`, and its uniformly priced successor remains
available as `JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1`. Path `1.2.0` upgrades Road
Hopper Rally, path `1.3.0` adds Paddle Pulse `2.0.0`, and path `1.4.0` is
exported as `JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_4` and selected by
`JUNIOR_CODER_ROBOT_RESCUE_PATH_CURRENT`. It advances Road Hopper Rally to the
evidence-led module `2.1.0`; the other eighteen module records retain their
prior immutable versions. Each path
contains 19 independently sellable, self-contained project modules:

- 8 original arcade game modules;
- 5 simulator-backed robotics modules;
- 3 constrained Vibe Coding modules;
- 3 web application modules.

All catalogs remain in `pilot-grant-only` commercial state. The immutable
`1.1.0` modules, Road Hopper Rally `2.1.0` and Paddle Pulse `2.0.0` each cost 50 Tokens (50,000 subunits), carrying a
non-redeemable £5 reference value. Price metadata is not authorization to
enable public checkout.

Road Hopper Rally `2.1.0` is a 450-minute, six-mission catalog record whose
54 evidence-led activities, starter project, deterministic runtime, original
assets and assessment definitions live in
`@plasius/learning-road-hopper-rally@1.1.0`. The catalog pins the exact
`ROAD_HOPPER_RALLY_COURSE_V3` export, schema `3` and its canonical SHA-256 digest
through `ExternalLearningContentReferenceV1`; it does not import or bundle the
executable content package. Road Hopper `2.0.0` and its package `1.0.0`
reference remain available unchanged for rollback and existing consumers.

Paddle Pulse `2.0.0` is a 360-minute, six-mission catalog record whose 54-stage
course, declarative program contracts, deterministic 60 Hz engine and protected
assessment live in `@plasius/learning-paddle-pulse@0.1.0`. The catalog pins the
exact `PADDLE_PULSE_MODULE_V2` export, schema `2` and canonical SHA-256 digest
without importing the package. Paddle Pulse `1.1.0` and its mission-authoring
export remain available unchanged.

## Complete course and account-save contracts

Complete learner curricula are separate lazy entry points. Import
`{ course, practice }` from `@plasius/learning/courses/robot-maze-dash` for the
Robot Maze `2.0.0` course: six distinct missions, 54 guided activities, a bounded
visual starter project, function references, formative concept checks, debugging
guidance and extensions. Formative answers are learner-safe teaching material;
they are not protected runtime assessments or completion authority. Hosts verify
responses, run protected checks and persist evidence independently.
The root exports `CoursePracticeQuestion` as a type without importing lesson data.

The same lazy course boundary also provides `courses/skywing-sprint`,
`courses/meteor-shield` and `courses/pixel-trail-challenge`. Each has six authored
missions and 54 activities, 18 formative questions, a real editable `game.js`
starter and explicit state/input references. Their respective sequences teach
flight and input timing; vector defence, timed shields and resource accounting;
and ordered grid movement, bounded placement and moving-tail collisions. Hosts
must implement and verify each documented game contract before exposing its
course; lesson publication alone is not evidence of a working playable module.

`courses/rescue-crew-commander` adds shared-job ownership, bounded breadth-first
routes, deterministic dispatch, round-trip energy, delivery conservation and
recoverable route changes. `courses/star-defender-squadron` adds input/formation
control, single-hit projectiles, damage grace periods, timed shields and complete
wave outcomes. Both follow the same six-mission/54-activity contract with authored
questions, starter projects and references, and require their own host validation.

Robot curricula use the documented C++ simulator subset through the separately
released runtime, with no physical equipment required. `courses/beacon-bot` teaches
signals, non-blocking time, reusable patterns, input edges and bounded messages.
`courses/servo-creature` teaches joint bounds, smooth motion, timed poses, modes,
touch and fresh proximity checks. `courses/dance-rover` teaches differential
movement, acceleration limits, reusable choreography and deliberate recovery.
`courses/obstacle-explorer` teaches hysteresis, distinct sensor evidence, bounded
turns, watchdogs and stopped arrival. `courses/rainbow-rescue-rover` teaches
recognition confidence, steering, command identities, heartbeat expiry and
repeat-safe rescue evidence. Each has 54 activities and 18 formative checks.
Existing guardian and hardware protections remain separate from course completion.

The three lazy Vibe curricula (`courses/vibe-game-remix-lab`,
`courses/vibe-bug-detective` and `courses/vibe-idea-studio`) each provide six missions,
54 activities and 18 concept checks around editable JavaScript projects, bounded
brief/evidence files and learner-authored replay cases. Their projects respectively
teach a rescue-game remix with intermediate dash checks, evidence-led repairs of
an intentionally broken game, and a budgeted mission-board prototype with undo
and filtering. Idea Studio explicitly distinguishes test-first contract predictions
from the final requirement that those cases pass against the learner's source.

These entries also export `suggestions` using `LearningCourseSuggestionV1`, which
reuses `MissionBoundedSuggestionV1`. Authored proposals include incorrect changes
for learners to reject with evidence; publication is not an endorsement of every
proposed replacement. No live AI is required. `parseLearningCourseSuggestion`
validates stage and file references plus bounded proposal fields.
`applyLearningCourseSuggestion` builds a new validated project using one exact,
unambiguous literal snippet match. It rejects stale/ambiguous context and rechecks
project limits after replacement. Hosts must show the actual diff and obtain an
explicit learner choice before using it. Neither helper executes code, approves
a change, writes storage or awards evidence; independently assess the saved result.

The web entries `courses/adventure-mission-planner`,
`courses/creature-care-dashboard` and `courses/robot-mission-control` complete the
set of seventeen learner curricula. Each exports `course` and `practice`, with
six authored missions, 54 activities, 18 formative checks and editable
`index.html`, `app.css` and `app.js` starter files. The planner teaches semantic
forms, validated records, stable identities, revision and corrupt-snapshot
recovery. Creature Care teaches resource accounting, deterministic time, rest
versus pause and bounded history. Mission Control teaches connection, explicit
arming, bounded motor commands, independent STOP, telemetry expiry and deliberate
recovery. All include responsive styling, native labels, focus, readable feedback
and accessibility verification in the authored journey.

Web starters deliberately leave later behaviour for the learner to implement.
They are HTML fragments with explicit data/action bindings and pure JavaScript
state functions, not unrestricted browser scripts. The separately released
runtime's lazy `/web` compiler and isolated JavaScript worker are host facilities;
this package imports neither. Preview plan storage is simulated state, distinct
from account source saves. Robot control is virtual and grants no hardware access.
See [web course design](docs/tdrs/tdr-0014-complete-web-course-journeys.md) for the
runtime boundary, progressive assessment scope and host acceptance obligations.

The runtime is supplied separately by `@plasius/learning-runtime`; this package
does not execute the project or declare host readiness. The seventeen-course
programme remains in development. This additive content does not alter immutable
catalogue/pricing records or enable a public host rollout. New hosts compose
their existing access controls with an independently disabled complete-course
flag and must validate the full learner journey before enabling it.

`LearningCourseV1` defines six missions with nine activities each, editable project
files, learner guidance and a capstone assessment identifier. Use
`validateLearningCourse` or `parseLearningCourse` for publication and loading.
Structural validity is only one acceptance gate; authored content, working runtime
and learner-journey evidence must also be verified for each course.

`parseLearningCourseDraft` accepts only the declared project files, content version
and navigation. It rejects account identifiers, scores, completion and evidence.
`parseLearningSaveSlotId` accepts `auto` and manual slots `1`–`9`. Source limits are
64,000 characters per file and 96,000 total across at most eight declared files.

The pure progression functions `createLearningCourseProgress`,
`completeVerifiedLearningActivity`, `recordLearningCourseAssessment`,
`parseLearningCourseProgress` and `resolveLearningCourseStage` support host-owned
state. They are **not browser mutation DTOs**. Hosts validate each activity, run
protected deterministic checks, bind source digests and references to the signed-in
account, and supply conditional/idempotent storage. Repair/reward need passing
current-source evidence; completion additionally needs a passing capstone after
all six missions. Loading a project cannot restore or manufacture progress.

These contracts do not supply the seventeen full course implementations, execute
learner code, save records or grant access. See [ADR 0009](docs/adrs/adr-0009-complete-course-project-and-progress-contracts.md).

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

Consumers resolving external course content must verify all five reference
fields before use:

```ts
import {
  ROAD_HOPPER_RALLY_EXTERNAL_CONTENT_V2,
  isExternalLearningContentReferenceV1,
} from "@plasius/learning";

if (!isExternalLearningContentReferenceV1(ROAD_HOPPER_RALLY_EXTERNAL_CONTENT_V2)) {
  throw new Error("Invalid external learning content reference");
}
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

## Bind contextual and spoken help

Contextual-help identifiers are immutable module/manifest references rather
than free-form learner text. Voice consent is separate from general AI consent,
and version one permits private-edge transcription only.

```ts
import {
  CONTEXTUAL_HELP_CONTRACT_VERSION_V1,
  assertValidContextualHelpIdentifier,
  type ContextualHelpIdentifierV1,
} from "@plasius/learning";

const help: ContextualHelpIdentifierV1 = {
  schemaVersion: "1",
  contractVersion: CONTEXTUAL_HELP_CONTRACT_VERSION_V1,
  kind: "command",
  moduleId: "junior-coder.road-hopper-rally",
  moduleVersion: "1.1.0",
  manifestVersion: "1.0.0",
  helpId: "command.draw-lane",
};

assertValidContextualHelpIdentifier(help);
```

The package also exports `GuardianVoiceConsentV1`,
`VoiceHelpAvailabilityV1`, bounded voice question metadata/results and
`CanonicalSpokenHelpDescriptorV1`. It does not record audio, persist consent,
call a transcription or synthesis provider, or evaluate runtime rollout flags.

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
- External course content uses exact package and export names, a stable semantic
  version and a lower-case canonical SHA-256 digest; version ranges are invalid.
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

Node.js 24 is required. Public pull-request and main-branch code is validated
on isolated GitHub-hosted Linux runners with read-only workflow permissions.
Final npm
publication runs only on a GitHub-hosted runner from the protected `production`
environment so npm can validate its short-lived OIDC identity and record
provenance; it has no long-lived npm write-token fallback. Release coverage and
the CycloneDX SBOM are retained even when an external coverage service is
unavailable. Release tags and GitHub Releases use a current-repository GitHub
App token with explicit Contents and Workflows write permissions. Publication
checks out the verified current release-branch HEAD, including the workflow
tooling used by a `bump=none` recovery.
<!-- BEGIN PLASIUS RELEASE INTEGRITY -->
## Release integrity

Production package publication runs only from `.github/workflows/cd.yml` on
protected `main`. The job verifies that the prepared commit is still the
current main commit and has an exact successful `ci.yml` push result before it
mutates release state. Public package CI runs on GitHub-hosted capacity so it
cannot execute on company-managed runners. npm publication runs on
GitHub-hosted Node.js 24 with
npm 11.5.1 or newer, uses the protected `production` environment and
short-lived npm OIDC with provenance, and has no long-lived npm write-token
fallback. Rollback disables CD; it never rewrites published package history.
<!-- END PLASIUS RELEASE INTEGRITY -->
