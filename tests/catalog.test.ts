import { describe, expect, it } from "vitest";

import {
  JUNIOR_CODER_ROBOT_RESCUE_PATH_V1,
  assertValidLearningPath,
  validateLearningPath,
} from "../src/index.js";

describe("Junior Coder launch catalog", () => {
  it("contains the approved 19 self-contained modules", () => {
    const path = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1;

    expect(path.modules).toHaveLength(19);
    expect(path.modules.every((module) => module.selfContained)).toBe(true);
    expect(path.modules.every((module) => module.prerequisiteModuleIds.length === 0)).toBe(true);
    expect(new Set(path.modules.map((module) => module.id)).size).toBe(19);
  });

  it("contains eight games, five robotics, three vibe and three web-app modules", () => {
    const counts = Object.groupBy(
      JUNIOR_CODER_ROBOT_RESCUE_PATH_V1.modules,
      (module) => module.category,
    );

    expect(counts.game).toHaveLength(8);
    expect(counts.robot).toHaveLength(5);
    expect(counts.vibe).toHaveLength(3);
    expect(counts["web-app"]).toHaveLength(3);
  });

  it("publishes complete materials, standard agents and pre-purchase hardware disclosure", () => {
    for (const module of JUNIOR_CODER_ROBOT_RESCUE_PATH_V1.modules) {
      expect(module.materials.learner.length).toBeGreaterThan(0);
      expect(module.materials.facilitator.length).toBeGreaterThan(0);
      expect(module.agents.map((agent) => agent.role)).toEqual([
        "assessor",
        "debugger",
        "fix-guide",
        "concept-explainer",
      ]);
      expect(module.hardware.requirementsVersion).toMatch(/^1\./u);
      expect(module.hardware.hardwareIncluded).toBe(false);
      expect(module.hardware.simulatorAvailable).toBe(true);
      expect(module.pricing.tokenSubunits).toMatch(/^(0|[1-9][0-9]*)$/u);
    }
  });

  it("passes package validation", () => {
    expect(validateLearningPath(JUNIOR_CODER_ROBOT_RESCUE_PATH_V1)).toEqual([]);
    expect(() => assertValidLearningPath(JUNIOR_CODER_ROBOT_RESCUE_PATH_V1)).not.toThrow();
  });
});
