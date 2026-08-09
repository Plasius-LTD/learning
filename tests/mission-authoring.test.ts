import { describe, expect, it } from "vitest";

import {
  BEACON_BOT_MISSION_ONE_AUTHORING_V1,
  DANCE_ROVER_MISSION_ONE_AUTHORING_V1,
  JUNIOR_CODER_MISSION_STAGE_ORDER_V1,
  JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1,
  METEOR_SHIELD_MISSION_ONE_AUTHORING_V1,
  OBSTACLE_EXPLORER_MISSION_ONE_AUTHORING_V1,
  PADDLE_PULSE_MISSION_ONE_AUTHORING_V1,
  PIXEL_TRAIL_CHALLENGE_MISSION_ONE_AUTHORING_V1,
  RAINBOW_RESCUE_ROVER_MISSION_ONE_AUTHORING_V1,
  RESCUE_CREW_COMMANDER_MISSION_ONE_AUTHORING_V1,
  ROAD_HOPPER_RALLY_MISSION_ONE_AUTHORING_V1,
  ROBOT_MAZE_DASH_MISSION_ONE_AUTHORING_V1,
  SERVO_CREATURE_MISSION_ONE_AUTHORING_V1,
  SKYWING_SPRINT_MISSION_ONE_AUTHORING_V1,
  STAR_DEFENDER_SQUADRON_MISSION_ONE_AUTHORING_V1,
  VIBE_GAME_REMIX_LAB_MISSION_ONE_AUTHORING_V1,
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

const beaconBot = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "beacon-bot",
)!;

const servoCreature = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "servo-creature",
)!;

const danceRover = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "dance-rover",
)!;

const obstacleExplorer = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "obstacle-explorer",
)!;

const rainbowRescueRover = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "rainbow-rescue-rover",
)!;

const vibeGameRemixLab = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (module) => module.slug === "vibe-game-remix-lab",
)!;

function cloneBundle(): MissionAuthoringBundleV1 {
  return structuredClone(ROAD_HOPPER_RALLY_MISSION_ONE_AUTHORING_V1);
}

function issueCodes(bundle: MissionAuthoringBundleV1): string[] {
  return validateMissionAuthoringBundle(bundle, roadHopper).map(
    (entry) => entry.code,
  );
}

function beaconIssueCodes(bundle: MissionAuthoringBundleV1): string[] {
  return validateMissionAuthoringBundle(bundle, beaconBot).map(
    (entry) => entry.code,
  );
}

function servoCreatureIssueCodes(bundle: MissionAuthoringBundleV1): string[] {
  return validateMissionAuthoringBundle(bundle, servoCreature).map(
    (entry) => entry.code,
  );
}

function danceRoverIssueCodes(bundle: MissionAuthoringBundleV1): string[] {
  return validateMissionAuthoringBundle(bundle, danceRover).map(
    (entry) => entry.code,
  );
}

function obstacleExplorerIssueCodes(bundle: MissionAuthoringBundleV1): string[] {
  return validateMissionAuthoringBundle(bundle, obstacleExplorer).map(
    (entry) => entry.code,
  );
}

function rainbowRescueRoverIssueCodes(bundle: MissionAuthoringBundleV1): string[] {
  return validateMissionAuthoringBundle(bundle, rainbowRescueRover).map(
    (entry) => entry.code,
  );
}

function vibeGameRemixLabIssueCodes(bundle: MissionAuthoringBundleV1): string[] {
  return validateMissionAuthoringBundle(bundle, vibeGameRemixLab).map(
    (entry) => entry.code,
  );
}

describe("Junior Coder mission authoring", () => {
  it("publishes a bounded and learner-approved Vibe Game Remix Lab mission", () => {
    const bundle = VIBE_GAME_REMIX_LAB_MISSION_ONE_AUTHORING_V1;

    expect(bundle.moduleId).toBe("junior-coder.vibe-game-remix-lab");
    expect(bundle.moduleVersion).toBe("1.1.0");
    expect(bundle.missionId).toBe("vibe-game-remix-lab-mission-1");
    expect(bundle.learner.stages.map((stage) => stage.kind)).toEqual(
      JUNIOR_CODER_MISSION_STAGE_ORDER_V1,
    );
    expect(bundle.learner.stages.find((stage) => stage.kind === "learn")?.instruction)
      .toContain("setGoalCount()");
    expect(bundle.learner.stages.find((stage) => stage.kind === "run")?.instruction)
      .toContain("Run action button");
    expect(bundle.learner.functionReference).toHaveLength(3);
    expect(bundle.learner.boundedSuggestion).toEqual(
      expect.objectContaining({
        source: "authored-fallback",
        aiOptional: false,
        learnerApprovalRequired: true,
        permittedArtifactId: "vibe-game-remix-lab-m1-code",
        alternatives: ["accept", "reject"],
        originalSnippet: expect.stringContaining("setGoalCount(2)"),
        replacementSnippet: expect.stringContaining("setGoalCount(3)"),
      }),
    );
    expect(bundle.learner.interactions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "vibe-game-remix-lab-m1-accept-control" }),
        expect.objectContaining({ id: "vibe-game-remix-lab-m1-reject-control" }),
      ]),
    );
    expect(bundle.learner.goals.every((goal) => !goal.aiRequired)).toBe(true);
    expect(vibeGameRemixLab.hardware.mode).toBe("none");
    expect(vibeGameRemixLabIssueCodes(bundle)).toEqual([]);
    expect(() => assertValidMissionAuthoringBundle(bundle, vibeGameRemixLab))
      .not.toThrow();
  });

  it("rejects an unsafe or unbounded Vibe Game Remix suggestion", () => {
    const bundle = structuredClone(VIBE_GAME_REMIX_LAB_MISSION_ONE_AUTHORING_V1);
    bundle.learner.boundedSuggestion!.permittedArtifactId = "missing-file";
    bundle.learner.boundedSuggestion!.learnerApprovalRequired = false as true;
    bundle.learner.boundedSuggestion!.alternatives = ["accept"] as unknown as ["accept", "reject"];

    expect(vibeGameRemixLabIssueCodes(bundle)).toContain(
      "invalid-bounded-suggestion",
    );
  });

  it("publishes a complete Beacon Bot simulator and hardware-disclosure mission", () => {
    const bundle = BEACON_BOT_MISSION_ONE_AUTHORING_V1;

    expect(bundle.moduleId).toBe("junior-coder.beacon-bot");
    expect(bundle.moduleVersion).toBe("1.1.0");
    expect(bundle.missionId).toBe("beacon-bot-mission-1");
    expect(bundle.learner.stages.map((stage) => stage.kind)).toEqual(
      JUNIOR_CODER_MISSION_STAGE_ORDER_V1,
    );
    expect(bundle.learner.stages.find((stage) => stage.kind === "learn")?.instruction)
      .toContain("setVisibleSignal()");
    expect(bundle.learner.stages.find((stage) => stage.kind === "learn")?.instruction)
      .toContain("readIrReceiver()");
    expect(bundle.learner.stages.find((stage) => stage.kind === "run")?.instruction)
      .toContain("Run action button");
    expect(bundle.learner.functionReference).toHaveLength(4);
    expect(bundle.learner.functionReference).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          signature: "setVisibleSignal(colour)",
          parameters: [expect.objectContaining({ name: "colour" })],
          effect: expect.any(String),
          example: expect.stringContaining("setVisibleSignal"),
        }),
        expect.objectContaining({
          signature: "readIrReceiver()",
          parameters: [],
          effect: expect.any(String),
          example: expect.stringContaining("readIrReceiver"),
        }),
      ]),
    );
    expect(bundle.hardware).toEqual(
      expect.objectContaining({
        requirementsVersion: "1.0.0",
        hardwareIncluded: false,
        completePathItemIds: expect.arrayContaining([
          "pico-2-w",
          "breadboard",
          "usb-data-cable",
          "jumper-wires",
          "led-pack",
          "led-resistors",
          "ir-pair",
        ]),
        incrementalItemIds: ["led-pack", "led-resistors", "ir-pair"],
      }),
    );
    expect(bundle.hardware?.components).toHaveLength(beaconBot.hardware.items.length);
    expect(bundle.hardware?.components.every(
      (component) => component.verificationStatus === "pending-bench-test"
        && component.compatibilityClaimed === false
        && component.physicalCompletionEligible === false,
    )).toBe(true);
    expect(bundle.hardware?.safeguards).toEqual(
      expect.objectContaining({
        adultAssemblyRequired: true,
        adultAcknowledgementRequiredForExport: true,
        websiteMayControlHardware: false,
        simulatorCompletionAvailable: true,
        simulatedBadgeId: "beacon-bot-mission-complete",
        physicalBadgeId: "beacon-bot-physical-builder",
        physicalBadgeRequiresAdultSignoff: true,
        unrelatedHardwareNotRequired: expect.arrayContaining([
          "Camera Module 3",
          "motor driver or motors",
          "servo",
        ]),
      }),
    );
    expect(validateMissionAuthoringBundle(bundle, beaconBot)).toEqual([]);
    expect(() => assertValidMissionAuthoringBundle(bundle, beaconBot)).not.toThrow();
  });

  it("rejects Beacon Bot compatibility claims and physical completion for unverified components", () => {
    const bundle = structuredClone(BEACON_BOT_MISSION_ONE_AUTHORING_V1);
    const component = bundle.hardware!.components.find(
      (entry) => entry.itemId === "ir-pair",
    )!;
    component.compatibilityClaimed = true;
    component.physicalCompletionEligible = true;

    expect(beaconIssueCodes(bundle)).toEqual(
      expect.arrayContaining([
        "hardware-verification-claim",
        "unsafe-physical-export",
      ]),
    );
  });

  it("rejects mismatched Beacon Bot hardware versions, items and acquisition scopes", () => {
    const bundle = structuredClone(BEACON_BOT_MISSION_ONE_AUTHORING_V1);
    bundle.hardware!.requirementsVersion = "9.9.9";
    bundle.hardware!.completePathItemIds.pop();
    bundle.hardware!.incrementalItemIds.push("unknown-item");
    bundle.hardware!.components[0]!.quantity = 99;
    bundle.hardware!.components[1]!.acquisitionScope = "incremental";

    expect(beaconIssueCodes(bundle)).toEqual(
      expect.arrayContaining([
        "hardware-requirements-version-mismatch",
        "hardware-item-mismatch",
      ]),
    );
  });

  it("rejects unsafe Beacon Bot export safeguards and hardware badge bindings", () => {
    const bundle = structuredClone(BEACON_BOT_MISSION_ONE_AUTHORING_V1);
    bundle.hardware!.safeguards.websiteMayControlHardware = true as false;
    bundle.hardware!.safeguards.adultAssemblySteps = [];
    bundle.hardware!.safeguards.simulatedBadgeId = "beacon-bot-physical-builder";
    bundle.hardware!.safeguards.physicalBadgeId = "missing-physical-badge";

    expect(beaconIssueCodes(bundle)).toEqual(
      expect.arrayContaining([
        "unsafe-physical-export",
        "invalid-hardware-reward",
      ]),
    );
  });

  it("rejects incomplete learner function documentation and non-robot hardware projections", () => {
    const bundle = structuredClone(BEACON_BOT_MISSION_ONE_AUTHORING_V1);
    bundle.learner.functionReference![0]!.effect = "";
    bundle.learner.functionReference![1]!.parameters = [
      {
        name: "",
        type: "",
        description: "",
      },
    ];

    expect(beaconIssueCodes(bundle)).toContain("invalid-function-reference");
    expect(validateMissionAuthoringBundle(bundle, roadHopper).map(
      (entry) => entry.code,
    )).toContain("hardware-module-mismatch");
  });

  it("publishes a complete Servo Creature simulator and hardware-disclosure mission", () => {
    const bundle = SERVO_CREATURE_MISSION_ONE_AUTHORING_V1;

    expect(bundle.moduleId).toBe("junior-coder.servo-creature");
    expect(bundle.moduleVersion).toBe("1.1.0");
    expect(bundle.missionId).toBe("servo-creature-mission-1");
    expect(bundle.learner.stages.map((stage) => stage.kind)).toEqual(
      JUNIOR_CODER_MISSION_STAGE_ORDER_V1,
    );
    expect(bundle.learner.stages.find((stage) => stage.kind === "learn")?.instruction)
      .toContain("setServoAngle()");
    expect(bundle.learner.stages.find((stage) => stage.kind === "learn")?.instruction)
      .toContain("readTouchSensor()");
    expect(bundle.learner.stages.find((stage) => stage.kind === "run")?.instruction)
      .toContain("Run action button");
    expect(bundle.learner.functionReference).toHaveLength(5);
    expect(bundle.learner.functionReference).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          signature: "setServoAngle(degrees)",
          parameters: [expect.objectContaining({
            name: "degrees",
            description: expect.stringContaining("30 to 150"),
          })],
          effect: expect.stringContaining("simulator"),
          example: expect.stringContaining("setServoAngle"),
        }),
        expect.objectContaining({
          signature: "readTouchSensor()",
          parameters: [],
          effect: expect.stringContaining("simulator"),
          example: expect.stringContaining("readTouchSensor"),
        }),
      ]),
    );
    expect(bundle.hardware).toEqual(
      expect.objectContaining({
        requirementsVersion: "1.0.0",
        hardwareIncluded: false,
        completePathItemIds: [
          "pico-2-w",
          "breadboard",
          "usb-data-cable",
          "jumper-wires",
          "micro-servo",
          "servo-power",
        ],
        incrementalItemIds: ["micro-servo", "servo-power"],
      }),
    );
    expect(bundle.hardware?.components).toHaveLength(servoCreature.hardware.items.length);
    expect(bundle.hardware?.components.every(
      (component) => component.verificationStatus === "pending-bench-test"
        && component.compatibilityClaimed === false
        && component.physicalCompletionEligible === false,
    )).toBe(true);
    expect(bundle.hardware?.safeguards).toEqual(
      expect.objectContaining({
        adultAssemblyRequired: true,
        adultAcknowledgementRequiredForExport: true,
        websiteMayControlHardware: false,
        simulatorCompletionAvailable: true,
        simulatedBadgeId: "servo-creature-mission-complete",
        physicalBadgeId: "servo-creature-physical-builder",
        physicalBadgeRequiresAdultSignoff: true,
        powerRequirements: expect.arrayContaining([
          expect.stringContaining("external regulated servo supply"),
          expect.stringContaining("common signal ground"),
        ]),
        unrelatedHardwareNotRequired: expect.arrayContaining([
          "Camera Module 3 or Raspberry Pi Zero 2 W",
          "motor driver, motors or rover chassis",
          "physical touch or IR sensor",
        ]),
      }),
    );
    expect(validateMissionAuthoringBundle(bundle, servoCreature)).toEqual([]);
    expect(() => assertValidMissionAuthoringBundle(bundle, servoCreature)).not.toThrow();
  });

  it("rejects Servo Creature compatibility and physical completion claims for unverified power", () => {
    const bundle = structuredClone(SERVO_CREATURE_MISSION_ONE_AUTHORING_V1);
    const component = bundle.hardware!.components.find(
      (entry) => entry.itemId === "servo-power",
    )!;
    component.compatibilityClaimed = true;
    component.physicalCompletionEligible = true;

    expect(servoCreatureIssueCodes(bundle)).toEqual(
      expect.arrayContaining([
        "hardware-verification-claim",
        "unsafe-physical-export",
      ]),
    );
  });

  it("rejects Servo Creature hardware drift and unsafe physical-control safeguards", () => {
    const bundle = structuredClone(SERVO_CREATURE_MISSION_ONE_AUTHORING_V1);
    bundle.hardware!.completePathItemIds.pop();
    bundle.hardware!.incrementalItemIds.push("unknown-item");
    bundle.hardware!.components[0]!.quantity = 99;
    bundle.hardware!.safeguards.websiteMayControlHardware = true as false;
    bundle.hardware!.safeguards.powerRequirements = [];

    expect(servoCreatureIssueCodes(bundle)).toEqual(
      expect.arrayContaining([
        "hardware-item-mismatch",
        "unsafe-physical-export",
      ]),
    );
  });

  it("rejects incomplete Servo Creature function documentation and badge drift", () => {
    const bundle = structuredClone(SERVO_CREATURE_MISSION_ONE_AUTHORING_V1);
    bundle.learner.functionReference![0]!.effect = "";
    bundle.hardware!.safeguards.simulatedBadgeId = "servo-creature-physical-builder";
    bundle.hardware!.safeguards.physicalBadgeId = "missing-physical-badge";

    expect(servoCreatureIssueCodes(bundle)).toEqual(
      expect.arrayContaining([
        "invalid-function-reference",
        "invalid-hardware-reward",
      ]),
    );
  });

  it("publishes a complete Dance Rover simulator and hardware-disclosure mission", () => {
    const bundle = DANCE_ROVER_MISSION_ONE_AUTHORING_V1;

    expect(bundle.moduleId).toBe("junior-coder.dance-rover");
    expect(bundle.moduleVersion).toBe("1.1.0");
    expect(bundle.missionId).toBe("dance-rover-mission-1");
    expect(bundle.learner.stages.map((stage) => stage.kind)).toEqual(
      JUNIOR_CODER_MISSION_STAGE_ORDER_V1,
    );
    expect(bundle.learner.stages.find((stage) => stage.kind === "learn")?.instruction)
      .toContain("driveRover()");
    expect(bundle.learner.stages.find((stage) => stage.kind === "learn")?.instruction)
      .toContain("emergencyStop()");
    expect(bundle.learner.stages.find((stage) => stage.kind === "run")?.instruction)
      .toContain("Run action button");
    expect(bundle.learner.functionReference).toHaveLength(5);
    expect(bundle.learner.functionReference).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          signature: "driveRover(direction, speed)",
          parameters: [
            expect.objectContaining({ name: "direction" }),
            expect.objectContaining({ name: "speed", description: expect.stringContaining("0 to 60") }),
          ],
          effect: expect.stringContaining("simulator"),
          example: expect.stringContaining("driveRover"),
        }),
        expect.objectContaining({
          signature: "emergencyStop()",
          parameters: [],
          effect: expect.stringContaining("simulator"),
          example: expect.stringContaining("emergencyStop"),
        }),
      ]),
    );
    expect(bundle.hardware).toEqual(
      expect.objectContaining({
        requirementsVersion: "1.0.0",
        hardwareIncluded: false,
        completePathItemIds: [
          "pico-2-w",
          "breadboard",
          "usb-data-cable",
          "jumper-wires",
          "dual-motor-driver",
          "geared-motors",
          "rover-chassis",
          "motor-power",
        ],
        incrementalItemIds: [
          "dual-motor-driver",
          "geared-motors",
          "rover-chassis",
          "motor-power",
        ],
      }),
    );
    expect(bundle.hardware?.components).toHaveLength(danceRover.hardware.items.length);
    expect(bundle.hardware?.components.every(
      (component) => component.verificationStatus === "pending-bench-test"
        && component.compatibilityClaimed === false
        && component.physicalCompletionEligible === false,
    )).toBe(true);
    expect(bundle.hardware?.safeguards).toEqual(
      expect.objectContaining({
        adultAssemblyRequired: true,
        adultAcknowledgementRequiredForExport: true,
        websiteMayControlHardware: false,
        simulatorCompletionAvailable: true,
        simulatedBadgeId: "dance-rover-mission-complete",
        physicalBadgeId: "dance-rover-physical-builder",
        physicalBadgeRequiresAdultSignoff: true,
        adultAssemblySteps: expect.arrayContaining([
          expect.stringContaining("wheels lifted"),
          expect.stringContaining("emergency-stop"),
        ]),
        powerRequirements: expect.arrayContaining([
          expect.stringContaining("switched protected motor supply"),
          expect.stringContaining("common signal ground"),
        ]),
        unrelatedHardwareNotRequired: expect.arrayContaining([
          "Camera Module 3 or Raspberry Pi Zero 2 W",
          "obstacle or colour sensors",
          "servo, LED or infrared beacon parts",
        ]),
      }),
    );
    expect(validateMissionAuthoringBundle(bundle, danceRover)).toEqual([]);
    expect(() => assertValidMissionAuthoringBundle(bundle, danceRover)).not.toThrow();
  });

  it("rejects Dance Rover compatibility and physical completion claims for an unverified driver", () => {
    const bundle = structuredClone(DANCE_ROVER_MISSION_ONE_AUTHORING_V1);
    const component = bundle.hardware!.components.find(
      (entry) => entry.itemId === "dual-motor-driver",
    )!;
    component.compatibilityClaimed = true;
    component.physicalCompletionEligible = true;

    expect(danceRoverIssueCodes(bundle)).toEqual(
      expect.arrayContaining([
        "hardware-verification-claim",
        "unsafe-physical-export",
      ]),
    );
  });

  it("rejects Dance Rover hardware drift and unsafe physical-control safeguards", () => {
    const bundle = structuredClone(DANCE_ROVER_MISSION_ONE_AUTHORING_V1);
    bundle.hardware!.completePathItemIds.pop();
    bundle.hardware!.incrementalItemIds.push("unknown-item");
    bundle.hardware!.components[0]!.quantity = 99;
    bundle.hardware!.safeguards.websiteMayControlHardware = true as false;
    bundle.hardware!.safeguards.adultAssemblySteps = [];

    expect(danceRoverIssueCodes(bundle)).toEqual(
      expect.arrayContaining([
        "hardware-item-mismatch",
        "unsafe-physical-export",
      ]),
    );
  });

  it("rejects incomplete Dance Rover function documentation and badge drift", () => {
    const bundle = structuredClone(DANCE_ROVER_MISSION_ONE_AUTHORING_V1);
    bundle.learner.functionReference![0]!.effect = "";
    bundle.hardware!.safeguards.simulatedBadgeId = "dance-rover-physical-builder";
    bundle.hardware!.safeguards.physicalBadgeId = "missing-physical-badge";

    expect(danceRoverIssueCodes(bundle)).toEqual(
      expect.arrayContaining([
        "invalid-function-reference",
        "invalid-hardware-reward",
      ]),
    );
  });

  it("publishes a complete Obstacle Explorer simulator and hardware-disclosure mission", () => {
    const bundle = OBSTACLE_EXPLORER_MISSION_ONE_AUTHORING_V1;

    expect(bundle.moduleId).toBe("junior-coder.obstacle-explorer");
    expect(bundle.moduleVersion).toBe("1.1.0");
    expect(bundle.missionId).toBe("obstacle-explorer-mission-1");
    expect(bundle.learner.stages.map((stage) => stage.kind)).toEqual(
      JUNIOR_CODER_MISSION_STAGE_ORDER_V1,
    );
    expect(bundle.learner.stages.find((stage) => stage.kind === "learn")?.instruction)
      .toContain("readObstacle()");
    expect(bundle.learner.stages.find((stage) => stage.kind === "learn")?.instruction)
      .toContain("failSafeStop()");
    expect(bundle.learner.stages.find((stage) => stage.kind === "run")?.instruction)
      .toContain("Run action button");
    expect(bundle.learner.functionReference).toHaveLength(5);
    expect(bundle.learner.functionReference).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          signature: "readObstacle(side)",
          parameters: [expect.objectContaining({ name: "side" })],
          effect: expect.stringContaining("simulator"),
          example: expect.stringContaining("readObstacle"),
        }),
        expect.objectContaining({
          signature: "failSafeStop()",
          parameters: [],
          effect: expect.stringContaining("simulator"),
          example: expect.stringContaining("failSafeStop"),
        }),
      ]),
    );
    expect(bundle.hardware).toEqual(
      expect.objectContaining({
        requirementsVersion: "1.0.0",
        hardwareIncluded: false,
        completePathItemIds: [
          "pico-2-w",
          "breadboard",
          "usb-data-cable",
          "jumper-wires",
          "verified-rover",
          "obstacle-sensors",
        ],
        incrementalItemIds: ["verified-rover", "obstacle-sensors"],
      }),
    );
    expect(bundle.hardware?.components).toHaveLength(obstacleExplorer.hardware.items.length);
    expect(bundle.hardware?.components.every(
      (component) => component.verificationStatus === "pending-bench-test"
        && component.compatibilityClaimed === false
        && component.physicalCompletionEligible === false,
    )).toBe(true);
    expect(bundle.hardware?.safeguards).toEqual(
      expect.objectContaining({
        adultAssemblyRequired: true,
        adultAcknowledgementRequiredForExport: true,
        websiteMayControlHardware: false,
        simulatorCompletionAvailable: true,
        simulatedBadgeId: "obstacle-explorer-mission-complete",
        physicalBadgeId: "obstacle-explorer-physical-builder",
        physicalBadgeRequiresAdultSignoff: true,
        adultAssemblySteps: expect.arrayContaining([
          expect.stringContaining("wheels lifted"),
          expect.stringContaining("sensor calibration"),
        ]),
        powerRequirements: expect.arrayContaining([
          expect.stringContaining("switched protected motor supply"),
          expect.stringContaining("common signal ground"),
        ]),
        unrelatedHardwareNotRequired: expect.arrayContaining([
          "Camera Module 3 or Raspberry Pi Zero 2 W",
          "colour targets or camera ribbon",
          "servo, LED or infrared beacon parts",
        ]),
      }),
    );
    expect(validateMissionAuthoringBundle(bundle, obstacleExplorer)).toEqual([]);
    expect(() => assertValidMissionAuthoringBundle(bundle, obstacleExplorer)).not.toThrow();
  });

  it("rejects Obstacle Explorer compatibility and physical completion claims for an unverified sensor", () => {
    const bundle = structuredClone(OBSTACLE_EXPLORER_MISSION_ONE_AUTHORING_V1);
    const component = bundle.hardware!.components.find(
      (entry) => entry.itemId === "obstacle-sensors",
    )!;
    component.compatibilityClaimed = true;
    component.physicalCompletionEligible = true;

    expect(obstacleExplorerIssueCodes(bundle)).toEqual(
      expect.arrayContaining([
        "hardware-verification-claim",
        "unsafe-physical-export",
      ]),
    );
  });

  it("rejects Obstacle Explorer hardware drift and unsafe physical-control safeguards", () => {
    const bundle = structuredClone(OBSTACLE_EXPLORER_MISSION_ONE_AUTHORING_V1);
    bundle.hardware!.completePathItemIds.pop();
    bundle.hardware!.incrementalItemIds.push("unknown-item");
    bundle.hardware!.components[0]!.quantity = 99;
    bundle.hardware!.safeguards.websiteMayControlHardware = true as false;
    bundle.hardware!.safeguards.adultAssemblySteps = [];

    expect(obstacleExplorerIssueCodes(bundle)).toEqual(
      expect.arrayContaining([
        "hardware-item-mismatch",
        "unsafe-physical-export",
      ]),
    );
  });

  it("rejects incomplete Obstacle Explorer function documentation and badge drift", () => {
    const bundle = structuredClone(OBSTACLE_EXPLORER_MISSION_ONE_AUTHORING_V1);
    bundle.learner.functionReference![0]!.effect = "";
    bundle.hardware!.safeguards.simulatedBadgeId = "obstacle-explorer-physical-builder";
    bundle.hardware!.safeguards.physicalBadgeId = "missing-physical-badge";

    expect(obstacleExplorerIssueCodes(bundle)).toEqual(
      expect.arrayContaining([
        "invalid-function-reference",
        "invalid-hardware-reward",
      ]),
    );
  });

  it("publishes a complete Rainbow Rescue Rover local-camera integration mission", () => {
    const bundle = RAINBOW_RESCUE_ROVER_MISSION_ONE_AUTHORING_V1;

    expect(bundle.moduleId).toBe("junior-coder.rainbow-rescue-rover");
    expect(bundle.moduleVersion).toBe("1.1.0");
    expect(bundle.missionId).toBe("rainbow-rescue-rover-mission-1");
    expect(bundle.learner.stages.map((stage) => stage.kind)).toEqual(
      JUNIOR_CODER_MISSION_STAGE_ORDER_V1,
    );
    expect(bundle.learner.stages.find((stage) => stage.kind === "learn")?.instruction)
      .toContain("detectColour()");
    expect(bundle.learner.stages.find((stage) => stage.kind === "learn")?.instruction)
      .toContain("failSafeStop()");
    expect(bundle.learner.stages.find((stage) => stage.kind === "run")?.instruction)
      .toContain("Run action button");
    expect(bundle.learner.functionReference).toHaveLength(5);
    expect(bundle.learner.functionReference).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          signature: "detectColour(colour)",
          parameters: [expect.objectContaining({ name: "colour" })],
          effect: expect.stringContaining("simulator"),
          example: expect.stringContaining("detectColour"),
        }),
        expect.objectContaining({
          signature: "failSafeStop()",
          parameters: [],
          effect: expect.stringContaining("simulator"),
          example: expect.stringContaining("failSafeStop"),
        }),
      ]),
    );
    expect(bundle.hardware).toEqual(
      expect.objectContaining({
        requirementsVersion: "1.0.0",
        hardwareIncluded: false,
        completePathItemIds: [
          "pico-2-w",
          "breadboard",
          "usb-data-cable",
          "jumper-wires",
          "verified-explorer",
          "pi-zero-2-w",
          "camera-3",
          "pi-storage-power",
        ],
        incrementalItemIds: [
          "verified-explorer",
          "pi-zero-2-w",
          "camera-3",
          "pi-storage-power",
        ],
      }),
    );
    expect(bundle.hardware?.components).toHaveLength(rainbowRescueRover.hardware.items.length);
    expect(bundle.hardware?.components.every(
      (component) => component.verificationStatus === "pending-bench-test"
        && component.compatibilityClaimed === false
        && component.physicalCompletionEligible === false,
    )).toBe(true);
    expect(bundle.hardware?.safeguards).toEqual(
      expect.objectContaining({
        adultAssemblyRequired: true,
        adultAcknowledgementRequiredForExport: true,
        websiteMayControlHardware: false,
        simulatorCompletionAvailable: true,
        simulatedBadgeId: "rainbow-rescue-rover-mission-complete",
        physicalBadgeId: "rainbow-rescue-rover-physical-builder",
        physicalBadgeRequiresAdultSignoff: true,
        adultAssemblySteps: expect.arrayContaining([
          expect.stringContaining("camera ribbon"),
          expect.stringContaining("wheels lifted"),
        ]),
        powerRequirements: expect.arrayContaining([
          expect.stringContaining("separate regulated Raspberry Pi power supply"),
          expect.stringContaining("switched protected motor supply"),
        ]),
        warnings: expect.arrayContaining([
          expect.stringContaining("Camera frames remain on the family Raspberry Pi"),
          expect.stringContaining("website never activates motors"),
        ]),
      }),
    );
    expect(validateMissionAuthoringBundle(bundle, rainbowRescueRover)).toEqual([]);
    expect(() => assertValidMissionAuthoringBundle(bundle, rainbowRescueRover)).not.toThrow();
  });

  it("rejects Rainbow Rescue Rover compatibility and physical completion claims for an unverified camera", () => {
    const bundle = structuredClone(RAINBOW_RESCUE_ROVER_MISSION_ONE_AUTHORING_V1);
    const component = bundle.hardware!.components.find(
      (entry) => entry.itemId === "camera-3",
    )!;
    component.compatibilityClaimed = true;
    component.physicalCompletionEligible = true;

    expect(rainbowRescueRoverIssueCodes(bundle)).toEqual(
      expect.arrayContaining([
        "hardware-verification-claim",
        "unsafe-physical-export",
      ]),
    );
  });

  it("rejects Rainbow Rescue Rover manifest drift and website hardware control", () => {
    const bundle = structuredClone(RAINBOW_RESCUE_ROVER_MISSION_ONE_AUTHORING_V1);
    bundle.hardware!.completePathItemIds.pop();
    bundle.hardware!.incrementalItemIds.push("unknown-item");
    bundle.hardware!.components[0]!.quantity = 99;
    bundle.hardware!.safeguards.websiteMayControlHardware = true as false;
    bundle.hardware!.safeguards.adultAssemblySteps = [];

    expect(rainbowRescueRoverIssueCodes(bundle)).toEqual(
      expect.arrayContaining([
        "hardware-item-mismatch",
        "unsafe-physical-export",
      ]),
    );
  });

  it("rejects incomplete Rainbow Rescue Rover function documentation and badge drift", () => {
    const bundle = structuredClone(RAINBOW_RESCUE_ROVER_MISSION_ONE_AUTHORING_V1);
    bundle.learner.functionReference![0]!.effect = "";
    bundle.hardware!.safeguards.simulatedBadgeId = "rainbow-rescue-rover-physical-builder";
    bundle.hardware!.safeguards.physicalBadgeId = "missing-physical-badge";

    expect(rainbowRescueRoverIssueCodes(bundle)).toEqual(
      expect.arrayContaining([
        "invalid-function-reference",
        "invalid-hardware-reward",
      ]),
    );
  });

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
