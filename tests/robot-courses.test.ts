import { describe, expect, it } from "vitest";
import { validateLearningCourse } from "../src/course-contracts.js";
import { course as beacon, practice as beaconPractice } from "../src/courses/beacon-bot.js";
import { course as servo, practice as servoPractice } from "../src/courses/servo-creature.js";
import { course as dance, practice as dancePractice } from "../src/courses/dance-rover.js";
import { course as obstacle, practice as obstaclePractice } from "../src/courses/obstacle-explorer.js";
import { course as rainbow, practice as rainbowPractice } from "../src/courses/rainbow-rescue-rover.js";

describe("Beacon Bot complete robot course", () => {
  it("teaches signals, non-blocking timing, reusable patterns, sensor edges and bounded messaging", () => {
    expect(validateLearningCourse(beacon)).toEqual([]);
    expect(beacon.category).toBe("robot");
    expect(beacon.missions.map(mission => mission.title)).toEqual([
      "A signal with a meaning", "Time without waiting", "A pattern worth naming", "A button is an event", "A message with a limit", "The rescue beacon network",
    ]);
    expect(beacon.projectFiles).toEqual([{ path: "robot.cpp", language: "cpp", maximumCharacters: 24000 }]);
    expect(beacon.starterProject.files[0]!.source).toContain("void loop()");
    expect(new Set(beacon.missions.flatMap(mission => mission.stages.map(stage => stage.instruction))).size).toBe(54);
    expect(beaconPractice).toHaveLength(18);
    const content = beacon.missions.flatMap(mission => mission.stages.map(stage => `${stage.instruction} ${stage.help}`)).join(" ");
    for (const term of ["millis", "held", "duplicate", "stop", "simulator", "keyboard"]) expect(content).toContain(term);
  });
});

describe("Obstacle Explorer complete robot course", () => {
  it("teaches distance thresholds, state transitions, bounded turns, stale inputs and deliberate recovery", () => {
    expect(validateLearningCourse(obstacle)).toEqual([]);
    expect(obstacle.missions.map(mission => mission.title)).toEqual([
      "A distance you can trust", "Remember the last decision", "Turn with a deadline", "Notice a missing observation", "Try again deliberately", "The exploration course",
    ]);
    expect(new Set(obstacle.missions.flatMap(mission => mission.stages.map(stage => stage.instruction))).size).toBe(54);
    expect(obstaclePractice).toHaveLength(18);
    expect(obstacle.projectFiles[0]!.language).toBe("cpp");
    const content = obstacle.missions.flatMap(mission => mission.stages.map(stage => `${stage.instruction} ${stage.help}`)).join(" ");
    for (const term of ["250", "600", "duplicate", "bumper", "simulator", "keyboard"]) expect(content).toContain(term);
  });
});

describe("Rainbow Rescue Rover complete robot course", () => {
  it("teaches confidence, steering, command sequences, heartbeat expiry and target completion", () => {
    expect(validateLearningCourse(rainbow)).toEqual([]);
    expect(rainbow.missions.map(mission => mission.title)).toEqual([
      "A colour with evidence", "Where is the target?", "A command with an identity", "Keep the connection alive", "Arrive once, stop clearly", "The rainbow rescue",
    ]);
    expect(new Set(rainbow.missions.flatMap(mission => mission.stages.map(stage => stage.instruction))).size).toBe(54);
    expect(rainbowPractice).toHaveLength(18);
    expect(rainbow.projectFiles[0]!.language).toBe("cpp");
    const content = rainbow.missions.flatMap(mission => mission.stages.map(stage => `${stage.instruction} ${stage.help}`)).join(" ");
    for (const term of ["confidence", "sequence", "heartbeat", "250", "simulator", "keyboard"]) expect(content).toContain(term);
  });
});

describe("Servo Creature complete robot course", () => {
  it("teaches bounded poses, smooth timing, sequences, moods and fresh sensor safety", () => {
    expect(validateLearningCourse(servo)).toEqual([]);
    expect(servo.category).toBe("robot");
    expect(servo.missions.map(mission => mission.title)).toEqual([
      "A pose inside the limits", "Move a little at a time", "A sequence of poses", "Give the creature a mood", "A gentle response to touch", "The creature show",
    ]);
    expect(new Set(servo.missions.flatMap(mission => mission.stages.map(stage => stage.instruction))).size).toBe(54);
    expect(servoPractice).toHaveLength(18);
    expect(servo.projectFiles[0]!.language).toBe("cpp");
    const content = servo.missions.flatMap(mission => mission.stages.map(stage => `${stage.instruction} ${stage.help}`)).join(" ");
    for (const term of ["45", "distance", "stop", "held", "simulator", "keyboard"]) expect(content).toContain(term);
  });
});

describe("Dance Rover complete robot course", () => {
  it("teaches differential movement, bounded power, reusable dances and safe interruption", () => {
    expect(validateLearningCourse(dance)).toEqual([]);
    expect(dance.missions.map(mission => mission.title)).toEqual([
      "Stopped until invited", "Two wheels, one rover", "Build speed gently", "Name the dance steps", "An interrupted performance", "The rover performance",
    ]);
    expect(new Set(dance.missions.flatMap(mission => mission.stages.map(stage => stage.instruction))).size).toBe(54);
    expect(dancePractice).toHaveLength(18);
    expect(dance.projectFiles[0]!.language).toBe("cpp");
    const content = dance.missions.flatMap(mission => mission.stages.map(stage => `${stage.instruction} ${stage.help}`)).join(" ");
    for (const term of ["differential", "20", "stop", "battery", "simulator", "keyboard"]) expect(content).toContain(term);
  });
});
