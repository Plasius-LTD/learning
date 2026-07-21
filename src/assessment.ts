import type {
  AssessmentCheckResultV1,
  AssessmentResultV1,
  AssessmentRubricV1,
  ScoreBandV1,
} from "./contracts.js";

function scoreBand(score: number): ScoreBandV1 {
  if (score >= 95) return "mastered";
  if (score >= 80) return "mission-complete";
  if (score >= 60) return "nearly-there";
  return "keep-exploring";
}

/**
 * Calculate a score solely from rubric criteria and objective check results.
 * Missing criteria fail closed; unknown and duplicate result IDs are rejected.
 */
export function calculateAssessment(
  rubric: AssessmentRubricV1,
  results: AssessmentCheckResultV1[],
): AssessmentResultV1 {
  const knownIds = new Set(rubric.criteria.map((criterion) => criterion.id));
  const resultById = new Map<string, AssessmentCheckResultV1>();

  for (const result of results) {
    if (!knownIds.has(result.criterionId)) {
      throw new Error(`Unknown assessment criterion: ${result.criterionId}`);
    }
    if (resultById.has(result.criterionId)) {
      throw new Error(`Duplicate assessment result: ${result.criterionId}`);
    }
    resultById.set(result.criterionId, result);
  }

  let score = 0;
  const passedCriterionIds: string[] = [];
  const failedCriterionIds: string[] = [];
  const failedMandatoryCriterionIds: string[] = [];

  for (const criterion of rubric.criteria) {
    const passed = resultById.get(criterion.id)?.passed === true;
    if (passed) {
      score += criterion.points;
      passedCriterionIds.push(criterion.id);
      continue;
    }

    failedCriterionIds.push(criterion.id);
    if (criterion.mandatory) failedMandatoryCriterionIds.push(criterion.id);
  }

  return {
    score,
    band: scoreBand(score),
    completed:
      score >= rubric.completionScore && failedMandatoryCriterionIds.length === 0,
    passedCriterionIds,
    failedCriterionIds,
    failedMandatoryCriterionIds,
  };
}
