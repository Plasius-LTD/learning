/** Version-one module categories supported by the learning catalog. */
export type ModuleCategoryV1 = "game" | "robot" | "vibe" | "web-app";

/** Commercial states deliberately separate pilot grants from public checkout. */
export type CommercialStateV1 = "pilot-grant-only" | "fixed-price" | "retired";

/** The four deterministic assessment dimensions and their product meanings. */
export type AssessmentDimensionV1 =
  | "structure"
  | "behaviour"
  | "resilience"
  | "safety";

export type ScoreBandV1 =
  | "keep-exploring"
  | "nearly-there"
  | "mission-complete"
  | "mastered";

export type CourseMaterialAudienceV1 = "learner" | "facilitator";

export type CourseMaterialKindV1 =
  | "child-guide"
  | "mission-cards"
  | "starter-project"
  | "asset-pack"
  | "printable"
  | "facilitator-guide"
  | "answer-key"
  | "protected-tests"
  | "hardware-guide";

export type ModuleAgentRoleV1 =
  | "assessor"
  | "debugger"
  | "fix-guide"
  | "concept-explainer";

export type HardwareModeV1 = "none" | "optional" | "physical-first";

export type HardwareVerificationStatusV1 =
  | "not-applicable"
  | "pending-bench-test"
  | "verified";

/** A material record contains metadata only; storage and signed URLs are adapter concerns. */
export interface CourseMaterialV1 {
  id: string;
  kind: CourseMaterialKindV1;
  audience: CourseMaterialAudienceV1;
  title?: string;
}

/** Learner and facilitator materials are deliberately separated. */
export interface CourseMaterialsManifestV1 {
  version: string;
  learner: CourseMaterialV1[];
  facilitator: CourseMaterialV1[];
}

/** A physical item disclosed before a Guardian creates a purchase quote. */
export interface HardwareItemV1 {
  id: string;
  label: string;
  quantity: number;
  requirement: "required" | "optional";
  exactSpecification: string;
  adultOnly: boolean;
  stage: "core" | "servo" | "rover" | "sensor" | "camera";
}

/** Immutable hardware and preparation disclosure for a module version. */
export interface HardwareRequirementManifestV1 {
  requirementsVersion: string;
  mode: HardwareModeV1;
  hardwareIncluded: false;
  simulatorAvailable: boolean;
  verificationStatus: HardwareVerificationStatusV1;
  publicSaleBlocked: boolean;
  preparationMinutes: number;
  items: HardwareItemV1[];
  warnings: string[];
  supportedPlatforms: string[];
}

/** One short, observable learning goal inside a mission. */
export interface LearningGoalV1 {
  id: string;
  statement: string;
  evidence: "assessment" | "explanation" | "adult-signoff";
}

/** A 15–25 minute unit following learn, predict, build, assess and explain. */
export interface MissionV1 {
  id: string;
  title: string;
  estimatedMinutes: number;
  concepts: string[];
  goals: LearningGoalV1[];
  sideAdventure: string;
}

/** One objective source of points in an assessment rubric. */
export interface AssessmentCriterionV1 {
  id: string;
  label: string;
  dimension: AssessmentDimensionV1;
  points: number;
  mandatory: boolean;
  visibility: "visible" | "protected";
}

/** The immutable assessment authority for a module challenge. */
export interface AssessmentRubricV1 {
  version: string;
  completionScore: 80;
  criteria: AssessmentCriterionV1[];
}

export interface AssessmentCheckResultV1 {
  criterionId: string;
  passed: boolean;
  sourceLocation?: {
    fileId?: string;
    blockId?: string;
    startLine?: number;
    endLine?: number;
  };
}

export interface AssessmentResultV1 {
  score: number;
  band: ScoreBandV1;
  completed: boolean;
  passedCriterionIds: string[];
  failedCriterionIds: string[];
  failedMandatoryCriterionIds: string[];
}

/** A constrained module-agent role; score and reward authority are always false. */
export interface ModuleAgentDefinitionV1 {
  id: string;
  role: ModuleAgentRoleV1;
  evidenceBound: true;
  maySuggestSingleFix: boolean;
  mayAssignScore: false;
  mayAwardReward: false;
  mayPublish: false;
  mayControlHardware: false;
}

/** Structured feedback that a deterministic or AI-backed adapter may return. */
export interface ModuleAgentFeedbackV1 {
  role: ModuleAgentRoleV1;
  assessmentScore: number;
  passedGoalIds: string[];
  failedGoalIds: string[];
  explanation: string;
  expectedBehaviour: string;
  suggestedExperiment?: string;
  sourceLocation?: AssessmentCheckResultV1["sourceLocation"];
  scoreAuthority: "deterministic-assessment";
}

/** Ordinary Token subunits used as a pilot shadow or fixed price. */
export interface ModulePricingV1 {
  state: CommercialStateV1;
  tokenSubunits: string;
  includesMaterials: true;
  includesAssessmentRetries: true;
  includesAgents: true;
  includesHostingAllowance: boolean;
}

export interface BadgeDefinitionV1 {
  id: string;
  title: string;
  evidence: "mission-score" | "module-score" | "adult-physical-signoff";
  tradeable: false;
  tokenConvertible: false;
}

/** One immutable, independently sellable module version. */
export interface LearningModuleVersionV1 {
  id: string;
  slug: string;
  version: string;
  contentRevision: string;
  title: string;
  category: ModuleCategoryV1;
  summary: string;
  estimatedMinutes: number;
  tools: string[];
  concepts: string[];
  selfContained: true;
  prerequisiteModuleIds: string[];
  pricing: ModulePricingV1;
  materials: CourseMaterialsManifestV1;
  hardware: HardwareRequirementManifestV1;
  missions: MissionV1[];
  assessment: AssessmentRubricV1;
  agents: ModuleAgentDefinitionV1[];
  badges: BadgeDefinitionV1[];
}

/** A versioned path is a recommendation and never a paid prerequisite chain. */
export interface LearningPathVersionV1 {
  id: string;
  slug: string;
  version: string;
  title: string;
  description: string;
  catalogState: "pilot" | "public" | "retired";
  publicLaunchAtomic: true;
  featureFlag: string;
  modules: LearningModuleVersionV1[];
}

/** Entitlement records bind a subject to an immutable module version. */
export interface ModuleEntitlementV1 {
  entitlementId: string;
  subjectAccountId: string;
  moduleId: string;
  moduleVersion: string;
  source: "pilot-grant" | "module-allowance-purchase" | "support-grant";
  state: "pending" | "active" | "revoked";
  economyTransactionId?: string;
  grantedAt: string;
}

export interface AttemptEvidenceV1 {
  attemptId: string;
  moduleId: string;
  moduleVersion: string;
  assessment: AssessmentResultV1;
  sourceDigest: string;
  recordedAt: string;
  adultPhysicalSignoff?: {
    signedByActorAccountId: string;
    checklistVersion: string;
    signedAt: string;
  };
}

export interface GuardianAiConsentV1 {
  actorAccountId: string;
  subjectAccountId: string;
  policyVersion: string;
  state: "granted" | "withdrawn";
  recordedAt: string;
}

/** A static project snapshot is immutable and separately approved for publishing. */
export interface PublishedStaticProjectSnapshotV1 {
  snapshotId: string;
  subjectAccountId: string;
  moduleId: string;
  sourceDigest: string;
  randomSlug: string;
  guardianApprovalId: string;
  state: "pending-review" | "published" | "expired" | "unpublished";
  expiresAt: string;
}

export interface LearningValidationIssueV1 {
  code:
    | "duplicate-module-id"
    | "duplicate-module-slug"
    | "module-not-self-contained"
    | "paid-prerequisite"
    | "missing-materials"
    | "facilitator-material-leak"
    | "learner-material-leak"
    | "invalid-token-subunits"
    | "rubric-total"
    | "rubric-dimension-total"
    | "duplicate-criterion-id"
    | "missing-mandatory-safety"
    | "missing-hardware-items"
    | "invalid-agent-authority"
    | "missing-missions";
  message: string;
  moduleId?: string;
  path: string;
}
