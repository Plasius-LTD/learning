import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";

import {
  EXTERNAL_LEARNING_CONTENT_REFERENCE_VERSION_V1,
  JUNIOR_CODER_ROAD_HOPPER_RALLY_V2,
  JUNIOR_CODER_MODULE_PRICE_V1_1,
  JUNIOR_CODER_ROBOT_RESCUE_PATH_CURRENT,
  JUNIOR_CODER_ROBOT_RESCUE_PATH_V1,
  JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1,
  JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_2,
  ROAD_HOPPER_RALLY_EXTERNAL_CONTENT_V1,
  isExternalLearningContentReferenceV1,
  type ModuleEntitlementV1,
  validateLearningPath,
} from "../src/index.js";

describe("Junior Coder immutable £5-equivalent catalog", () => {
  it("preserves the published 1.0.0 module versions and shadow prices", () => {
    expect(JUNIOR_CODER_ROBOT_RESCUE_PATH_V1.version).toBe("1.0.0");
    expect(
      JUNIOR_CODER_ROBOT_RESCUE_PATH_V1.modules.map((module) => ({
        version: module.version,
        tokenSubunits: module.pricing.tokenSubunits,
        referencePrice: module.pricing.referencePrice,
      })),
    ).toEqual([
      { version: "1.0.0", tokenSubunits: "8000", referencePrice: undefined },
      { version: "1.0.0", tokenSubunits: "10000", referencePrice: undefined },
      { version: "1.0.0", tokenSubunits: "10000", referencePrice: undefined },
      { version: "1.0.0", tokenSubunits: "12000", referencePrice: undefined },
      { version: "1.0.0", tokenSubunits: "12000", referencePrice: undefined },
      { version: "1.0.0", tokenSubunits: "14000", referencePrice: undefined },
      { version: "1.0.0", tokenSubunits: "10000", referencePrice: undefined },
      { version: "1.0.0", tokenSubunits: "16000", referencePrice: undefined },
      { version: "1.0.0", tokenSubunits: "8000", referencePrice: undefined },
      { version: "1.0.0", tokenSubunits: "10000", referencePrice: undefined },
      { version: "1.0.0", tokenSubunits: "14000", referencePrice: undefined },
      { version: "1.0.0", tokenSubunits: "14000", referencePrice: undefined },
      { version: "1.0.0", tokenSubunits: "18000", referencePrice: undefined },
      { version: "1.0.0", tokenSubunits: "12000", referencePrice: undefined },
      { version: "1.0.0", tokenSubunits: "12000", referencePrice: undefined },
      { version: "1.0.0", tokenSubunits: "16000", referencePrice: undefined },
      { version: "1.0.0", tokenSubunits: "10000", referencePrice: undefined },
      { version: "1.0.0", tokenSubunits: "12000", referencePrice: undefined },
      { version: "1.0.0", tokenSubunits: "14000", referencePrice: undefined },
    ]);
  });

  it("publishes nineteen independent 1.1.0 modules at 50 Tokens / £5 reference", () => {
    const path = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1;

    expect(path.version).toBe("1.1.0");
    expect(path.modules).toHaveLength(19);
    expect(new Set(path.modules.map((module) => module.version))).toEqual(
      new Set(["1.1.0"]),
    );
    expect(
      path.modules.every(
        (module) =>
          module.pricing.tokenSubunits
            === JUNIOR_CODER_MODULE_PRICE_V1_1.tokenSubunits
          && module.pricing.referencePrice
            === JUNIOR_CODER_MODULE_PRICE_V1_1.referencePrice,
      ),
    ).toBe(true);
    expect(JUNIOR_CODER_MODULE_PRICE_V1_1).toEqual({
      tokenSubunits: "50000",
      referencePrice: {
        currency: "GBP",
        minorUnits: "500",
        basis: "nominal-reference",
        cashRedemptionAllowed: false,
      },
    });
    expect(validateLearningPath(path)).toEqual([]);
  });

  it("rejects malformed GBP reference metadata", () => {
    const invalidPath = structuredClone(
      JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1,
    );
    invalidPath.modules[0]!.pricing.referencePrice!.minorUnits = "0500";

    expect(validateLearningPath(invalidPath)).toContainEqual(
      expect.objectContaining({
        code: "invalid-reference-price",
        path: "modules[0].pricing.referencePrice",
      }),
    );
  });

  it("distinguishes administrator testing from economic entitlement sources", () => {
    const entitlement: ModuleEntitlementV1 = {
      entitlementId: "entitlement-admin-test-1",
      subjectAccountId: "account-admin-test-1",
      moduleId: "junior-coder.robot-maze-dash",
      moduleVersion: "1.1.0",
      source: "admin-test-grant",
      state: "active",
      grantedAt: "2026-07-28T00:00:00.000Z",
    };

    expect(entitlement.source).toBe("admin-test-grant");
    expect(entitlement.economyTransactionId).toBeUndefined();
  });

  it("preserves the byte-compatible immutable 1.1.0 catalog snapshot", () => {
    expect(
      createHash("sha256")
        .update(JSON.stringify(JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1))
        .digest("hex"),
    ).toBe("2e25002712dec94b1653906fe97af9e174eb3a556a34e5e7a80732ee307996ed");
  });

  it("publishes only Road Hopper Rally 2.0.0 in path 1.2.0", () => {
    const path = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_2;
    const roadHopper = path.modules.find(
      (module) => module.id === "junior-coder.road-hopper-rally",
    );

    expect(path.version).toBe("1.2.0");
    expect(path.modules).toHaveLength(19);
    expect(roadHopper).toBe(JUNIOR_CODER_ROAD_HOPPER_RALLY_V2);
    expect(roadHopper).toMatchObject({
      version: "2.0.0",
      estimatedMinutes: 450,
      externalContent: ROAD_HOPPER_RALLY_EXTERNAL_CONTENT_V1,
    });
    expect(roadHopper?.missions).toHaveLength(6);
    expect(
      path.modules
        .filter((module) => module.id !== "junior-coder.road-hopper-rally")
        .every((module) => module.version === "1.1.0"),
    ).toBe(true);
    expect(JUNIOR_CODER_ROBOT_RESCUE_PATH_CURRENT).toBe(path);
    expect(validateLearningPath(path)).toEqual([]);
  });

  it("pins the external course export by exact version and SHA-256 digest", () => {
    expect(EXTERNAL_LEARNING_CONTENT_REFERENCE_VERSION_V1).toBe("1");
    expect(ROAD_HOPPER_RALLY_EXTERNAL_CONTENT_V1).toEqual({
      packageName: "@plasius/learning-road-hopper-rally",
      packageVersion: "1.0.0",
      exportName: "ROAD_HOPPER_RALLY_COURSE_V2",
      sha256: "1a20741beba028004e0be527d05aae2b2881082d3b578e0d62308a59bf1323f0",
    });
    expect(
      isExternalLearningContentReferenceV1(ROAD_HOPPER_RALLY_EXTERNAL_CONTENT_V1),
    ).toBe(true);
    expect(
      isExternalLearningContentReferenceV1({
        ...ROAD_HOPPER_RALLY_EXTERNAL_CONTENT_V1,
        packageVersion: "^1.0.0",
      }),
    ).toBe(false);
    for (const invalidReference of [
      null,
      "@plasius/learning-road-hopper-rally@1.0.0",
      { ...ROAD_HOPPER_RALLY_EXTERNAL_CONTENT_V1, packageName: "learning-road-hopper-rally" },
      { ...ROAD_HOPPER_RALLY_EXTERNAL_CONTENT_V1, exportName: "not-an-export" },
      { ...ROAD_HOPPER_RALLY_EXTERNAL_CONTENT_V1, sha256: "A".repeat(64) },
    ]) {
      expect(isExternalLearningContentReferenceV1(invalidReference)).toBe(false);
    }

    const invalidPath = structuredClone(JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_2);
    const roadHopper = invalidPath.modules.find(
      (module) => module.id === "junior-coder.road-hopper-rally",
    );
    if (!roadHopper?.externalContent) throw new Error("missing Road Hopper reference");
    roadHopper.externalContent.sha256 = "not-a-digest";

    expect(validateLearningPath(invalidPath)).toContainEqual(
      expect.objectContaining({
        code: "invalid-external-content-reference",
        path: "modules[1].externalContent",
      }),
    );
  });
});
