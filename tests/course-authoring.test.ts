import { describe, expect, it } from "vitest";
import { authorCourse, type CourseMissionDraft } from "../src/courses/course-authoring.js";
import { course, practice } from "../src/courses/robot-maze-dash.js";

function draft() {
  const header = { slug: course.slug, title: course.title, category: course.category, summary: course.summary,
    projectFiles: course.projectFiles, starterProject: course.starterProject, reference: course.reference };
  const missions: CourseMissionDraft[] = course.missions.map(mission => ({
    title: mission.title, concepts: mission.concepts, goals: mission.goals, extension: mission.extension,
    activities: Object.fromEntries(mission.stages.map(stage => [stage.kind, [stage.instruction, stage.help]])) as CourseMissionDraft["activities"],
    questions: Object.fromEntries(["learn", "predict", "explain"].map(kind => {
      const { stageId: _, ...question } = practice.find(item => item.stageId === `${mission.id}.${kind}`)!;
      return [kind, question];
    })) as CourseMissionDraft["questions"],
  }));
  return structuredClone({ header, missions });
}
describe("authored course publication boundary", () => {
  it("round trips course content without sharing mutable author input", () => {
    const { header, missions } = draft();
    const result = authorCourse(header, missions);
    expect(result.course).toEqual(course);
    expect(result.practice).toEqual(practice);
    missions[0]!.activities.learn[0] = "Changed input";
    missions[0]!.questions.learn.choices[0] = "Changed choice";
    expect(result.course.missions[0]!.stages[0]!.instruction).toEqual(course.missions[0]!.stages[0]!.instruction);
    expect(result.practice[0]!.choices).toEqual(practice[0]!.choices);
  });
  it("refuses incomplete and ambiguous formative questions", () => {
    for (const change of [{ question: "Too short" }, { feedback: "Too short" }, { choices: ["x", "Second", "Third"] },
      { choices: ["Same", "Same", "Third"] }, { choices: ["First", "Second"] }, { correctChoice: -1 }, { correctChoice: 3 }, { correctChoice: 1.5 }]) {
      const { header, missions } = draft();
      Object.assign(missions[0]!.questions.learn, change);
      expect(() => authorCourse(header, missions)).toThrow("Invalid course practice question.");
    }
  });
  it("continues to enforce six complete missions rather than accepting an outline", () => {
    const { header, missions } = draft();
    expect(() => authorCourse(header, missions.slice(0, 1))).toThrow();
  });
});
