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
