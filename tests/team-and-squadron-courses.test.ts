import { describe, expect, it } from "vitest";
import { validateLearningCourse } from "../src/course-contracts.js";
import { course as rescue, practice as rescuePractice } from "../src/courses/rescue-crew-commander.js";
import { course as squadron, practice as squadronPractice } from "../src/courses/star-defender-squadron.js";

describe.each([
  { course: rescue, practice: rescuePractice, titles: ["A crew with a job", "Routes around the rubble", "The next most useful rescue", "Bring everyone home", "When the route changes", "A coordinated rescue"], terms: ["breadth-first", "reserved", "energy", "blocked", "keyboard"] },
  { course: squadron, practice: squadronPractice, titles: ["A ship under control", "A formation with identity", "One shot, one hit", "A second chance", "Waves with a finish", "The squadron challenge"], terms: ["cooldown", "invulnerability", "radius", "seed", "keyboard"] },
])('$course.title curriculum', ({ course, practice, titles, terms }) => {
  it('has six cumulative projects with specific lessons and concept checks', () => {
    expect(validateLearningCourse(course)).toEqual([]);
    expect(course.missions.map(mission => mission.title)).toEqual(titles);
    expect(new Set(course.missions.flatMap(mission => mission.stages.map(stage => stage.instruction))).size).toBe(54);
    expect(practice).toHaveLength(18);
    expect(new Set(practice.map(question => question.stageId)).size).toBe(18);
    const content = course.missions.flatMap(mission => mission.stages.map(stage => `${stage.instruction} ${stage.help}`)).join(' ');
    terms.forEach(term => expect(content).toContain(term));
    expect(course.starterProject.files[0]!.source).toContain('function update(state, input)');
  });
});
