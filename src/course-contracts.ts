import type { MissionStageKindV1, ModuleCategoryV1 } from "./contracts.js";
import { JUNIOR_CODER_MISSION_STAGE_ORDER_V1 } from "./mission-authoring.js";

/** Stable activity order for complete courses; legacy authoring remains immutable. */
export const LEARNING_COURSE_STAGE_ORDER = JUNIOR_CODER_MISSION_STAGE_ORDER_V1;
export const LEARNING_COURSE_LIMITS = Object.freeze({
  missions: 6, stagesPerMission: 9, projectFiles: 8,
  sourceCharactersPerFile: 64_000, sourceCharactersPerProject: 96_000,
});

export type LearningProjectLanguageV1 = "javascript" | "python" | "cpp" | "html" | "css" | "blocks" | "json";
export interface LearningProjectFileV1 { path: string; source: string }
export interface LearningProjectV1 { files: LearningProjectFileV1[] }
export interface LearningCourseStageV1 {
  id: string;
  kind: MissionStageKindV1;
  title: string;
  instruction: string;
  help: string;
}
export interface LearningCourseMissionV1 {
  id: string;
  title: string;
  concepts: string[];
  estimatedMinutes: number;
  goals: string[];
  assessmentId: string;
  stages: LearningCourseStageV1[];
  extension: string;
}

/** Learner-safe content only. Protected scenarios and solutions are host-owned. */
export interface LearningCourseV1 {
  schemaVersion: "1";
  moduleId: string;
  moduleVersion: string;
  slug: string;
  title: string;
  summary: string;
  runtimeId: string;
  category: ModuleCategoryV1;
  estimatedMinutes: number;
  completionAssessmentId: string;
  projectFiles: { path: string; language: LearningProjectLanguageV1; maximumCharacters: number }[];
  starterProject: LearningProjectV1;
  reference: { name: string; signature: string; description: string; example: string }[];
  missions: LearningCourseMissionV1[];
  completionBadge: { id: string; title: string };
}

/** The only learner-owned save inputs. Progress/evidence are never draft authority. */
export interface LearningCourseDraftV1 {
  schemaVersion: "1";
  moduleVersion: string;
  activeStageId: string;
  project: LearningProjectV1;
}
export type LearningSaveSlotIdV1 = "auto" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
export interface LearningCourseValidationIssueV1 {
  code: "invalid-manifest" | "mission-count" | "stage-order" | "duplicate-id" | "incomplete-content" | "invalid-project";
  path: string;
}

const ID = /^[a-z0-9][a-z0-9.-]{0,159}$/u;
const FILE_PATH = /^[a-z0-9][a-z0-9_-]{0,63}\.(?:js|py|cpp|html|css|json)$/u;
const VERSION = /^\d+\.\d+\.\d+$/u;
const LANGUAGES: readonly string[] = ["javascript", "python", "cpp", "html", "css", "blocks", "json"];
const CATEGORIES: readonly string[] = ["game", "robot", "vibe", "web-app"];
const PLACEHOLDER = /\b(?:TODO|TBD|coming soon|placeholder|lorem ipsum)\b/iu;
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown, minimum = 1, maximum = 8000): value is string =>
  typeof value === "string" && value.trim().length >= minimum && value.length <= maximum;
const id = (value: unknown): value is string => typeof value === "string" && ID.test(value);
const integer = (value: unknown, minimum: number, maximum: number): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= minimum && value <= maximum;
const exactKeys = (value: Record<string, unknown>, keys: readonly string[]): boolean =>
  Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));

/** Errors contain no source, learner text or caller-supplied identifiers. */
export class LearningCourseInputError extends Error {
  constructor() { super("Invalid learning course input."); this.name = "LearningCourseInputError"; }
}

function fileDefinitions(value: unknown): value is LearningCourseV1["projectFiles"] {
  return Array.isArray(value) && value.length >= 1 && value.length <= LEARNING_COURSE_LIMITS.projectFiles
    && value.every(file => record(file) && exactKeys(file, ["path", "language", "maximumCharacters"])
      && typeof file.path === "string" && FILE_PATH.test(file.path)
      && typeof file.language === "string" && LANGUAGES.includes(file.language)
      && integer(file.maximumCharacters, 1, LEARNING_COURSE_LIMITS.sourceCharactersPerFile))
    && new Set(value.map(file => (file as { path: string }).path)).size === value.length;
}

/** Validate every file against the declared editable set; never preserve extra fields. */
export function parseLearningProject(course: Pick<LearningCourseV1, "projectFiles">, value: unknown): LearningProjectV1 {
  if (!fileDefinitions(course.projectFiles) || !record(value) || !exactKeys(value, ["files"])
    || !Array.isArray(value.files) || value.files.length !== course.projectFiles.length) throw new LearningCourseInputError();
  const files: LearningProjectFileV1[] = [];
  const seen = new Set<string>();
  let characters = 0;
  for (const file of value.files) {
    if (!record(file) || !exactKeys(file, ["path", "source"]) || typeof file.path !== "string"
      || typeof file.source !== "string" || seen.has(file.path)) throw new LearningCourseInputError();
    const definition = course.projectFiles.find(candidate => candidate.path === file.path);
    if (!definition || file.source.length > definition.maximumCharacters || file.source.includes("\u0000")) throw new LearningCourseInputError();
    characters += file.source.length;
    if (characters > LEARNING_COURSE_LIMITS.sourceCharactersPerProject) throw new LearningCourseInputError();
    seen.add(file.path);
    files.push({ path: file.path, source: file.source });
  }
  // Stable ordering keeps host digests independent of the submitted array order.
  return { files: course.projectFiles.map(definition => files.find(file => file.path === definition.path)!) };
}

/** Parse untrusted saves without accepting identity, scores, completion or evidence. */
export function parseLearningCourseDraft(course: LearningCourseV1, value: unknown): LearningCourseDraftV1 {
  if (!record(value) || !exactKeys(value, ["schemaVersion", "moduleVersion", "activeStageId", "project"])
    || value.schemaVersion !== "1" || value.moduleVersion !== course.moduleVersion
    || typeof value.activeStageId !== "string"
    || !course.missions.some(mission => mission.stages.some(stage => stage.id === value.activeStageId))) throw new LearningCourseInputError();
  return { schemaVersion: "1", moduleVersion: course.moduleVersion, activeStageId: value.activeStageId,
    project: parseLearningProject(course, value.project) };
}

/** An account owns one autosave and nine explicitly managed slots per course version. */
export function parseLearningSaveSlotId(value: unknown): LearningSaveSlotIdV1 {
  if (value === "auto" || (typeof value === "string" && /^[1-9]$/u.test(value))) return value as LearningSaveSlotIdV1;
  throw new LearningCourseInputError();
}

/** Structural publication gate. Working runtime/curriculum acceptance is additional. */
export function validateLearningCourse(value: unknown): LearningCourseValidationIssueV1[] {
  const issues: LearningCourseValidationIssueV1[] = [];
  const add = (code: LearningCourseValidationIssueV1["code"], path: string) => { issues.push({ code, path }); };
  if (!record(value)) return [{ code: "invalid-manifest", path: "$" }];
  if (!exactKeys(value, ["schemaVersion", "moduleId", "moduleVersion", "slug", "title", "summary", "runtimeId", "category",
    "estimatedMinutes", "completionAssessmentId", "projectFiles", "starterProject", "reference", "missions", "completionBadge"])
    || value.schemaVersion !== "1" || !id(value.moduleId) || !id(value.slug) || !id(value.runtimeId)
    || !text(value.moduleVersion) || !VERSION.test(value.moduleVersion)
    || typeof value.category !== "string" || !CATEGORIES.includes(value.category)
    || !text(value.title, 3, 160) || !text(value.summary, 40, 2000)
    || !integer(value.estimatedMinutes, 60, 3600) || !id(value.completionAssessmentId)
    || !record(value.completionBadge) || !exactKeys(value.completionBadge, ["id", "title"])
    || !id(value.completionBadge.id) || !text(value.completionBadge.title, 3, 160)) add("invalid-manifest", "$");
  if (!fileDefinitions(value.projectFiles)) add("invalid-project", "projectFiles");
  else {
    try { parseLearningProject({ projectFiles: value.projectFiles }, value.starterProject); }
    catch { add("invalid-project", "starterProject"); }
  }
  if (!Array.isArray(value.reference) || value.reference.length < 1 || value.reference.length > 80
    || value.reference.some(entry => !record(entry) || !exactKeys(entry, ["name", "signature", "description", "example"])
      || !text(entry.name) || !text(entry.signature)
      || !text(entry.description, 20) || !text(entry.example))) add("incomplete-content", "reference");
  if (!Array.isArray(value.missions)) { add("mission-count", "missions"); return issues; }
  if (value.missions.length !== LEARNING_COURSE_LIMITS.missions) add("mission-count", "missions");
  if (value.missions.length > LEARNING_COURSE_LIMITS.missions) return issues;
  const seen = new Set<string>();
  const checkId = (candidate: unknown, path: string) => {
    if (!id(candidate)) add("invalid-manifest", path);
    else if (seen.has(candidate)) add("duplicate-id", path);
    else seen.add(candidate);
  };
  let minutes = 0;
  value.missions.forEach((mission: unknown, missionIndex: number) => {
    const path = `missions[${missionIndex}]`;
    if (!record(mission)) { add("invalid-manifest", path); return; }
    checkId(mission.id, `${path}.id`);
    checkId(mission.assessmentId, `${path}.assessmentId`);
    if (!exactKeys(mission, ["id", "title", "concepts", "estimatedMinutes", "goals", "assessmentId", "stages", "extension"])
      || !text(mission.title, 3, 160) || !integer(mission.estimatedMinutes, 10, 600)
      || !Array.isArray(mission.concepts) || mission.concepts.length < 1 || mission.concepts.length > 12
      || mission.concepts.some(concept => !text(concept, 2, 120))
      || !Array.isArray(mission.goals) || mission.goals.length < 1 || mission.goals.length > 12
      || mission.goals.some(goal => !text(goal, 20, 2000)) || !text(mission.extension, 30, 2000)) add("incomplete-content", path);
    if (typeof mission.estimatedMinutes === "number") minutes += mission.estimatedMinutes;
    if (!Array.isArray(mission.stages) || mission.stages.length !== LEARNING_COURSE_LIMITS.stagesPerMission) {
      add("stage-order", `${path}.stages`); return;
    }
    mission.stages.forEach((stage: unknown, stageIndex: number) => {
      const stagePath = `${path}.stages[${stageIndex}]`;
      if (!record(stage)) { add("invalid-manifest", stagePath); return; }
      checkId(stage.id, `${stagePath}.id`);
      if (stage.kind !== LEARNING_COURSE_STAGE_ORDER[stageIndex]) add("stage-order", stagePath);
      if (!exactKeys(stage, ["id", "kind", "title", "instruction", "help"])
        || !text(stage.title, 3, 160) || !text(stage.instruction, 40) || !text(stage.help, 30)
        || (typeof stage.instruction === "string" && PLACEHOLDER.test(stage.instruction))) add("incomplete-content", stagePath);
    });
  });
  if (minutes !== value.estimatedMinutes) add("invalid-manifest", "estimatedMinutes");
  return issues;
}

/** Validate an external learner manifest and detach it from the supplied object. */
export function parseLearningCourse(value: unknown): LearningCourseV1 {
  if (validateLearningCourse(value).length) throw new LearningCourseInputError();
  return structuredClone(value as LearningCourseV1);
}
