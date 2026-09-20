import { LEARNING_COURSE_STAGE_ORDER, parseLearningCourse, type LearningCourseV1 } from "../course-contracts.js";
import type { MissionStageKindV1 } from "../contracts.js";

/** Formative checks are learner-visible teaching material, not protected assessments. */
export interface CoursePracticeQuestion {
  stageId: string;
  question: string;
  choices: [string, string, string];
  correctChoice: 0 | 1 | 2;
  feedback: string;
}
export type PracticeDraft = Omit<CoursePracticeQuestion, "stageId">;
export interface CourseMissionDraft {
  title: string;
  concepts: string[];
  goals: string[];
  extension: string;
  activities: Record<MissionStageKindV1, [instruction: string, help: string]>;
  questions: Record<"learn" | "predict" | "explain", PracticeDraft>;
}
type CourseHeader = Omit<LearningCourseV1, "schemaVersion" | "moduleVersion" | "moduleId" | "runtimeId" | "estimatedMinutes" | "completionAssessmentId" | "completionBadge" | "missions">;

/** Only identifiers and activity framing are shared; each lesson is independently authored. */
export function authorCourse(header: CourseHeader, missions: CourseMissionDraft[]): { course: LearningCourseV1; practice: CoursePracticeQuestion[] } {
  const course = parseLearningCourse({ ...header, schemaVersion: "1", moduleVersion: "2.0.0", moduleId: `junior-coder.${header.slug}`,
    runtimeId: `${header.slug}.v2`, estimatedMinutes: missions.length * 60,
    completionAssessmentId: `${header.slug}.final`, completionBadge: { id: `${header.slug}.completed`, title: `${header.title} creator` },
    missions: missions.map((mission, index) => ({
      id: `${header.slug}.m${index + 1}`, title: mission.title, concepts: mission.concepts, goals: mission.goals,
      estimatedMinutes: 60, assessmentId: `${header.slug}.m${index + 1}.assessment`, extension: mission.extension,
      stages: LEARNING_COURSE_STAGE_ORDER.map(kind => ({ id: `${header.slug}.m${index + 1}.${kind}`, kind,
        title: `${kind.charAt(0).toUpperCase()}${kind.slice(1)}: ${mission.title}`,
        instruction: mission.activities[kind][0], help: mission.activities[kind][1] })),
    })),
  });
  const practice = structuredClone(missions.flatMap((mission, index) => (["learn", "predict", "explain"] as const)
    .map(kind => ({ ...mission.questions[kind], stageId: `${header.slug}.m${index + 1}.${kind}` }))));
  for (const question of practice) {
    if (question.question.trim().length < 20 || question.feedback.trim().length < 40
      || question.choices.length !== 3 || question.choices.some(choice => choice.trim().length < 2) || new Set(question.choices).size !== 3
      || !Number.isInteger(question.correctChoice) || question.correctChoice < 0 || question.correctChoice > 2) throw new Error("Invalid course practice question.");
  }
  return { course, practice };
}
