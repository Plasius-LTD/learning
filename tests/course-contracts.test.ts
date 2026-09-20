import { describe, expect, it } from "vitest";
import {
  parseLearningCourseDraft,
  parseLearningCourse,
  parseLearningProject,
  parseLearningSaveSlotId,
  validateLearningCourse,
} from "../src/index.js";

import { courseFixture } from "./helpers/course-fixture.js";

describe("complete course contracts", () => {
  it("parses a detached learner manifest and rejects protected extra content", () => {
    const course = courseFixture();
    const parsed = parseLearningCourse(course);
    course.title = "changed";
    expect(parsed.title).toBe("Robot Maze Dash");
    expect(() => parseLearningCourse({ ...course, answerKey: "private" })).toThrow();
    const altered = courseFixture();
    Object.assign(altered.missions[0]!.stages[0]!, { solution: "private" });
    expect(() => parseLearningCourse(altered)).toThrow();
  });
  it("accepts a bounded six-mission course with all nine activities", () => {
    expect(validateLearningCourse(courseFixture())).toEqual([]);
  });

  it("rejects outlines, duplicated stages and missing project references", () => {
    const course = courseFixture();
    course.missions.pop();
    course.missions[0]!.stages[1]!.id = course.missions[0]!.stages[0]!.id;
    course.starterProject.files[0]!.path = "missing.js";
    expect(validateLearningCourse(course).map(issue => issue.code)).toEqual(
      expect.arrayContaining(["mission-count", "duplicate-id", "invalid-project"]),
    );
  });

  it("rejects reordered activities and placeholder copy", () => {
    const course = courseFixture();
    course.missions[0]!.stages.reverse();
    course.missions[1]!.stages[0]!.instruction = "Coming soon";
    expect(validateLearningCourse(course).map(issue => issue.code)).toEqual(
      expect.arrayContaining(["stage-order", "incomplete-content"]),
    );
  });

  it("returns issues rather than crashing on malformed external manifests", () => {
    for (const value of [null, [], 3, {}, { missions: [null] }]) {
      expect(validateLearningCourse(value).length).toBeGreaterThan(0);
    }
  });
});

describe("account draft boundary", () => {
  const draft = () => ({ schemaVersion: "1", moduleVersion: "2.0.0",
    activeStageId: "maze-mission-1-learn", project: { files: [{ path: "robot.json", source: "[]" }] } });

  it("copies only the declared editable project and navigation", () => {
    const input = draft();
    const parsed = parseLearningCourseDraft(courseFixture(), input);
    input.project.files[0]!.source = "changed";
    expect(parsed.project.files[0]!.source).toBe("[]");
  });

  it.each(["completed", "score", "subjectId", "evidence", "passedStageIds"])("rejects client authority %s", field => {
    expect(() => parseLearningCourseDraft(courseFixture(), { ...draft(), [field]: true })).toThrow();
  });

  it("rejects version mismatches, unknown stages, extra paths and oversized source", () => {
    const inputs = [
      { ...draft(), moduleVersion: "1.1.0" },
      { ...draft(), activeStageId: "someone-elses-stage" },
      { ...draft(), project: { files: [{ path: "../secret", source: "[]" }] } },
      { ...draft(), project: { files: [{ path: "robot.json", source: "x".repeat(16001) }] } },
      { ...draft(), project: { files: [] } },
      { ...draft(), project: { files: [...draft().project.files, ...draft().project.files] } },
    ];
    for (const input of inputs) expect(() => parseLearningCourseDraft(courseFixture(), input)).toThrow();
  });

  it("accepts autosave and exactly nine manual slots", () => {
    expect(parseLearningSaveSlotId("auto")).toBe("auto");
    for (let index = 1; index <= 9; index++) expect(parseLearningSaveSlotId(String(index))).toBe(String(index));
    for (const value of [0, null, "0", "10", "../auto", "01", "Auto"]) {
      expect(() => parseLearningSaveSlotId(value)).toThrow();
    }
  });

  it("canonicalises file order and bounds total source as well as each file", () => {
    const projectFiles = [
      { path: "main.js", language: "javascript" as const, maximumCharacters: 64000 },
      { path: "style.css", language: "css" as const, maximumCharacters: 64000 },
    ];
    const files = [{ path: "style.css", source: "body {}" }, { path: "main.js", source: "" }];
    expect(parseLearningProject({ projectFiles }, { files }).files.map(file => file.path)).toEqual(["main.js", "style.css"]);
    expect(() => parseLearningProject({ projectFiles }, { files: projectFiles.map(file => ({ path: file.path, source: "x".repeat(64000) })) })).toThrow();
    expect(() => parseLearningProject(courseFixture(), { files: [{ path: "robot.json", source: "\u0000" }] })).toThrow();
    expect(() => parseLearningProject(courseFixture(), { files: [{ path: "robot.json", source: "[]", score: 100 }] })).toThrow();
  });
});
