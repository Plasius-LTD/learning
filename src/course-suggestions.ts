import type { MissionBoundedSuggestionV1 } from "./contracts.js";
import { parseLearningProject, type LearningCourseV1, type LearningProjectV1 } from "./course-contracts.js";

/** Learner-safe authored diff; the artifact ID is a declared course project path. */
export interface LearningCourseSuggestionV1 {
  stageId: string;
  proposal: MissionBoundedSuggestionV1;
}

const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const keys = (value: Record<string, unknown>, expected: readonly string[]) => Object.keys(value).length === expected.length
  && expected.every(key => Object.hasOwn(value, key));
const text = (value: unknown, maximum: number): value is string => typeof value === "string"
  && value.trim().length > 0 && value.length <= maximum && !value.includes("\0");

/** Validate a reviewed proposal without executing, applying or approving it. */
export function parseLearningCourseSuggestion(course: LearningCourseV1, value: unknown): LearningCourseSuggestionV1 {
  if (!record(value) || !keys(value, ["stageId", "proposal"]) || !text(value.stageId, 128)
    || !course.missions.some(mission => mission.stages.some(stage => stage.id === value.stageId)) || !record(value.proposal)) {
    throw new Error("Invalid course suggestion.");
  }
  const proposal = value.proposal;
  if (!keys(proposal, ["id", "source", "intent", "constraints", "permittedArtifactId", "originalSnippet", "replacementSnippet",
    "explanationPrompt", "aiOptional", "learnerApprovalRequired", "alternatives"])
    || !text(proposal.id, 128) || proposal.source !== "authored-fallback" || !text(proposal.intent, 1000)
    || !Array.isArray(proposal.constraints) || proposal.constraints.length < 1 || proposal.constraints.length > 8
    || !proposal.constraints.every(constraint => text(constraint, 400))
    || !course.projectFiles.some(file => file.path === proposal.permittedArtifactId)
    || !text(proposal.originalSnippet, 8000) || !text(proposal.replacementSnippet, 8000)
    || proposal.originalSnippet === proposal.replacementSnippet || !text(proposal.explanationPrompt, 1000)
    || proposal.aiOptional !== false || proposal.learnerApprovalRequired !== true
    || !Array.isArray(proposal.alternatives) || proposal.alternatives.length !== 2
    || proposal.alternatives[0] !== "accept" || proposal.alternatives[1] !== "reject") throw new Error("Invalid course suggestion.");
  return structuredClone(value) as unknown as LearningCourseSuggestionV1;
}

/**
 * Build the proposed project after an explicit learner choice in the host.
 * This pure function grants no approval, writes no storage and awards no evidence.
 * Stale or ambiguous snippets must be reviewed again rather than applied fuzzily.
 */
export function applyLearningCourseSuggestion(course: LearningCourseV1, project: unknown, suggestion: unknown): LearningProjectV1 {
  const parsed = parseLearningProject(course, project);
  const { proposal } = parseLearningCourseSuggestion(course, suggestion);
  const file = parsed.files.find(candidate => candidate.path === proposal.permittedArtifactId)!;
  const start = file.source.indexOf(proposal.originalSnippet);
  if (start < 0 || file.source.indexOf(proposal.originalSnippet, start + 1) >= 0) {
    throw new Error("Suggestion does not match exactly one source location.");
  }
  file.source = file.source.slice(0, start) + proposal.replacementSnippet + file.source.slice(start + proposal.originalSnippet.length);
  return parseLearningProject(course, parsed);
}
