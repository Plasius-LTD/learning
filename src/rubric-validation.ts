import type {
  AssessmentDimensionV1,
  AssessmentRubricV1,
  LearningValidationIssueV1,
} from "./contracts.js";

const DIMENSION_TOTALS: Record<AssessmentDimensionV1, number> = {
  structure: 20,
  behaviour: 50,
  resilience: 20,
  safety: 10,
};

function rubricIssue(
  code: LearningValidationIssueV1["code"],
  message: string,
  path: string,
  moduleId?: string,
): LearningValidationIssueV1 {
  return { code, message, path, ...(moduleId ? { moduleId } : {}) };
}

/** Validate the deterministic 20/50/20/10 assessment authority. */
export function validateAssessmentRubric(
  rubric: AssessmentRubricV1,
  path = "assessment",
  moduleId?: string,
): LearningValidationIssueV1[] {
  const issues: LearningValidationIssueV1[] = [];
  const criterionIds = new Set<string>();
  const dimensionTotals: Record<AssessmentDimensionV1, number> = {
    structure: 0,
    behaviour: 0,
    resilience: 0,
    safety: 0,
  };
  let rubricTotal = 0;

  for (const criterion of rubric.criteria) {
    rubricTotal += criterion.points;
    dimensionTotals[criterion.dimension] += criterion.points;
    if (criterionIds.has(criterion.id)) {
      issues.push(
        rubricIssue(
          "duplicate-criterion-id",
          `Duplicate assessment criterion ${criterion.id}.`,
          `${path}.criteria`,
          moduleId,
        ),
      );
    }
    criterionIds.add(criterion.id);
  }

  if (rubricTotal !== 100) {
    issues.push(
      rubricIssue(
        "rubric-total",
        `Assessment rubric totals ${rubricTotal}; expected 100.`,
        `${path}.criteria`,
        moduleId,
      ),
    );
  }

  for (const [dimension, expected] of Object.entries(DIMENSION_TOTALS) as Array<
    [AssessmentDimensionV1, number]
  >) {
    if (dimensionTotals[dimension] !== expected) {
      issues.push(
        rubricIssue(
          "rubric-dimension-total",
          `${dimension} criteria total ${dimensionTotals[dimension]}; expected ${expected}.`,
          `${path}.criteria`,
          moduleId,
        ),
      );
    }
  }

  if (
    !rubric.criteria.some(
      (criterion) => criterion.dimension === "safety" && criterion.mandatory,
    )
  ) {
    issues.push(
      rubricIssue(
        "missing-mandatory-safety",
        "Every module requires a mandatory safety criterion.",
        `${path}.criteria`,
        moduleId,
      ),
    );
  }

  return issues;
}
