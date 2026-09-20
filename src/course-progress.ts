import { calculateAssessment } from "./assessment.js";
import { validateAssessmentRubric } from "./rubric-validation.js";
import type { AssessmentCheckResultV1, AssessmentResultV1, AssessmentRubricV1 } from "./contracts.js";
import { LearningCourseInputError, validateLearningCourse, type LearningCourseV1 } from "./course-contracts.js";

/** Stored host-issued assessment. No browser-supplied result may construct this authority. */
export interface LearningCourseAssessmentRecordV1 {
  missionId: string;
  assessmentId: string;
  referenceId: string;
  sourceDigest: string;
  result: AssessmentResultV1;
}
/** Account and timestamps are supplied by the storage adapter, not the contract. */
export interface LearningCourseProgressV1 {
  schemaVersion: "1";
  moduleId: string;
  moduleVersion: string;
  completedStageIds: string[];
  completedMissionIds: string[];
  assessments: LearningCourseAssessmentRecordV1[];
  completion: { referenceId: string; sourceDigest: string; bestScore: number } | null;
}
/** Construct only after the host validates the activity-specific learner input. */
export interface VerifiedLearningActivityV1 {
  stageId: string;
  sourceDigest: string;
  accepted: boolean;
}
/** Rubric and check results come from trusted assessment execution, never a save body. */
export interface LearningCourseAssessmentAuthorityV1 {
  missionId: string;
  assessmentId: string;
  referenceId: string;
  sourceDigest: string;
  rubric: AssessmentRubricV1;
  checks: AssessmentCheckResultV1[];
}
const DIGEST = /^[a-f0-9]{64}$/u;
const REFERENCE = /^[a-z0-9][a-z0-9.-]{0,159}$/u;
const stages = (course: LearningCourseV1) => course.missions.flatMap(mission => mission.stages);
const record = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const keys = (value: Record<string, unknown>, expected: string[]) => Object.keys(value).length === expected.length && expected.every(key => Object.hasOwn(value, key));
const identifier = (value: unknown): value is string => typeof value === "string" && REFERENCE.test(value);
const digest = (value: unknown): value is string => typeof value === "string" && DIGEST.test(value);

function validResult(value: unknown): value is AssessmentResultV1 {
  if (!record(value) || !keys(value, ["score", "band", "completed", "passedCriterionIds", "failedCriterionIds", "failedMandatoryCriterionIds"])
    || typeof value.score !== "number" || !Number.isInteger(value.score) || value.score < 0 || value.score > 100) return false;
  const arrays = [value.passedCriterionIds, value.failedCriterionIds, value.failedMandatoryCriterionIds];
  if (arrays.some(items => !Array.isArray(items) || items.length > 64 || !items.every(identifier) || new Set(items).size !== items.length)) return false;
  const passed = value.passedCriterionIds as string[];
  const failed = value.failedCriterionIds as string[];
  const mandatory = value.failedMandatoryCriterionIds as string[];
  const band = value.score >= 95 ? "mastered" : value.score >= 80 ? "mission-complete" : value.score >= 60 ? "nearly-there" : "keep-exploring";
  return value.band === band && value.completed === (value.score >= 80 && mandatory.length === 0)
    && !passed.some(id => failed.includes(id)) && mandatory.every(id => failed.includes(id));
}

function assertProgress(course: LearningCourseV1, progress: LearningCourseProgressV1): void {
  const ordered = stages(course);
  if (progress.schemaVersion !== "1" || progress.moduleId !== course.moduleId || progress.moduleVersion !== course.moduleVersion
    || !Array.isArray(progress.completedStageIds) || progress.completedStageIds.length > ordered.length
    || progress.completedStageIds.some((id, index) => id !== ordered[index]!.id)
    || !Array.isArray(progress.completedMissionIds)
    || progress.completedMissionIds.length !== Math.floor(progress.completedStageIds.length / 9)
    || progress.completedMissionIds.some((id, index) => id !== course.missions[index]!.id)
    || !Array.isArray(progress.assessments) || progress.assessments.length > 7
    || progress.assessments.some(item => {
      if (!record(item) || !keys(item, ["missionId", "assessmentId", "referenceId", "sourceDigest", "result"])
        || !identifier(item.referenceId) || !digest(item.sourceDigest) || !validResult(item.result)) return true;
      const mission = course.missions.find(candidate => candidate.id === item.missionId);
      return item.missionId === "final"
        ? progress.completedMissionIds.length !== 6 || item.assessmentId !== course.completionAssessmentId
        : !mission || item.assessmentId !== mission.assessmentId;
    })
    || new Set(progress.assessments.map(item => item.missionId)).size !== progress.assessments.length
    || new Set(progress.assessments.map(item => item.referenceId)).size !== progress.assessments.length) throw new LearningCourseInputError();
  if (progress.completion !== null && (!record(progress.completion)
    || !keys(progress.completion, ["referenceId", "sourceDigest", "bestScore"])
    || progress.completedMissionIds.length !== 6 || !identifier(progress.completion.referenceId)
    || !digest(progress.completion.sourceDigest) || !Number.isInteger(progress.completion.bestScore)
    || progress.completion.bestScore < 80 || progress.completion.bestScore > 100)) throw new LearningCourseInputError();
}

/** Parse storage-owned progress. This is not an accepted browser mutation shape. */
export function parseLearningCourseProgress(course: LearningCourseV1, value: unknown): LearningCourseProgressV1 {
  if (!record(value) || !keys(value, ["schemaVersion", "moduleId", "moduleVersion", "completedStageIds", "completedMissionIds", "assessments", "completion"])) throw new LearningCourseInputError();
  assertProgress(course, value as unknown as LearningCourseProgressV1);
  return structuredClone(value as unknown as LearningCourseProgressV1);
}

/** Fresh course progress cannot inherit completion from project files or an old version. */
export function createLearningCourseProgress(course: LearningCourseV1): LearningCourseProgressV1 {
  if (validateLearningCourse(course).length) throw new LearningCourseInputError();
  return { schemaVersion: "1", moduleId: course.moduleId, moduleVersion: course.moduleVersion,
    completedStageIds: [], completedMissionIds: [], assessments: [], completion: null };
}

/** Saved navigation may revisit earned activities but cannot unlock later activities. */
export function resolveLearningCourseStage(course: LearningCourseV1, progress: LearningCourseProgressV1, requestedId: string): string {
  assertProgress(course, progress);
  const ordered = stages(course);
  const maximum = Math.min(progress.completedStageIds.length, ordered.length - 1);
  const requestedIndex = ordered.findIndex(stage => stage.id === requestedId);
  return requestedIndex >= 0 && requestedIndex <= maximum ? requestedId : ordered[maximum]!.id;
}

/**
 * Record checks from a host-owned deterministic runner using the existing rubric
 * calculator. A final assessment must cover the whole accumulated project.
 * Hosts bind reference IDs and source digests to their authenticated transaction.
 */
export function recordLearningCourseAssessment(
  course: LearningCourseV1, progress: LearningCourseProgressV1, authority: LearningCourseAssessmentAuthorityV1,
): LearningCourseProgressV1 {
  assertProgress(course, progress);
  const final = authority.missionId === "final";
  const missionIndex = course.missions.findIndex(mission => mission.id === authority.missionId);
  if (!DIGEST.test(authority.sourceDigest) || !REFERENCE.test(authority.referenceId)
    || (final ? progress.completedMissionIds.length !== course.missions.length
      : missionIndex < 0 || missionIndex > progress.completedMissionIds.length)
    || authority.assessmentId !== (final ? course.completionAssessmentId : course.missions[missionIndex]?.assessmentId)
    || authority.rubric.version !== course.moduleVersion
    || authority.rubric.criteria.length > 64 || authority.checks.length > 64
    || authority.checks.some(check => typeof check.passed !== "boolean")
    || validateAssessmentRubric(authority.rubric).length) throw new LearningCourseInputError();
  let result: AssessmentResultV1;
  try { result = calculateAssessment(authority.rubric, authority.checks); }
  catch { throw new LearningCourseInputError(); }
  const assessment: LearningCourseAssessmentRecordV1 = {
    missionId: authority.missionId, assessmentId: authority.assessmentId, referenceId: authority.referenceId,
    sourceDigest: authority.sourceDigest, result,
  };
  const duplicate = progress.assessments.find(item => item.referenceId === authority.referenceId);
  if (duplicate && JSON.stringify(duplicate) !== JSON.stringify(assessment)) throw new LearningCourseInputError();
  const next = structuredClone(progress);
  next.assessments = [...next.assessments.filter(item => item.missionId !== authority.missionId), assessment];
  if (final && result.completed) {
    next.completion = next.completion
      ? { ...next.completion, bestScore: Math.max(next.completion.bestScore, result.score) }
      : { referenceId: authority.referenceId, sourceDigest: authority.sourceDigest, bestScore: result.score };
  }
  return next;
}

/**
 * Advance one verified activity. Acknowledgements alone never earn a mission or
 * badge. Failed assessments can be inspected, but repair and reward need passing
 * evidence for the current project. Storage must never accept this proof as-is
 * from a browser: the host validates each activity before constructing it.
 */
export function completeVerifiedLearningActivity(
  course: LearningCourseV1, progress: LearningCourseProgressV1, proof: VerifiedLearningActivityV1,
): LearningCourseProgressV1 {
  assertProgress(course, progress);
  if (proof.accepted !== true || !DIGEST.test(proof.sourceDigest)) throw new LearningCourseInputError();
  const ordered = stages(course);
  const index = ordered.findIndex(stage => stage.id === proof.stageId);
  if (index < 0 || index > progress.completedStageIds.length) throw new LearningCourseInputError();
  if (index < progress.completedStageIds.length) return structuredClone(progress);
  const stage = ordered[index]!;
  const mission = course.missions[Math.floor(index / 9)]!;
  if (["assess", "inspect", "fix", "reward"].includes(stage.kind)) {
    const assessment = progress.assessments.find(item => item.missionId === mission.id);
    if (!assessment || assessment.sourceDigest !== proof.sourceDigest
      || ((stage.kind === "fix" || stage.kind === "reward") && !assessment.result.completed)) throw new LearningCourseInputError();
  }
  const next = structuredClone(progress);
  next.completedStageIds.push(proof.stageId);
  if (stage.kind === "reward") next.completedMissionIds.push(mission.id);
  return next;
}
