/** Versioned, infrastructure-neutral contracts for Guardian-approved static projects. */
export const STATIC_PROJECT_PUBLISHING_CONTRACT_VERSION_V1 = "1.0.0" as const;
export const STATIC_PROJECT_SCANNER_VERSION_V1 = "junior-coder-static-scan-v1" as const;
export const STATIC_PROJECT_APPROVAL_STATEMENT_VERSION_V1 =
  "guardian-static-publication-v1" as const;
export const STATIC_PROJECT_DEFAULT_LIFETIME_DAYS_V1 = 90 as const;
export const STATIC_PROJECT_MAX_SOURCE_CHARACTERS_V1 = 8_000 as const;

export const STATIC_PROJECT_SAFETY_CHECK_IDS_V1 = [
  "allow-listed-source",
  "no-personal-details",
  "no-external-network",
  "no-executable-markup",
  "no-transmitting-forms",
  "no-uploads-or-embeds",
  "no-trackers-or-advertising",
  "no-account-identifiers",
] as const;

export type StaticProjectSafetyCheckIdV1 =
  (typeof STATIC_PROJECT_SAFETY_CHECK_IDS_V1)[number];

export type StaticProjectModuleSlugV1 =
  | "adventure-mission-planner"
  | "creature-care-dashboard"
  | "robot-mission-control";

export interface StaticProjectSafetyCheckV1 {
  id: StaticProjectSafetyCheckIdV1;
  passed: true;
}

/** Evidence emitted by the deterministic scanner before adult review. */
export interface StaticProjectSafetyScanV1 {
  schemaVersion: "1";
  scannerVersion: typeof STATIC_PROJECT_SCANNER_VERSION_V1;
  passed: true;
  checks: StaticProjectSafetyCheckV1[];
}

export interface AdventureMissionPlannerSafeRenderV1 {
  kind: "adventure-mission-planner";
  heading: "Moonbase Missions" | "Forest Rescue Plans" | "Ocean Quest Board";
  missions: {
    title: "Find the moon crystal" | "Guide the lost firefly" | "Map the coral garden";
    day: "Saturday" | "Sunday" | "School holiday";
  }[];
  validationMessage: "Choose a day" | "Add a mission title" | "Mission ready!";
  savedAcrossRestart: true;
  accessibleSummaryEnabled: true;
}

export interface CreatureCareDashboardSafeRenderV1 {
  kind: "creature-care-dashboard";
  creature: "Moon Moth" | "Cloud Cat" | "Pebble Dragon";
  status: "Resting" | "Ready to play" | "Snack time";
  timerSeconds: 5 | 10 | 15;
  layout: "single" | "cosy-grid" | "wide-grid";
  reducedMotion: true;
}

export interface RobotMissionControlSafeRenderV1 {
  kind: "robot-mission-control";
  command: "scan" | "hold-position" | "return-to-base";
  safetyConfirmed: true;
  telemetryRate: 1 | 2 | 4;
  chartMode: "line" | "bars" | "text-only";
  serialSimulation: true;
  state: "SCANNING" | "HOLDING" | "RETURNING";
}

/** The complete public render allow-list. Learner source is never a render model. */
export type StaticProjectSafeRenderV1 =
  | AdventureMissionPlannerSafeRenderV1
  | CreatureCareDashboardSafeRenderV1
  | RobotMissionControlSafeRenderV1;

/** Immutable private snapshot awaiting an adult's exact-hash approval. */
export interface StaticProjectSnapshotV1 {
  schemaVersion: "1";
  contractVersion: typeof STATIC_PROJECT_PUBLISHING_CONTRACT_VERSION_V1;
  snapshotId: string;
  subjectAccountId: string;
  moduleId: string;
  moduleSlug: StaticProjectModuleSlugV1;
  moduleVersion: string;
  missionId: string;
  sourceDigest: string;
  snapshotDigest: string;
  sourceCharacterCount: number;
  assessmentScore: number;
  mandatorySafetyPassed: true;
  scan: StaticProjectSafetyScanV1;
  renderModel: StaticProjectSafeRenderV1;
  state: "pending-review";
  createdAt: string;
}

/** Adult approval is evidence only and cannot mutate the reviewed snapshot. */
export interface StaticProjectGuardianApprovalV1 {
  schemaVersion: "1";
  approvalId: string;
  snapshotId: string;
  snapshotDigest: string;
  guardianActorAccountId: string;
  statementVersion: typeof STATIC_PROJECT_APPROVAL_STATEMENT_VERSION_V1;
  approvedAt: string;
}

/** An unlisted public pointer whose lifecycle never changes the source snapshot. */
export interface StaticProjectPublicationV1 {
  schemaVersion: "1";
  publicationId: string;
  snapshotId: string;
  snapshotDigest: string;
  approvalId: string;
  randomSlug: string;
  publicUrl: string;
  state: "published" | "expired" | "unpublished";
  publishedAt: string;
  expiresAt: string;
  renewedAt?: string;
  unpublishedAt?: string;
}

export type StaticProjectContractIssueV1 =
  | "invalid-schema-version"
  | "invalid-contract-version"
  | "invalid-identifier"
  | "invalid-module"
  | "invalid-version"
  | "invalid-source-digest"
  | "invalid-snapshot-digest"
  | "invalid-source-size"
  | "assessment-score-incomplete"
  | "mandatory-safety-missing"
  | "scan-not-passed"
  | "scan-checks-incomplete"
  | "module-render-model-mismatch"
  | "unsafe-render-model"
  | "invalid-created-at"
  | "invalid-approval-statement"
  | "invalid-approved-at"
  | "invalid-random-slug"
  | "invalid-public-url"
  | "public-url-slug-mismatch"
  | "published-state-required"
  | "invalid-published-at"
  | "invalid-publication-expiry"
  | "invalid-lifecycle-timestamp";

const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/u;
const IDENTIFIER_PATTERN = /^(?:account|approval|publication|snapshot)_[A-Za-z0-9_-]{20,128}$/u;
const VERSION_PATTERN = /^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][A-Za-z0-9.-]+)?$/u;
const RANDOM_SLUG_PATTERN = /^[A-Za-z0-9_-]{40,128}$/u;

function validDate(value: string): boolean {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function allSafetyChecksPresent(scan: StaticProjectSafetyScanV1): boolean {
  if (!Array.isArray(scan.checks) || scan.checks.length !== STATIC_PROJECT_SAFETY_CHECK_IDS_V1.length) {
    return false;
  }
  const supplied = new Set(scan.checks.map((check) => check.id));
  return STATIC_PROJECT_SAFETY_CHECK_IDS_V1.every((id) => supplied.has(id))
    && scan.checks.every((check) => check.passed === true);
}

function safeAdventureRender(value: AdventureMissionPlannerSafeRenderV1): boolean {
  const headings = ["Moonbase Missions", "Forest Rescue Plans", "Ocean Quest Board"];
  const titles = ["Find the moon crystal", "Guide the lost firefly", "Map the coral garden"];
  const days = ["Saturday", "Sunday", "School holiday"];
  const messages = ["Choose a day", "Add a mission title", "Mission ready!"];
  return headings.includes(value.heading)
    && Array.isArray(value.missions)
    && value.missions.length >= 1
    && value.missions.length <= 3
    && value.missions.every((mission) => titles.includes(mission.title) && days.includes(mission.day))
    && messages.includes(value.validationMessage)
    && value.savedAcrossRestart === true
    && value.accessibleSummaryEnabled === true;
}

function safeCreatureRender(value: CreatureCareDashboardSafeRenderV1): boolean {
  return ["Moon Moth", "Cloud Cat", "Pebble Dragon"].includes(value.creature)
    && ["Resting", "Ready to play", "Snack time"].includes(value.status)
    && [5, 10, 15].includes(value.timerSeconds)
    && ["single", "cosy-grid", "wide-grid"].includes(value.layout)
    && value.reducedMotion === true;
}

function safeRobotRender(value: RobotMissionControlSafeRenderV1): boolean {
  return ["scan", "hold-position", "return-to-base"].includes(value.command)
    && value.safetyConfirmed === true
    && [1, 2, 4].includes(value.telemetryRate)
    && ["line", "bars", "text-only"].includes(value.chartMode)
    && value.serialSimulation === true
    && ["SCANNING", "HOLDING", "RETURNING"].includes(value.state);
}

/** Validate a snapshot without throwing so authoring and adapters can show every issue. */
export function validateStaticProjectSnapshot(
  value: StaticProjectSnapshotV1,
): StaticProjectContractIssueV1[] {
  const issues: StaticProjectContractIssueV1[] = [];
  if (value.schemaVersion !== "1") issues.push("invalid-schema-version");
  if (value.contractVersion !== STATIC_PROJECT_PUBLISHING_CONTRACT_VERSION_V1) {
    issues.push("invalid-contract-version");
  }
  if (!IDENTIFIER_PATTERN.test(value.snapshotId) || !IDENTIFIER_PATTERN.test(value.subjectAccountId)) {
    issues.push("invalid-identifier");
  }
  if (!value.moduleId.startsWith("junior-coder.") || value.moduleId !== `junior-coder.${value.moduleSlug}`) {
    issues.push("invalid-module");
  }
  if (!VERSION_PATTERN.test(value.moduleVersion)) issues.push("invalid-version");
  if (!DIGEST_PATTERN.test(value.sourceDigest)) issues.push("invalid-source-digest");
  if (!DIGEST_PATTERN.test(value.snapshotDigest)) issues.push("invalid-snapshot-digest");
  if (!Number.isInteger(value.sourceCharacterCount)
    || value.sourceCharacterCount < 1
    || value.sourceCharacterCount > STATIC_PROJECT_MAX_SOURCE_CHARACTERS_V1) {
    issues.push("invalid-source-size");
  }
  if (!Number.isInteger(value.assessmentScore)
    || value.assessmentScore < 80
    || value.assessmentScore > 100) {
    issues.push("assessment-score-incomplete");
  }
  if (value.mandatorySafetyPassed !== true) issues.push("mandatory-safety-missing");
  if (value.scan?.passed !== true || value.scan?.scannerVersion !== STATIC_PROJECT_SCANNER_VERSION_V1) {
    issues.push("scan-not-passed");
  }
  if (!value.scan || !allSafetyChecksPresent(value.scan)) issues.push("scan-checks-incomplete");
  if (value.moduleSlug !== value.renderModel?.kind) issues.push("module-render-model-mismatch");
  const renderSafe = value.renderModel?.kind === "adventure-mission-planner"
    ? safeAdventureRender(value.renderModel)
    : value.renderModel?.kind === "creature-care-dashboard"
      ? safeCreatureRender(value.renderModel)
      : value.renderModel?.kind === "robot-mission-control"
        ? safeRobotRender(value.renderModel)
        : false;
  if (!renderSafe) issues.push("unsafe-render-model");
  if (value.state !== "pending-review" || !validDate(value.createdAt)) issues.push("invalid-created-at");
  return [...new Set(issues)];
}

/** Fail closed when a persistence or publishing adapter constructs an invalid snapshot. */
export function assertValidStaticProjectSnapshot(value: StaticProjectSnapshotV1): void {
  const issues = validateStaticProjectSnapshot(value);
  if (issues.length > 0) throw new Error(`Invalid static project snapshot: ${issues.join(", ")}`);
}

export function validateStaticProjectGuardianApproval(
  value: StaticProjectGuardianApprovalV1,
): StaticProjectContractIssueV1[] {
  const issues: StaticProjectContractIssueV1[] = [];
  if (value.schemaVersion !== "1") issues.push("invalid-schema-version");
  if (!IDENTIFIER_PATTERN.test(value.approvalId)
    || !IDENTIFIER_PATTERN.test(value.snapshotId)
    || !IDENTIFIER_PATTERN.test(value.guardianActorAccountId)) {
    issues.push("invalid-identifier");
  }
  if (!DIGEST_PATTERN.test(value.snapshotDigest)) issues.push("invalid-snapshot-digest");
  if (value.statementVersion !== STATIC_PROJECT_APPROVAL_STATEMENT_VERSION_V1) {
    issues.push("invalid-approval-statement");
  }
  if (!validDate(value.approvedAt)) issues.push("invalid-approved-at");
  return [...new Set(issues)];
}

export function assertValidStaticProjectGuardianApproval(
  value: StaticProjectGuardianApprovalV1,
): void {
  const issues = validateStaticProjectGuardianApproval(value);
  if (issues.length > 0) throw new Error(`Invalid static project approval: ${issues.join(", ")}`);
}

export function validateStaticProjectPublication(
  value: StaticProjectPublicationV1,
): StaticProjectContractIssueV1[] {
  const issues: StaticProjectContractIssueV1[] = [];
  if (value.schemaVersion !== "1") issues.push("invalid-schema-version");
  if (!IDENTIFIER_PATTERN.test(value.publicationId)
    || !IDENTIFIER_PATTERN.test(value.snapshotId)
    || !IDENTIFIER_PATTERN.test(value.approvalId)) {
    issues.push("invalid-identifier");
  }
  if (!DIGEST_PATTERN.test(value.snapshotDigest)) issues.push("invalid-snapshot-digest");
  if (!RANDOM_SLUG_PATTERN.test(value.randomSlug)) issues.push("invalid-random-slug");
  let parsedUrl: URL | undefined;
  try {
    parsedUrl = new URL(value.publicUrl);
  } catch {
    parsedUrl = undefined;
  }
  if (!parsedUrl || parsedUrl.protocol !== "https:" || parsedUrl.username || parsedUrl.password) {
    issues.push("invalid-public-url");
  }
  if (!parsedUrl?.pathname.endsWith(`/${value.randomSlug}`)) issues.push("public-url-slug-mismatch");
  if (value.state !== "published") issues.push("published-state-required");
  if (!validDate(value.publishedAt)) issues.push("invalid-published-at");
  if (!validDate(value.expiresAt)
    || (validDate(value.publishedAt) && Date.parse(value.expiresAt) <= Date.parse(value.publishedAt))) {
    issues.push("invalid-publication-expiry");
  }
  if ((value.renewedAt !== undefined && !validDate(value.renewedAt))
    || (value.unpublishedAt !== undefined && !validDate(value.unpublishedAt))) {
    issues.push("invalid-lifecycle-timestamp");
  }
  return [...new Set(issues)];
}

export function assertValidStaticProjectPublication(value: StaticProjectPublicationV1): void {
  const issues = validateStaticProjectPublication(value);
  if (issues.length > 0) throw new Error(`Invalid static project publication: ${issues.join(", ")}`);
}
