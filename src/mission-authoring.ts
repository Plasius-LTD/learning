import {
  MISSION_AUTHORING_CONTRACT_VERSION_V1,
  type LearningModuleVersionV1,
  type MissionArtifactKindV1,
  type MissionAuthoringBundleV1,
  type MissionAuthoringValidationIssueV1,
  type MissionInteractionModeV1,
  type MissionStageKindV1,
} from "./contracts.js";
import { validateAssessmentRubric } from "./rubric-validation.js";

export const JUNIOR_CODER_MISSION_STAGE_ORDER_V1 = [
  "learn",
  "predict",
  "build",
  "run",
  "assess",
  "inspect",
  "fix",
  "explain",
  "reward",
] as const satisfies readonly MissionStageKindV1[];

const LEARNER_STARTER_KINDS = new Set<MissionArtifactKindV1>([
  "starter-code",
  "starter-assets",
  "sample-data",
]);

const LEARNER_FORBIDDEN_KINDS = new Set<MissionArtifactKindV1>([
  "facilitator-note",
  "answer-key",
  "protected-test",
]);

const SINGLE_MODE_REQUIRES_ALTERNATIVE = new Set<MissionInteractionModeV1>([
  "pointer",
  "drag",
  "audio",
  "colour",
  "motion",
]);

function authoringIssue(
  code: MissionAuthoringValidationIssueV1["code"],
  message: string,
  path: string,
): MissionAuthoringValidationIssueV1 {
  return { code, message, path };
}

function reportDuplicateIds(
  ids: string[],
  path: string,
): MissionAuthoringValidationIssueV1[] {
  const seen = new Set<string>();
  const issues: MissionAuthoringValidationIssueV1[] = [];
  for (const id of ids) {
    if (seen.has(id)) {
      issues.push(
        authoringIssue("duplicate-id", `Duplicate authored ID ${id}.`, path),
      );
    }
    seen.add(id);
  }
  return issues;
}

/**
 * Validate learner/facilitator authoring against one immutable catalog module.
 * The complete issue set is returned so authoring tools can fix errors in one pass.
 */
export function validateMissionAuthoringBundle(
  bundle: MissionAuthoringBundleV1,
  module: LearningModuleVersionV1,
): MissionAuthoringValidationIssueV1[] {
  const issues: MissionAuthoringValidationIssueV1[] = [];

  if (bundle.version !== MISSION_AUTHORING_CONTRACT_VERSION_V1) {
    issues.push(
      authoringIssue(
        "bundle-version-mismatch",
        `Unsupported mission authoring version ${bundle.version}.`,
        "version",
      ),
    );
  }

  if (bundle.moduleId !== module.id || bundle.moduleVersion !== module.version) {
    issues.push(
      authoringIssue(
        "module-reference-mismatch",
        `Bundle ${bundle.moduleId}@${bundle.moduleVersion} does not match ${module.id}@${module.version}.`,
        "moduleId",
      ),
    );
  }

  if (!module.missions.some((mission) => mission.id === bundle.missionId)) {
    issues.push(
      authoringIssue(
        "mission-reference-mismatch",
        `Mission ${bundle.missionId} does not exist in module ${module.id}.`,
        "missionId",
      ),
    );
  }

  const learner = bundle.learner;
  const facilitator = bundle.facilitator;

  if (learner.estimatedMinutes < 15 || learner.estimatedMinutes > 25) {
    issues.push(
      authoringIssue(
        "invalid-duration",
        "A mission must last between 15 and 25 minutes.",
        "learner.estimatedMinutes",
      ),
    );
  }

  const stageKinds = learner.stages.map((stage) => stage.kind);
  for (const requiredStage of JUNIOR_CODER_MISSION_STAGE_ORDER_V1) {
    const count = stageKinds.filter((stage) => stage === requiredStage).length;
    if (count === 0) {
      issues.push(
        authoringIssue(
          "missing-stage",
          `Mission stage ${requiredStage} is required.`,
          "learner.stages",
        ),
      );
    } else if (count > 1) {
      issues.push(
        authoringIssue(
          "duplicate-stage",
          `Mission stage ${requiredStage} appears more than once.`,
          "learner.stages",
        ),
      );
    }
  }
  if (
    stageKinds.length === JUNIOR_CODER_MISSION_STAGE_ORDER_V1.length
    && stageKinds.some(
      (stage, index) => stage !== JUNIOR_CODER_MISSION_STAGE_ORDER_V1[index],
    )
  ) {
    issues.push(
      authoringIssue(
        "stage-order",
        "Mission stages must follow the canonical learner journey.",
        "learner.stages",
      ),
    );
  }

  if (learner.readinessChecks.length === 0) {
    issues.push(
      authoringIssue(
        "missing-readiness-check",
        "At least one unscored readiness check is required.",
        "learner.readinessChecks",
      ),
    );
  }
  if (learner.readinessChecks.some((check) => check.scored !== false)) {
    issues.push(
      authoringIssue(
        "scored-readiness-check",
        "Readiness checks must not affect the deterministic score.",
        "learner.readinessChecks",
      ),
    );
  }
  issues.push(
    ...reportDuplicateIds(
      learner.readinessChecks.map((check) => check.id),
      "learner.readinessChecks",
    ),
  );

  const learnerArtifactIds = new Set(learner.artifacts.map((artifact) => artifact.id));
  if (!learner.artifacts.some((artifact) => LEARNER_STARTER_KINDS.has(artifact.kind))) {
    issues.push(
      authoringIssue(
        "missing-starter-artifact",
        "At least one learner-safe starter artifact is required.",
        "learner.artifacts",
      ),
    );
  }
  if (
    learner.artifacts.some(
      (artifact) =>
        artifact.audience !== "learner"
        || artifact.solutionBearing
        || LEARNER_FORBIDDEN_KINDS.has(artifact.kind),
    )
  ) {
    issues.push(
      authoringIssue(
        "learner-artifact-leak",
        "Learner artifacts cannot contain facilitator or solution-bearing content.",
        "learner.artifacts",
      ),
    );
  }
  if (facilitator.artifacts.some((artifact) => artifact.audience !== "facilitator")) {
    issues.push(
      authoringIssue(
        "facilitator-artifact-leak",
        "Facilitator artifacts must remain in the facilitator projection.",
        "facilitator.artifacts",
      ),
    );
  }
  issues.push(
    ...reportDuplicateIds(
      [...learner.artifacts, ...facilitator.artifacts].map((artifact) => artifact.id),
      "artifacts",
    ),
  );
  for (const [stageIndex, stage] of learner.stages.entries()) {
    for (const artifactId of stage.artifactIds) {
      if (!learnerArtifactIds.has(artifactId)) {
        issues.push(
          authoringIssue(
            "unknown-artifact",
            `Stage references unknown learner artifact ${artifactId}.`,
            `learner.stages[${stageIndex}].artifactIds`,
          ),
        );
      }
    }
  }

  if (learner.goals.length === 0) {
    issues.push(
      authoringIssue(
        "missing-visible-goal",
        "At least one visible learner goal is required.",
        "learner.goals",
      ),
    );
  }
  if (facilitator.protectedGoals.length === 0) {
    issues.push(
      authoringIssue(
        "missing-protected-goal",
        "At least one protected facilitator goal is required.",
        "facilitator.protectedGoals",
      ),
    );
  }

  const allGoals = [...learner.goals, ...facilitator.protectedGoals];
  const learnerGoalIds = new Set(learner.goals.map((goal) => goal.id));
  const seenGoalIds = new Set<string>();
  for (const goal of allGoals) {
    if (seenGoalIds.has(goal.id)) {
      issues.push(
        authoringIssue(
          "duplicate-goal-id",
          `Duplicate goal ID ${goal.id}.`,
          "goals",
        ),
      );
    }
    seenGoalIds.add(goal.id);
  }
  if (
    learner.goals.some((goal) => goal.visibility !== "visible")
    || facilitator.protectedGoals.some(
      (goal) => goal.visibility !== "protected" || goal.completionRequired,
    )
  ) {
    issues.push(
      authoringIssue(
        "invalid-goal-projection",
        "Visible goals belong to learners and protected goals to facilitators.",
        "goals",
      ),
    );
  }

  const criterionById = new Map(
    module.assessment.criteria.map((criterion) => [criterion.id, criterion]),
  );
  for (const goal of allGoals) {
    if (goal.criterionIds.length === 0) {
      issues.push(
        authoringIssue(
          "unknown-criterion",
          `Goal ${goal.id} must reference a deterministic criterion.`,
          "goals",
        ),
      );
    }
    for (const criterionId of goal.criterionIds) {
      const criterion = criterionById.get(criterionId);
      if (!criterion) {
        issues.push(
          authoringIssue(
            "unknown-criterion",
            `Goal ${goal.id} references unknown criterion ${criterionId}.`,
            "goals",
          ),
        );
      } else if (criterion.visibility !== goal.visibility) {
        issues.push(
          authoringIssue(
            "criterion-visibility-mismatch",
            `Goal ${goal.id} cannot expose a ${criterion.visibility} criterion as ${goal.visibility}.`,
            "goals",
          ),
        );
      }
    }
    if (goal.completionRequired && goal.aiRequired) {
      issues.push(
        authoringIssue(
          "ai-dependent-completion",
          `Completion goal ${goal.id} cannot require AI.`,
          "goals",
        ),
      );
    }
  }

  for (const rubricIssue of validateAssessmentRubric(module.assessment)) {
    if (
      rubricIssue.code === "rubric-total"
      || rubricIssue.code === "rubric-dimension-total"
      || rubricIssue.code === "duplicate-criterion-id"
      || rubricIssue.code === "missing-mandatory-safety"
    ) {
      issues.push(
        authoringIssue(rubricIssue.code, rubricIssue.message, rubricIssue.path),
      );
    }
  }

  const alternativeById = new Map(
    learner.accessibilityAlternatives.map((alternative) => [alternative.id, alternative]),
  );
  issues.push(
    ...reportDuplicateIds(
      learner.interactions.map((interaction) => interaction.id),
      "learner.interactions",
    ),
    ...reportDuplicateIds(
      learner.accessibilityAlternatives.map((alternative) => alternative.id),
      "learner.accessibilityAlternatives",
    ),
  );
  for (const [interactionIndex, interaction] of learner.interactions.entries()) {
    if (
      SINGLE_MODE_REQUIRES_ALTERNATIVE.has(interaction.primaryMode)
      && interaction.alternativeIds.length === 0
    ) {
      issues.push(
        authoringIssue(
          "inaccessible-interaction",
          `Interaction ${interaction.id} requires an equivalent alternative.`,
          `learner.interactions[${interactionIndex}]`,
        ),
      );
    }
    for (const alternativeId of interaction.alternativeIds) {
      const alternative = alternativeById.get(alternativeId);
      if (!alternative) {
        issues.push(
          authoringIssue(
            "unknown-accessibility-alternative",
            `Interaction ${interaction.id} references unknown alternative ${alternativeId}.`,
            `learner.interactions[${interactionIndex}].alternativeIds`,
          ),
        );
      } else if (
        alternative.equivalentOutcome !== true
        || alternative.modes.length === 0
        || alternative.modes.every((mode) => mode === interaction.primaryMode)
      ) {
        issues.push(
          authoringIssue(
            "non-equivalent-accessibility-alternative",
            `Alternative ${alternativeId} must provide an equivalent outcome through another mode.`,
            "learner.accessibilityAlternatives",
          ),
        );
      }
    }
  }

  if (learner.evidenceRequirements.length === 0) {
    issues.push(
      authoringIssue(
        "missing-evidence",
        "At least one evidence requirement is required.",
        "learner.evidenceRequirements",
      ),
    );
  }
  issues.push(
    ...reportDuplicateIds(
      learner.evidenceRequirements.map((evidence) => evidence.id),
      "learner.evidenceRequirements",
    ),
  );
  for (const [evidenceIndex, evidence] of learner.evidenceRequirements.entries()) {
    if (evidence.containsPersonalData !== false) {
      issues.push(
        authoringIssue(
          "personal-data-evidence",
          "Mission evidence cannot request personal data.",
          `learner.evidenceRequirements[${evidenceIndex}]`,
        ),
      );
    }
    for (const goalId of evidence.goalIds) {
      if (!learnerGoalIds.has(goalId)) {
        issues.push(
          authoringIssue(
            "unknown-evidence-goal",
            `Evidence references unknown goal ${goalId}.`,
            `learner.evidenceRequirements[${evidenceIndex}].goalIds`,
          ),
        );
      }
    }
  }
  for (const goal of learner.goals.filter((entry) => entry.completionRequired)) {
    if (
      !learner.evidenceRequirements.some((evidence) => evidence.goalIds.includes(goal.id))
    ) {
      issues.push(
        authoringIssue(
          "missing-evidence",
          `Completion goal ${goal.id} requires deterministic evidence.`,
          "learner.evidenceRequirements",
        ),
      );
    }
  }

  const mandatorySafetyGoals = learner.goals.filter(
    (goal) =>
      goal.completionRequired
      && goal.criterionIds.some((criterionId) => {
        const criterion = criterionById.get(criterionId);
        return criterion?.dimension === "safety" && criterion.mandatory;
      }),
  );
  if (
    mandatorySafetyGoals.length === 0
    || !mandatorySafetyGoals.some((goal) =>
      learner.evidenceRequirements.some((evidence) => evidence.goalIds.includes(goal.id)),
    )
  ) {
    issues.push(
      authoringIssue(
        "missing-safety-evidence",
        "A completion-required goal must evidence a mandatory safety criterion.",
        "learner.evidenceRequirements",
      ),
    );
  }

  issues.push(
    ...reportDuplicateIds(
      learner.sideAdventures.map((adventure) => adventure.id),
      "learner.sideAdventures",
    ),
  );
  if (learner.sideAdventures.length === 0) {
    issues.push(
      authoringIssue(
        "missing-side-adventure",
        "At least one optional side adventure is required.",
        "learner.sideAdventures",
      ),
    );
  }
  if (learner.sideAdventures.some((adventure) => adventure.completionRequired !== false)) {
    issues.push(
      authoringIssue(
        "mandatory-side-adventure",
        "Side adventures must remain optional.",
        "learner.sideAdventures",
      ),
    );
  }

  const badgeIds = new Set(module.badges.map((badge) => badge.id));
  issues.push(
    ...reportDuplicateIds(
      learner.rewardBindings.map((reward) => reward.id),
      "learner.rewardBindings",
    ),
  );
  for (const [rewardIndex, reward] of learner.rewardBindings.entries()) {
    const rewardInvalid =
      reward.deterministic !== true
      || reward.random !== false
      || reward.tokenConvertible !== false
      || reward.goalIds.length === 0
      || !badgeIds.has(reward.badgeId)
      || reward.goalIds.some((goalId) => !learnerGoalIds.has(goalId));
    if (rewardInvalid) {
      issues.push(
        authoringIssue(
          "invalid-reward",
          `Reward ${reward.id} must be deterministic, evidence-bound and non-convertible.`,
          `learner.rewardBindings[${rewardIndex}]`,
        ),
      );
    }
  }

  if (learner.functionReference) {
    const functionIds = new Set(
      learner.functionReference.map((entry) => entry.id),
    );
    const invalidFunctionReference =
      functionIds.size !== learner.functionReference.length
      || learner.functionReference.length === 0
      || learner.functionReference.some((entry) => {
        const parameterNames = new Set(
          entry.parameters.map((parameter) => parameter.name),
        );
        return entry.id.trim().length === 0
          || entry.signature.trim().length === 0
          || entry.summary.trim().length === 0
          || entry.effect.trim().length === 0
          || entry.example.trim().length === 0
          || parameterNames.size !== entry.parameters.length
          || entry.parameters.some(
            (parameter) =>
              parameter.name.trim().length === 0
              || parameter.type.trim().length === 0
              || parameter.description.trim().length === 0,
          );
      });
    if (invalidFunctionReference) {
      issues.push(
        authoringIssue(
          "invalid-function-reference",
          "Function references require unique IDs, signatures, parameters, effects and examples.",
          "learner.functionReference",
        ),
      );
    }
  }

  if (learner.boundedSuggestion) {
    const suggestion = learner.boundedSuggestion;
    const invalidBoundedSuggestion =
      suggestion.id.trim().length === 0
      || suggestion.source !== "authored-fallback"
      || suggestion.intent.trim().length === 0
      || suggestion.constraints.length === 0
      || suggestion.constraints.some((constraint) => constraint.trim().length === 0)
      || !learnerArtifactIds.has(suggestion.permittedArtifactId)
      || suggestion.originalSnippet.trim().length === 0
      || suggestion.replacementSnippet.trim().length === 0
      || suggestion.originalSnippet === suggestion.replacementSnippet
      || suggestion.explanationPrompt.trim().length === 0
      || suggestion.aiOptional !== false
      || suggestion.learnerApprovalRequired !== true
      || suggestion.alternatives.length !== 2
      || suggestion.alternatives[0] !== "accept"
      || suggestion.alternatives[1] !== "reject";
    if (invalidBoundedSuggestion) {
      issues.push(
        authoringIssue(
          "invalid-bounded-suggestion",
          "A bounded suggestion requires one learner artifact, authored constraints, a visible diff and explicit accept/reject approval.",
          "learner.boundedSuggestion",
        ),
      );
    }
  }

  const hardware = bundle.hardware;
  if (hardware) {
    if (
      module.category !== "robot"
      || module.hardware.mode !== "physical-first"
      || !module.hardware.simulatorAvailable
    ) {
      issues.push(
        authoringIssue(
          "hardware-module-mismatch",
          "Mission hardware disclosure requires a simulator-backed physical robot module.",
          "hardware",
        ),
      );
    }

    if (hardware.requirementsVersion !== module.hardware.requirementsVersion) {
      issues.push(
        authoringIssue(
          "hardware-requirements-version-mismatch",
          `Hardware disclosure ${hardware.requirementsVersion} does not match catalog requirements ${module.hardware.requirementsVersion}.`,
          "hardware.requirementsVersion",
        ),
      );
    }

    const catalogHardwareById = new Map(
      module.hardware.items.map((item) => [item.id, item]),
    );
    const completePathIds = new Set(hardware.completePathItemIds);
    const incrementalIds = new Set(hardware.incrementalItemIds);
    const componentIds = new Set(hardware.components.map((component) => component.itemId));
    const catalogIds = new Set(catalogHardwareById.keys());
    const hasDuplicateHardwareIds =
      completePathIds.size !== hardware.completePathItemIds.length
      || incrementalIds.size !== hardware.incrementalItemIds.length
      || componentIds.size !== hardware.components.length;
    const hasUnknownOrMissingItems =
      hasDuplicateHardwareIds
      || completePathIds.size !== catalogIds.size
      || componentIds.size !== catalogIds.size
      || [...catalogIds].some(
        (itemId) => !completePathIds.has(itemId) || !componentIds.has(itemId),
      )
      || [...incrementalIds].some((itemId) => !catalogIds.has(itemId));
    const hasMismatchedComponent = hardware.components.some((component) => {
      const catalogItem = catalogHardwareById.get(component.itemId);
      const expectedScope = incrementalIds.has(component.itemId)
        ? "incremental"
        : "complete-path";
      return !catalogItem
        || component.quantity !== catalogItem.quantity
        || component.acquisitionScope !== expectedScope;
    });
    if (hasUnknownOrMissingItems || hasMismatchedComponent) {
      issues.push(
        authoringIssue(
          "hardware-item-mismatch",
          "Complete, incremental and per-component hardware disclosures must match the immutable catalog manifest.",
          "hardware.components",
        ),
      );
    }

    if (
      hardware.components.some(
        (component) =>
          component.verificationStatus !== "verified"
          && component.compatibilityClaimed,
      )
      || (
        module.hardware.verificationStatus !== "verified"
        && !module.hardware.publicSaleBlocked
      )
    ) {
      issues.push(
        authoringIssue(
          "hardware-verification-claim",
          "Unverified hardware cannot claim compatibility or unblock public physical sale.",
          "hardware.components",
        ),
      );
    }

    const safeguards = hardware.safeguards;
    if (
      safeguards.adultAssemblyRequired !== true
      || safeguards.adultAcknowledgementRequiredForExport !== true
      || safeguards.websiteMayControlHardware !== false
      || safeguards.simulatorCompletionAvailable !== true
      || safeguards.physicalBadgeRequiresAdultSignoff !== true
      || safeguards.adultAssemblySteps.length === 0
      || safeguards.powerRequirements.length === 0
      || safeguards.cableRequirements.length === 0
      || safeguards.softwarePrerequisites.length === 0
      || safeguards.warnings.length === 0
      || hardware.components.some(
        (component) =>
          component.physicalCompletionEligible
          && (
            component.verificationStatus !== "verified"
            || module.hardware.verificationStatus !== "verified"
          ),
      )
    ) {
      issues.push(
        authoringIssue(
          "unsafe-physical-export",
          "Physical export and completion require adult acknowledgement, verified hardware and a website that never controls hardware.",
          "hardware.safeguards",
        ),
      );
    }

    const simulatedBadge = module.badges.find(
      (badge) => badge.id === safeguards.simulatedBadgeId,
    );
    const physicalBadge = module.badges.find(
      (badge) => badge.id === safeguards.physicalBadgeId,
    );
    if (
      simulatedBadge?.evidence === "adult-physical-signoff"
      || physicalBadge?.evidence !== "adult-physical-signoff"
    ) {
      issues.push(
        authoringIssue(
          "invalid-hardware-reward",
          "Simulated and physical badges must be distinct, and only the physical badge may require adult sign-off.",
          "hardware.safeguards",
        ),
      );
    }
  }

  return issues;
}

/** Fail fast for CI and immutable authoring registration. */
export function assertValidMissionAuthoringBundle(
  bundle: MissionAuthoringBundleV1,
  module: LearningModuleVersionV1,
): void {
  const issues = validateMissionAuthoringBundle(bundle, module);
  if (issues.length === 0) return;

  const summary = issues
    .map((entry) => `${entry.code} at ${entry.path}: ${entry.message}`)
    .join("\n");
  throw new Error(`Invalid mission authoring bundle:\n${summary}`);
}

/**
 * Original visual-programming mission for Robot Maze Dash. Learner content
 * contains no protected route, answer key or hidden assessment expectation.
 */
export const ROBOT_MAZE_DASH_MISSION_ONE_AUTHORING_V1: MissionAuthoringBundleV1 = {
  version: MISSION_AUTHORING_CONTRACT_VERSION_V1,
  moduleId: "junior-coder.robot-maze-dash",
  moduleVersion: "1.1.0",
  missionId: "robot-maze-dash-mission-1",
  learner: {
    estimatedMinutes: 20,
    stages: [
      {
        kind: "learn",
        instruction: "Meet the move, turn-left and turn-right action blocks and read what each command does.",
        artifactIds: ["robot-maze-dash-m1-art"],
      },
      {
        kind: "predict",
        instruction: "Predict where the robot will stop after it follows the blocks from top to bottom.",
        artifactIds: [],
      },
      {
        kind: "build",
        instruction: "Arrange the action blocks so the rescue robot can reach the beacon.",
        artifactIds: ["robot-maze-dash-m1-program"],
      },
      {
        kind: "run",
        instruction: "Use the Run action button to watch the robot follow your visual program.",
        artifactIds: ["robot-maze-dash-m1-program"],
      },
      {
        kind: "assess",
        instruction: "Run the visible and protected deterministic mission checks.",
        artifactIds: [],
      },
      {
        kind: "inspect",
        instruction: "Compare the highlighted block with the first goal that did not pass.",
        artifactIds: [],
      },
      {
        kind: "fix",
        instruction: "Move, add or remove one action block, then run the mission again.",
        artifactIds: ["robot-maze-dash-m1-program"],
      },
      {
        kind: "explain",
        instruction: "Explain how the order of your blocks changed the robot path.",
        artifactIds: [],
      },
      {
        kind: "reward",
        instruction: "Collect the evidence-bound badge when the score and safety check pass.",
        artifactIds: [],
      },
    ],
    readinessChecks: [
      {
        id: "robot-maze-dash-m1-read-order",
        prompt: "Point to the first action the robot will follow.",
        scored: false,
      },
    ],
    artifacts: [
      {
        id: "robot-maze-dash-m1-program",
        kind: "starter-code",
        audience: "learner",
        solutionBearing: false,
      },
      {
        id: "robot-maze-dash-m1-art",
        kind: "starter-assets",
        audience: "learner",
        solutionBearing: false,
      },
      {
        id: "robot-maze-dash-m1-printable",
        kind: "printable",
        audience: "learner",
        solutionBearing: false,
      },
    ],
    goals: [
      {
        id: "robot-maze-dash-m1-starts",
        statement: "The visual program is structurally valid and starts.",
        visibility: "visible",
        criterionIds: ["robot-maze-dash-build"],
        completionRequired: true,
        aiRequired: false,
      },
      {
        id: "robot-maze-dash-m1-reaches-beacon",
        statement: "The robot follows the action order and reaches the rescue beacon.",
        visibility: "visible",
        criterionIds: [
          "robot-maze-dash-goal-one",
          "robot-maze-dash-goal-two",
        ],
        completionRequired: true,
        aiRequired: false,
      },
      {
        id: "robot-maze-dash-m1-safe-preview",
        statement: "The robot stays inside the private maze simulator boundary.",
        visibility: "visible",
        criterionIds: ["robot-maze-dash-safety"],
        completionRequired: true,
        aiRequired: false,
      },
    ],
    interactions: [
      {
        id: "robot-maze-dash-m1-reorder-blocks",
        description: "Change the order of visual action blocks.",
        primaryMode: "drag",
        alternativeIds: ["robot-maze-dash-m1-button-reorder"],
      },
      {
        id: "robot-maze-dash-m1-run-control",
        description: "Start the private maze simulation.",
        primaryMode: "pointer",
        alternativeIds: ["robot-maze-dash-m1-keyboard-run"],
      },
    ],
    accessibilityAlternatives: [
      {
        id: "robot-maze-dash-m1-button-reorder",
        modes: ["keyboard", "pointer"],
        equivalentOutcome: true,
        description: "Use labelled Move up and Move down buttons instead of dragging a block.",
      },
      {
        id: "robot-maze-dash-m1-keyboard-run",
        modes: ["keyboard"],
        equivalentOutcome: true,
        description: "Start the same simulation by pressing Enter or Space on the Run button.",
      },
    ],
    evidenceRequirements: [
      {
        id: "robot-maze-dash-m1-assessment",
        goalIds: [
          "robot-maze-dash-m1-starts",
          "robot-maze-dash-m1-reaches-beacon",
          "robot-maze-dash-m1-safe-preview",
        ],
        kind: "assessment-result",
        retention: "entitlement",
        containsPersonalData: false,
      },
      {
        id: "robot-maze-dash-m1-explanation",
        goalIds: ["robot-maze-dash-m1-reaches-beacon"],
        kind: "learner-explanation",
        retention: "attempt",
        containsPersonalData: false,
      },
    ],
    sideAdventures: [
      {
        id: "robot-maze-dash-m1-remix",
        prompt: "Invent a different safe route and describe which action block must change first.",
        completionRequired: false,
      },
    ],
    rewardBindings: [
      {
        id: "robot-maze-dash-m1-badge",
        badgeId: "robot-maze-dash-mission-complete",
        goalIds: [
          "robot-maze-dash-m1-starts",
          "robot-maze-dash-m1-reaches-beacon",
          "robot-maze-dash-m1-safe-preview",
        ],
        deterministic: true,
        random: false,
        tokenConvertible: false,
      },
    ],
  },
  facilitator: {
    artifacts: [
      {
        id: "robot-maze-dash-m1-answer-key",
        kind: "answer-key",
        audience: "facilitator",
        solutionBearing: true,
      },
      {
        id: "robot-maze-dash-m1-protected-tests",
        kind: "protected-test",
        audience: "facilitator",
        solutionBearing: true,
      },
    ],
    protectedGoals: [
      {
        id: "robot-maze-dash-m1-protected-bounds",
        statement: "The interpreter stops safely at walls, bounds and its action limit.",
        visibility: "protected",
        criterionIds: [
          "robot-maze-dash-edge-one",
          "robot-maze-dash-edge-two",
        ],
        completionRequired: false,
        aiRequired: false,
      },
    ],
    prompts: [
      "Ask the learner to point to the first action block before suggesting a change.",
      "Use the command reference and visible goal; never reveal the protected route or expected block list.",
    ],
  },
};

/**
 * Original first mission for Skywing Sprint. Learner content documents the
 * flight controls without exposing protected numeric targets or source answers.
 */
export const SKYWING_SPRINT_MISSION_ONE_AUTHORING_V1: MissionAuthoringBundleV1 = {
  version: MISSION_AUTHORING_CONTRACT_VERSION_V1,
  moduleId: "junior-coder.skywing-sprint",
  moduleVersion: "1.1.0",
  missionId: "skywing-sprint-mission-1",
  learner: {
    estimatedMinutes: 20,
    stages: [
      {
        kind: "learn",
        instruction: "Read how lift, gravity and gate-gap functions change Skywing's flight.",
        artifactIds: ["skywing-sprint-m1-art"],
      },
      {
        kind: "predict",
        instruction: "Predict whether Skywing will rise or fall after one lift pulse.",
        artifactIds: [],
      },
      {
        kind: "build",
        instruction: "Adjust the three documented settings in the starter JavaScript.",
        artifactIds: ["skywing-sprint-m1-code"],
      },
      {
        kind: "run",
        instruction: "Use the Run action button to start the private flight preview.",
        artifactIds: ["skywing-sprint-m1-code"],
      },
      {
        kind: "assess",
        instruction: "Run the visible and protected deterministic flight checks.",
        artifactIds: [],
      },
      {
        kind: "inspect",
        instruction: "Compare the highlighted setting with the first goal that did not pass.",
        artifactIds: [],
      },
      {
        kind: "fix",
        instruction: "Change one setting, run again and observe the flight telemetry.",
        artifactIds: ["skywing-sprint-m1-code"],
      },
      {
        kind: "explain",
        instruction: "Explain how lift and gravity changed Skywing's vertical speed.",
        artifactIds: [],
      },
      {
        kind: "reward",
        instruction: "Collect the evidence-bound badge when the score and safety check pass.",
        artifactIds: [],
      },
    ],
    readinessChecks: [
      {
        id: "skywing-sprint-m1-predict-velocity",
        prompt: "Point to the setting that changes Skywing's upward push.",
        scored: false,
      },
    ],
    artifacts: [
      {
        id: "skywing-sprint-m1-code",
        kind: "starter-code",
        audience: "learner",
        solutionBearing: false,
      },
      {
        id: "skywing-sprint-m1-art",
        kind: "starter-assets",
        audience: "learner",
        solutionBearing: false,
      },
      {
        id: "skywing-sprint-m1-printable",
        kind: "printable",
        audience: "learner",
        solutionBearing: false,
      },
    ],
    goals: [
      {
        id: "skywing-sprint-m1-starts",
        statement: "The JavaScript settings are valid and the private preview starts.",
        visibility: "visible",
        criterionIds: ["skywing-sprint-build"],
        completionRequired: true,
        aiRequired: false,
      },
      {
        id: "skywing-sprint-m1-safe-flight",
        statement: "Lift and gravity create a controllable flight through the rescue gate.",
        visibility: "visible",
        criterionIds: [
          "skywing-sprint-goal-one",
          "skywing-sprint-goal-two",
        ],
        completionRequired: true,
        aiRequired: false,
      },
      {
        id: "skywing-sprint-m1-private-runtime",
        statement: "The game stays inside the private educational preview boundary.",
        visibility: "visible",
        criterionIds: ["skywing-sprint-safety"],
        completionRequired: true,
        aiRequired: false,
      },
    ],
    interactions: [
      {
        id: "skywing-sprint-m1-run-control",
        description: "Start the private flight simulation.",
        primaryMode: "pointer",
        alternativeIds: ["skywing-sprint-m1-keyboard-run"],
      },
      {
        id: "skywing-sprint-m1-flight-control",
        description: "Send a lift pulse while the preview is running.",
        primaryMode: "keyboard",
        alternativeIds: [],
      },
      {
        id: "skywing-sprint-m1-flight-motion",
        description: "Observe Skywing moving through the animated gate preview.",
        primaryMode: "motion",
        alternativeIds: ["skywing-sprint-m1-reduced-motion"],
      },
    ],
    accessibilityAlternatives: [
      {
        id: "skywing-sprint-m1-keyboard-run",
        modes: ["keyboard"],
        equivalentOutcome: true,
        description: "Press Enter or Space on the play-icon Run button to start the same preview.",
      },
      {
        id: "skywing-sprint-m1-reduced-motion",
        modes: ["text"],
        equivalentOutcome: true,
        description: "Use the position, velocity and gate-status text instead of animation.",
      },
    ],
    evidenceRequirements: [
      {
        id: "skywing-sprint-m1-assessment",
        goalIds: [
          "skywing-sprint-m1-starts",
          "skywing-sprint-m1-safe-flight",
          "skywing-sprint-m1-private-runtime",
        ],
        kind: "assessment-result",
        retention: "entitlement",
        containsPersonalData: false,
      },
      {
        id: "skywing-sprint-m1-explanation",
        goalIds: ["skywing-sprint-m1-safe-flight"],
        kind: "learner-explanation",
        retention: "attempt",
        containsPersonalData: false,
      },
    ],
    sideAdventures: [
      {
        id: "skywing-sprint-m1-remix",
        prompt: "Invent a new gate name and choose one setting to make the flight gentler.",
        completionRequired: false,
      },
    ],
    rewardBindings: [
      {
        id: "skywing-sprint-m1-badge",
        badgeId: "skywing-sprint-mission-complete",
        goalIds: [
          "skywing-sprint-m1-starts",
          "skywing-sprint-m1-safe-flight",
          "skywing-sprint-m1-private-runtime",
        ],
        deterministic: true,
        random: false,
        tokenConvertible: false,
      },
    ],
  },
  facilitator: {
    artifacts: [
      {
        id: "skywing-sprint-m1-answer-key",
        kind: "answer-key",
        audience: "facilitator",
        solutionBearing: true,
      },
      {
        id: "skywing-sprint-m1-protected-tests",
        kind: "protected-test",
        audience: "facilitator",
        solutionBearing: true,
      },
    ],
    protectedGoals: [
      {
        id: "skywing-sprint-m1-protected-resilience",
        statement: "The runtime clamps unsafe values and terminates bounded simulations.",
        visibility: "protected",
        criterionIds: [
          "skywing-sprint-edge-one",
          "skywing-sprint-edge-two",
        ],
        completionRequired: false,
        aiRequired: false,
      },
    ],
    prompts: [
      "Ask the learner which direction a positive velocity moves Skywing before suggesting a setting change.",
      "Use the visible telemetry and function reference; never reveal protected numeric targets or expected source fragments.",
    ],
  },
};

/**
 * Original first mission for Paddle Pulse. Learners tune documented paddle
 * and ball controls without receiving protected collision targets or answers.
 */
export const PADDLE_PULSE_MISSION_ONE_AUTHORING_V1: MissionAuthoringBundleV1 = {
  version: MISSION_AUTHORING_CONTRACT_VERSION_V1,
  moduleId: "junior-coder.paddle-pulse",
  moduleVersion: "1.1.0",
  missionId: "paddle-pulse-mission-1",
  learner: {
    estimatedMinutes: 20,
    stages: [
      {
        kind: "learn",
        instruction: "Read how paddle width, ball speed and bounce angle change an energy-ball rally.",
        artifactIds: ["paddle-pulse-m1-art"],
      },
      {
        kind: "predict",
        instruction: "Predict which direction the energy ball will travel after it reaches the paddle.",
        artifactIds: [],
      },
      {
        kind: "build",
        instruction: "Adjust the three documented settings in the starter JavaScript.",
        artifactIds: ["paddle-pulse-m1-code"],
      },
      {
        kind: "run",
        instruction: "Use the Run action button to start the private energy-court preview.",
        artifactIds: ["paddle-pulse-m1-code"],
      },
      {
        kind: "assess",
        instruction: "Run the visible and protected deterministic rally checks.",
        artifactIds: [],
      },
      {
        kind: "inspect",
        instruction: "Compare the highlighted setting with the first goal that did not pass.",
        artifactIds: [],
      },
      {
        kind: "fix",
        instruction: "Change one setting, run again and observe the bounce telemetry.",
        artifactIds: ["paddle-pulse-m1-code"],
      },
      {
        kind: "explain",
        instruction: "Explain how paddle width and bounce angle changed the energy ball path.",
        artifactIds: [],
      },
      {
        kind: "reward",
        instruction: "Collect the evidence-bound badge when the score and safety check pass.",
        artifactIds: [],
      },
    ],
    readinessChecks: [
      {
        id: "paddle-pulse-m1-find-angle",
        prompt: "Point to the setting that changes the direction of the bounce.",
        scored: false,
      },
    ],
    artifacts: [
      {
        id: "paddle-pulse-m1-code",
        kind: "starter-code",
        audience: "learner",
        solutionBearing: false,
      },
      {
        id: "paddle-pulse-m1-art",
        kind: "starter-assets",
        audience: "learner",
        solutionBearing: false,
      },
      {
        id: "paddle-pulse-m1-printable",
        kind: "printable",
        audience: "learner",
        solutionBearing: false,
      },
    ],
    goals: [
      {
        id: "paddle-pulse-m1-starts",
        statement: "The JavaScript settings are valid and the private preview starts.",
        visibility: "visible",
        criterionIds: ["paddle-pulse-build"],
        completionRequired: true,
        aiRequired: false,
      },
      {
        id: "paddle-pulse-m1-controlled-bounce",
        statement: "The paddle returns the energy ball toward the target wall with a controllable angle.",
        visibility: "visible",
        criterionIds: [
          "paddle-pulse-goal-one",
          "paddle-pulse-goal-two",
        ],
        completionRequired: true,
        aiRequired: false,
      },
      {
        id: "paddle-pulse-m1-private-runtime",
        statement: "The game stays inside the private educational preview boundary.",
        visibility: "visible",
        criterionIds: ["paddle-pulse-safety"],
        completionRequired: true,
        aiRequired: false,
      },
    ],
    interactions: [
      {
        id: "paddle-pulse-m1-run-control",
        description: "Start the private energy-court simulation.",
        primaryMode: "pointer",
        alternativeIds: ["paddle-pulse-m1-keyboard-run"],
      },
      {
        id: "paddle-pulse-m1-paddle-control",
        description: "Move the paddle left or right during practice.",
        primaryMode: "keyboard",
        alternativeIds: [],
      },
      {
        id: "paddle-pulse-m1-ball-motion",
        description: "Observe the energy ball moving and bouncing across the court.",
        primaryMode: "motion",
        alternativeIds: ["paddle-pulse-m1-telemetry"],
      },
    ],
    accessibilityAlternatives: [
      {
        id: "paddle-pulse-m1-keyboard-run",
        modes: ["keyboard"],
        equivalentOutcome: true,
        description: "Press Enter or Space on the play-icon Run button to start the same preview.",
      },
      {
        id: "paddle-pulse-m1-telemetry",
        modes: ["text", "reduced-motion"],
        equivalentOutcome: true,
        description: "Use position, direction and target-status text instead of ball animation.",
      },
    ],
    evidenceRequirements: [
      {
        id: "paddle-pulse-m1-assessment",
        goalIds: [
          "paddle-pulse-m1-starts",
          "paddle-pulse-m1-controlled-bounce",
          "paddle-pulse-m1-private-runtime",
        ],
        kind: "assessment-result",
        retention: "entitlement",
        containsPersonalData: false,
      },
      {
        id: "paddle-pulse-m1-explanation",
        goalIds: ["paddle-pulse-m1-controlled-bounce"],
        kind: "learner-explanation",
        retention: "attempt",
        containsPersonalData: false,
      },
    ],
    sideAdventures: [
      {
        id: "paddle-pulse-m1-remix",
        prompt: "Invent an original energy power-up and describe one bounded setting it would change.",
        completionRequired: false,
      },
    ],
    rewardBindings: [
      {
        id: "paddle-pulse-m1-badge",
        badgeId: "paddle-pulse-mission-complete",
        goalIds: [
          "paddle-pulse-m1-starts",
          "paddle-pulse-m1-controlled-bounce",
          "paddle-pulse-m1-private-runtime",
        ],
        deterministic: true,
        random: false,
        tokenConvertible: false,
      },
    ],
  },
  facilitator: {
    artifacts: [
      {
        id: "paddle-pulse-m1-answer-key",
        kind: "answer-key",
        audience: "facilitator",
        solutionBearing: true,
      },
      {
        id: "paddle-pulse-m1-protected-tests",
        kind: "protected-test",
        audience: "facilitator",
        solutionBearing: true,
      },
    ],
    protectedGoals: [
      {
        id: "paddle-pulse-m1-protected-resilience",
        statement: "The runtime clamps unsafe settings and terminates bounded collision simulations.",
        visibility: "protected",
        criterionIds: [
          "paddle-pulse-edge-one",
          "paddle-pulse-edge-two",
        ],
        completionRequired: false,
        aiRequired: false,
      },
    ],
    prompts: [
      "Ask the learner which setting changes direction before suggesting a code edit.",
      "Use visible telemetry and the function reference; never reveal protected numeric targets or expected source fragments.",
    ],
  },
};

/**
 * Original first mission for Pixel Trail Challenge. Learners use documented,
 * bounded Python host functions without receiving protected coordinates,
 * expected source fragments or list/collision edge answers.
 */
export const PIXEL_TRAIL_CHALLENGE_MISSION_ONE_AUTHORING_V1: MissionAuthoringBundleV1 = {
  version: MISSION_AUTHORING_CONTRACT_VERSION_V1,
  moduleId: "junior-coder.pixel-trail-challenge",
  moduleVersion: "1.1.0",
  missionId: "pixel-trail-challenge-mission-1",
  learner: {
    estimatedMinutes: 20,
    stages: [
      {
        kind: "learn",
        instruction: "Read what set_direction(), set_trail_limit() and place_energy_orb() do in the private Python preview.",
        artifactIds: ["pixel-trail-challenge-m1-art"],
      },
      {
        kind: "predict",
        instruction: "Predict the next grid square and how the trail list will change after one move.",
        artifactIds: [],
      },
      {
        kind: "build",
        instruction: "Adjust the three documented Python calls so the pixel follows a safe trail toward the energy orb.",
        artifactIds: ["pixel-trail-challenge-m1-code"],
      },
      {
        kind: "run",
        instruction: "Use the Run action button to start the private grid preview.",
        artifactIds: ["pixel-trail-challenge-m1-code"],
      },
      {
        kind: "assess",
        instruction: "Run the visible and protected deterministic trail checks.",
        artifactIds: [],
      },
      {
        kind: "inspect",
        instruction: "Compare the highlighted Python line with the first goal that did not pass.",
        artifactIds: [],
      },
      {
        kind: "fix",
        instruction: "Change one direction, trail or orb setting, run again and inspect the position and list-length telemetry.",
        artifactIds: ["pixel-trail-challenge-m1-code"],
      },
      {
        kind: "explain",
        instruction: "Explain how the direction changed the position and why the trail list kept only recent squares.",
        artifactIds: [],
      },
      {
        kind: "reward",
        instruction: "Collect the evidence-bound badge when the score and private-runtime safety check pass.",
        artifactIds: [],
      },
    ],
    readinessChecks: [
      {
        id: "pixel-trail-challenge-m1-find-direction",
        prompt: "Point to the Python call that chooses the pixel's next direction.",
        scored: false,
      },
    ],
    artifacts: [
      {
        id: "pixel-trail-challenge-m1-code",
        kind: "starter-code",
        audience: "learner",
        solutionBearing: false,
      },
      {
        id: "pixel-trail-challenge-m1-art",
        kind: "starter-assets",
        audience: "learner",
        solutionBearing: false,
      },
      {
        id: "pixel-trail-challenge-m1-printable",
        kind: "printable",
        audience: "learner",
        solutionBearing: false,
      },
    ],
    goals: [
      {
        id: "pixel-trail-challenge-m1-starts",
        statement: "The Python settings are valid and the private grid preview starts.",
        visibility: "visible",
        criterionIds: ["pixel-trail-challenge-build"],
        completionRequired: true,
        aiRequired: false,
      },
      {
        id: "pixel-trail-challenge-m1-safe-trail",
        statement: "The pixel moves in the chosen direction, keeps a bounded trail list and reaches the energy orb.",
        visibility: "visible",
        criterionIds: [
          "pixel-trail-challenge-goal-one",
          "pixel-trail-challenge-goal-two",
        ],
        completionRequired: true,
        aiRequired: false,
      },
      {
        id: "pixel-trail-challenge-m1-private-runtime",
        statement: "The program stays inside the private Python worker and host-provided grid API.",
        visibility: "visible",
        criterionIds: ["pixel-trail-challenge-safety"],
        completionRequired: true,
        aiRequired: false,
      },
    ],
    interactions: [
      {
        id: "pixel-trail-challenge-m1-run-control",
        description: "Start the private Python grid simulation.",
        primaryMode: "pointer",
        alternativeIds: ["pixel-trail-challenge-m1-keyboard-run"],
      },
      {
        id: "pixel-trail-challenge-m1-direction-control",
        description: "Change the active movement direction with labelled arrow controls or arrow keys.",
        primaryMode: "keyboard",
        alternativeIds: [],
      },
      {
        id: "pixel-trail-challenge-m1-trail-motion",
        description: "Observe the pixel, recent trail squares and energy orb on the grid.",
        primaryMode: "motion",
        alternativeIds: ["pixel-trail-challenge-m1-telemetry"],
      },
    ],
    accessibilityAlternatives: [
      {
        id: "pixel-trail-challenge-m1-keyboard-run",
        modes: ["keyboard"],
        equivalentOutcome: true,
        description: "Press Enter or Space on the play-icon Run button to start the same preview.",
      },
      {
        id: "pixel-trail-challenge-m1-telemetry",
        modes: ["text", "shape", "reduced-motion"],
        equivalentOutcome: true,
        description: "Read row, column, direction, trail length and orb status without animation or colour dependence.",
      },
    ],
    evidenceRequirements: [
      {
        id: "pixel-trail-challenge-m1-assessment",
        goalIds: [
          "pixel-trail-challenge-m1-starts",
          "pixel-trail-challenge-m1-safe-trail",
          "pixel-trail-challenge-m1-private-runtime",
        ],
        kind: "assessment-result",
        retention: "entitlement",
        containsPersonalData: false,
      },
      {
        id: "pixel-trail-challenge-m1-explanation",
        goalIds: ["pixel-trail-challenge-m1-safe-trail"],
        kind: "learner-explanation",
        retention: "attempt",
        containsPersonalData: false,
      },
    ],
    sideAdventures: [
      {
        id: "pixel-trail-challenge-m1-remix",
        prompt: "Invent an original energy-orb symbol and describe a new safe grid rule for collecting it.",
        completionRequired: false,
      },
    ],
    rewardBindings: [
      {
        id: "pixel-trail-challenge-m1-badge",
        badgeId: "pixel-trail-challenge-mission-complete",
        goalIds: [
          "pixel-trail-challenge-m1-starts",
          "pixel-trail-challenge-m1-safe-trail",
          "pixel-trail-challenge-m1-private-runtime",
        ],
        deterministic: true,
        random: false,
        tokenConvertible: false,
      },
    ],
  },
  facilitator: {
    artifacts: [
      {
        id: "pixel-trail-challenge-m1-answer-key",
        kind: "answer-key",
        audience: "facilitator",
        solutionBearing: true,
      },
      {
        id: "pixel-trail-challenge-m1-protected-tests",
        kind: "protected-test",
        audience: "facilitator",
        solutionBearing: true,
      },
    ],
    protectedGoals: [
      {
        id: "pixel-trail-challenge-m1-protected-resilience",
        statement: "The worker rejects invalid directions, clamps trail capacity and terminates bounded grid simulations before list or collision abuse.",
        visibility: "protected",
        criterionIds: [
          "pixel-trail-challenge-edge-one",
          "pixel-trail-challenge-edge-two",
        ],
        completionRequired: false,
        aiRequired: false,
      },
    ],
    prompts: [
      "Ask the learner to predict the next row and column before suggesting a Python edit.",
      "Use the function reference and visible telemetry; never reveal protected coordinates, numeric targets or expected source fragments.",
    ],
  },
};

/**
 * Original first mission for Star Defender Squadron. Learners launch bounded
 * JavaScript entities, patterns, health and rescue projectiles while protected
 * pass targets and runtime edge cases remain facilitator-only.
 */
export const STAR_DEFENDER_SQUADRON_MISSION_ONE_AUTHORING_V1: MissionAuthoringBundleV1 = {
  version: MISSION_AUTHORING_CONTRACT_VERSION_V1,
  moduleId: "junior-coder.star-defender-squadron",
  moduleVersion: "1.1.0",
  missionId: "star-defender-squadron-mission-1",
  learner: {
    estimatedMinutes: 20,
    stages: [
      {
        kind: "learn",
        instruction: "Read what createSquadron(), setRescueWave(), setShieldHealth() and launchRescueBeam() do in the private JavaScript preview.",
        artifactIds: ["star-defender-squadron-m1-art"],
      },
      {
        kind: "predict",
        instruction: "Predict where the squadron and rescue beam will travel, and which health value will change after the wave.",
        artifactIds: [],
      },
      {
        kind: "build",
        instruction: "Adjust the four documented JavaScript calls so the original squadron launches a safe rescue wave.",
        artifactIds: ["star-defender-squadron-m1-code"],
      },
      {
        kind: "run",
        instruction: "Use the Run action button to start the private Star Defender preview.",
        artifactIds: ["star-defender-squadron-m1-code"],
      },
      {
        kind: "assess",
        instruction: "Run the visible and protected deterministic squadron checks.",
        artifactIds: [],
      },
      {
        kind: "inspect",
        instruction: "Compare the highlighted JavaScript line with the first mission goal that did not pass.",
        artifactIds: [],
      },
      {
        kind: "fix",
        instruction: "Change one squadron, wave, shield or beam setting, then rerun and inspect the entity and health telemetry.",
        artifactIds: ["star-defender-squadron-m1-code"],
      },
      {
        kind: "explain",
        instruction: "Explain how the wave pattern moved the entities and how shields protected the rescue mission.",
        artifactIds: [],
      },
      {
        kind: "reward",
        instruction: "Collect the evidence-bound badge when the score and private-runtime safety check pass.",
        artifactIds: [],
      },
    ],
    readinessChecks: [
      {
        id: "star-defender-squadron-m1-find-wave",
        prompt: "Point to the JavaScript call that chooses the rescue-wave pattern.",
        scored: false,
      },
    ],
    artifacts: [
      {
        id: "star-defender-squadron-m1-code",
        kind: "starter-code",
        audience: "learner",
        solutionBearing: false,
      },
      {
        id: "star-defender-squadron-m1-art",
        kind: "starter-assets",
        audience: "learner",
        solutionBearing: false,
      },
      {
        id: "star-defender-squadron-m1-printable",
        kind: "printable",
        audience: "learner",
        solutionBearing: false,
      },
    ],
    goals: [
      {
        id: "star-defender-squadron-m1-starts",
        statement: "The JavaScript settings are valid and the private squadron preview starts.",
        visibility: "visible",
        criterionIds: ["star-defender-squadron-build"],
        completionRequired: true,
        aiRequired: false,
      },
      {
        id: "star-defender-squadron-m1-rescue-wave",
        statement: "The original squadron follows the chosen pattern, keeps safe shield health and launches a rescue beam.",
        visibility: "visible",
        criterionIds: [
          "star-defender-squadron-goal-one",
          "star-defender-squadron-goal-two",
        ],
        completionRequired: true,
        aiRequired: false,
      },
      {
        id: "star-defender-squadron-m1-private-runtime",
        statement: "The program stays inside the private JavaScript worker and host-provided space-rescue API.",
        visibility: "visible",
        criterionIds: ["star-defender-squadron-safety"],
        completionRequired: true,
        aiRequired: false,
      },
    ],
    interactions: [
      {
        id: "star-defender-squadron-m1-run-control",
        description: "Start the private JavaScript squadron simulation.",
        primaryMode: "pointer",
        alternativeIds: ["star-defender-squadron-m1-keyboard-run"],
      },
      {
        id: "star-defender-squadron-m1-code-control",
        description: "Edit the documented squadron, wave, shield and beam calls.",
        primaryMode: "keyboard",
        alternativeIds: [],
      },
      {
        id: "star-defender-squadron-m1-wave-motion",
        description: "Observe squadron entities, wave paths, shields and the rescue beam.",
        primaryMode: "motion",
        alternativeIds: ["star-defender-squadron-m1-telemetry"],
      },
    ],
    accessibilityAlternatives: [
      {
        id: "star-defender-squadron-m1-keyboard-run",
        modes: ["keyboard"],
        equivalentOutcome: true,
        description: "Press Enter or Space on the play-icon Run button to start the same preview.",
      },
      {
        id: "star-defender-squadron-m1-telemetry",
        modes: ["text", "shape", "reduced-motion"],
        equivalentOutcome: true,
        description: "Read entity count, pattern, shield health, beam state and rescue result without animation or colour dependence.",
      },
    ],
    evidenceRequirements: [
      {
        id: "star-defender-squadron-m1-assessment",
        goalIds: [
          "star-defender-squadron-m1-starts",
          "star-defender-squadron-m1-rescue-wave",
          "star-defender-squadron-m1-private-runtime",
        ],
        kind: "assessment-result",
        retention: "entitlement",
        containsPersonalData: false,
      },
      {
        id: "star-defender-squadron-m1-explanation",
        goalIds: ["star-defender-squadron-m1-rescue-wave"],
        kind: "learner-explanation",
        retention: "attempt",
        containsPersonalData: false,
      },
    ],
    sideAdventures: [
      {
        id: "star-defender-squadron-m1-remix",
        prompt: "Invent an original rescue-squadron emblem and describe a new safe wave pattern for a later level.",
        completionRequired: false,
      },
    ],
    rewardBindings: [
      {
        id: "star-defender-squadron-m1-badge",
        badgeId: "star-defender-squadron-mission-complete",
        goalIds: [
          "star-defender-squadron-m1-starts",
          "star-defender-squadron-m1-rescue-wave",
          "star-defender-squadron-m1-private-runtime",
        ],
        deterministic: true,
        random: false,
        tokenConvertible: false,
      },
    ],
  },
  facilitator: {
    artifacts: [
      {
        id: "star-defender-squadron-m1-answer-key",
        kind: "answer-key",
        audience: "facilitator",
        solutionBearing: true,
      },
      {
        id: "star-defender-squadron-m1-protected-tests",
        kind: "protected-test",
        audience: "facilitator",
        solutionBearing: true,
      },
    ],
    protectedGoals: [
      {
        id: "star-defender-squadron-m1-protected-resilience",
        statement: "The worker rejects invalid entity, pattern, health and projectile settings and terminates bounded wave simulations.",
        visibility: "protected",
        criterionIds: [
          "star-defender-squadron-edge-one",
          "star-defender-squadron-edge-two",
        ],
        completionRequired: false,
        aiRequired: false,
      },
    ],
    prompts: [
      "Ask the learner to predict the squadron path and shield change before suggesting a JavaScript edit.",
      "Use the function reference and visible telemetry; never reveal protected numeric targets, pattern answers or expected source fragments.",
    ],
  },
};

/**
 * First Beacon Bot robotics mission. The learner completes a bounded simulator
 * route; every physical item remains unverified, public-sale blocked and
 * ineligible for physical completion until an adult bench-test authority says
 * otherwise.
 */
export const BEACON_BOT_MISSION_ONE_AUTHORING_V1: MissionAuthoringBundleV1 = {
  version: MISSION_AUTHORING_CONTRACT_VERSION_V1,
  moduleId: "junior-coder.beacon-bot",
  moduleVersion: "1.1.0",
  missionId: "beacon-bot-mission-1",
  learner: {
    estimatedMinutes: 20,
    stages: [
      {
        kind: "learn",
        instruction: "Read what setVisibleSignal(), waitMs(), repeatSignal() and readIrReceiver() do in the private Beacon Bot simulator.",
        artifactIds: ["beacon-bot-m1-art"],
      },
      {
        kind: "predict",
        instruction: "Predict the visible signal order, elapsed time and simulated IR reading before the sequence runs.",
        artifactIds: [],
      },
      {
        kind: "build",
        instruction: "Adjust the four documented C++-style calls to create one bounded rescue signal.",
        artifactIds: ["beacon-bot-m1-code"],
      },
      {
        kind: "run",
        instruction: "Use the Run action button to start the private Beacon Bot simulator.",
        artifactIds: ["beacon-bot-m1-code"],
      },
      {
        kind: "assess",
        instruction: "Run the visible and protected deterministic beacon checks.",
        artifactIds: [],
      },
      {
        kind: "inspect",
        instruction: "Compare the highlighted C++-style line with the first signal goal that did not pass.",
        artifactIds: [],
      },
      {
        kind: "fix",
        instruction: "Change one signal, wait, repeat or simulated IR setting, then rerun and inspect the text telemetry.",
        artifactIds: ["beacon-bot-m1-code"],
      },
      {
        kind: "explain",
        instruction: "Explain how the function calls created a timed signal and how the simulated receiver changed the result.",
        artifactIds: [],
      },
      {
        kind: "reward",
        instruction: "Collect the simulated badge when the score and private-runtime safety check pass; physical completion remains adult-only.",
        artifactIds: [],
      },
    ],
    readinessChecks: [
      {
        id: "beacon-bot-m1-find-wait",
        prompt: "Point to the documented call that controls how long a visible signal stays on.",
        scored: false,
      },
    ],
    artifacts: [
      {
        id: "beacon-bot-m1-code",
        kind: "starter-code",
        audience: "learner",
        solutionBearing: false,
      },
      {
        id: "beacon-bot-m1-art",
        kind: "starter-assets",
        audience: "learner",
        solutionBearing: false,
      },
      {
        id: "beacon-bot-m1-printable",
        kind: "printable",
        audience: "learner",
        solutionBearing: false,
      },
    ],
    goals: [
      {
        id: "beacon-bot-m1-starts",
        statement: "The documented C++-style settings are valid and the private simulator starts.",
        visibility: "visible",
        criterionIds: ["beacon-bot-build"],
        completionRequired: true,
        aiRequired: false,
      },
      {
        id: "beacon-bot-m1-signal-sequence",
        statement: "The beacon produces a bounded timed pattern and reports one simulated IR receiver state.",
        visibility: "visible",
        criterionIds: ["beacon-bot-goal-one", "beacon-bot-goal-two"],
        completionRequired: true,
        aiRequired: false,
      },
      {
        id: "beacon-bot-m1-private-runtime",
        statement: "The program stays inside the private simulator and never accesses physical hardware, the network or browser storage.",
        visibility: "visible",
        criterionIds: ["beacon-bot-safety"],
        completionRequired: true,
        aiRequired: false,
      },
    ],
    interactions: [
      {
        id: "beacon-bot-m1-run-control",
        description: "Start the private Beacon Bot signal simulation.",
        primaryMode: "pointer",
        alternativeIds: ["beacon-bot-m1-keyboard-run"],
      },
      {
        id: "beacon-bot-m1-code-control",
        description: "Edit the documented signal, timing, repeat and receiver calls.",
        primaryMode: "keyboard",
        alternativeIds: [],
      },
      {
        id: "beacon-bot-m1-signal-colour",
        description: "Observe the visible rescue signal without relying on colour alone.",
        primaryMode: "colour",
        alternativeIds: ["beacon-bot-m1-signal-telemetry"],
      },
      {
        id: "beacon-bot-m1-signal-motion",
        description: "Observe the bounded signal sequence and receiver state changes.",
        primaryMode: "motion",
        alternativeIds: ["beacon-bot-m1-signal-telemetry"],
      },
    ],
    accessibilityAlternatives: [
      {
        id: "beacon-bot-m1-keyboard-run",
        modes: ["keyboard"],
        equivalentOutcome: true,
        description: "Press Enter or Space on the play-icon Run button to start the same simulator.",
      },
      {
        id: "beacon-bot-m1-signal-telemetry",
        modes: ["text", "shape", "symbol", "reduced-motion"],
        equivalentOutcome: true,
        description: "Read the signal name, step count, elapsed milliseconds and receiver state without colour or animation.",
      },
    ],
    evidenceRequirements: [
      {
        id: "beacon-bot-m1-assessment",
        goalIds: [
          "beacon-bot-m1-starts",
          "beacon-bot-m1-signal-sequence",
          "beacon-bot-m1-private-runtime",
        ],
        kind: "assessment-result",
        retention: "entitlement",
        containsPersonalData: false,
      },
      {
        id: "beacon-bot-m1-explanation",
        goalIds: ["beacon-bot-m1-signal-sequence"],
        kind: "learner-explanation",
        retention: "attempt",
        containsPersonalData: false,
      },
    ],
    sideAdventures: [
      {
        id: "beacon-bot-m1-remix",
        prompt: "Invent an original rescue-signal name and describe a text or shape cue that makes it understandable without colour.",
        completionRequired: false,
      },
    ],
    rewardBindings: [
      {
        id: "beacon-bot-m1-simulated-badge",
        badgeId: "beacon-bot-mission-complete",
        goalIds: [
          "beacon-bot-m1-starts",
          "beacon-bot-m1-signal-sequence",
          "beacon-bot-m1-private-runtime",
        ],
        deterministic: true,
        random: false,
        tokenConvertible: false,
      },
    ],
    functionReference: [
      {
        id: "beacon-bot-function-visible-signal",
        signature: "setVisibleSignal(colour)",
        summary: "Chooses the named visible signal used by the next bounded step.",
        parameters: [
          {
            name: "colour",
            type: "string",
            description: "Use red, amber or green.",
          },
        ],
        effect: "Updates the simulator's labelled light and equivalent shape cue without accessing a physical LED.",
        example: "setVisibleSignal(\"green\");",
      },
      {
        id: "beacon-bot-function-wait",
        signature: "waitMs(duration)",
        summary: "Adds one safe wait to the simulated signal timeline.",
        parameters: [
          {
            name: "duration",
            type: "whole number",
            description: "A bounded number of milliseconds from 100 to 1000.",
          },
        ],
        effect: "Advances simulated elapsed time; it never blocks the website or controls hardware.",
        example: "waitMs(250);",
      },
      {
        id: "beacon-bot-function-repeat",
        signature: "repeatSignal(count)",
        summary: "Repeats the current visible signal a safe number of times.",
        parameters: [
          {
            name: "count",
            type: "whole number",
            description: "A bounded repeat count from 1 to 4.",
          },
        ],
        effect: "Adds a fixed number of labelled signal steps to the private simulator timeline.",
        example: "repeatSignal(3);",
      },
      {
        id: "beacon-bot-function-ir-receiver",
        signature: "readIrReceiver()",
        summary: "Reads the simulator's fictional infrared receiver state.",
        parameters: [],
        effect: "Returns detected or clear from simulator state only; it cannot access a real sensor.",
        example: "const receiverState = readIrReceiver();",
      },
    ],
  },
  facilitator: {
    artifacts: [
      {
        id: "beacon-bot-m1-answer-key",
        kind: "answer-key",
        audience: "facilitator",
        solutionBearing: true,
      },
      {
        id: "beacon-bot-m1-protected-tests",
        kind: "protected-test",
        audience: "facilitator",
        solutionBearing: true,
      },
      {
        id: "beacon-bot-m1-adult-hardware-guide",
        kind: "facilitator-note",
        audience: "facilitator",
        solutionBearing: true,
      },
    ],
    protectedGoals: [
      {
        id: "beacon-bot-m1-protected-resilience",
        statement: "The simulator rejects unsupported signals, excessive waits or repeats and any hardware, network or storage request.",
        visibility: "protected",
        criterionIds: ["beacon-bot-edge-one", "beacon-bot-edge-two"],
        completionRequired: false,
        aiRequired: false,
      },
    ],
    prompts: [
      "Ask the learner to predict the labelled signal timeline before suggesting one bounded change.",
      "Use the function reference and visible telemetry; never provide wiring or physical power advice to a learner.",
      "Physical export stays unavailable until an adult acknowledges the exact manifest and every component has verified bench-test evidence.",
    ],
  },
  hardware: {
    requirementsVersion: "1.0.0",
    hardwareIncluded: false,
    completePathItemIds: [
      "pico-2-w",
      "breadboard",
      "usb-data-cable",
      "jumper-wires",
      "led-pack",
      "led-resistors",
      "ir-pair",
    ],
    incrementalItemIds: ["led-pack", "led-resistors", "ir-pair"],
    components: [
      {
        itemId: "pico-2-w",
        quantity: 1,
        acquisitionScope: "complete-path",
        verificationStatus: "pending-bench-test",
        compatibilityClaimed: false,
        physicalCompletionEligible: false,
      },
      {
        itemId: "breadboard",
        quantity: 1,
        acquisitionScope: "complete-path",
        verificationStatus: "pending-bench-test",
        compatibilityClaimed: false,
        physicalCompletionEligible: false,
      },
      {
        itemId: "usb-data-cable",
        quantity: 1,
        acquisitionScope: "complete-path",
        verificationStatus: "pending-bench-test",
        compatibilityClaimed: false,
        physicalCompletionEligible: false,
      },
      {
        itemId: "jumper-wires",
        quantity: 12,
        acquisitionScope: "complete-path",
        verificationStatus: "pending-bench-test",
        compatibilityClaimed: false,
        physicalCompletionEligible: false,
      },
      {
        itemId: "led-pack",
        quantity: 3,
        acquisitionScope: "incremental",
        verificationStatus: "pending-bench-test",
        compatibilityClaimed: false,
        physicalCompletionEligible: false,
      },
      {
        itemId: "led-resistors",
        quantity: 3,
        acquisitionScope: "incremental",
        verificationStatus: "pending-bench-test",
        compatibilityClaimed: false,
        physicalCompletionEligible: false,
      },
      {
        itemId: "ir-pair",
        quantity: 1,
        acquisitionScope: "incremental",
        verificationStatus: "pending-bench-test",
        compatibilityClaimed: false,
        physicalCompletionEligible: false,
      },
    ],
    safeguards: {
      adultAssemblyRequired: true,
      adultAcknowledgementRequiredForExport: true,
      websiteMayControlHardware: false,
      simulatorCompletionAvailable: true,
      simulatedBadgeId: "beacon-bot-mission-complete",
      physicalBadgeId: "beacon-bot-physical-builder",
      physicalBadgeRequiresAdultSignoff: true,
      adultAssemblySteps: [
        "Confirm every exact component identity against the requirements manifest.",
        "Assemble and inspect the disconnected breadboard circuit before learner use.",
        "Run known-good recovery firmware and complete the adult bench-test record.",
      ],
      powerRequirements: [
        "Use Pico USB power only for the published Beacon Bot reference circuit.",
        "Disconnect USB power before changing any wiring.",
      ],
      cableRequirements: [
        "One known data-capable USB cable compatible with the Pico 2 W.",
        "Insulated male-to-male breadboard jumper wires matching the manifest quantity.",
      ],
      softwarePrerequisites: [
        "Supported Pico SDK toolchain on Raspberry Pi OS or a documented desktop environment.",
        "Known-good Beacon Bot recovery firmware prepared by an adult.",
      ],
      warnings: [
        "Hardware is not included with the module.",
        "No listed component currently claims compatibility or physical-completion eligibility.",
        "The simulator and simulated badge remain available without physical equipment.",
      ],
      unrelatedHardwareNotRequired: [
        "Camera Module 3",
        "motor driver or motors",
        "servo",
      ],
    },
  },
};

/**
 * First Servo Creature robotics mission. The learner creates a bounded pose,
 * mood and interaction sequence in the simulator. Physical servo power and
 * movement remain unavailable until the exact reference build is bench tested.
 */
export const SERVO_CREATURE_MISSION_ONE_AUTHORING_V1: MissionAuthoringBundleV1 = {
  version: MISSION_AUTHORING_CONTRACT_VERSION_V1,
  moduleId: "junior-coder.servo-creature",
  moduleVersion: "1.1.0",
  missionId: "servo-creature-mission-1",
  learner: {
    estimatedMinutes: 20,
    stages: [
      {
        kind: "learn",
        instruction: "Read what setServoAngle(), waitMs(), repeatMovement(), setCreatureMood() and readTouchSensor() do in the private Servo Creature simulator.",
        artifactIds: ["servo-creature-m1-art"],
      },
      {
        kind: "predict",
        instruction: "Predict the creature's labelled angle, mood, repeat count and simulated touch response before the sequence runs.",
        artifactIds: [],
      },
      {
        kind: "build",
        instruction: "Adjust the five documented C++-style calls to create one bounded creature movement sequence.",
        artifactIds: ["servo-creature-m1-code"],
      },
      {
        kind: "run",
        instruction: "Use the Run action button to start the private Servo Creature simulator.",
        artifactIds: ["servo-creature-m1-code"],
      },
      {
        kind: "assess",
        instruction: "Run the visible and protected deterministic pose, mood and interaction checks.",
        artifactIds: [],
      },
      {
        kind: "inspect",
        instruction: "Compare the highlighted C++-style line with the first movement goal that did not pass.",
        artifactIds: [],
      },
      {
        kind: "fix",
        instruction: "Change one angle, wait, repeat, mood or simulated touch call, then rerun and inspect the text telemetry.",
        artifactIds: ["servo-creature-m1-code"],
      },
      {
        kind: "explain",
        instruction: "Explain how the bounded calls created a safe movement and how the simulated interaction changed the creature's response.",
        artifactIds: [],
      },
      {
        kind: "reward",
        instruction: "Collect the simulated badge when the score and private-runtime safety check pass; physical completion remains adult-only.",
        artifactIds: [],
      },
    ],
    readinessChecks: [
      {
        id: "servo-creature-m1-find-angle-limit",
        prompt: "Find the documented safe minimum and maximum angle before changing the creature's pose.",
        scored: false,
      },
    ],
    artifacts: [
      {
        id: "servo-creature-m1-code",
        kind: "starter-code",
        audience: "learner",
        solutionBearing: false,
      },
      {
        id: "servo-creature-m1-art",
        kind: "starter-assets",
        audience: "learner",
        solutionBearing: false,
      },
      {
        id: "servo-creature-m1-printable",
        kind: "printable",
        audience: "learner",
        solutionBearing: false,
      },
    ],
    goals: [
      {
        id: "servo-creature-m1-starts",
        statement: "The documented C++-style settings are valid and the private simulator starts.",
        visibility: "visible",
        criterionIds: ["servo-creature-build"],
        completionRequired: true,
        aiRequired: false,
      },
      {
        id: "servo-creature-m1-movement-sequence",
        statement: "The creature completes a bounded angle, timing, mood and interaction sequence.",
        visibility: "visible",
        criterionIds: ["servo-creature-goal-one", "servo-creature-goal-two"],
        completionRequired: true,
        aiRequired: false,
      },
      {
        id: "servo-creature-m1-private-runtime",
        statement: "The program stays inside the private simulator and never accesses physical hardware, the network or browser storage.",
        visibility: "visible",
        criterionIds: ["servo-creature-safety"],
        completionRequired: true,
        aiRequired: false,
      },
    ],
    interactions: [
      {
        id: "servo-creature-m1-run-control",
        description: "Start the private Servo Creature movement simulation.",
        primaryMode: "pointer",
        alternativeIds: ["servo-creature-m1-keyboard-run"],
      },
      {
        id: "servo-creature-m1-code-control",
        description: "Edit the documented angle, timing, repeat, mood and interaction calls.",
        primaryMode: "keyboard",
        alternativeIds: [],
      },
      {
        id: "servo-creature-m1-pose-motion",
        description: "Observe the bounded creature pose and movement sequence.",
        primaryMode: "motion",
        alternativeIds: ["servo-creature-m1-telemetry"],
      },
    ],
    accessibilityAlternatives: [
      {
        id: "servo-creature-m1-keyboard-run",
        modes: ["keyboard"],
        equivalentOutcome: true,
        description: "Press Enter or Space on the play-icon Run button to start the same simulator.",
      },
      {
        id: "servo-creature-m1-telemetry",
        modes: ["text", "shape", "symbol", "reduced-motion"],
        equivalentOutcome: true,
        description: "Read the angle, mood, repeat count, elapsed milliseconds and touch state without animation.",
      },
    ],
    evidenceRequirements: [
      {
        id: "servo-creature-m1-assessment",
        goalIds: [
          "servo-creature-m1-starts",
          "servo-creature-m1-movement-sequence",
          "servo-creature-m1-private-runtime",
        ],
        kind: "assessment-result",
        retention: "entitlement",
        containsPersonalData: false,
      },
      {
        id: "servo-creature-m1-explanation",
        goalIds: ["servo-creature-m1-movement-sequence"],
        kind: "learner-explanation",
        retention: "attempt",
        containsPersonalData: false,
      },
    ],
    sideAdventures: [
      {
        id: "servo-creature-m1-remix",
        prompt: "Invent an original creature mood and describe a text or symbol cue that makes its pose understandable without movement.",
        completionRequired: false,
      },
    ],
    rewardBindings: [
      {
        id: "servo-creature-m1-simulated-badge",
        badgeId: "servo-creature-mission-complete",
        goalIds: [
          "servo-creature-m1-starts",
          "servo-creature-m1-movement-sequence",
          "servo-creature-m1-private-runtime",
        ],
        deterministic: true,
        random: false,
        tokenConvertible: false,
      },
    ],
    functionReference: [
      {
        id: "servo-creature-function-angle",
        signature: "setServoAngle(degrees)",
        summary: "Chooses one safe labelled creature pose in the private simulator.",
        parameters: [
          {
            name: "degrees",
            type: "whole number",
            description: "A bounded angle from 30 to 150 degrees.",
          },
        ],
        effect: "Updates the simulator's labelled angle and pose cue without generating PWM or accessing a physical servo.",
        example: "setServoAngle(90);",
      },
      {
        id: "servo-creature-function-wait",
        signature: "waitMs(duration)",
        summary: "Adds one safe wait to the simulated movement timeline.",
        parameters: [
          {
            name: "duration",
            type: "whole number",
            description: "A bounded number of milliseconds from 100 to 1000.",
          },
        ],
        effect: "Advances simulated elapsed time; it never blocks the website or holds a physical servo under load.",
        example: "waitMs(300);",
      },
      {
        id: "servo-creature-function-repeat",
        signature: "repeatMovement(count)",
        summary: "Repeats the current simulated pose a safe number of times.",
        parameters: [
          {
            name: "count",
            type: "whole number",
            description: "A bounded repeat count from 1 to 4.",
          },
        ],
        effect: "Adds a fixed number of labelled pose steps to the private simulator timeline.",
        example: "repeatMovement(3);",
      },
      {
        id: "servo-creature-function-mood",
        signature: "setCreatureMood(mood)",
        summary: "Chooses the creature's labelled expression for the simulated pose.",
        parameters: [
          {
            name: "mood",
            type: "string",
            description: "Use calm, curious or happy.",
          },
        ],
        effect: "Updates the simulator's text and symbol mood cue without moving physical parts.",
        example: "setCreatureMood(\"curious\");",
      },
      {
        id: "servo-creature-function-touch",
        signature: "readTouchSensor()",
        summary: "Reads the simulator's fictional touch state for one interaction response.",
        parameters: [],
        effect: "Returns touched or clear from simulator state only; it cannot access a physical sensor.",
        example: "const touchState = readTouchSensor();",
      },
    ],
  },
  facilitator: {
    artifacts: [
      {
        id: "servo-creature-m1-answer-key",
        kind: "answer-key",
        audience: "facilitator",
        solutionBearing: true,
      },
      {
        id: "servo-creature-m1-protected-tests",
        kind: "protected-test",
        audience: "facilitator",
        solutionBearing: true,
      },
      {
        id: "servo-creature-m1-adult-hardware-guide",
        kind: "facilitator-note",
        audience: "facilitator",
        solutionBearing: true,
      },
    ],
    protectedGoals: [
      {
        id: "servo-creature-m1-protected-resilience",
        statement: "The simulator rejects unsupported moods, out-of-range angles, excessive waits or repeats and any physical-hardware request.",
        visibility: "protected",
        criterionIds: ["servo-creature-edge-one", "servo-creature-edge-two"],
        completionRequired: false,
        aiRequired: false,
      },
    ],
    prompts: [
      "Ask the learner to predict the labelled pose timeline before suggesting one bounded change.",
      "Use the function reference and visible telemetry; never provide servo wiring, power or movement advice to a learner.",
      "Physical export stays unavailable until an adult acknowledges the exact manifest and every servo power component has verified bench-test evidence.",
    ],
  },
  hardware: {
    requirementsVersion: "1.0.0",
    hardwareIncluded: false,
    completePathItemIds: [
      "pico-2-w",
      "breadboard",
      "usb-data-cable",
      "jumper-wires",
      "micro-servo",
      "servo-power",
    ],
    incrementalItemIds: ["micro-servo", "servo-power"],
    components: [
      {
        itemId: "pico-2-w",
        quantity: 1,
        acquisitionScope: "complete-path",
        verificationStatus: "pending-bench-test",
        compatibilityClaimed: false,
        physicalCompletionEligible: false,
      },
      {
        itemId: "breadboard",
        quantity: 1,
        acquisitionScope: "complete-path",
        verificationStatus: "pending-bench-test",
        compatibilityClaimed: false,
        physicalCompletionEligible: false,
      },
      {
        itemId: "usb-data-cable",
        quantity: 1,
        acquisitionScope: "complete-path",
        verificationStatus: "pending-bench-test",
        compatibilityClaimed: false,
        physicalCompletionEligible: false,
      },
      {
        itemId: "jumper-wires",
        quantity: 12,
        acquisitionScope: "complete-path",
        verificationStatus: "pending-bench-test",
        compatibilityClaimed: false,
        physicalCompletionEligible: false,
      },
      {
        itemId: "micro-servo",
        quantity: 1,
        acquisitionScope: "incremental",
        verificationStatus: "pending-bench-test",
        compatibilityClaimed: false,
        physicalCompletionEligible: false,
      },
      {
        itemId: "servo-power",
        quantity: 1,
        acquisitionScope: "incremental",
        verificationStatus: "pending-bench-test",
        compatibilityClaimed: false,
        physicalCompletionEligible: false,
      },
    ],
    safeguards: {
      adultAssemblyRequired: true,
      adultAcknowledgementRequiredForExport: true,
      websiteMayControlHardware: false,
      simulatorCompletionAvailable: true,
      simulatedBadgeId: "servo-creature-mission-complete",
      physicalBadgeId: "servo-creature-physical-builder",
      physicalBadgeRequiresAdultSignoff: true,
      adultAssemblySteps: [
        "Confirm the exact servo, external supply and connector identities against the requirements manifest.",
        "Assemble and inspect the disconnected signal and common-ground wiring before learner use.",
        "Secure the creature linkage, lift or restrain moving parts and complete the adult bench-test record.",
      ],
      powerRequirements: [
        "Use an external regulated servo supply sized for the verified servo; do not power the servo from a Pico GPIO pin.",
        "Connect one common signal ground between the verified servo supply and Pico only as shown in the adult guide.",
        "Disconnect every power source before changing wiring or creature linkages.",
      ],
      cableRequirements: [
        "One known data-capable USB cable compatible with the Pico 2 W.",
        "Insulated jumper leads and a verified servo connector arrangement documented by the adult guide.",
      ],
      softwarePrerequisites: [
        "Supported Pico SDK toolchain on Raspberry Pi OS or a documented desktop environment.",
        "Known-good Servo Creature recovery firmware with adult-owned neutral-pose and stop behaviour.",
      ],
      warnings: [
        "Hardware is not included with the module.",
        "No listed servo or power arrangement currently claims compatibility or physical-completion eligibility.",
        "Pinch points, stalled servos and unsuitable power supplies can cause heat or movement; adult assembly and testing are mandatory.",
        "The simulator and simulated badge remain available without physical equipment.",
      ],
      unrelatedHardwareNotRequired: [
        "Camera Module 3 or Raspberry Pi Zero 2 W",
        "motor driver, motors or rover chassis",
        "physical touch or IR sensor",
        "LED or infrared beacon parts",
      ],
    },
  },
};

/**
 * First Dance Rover robotics mission. Learners choreograph a bounded rover
 * sequence in the private simulator. Motor power, firmware export and physical
 * movement remain unavailable until the exact reference build is bench tested.
 */
export const DANCE_ROVER_MISSION_ONE_AUTHORING_V1: MissionAuthoringBundleV1 = {
  version: MISSION_AUTHORING_CONTRACT_VERSION_V1,
  moduleId: "junior-coder.dance-rover",
  moduleVersion: "1.1.0",
  missionId: "dance-rover-mission-1",
  learner: {
    estimatedMinutes: 20,
    stages: [
      {
        kind: "learn",
        instruction: "Read what driveRover(), turnRover(), waitMs(), repeatDance() and emergencyStop() do in the private Dance Rover simulator.",
        artifactIds: ["dance-rover-m1-art"],
      },
      {
        kind: "predict",
        instruction: "Predict the rover's labelled direction, speed, turn, repeat count and final stopped state before the dance runs.",
        artifactIds: [],
      },
      {
        kind: "build",
        instruction: "Adjust the five documented C++-style calls to create one bounded rover dance with an emergency stop.",
        artifactIds: ["dance-rover-m1-code"],
      },
      {
        kind: "run",
        instruction: "Use the Run action button to start the private Dance Rover simulator.",
        artifactIds: ["dance-rover-m1-code"],
      },
      {
        kind: "assess",
        instruction: "Run the visible and protected deterministic direction, speed, sequence and stop checks.",
        artifactIds: [],
      },
      {
        kind: "inspect",
        instruction: "Compare the highlighted C++-style line with the first dance goal that did not pass.",
        artifactIds: [],
      },
      {
        kind: "fix",
        instruction: "Change one bounded direction, speed, wait, repeat or stop call, then rerun and inspect the text telemetry.",
        artifactIds: ["dance-rover-m1-code"],
      },
      {
        kind: "explain",
        instruction: "Explain how reusable movement calls created the choreography and why every safe dance ends stopped.",
        artifactIds: [],
      },
      {
        kind: "reward",
        instruction: "Collect the simulated badge when the score and fail-safe stop pass; physical completion remains adult-only.",
        artifactIds: [],
      },
    ],
    readinessChecks: [
      {
        id: "dance-rover-m1-find-stop",
        prompt: "Find the emergencyStop() call and explain why it must finish every physical movement sequence.",
        scored: false,
      },
    ],
    artifacts: [
      {
        id: "dance-rover-m1-code",
        kind: "starter-code",
        audience: "learner",
        solutionBearing: false,
      },
      {
        id: "dance-rover-m1-art",
        kind: "starter-assets",
        audience: "learner",
        solutionBearing: false,
      },
      {
        id: "dance-rover-m1-printable",
        kind: "printable",
        audience: "learner",
        solutionBearing: false,
      },
    ],
    goals: [
      {
        id: "dance-rover-m1-starts",
        statement: "The documented C++-style settings are valid and the private simulator starts.",
        visibility: "visible",
        criterionIds: ["dance-rover-build"],
        completionRequired: true,
        aiRequired: false,
      },
      {
        id: "dance-rover-m1-choreography",
        statement: "The rover completes a bounded direction, speed, turn and repeat sequence before stopping.",
        visibility: "visible",
        criterionIds: ["dance-rover-goal-one", "dance-rover-goal-two"],
        completionRequired: true,
        aiRequired: false,
      },
      {
        id: "dance-rover-m1-private-runtime",
        statement: "The program stays inside the private simulator and never accesses physical motors, the network or browser storage.",
        visibility: "visible",
        criterionIds: ["dance-rover-safety"],
        completionRequired: true,
        aiRequired: false,
      },
    ],
    interactions: [
      {
        id: "dance-rover-m1-run-control",
        description: "Start the private Dance Rover choreography simulation.",
        primaryMode: "pointer",
        alternativeIds: ["dance-rover-m1-keyboard-run"],
      },
      {
        id: "dance-rover-m1-code-control",
        description: "Edit the documented direction, speed, wait, repeat and stop calls.",
        primaryMode: "keyboard",
        alternativeIds: [],
      },
      {
        id: "dance-rover-m1-motion-preview",
        description: "Observe the bounded rover route and stopped state.",
        primaryMode: "motion",
        alternativeIds: ["dance-rover-m1-telemetry"],
      },
    ],
    accessibilityAlternatives: [
      {
        id: "dance-rover-m1-keyboard-run",
        modes: ["keyboard"],
        equivalentOutcome: true,
        description: "Press Enter or Space on the play-icon Run button to start the same simulator.",
      },
      {
        id: "dance-rover-m1-telemetry",
        modes: ["text", "shape", "symbol", "reduced-motion"],
        equivalentOutcome: true,
        description: "Read direction, speed, turn, repeat count, elapsed milliseconds and stopped state without animation.",
      },
    ],
    evidenceRequirements: [
      {
        id: "dance-rover-m1-assessment",
        goalIds: [
          "dance-rover-m1-starts",
          "dance-rover-m1-choreography",
          "dance-rover-m1-private-runtime",
        ],
        kind: "assessment-result",
        retention: "entitlement",
        containsPersonalData: false,
      },
      {
        id: "dance-rover-m1-explanation",
        goalIds: ["dance-rover-m1-choreography"],
        kind: "learner-explanation",
        retention: "attempt",
        containsPersonalData: false,
      },
    ],
    sideAdventures: [
      {
        id: "dance-rover-m1-remix",
        prompt: "Invent an original rover dance and add a text or symbol route cue that makes it understandable without motion.",
        completionRequired: false,
      },
    ],
    rewardBindings: [
      {
        id: "dance-rover-m1-simulated-badge",
        badgeId: "dance-rover-mission-complete",
        goalIds: [
          "dance-rover-m1-starts",
          "dance-rover-m1-choreography",
          "dance-rover-m1-private-runtime",
        ],
        deterministic: true,
        random: false,
        tokenConvertible: false,
      },
    ],
    functionReference: [
      {
        id: "dance-rover-function-drive",
        signature: "driveRover(direction, speed)",
        summary: "Adds one straight movement to the private simulator route.",
        parameters: [
          {
            name: "direction",
            type: "string",
            description: "Use forward or backward.",
          },
          {
            name: "speed",
            type: "whole number",
            description: "A bounded simulated speed from 0 to 60 percent.",
          },
        ],
        effect: "Updates the simulator's labelled route without generating motor PWM or accessing a physical driver.",
        example: "driveRover(\"forward\", 40);",
      },
      {
        id: "dance-rover-function-turn",
        signature: "turnRover(direction, speed)",
        summary: "Adds one left or right turn to the private simulator route.",
        parameters: [
          {
            name: "direction",
            type: "string",
            description: "Use left or right.",
          },
          {
            name: "speed",
            type: "whole number",
            description: "A bounded simulated turn speed from 0 to 60 percent.",
          },
        ],
        effect: "Updates labelled simulator direction without energising motors or a driver.",
        example: "turnRover(\"left\", 30);",
      },
      {
        id: "dance-rover-function-wait",
        signature: "waitMs(duration)",
        summary: "Adds one bounded wait to the simulated dance timeline.",
        parameters: [
          {
            name: "duration",
            type: "whole number",
            description: "A bounded number of milliseconds from 100 to 1000.",
          },
        ],
        effect: "Advances simulated elapsed time; it never blocks the website or holds physical motors under load.",
        example: "waitMs(300);",
      },
      {
        id: "dance-rover-function-repeat",
        signature: "repeatDance(count)",
        summary: "Repeats the current simulated dance a safe number of times.",
        parameters: [
          {
            name: "count",
            type: "whole number",
            description: "A bounded repeat count from 1 to 4.",
          },
        ],
        effect: "Adds a fixed number of labelled route sequences to the private simulator.",
        example: "repeatDance(3);",
      },
      {
        id: "dance-rover-function-stop",
        signature: "emergencyStop()",
        summary: "Ends the simulated dance in a fail-safe stopped state.",
        parameters: [],
        effect: "Marks both motors stopped in the simulator; it cannot activate, stop or otherwise control physical hardware.",
        example: "emergencyStop();",
      },
    ],
  },
  facilitator: {
    artifacts: [
      {
        id: "dance-rover-m1-answer-key",
        kind: "answer-key",
        audience: "facilitator",
        solutionBearing: true,
      },
      {
        id: "dance-rover-m1-protected-tests",
        kind: "protected-test",
        audience: "facilitator",
        solutionBearing: true,
      },
      {
        id: "dance-rover-m1-adult-hardware-guide",
        kind: "facilitator-note",
        audience: "facilitator",
        solutionBearing: true,
      },
    ],
    protectedGoals: [
      {
        id: "dance-rover-m1-protected-resilience",
        statement: "The simulator rejects unsupported directions, excessive speeds, waits, repeats, missing stop calls and physical-hardware requests.",
        visibility: "protected",
        criterionIds: ["dance-rover-edge-one", "dance-rover-edge-two"],
        completionRequired: false,
        aiRequired: false,
      },
    ],
    prompts: [
      "Ask the learner to predict the labelled route and final stopped state before suggesting one bounded change.",
      "Use the function reference and visible telemetry; never provide motor wiring, power or movement advice to a learner.",
      "Physical export stays unavailable until an adult acknowledges the exact manifest and every driver, motor and power component has verified bench-test evidence.",
    ],
  },
  hardware: {
    requirementsVersion: "1.0.0",
    hardwareIncluded: false,
    completePathItemIds: [
      "pico-2-w",
      "breadboard",
      "usb-data-cable",
      "jumper-wires",
      "dual-motor-driver",
      "geared-motors",
      "rover-chassis",
      "motor-power",
    ],
    incrementalItemIds: [
      "dual-motor-driver",
      "geared-motors",
      "rover-chassis",
      "motor-power",
    ],
    components: [
      { itemId: "pico-2-w", quantity: 1, acquisitionScope: "complete-path", verificationStatus: "pending-bench-test", compatibilityClaimed: false, physicalCompletionEligible: false },
      { itemId: "breadboard", quantity: 1, acquisitionScope: "complete-path", verificationStatus: "pending-bench-test", compatibilityClaimed: false, physicalCompletionEligible: false },
      { itemId: "usb-data-cable", quantity: 1, acquisitionScope: "complete-path", verificationStatus: "pending-bench-test", compatibilityClaimed: false, physicalCompletionEligible: false },
      { itemId: "jumper-wires", quantity: 12, acquisitionScope: "complete-path", verificationStatus: "pending-bench-test", compatibilityClaimed: false, physicalCompletionEligible: false },
      { itemId: "dual-motor-driver", quantity: 1, acquisitionScope: "incremental", verificationStatus: "pending-bench-test", compatibilityClaimed: false, physicalCompletionEligible: false },
      { itemId: "geared-motors", quantity: 2, acquisitionScope: "incremental", verificationStatus: "pending-bench-test", compatibilityClaimed: false, physicalCompletionEligible: false },
      { itemId: "rover-chassis", quantity: 1, acquisitionScope: "incremental", verificationStatus: "pending-bench-test", compatibilityClaimed: false, physicalCompletionEligible: false },
      { itemId: "motor-power", quantity: 1, acquisitionScope: "incremental", verificationStatus: "pending-bench-test", compatibilityClaimed: false, physicalCompletionEligible: false },
    ],
    safeguards: {
      adultAssemblyRequired: true,
      adultAcknowledgementRequiredForExport: true,
      websiteMayControlHardware: false,
      simulatorCompletionAvailable: true,
      simulatedBadgeId: "dance-rover-mission-complete",
      physicalBadgeId: "dance-rover-physical-builder",
      physicalBadgeRequiresAdultSignoff: true,
      adultAssemblySteps: [
        "Confirm the exact driver, motors, chassis and switched power identities against the requirements manifest.",
        "Assemble and inspect all wiring with motor power disconnected and secure every moving or pinch-point part.",
        "Complete the first direction and emergency-stop bench test with the wheels lifted clear of the surface.",
      ],
      powerRequirements: [
        "Use a switched protected motor supply within the verified driver and motor ratings; never power motors from a Pico GPIO pin.",
        "Connect one common signal ground between the verified motor supply, driver and Pico only as shown in the adult guide.",
        "Keep the power switch accessible and disconnect every source before changing wiring, wheels or chassis parts.",
      ],
      cableRequirements: [
        "One known data-capable USB cable compatible with the Pico 2 W.",
        "Insulated jumper leads and verified motor, driver and power connectors documented by the adult guide.",
      ],
      softwarePrerequisites: [
        "Supported Pico SDK toolchain on Raspberry Pi OS or a documented desktop environment.",
        "Known-good Dance Rover recovery firmware with adult-owned watchdog and emergency-stop behaviour.",
      ],
      warnings: [
        "Hardware is not included with the module.",
        "No listed driver, motor, chassis or power arrangement currently claims compatibility or physical-completion eligibility.",
        "Moving wheels, pinch points, stalled motors and unsuitable supplies can cause injury or heat; adult assembly and testing are mandatory.",
        "The simulator and simulated badge remain available without physical equipment.",
      ],
      unrelatedHardwareNotRequired: [
        "Camera Module 3 or Raspberry Pi Zero 2 W",
        "obstacle or colour sensors",
        "servo, LED or infrared beacon parts",
      ],
    },
  },
};

/**
 * First Obstacle Explorer robotics mission. Learners use bounded simulated IR
 * readings, Boolean decisions, recovery state and a watchdog to plan a safe
 * route. Sensor input, firmware export and physical movement remain unavailable
 * until the exact reference build is calibrated and bench tested by an adult.
 */
export const OBSTACLE_EXPLORER_MISSION_ONE_AUTHORING_V1: MissionAuthoringBundleV1 = {
  version: MISSION_AUTHORING_CONTRACT_VERSION_V1,
  moduleId: "junior-coder.obstacle-explorer",
  moduleVersion: "1.1.0",
  missionId: "obstacle-explorer-mission-1",
  learner: {
    estimatedMinutes: 20,
    stages: [
      {
        kind: "learn",
        instruction: "Read what readObstacle(), chooseSafeRoute(), setRecoveryAttempts(), armWatchdog() and failSafeStop() do in the private Obstacle Explorer simulator.",
        artifactIds: ["obstacle-explorer-m1-art"],
      },
      {
        kind: "predict",
        instruction: "Predict the simulated obstacle reading, safe route, recovery count, watchdog time and final stopped state before the explorer runs.",
        artifactIds: [],
      },
      {
        kind: "build",
        instruction: "Adjust the five documented C++-style calls to make one bounded obstacle decision with a watchdog and fail-safe stop.",
        artifactIds: ["obstacle-explorer-m1-code"],
      },
      {
        kind: "run",
        instruction: "Use the Run action button to start the private Obstacle Explorer simulator.",
        artifactIds: ["obstacle-explorer-m1-code"],
      },
      {
        kind: "assess",
        instruction: "Run the visible and protected deterministic sensor, route, recovery, watchdog and stop checks.",
        artifactIds: [],
      },
      {
        kind: "inspect",
        instruction: "Compare the highlighted C++-style line with the first explorer goal that did not pass.",
        artifactIds: [],
      },
      {
        kind: "fix",
        instruction: "Change one bounded sensor side, route, recovery count, watchdog or stop call, then rerun and inspect the text telemetry.",
        artifactIds: ["obstacle-explorer-m1-code"],
      },
      {
        kind: "explain",
        instruction: "Explain how a Boolean obstacle reading selected a route and why the watchdog and fail-safe stop protect every explorer state.",
        artifactIds: [],
      },
      {
        kind: "reward",
        instruction: "Collect the simulated badge when the score and mandatory safety checks pass; physical completion remains adult-only.",
        artifactIds: [],
      },
    ],
    readinessChecks: [
      {
        id: "obstacle-explorer-m1-find-stop",
        prompt: "Find failSafeStop() and explain why the explorer must stop when a sensor or watchdog result is uncertain.",
        scored: false,
      },
    ],
    artifacts: [
      {
        id: "obstacle-explorer-m1-code",
        kind: "starter-code",
        audience: "learner",
        solutionBearing: false,
      },
      {
        id: "obstacle-explorer-m1-art",
        kind: "starter-assets",
        audience: "learner",
        solutionBearing: false,
      },
      {
        id: "obstacle-explorer-m1-printable",
        kind: "printable",
        audience: "learner",
        solutionBearing: false,
      },
    ],
    goals: [
      {
        id: "obstacle-explorer-m1-starts",
        statement: "The documented C++-style settings are valid and the private simulator starts.",
        visibility: "visible",
        criterionIds: ["obstacle-explorer-build"],
        completionRequired: true,
        aiRequired: false,
      },
      {
        id: "obstacle-explorer-m1-navigation",
        statement: "The explorer reads one simulated obstacle and chooses a bounded route with three recovery attempts.",
        visibility: "visible",
        criterionIds: ["obstacle-explorer-goal-one", "obstacle-explorer-goal-two"],
        completionRequired: true,
        aiRequired: false,
      },
      {
        id: "obstacle-explorer-m1-private-runtime",
        statement: "The program arms a watchdog, ends fail-safe stopped and never accesses sensors, motors, the network or browser storage.",
        visibility: "visible",
        criterionIds: ["obstacle-explorer-safety"],
        completionRequired: true,
        aiRequired: false,
      },
    ],
    interactions: [
      {
        id: "obstacle-explorer-m1-run-control",
        description: "Start the private Obstacle Explorer navigation simulation.",
        primaryMode: "pointer",
        alternativeIds: ["obstacle-explorer-m1-keyboard-run"],
      },
      {
        id: "obstacle-explorer-m1-code-control",
        description: "Edit the documented sensor, route, recovery, watchdog and stop calls.",
        primaryMode: "keyboard",
        alternativeIds: [],
      },
      {
        id: "obstacle-explorer-m1-route-preview",
        description: "Observe the bounded obstacle decision, route and stopped state.",
        primaryMode: "motion",
        alternativeIds: ["obstacle-explorer-m1-telemetry"],
      },
    ],
    accessibilityAlternatives: [
      {
        id: "obstacle-explorer-m1-keyboard-run",
        modes: ["keyboard"],
        equivalentOutcome: true,
        description: "Press Enter or Space on the play-icon Run button to start the same simulator.",
      },
      {
        id: "obstacle-explorer-m1-telemetry",
        modes: ["text", "shape", "symbol", "reduced-motion"],
        equivalentOutcome: true,
        description: "Read sensor side, blocked state, route, recovery count, watchdog milliseconds and stopped state without animation or colour alone.",
      },
    ],
    evidenceRequirements: [
      {
        id: "obstacle-explorer-m1-assessment",
        goalIds: [
          "obstacle-explorer-m1-starts",
          "obstacle-explorer-m1-navigation",
          "obstacle-explorer-m1-private-runtime",
        ],
        kind: "assessment-result",
        retention: "entitlement",
        containsPersonalData: false,
      },
      {
        id: "obstacle-explorer-m1-explanation",
        goalIds: ["obstacle-explorer-m1-navigation"],
        kind: "learner-explanation",
        retention: "attempt",
        containsPersonalData: false,
      },
    ],
    sideAdventures: [
      {
        id: "obstacle-explorer-m1-remix",
        prompt: "Invent an original maze response and add a text or symbol cue that explains the Boolean decision without motion or colour alone.",
        completionRequired: false,
      },
    ],
    rewardBindings: [
      {
        id: "obstacle-explorer-m1-simulated-badge",
        badgeId: "obstacle-explorer-mission-complete",
        goalIds: [
          "obstacle-explorer-m1-starts",
          "obstacle-explorer-m1-navigation",
          "obstacle-explorer-m1-private-runtime",
        ],
        deterministic: true,
        random: false,
        tokenConvertible: false,
      },
    ],
    functionReference: [
      {
        id: "obstacle-explorer-function-read",
        signature: "readObstacle(side)",
        summary: "Reads one labelled obstacle state from the private simulator.",
        parameters: [
          {
            name: "side",
            type: "string",
            description: "Use front, left or right.",
          },
        ],
        effect: "Returns a simulator Boolean blocked or clear reading and never accesses an IR sensor or GPIO pin.",
        example: "readObstacle(\"front\");",
      },
      {
        id: "obstacle-explorer-function-route",
        signature: "chooseSafeRoute(blockedAction, clearAction)",
        summary: "Chooses one bounded route for blocked and clear simulated states.",
        parameters: [
          {
            name: "blockedAction",
            type: "string",
            description: "Use turn-left, turn-right, back-up or stop.",
          },
          {
            name: "clearAction",
            type: "string",
            description: "Use forward or stop.",
          },
        ],
        effect: "Updates labelled simulator navigation state without energising motors or a driver.",
        example: "chooseSafeRoute(\"turn-left\", \"forward\");",
      },
      {
        id: "obstacle-explorer-function-recovery",
        signature: "setRecoveryAttempts(count)",
        summary: "Sets a bounded number of simulated recovery attempts.",
        parameters: [
          {
            name: "count",
            type: "whole number",
            description: "A bounded recovery count from 1 to 3.",
          },
        ],
        effect: "Limits the private simulator recovery state so an uncertain route cannot loop forever.",
        example: "setRecoveryAttempts(3);",
      },
      {
        id: "obstacle-explorer-function-watchdog",
        signature: "armWatchdog(duration)",
        summary: "Arms a bounded simulated watchdog timer.",
        parameters: [
          {
            name: "duration",
            type: "whole number",
            description: "A bounded timeout from 250 to 1000 milliseconds.",
          },
        ],
        effect: "Records simulator timeout telemetry and cannot hold or control physical movement.",
        example: "armWatchdog(500);",
      },
      {
        id: "obstacle-explorer-function-stop",
        signature: "failSafeStop()",
        summary: "Ends the navigation simulation in a fail-safe stopped state.",
        parameters: [],
        effect: "Marks the private simulator stopped on completion or uncertainty; it cannot activate, stop or otherwise control physical hardware.",
        example: "failSafeStop();",
      },
    ],
  },
  facilitator: {
    artifacts: [
      {
        id: "obstacle-explorer-m1-answer-key",
        kind: "answer-key",
        audience: "facilitator",
        solutionBearing: true,
      },
      {
        id: "obstacle-explorer-m1-protected-tests",
        kind: "protected-test",
        audience: "facilitator",
        solutionBearing: true,
      },
      {
        id: "obstacle-explorer-m1-adult-hardware-guide",
        kind: "facilitator-note",
        audience: "facilitator",
        solutionBearing: true,
      },
    ],
    protectedGoals: [
      {
        id: "obstacle-explorer-m1-protected-resilience",
        statement: "The simulator rejects unsupported sensor sides, unsafe routes, excessive recovery attempts, invalid watchdogs, missing stop calls and physical-hardware requests.",
        visibility: "protected",
        criterionIds: ["obstacle-explorer-edge-one", "obstacle-explorer-edge-two"],
        completionRequired: false,
        aiRequired: false,
      },
    ],
    prompts: [
      "Ask the learner to predict the Boolean blocked state, labelled route and final stopped state before suggesting one bounded change.",
      "Use the function reference and visible telemetry; never provide sensor wiring, motor power or movement advice to a learner.",
      "Physical export stays unavailable until an adult acknowledges the exact manifest and every rover and sensor component has calibration and bench-test evidence.",
    ],
  },
  hardware: {
    requirementsVersion: "1.0.0",
    hardwareIncluded: false,
    completePathItemIds: [
      "pico-2-w",
      "breadboard",
      "usb-data-cable",
      "jumper-wires",
      "verified-rover",
      "obstacle-sensors",
    ],
    incrementalItemIds: [
      "verified-rover",
      "obstacle-sensors",
    ],
    components: [
      { itemId: "pico-2-w", quantity: 1, acquisitionScope: "complete-path", verificationStatus: "pending-bench-test", compatibilityClaimed: false, physicalCompletionEligible: false },
      { itemId: "breadboard", quantity: 1, acquisitionScope: "complete-path", verificationStatus: "pending-bench-test", compatibilityClaimed: false, physicalCompletionEligible: false },
      { itemId: "usb-data-cable", quantity: 1, acquisitionScope: "complete-path", verificationStatus: "pending-bench-test", compatibilityClaimed: false, physicalCompletionEligible: false },
      { itemId: "jumper-wires", quantity: 12, acquisitionScope: "complete-path", verificationStatus: "pending-bench-test", compatibilityClaimed: false, physicalCompletionEligible: false },
      { itemId: "verified-rover", quantity: 1, acquisitionScope: "incremental", verificationStatus: "pending-bench-test", compatibilityClaimed: false, physicalCompletionEligible: false },
      { itemId: "obstacle-sensors", quantity: 2, acquisitionScope: "incremental", verificationStatus: "pending-bench-test", compatibilityClaimed: false, physicalCompletionEligible: false },
    ],
    safeguards: {
      adultAssemblyRequired: true,
      adultAcknowledgementRequiredForExport: true,
      websiteMayControlHardware: false,
      simulatorCompletionAvailable: true,
      simulatedBadgeId: "obstacle-explorer-mission-complete",
      physicalBadgeId: "obstacle-explorer-physical-builder",
      physicalBadgeRequiresAdultSignoff: true,
      adultAssemblySteps: [
        "Confirm the exact bench-signed rover and IR sensor identities against the requirements manifest.",
        "Assemble and inspect all disconnected sensor wiring, then complete the adult sensor calibration record for clear and blocked surfaces.",
        "Complete direction, obstacle recovery, watchdog and fail-safe-stop tests with the wheels lifted clear of the surface.",
      ],
      powerRequirements: [
        "Use the verified switched protected motor supply and sensor voltage; never power motors or unsuitable sensors from a Pico GPIO pin.",
        "Connect one common signal ground between the verified sensor, motor supply, driver and Pico only as shown in the adult guide.",
        "Keep the power switch accessible and disconnect every source before changing wiring, sensors, wheels or chassis parts.",
      ],
      cableRequirements: [
        "One known data-capable USB cable compatible with the Pico 2 W.",
        "Insulated jumper leads and verified sensor, motor, driver and power connectors documented by the adult guide.",
      ],
      softwarePrerequisites: [
        "Supported Pico SDK toolchain on Raspberry Pi OS or a documented desktop environment.",
        "Known-good Obstacle Explorer recovery firmware with adult-owned watchdog, sensor-failure and emergency-stop behaviour.",
      ],
      warnings: [
        "Hardware is not included with the module.",
        "No listed rover or sensor currently claims compatibility or physical-completion eligibility for this module.",
        "Moving wheels, pinch points, stalled motors, reflective sensor errors and unsuitable supplies can cause unsafe movement or heat; adult assembly, calibration and testing are mandatory.",
        "The simulator and simulated badge remain available without physical equipment.",
      ],
      unrelatedHardwareNotRequired: [
        "Camera Module 3 or Raspberry Pi Zero 2 W",
        "colour targets or camera ribbon",
        "servo, LED or infrared beacon parts",
      ],
    },
  },
};

export const RAINBOW_RESCUE_ROVER_MISSION_ONE_AUTHORING_V1: MissionAuthoringBundleV1 = {
  version: MISSION_AUTHORING_CONTRACT_VERSION_V1,
  moduleId: "junior-coder.rainbow-rescue-rover",
  moduleVersion: "1.1.0",
  missionId: "rainbow-rescue-rover-mission-1",
  learner: {
    estimatedMinutes: 20,
    stages: [
      {
        kind: "learn",
        instruction: "Read what detectColour(), locateTarget(), planSerialCommand(), armHeartbeat() and failSafeStop() do in the private Rainbow Rescue Rover simulator.",
        artifactIds: ["rainbow-rescue-rover-m1-art"],
      },
      {
        kind: "predict",
        instruction: "Predict the simulated colour, target zone, bounded command, heartbeat time and final stopped state before the rescue plan runs.",
        artifactIds: [],
      },
      {
        kind: "build",
        instruction: "Adjust the five documented integration calls to recognise one simulated target and plan one safe serial command with a heartbeat and fail-safe stop.",
        artifactIds: ["rainbow-rescue-rover-m1-code"],
      },
      {
        kind: "run",
        instruction: "Use the Run action button to start the private Rainbow Rescue Rover integration simulator.",
        artifactIds: ["rainbow-rescue-rover-m1-code"],
      },
      {
        kind: "assess",
        instruction: "Run the visible and protected deterministic colour, location, command, heartbeat and stop checks.",
        artifactIds: [],
      },
      {
        kind: "inspect",
        instruction: "Compare the highlighted integration-plan line with the first rescue goal that did not pass.",
        artifactIds: [],
      },
      {
        kind: "fix",
        instruction: "Change one bounded colour, target zone, command, heartbeat or stop call, then rerun and inspect the text telemetry.",
        artifactIds: ["rainbow-rescue-rover-m1-code"],
      },
      {
        kind: "explain",
        instruction: "Explain how family-local colour evidence became a bounded command plan and why the heartbeat and fail-safe stop protect every uncertain state.",
        artifactIds: [],
      },
      {
        kind: "reward",
        instruction: "Collect the simulated badge when the score and mandatory privacy and safety checks pass; physical completion remains adult-only.",
        artifactIds: [],
      },
    ],
    readinessChecks: [
      {
        id: "rainbow-rescue-rover-m1-find-privacy",
        prompt: "Find the rule that keeps Camera Module 3 frames on the family Raspberry Pi and explain why only bounded command labels may leave it.",
        scored: false,
      },
    ],
    artifacts: [
      {
        id: "rainbow-rescue-rover-m1-code",
        kind: "starter-code",
        audience: "learner",
        solutionBearing: false,
      },
      {
        id: "rainbow-rescue-rover-m1-art",
        kind: "starter-assets",
        audience: "learner",
        solutionBearing: false,
      },
      {
        id: "rainbow-rescue-rover-m1-printable",
        kind: "printable",
        audience: "learner",
        solutionBearing: false,
      },
    ],
    goals: [
      {
        id: "rainbow-rescue-rover-m1-starts",
        statement: "The documented integration-plan settings are valid and the private simulator starts.",
        visibility: "visible",
        criterionIds: ["rainbow-rescue-rover-build"],
        completionRequired: true,
        aiRequired: false,
      },
      {
        id: "rainbow-rescue-rover-m1-target-command",
        statement: "The rover plan recognises a green simulated target in the centre and selects one bounded forward command.",
        visibility: "visible",
        criterionIds: ["rainbow-rescue-rover-goal-one", "rainbow-rescue-rover-goal-two"],
        completionRequired: true,
        aiRequired: false,
      },
      {
        id: "rainbow-rescue-rover-m1-private-runtime",
        statement: "The plan arms a heartbeat, ends fail-safe stopped and never accesses a camera, serial port, motor, network or browser storage.",
        visibility: "visible",
        criterionIds: ["rainbow-rescue-rover-safety"],
        completionRequired: true,
        aiRequired: false,
      },
    ],
    interactions: [
      {
        id: "rainbow-rescue-rover-m1-run-control",
        description: "Start the private Rainbow Rescue Rover integration simulation.",
        primaryMode: "pointer",
        alternativeIds: ["rainbow-rescue-rover-m1-keyboard-run"],
      },
      {
        id: "rainbow-rescue-rover-m1-code-control",
        description: "Edit the documented colour, target, command, heartbeat and stop calls.",
        primaryMode: "keyboard",
        alternativeIds: [],
      },
      {
        id: "rainbow-rescue-rover-m1-target-preview",
        description: "Observe the simulated colour target, command route and stopped state.",
        primaryMode: "colour",
        alternativeIds: ["rainbow-rescue-rover-m1-telemetry"],
      },
    ],
    accessibilityAlternatives: [
      {
        id: "rainbow-rescue-rover-m1-keyboard-run",
        modes: ["keyboard"],
        equivalentOutcome: true,
        description: "Press Enter or Space on the play-icon Run button to start the same simulator.",
      },
      {
        id: "rainbow-rescue-rover-m1-telemetry",
        modes: ["text", "shape", "symbol", "reduced-motion"],
        equivalentOutcome: true,
        description: "Read the colour name, target zone, command, heartbeat milliseconds and stopped state without camera access, animation or colour alone.",
      },
    ],
    evidenceRequirements: [
      {
        id: "rainbow-rescue-rover-m1-assessment",
        goalIds: [
          "rainbow-rescue-rover-m1-starts",
          "rainbow-rescue-rover-m1-target-command",
          "rainbow-rescue-rover-m1-private-runtime",
        ],
        kind: "assessment-result",
        retention: "entitlement",
        containsPersonalData: false,
      },
      {
        id: "rainbow-rescue-rover-m1-explanation",
        goalIds: ["rainbow-rescue-rover-m1-target-command"],
        kind: "learner-explanation",
        retention: "attempt",
        containsPersonalData: false,
      },
    ],
    sideAdventures: [
      {
        id: "rainbow-rescue-rover-m1-remix",
        prompt: "Invent an original colour rescue rule and add a text, shape or symbol cue that explains the command without camera frames, motion or colour alone.",
        completionRequired: false,
      },
    ],
    rewardBindings: [
      {
        id: "rainbow-rescue-rover-m1-simulated-badge",
        badgeId: "rainbow-rescue-rover-mission-complete",
        goalIds: [
          "rainbow-rescue-rover-m1-starts",
          "rainbow-rescue-rover-m1-target-command",
          "rainbow-rescue-rover-m1-private-runtime",
        ],
        deterministic: true,
        random: false,
        tokenConvertible: false,
      },
    ],
    functionReference: [
      {
        id: "rainbow-rescue-rover-function-detect",
        signature: "detectColour(colour)",
        summary: "Selects one labelled colour result in the private simulator.",
        parameters: [
          {
            name: "colour",
            type: "string",
            description: "Use red, green, blue or yellow.",
          },
        ],
        effect: "Returns one simulator colour label and confidence state; it never opens a camera or receives a frame.",
        example: "detectColour(\"green\");",
      },
      {
        id: "rainbow-rescue-rover-function-locate",
        signature: "locateTarget(zone)",
        summary: "Places the simulated target in one labelled horizontal zone.",
        parameters: [
          {
            name: "zone",
            type: "string",
            description: "Use left, centre or right.",
          },
        ],
        effect: "Updates text, shape and coordinate cues in the simulator without analysing or storing an image.",
        example: "locateTarget(\"centre\");",
      },
      {
        id: "rainbow-rescue-rover-function-command",
        signature: "planSerialCommand(command)",
        summary: "Plans one bounded command label for the simulated rover link.",
        parameters: [
          {
            name: "command",
            type: "string",
            description: "Use forward, turn-left, turn-right or stop.",
          },
        ],
        effect: "Records a simulator-only command label; it never opens a serial port or activates motors.",
        example: "planSerialCommand(\"forward\");",
      },
      {
        id: "rainbow-rescue-rover-function-heartbeat",
        signature: "armHeartbeat(duration)",
        summary: "Arms a bounded simulated command heartbeat.",
        parameters: [
          {
            name: "duration",
            type: "whole number",
            description: "A bounded heartbeat from 250 to 1000 milliseconds.",
          },
        ],
        effect: "Records heartbeat telemetry so an uncertain simulator link becomes stopped; it cannot maintain physical movement.",
        example: "armHeartbeat(500);",
      },
      {
        id: "rainbow-rescue-rover-function-stop",
        signature: "failSafeStop()",
        summary: "Ends the integration simulation in a fail-safe stopped state.",
        parameters: [],
        effect: "Marks the private simulator stopped after the bounded command plan; it cannot activate, stop or otherwise control physical hardware.",
        example: "failSafeStop();",
      },
    ],
  },
  facilitator: {
    artifacts: [
      {
        id: "rainbow-rescue-rover-m1-answer-key",
        kind: "answer-key",
        audience: "facilitator",
        solutionBearing: true,
      },
      {
        id: "rainbow-rescue-rover-m1-protected-tests",
        kind: "protected-test",
        audience: "facilitator",
        solutionBearing: true,
      },
      {
        id: "rainbow-rescue-rover-m1-adult-hardware-guide",
        kind: "facilitator-note",
        audience: "facilitator",
        solutionBearing: true,
      },
    ],
    protectedGoals: [
      {
        id: "rainbow-rescue-rover-m1-protected-resilience",
        statement: "The simulator rejects unsupported colours, zones, serial commands, invalid heartbeats, missing stop calls and any camera, serial or physical-hardware request.",
        visibility: "protected",
        criterionIds: ["rainbow-rescue-rover-edge-one", "rainbow-rescue-rover-edge-two"],
        completionRequired: false,
        aiRequired: false,
      },
    ],
    prompts: [
      "Ask the learner to predict the labelled target, bounded command and final stopped state before suggesting one change.",
      "Use only authored function guidance and simulator telemetry; never request camera frames or give learner wiring, power or motor-control advice.",
      "Physical export stays unavailable until an adult acknowledges the exact manifest and every camera, computer, serial, rover and power component has bench-test evidence.",
    ],
  },
  hardware: {
    requirementsVersion: "1.0.0",
    hardwareIncluded: false,
    completePathItemIds: [
      "pico-2-w",
      "breadboard",
      "usb-data-cable",
      "jumper-wires",
      "verified-explorer",
      "pi-zero-2-w",
      "camera-3",
      "pi-storage-power",
    ],
    incrementalItemIds: [
      "verified-explorer",
      "pi-zero-2-w",
      "camera-3",
      "pi-storage-power",
    ],
    components: [
      { itemId: "pico-2-w", quantity: 1, acquisitionScope: "complete-path", verificationStatus: "pending-bench-test", compatibilityClaimed: false, physicalCompletionEligible: false },
      { itemId: "breadboard", quantity: 1, acquisitionScope: "complete-path", verificationStatus: "pending-bench-test", compatibilityClaimed: false, physicalCompletionEligible: false },
      { itemId: "usb-data-cable", quantity: 1, acquisitionScope: "complete-path", verificationStatus: "pending-bench-test", compatibilityClaimed: false, physicalCompletionEligible: false },
      { itemId: "jumper-wires", quantity: 12, acquisitionScope: "complete-path", verificationStatus: "pending-bench-test", compatibilityClaimed: false, physicalCompletionEligible: false },
      { itemId: "verified-explorer", quantity: 1, acquisitionScope: "incremental", verificationStatus: "pending-bench-test", compatibilityClaimed: false, physicalCompletionEligible: false },
      { itemId: "pi-zero-2-w", quantity: 1, acquisitionScope: "incremental", verificationStatus: "pending-bench-test", compatibilityClaimed: false, physicalCompletionEligible: false },
      { itemId: "camera-3", quantity: 1, acquisitionScope: "incremental", verificationStatus: "pending-bench-test", compatibilityClaimed: false, physicalCompletionEligible: false },
      { itemId: "pi-storage-power", quantity: 1, acquisitionScope: "incremental", verificationStatus: "pending-bench-test", compatibilityClaimed: false, physicalCompletionEligible: false },
    ],
    safeguards: {
      adultAssemblyRequired: true,
      adultAcknowledgementRequiredForExport: true,
      websiteMayControlHardware: false,
      simulatorCompletionAvailable: true,
      simulatedBadgeId: "rainbow-rescue-rover-mission-complete",
      physicalBadgeId: "rainbow-rescue-rover-physical-builder",
      physicalBadgeRequiresAdultSignoff: true,
      adultAssemblySteps: [
        "Confirm the exact bench-signed rover, Pi Zero 2 W, Camera Module 3 and correct Zero-series camera ribbon identities against the manifest.",
        "With all power disconnected, fit and inspect the camera ribbon, storage, Pi power, Pico data link and isolated rover assemblies using the adult guide.",
        "Complete local colour calibration, bounded serial-command, heartbeat, link-loss and fail-safe-stop tests with the wheels lifted clear of the surface.",
      ],
      powerRequirements: [
        "Use a separate regulated Raspberry Pi power supply for the Pi Zero 2 W and Camera Module 3.",
        "Use the verified switched protected motor supply for the rover; never power motors, the Pi Zero 2 W or Camera Module 3 from a Pico GPIO pin.",
        "Keep every power switch accessible and disconnect every source before changing the camera ribbon, storage, wiring, sensors, wheels or chassis parts.",
      ],
      cableRequirements: [
        "One known data-capable USB cable compatible with the Pico 2 W and Pi Zero 2 W serial plan.",
        "The correct Zero-series Camera Module 3 ribbon and adult-verified insulated rover and power connectors.",
      ],
      softwarePrerequisites: [
        "Current Raspberry Pi OS with supported rpicam and Picamera2 software on the family-owned Pi Zero 2 W.",
        "Supported Pico SDK toolchain and known-good recovery firmware with adult-owned heartbeat, link-loss and emergency-stop behaviour.",
        "A family-local colour-calibration utility that never uploads, publishes or transmits Camera Module 3 frames.",
      ],
      warnings: [
        "Hardware is not included with the module.",
        "No listed camera, computer, rover, serial or power configuration currently claims compatibility or physical-completion eligibility.",
        "Camera frames remain on the family Raspberry Pi and must never be submitted to Plasius, an agent service or a published project.",
        "The website never activates motors, opens a camera or serial port, and an uncertain or missing heartbeat must stop the physical rover.",
        "Moving wheels, pinch points, stalled motors, camera ribbon damage and unsuitable supplies can cause unsafe movement, heat or damage; adult assembly, calibration and testing are mandatory.",
        "The simulator and simulated badge remain available without physical equipment.",
      ],
      unrelatedHardwareNotRequired: [
        "cloud camera, object-recognition or face-recognition services",
        "microphone, speaker, location or biometric sensors",
        "public hosting, analytics, advertising or external network access",
      ],
    },
  },
};

/**
 * Original first mission for Rescue Crew Commander. The learner arranges a
 * typed visual program and can inspect its synchronized JavaScript projection,
 * while protected route and action-limit checks stay facilitator-only.
 */
export const RESCUE_CREW_COMMANDER_MISSION_ONE_AUTHORING_V1: MissionAuthoringBundleV1 = {
  version: MISSION_AUTHORING_CONTRACT_VERSION_V1,
  moduleId: "junior-coder.rescue-crew-commander",
  moduleVersion: "1.1.0",
  missionId: "rescue-crew-commander-mission-1",
  learner: {
    estimatedMinutes: 20,
    stages: [
      {
        kind: "learn",
        instruction: "Meet the helper, job, route and priority blocks and read what each block does in the synchronized JavaScript view.",
        artifactIds: ["rescue-crew-commander-m1-art"],
      },
      {
        kind: "predict",
        instruction: "Predict which helper will act first and which safe route it will follow.",
        artifactIds: [],
      },
      {
        kind: "build",
        instruction: "Arrange the visual blocks to give each helper one safe rescue job.",
        artifactIds: ["rescue-crew-commander-m1-program"],
      },
      {
        kind: "run",
        instruction: "Use the Run action button to watch the crew follow the typed visual program.",
        artifactIds: ["rescue-crew-commander-m1-program"],
      },
      {
        kind: "assess",
        instruction: "Run the visible and protected deterministic crew checks.",
        artifactIds: [],
      },
      {
        kind: "inspect",
        instruction: "Compare the highlighted block with the first goal that did not pass and inspect the matching JavaScript line.",
        artifactIds: [],
      },
      {
        kind: "fix",
        instruction: "Move or replace one job, route or priority block, then run the mission again.",
        artifactIds: ["rescue-crew-commander-m1-program"],
      },
      {
        kind: "explain",
        instruction: "Explain how job order and priority changed the crew state and rescue result.",
        artifactIds: [],
      },
      {
        kind: "reward",
        instruction: "Collect the evidence-bound badge when the score and private-simulator safety check pass.",
        artifactIds: [],
      },
    ],
    readinessChecks: [
      {
        id: "rescue-crew-commander-m1-find-priority",
        prompt: "Point to the block that decides which helper acts first.",
        scored: false,
      },
    ],
    artifacts: [
      {
        id: "rescue-crew-commander-m1-program",
        kind: "starter-code",
        audience: "learner",
        solutionBearing: false,
      },
      {
        id: "rescue-crew-commander-m1-art",
        kind: "starter-assets",
        audience: "learner",
        solutionBearing: false,
      },
      {
        id: "rescue-crew-commander-m1-printable",
        kind: "printable",
        audience: "learner",
        solutionBearing: false,
      },
    ],
    goals: [
      {
        id: "rescue-crew-commander-m1-starts",
        statement: "The typed visual program is structurally valid and starts.",
        visibility: "visible",
        criterionIds: ["rescue-crew-commander-build"],
        completionRequired: true,
        aiRequired: false,
      },
      {
        id: "rescue-crew-commander-m1-safe-jobs",
        statement: "Every helper receives one suitable job and the highest-priority rescue starts first.",
        visibility: "visible",
        criterionIds: [
          "rescue-crew-commander-goal-one",
          "rescue-crew-commander-goal-two",
        ],
        completionRequired: true,
        aiRequired: false,
      },
      {
        id: "rescue-crew-commander-m1-private-runtime",
        statement: "The crew stays inside the private simulator and follows only host-provided actions.",
        visibility: "visible",
        criterionIds: ["rescue-crew-commander-safety"],
        completionRequired: true,
        aiRequired: false,
      },
    ],
    interactions: [
      {
        id: "rescue-crew-commander-m1-reorder-blocks",
        description: "Change the order of typed job, route and priority blocks.",
        primaryMode: "drag",
        alternativeIds: ["rescue-crew-commander-m1-button-reorder"],
      },
      {
        id: "rescue-crew-commander-m1-run-control",
        description: "Start the private rescue-crew simulation.",
        primaryMode: "pointer",
        alternativeIds: ["rescue-crew-commander-m1-keyboard-run"],
      },
      {
        id: "rescue-crew-commander-m1-crew-motion",
        description: "Observe helpers change state and follow their assigned routes.",
        primaryMode: "motion",
        alternativeIds: ["rescue-crew-commander-m1-status-view"],
      },
    ],
    accessibilityAlternatives: [
      {
        id: "rescue-crew-commander-m1-button-reorder",
        modes: ["keyboard", "pointer"],
        equivalentOutcome: true,
        description: "Use labelled Move up and Move down buttons instead of dragging a visual block.",
      },
      {
        id: "rescue-crew-commander-m1-keyboard-run",
        modes: ["keyboard"],
        equivalentOutcome: true,
        description: "Press Enter or Space on the play-icon Run button to start the same preview.",
      },
      {
        id: "rescue-crew-commander-m1-status-view",
        modes: ["text", "symbol", "reduced-motion"],
        equivalentOutcome: true,
        description: "Read each helper's job, route, priority and state from the status list without animation or colour dependence.",
      },
    ],
    evidenceRequirements: [
      {
        id: "rescue-crew-commander-m1-assessment",
        goalIds: [
          "rescue-crew-commander-m1-starts",
          "rescue-crew-commander-m1-safe-jobs",
          "rescue-crew-commander-m1-private-runtime",
        ],
        kind: "assessment-result",
        retention: "entitlement",
        containsPersonalData: false,
      },
      {
        id: "rescue-crew-commander-m1-explanation",
        goalIds: ["rescue-crew-commander-m1-safe-jobs"],
        kind: "learner-explanation",
        retention: "attempt",
        containsPersonalData: false,
      },
    ],
    sideAdventures: [
      {
        id: "rescue-crew-commander-m1-remix",
        prompt: "Invent an original helper role and explain which safe route and priority it should receive.",
        completionRequired: false,
      },
    ],
    rewardBindings: [
      {
        id: "rescue-crew-commander-m1-badge",
        badgeId: "rescue-crew-commander-mission-complete",
        goalIds: [
          "rescue-crew-commander-m1-starts",
          "rescue-crew-commander-m1-safe-jobs",
          "rescue-crew-commander-m1-private-runtime",
        ],
        deterministic: true,
        random: false,
        tokenConvertible: false,
      },
    ],
  },
  facilitator: {
    artifacts: [
      {
        id: "rescue-crew-commander-m1-answer-key",
        kind: "answer-key",
        audience: "facilitator",
        solutionBearing: true,
      },
      {
        id: "rescue-crew-commander-m1-protected-tests",
        kind: "protected-test",
        audience: "facilitator",
        solutionBearing: true,
      },
    ],
    protectedGoals: [
      {
        id: "rescue-crew-commander-m1-protected-resilience",
        statement: "The interpreter rejects unknown blocks, duplicate assignments and programs over the action limit.",
        visibility: "protected",
        criterionIds: [
          "rescue-crew-commander-edge-one",
          "rescue-crew-commander-edge-two",
        ],
        completionRequired: false,
        aiRequired: false,
      },
    ],
    prompts: [
      "Ask the learner which helper should act first before suggesting a block change.",
      "Use the block reference, status list and visible goal; never reveal the protected assignment order or expected block sequence.",
    ],
  },
};

/**
 * Original first mission for Meteor Shield. Learners tune documented targeting,
 * energy and timing controls without receiving protected resource targets or
 * projectile answers.
 */
export const METEOR_SHIELD_MISSION_ONE_AUTHORING_V1: MissionAuthoringBundleV1 = {
  version: MISSION_AUTHORING_CONTRACT_VERSION_V1,
  moduleId: "junior-coder.meteor-shield",
  moduleVersion: "1.1.0",
  missionId: "meteor-shield-mission-1",
  learner: {
    estimatedMinutes: 20,
    stages: [
      {
        kind: "learn",
        instruction: "Read how target column, shield energy and launch delay change a rescue defence.",
        artifactIds: ["meteor-shield-m1-art"],
      },
      {
        kind: "predict",
        instruction: "Predict which rescue base the shield will protect first.",
        artifactIds: [],
      },
      {
        kind: "build",
        instruction: "Adjust the three documented settings in the starter JavaScript.",
        artifactIds: ["meteor-shield-m1-code"],
      },
      {
        kind: "run",
        instruction: "Use the Run action button to start the private meteor-wave preview.",
        artifactIds: ["meteor-shield-m1-code"],
      },
      {
        kind: "assess",
        instruction: "Run the visible and protected deterministic defence checks.",
        artifactIds: [],
      },
      {
        kind: "inspect",
        instruction: "Compare the highlighted setting with the first goal that did not pass.",
        artifactIds: [],
      },
      {
        kind: "fix",
        instruction: "Change one setting, run again and observe the energy and target telemetry.",
        artifactIds: ["meteor-shield-m1-code"],
      },
      {
        kind: "explain",
        instruction: "Explain how targeting and launch timing affected the remaining shield energy.",
        artifactIds: [],
      },
      {
        kind: "reward",
        instruction: "Collect the evidence-bound badge when the score and safety check pass.",
        artifactIds: [],
      },
    ],
    readinessChecks: [
      {
        id: "meteor-shield-m1-find-energy",
        prompt: "Point to the setting that limits how many shields can launch.",
        scored: false,
      },
    ],
    artifacts: [
      {
        id: "meteor-shield-m1-code",
        kind: "starter-code",
        audience: "learner",
        solutionBearing: false,
      },
      {
        id: "meteor-shield-m1-art",
        kind: "starter-assets",
        audience: "learner",
        solutionBearing: false,
      },
      {
        id: "meteor-shield-m1-printable",
        kind: "printable",
        audience: "learner",
        solutionBearing: false,
      },
    ],
    goals: [
      {
        id: "meteor-shield-m1-starts",
        statement: "The JavaScript settings are valid and the private preview starts.",
        visibility: "visible",
        criterionIds: ["meteor-shield-build"],
        completionRequired: true,
        aiRequired: false,
      },
      {
        id: "meteor-shield-m1-resource-defence",
        statement: "A shield launches toward the selected meteor while keeping enough energy for the next wave.",
        visibility: "visible",
        criterionIds: [
          "meteor-shield-goal-one",
          "meteor-shield-goal-two",
        ],
        completionRequired: true,
        aiRequired: false,
      },
      {
        id: "meteor-shield-m1-private-runtime",
        statement: "The game stays inside the private educational preview boundary.",
        visibility: "visible",
        criterionIds: ["meteor-shield-safety"],
        completionRequired: true,
        aiRequired: false,
      },
    ],
    interactions: [
      {
        id: "meteor-shield-m1-run-control",
        description: "Start the private meteor-wave simulation.",
        primaryMode: "pointer",
        alternativeIds: ["meteor-shield-m1-keyboard-run"],
      },
      {
        id: "meteor-shield-m1-target-control",
        description: "Move the targeting reticle between rescue columns and launch a shield.",
        primaryMode: "keyboard",
        alternativeIds: [],
      },
      {
        id: "meteor-shield-m1-wave-motion",
        description: "Observe meteors and shield pulses crossing the rescue zone.",
        primaryMode: "motion",
        alternativeIds: ["meteor-shield-m1-telemetry"],
      },
    ],
    accessibilityAlternatives: [
      {
        id: "meteor-shield-m1-keyboard-run",
        modes: ["keyboard"],
        equivalentOutcome: true,
        description: "Press Enter or Space on the play-icon Run button to start the same preview.",
      },
      {
        id: "meteor-shield-m1-telemetry",
        modes: ["text", "reduced-motion"],
        equivalentOutcome: true,
        description: "Use target column, wave, distance and energy text instead of projectile animation.",
      },
    ],
    evidenceRequirements: [
      {
        id: "meteor-shield-m1-assessment",
        goalIds: [
          "meteor-shield-m1-starts",
          "meteor-shield-m1-resource-defence",
          "meteor-shield-m1-private-runtime",
        ],
        kind: "assessment-result",
        retention: "entitlement",
        containsPersonalData: false,
      },
      {
        id: "meteor-shield-m1-explanation",
        goalIds: ["meteor-shield-m1-resource-defence"],
        kind: "learner-explanation",
        retention: "attempt",
        containsPersonalData: false,
      },
    ],
    sideAdventures: [
      {
        id: "meteor-shield-m1-remix",
        prompt: "Invent an original rescue-base signal and describe the safe game event that activates it.",
        completionRequired: false,
      },
    ],
    rewardBindings: [
      {
        id: "meteor-shield-m1-badge",
        badgeId: "meteor-shield-mission-complete",
        goalIds: [
          "meteor-shield-m1-starts",
          "meteor-shield-m1-resource-defence",
          "meteor-shield-m1-private-runtime",
        ],
        deterministic: true,
        random: false,
        tokenConvertible: false,
      },
    ],
  },
  facilitator: {
    artifacts: [
      {
        id: "meteor-shield-m1-answer-key",
        kind: "answer-key",
        audience: "facilitator",
        solutionBearing: true,
      },
      {
        id: "meteor-shield-m1-protected-tests",
        kind: "protected-test",
        audience: "facilitator",
        solutionBearing: true,
      },
    ],
    protectedGoals: [
      {
        id: "meteor-shield-m1-protected-resilience",
        statement: "The runtime clamps unsafe resources and terminates bounded projectile simulations.",
        visibility: "protected",
        criterionIds: [
          "meteor-shield-edge-one",
          "meteor-shield-edge-two",
        ],
        completionRequired: false,
        aiRequired: false,
      },
    ],
    prompts: [
      "Ask the learner which setting controls a limited resource before suggesting a code edit.",
      "Use visible telemetry and the function reference; never reveal protected numeric targets or expected source fragments.",
    ],
  },
};

/** Bounded first Vibe mission; no open prompt or provider is required. */
export const VIBE_GAME_REMIX_LAB_MISSION_ONE_AUTHORING_V1: MissionAuthoringBundleV1 = {
  version: MISSION_AUTHORING_CONTRACT_VERSION_V1,
  moduleId: "junior-coder.vibe-game-remix-lab",
  moduleVersion: "1.1.0",
  missionId: "vibe-game-remix-lab-mission-1",
  learner: {
    estimatedMinutes: 20,
    stages: [
      {
        kind: "learn",
        instruction: "Read how setRescueSpeed(), setGateSpacing() and setGoalCount() change the supplied mini-game.",
        artifactIds: ["vibe-game-remix-lab-m1-guide"],
      },
      {
        kind: "predict",
        instruction: "Choose one bounded intent card and predict what its one-line diff will change before viewing it.",
        artifactIds: ["vibe-game-remix-lab-m1-intent-cards"],
      },
      {
        kind: "build",
        instruction: "Open the supplied mini-game and keep changes inside its documented settings file.",
        artifactIds: ["vibe-game-remix-lab-m1-code"],
      },
      {
        kind: "run",
        instruction: "Use the Run action button to start the private JavaScript preview.",
        artifactIds: ["vibe-game-remix-lab-m1-code"],
      },
      {
        kind: "assess",
        instruction: "Run deterministic checks before requesting or applying any suggestion.",
        artifactIds: [],
      },
      {
        kind: "inspect",
        instruction: "Compare the single authored diff with your prediction and the failed goal evidence.",
        artifactIds: ["vibe-game-remix-lab-m1-code"],
      },
      {
        kind: "fix",
        instruction: "Accept or reject the proposed change yourself, then rerun the preview and assessment.",
        artifactIds: ["vibe-game-remix-lab-m1-code"],
      },
      {
        kind: "explain",
        instruction: "Explain why you accepted or rejected the change and what the new evidence shows.",
        artifactIds: [],
      },
      {
        kind: "reward",
        instruction: "Collect the evidence-bound badge after the deterministic score reaches 80 and every safety check passes.",
        artifactIds: [],
      },
    ],
    readinessChecks: [
      {
        id: "vibe-game-remix-lab-m1-find-setting",
        prompt: "Point to the documented function that changes how many rescue goals appear.",
        scored: false,
      },
    ],
    artifacts: [
      {
        id: "vibe-game-remix-lab-m1-code",
        kind: "starter-code",
        audience: "learner",
        solutionBearing: false,
      },
      {
        id: "vibe-game-remix-lab-m1-guide",
        kind: "starter-assets",
        audience: "learner",
        solutionBearing: false,
      },
      {
        id: "vibe-game-remix-lab-m1-intent-cards",
        kind: "printable",
        audience: "learner",
        solutionBearing: false,
      },
    ],
    goals: [
      {
        id: "vibe-game-remix-lab-m1-starts",
        statement: "The supplied JavaScript mini-game remains structurally valid and starts.",
        visibility: "visible",
        criterionIds: ["vibe-game-remix-lab-build"],
        completionRequired: true,
        aiRequired: false,
      },
      {
        id: "vibe-game-remix-lab-m1-bounded-remix",
        statement: "The approved one-file change matches the chosen intent and every published behaviour goal.",
        visibility: "visible",
        criterionIds: [
          "vibe-game-remix-lab-goal-one",
          "vibe-game-remix-lab-goal-two",
          "vibe-game-remix-lab-goal-three",
        ],
        completionRequired: true,
        aiRequired: false,
      },
      {
        id: "vibe-game-remix-lab-m1-private-runtime",
        statement: "The remix stays inside the private sandbox with no network, personal data or automatic code changes.",
        visibility: "visible",
        criterionIds: ["vibe-game-remix-lab-safety"],
        completionRequired: true,
        aiRequired: false,
      },
    ],
    interactions: [
      {
        id: "vibe-game-remix-lab-m1-run-control",
        description: "Start the supplied mini-game preview.",
        primaryMode: "pointer",
        alternativeIds: ["vibe-game-remix-lab-m1-keyboard-run"],
      },
      {
        id: "vibe-game-remix-lab-m1-diff-review",
        description: "Read the removed and added source line before choosing what to do.",
        primaryMode: "text",
        alternativeIds: [],
      },
      {
        id: "vibe-game-remix-lab-m1-accept-control",
        description: "Approve the exact immutable suggestion snapshot.",
        primaryMode: "pointer",
        alternativeIds: ["vibe-game-remix-lab-m1-keyboard-review"],
      },
      {
        id: "vibe-game-remix-lab-m1-reject-control",
        description: "Reject the suggestion and preserve the current source.",
        primaryMode: "pointer",
        alternativeIds: ["vibe-game-remix-lab-m1-keyboard-review"],
      },
    ],
    accessibilityAlternatives: [
      {
        id: "vibe-game-remix-lab-m1-keyboard-run",
        modes: ["keyboard"],
        equivalentOutcome: true,
        description: "Press Enter or Space on the play-icon Run button to start the same preview.",
      },
      {
        id: "vibe-game-remix-lab-m1-keyboard-review",
        modes: ["keyboard", "text", "reduced-motion"],
        equivalentOutcome: true,
        description: "Read the labelled removed and added lines, then focus Accept or Reject and press Enter or Space.",
      },
    ],
    evidenceRequirements: [
      {
        id: "vibe-game-remix-lab-m1-assessment",
        goalIds: [
          "vibe-game-remix-lab-m1-starts",
          "vibe-game-remix-lab-m1-bounded-remix",
          "vibe-game-remix-lab-m1-private-runtime",
        ],
        kind: "assessment-result",
        retention: "entitlement",
        containsPersonalData: false,
      },
      {
        id: "vibe-game-remix-lab-m1-explanation",
        goalIds: ["vibe-game-remix-lab-m1-bounded-remix"],
        kind: "learner-explanation",
        retention: "attempt",
        containsPersonalData: false,
      },
    ],
    sideAdventures: [
      {
        id: "vibe-game-remix-lab-m1-inventor",
        prompt: "Write a new bounded remix intent card with one permitted setting, one constraint and one success test.",
        completionRequired: false,
      },
    ],
    rewardBindings: [
      {
        id: "vibe-game-remix-lab-m1-badge",
        badgeId: "vibe-game-remix-lab-mission-complete",
        goalIds: [
          "vibe-game-remix-lab-m1-starts",
          "vibe-game-remix-lab-m1-bounded-remix",
          "vibe-game-remix-lab-m1-private-runtime",
        ],
        deterministic: true,
        random: false,
        tokenConvertible: false,
      },
    ],
    functionReference: [
      {
        id: "vibe-game-remix-lab-function-speed",
        signature: "setRescueSpeed(speed)",
        summary: "Sets the supplied rescue robot's bounded movement speed.",
        parameters: [{ name: "speed", type: "whole number", description: "A safe speed from 1 to 5." }],
        effect: "Changes only the private mini-game simulation speed.",
        example: "setRescueSpeed(3);",
      },
      {
        id: "vibe-game-remix-lab-function-spacing",
        signature: "setGateSpacing(spacing)",
        summary: "Sets the gap between original rescue gates.",
        parameters: [{ name: "spacing", type: "whole number", description: "A bounded spacing from 2 to 6." }],
        effect: "Changes only the generated gate layout in the private preview.",
        example: "setGateSpacing(4);",
      },
      {
        id: "vibe-game-remix-lab-function-goals",
        signature: "setGoalCount(count)",
        summary: "Chooses how many fictional rescue goals the round contains.",
        parameters: [{ name: "count", type: "whole number", description: "A bounded goal count from 1 to 4." }],
        effect: "Changes the labelled rescue-goal count without network or account access.",
        example: "setGoalCount(3);",
      },
    ],
    boundedSuggestion: {
      id: "vibe-game-remix-lab-m1-authored-goal-diff",
      source: "authored-fallback",
      intent: "Make the round contain one more rescue goal.",
      constraints: [
        "Change exactly one documented setting.",
        "Keep the goal count inside the published range.",
        "Do not add network, storage, DOM or account access.",
      ],
      permittedArtifactId: "vibe-game-remix-lab-m1-code",
      originalSnippet: "setGoalCount(2);",
      replacementSnippet: "setGoalCount(3);",
      explanationPrompt: "Did the new goal count match your prediction, and which assessment evidence proves it?",
      aiOptional: false,
      learnerApprovalRequired: true,
      alternatives: ["accept", "reject"],
    },
  },
  facilitator: {
    artifacts: [
      {
        id: "vibe-game-remix-lab-m1-answer-key",
        kind: "answer-key",
        audience: "facilitator",
        solutionBearing: true,
      },
      {
        id: "vibe-game-remix-lab-m1-protected-tests",
        kind: "protected-test",
        audience: "facilitator",
        solutionBearing: true,
      },
      {
        id: "vibe-game-remix-lab-m1-safety-notes",
        kind: "facilitator-note",
        audience: "facilitator",
        solutionBearing: true,
      },
    ],
    protectedGoals: [
      {
        id: "vibe-game-remix-lab-m1-protected-resilience",
        statement: "The sandbox rejects prompt injection, answer dumping, disallowed files, network access and changes outside the approved diff.",
        visibility: "protected",
        criterionIds: ["vibe-game-remix-lab-edge-one", "vibe-game-remix-lab-edge-two"],
        completionRequired: false,
        aiRequired: false,
      },
    ],
    prompts: [
      "Ask for the learner's prediction before revealing the authored diff.",
      "Do not invite free-form chat; keep intent, evidence and suggestions bound to the current project, rubric and permitted artifact.",
      "A rejection must leave source unchanged, and AI/provider failure must never block deterministic completion.",
    ],
  },
};

/** Evidence-led Vibe repair mission; no open prompt or provider is required. */
export const VIBE_BUG_DETECTIVE_MISSION_ONE_AUTHORING_V1: MissionAuthoringBundleV1 = {
  version: MISSION_AUTHORING_CONTRACT_VERSION_V1,
  moduleId: "junior-coder.vibe-bug-detective",
  moduleVersion: "1.1.0",
  missionId: "vibe-bug-detective-mission-1",
  learner: {
    estimatedMinutes: 20,
    stages: [
      {
        kind: "learn",
        instruction: "Read how setRobotDirection(), setRobotSteps() and placeRescueBeacon() control the supplied mini-game.",
        artifactIds: ["vibe-bug-detective-m1-guide"],
      },
      {
        kind: "predict",
        instruction: "Predict why the robot moves away from the beacon before viewing the one-line repair.",
        artifactIds: ["vibe-bug-detective-m1-evidence-card"],
      },
      {
        kind: "build",
        instruction: "Open the intentionally broken mini-game without changing files outside its documented settings artifact.",
        artifactIds: ["vibe-bug-detective-m1-code"],
      },
      {
        kind: "run",
        instruction: "Use the Run action button to reproduce the bug in the private JavaScript preview.",
        artifactIds: ["vibe-bug-detective-m1-code"],
      },
      {
        kind: "assess",
        instruction: "Run deterministic checks to collect failure evidence before reviewing any suggested fix.",
        artifactIds: [],
      },
      {
        kind: "inspect",
        instruction: "Compare observed leftward movement with the expected right-side beacon goal and the single authored diff.",
        artifactIds: ["vibe-bug-detective-m1-code"],
      },
      {
        kind: "fix",
        instruction: "Accept or reject the exact direction repair yourself, then rerun every regression check.",
        artifactIds: ["vibe-bug-detective-m1-code"],
      },
      {
        kind: "explain",
        instruction: "Explain which evidence identified the bug and why the minimal change fixed it without changing other behaviour.",
        artifactIds: [],
      },
      {
        kind: "reward",
        instruction: "Collect the evidence-bound badge after the deterministic score reaches 80 and every safety check passes.",
        artifactIds: [],
      },
    ],
    readinessChecks: [
      {
        id: "vibe-bug-detective-m1-read-evidence",
        prompt: "Point to the observed direction and the beacon position before choosing a repair.",
        scored: false,
      },
    ],
    artifacts: [
      {
        id: "vibe-bug-detective-m1-code",
        kind: "starter-code",
        audience: "learner",
        solutionBearing: false,
      },
      {
        id: "vibe-bug-detective-m1-guide",
        kind: "starter-assets",
        audience: "learner",
        solutionBearing: false,
      },
      {
        id: "vibe-bug-detective-m1-evidence-card",
        kind: "printable",
        audience: "learner",
        solutionBearing: false,
      },
    ],
    goals: [
      {
        id: "vibe-bug-detective-m1-starts",
        statement: "The intentionally broken JavaScript mini-game remains structurally valid and starts.",
        visibility: "visible",
        criterionIds: ["vibe-bug-detective-build"],
        completionRequired: true,
        aiRequired: false,
      },
      {
        id: "vibe-bug-detective-m1-repair",
        statement: "The robot travels three steps toward the right-side rescue beacon after one minimal direction repair.",
        visibility: "visible",
        criterionIds: [
          "vibe-bug-detective-goal-one",
          "vibe-bug-detective-goal-two",
          "vibe-bug-detective-goal-three",
        ],
        completionRequired: true,
        aiRequired: false,
      },
      {
        id: "vibe-bug-detective-m1-regression-safety",
        statement: "The repair preserves the bounded step and beacon settings inside the private sandbox.",
        visibility: "visible",
        criterionIds: ["vibe-bug-detective-safety"],
        completionRequired: true,
        aiRequired: false,
      },
    ],
    interactions: [
      {
        id: "vibe-bug-detective-m1-run-control",
        description: "Reproduce the supplied mini-game bug in the private preview.",
        primaryMode: "pointer",
        alternativeIds: ["vibe-bug-detective-m1-keyboard-run"],
      },
      {
        id: "vibe-bug-detective-m1-diff-review",
        description: "Read the labelled removed and added direction lines beside the assessment evidence.",
        primaryMode: "text",
        alternativeIds: [],
      },
      {
        id: "vibe-bug-detective-m1-accept-control",
        description: "Approve the exact immutable repair snapshot.",
        primaryMode: "pointer",
        alternativeIds: ["vibe-bug-detective-m1-keyboard-review"],
      },
      {
        id: "vibe-bug-detective-m1-reject-control",
        description: "Reject the repair and preserve the current broken source.",
        primaryMode: "pointer",
        alternativeIds: ["vibe-bug-detective-m1-keyboard-review"],
      },
    ],
    accessibilityAlternatives: [
      {
        id: "vibe-bug-detective-m1-keyboard-run",
        modes: ["keyboard"],
        equivalentOutcome: true,
        description: "Press Enter or Space on the play-icon Run button to reproduce the same bug.",
      },
      {
        id: "vibe-bug-detective-m1-keyboard-review",
        modes: ["keyboard", "text", "reduced-motion"],
        equivalentOutcome: true,
        description: "Read the text evidence and labelled diff, then focus Accept or Reject and press Enter or Space.",
      },
    ],
    evidenceRequirements: [
      {
        id: "vibe-bug-detective-m1-assessment",
        goalIds: [
          "vibe-bug-detective-m1-starts",
          "vibe-bug-detective-m1-repair",
          "vibe-bug-detective-m1-regression-safety",
        ],
        kind: "assessment-result",
        retention: "entitlement",
        containsPersonalData: false,
      },
      {
        id: "vibe-bug-detective-m1-explanation",
        goalIds: ["vibe-bug-detective-m1-repair"],
        kind: "learner-explanation",
        retention: "attempt",
        containsPersonalData: false,
      },
    ],
    sideAdventures: [
      {
        id: "vibe-bug-detective-m1-regression-inventor",
        prompt: "Invent one extra regression test that proves the robot still stops at the rescue beacon.",
        completionRequired: false,
      },
    ],
    rewardBindings: [
      {
        id: "vibe-bug-detective-m1-badge",
        badgeId: "vibe-bug-detective-mission-complete",
        goalIds: [
          "vibe-bug-detective-m1-starts",
          "vibe-bug-detective-m1-repair",
          "vibe-bug-detective-m1-regression-safety",
        ],
        deterministic: true,
        random: false,
        tokenConvertible: false,
      },
    ],
    functionReference: [
      {
        id: "vibe-bug-detective-function-direction",
        signature: "setRobotDirection(direction)",
        summary: "Chooses the horizontal direction used by the supplied rescue robot.",
        parameters: [{ name: "direction", type: "text", description: "Use left or right." }],
        effect: "Changes only the labelled movement direction in the private mini-game.",
        example: "setRobotDirection(\"right\");",
      },
      {
        id: "vibe-bug-detective-function-steps",
        signature: "setRobotSteps(count)",
        summary: "Chooses how many bounded grid steps the robot attempts.",
        parameters: [{ name: "count", type: "whole number", description: "A bounded count from 1 to 4." }],
        effect: "Changes the private preview path length without controlling physical hardware.",
        example: "setRobotSteps(3);",
      },
      {
        id: "vibe-bug-detective-function-beacon",
        signature: "placeRescueBeacon(position)",
        summary: "Places the fictional rescue beacon on one labelled side.",
        parameters: [{ name: "position", type: "text", description: "Use left or right." }],
        effect: "Changes only the fictional beacon position in the private preview.",
        example: "placeRescueBeacon(\"right\");",
      },
    ],
    boundedSuggestion: {
      id: "vibe-bug-detective-m1-authored-direction-repair",
      source: "authored-fallback",
      intent: "Make the robot move toward the right-side rescue beacon.",
      constraints: [
        "Change exactly one documented direction setting.",
        "Preserve the step count and beacon position.",
        "Do not add network, storage, DOM, account or physical hardware access.",
      ],
      permittedArtifactId: "vibe-bug-detective-m1-code",
      originalSnippet: "setRobotDirection(\"left\");",
      replacementSnippet: "setRobotDirection(\"right\");",
      explanationPrompt: "Which observed-versus-expected evidence identified the direction bug, and which regression result proves the repair?",
      aiOptional: false,
      learnerApprovalRequired: true,
      alternatives: ["accept", "reject"],
    },
  },
  facilitator: {
    artifacts: [
      {
        id: "vibe-bug-detective-m1-answer-key",
        kind: "answer-key",
        audience: "facilitator",
        solutionBearing: true,
      },
      {
        id: "vibe-bug-detective-m1-protected-tests",
        kind: "protected-test",
        audience: "facilitator",
        solutionBearing: true,
      },
      {
        id: "vibe-bug-detective-m1-safety-notes",
        kind: "facilitator-note",
        audience: "facilitator",
        solutionBearing: true,
      },
    ],
    protectedGoals: [
      {
        id: "vibe-bug-detective-m1-protected-regressions",
        statement: "The repaired sandbox rejects extra statements, disallowed values, prompt injection, answer dumping, network access and changes outside the approved diff.",
        visibility: "protected",
        criterionIds: ["vibe-bug-detective-edge-one", "vibe-bug-detective-edge-two"],
        completionRequired: false,
        aiRequired: false,
      },
    ],
    prompts: [
      "Ask the learner to describe observed and expected directions before revealing the authored repair.",
      "Keep every diagnostic choice tied to the current failing goal and permitted artifact; never invite free-form chat.",
      "A rejection must preserve the broken source, and AI/provider failure must never block deterministic repair or regression checks.",
    ],
  },
};

/** Original first-mission exemplar; no protected content appears in learner data. */
export const ROAD_HOPPER_RALLY_MISSION_ONE_AUTHORING_V1: MissionAuthoringBundleV1 = {
  version: MISSION_AUTHORING_CONTRACT_VERSION_V1,
  moduleId: "junior-coder.road-hopper-rally",
  moduleVersion: "1.1.0",
  missionId: "road-hopper-rally-mission-1",
  learner: {
    estimatedMinutes: 20,
    stages: [
      {
        kind: "learn",
        instruction: "Find the x and y coordinates that place a rescue marker on the road.",
        artifactIds: ["road-hopper-rally-m1-art"],
      },
      {
        kind: "predict",
        instruction: "Predict where the marker will appear before you run the starter project.",
        artifactIds: [],
      },
      {
        kind: "build",
        instruction: "Complete the two road-lane drawing commands in the starter code.",
        artifactIds: ["road-hopper-rally-m1-code"],
      },
      {
        kind: "run",
        instruction: "Run the private preview and use the keyboard start control.",
        artifactIds: ["road-hopper-rally-m1-code"],
      },
      {
        kind: "assess",
        instruction: "Run the visible and protected deterministic mission checks.",
        artifactIds: [],
      },
      {
        kind: "inspect",
        instruction: "Compare the highlighted line with the goal that did not pass.",
        artifactIds: [],
      },
      {
        kind: "fix",
        instruction: "Change one coordinate or drawing command, then run the checks again.",
        artifactIds: ["road-hopper-rally-m1-code"],
      },
      {
        kind: "explain",
        instruction: "Explain how your coordinates changed the road on screen.",
        artifactIds: [],
      },
      {
        kind: "reward",
        instruction: "Collect the evidence-bound badge when the mission score and safety check pass.",
        artifactIds: [],
      },
    ],
    readinessChecks: [
      {
        id: "road-hopper-rally-m1-predict-coordinate",
        prompt: "Point to the pair of numbers that controls horizontal and vertical position.",
        scored: false,
      },
    ],
    artifacts: [
      {
        id: "road-hopper-rally-m1-code",
        kind: "starter-code",
        audience: "learner",
        solutionBearing: false,
      },
      {
        id: "road-hopper-rally-m1-art",
        kind: "starter-assets",
        audience: "learner",
        solutionBearing: false,
      },
    ],
    goals: [
      {
        id: "road-hopper-rally-m1-starts",
        statement: "The starter project is structurally valid and starts.",
        visibility: "visible",
        criterionIds: ["road-hopper-rally-build"],
        completionRequired: true,
        aiRequired: false,
      },
      {
        id: "road-hopper-rally-m1-draws-road",
        statement: "Two original road lanes appear at the expected coordinates.",
        visibility: "visible",
        criterionIds: ["road-hopper-rally-goal-one"],
        completionRequired: true,
        aiRequired: false,
      },
      {
        id: "road-hopper-rally-m1-safe-preview",
        statement: "The project stays inside the private educational preview boundary.",
        visibility: "visible",
        criterionIds: ["road-hopper-rally-safety"],
        completionRequired: true,
        aiRequired: false,
      },
    ],
    interactions: [
      {
        id: "road-hopper-rally-m1-start-control",
        description: "Start the private preview.",
        primaryMode: "pointer",
        alternativeIds: ["road-hopper-rally-m1-keyboard-start"],
      },
    ],
    accessibilityAlternatives: [
      {
        id: "road-hopper-rally-m1-keyboard-start",
        modes: ["keyboard"],
        equivalentOutcome: true,
        description: "Start the same preview with Enter while the control has focus.",
      },
    ],
    evidenceRequirements: [
      {
        id: "road-hopper-rally-m1-assessment",
        goalIds: [
          "road-hopper-rally-m1-starts",
          "road-hopper-rally-m1-draws-road",
          "road-hopper-rally-m1-safe-preview",
        ],
        kind: "assessment-result",
        retention: "entitlement",
        containsPersonalData: false,
      },
      {
        id: "road-hopper-rally-m1-explanation",
        goalIds: ["road-hopper-rally-m1-draws-road"],
        kind: "learner-explanation",
        retention: "attempt",
        containsPersonalData: false,
      },
    ],
    sideAdventures: [
      {
        id: "road-hopper-rally-m1-remix",
        prompt: "Remix the lane colours while keeping text or shape cues available.",
        completionRequired: false,
      },
    ],
    rewardBindings: [
      {
        id: "road-hopper-rally-m1-badge",
        badgeId: "road-hopper-rally-mission-complete",
        goalIds: [
          "road-hopper-rally-m1-starts",
          "road-hopper-rally-m1-draws-road",
          "road-hopper-rally-m1-safe-preview",
        ],
        deterministic: true,
        random: false,
        tokenConvertible: false,
      },
    ],
  },
  facilitator: {
    artifacts: [
      {
        id: "road-hopper-rally-m1-answer-key",
        kind: "answer-key",
        audience: "facilitator",
        solutionBearing: true,
      },
      {
        id: "road-hopper-rally-m1-protected-tests",
        kind: "protected-test",
        audience: "facilitator",
        solutionBearing: true,
      },
    ],
    protectedGoals: [
      {
        id: "road-hopper-rally-m1-protected-edge",
        statement: "The drawing remains bounded when a protected coordinate edge case runs.",
        visibility: "protected",
        criterionIds: ["road-hopper-rally-edge-one"],
        completionRequired: false,
        aiRequired: false,
      },
    ],
    prompts: [
      "Ask the learner to predict one coordinate before offering a hint.",
      "Do not reveal protected expected values; point back to the visible goal.",
    ],
  },
};
