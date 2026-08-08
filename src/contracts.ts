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
export interface ModuleReferencePriceV1 {
  /** Reference copy only; this is never a cash balance or redemption promise. */
  currency: "GBP";
  /** Canonical GBP minor units. */
  minorUnits: string;
  basis: "nominal-reference";
  cashRedemptionAllowed: false;
}

export interface ModulePricingV1 {
  state: CommercialStateV1;
  tokenSubunits: string;
  referencePrice?: ModuleReferencePriceV1;
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
  source:
    | "pilot-grant"
    | "module-allowance-purchase"
    | "support-grant"
    | "admin-test-grant";
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

/** Canonical learner journey shared by interactive and printable adapters. */
export const MISSION_AUTHORING_CONTRACT_VERSION_V1 = "1.0.0" as const;

export type MissionStageKindV1 =
  | "learn"
  | "predict"
  | "build"
  | "run"
  | "assess"
  | "inspect"
  | "fix"
  | "explain"
  | "reward";

export type MissionArtifactKindV1 =
  | "starter-code"
  | "starter-assets"
  | "sample-data"
  | "printable"
  | "facilitator-note"
  | "answer-key"
  | "protected-test";

/** Metadata only: storage and authorized delivery remain adapter concerns. */
export interface MissionArtifactReferenceV1 {
  id: string;
  kind: MissionArtifactKindV1;
  audience: CourseMaterialAudienceV1;
  solutionBearing: boolean;
}

export interface MissionReadinessCheckV1 {
  id: string;
  prompt: string;
  scored: false;
}

export interface MissionStageCardV1 {
  kind: MissionStageKindV1;
  instruction: string;
  artifactIds: string[];
}

export interface MissionAuthoringGoalV1 {
  id: string;
  statement: string;
  visibility: "visible" | "protected";
  criterionIds: string[];
  completionRequired: boolean;
  aiRequired: boolean;
}

export type MissionInteractionModeV1 =
  | "keyboard"
  | "pointer"
  | "drag"
  | "audio"
  | "colour"
  | "motion"
  | "text"
  | "shape"
  | "symbol"
  | "reduced-motion";

export interface MissionInteractionRequirementV1 {
  id: string;
  description: string;
  primaryMode: MissionInteractionModeV1;
  alternativeIds: string[];
}

export interface MissionAccessibilityAlternativeV1 {
  id: string;
  modes: MissionInteractionModeV1[];
  equivalentOutcome: true;
  description: string;
}

export type MissionEvidenceKindV1 =
  | "assessment-result"
  | "learner-explanation"
  | "project-snapshot"
  | "adult-signoff";

export type MissionEvidenceRetentionV1 =
  | "attempt"
  | "entitlement"
  | "adult-signoff";

export interface MissionEvidenceRequirementV1 {
  id: string;
  goalIds: string[];
  kind: MissionEvidenceKindV1;
  retention: MissionEvidenceRetentionV1;
  containsPersonalData: false;
}

export interface MissionSideAdventureV1 {
  id: string;
  prompt: string;
  completionRequired: false;
}

export interface MissionRewardBindingV1 {
  id: string;
  badgeId: string;
  goalIds: string[];
  deterministic: true;
  random: false;
  tokenConvertible: false;
}

export interface MissionFunctionParameterV1 {
  name: string;
  type: string;
  description: string;
}

/** Learner-safe documentation for one bounded host or simulator function. */
export interface MissionFunctionReferenceV1 {
  id: string;
  signature: string;
  summary: string;
  parameters: MissionFunctionParameterV1[];
  effect: string;
  example: string;
}

/** The only mission projection safe to return to a learner. */
export interface LearnerMissionAuthoringV1 {
  estimatedMinutes: number;
  stages: MissionStageCardV1[];
  readinessChecks: MissionReadinessCheckV1[];
  artifacts: MissionArtifactReferenceV1[];
  goals: MissionAuthoringGoalV1[];
  interactions: MissionInteractionRequirementV1[];
  accessibilityAlternatives: MissionAccessibilityAlternativeV1[];
  evidenceRequirements: MissionEvidenceRequirementV1[];
  sideAdventures: MissionSideAdventureV1[];
  rewardBindings: MissionRewardBindingV1[];
  functionReference?: MissionFunctionReferenceV1[];
}

/** Protected authoring data must never be projected through learner APIs. */
export interface FacilitatorMissionAuthoringV1 {
  artifacts: MissionArtifactReferenceV1[];
  protectedGoals: MissionAuthoringGoalV1[];
  prompts: string[];
}

export type MissionHardwareAcquisitionScopeV1 =
  | "complete-path"
  | "incremental";

/** Per-item verification authority for a physical mission disclosure. */
export interface MissionHardwareComponentDisclosureV1 {
  itemId: string;
  quantity: number;
  acquisitionScope: MissionHardwareAcquisitionScopeV1;
  verificationStatus: HardwareVerificationStatusV1;
  compatibilityClaimed: boolean;
  physicalCompletionEligible: boolean;
}

/** Adult and simulator boundaries that consuming workspaces must preserve. */
export interface MissionPhysicalSafeguardsV1 {
  adultAssemblyRequired: true;
  adultAcknowledgementRequiredForExport: true;
  websiteMayControlHardware: false;
  simulatorCompletionAvailable: true;
  simulatedBadgeId: string;
  physicalBadgeId: string;
  physicalBadgeRequiresAdultSignoff: true;
  adultAssemblySteps: string[];
  powerRequirements: string[];
  cableRequirements: string[];
  softwarePrerequisites: string[];
  warnings: string[];
  unrelatedHardwareNotRequired: string[];
}

/**
 * Additive mission-level projection of one immutable catalog hardware manifest.
 * It distinguishes the complete reusable path kit from this module's additions.
 */
export interface MissionHardwareDisclosureV1 {
  requirementsVersion: string;
  hardwareIncluded: false;
  completePathItemIds: string[];
  incrementalItemIds: string[];
  components: MissionHardwareComponentDisclosureV1[];
  safeguards: MissionPhysicalSafeguardsV1;
}

/** Additive authoring detail keyed to one immutable catalog mission. */
export interface MissionAuthoringBundleV1 {
  version: string;
  moduleId: string;
  moduleVersion: string;
  missionId: string;
  learner: LearnerMissionAuthoringV1;
  facilitator: FacilitatorMissionAuthoringV1;
  hardware?: MissionHardwareDisclosureV1;
}

export interface MissionAuthoringValidationIssueV1 {
  code:
    | "bundle-version-mismatch"
    | "module-reference-mismatch"
    | "mission-reference-mismatch"
    | "invalid-duration"
    | "missing-stage"
    | "duplicate-stage"
    | "stage-order"
    | "missing-readiness-check"
    | "scored-readiness-check"
    | "missing-starter-artifact"
    | "learner-artifact-leak"
    | "facilitator-artifact-leak"
    | "unknown-artifact"
    | "duplicate-id"
    | "missing-visible-goal"
    | "missing-protected-goal"
    | "invalid-goal-projection"
    | "duplicate-goal-id"
    | "unknown-criterion"
    | "criterion-visibility-mismatch"
    | "rubric-total"
    | "rubric-dimension-total"
    | "duplicate-criterion-id"
    | "missing-mandatory-safety"
    | "missing-safety-evidence"
    | "ai-dependent-completion"
    | "inaccessible-interaction"
    | "unknown-accessibility-alternative"
    | "non-equivalent-accessibility-alternative"
    | "missing-evidence"
    | "unknown-evidence-goal"
    | "personal-data-evidence"
    | "missing-side-adventure"
    | "mandatory-side-adventure"
    | "invalid-reward"
    | "hardware-module-mismatch"
    | "hardware-requirements-version-mismatch"
    | "hardware-item-mismatch"
    | "hardware-verification-claim"
    | "unsafe-physical-export"
    | "invalid-hardware-reward"
    | "invalid-function-reference";
  message: string;
  path: string;
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
    | "invalid-reference-price"
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
