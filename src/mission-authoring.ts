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
