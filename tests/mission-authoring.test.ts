import { describe, expect, it } from "vitest";

import {
  JUNIOR_CODER_MISSION_STAGE_ORDER_V1,
  JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1,
  METEOR_SHIELD_MISSION_ONE_AUTHORING_V1,
  PADDLE_PULSE_MISSION_ONE_AUTHORING_V1,
  PIXEL_TRAIL_CHALLENGE_MISSION_ONE_AUTHORING_V1,
  RESCUE_CREW_COMMANDER_MISSION_ONE_AUTHORING_V1,
  ROAD_HOPPER_RALLY_MISSION_ONE_AUTHORING_V1,
  ROBOT_MAZE_DASH_MISSION_ONE_AUTHORING_V1,
  SKYWING_SPRINT_MISSION_ONE_AUTHORING_V1,
  STAR_DEFENDER_SQUADRON_MISSION_ONE_AUTHORING_V1,
  assertValidMissionAuthoringBundle,
  type MissionAuthoringBundleV1,
  validateMissionAuthoringBundle,
} from "../src/index.js";

const roadHopper = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "road-hopper-rally",
)!;

const robotMazeDash = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "robot-maze-dash",
)!;

const skywingSprint = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "skywing-sprint",
)!;

const paddlePulse = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "paddle-pulse",
)!;

const meteorShield = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "meteor-shield",
)!;

const rescueCrewCommander = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "rescue-crew-commander",
)!;

const pixelTrailChallenge = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "pixel-trail-challenge",
)!;

const starDefenderSquadron = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "star-defender-squadron",
)!;

function cloneBundle(): MissionAuthoringBundleV1 {
  return structuredClone(ROAD_HOPPER_RALLY_MISSION_ONE_AUTHORING_V1);
}

function issueCodes(bundle: MissionAuthoringBundleV1): string[] {
  return validateMissionAuthoringBundle(bundle, roadHopper).map(
    (entry) => entry.code,
  );
}

describe("Junior Coder mission authoring", () => {
  it("publishes an accessible Star Defender Squadron JavaScript mission", () => {
    const bundle = STAR_DEFENDER_SQUADRON_MISSION_ONE_AUTHORING_V1;

    expect(bundle.moduleId).toBe("junior-coder.star-defender-squadron");
    expect(bundle.moduleVersion).toBe("1.1.0");
    expect(bundle.missionId).toBe("star-defender-squadron-mission-1");
    expect(bundle.learner.stages.map((stage) => stage.kind)).toEqual(
      JUNIOR_CODER_MISSION_STAGE_ORDER_V1,
    );
    expect(bundle.learner.stages.find((stage) => stage.kind === "learn")?.instruction)
      .toContain("createSquadron()");
    expect(bundle.learner.stages.find((stage) => stage.kind === "learn")?.instruction)
      .toContain("launchRescueBeam()");
    expect(bundle.learner.stages.find((stage) => stage.kind === "run")?.instruction)
      .toContain("Run action button");
    expect(bundle.learner.interactions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "star-defender-squadron-m1-run-control",
          primaryMode: "pointer",
          alternativeIds: ["star-defender-squadron-m1-keyboard-run"],
        }),
        expect.objectContaining({
          id: "star-defender-squadron-m1-code-control",
          primaryMode: "keyboard",
        }),
        expect.objectContaining({
          id: "star-defender-squadron-m1-wave-motion",
          primaryMode: "motion",
          alternativeIds: ["star-defender-squadron-m1-telemetry"],
        }),
      ]),
    );
    expect(
      bundle.learner.accessibilityAlternatives.find(
        (alternative) => alternative.id === "star-defender-squadron-m1-telemetry",
      ),
    ).toEqual(
      expect.objectContaining({
        modes: expect.arrayContaining(["text", "shape", "reduced-motion"]),
        equivalentOutcome: true,
      }),
    );
    expect(
      bundle.learner.artifacts.every(
        (artifact) => artifact.audience === "learner" && !artifact.solutionBearing,
      ),
    ).toBe(true);
    expect(
      bundle.facilitator.artifacts.every(
        (artifact) => artifact.audience === "facilitator",
      ),
    ).toBe(true);
    expect(validateMissionAuthoringBundle(bundle, starDefenderSquadron)).toEqual([]);
    expect(() =>
      assertValidMissionAuthoringBundle(bundle, starDefenderSquadron),
    ).not.toThrow();
  });

  it("publishes an accessible Pixel Trail Challenge Python mission", () => {
    const bundle = PIXEL_TRAIL_CHALLENGE_MISSION_ONE_AUTHORING_V1;

    expect(bundle.moduleId).toBe("junior-coder.pixel-trail-challenge");
    expect(bundle.moduleVersion).toBe("1.1.0");
    expect(bundle.missionId).toBe("pixel-trail-challenge-mission-1");
    expect(bundle.learner.stages.map((stage) => stage.kind)).toEqual(
      JUNIOR_CODER_MISSION_STAGE_ORDER_V1,
    );
    expect(bundle.learner.stages.find((stage) => stage.kind === "run")?.instruction)
      .toContain("Run action button");
    expect(bundle.learner.interactions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "pixel-trail-challenge-m1-run-control",
          primaryMode: "pointer",
          alternativeIds: ["pixel-trail-challenge-m1-keyboard-run"],
        }),
        expect.objectContaining({
          id: "pixel-trail-challenge-m1-direction-control",
          primaryMode: "keyboard",
        }),
        expect.objectContaining({
          id: "pixel-trail-challenge-m1-trail-motion",
          primaryMode: "motion",
          alternativeIds: ["pixel-trail-challenge-m1-telemetry"],
        }),
      ]),
    );
    expect(
      bundle.learner.accessibilityAlternatives.find(
        (alternative) =>
          alternative.id === "pixel-trail-challenge-m1-telemetry",
      ),
    ).toEqual(
      expect.objectContaining({
        modes: expect.arrayContaining(["text", "reduced-motion"]),
        equivalentOutcome: true,
      }),
    );
    expect(
      bundle.learner.artifacts.every(
        (artifact) =>
          artifact.audience === "learner" && !artifact.solutionBearing,
      ),
    ).toBe(true);
    expect(
      bundle.facilitator.artifacts.every(
        (artifact) => artifact.audience === "facilitator",
      ),
    ).toBe(true);
    expect(validateMissionAuthoringBundle(bundle, pixelTrailChallenge)).toEqual([]);
    expect(() =>
      assertValidMissionAuthoringBundle(bundle, pixelTrailChallenge),
    ).not.toThrow();
  });

  it("publishes an accessible Rescue Crew Commander visual-programming mission", () => {
    const bundle = RESCUE_CREW_COMMANDER_MISSION_ONE_AUTHORING_V1;

    expect(bundle.moduleId).toBe("junior-coder.rescue-crew-commander");
    expect(bundle.moduleVersion).toBe("1.1.0");
    expect(bundle.missionId).toBe("rescue-crew-commander-mission-1");
    expect(bundle.learner.stages.map((stage) => stage.kind)).toEqual(
      JUNIOR_CODER_MISSION_STAGE_ORDER_V1,
    );
    expect(bundle.learner.stages.find((stage) => stage.kind === "run")?.instruction)
      .toContain("Run action button");
    expect(bundle.learner.interactions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "rescue-crew-commander-m1-reorder-blocks",
          primaryMode: "drag",
          alternativeIds: ["rescue-crew-commander-m1-button-reorder"],
        }),
        expect.objectContaining({
          id: "rescue-crew-commander-m1-run-control",
          primaryMode: "pointer",
          alternativeIds: ["rescue-crew-commander-m1-keyboard-run"],
        }),
        expect.objectContaining({
          id: "rescue-crew-commander-m1-crew-motion",
          primaryMode: "motion",
          alternativeIds: ["rescue-crew-commander-m1-status-view"],
        }),
      ]),
    );
    expect(
      bundle.learner.accessibilityAlternatives.find(
        (alternative) =>
          alternative.id === "rescue-crew-commander-m1-button-reorder",
      ),
    ).toEqual(
      expect.objectContaining({
        modes: expect.arrayContaining(["keyboard", "pointer"]),
        equivalentOutcome: true,
      }),
    );
    expect(
      bundle.learner.artifacts.every(
        (artifact) =>
          artifact.audience === "learner" && !artifact.solutionBearing,
      ),
    ).toBe(true);
    expect(
      bundle.facilitator.artifacts.every(
        (artifact) => artifact.audience === "facilitator",
      ),
    ).toBe(true);
    expect(validateMissionAuthoringBundle(bundle, rescueCrewCommander)).toEqual([]);
    expect(() =>
      assertValidMissionAuthoringBundle(bundle, rescueCrewCommander),
    ).not.toThrow();
  });

  it("publishes an accessible Meteor Shield targeting-and-resources mission", () => {
    const bundle = METEOR_SHIELD_MISSION_ONE_AUTHORING_V1;

    expect(bundle.moduleId).toBe("junior-coder.meteor-shield");
    expect(bundle.moduleVersion).toBe("1.1.0");
    expect(bundle.missionId).toBe("meteor-shield-mission-1");
    expect(bundle.learner.stages.map((stage) => stage.kind)).toEqual(
      JUNIOR_CODER_MISSION_STAGE_ORDER_V1,
    );
    expect(bundle.learner.stages.find((stage) => stage.kind === "run")?.instruction)
      .toContain("Run action button");
    expect(bundle.learner.interactions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "meteor-shield-m1-run-control",
          primaryMode: "pointer",
          alternativeIds: ["meteor-shield-m1-keyboard-run"],
        }),
        expect.objectContaining({
          id: "meteor-shield-m1-target-control",
          primaryMode: "keyboard",
        }),
        expect.objectContaining({
          id: "meteor-shield-m1-wave-motion",
          primaryMode: "motion",
          alternativeIds: ["meteor-shield-m1-telemetry"],
        }),
      ]),
    );
    expect(
      bundle.learner.artifacts.every(
        (artifact) =>
          artifact.audience === "learner" && !artifact.solutionBearing,
      ),
    ).toBe(true);
    expect(
      bundle.facilitator.artifacts.every(
        (artifact) => artifact.audience === "facilitator",
      ),
    ).toBe(true);
    expect(validateMissionAuthoringBundle(bundle, meteorShield)).toEqual([]);
    expect(() =>
      assertValidMissionAuthoringBundle(bundle, meteorShield),
    ).not.toThrow();
  });

  it("publishes an accessible Paddle Pulse collision-and-angle mission", () => {
    const bundle = PADDLE_PULSE_MISSION_ONE_AUTHORING_V1;

    expect(bundle.moduleId).toBe("junior-coder.paddle-pulse");
    expect(bundle.moduleVersion).toBe("1.1.0");
    expect(bundle.missionId).toBe("paddle-pulse-mission-1");
    expect(bundle.learner.stages.map((stage) => stage.kind)).toEqual(
      JUNIOR_CODER_MISSION_STAGE_ORDER_V1,
    );
    expect(bundle.learner.stages.find((stage) => stage.kind === "run")?.instruction)
      .toContain("Run action button");
    expect(bundle.learner.interactions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "paddle-pulse-m1-run-control",
          primaryMode: "pointer",
          alternativeIds: ["paddle-pulse-m1-keyboard-run"],
        }),
        expect.objectContaining({
          id: "paddle-pulse-m1-paddle-control",
          primaryMode: "keyboard",
        }),
        expect.objectContaining({
          id: "paddle-pulse-m1-ball-motion",
          primaryMode: "motion",
          alternativeIds: ["paddle-pulse-m1-telemetry"],
        }),
      ]),
    );
    expect(
      bundle.learner.artifacts.every(
        (artifact) =>
          artifact.audience === "learner" && !artifact.solutionBearing,
      ),
    ).toBe(true);
    expect(
      bundle.facilitator.artifacts.every(
        (artifact) => artifact.audience === "facilitator",
      ),
    ).toBe(true);
    expect(validateMissionAuthoringBundle(bundle, paddlePulse)).toEqual([]);
    expect(() =>
      assertValidMissionAuthoringBundle(bundle, paddlePulse),
    ).not.toThrow();
  });

  it("publishes an accessible Skywing Sprint velocity-and-gravity mission", () => {
    const bundle = SKYWING_SPRINT_MISSION_ONE_AUTHORING_V1;

    expect(bundle.moduleId).toBe("junior-coder.skywing-sprint");
    expect(bundle.moduleVersion).toBe("1.1.0");
    expect(bundle.missionId).toBe("skywing-sprint-mission-1");
    expect(bundle.learner.stages.map((stage) => stage.kind)).toEqual(
      JUNIOR_CODER_MISSION_STAGE_ORDER_V1,
    );
    expect(bundle.learner.stages.find((stage) => stage.kind === "run")?.instruction)
      .toContain("Run action button");
    expect(bundle.learner.interactions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "skywing-sprint-m1-run-control",
          primaryMode: "pointer",
          alternativeIds: ["skywing-sprint-m1-keyboard-run"],
        }),
        expect.objectContaining({
          id: "skywing-sprint-m1-flight-control",
          primaryMode: "keyboard",
        }),
      ]),
    );
    expect(
      bundle.learner.artifacts.every(
        (artifact) =>
          artifact.audience === "learner" && !artifact.solutionBearing,
      ),
    ).toBe(true);
    expect(
      bundle.facilitator.artifacts.every(
        (artifact) => artifact.audience === "facilitator",
      ),
    ).toBe(true);
    expect(validateMissionAuthoringBundle(bundle, skywingSprint)).toEqual([]);
    expect(() =>
      assertValidMissionAuthoringBundle(bundle, skywingSprint),
    ).not.toThrow();
  });

  it("publishes an accessible Robot Maze Dash visual-programming mission", () => {
    const bundle = ROBOT_MAZE_DASH_MISSION_ONE_AUTHORING_V1;

    expect(bundle.moduleId).toBe("junior-coder.robot-maze-dash");
    expect(bundle.moduleVersion).toBe("1.1.0");
    expect(bundle.missionId).toBe("robot-maze-dash-mission-1");
    expect(bundle.learner.stages.map((stage) => stage.kind)).toEqual(
      JUNIOR_CODER_MISSION_STAGE_ORDER_V1,
    );
    expect(bundle.learner.interactions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          primaryMode: "drag",
          alternativeIds: expect.arrayContaining([
            "robot-maze-dash-m1-button-reorder",
          ]),
        }),
      ]),
    );
    expect(
      bundle.learner.accessibilityAlternatives.find(
        (alternative) =>
          alternative.id === "robot-maze-dash-m1-button-reorder",
      ),
    ).toEqual(
      expect.objectContaining({
        modes: expect.arrayContaining(["keyboard", "pointer"]),
        equivalentOutcome: true,
      }),
    );
    expect(
      bundle.learner.artifacts.every(
        (artifact) =>
          artifact.audience === "learner" && !artifact.solutionBearing,
      ),
    ).toBe(true);
    expect(
      bundle.facilitator.artifacts.every(
        (artifact) => artifact.audience === "facilitator",
      ),
    ).toBe(true);
    expect(validateMissionAuthoringBundle(bundle, robotMazeDash)).toEqual([]);
    expect(() =>
      assertValidMissionAuthoringBundle(bundle, robotMazeDash),
    ).not.toThrow();
  });

  it("publishes one complete Road Hopper Rally authoring exemplar", () => {
    const bundle = ROAD_HOPPER_RALLY_MISSION_ONE_AUTHORING_V1;

    expect(bundle.moduleId).toBe("junior-coder.road-hopper-rally");
    expect(bundle.moduleVersion).toBe("1.1.0");
    expect(bundle.learner.stages.map((stage) => stage.kind)).toEqual(
      JUNIOR_CODER_MISSION_STAGE_ORDER_V1,
    );
    expect(bundle.learner.readinessChecks.every((check) => !check.scored)).toBe(
      true,
    );
    expect(validateMissionAuthoringBundle(bundle, roadHopper)).toEqual([]);
    expect(() => assertValidMissionAuthoringBundle(bundle, roadHopper)).not.toThrow();
  });

  it("rejects mismatched catalog and mission references", () => {
    const bundle = cloneBundle();
    bundle.version = "9.9.9";
    bundle.moduleVersion = "9.9.9";
    bundle.missionId = "road-hopper-rally-mission-99";

    expect(issueCodes(bundle)).toEqual(
      expect.arrayContaining([
        "bundle-version-mismatch",
        "module-reference-mismatch",
        "mission-reference-mismatch",
      ]),
    );
  });

  it("rejects missing, duplicate and out-of-order stages", () => {
    const missing = cloneBundle();
    missing.learner.stages.splice(2, 1);
    expect(issueCodes(missing)).toContain("missing-stage");

    const duplicate = cloneBundle();
    duplicate.learner.stages[2] = structuredClone(duplicate.learner.stages[1]!);
    expect(issueCodes(duplicate)).toContain("duplicate-stage");

    const reordered = cloneBundle();
    [reordered.learner.stages[0], reordered.learner.stages[1]] = [
      reordered.learner.stages[1]!,
      reordered.learner.stages[0]!,
    ];
    expect(issueCodes(reordered)).toContain("stage-order");
  });

  it("requires a 15–25 minute mission and unscored readiness checks", () => {
    const bundle = cloneBundle();
    bundle.learner.estimatedMinutes = 26;
    bundle.learner.readinessChecks[0]!.scored = true as false;

    expect(issueCodes(bundle)).toEqual(
      expect.arrayContaining(["invalid-duration", "scored-readiness-check"]),
    );

    bundle.learner.readinessChecks = [];
    expect(issueCodes(bundle)).toContain("missing-readiness-check");
  });

  it("requires learner-safe starter artifacts and valid stage references", () => {
    const bundle = cloneBundle();
    bundle.learner.artifacts = [];

    expect(issueCodes(bundle)).toEqual(
      expect.arrayContaining(["missing-starter-artifact", "unknown-artifact"]),
    );

    const leaked = cloneBundle();
    leaked.learner.artifacts[0] = {
      id: "leaked-answer",
      kind: "answer-key",
      audience: "learner",
      solutionBearing: true,
    };
    expect(issueCodes(leaked)).toContain("learner-artifact-leak");
  });

  it("keeps learner and facilitator goal and artifact projections separate", () => {
    const bundle = cloneBundle();
    bundle.learner.goals[0]!.visibility = "protected" as "visible";
    bundle.facilitator.artifacts[0]!.audience = "learner" as "facilitator";
    bundle.facilitator.protectedGoals[0]!.completionRequired = true;

    expect(issueCodes(bundle)).toEqual(
      expect.arrayContaining([
        "invalid-goal-projection",
        "facilitator-artifact-leak",
      ]),
    );
  });

  it("rejects duplicated goals and unknown or wrongly projected criteria", () => {
    const bundle = cloneBundle();
    bundle.facilitator.protectedGoals[0]!.id = bundle.learner.goals[0]!.id;
    bundle.learner.goals[1]!.criterionIds = ["missing-criterion"];
    bundle.learner.goals[2]!.criterionIds = ["road-hopper-rally-edge-one"];

    expect(issueCodes(bundle)).toEqual(
      expect.arrayContaining([
        "duplicate-goal-id",
        "unknown-criterion",
        "criterion-visibility-mismatch",
      ]),
    );
  });

  it("rejects missing projected goals, empty criterion bindings and duplicate authored IDs", () => {
    const bundle = cloneBundle();
    bundle.learner.goals[0]!.criterionIds = [];
    bundle.learner.artifacts[1]!.id = bundle.learner.artifacts[0]!.id;
    bundle.learner.accessibilityAlternatives.push(
      structuredClone(bundle.learner.accessibilityAlternatives[0]!),
    );

    expect(issueCodes(bundle)).toEqual(
      expect.arrayContaining(["unknown-criterion", "duplicate-id"]),
    );

    bundle.learner.goals = [];
    bundle.facilitator.protectedGoals = [];
    expect(issueCodes(bundle)).toEqual(
      expect.arrayContaining(["missing-visible-goal", "missing-protected-goal"]),
    );
  });

  it("rejects malformed rubrics, AI-dependent completion and missing safety evidence", () => {
    const malformedModule = structuredClone(roadHopper);
    malformedModule.assessment.criteria[0]!.points = 19;

    expect(
      validateMissionAuthoringBundle(cloneBundle(), malformedModule).map(
        (entry) => entry.code,
      ),
    ).toEqual(expect.arrayContaining(["rubric-total", "rubric-dimension-total"]));

    const bundle = cloneBundle();
    bundle.learner.goals[0]!.aiRequired = true;
    bundle.learner.goals.find((goal) =>
      goal.criterionIds.includes("road-hopper-rally-safety"),
    )!.completionRequired = false;

    expect(issueCodes(bundle)).toEqual(
      expect.arrayContaining([
        "ai-dependent-completion",
        "missing-safety-evidence",
      ]),
    );
  });

  it("requires an equivalent alternative for inaccessible single-mode interactions", () => {
    const bundle = cloneBundle();
    bundle.learner.interactions[0]!.alternativeIds = [];
    expect(issueCodes(bundle)).toContain("inaccessible-interaction");

    const dangling = cloneBundle();
    dangling.learner.interactions[0]!.alternativeIds = ["missing-alternative"];
    expect(issueCodes(dangling)).toContain("unknown-accessibility-alternative");

    const unequal = cloneBundle();
    unequal.learner.accessibilityAlternatives[0]!.equivalentOutcome = false as true;
    expect(issueCodes(unequal)).toContain(
      "non-equivalent-accessibility-alternative",
    );
  });

  it("rejects missing, dangling or personal-data-bearing evidence", () => {
    const missing = cloneBundle();
    missing.learner.evidenceRequirements = [];
    expect(issueCodes(missing)).toContain("missing-evidence");

    const dangling = cloneBundle();
    dangling.learner.evidenceRequirements[0]!.goalIds = ["missing-goal"];
    expect(issueCodes(dangling)).toContain("unknown-evidence-goal");

    const personal = cloneBundle();
    personal.learner.evidenceRequirements[0]!.containsPersonalData = true as false;
    expect(issueCodes(personal)).toContain("personal-data-evidence");

    const protectedReference = cloneBundle();
    protectedReference.learner.evidenceRequirements[0]!.goalIds = [
      protectedReference.facilitator.protectedGoals[0]!.id,
    ];
    expect(issueCodes(protectedReference)).toContain("unknown-evidence-goal");
  });

  it("keeps side adventures optional and rewards deterministic and evidence-bound", () => {
    const bundle = cloneBundle();
    bundle.learner.sideAdventures[0]!.completionRequired = true as false;
    bundle.learner.rewardBindings[0]!.random = true as false;
    bundle.learner.rewardBindings[0]!.tokenConvertible = true as false;
    bundle.learner.rewardBindings[0]!.goalIds = [];

    expect(issueCodes(bundle)).toEqual(
      expect.arrayContaining(["mandatory-side-adventure", "invalid-reward"]),
    );

    const absent = cloneBundle();
    absent.learner.sideAdventures = [];
    expect(issueCodes(absent)).toContain("missing-side-adventure");

    const protectedReference = cloneBundle();
    protectedReference.learner.rewardBindings[0]!.goalIds = [
      protectedReference.facilitator.protectedGoals[0]!.id,
    ];
    expect(issueCodes(protectedReference)).toContain("invalid-reward");
  });

  it("formats all validation failures through the assertion helper", () => {
    const bundle = cloneBundle();
    bundle.learner.estimatedMinutes = 5;
    bundle.learner.readinessChecks = [];

    expect(() => assertValidMissionAuthoringBundle(bundle, roadHopper)).toThrow(
      /invalid-duration[\s\S]*missing-readiness-check/u,
    );
  });
});
