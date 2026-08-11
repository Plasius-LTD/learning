import { describe, expect, it } from "vitest";

import {
  JUNIOR_CODER_MODULE_PRICE_V1_1,
  JUNIOR_CODER_MODULE_PRICE_V1_2,
  JUNIOR_CODER_ROBOT_RESCUE_PATH_CURRENT,
  JUNIOR_CODER_ROBOT_RESCUE_PATH_V1,
  JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1,
  JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_2,
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

  it("publishes immutable 1.2.0 modules as the public 50-Token catalog", () => {
    const path = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_2;

    expect(path).not.toBe(JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1);
    expect(path.version).toBe("1.2.0");
    expect(path.catalogState).toBe("public");
    expect(path.modules).toHaveLength(19);
    expect(new Set(path.modules.map((module) => module.version))).toEqual(
      new Set(["1.2.0"]),
    );
    expect(
      path.modules.every(
        (module) =>
          module.pricing.tokenSubunits
            === JUNIOR_CODER_MODULE_PRICE_V1_2.tokenSubunits
          && module.pricing.referencePrice
            === JUNIOR_CODER_MODULE_PRICE_V1_2.referencePrice,
      ),
    ).toBe(true);
    expect(JUNIOR_CODER_ROBOT_RESCUE_PATH_CURRENT).toBe(path);
    expect(JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.catalogState).toBe("pilot");
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
});
