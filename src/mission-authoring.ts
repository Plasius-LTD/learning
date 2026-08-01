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
