import { describe, expect, it } from "vitest";
import { validateLearningCourse } from "../src/course-contracts.js";
import { course, practice } from "../src/courses/robot-maze-dash.js";

describe("Robot Maze Dash complete curriculum", () => {
  it("has six distinct taught projects with all nine activities and an accumulated capstone", () => {
    expect(validateLearningCourse(course)).toEqual([]);
    expect(course.moduleVersion).toBe("2.0.0");
    expect(course.moduleId).toBe("junior-coder.robot-maze-dash");
    expect(course.missions.map(mission => mission.title)).toEqual([
      "A route to the rescue pad", "Repeat the useful part", "Read the walls", "Name a rescue routine", "Collect and count", "The lost-robot expedition",
    ]);
    expect(new Set(course.missions.flatMap(mission => mission.stages.map(stage => stage.instruction))).size).toBe(54);
    expect(course.reference.map(entry => entry.name)).toEqual(expect.arrayContaining(["forward", "repeat", "if-clear", "call", "collect"]));
    expect(course.starterProject.files[0]!.path).toBe("maze.json");
    expect(JSON.parse(course.starterProject.files[0]!.source)).toHaveProperty("program");
  });
  it("includes authored concept checks with explanatory feedback for all learning, prediction and reflection stages", () => {
    expect(practice).toHaveLength(18);
    for (const question of practice) {
      expect(course.missions.flatMap(mission => mission.stages).some(stage => stage.id === question.stageId)).toBe(true);
      expect(question.choices).toHaveLength(3);
      expect(new Set(question.choices).size).toBe(3);
      expect(question.correctChoice).toBeGreaterThanOrEqual(0);
      expect(question.correctChoice).toBeLessThan(3);
      expect(question.feedback.length).toBeGreaterThan(40);
    }
  });
});
