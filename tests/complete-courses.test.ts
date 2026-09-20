import { describe, expect, it } from "vitest";
import { validateLearningCourse } from "../src/course-contracts.js";
import { course, practice } from "../src/courses/robot-maze-dash.js";
import { course as skywing, practice as skywingPractice } from "../src/courses/skywing-sprint.js";
import { course as meteor, practice as meteorPractice } from "../src/courses/meteor-shield.js";
import { course as trail, practice as trailPractice } from "../src/courses/pixel-trail-challenge.js";

describe("Robot Maze Dash complete curriculum", () => {
  it("has six distinct taught projects with all nine activities and an accumulated capstone", () => {
    expect(validateLearningCourse(course)).toEqual([]);
    expect(course.moduleVersion).toBe("2.0.0");
    expect(course.moduleId).toBe("junior-coder.robot-maze-dash");
    expect(course.missions.map(mission => mission.title)).toEqual([
      "A route to the rescue pad", "Repeat the useful part", "Read the walls", "Name a rescue routine", "Collect and count", "The lost-robot expedition",
    ]);
    expect(new Set(course.missions.flatMap(mission => mission.stages.map(stage => stage.instruction))).size).toBe(54);
    expect(course.reference.map(entry => entry.name)).toEqual(expect.arrayContaining(["forward", "repeat", "if-clear", "call", "collect"]));
    expect(course.starterProject.files[0]!.path).toBe("maze.json");
    expect(JSON.parse(course.starterProject.files[0]!.source)).toHaveProperty("program");
  });
  it("includes authored concept checks with explanatory feedback for all learning, prediction and reflection stages", () => {
    expect(practice).toHaveLength(18);
    for (const question of practice) {
      expect(course.missions.flatMap(mission => mission.stages).some(stage => stage.id === question.stageId)).toBe(true);
      expect(question.choices).toHaveLength(3);
      expect(new Set(question.choices).size).toBe(3);
      expect(question.correctChoice).toBeGreaterThanOrEqual(0);
      expect(question.correctChoice).toBeLessThan(3);
      expect(question.feedback.length).toBeGreaterThan(40);
    }
  });
});

describe("Skywing Sprint complete curriculum", () => {
  it("teaches flight, controls, obstacle lifecycle, collision, repeatable scoring and a finished race", () => {
    expect(validateLearningCourse(skywing)).toEqual([]);
    expect(skywing.missions.map(mission => mission.title)).toEqual([
      "A bird with weight", "One flap, one impulse", "Gates on the horizon", "A fair landing", "A score you can trust", "The twilight sprint",
    ]);
    expect(skywing.projectFiles).toEqual([{ path: "game.js", language: "javascript", maximumCharacters: 32000 }]);
    expect(skywing.starterProject.files[0]!.source).toContain("function update(state, input)");
    expect(skywing.reference.map(entry => entry.name)).toEqual(expect.arrayContaining(["initialState", "update", "input.dt", "input.gate", "bird.radius"]));
    expect(new Set(skywing.missions.flatMap(mission => mission.stages.map(stage => stage.instruction))).size).toBe(54);
    expect(skywingPractice).toHaveLength(18);
    expect(new Set(skywingPractice.map(question => question.stageId)).size).toBe(18);
    expect(skywing.missions[5]!.goals.join(" ")).toMatch(/restart/);
  });
  it("distinguishes simulation time and input edges from display frames and held keys", () => {
    const content = skywing.missions.flatMap(mission => mission.stages.map(stage => `${stage.instruction} ${stage.help}`)).join(" ");
    expect(content).toMatch(/pixels per second/);
    expect(content).toMatch(/held/);
    expect(content).toMatch(/radius/);
    expect(content).toMatch(/seed/);
    expect(content).toMatch(/reduced motion/);
  });
});

describe("Meteor Shield complete curriculum", () => {
  it("teaches a cumulative defence project with explicit movement, timing and resource rules", () => {
    expect(validateLearningCourse(meteor)).toEqual([]);
    expect(meteor.missions.map(mission => mission.title)).toEqual([
      "Stations on the map", "Aim beyond the launcher", "A shield with a lifetime", "The incoming waves", "Energy and emergency repairs", "The last station",
    ]);
    expect(new Set(meteor.missions.flatMap(mission => mission.stages.map(stage => stage.instruction))).size).toBe(54);
    expect(meteorPractice).toHaveLength(18);
    expect(meteor.reference.map(entry => entry.name)).toEqual(expect.arrayContaining(["distance", "input.spawns", "shields", "energy", "waveComplete"]));
    const content = meteor.missions.flatMap(mission => mission.stages.map(stage => `${stage.instruction} ${stage.help}`)).join(" ");
    for (const requirement of ["zero", "once", "preconditions", "keyboard", "restart", "seenMeteorIds"]) expect(content).toContain(requirement);
    expect(meteor.starterProject.files[0]!.source).toContain("seenMeteorIds: []");
  });
});

describe("Pixel Trail Challenge complete curriculum", () => {
  it("teaches a complete grid game including input, growth, safe food placement and tail collisions", () => {
    expect(validateLearningCourse(trail)).toEqual([]);
    expect(trail.missions.map(mission => mission.title)).toEqual([
      "One square at a time", "A trail that follows", "An orb in an empty square", "Edges and moving tails", "A fair score and a fresh start", "The winding trail",
    ]);
    expect(new Set(trail.missions.flatMap(mission => mission.stages.map(stage => stage.instruction))).size).toBe(54);
    expect(trailPractice).toHaveLength(18);
    const content = trail.missions.flatMap(mission => mission.stages.map(stage => `${stage.instruction} ${stage.help}`)).join(" ");
    for (const requirement of ["tail", "candidate", "bounded", "reverse", "keyboard", "restart"]) expect(content).toContain(requirement);
    expect(trail.reference.map(entry => entry.name)).toContain("input.foodCandidates");
  });
});
