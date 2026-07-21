import { describe, expect, it } from "vitest";

import {
  JUNIOR_CODER_ROBOT_RESCUE_PATH_V1,
  type LearningPathVersionV1,
  validateLearningPath,
} from "../src/index.js";

function clonePath(): LearningPathVersionV1 {
  return structuredClone(JUNIOR_CODER_ROBOT_RESCUE_PATH_V1);
}

describe("learning path validation", () => {
  it("rejects duplicate module identifiers", () => {
    const path = clonePath();
    path.modules[1] = { ...path.modules[1]!, id: path.modules[0]!.id };

    expect(validateLearningPath(path)).toContainEqual(
      expect.objectContaining({ code: "duplicate-module-id" }),
    );
  });

  it("rejects paid prerequisites and mixed facilitator material", () => {
    const path = clonePath();
    path.modules[0] = {
      ...path.modules[0]!,
      prerequisiteModuleIds: ["another-paid-module"],
      materials: {
        ...path.modules[0]!.materials,
        learner: [
          ...path.modules[0]!.materials.learner,
          { id: "answer-key", kind: "answer-key", audience: "facilitator" },
        ],
      },
    };

    const codes = validateLearningPath(path).map((issue) => issue.code);
    expect(codes).toContain("paid-prerequisite");
    expect(codes).toContain("facilitator-material-leak");
  });

  it("rejects rubrics that do not total 100 or preserve dimension weights", () => {
    const path = clonePath();
    path.modules[0]!.assessment.criteria[0]!.points = 19;

    const codes = validateLearningPath(path).map((issue) => issue.code);
    expect(codes).toContain("rubric-total");
    expect(codes).toContain("rubric-dimension-total");
  });

  it("requires exact physical requirements for a physical-first module", () => {
    const path = clonePath();
    const robot = path.modules.find((module) => module.category === "robot")!;
    robot.hardware.items = [];

    expect(validateLearningPath(path)).toContainEqual(
      expect.objectContaining({ code: "missing-hardware-items", moduleId: robot.id }),
    );
  });
});
