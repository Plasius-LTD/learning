import type {
  AssessmentDimensionV1,
  LearningModuleVersionV1,
  LearningPathVersionV1,
  LearningValidationIssueV1,
} from "./contracts.js";

const DIMENSION_TOTALS: Record<AssessmentDimensionV1, number> = {
  structure: 20,
  behaviour: 50,
  resilience: 20,
  safety: 10,
};

const CANONICAL_TOKEN_SUBUNITS = /^(0|[1-9][0-9]*)$/u;

function issue(
  code: LearningValidationIssueV1["code"],
  message: string,
  path: string,
  moduleId?: string,
): LearningValidationIssueV1 {
  return { code, message, path, ...(moduleId ? { moduleId } : {}) };
}

function validateModule(
  module: LearningModuleVersionV1,
  moduleIndex: number,
): LearningValidationIssueV1[] {
  const issues: LearningValidationIssueV1[] = [];
  const base = `modules[${moduleIndex}]`;

  if (!module.selfContained) {
    issues.push(
      issue(
        "module-not-self-contained",
        "Every sellable module must be self-contained.",
        `${base}.selfContained`,
        module.id,
      ),
    );
  }

  if (module.prerequisiteModuleIds.length > 0) {
    issues.push(
      issue(
        "paid-prerequisite",
        "A sellable module cannot require another paid module.",
        `${base}.prerequisiteModuleIds`,
        module.id,
      ),
    );
  }

  if (
    module.materials.learner.length === 0 ||
    module.materials.facilitator.length === 0
  ) {
    issues.push(
      issue(
        "missing-materials",
        "Learner and facilitator material manifests are both required.",
        `${base}.materials`,
        module.id,
      ),
    );
  }

  if (module.materials.learner.some((material) => material.audience !== "learner")) {
    issues.push(
      issue(
        "facilitator-material-leak",
        "Learner material contains a facilitator-only record.",
        `${base}.materials.learner`,
        module.id,
      ),
    );
  }

  if (
    module.materials.facilitator.some(
      (material) => material.audience !== "facilitator",
    )
  ) {
    issues.push(
      issue(
        "learner-material-leak",
        "Facilitator material contains a learner record.",
        `${base}.materials.facilitator`,
        module.id,
      ),
    );
  }

  if (!CANONICAL_TOKEN_SUBUNITS.test(module.pricing.tokenSubunits)) {
    issues.push(
      issue(
        "invalid-token-subunits",
        "Token subunits must be a canonical non-negative base-10 integer string.",
        `${base}.pricing.tokenSubunits`,
        module.id,
      ),
    );
  }

  const referencePrice = module.pricing.referencePrice;
  if (
    referencePrice
    && (
      referencePrice.currency !== "GBP"
      || !CANONICAL_TOKEN_SUBUNITS.test(referencePrice.minorUnits)
      || referencePrice.basis !== "nominal-reference"
      || referencePrice.cashRedemptionAllowed !== false
    )
  ) {
    issues.push(
      issue(
        "invalid-reference-price",
        "Reference prices must use canonical GBP minor units, the nominal reference basis and prohibit cash redemption.",
        `${base}.pricing.referencePrice`,
        module.id,
      ),
    );
  }

  const criterionIds = new Set<string>();
  const dimensionTotals: Record<AssessmentDimensionV1, number> = {
    structure: 0,
    behaviour: 0,
    resilience: 0,
    safety: 0,
  };
  let rubricTotal = 0;

  for (const criterion of module.assessment.criteria) {
    rubricTotal += criterion.points;
    dimensionTotals[criterion.dimension] += criterion.points;
    if (criterionIds.has(criterion.id)) {
      issues.push(
        issue(
          "duplicate-criterion-id",
          `Duplicate assessment criterion ${criterion.id}.`,
          `${base}.assessment.criteria`,
          module.id,
        ),
      );
    }
    criterionIds.add(criterion.id);
  }

  if (rubricTotal !== 100) {
    issues.push(
      issue(
        "rubric-total",
        `Assessment rubric totals ${rubricTotal}; expected 100.`,
        `${base}.assessment.criteria`,
        module.id,
      ),
    );
  }

  for (const [dimension, expected] of Object.entries(DIMENSION_TOTALS) as Array<
    [AssessmentDimensionV1, number]
  >) {
    if (dimensionTotals[dimension] !== expected) {
      issues.push(
        issue(
          "rubric-dimension-total",
          `${dimension} criteria total ${dimensionTotals[dimension]}; expected ${expected}.`,
          `${base}.assessment.criteria`,
          module.id,
        ),
      );
    }
  }

  if (
    !module.assessment.criteria.some(
      (criterion) => criterion.dimension === "safety" && criterion.mandatory,
    )
  ) {
    issues.push(
      issue(
        "missing-mandatory-safety",
        "Every module requires a mandatory safety criterion.",
        `${base}.assessment.criteria`,
        module.id,
      ),
    );
  }

  if (module.hardware.mode === "physical-first" && module.hardware.items.length === 0) {
    issues.push(
      issue(
        "missing-hardware-items",
        "Physical-first modules require an exact hardware item list.",
        `${base}.hardware.items`,
        module.id,
      ),
    );
  }

  if (
    module.agents.some(
      (agent) =>
        agent.mayAssignScore !== false ||
        agent.mayAwardReward !== false ||
        agent.mayPublish !== false ||
        agent.mayControlHardware !== false,
    )
  ) {
    issues.push(
      issue(
        "invalid-agent-authority",
        "Module agents cannot own scores, rewards, publishing or hardware control.",
        `${base}.agents`,
        module.id,
      ),
    );
  }

  if (module.missions.length === 0) {
    issues.push(
      issue(
        "missing-missions",
        "A module requires at least one mission.",
        `${base}.missions`,
        module.id,
      ),
    );
  }

  return issues;
}

/** Return every catalog issue without throwing, suitable for authoring tools. */
export function validateLearningPath(
  path: LearningPathVersionV1,
): LearningValidationIssueV1[] {
  const issues: LearningValidationIssueV1[] = [];
  const moduleIds = new Set<string>();
  const moduleSlugs = new Set<string>();

  for (const [index, module] of path.modules.entries()) {
    if (moduleIds.has(module.id)) {
      issues.push(
        issue(
          "duplicate-module-id",
          `Duplicate module id ${module.id}.`,
          `modules[${index}].id`,
          module.id,
        ),
      );
    }
    moduleIds.add(module.id);

    if (moduleSlugs.has(module.slug)) {
      issues.push(
        issue(
          "duplicate-module-slug",
          `Duplicate module slug ${module.slug}.`,
          `modules[${index}].slug`,
          module.id,
        ),
      );
    }
    moduleSlugs.add(module.slug);
    issues.push(...validateModule(module, index));
  }

  return issues;
}

/** Fail fast when a path is not safe to publish or consume. */
export function assertValidLearningPath(path: LearningPathVersionV1): void {
  const issues = validateLearningPath(path);
  if (issues.length === 0) return;

  const summary = issues
    .map((entry) => `${entry.code} at ${entry.path}: ${entry.message}`)
    .join("\n");
  throw new Error(`Invalid learning path:\n${summary}`);
}
