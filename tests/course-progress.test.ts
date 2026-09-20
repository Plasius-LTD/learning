import { describe, expect, it } from "vitest";
import {
  completeVerifiedLearningActivity, createLearningCourseProgress,
  recordLearningCourseAssessment, resolveLearningCourseStage, parseLearningCourseProgress,
  type AssessmentRubricV1,
} from "../src/index.js";
import { courseFixture } from "./helpers/course-fixture.js";

const digest = "a".repeat(64);
const rubric: AssessmentRubricV1 = {
  version: "2.0.0", completionScore: 80,
  criteria: [
    { id: "structure", label: "The program is valid.", dimension: "structure", points: 20, mandatory: true, visibility: "visible" },
    { id: "behaviour", label: "The rescue succeeds.", dimension: "behaviour", points: 50, mandatory: true, visibility: "visible" },
    { id: "resilience", label: "The rescue handles obstacles.", dimension: "resilience", points: 20, mandatory: true, visibility: "protected" },
    { id: "safety", label: "The robot stays inside its bounds.", dimension: "safety", points: 10, mandatory: true, visibility: "protected" },
  ],
};
const authority = (missionId = "maze-mission-1", passed = true) => ({
  assessmentId: missionId === "final" ? "robot-maze-capstone" : `maze-assessment-${missionId.split("-").at(-1)}`,
  missionId, sourceDigest: digest, referenceId: `evidence-${missionId}-${passed ? "pass" : "fail"}`, rubric,
  checks: rubric.criteria.map(criterion => ({ criterionId: criterion.id, passed })),
});

describe("verified course progression", () => {
  it("rejects malformed stored progress without accepting forged completion", () => {
    const course = courseFixture();
    const progress = createLearningCourseProgress(course);
    expect(parseLearningCourseProgress(course, progress)).toEqual(progress);
    const values = [null, [], {}, { ...progress, score: 100 }, { ...progress, moduleVersion: "1.1.0" },
      { ...progress, completedStageIds: ["maze-mission-1-reward"] },
      { ...progress, completedMissionIds: ["maze-mission-1"] },
      { ...progress, assessments: [null] },
      { ...progress, completion: { referenceId: "fake", sourceDigest: digest, bestScore: 100 } }];
    for (const value of values) expect(() => parseLearningCourseProgress(course, value)).toThrow();
  });
  it("starts with one available activity and clamps a forged save cursor", () => {
    const course = courseFixture();
    const progress = createLearningCourseProgress(course);
    expect(progress.completedStageIds).toEqual([]);
    expect(resolveLearningCourseStage(course, progress, "maze-mission-6-reward")).toBe("maze-mission-1-learn");
  });

  it("rejects skipped, rejected and malformed activity evidence", () => {
    const course = courseFixture();
    const progress = createLearningCourseProgress(course);
    for (const proof of [
      { stageId: "maze-mission-1-reward", accepted: true, sourceDigest: digest },
      { stageId: "maze-mission-1-learn", accepted: false, sourceDigest: digest },
      { stageId: "maze-mission-1-learn", accepted: true, sourceDigest: "bad" },
    ]) expect(() => completeVerifiedLearningActivity(course, progress, proof)).toThrow();
    expect(progress.completedStageIds).toEqual([]);
  });

  it("allows failed assessment inspection but requires verified repair before reward", () => {
    const course = courseFixture();
    let progress = createLearningCourseProgress(course);
    for (const kind of ["learn", "predict", "build", "run"]) {
      progress = completeVerifiedLearningActivity(course, progress, { stageId: `maze-mission-1-${kind}`, accepted: true, sourceDigest: digest });
    }
    expect(() => completeVerifiedLearningActivity(course, progress, { stageId: "maze-mission-1-assess", accepted: true, sourceDigest: digest })).toThrow();
    progress = recordLearningCourseAssessment(course, progress, authority("maze-mission-1", false));
    for (const kind of ["assess", "inspect"]) progress = completeVerifiedLearningActivity(course, progress, { stageId: `maze-mission-1-${kind}`, accepted: true, sourceDigest: digest });
    expect(() => completeVerifiedLearningActivity(course, progress, { stageId: "maze-mission-1-fix", accepted: true, sourceDigest: digest })).toThrow();
    progress = recordLearningCourseAssessment(course, progress, authority());
    for (const kind of ["fix", "explain", "reward"]) progress = completeVerifiedLearningActivity(course, progress, { stageId: `maze-mission-1-${kind}`, accepted: true, sourceDigest: digest });
    expect(progress.completedMissionIds).toEqual(["maze-mission-1"]);
    expect(progress.completion).toBeNull();
    expect(resolveLearningCourseStage(course, progress, "maze-mission-6-learn")).toBe("maze-mission-2-learn");
    expect(resolveLearningCourseStage(course, progress, "maze-mission-1-build")).toBe("maze-mission-1-build");
  });

  it("rejects stale-source evidence, locked mission assessment and premature capstones", () => {
    const course = courseFixture();
    const progress = createLearningCourseProgress(course);
    expect(() => recordLearningCourseAssessment(course, progress, authority("maze-mission-2"))).toThrow();
    expect(() => recordLearningCourseAssessment(course, progress, authority("final"))).toThrow();
    let next = recordLearningCourseAssessment(course, progress, authority());
    for (const kind of ["learn", "predict", "build", "run"]) next = completeVerifiedLearningActivity(course, next, { stageId: `maze-mission-1-${kind}`, accepted: true, sourceDigest: digest });
    expect(() => completeVerifiedLearningActivity(course, next, { stageId: "maze-mission-1-assess", accepted: true, sourceDigest: "b".repeat(64) })).toThrow();
  });

  it("binds assessment definitions and refuses reuse of evidence for different results", () => {
    const course = courseFixture();
    const initial = createLearningCourseProgress(course);
    expect(() => recordLearningCourseAssessment(course, initial, { ...authority(), assessmentId: "another-assessment" })).toThrow();
    expect(() => recordLearningCourseAssessment(course, initial, { ...authority(), checks: [{ criterionId: "unknown", passed: true }] })).toThrow();
    const progress = recordLearningCourseAssessment(course, initial, authority());
    expect(recordLearningCourseAssessment(course, progress, authority())).toEqual(progress);
    expect(() => recordLearningCourseAssessment(course, progress, { ...authority("maze-mission-1", false), referenceId: authority().referenceId })).toThrow();
    const forged = structuredClone(progress);
    forged.assessments[0]!.result.failedMandatoryCriterionIds = ["safety"];
    expect(() => parseLearningCourseProgress(course, forged)).toThrow();
  });

  it("awards completion only after all missions and a passing capstone; replay preserves it", () => {
    const course = courseFixture();
    let progress = createLearningCourseProgress(course);
    for (const mission of course.missions) {
      progress = recordLearningCourseAssessment(course, progress, authority(mission.id));
      for (const stage of mission.stages) progress = completeVerifiedLearningActivity(course, progress, { stageId: stage.id, accepted: true, sourceDigest: digest });
    }
    expect(progress.completedStageIds).toHaveLength(54);
    expect(progress.completion).toBeNull();
    const failed = recordLearningCourseAssessment(course, progress, authority("final", false));
    expect(failed.completion).toBeNull();
    progress = recordLearningCourseAssessment(course, failed, authority("final"));
    expect(progress.completion).toMatchObject({ referenceId: "evidence-final-pass", sourceDigest: digest, bestScore: 100 });
    expect(recordLearningCourseAssessment(course, progress, authority("final", false)).completion).toEqual(progress.completion);
  });
});
