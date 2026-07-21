import { describe, expect, it } from "vitest";

import {
  JUNIOR_CODER_ROBOT_RESCUE_PATH_V1,
  calculateAssessment,
} from "../src/index.js";

const rubric = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1.modules[0]!.assessment;

describe("calculateAssessment", () => {
  it("calculates a deterministic completed score", () => {
    const results = rubric.criteria.map((criterion) => ({
      criterionId: criterion.id,
      passed: true,
    }));

    expect(calculateAssessment(rubric, results)).toMatchObject({
      score: 100,
      band: "mastered",
      completed: true,
      failedMandatoryCriterionIds: [],
    });
  });

  it("prevents completion when a mandatory safety criterion fails", () => {
    const results = rubric.criteria.map((criterion) => ({
      criterionId: criterion.id,
      passed: criterion.dimension !== "safety",
    }));

    expect(calculateAssessment(rubric, results)).toMatchObject({
      score: 90,
      band: "mission-complete",
      completed: false,
    });
  });

  it("rejects unknown or duplicate criterion results", () => {
    expect(() =>
      calculateAssessment(rubric, [{ criterionId: "unknown", passed: true }]),
    ).toThrow(/Unknown assessment criterion/u);

    expect(() =>
      calculateAssessment(rubric, [
        { criterionId: rubric.criteria[0]!.id, passed: true },
        { criterionId: rubric.criteria[0]!.id, passed: false },
      ]),
    ).toThrow(/Duplicate assessment result/u);
  });

  it("uses child-readable score bands", () => {
    const criterion = rubric.criteria[0]!;
    const score = calculateAssessment(rubric, [
      { criterionId: criterion.id, passed: true },
    ]);

    expect(score.score).toBe(criterion.points);
    expect(score.band).toBe("keep-exploring");
    expect(score.completed).toBe(false);
  });
});
