# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

- **Added**
  - (placeholder)

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)

## [0.2.22] - 2026-08-11

- **Added**
  - Added `ExternalLearningContentReferenceV1`, its runtime guard and catalog
    validation for exact package/version/export/SHA-256 references.
  - Added Road Hopper Rally module `2.0.0` as a six-mission, 450-minute module
    referencing the immutable 54-stage `@plasius/learning-road-hopper-rally`
    course package.
  - Added Junior Coder path `1.2.0`, upgrading only Road Hopper Rally while
    retaining every other module at `1.1.0`.
  - Added Paddle Pulse module `2.0.0` as a six-mission, 360-minute module
    referencing the immutable 54-stage `@plasius/learning-paddle-pulse@0.1.0`
    content package.
  - Added Junior Coder path `1.3.0`, upgrading Paddle Pulse alongside Road
    Hopper Rally without mutating either legacy module record.

- **Changed**
  - Added the exact external content schema version to digest-pinned references
    and pointed `JUNIOR_CODER_ROBOT_RESCUE_PATH_CURRENT` at path `1.3.0`.

- **Fixed**
  - Added a snapshot digest regression test proving the immutable `1.1.0`
    catalog serialization remains unchanged.

- **Security**
  - Kept executable curriculum, protected scenarios and server evaluator code
    outside the catalog package and fail validation on loose or malformed
    external references.
  - Kept Paddle Pulse v1.1 exports intact and fail closed on unexpected fields,
    loose versions, schema aliases or digest mismatches.

## [0.2.21] - 2026-08-09

- **Added**
  - Added manifest-bound contextual-help identifiers, separate
    `GuardianVoiceConsentV1`, private-edge-only voice availability and upload
    metadata, bounded intents/results and canonical exact-cache spoken-help
    descriptors.

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - Kept child microphone audio and transcripts request-memory-only, excluded
    learner content and arbitrary speech text from canonical audio descriptors,
    and retained deterministic score, reward, publishing and hardware authority.

## [0.2.20] - 2026-08-09

- **Added**
  - Added versioned immutable snapshot, deterministic scan-evidence,
    Guardian-approval, unlisted publication lifecycle and allow-listed safe
    render contracts for the three Junior Coder web projects.

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - Public render models contain no learner JavaScript, account metadata,
    free-form personal details, external URLs, uploads, transmitting forms,
    trackers or advertising, and approval must bind the exact snapshot digest.

## [0.2.19] - 2026-08-09

- **Added**
  - (placeholder)
  - Added the Robot Mission Control mission-one learner/facilitator bundle,
    five documented command, confirmation, telemetry, chart and serial-simulator
    functions, and one learner-approved safety-confirmation diff.

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)
  - Kept command transitions fail-safe in STOP without explicit confirmation;
    Web Serial, physical hardware control, network access, personal data and
    automatic approval remain outside the bounded simulator.

## [0.2.18] - 2026-08-09

- **Added**
  - (placeholder)
  - Added the Creature Care Dashboard mission-one learner/facilitator bundle,
    five documented component and state functions, and one learner-approved
    reduced-motion diff for a private fictional care preview.

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)
  - Kept creature choices, status, events, timers and responsive layout inside
    a bounded deterministic simulator; personal data, real schedules, network
    access, background tasks and motion-only feedback remain excluded.

## [0.2.17] - 2026-08-09

- **Added**
  - (placeholder)
  - Added the Adventure Mission Planner mission-one learner/facilitator bundle,
    five documented semantic planner functions and one learner-approved local
    persistence diff for a private fictional planning preview.

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)
  - Kept form validation, arrays, state and restart persistence inside a bounded
    deterministic simulator; names, contact details, real locations, network
    calls, transmitting forms, trackers and provider-dependent completion are
    excluded from the learner contract.

## [0.2.16] - 2026-08-09

- **Added**
  - (placeholder)
  - Added the Vibe Idea Studio mission-one learner/facilitator bundle,
    three documented prototype functions, bounded idea and acceptance-test
    choices, and one authored star-count diff against a permitted artifact.

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)
  - Kept idea selection, diff review and prototype completion private and
    deterministic; open prompts, personal data, arbitrary files, automatic
    edits and provider-dependent scoring remain outside the contract.

## [0.2.15] - 2026-08-09

- **Added**
  - (placeholder)
  - Added the Vibe Bug Detective mission-one learner/facilitator bundle,
    three documented mini-game functions and one evidence-bound authored
    repair diff for an intentionally broken direction setting.

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)
  - Kept diagnostics, repair review and regression checks deterministic and
    private; learners must explicitly accept or reject the exact diff, while
    open chat, automatic edits and provider-dependent completion remain blocked.

## [0.2.14] - 2026-08-09

- **Added**
  - (placeholder)
  - Added the Vibe Game Remix Lab mission-one learner/facilitator bundle,
    three documented mini-game functions and an additive bounded-suggestion
    contract for one permitted artifact with a visible authored diff.

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)
  - Required explicit learner accept/reject approval, deterministic non-AI
    completion and rejection that preserves source; open chat, automatic edits,
    network access and changes outside the approved artifact remain disallowed.

## [0.2.13] - 2026-08-09

- **Added**
  - (placeholder)
  - Added the versioned Rainbow Rescue Rover mission-one learner/facilitator
    bundle, five documented bounded integration-simulator functions, exact
    eight-item complete and four-item incremental camera-rover disclosures,
    non-colour telemetry and distinct simulated and physical evidence rewards.

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)
  - Kept Camera Module 3 frames on the family Raspberry Pi and colour, target,
    serial-command, heartbeat and stop behaviour inside the private simulator;
    the website cannot open a camera or serial port, activate motors, publish
    frames or unlock physical export before verified adult bench evidence.

## [0.2.12] - 2026-08-09

- **Added**
  - (placeholder)
  - Added the versioned Obstacle Explorer mission-one learner/facilitator
    bundle, five documented bounded C++-style simulator functions, complete and
    incremental sensor-rover hardware disclosure, equivalent reduced-motion
    telemetry and distinct simulated and physical evidence rewards.

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)
  - Kept Boolean sensing, route decisions, recovery attempts, watchdog timing
    and fail-safe stopping inside the private simulator; every rover and sensor
    remains unverified, compatibility-unclaimed and physically ineligible
    until adult calibration and lifted-wheel bench evidence exists.

## [0.2.11] - 2026-08-09

- **Added**
  - (placeholder)
  - Added the versioned Dance Rover mission-one learner/facilitator bundle,
    five documented bounded C++-style simulator functions, complete and
    incremental rover hardware disclosure, equivalent reduced-motion telemetry
    and distinct simulated and physical evidence rewards.

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)
  - Kept direction, 0–60 percent speed, timing, repeat and emergency-stop
    behaviour inside the private simulator; every driver, motor, chassis and
    switched power arrangement remains unverified, compatibility-unclaimed and
    physically ineligible until adult lifted-wheel bench evidence exists.

## [0.2.10] - 2026-08-09

- **Added**
  - (placeholder)
  - Added the versioned Servo Creature mission-one learner/facilitator bundle,
    five documented bounded C++-style simulator functions, complete and
    incremental servo hardware disclosure, equivalent reduced-motion telemetry
    and distinct simulated and physical evidence rewards.

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)
  - Kept the 30–150 degree movement boundary inside the private simulator and
    every servo, regulated supply and common-ground arrangement unverified,
    compatibility-unclaimed and physically ineligible until adult bench-test
    evidence exists; the website cannot control the servo.

## [0.2.9] - 2026-08-08

- **Added**
  - (placeholder)
  - Added the versioned Beacon Bot mission-one learner/facilitator bundle,
    documented bounded C++-style simulator functions, complete and incremental
    hardware disclosure, simulator evidence and separate physical safeguards.

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)
  - Kept every Beacon Bot component unverified, compatibility-unclaimed,
    public-sale blocked and ineligible for physical completion until adult
    bench-test evidence exists; the website cannot control hardware.

## [0.2.8] - 2026-08-08

- **Added**
  - (placeholder)
  - Added the versioned Star Defender Squadron mission-one learner/facilitator
    authoring bundle with documented JavaScript entity, wave-pattern, shield
    health and rescue-projectile concepts, an action-icon run control,
    reduced-motion telemetry and evidence-bound rewards.

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)
  - Kept Star Defender Squadron numeric targets, expected source fragments,
    pattern answers and bounded entity/projectile edge checks in the
    facilitator projection while completion remains deterministic,
    AI-independent and personal-data-free.

## [0.2.7] - 2026-08-08

- **Added**
  - (placeholder)
  - Added the versioned Pixel Trail Challenge mission-one learner/facilitator
    authoring bundle with documented Python direction, trail-list and energy-orb
    controls, keyboard input, reduced-motion telemetry and evidence-bound
    rewards.

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)
  - Kept Pixel Trail Challenge coordinates, expected Python fragments and
    list/collision edge checks in the facilitator projection while completion
    remains deterministic, AI-independent and personal-data-free.

## [0.2.6] - 2026-08-08

- **Added**
  - (placeholder)
  - Added the versioned Rescue Crew Commander mission-one learner/facilitator
    authoring bundle with typed visual job, route and priority blocks, a
    synchronized JavaScript view, non-drag ordering controls, reduced-motion
    status output and evidence-bound rewards.

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)
  - Kept protected crew assignments, expected block sequences and interpreter
    edge checks in the facilitator projection while completion remains
    deterministic, AI-independent and personal-data-free.

## [0.2.5] - 2026-08-08

- **Added**
  - (placeholder)
  - Added the versioned Meteor Shield mission-one learner/facilitator authoring
    bundle with documented targeting, shield-energy and launch-timing concepts,
    keyboard-equivalent controls, reduced-motion telemetry and evidence-bound
    rewards.

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)
  - Kept Meteor Shield numeric targets, expected source fragments and projectile
    edge checks in the facilitator projection while completion remains
    deterministic, AI-independent and personal-data-free.

## [0.2.4] - 2026-08-08

- **Added**
  - (placeholder)
  - Added the versioned Paddle Pulse mission-one learner/facilitator authoring
    bundle with documented paddle, ball-speed and bounce-angle concepts,
    keyboard-equivalent controls, reduced-motion telemetry and evidence-bound
    rewards.

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)
  - Kept Paddle Pulse numeric targets, expected source fragments and collision
    edge checks in the facilitator projection while completion remains
    deterministic, AI-independent and personal-data-free.

## [0.2.3] - 2026-08-01

- **Added**
  - (placeholder)
  - Added the versioned Skywing Sprint mission-one learner/facilitator
    authoring bundle with documented lift, gravity and gate controls, an
    explicit Run action, reduced-motion telemetry and evidence-bound rewards.

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)
  - Kept Skywing Sprint numeric target values, expected source fragments and
    resilience checks in the facilitator projection while completion remains
    deterministic, AI-independent and personal-data-free.

## [0.2.2] - 2026-08-01

- **Added**
  - (placeholder)
  - Added the versioned Robot Maze Dash mission-one learner/facilitator
    authoring bundle, including a complete nine-stage visual-programming
    journey and equivalent non-drag block-order controls.

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)
  - Kept Robot Maze Dash route answers and protected boundary checks in the
    facilitator projection while learner goals remain deterministic and
    personal-data-free.

## [0.2.1] - 2026-08-01

- **Added**
  - (placeholder)
  - Added reusable versioned mission-authoring contracts, deterministic
    validators and an original Road Hopper Rally exemplar covering the complete
    nine-stage learner journey.

- **Changed**
  - (placeholder)
  - Centralized rubric validation so catalog and mission authoring checks share
    the same deterministic 20/50/20/10 scoring authority.

- **Fixed**
  - (placeholder)
  - Isolated public pull-request CI on GitHub-hosted Linux while keeping
    release-bearing main CI explicitly on the governed
    `Public CI - Quarantined` self-hosted runner group.

- **Security**
  - (placeholder)
  - Enforced learner/facilitator artifact and goal separation, non-AI
    completion, mandatory safety evidence, accessibility alternatives,
    personal-data-free evidence, and deterministic non-Token rewards.
  - Pinned patched transitive development versions of `brace-expansion` and
    `esbuild` after the task-start dependency audit.

## [0.2.0] - 2026-07-28

- **Added**
  - Added an immutable `1.1.0` Junior Coder path containing nineteen
    independently versioned modules at a uniform 50 Token / non-redeemable £5
    reference price.
  - Added canonical GBP reference-price metadata and an explicit
    `admin-test-grant` entitlement source that is distinct from economic
    purchases.

- **Changed**
  - Exposed `JUNIOR_CODER_ROBOT_RESCUE_PATH_CURRENT` for server adapters that
    deliberately follow published catalog successors while preserving the
    original `1.0.0` manifest unchanged.

- **Fixed**
  - Routed public-repository release preparation and npm publication explicitly
    through the quarantined self-hosted runner group while retaining its
    workflow and repository allowlists.
  - Selected the verified current release-branch HEAD for publication so a
    `bump=none` recovery cannot check out workflow tooling from an older package
    metadata commit.
  - Installed a checksum-pinned GitHub CLI in both self-hosted release jobs so
    tag and GitHub Release finalization do not depend on runner image state.
  - Finalized workflow-bearing version tags and GitHub Releases with a
    current-repository GitHub App token that has explicit Contents and
    Workflows write permissions, while keeping npm publication on
    `NPM_TOKEN`.

- **Security**
  - (placeholder)

## [0.1.0] - 2026-07-26

### Added

- Initial versioned learning-domain contracts and deterministic assessment model.
- Validated Robot Rescue Arcade path containing 19 self-contained pilot modules.
- Hardware, course-material, agent, entitlement, evidence, badge, and publishing snapshot contracts.
- Architecture, technical direction, design, legal, security, and delivery documentation.

### Fixed

- Routed release preparation and npm publication through configurable trusted
  self-hosted runners, retaining LCOV and SBOM evidence while avoiding
  unsupported npm/private-repository provenance paths.
- Kept reusable release preparation outside the publication environment so
  inherited organisation GitHub App credentials remain available.
- Declared and mapped the release-prep GitHub App key explicitly at the
  reusable-workflow boundary so missing credentials fail during validation.


[0.1.0]: https://github.com/Plasius-LTD/learning/releases/tag/v0.1.0
[0.2.0]: https://github.com/Plasius-LTD/learning/releases/tag/v0.2.0
[0.2.1]: https://github.com/Plasius-LTD/learning/releases/tag/v0.2.1
[0.2.2]: https://github.com/Plasius-LTD/learning/releases/tag/v0.2.2
[0.2.3]: https://github.com/Plasius-LTD/learning/releases/tag/v0.2.3
[0.2.4]: https://github.com/Plasius-LTD/learning/releases/tag/v0.2.4
[0.2.5]: https://github.com/Plasius-LTD/learning/releases/tag/v0.2.5
[0.2.6]: https://github.com/Plasius-LTD/learning/releases/tag/v0.2.6
[0.2.7]: https://github.com/Plasius-LTD/learning/releases/tag/v0.2.7
[0.2.8]: https://github.com/Plasius-LTD/learning/releases/tag/v0.2.8
[0.2.9]: https://github.com/Plasius-LTD/learning/releases/tag/v0.2.9
[0.2.10]: https://github.com/Plasius-LTD/learning/releases/tag/v0.2.10
[0.2.11]: https://github.com/Plasius-LTD/learning/releases/tag/v0.2.11
[0.2.12]: https://github.com/Plasius-LTD/learning/releases/tag/v0.2.12
[0.2.13]: https://github.com/Plasius-LTD/learning/releases/tag/v0.2.13
[0.2.14]: https://github.com/Plasius-LTD/learning/releases/tag/v0.2.14
[0.2.15]: https://github.com/Plasius-LTD/learning/releases/tag/v0.2.15
[0.2.16]: https://github.com/Plasius-LTD/learning/releases/tag/v0.2.16
[0.2.17]: https://github.com/Plasius-LTD/learning/releases/tag/v0.2.17
[0.2.18]: https://github.com/Plasius-LTD/learning/releases/tag/v0.2.18
[0.2.19]: https://github.com/Plasius-LTD/learning/releases/tag/v0.2.19
[0.2.20]: https://github.com/Plasius-LTD/learning/releases/tag/v0.2.20
[0.2.21]: https://github.com/Plasius-LTD/learning/releases/tag/v0.2.21
[0.2.22]: https://github.com/Plasius-LTD/learning/releases/tag/v0.2.22
