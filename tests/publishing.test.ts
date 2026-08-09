import { describe, expect, it } from "vitest";

import {
  STATIC_PROJECT_APPROVAL_STATEMENT_VERSION_V1,
  STATIC_PROJECT_PUBLISHING_CONTRACT_VERSION_V1,
  STATIC_PROJECT_SAFETY_CHECK_IDS_V1,
  STATIC_PROJECT_SCANNER_VERSION_V1,
  assertValidStaticProjectGuardianApproval,
  assertValidStaticProjectPublication,
  assertValidStaticProjectSnapshot,
  validateStaticProjectGuardianApproval,
  validateStaticProjectPublication,
  validateStaticProjectSnapshot,
  type StaticProjectGuardianApprovalV1,
  type StaticProjectPublicationV1,
  type StaticProjectSnapshotV1,
} from "../src/index.js";

const digest = `sha256:${"a".repeat(64)}`;
const secondDigest = `sha256:${"b".repeat(64)}`;

function snapshot(): StaticProjectSnapshotV1 {
  return {
    schemaVersion: "1",
    contractVersion: STATIC_PROJECT_PUBLISHING_CONTRACT_VERSION_V1,
    snapshotId: "snapshot_0123456789ABCDEFGHJKMNPQRS",
    subjectAccountId: "account_0123456789ABCDEFGHJKMNPQRS",
    moduleId: "junior-coder.adventure-mission-planner",
    moduleSlug: "adventure-mission-planner",
    moduleVersion: "1.0.0",
    missionId: "adventure-mission-planner-mission-1",
    sourceDigest: digest,
    snapshotDigest: secondDigest,
    sourceCharacterCount: 320,
    assessmentScore: 100,
    mandatorySafetyPassed: true,
    scan: {
      schemaVersion: "1",
      scannerVersion: STATIC_PROJECT_SCANNER_VERSION_V1,
      passed: true,
      checks: STATIC_PROJECT_SAFETY_CHECK_IDS_V1.map((id) => ({ id, passed: true })),
    },
    renderModel: {
      kind: "adventure-mission-planner",
      heading: "Moonbase Missions",
      missions: [{ title: "Find the moon crystal", day: "Saturday" }],
      validationMessage: "Mission ready!",
      savedAcrossRestart: true,
      accessibleSummaryEnabled: true,
    },
    state: "pending-review",
    createdAt: "2026-08-09T06:00:00.000Z",
  };
}

function approval(): StaticProjectGuardianApprovalV1 {
  return {
    schemaVersion: "1",
    approvalId: "approval_0123456789ABCDEFGHJKMNPQRS",
    snapshotId: snapshot().snapshotId,
    snapshotDigest: snapshot().snapshotDigest,
    guardianActorAccountId: "account_0123456789ABCDEFGHJKMNPQRS",
    statementVersion: STATIC_PROJECT_APPROVAL_STATEMENT_VERSION_V1,
    approvedAt: "2026-08-09T06:05:00.000Z",
  };
}

function publication(): StaticProjectPublicationV1 {
  return {
    schemaVersion: "1",
    publicationId: "publication_0123456789ABCDEFGHJKMNPQRS",
    snapshotId: snapshot().snapshotId,
    snapshotDigest: snapshot().snapshotDigest,
    approvalId: approval().approvalId,
    randomSlug: "0123456789ABCDEFGHJKMNPQRSTVWXYZ0123456789",
    publicUrl:
      "https://junior-projects.example.test/api/learning/v1/published/0123456789ABCDEFGHJKMNPQRSTVWXYZ0123456789",
    state: "published",
    publishedAt: "2026-08-09T06:05:00.000Z",
    expiresAt: "2026-11-07T06:05:00.000Z",
  };
}

describe("static project publishing contracts", () => {
  it("accepts a complete immutable snapshot, exact approval and unlisted publication", () => {
    expect(validateStaticProjectSnapshot(snapshot())).toEqual([]);
    expect(validateStaticProjectGuardianApproval(approval())).toEqual([]);
    expect(validateStaticProjectPublication(publication())).toEqual([]);
    expect(() => assertValidStaticProjectSnapshot(snapshot())).not.toThrow();
    expect(() => assertValidStaticProjectGuardianApproval(approval())).not.toThrow();
    expect(() => assertValidStaticProjectPublication(publication())).not.toThrow();
  });

  it("rejects incomplete assessment, missing safety evidence and mismatched render models", () => {
    const value = snapshot();
    value.assessmentScore = 79;
    value.mandatorySafetyPassed = false as true;
    value.scan.checks = value.scan.checks.slice(1);
    value.renderModel = {
      kind: "creature-care-dashboard",
      creature: "Moon Moth",
      status: "Ready to play",
      timerSeconds: 10,
      layout: "cosy-grid",
      reducedMotion: true,
    };

    expect(validateStaticProjectSnapshot(value)).toEqual(
      expect.arrayContaining([
        "assessment-score-incomplete",
        "mandatory-safety-missing",
        "scan-checks-incomplete",
        "module-render-model-mismatch",
      ]),
    );
    expect(() => assertValidStaticProjectSnapshot(value)).toThrow(/assessment-score-incomplete/u);
  });

  it("rejects unsafe scan evidence and render values outside the public allow-list", () => {
    const value = snapshot();
    value.scan.passed = false as true;
    value.scan.checks[0] = { ...value.scan.checks[0]!, passed: false as true };
    value.renderModel = {
      ...(value.renderModel as Extract<
        StaticProjectSnapshotV1["renderModel"],
        { kind: "adventure-mission-planner" }
      >),
      heading: "A real child's home address" as "Moonbase Missions",
    };

    expect(validateStaticProjectSnapshot(value)).toEqual(
      expect.arrayContaining(["scan-not-passed", "unsafe-render-model"]),
    );
  });

  it("requires approval to bind the exact immutable snapshot digest", () => {
    const value = approval();
    value.snapshotDigest = "not-a-digest";
    value.statementVersion = "old-statement" as typeof STATIC_PROJECT_APPROVAL_STATEMENT_VERSION_V1;

    expect(validateStaticProjectGuardianApproval(value)).toEqual(
      expect.arrayContaining(["invalid-snapshot-digest", "invalid-approval-statement"]),
    );
  });

  it("requires HTTPS, a random path binding, valid lifecycle dates and a non-indexed state", () => {
    const value = publication();
    value.publicUrl = "http://example.test/not-the-random-slug";
    value.expiresAt = "2026-08-08T06:05:00.000Z";
    value.state = "expired";

    expect(validateStaticProjectPublication(value)).toEqual(
      expect.arrayContaining([
        "invalid-public-url",
        "public-url-slug-mismatch",
        "invalid-publication-expiry",
        "published-state-required",
      ]),
    );
  });
});
