import { LEARNING_COURSE_STAGE_ORDER, type LearningCourseV1 } from "../../src/index.js";

export function courseFixture(): LearningCourseV1 {
  return {
    schemaVersion: "1", moduleId: "junior-coder.robot-maze-dash",
    moduleVersion: "2.0.0", slug: "robot-maze-dash", title: "Robot Maze Dash",
    summary: "Program a rescue robot, from a first move to a complete maze rescue.",
    runtimeId: "robot-maze-v2", category: "game", estimatedMinutes: 360,
    completionAssessmentId: "robot-maze-capstone",
    projectFiles: [{ path: "robot.json", language: "blocks", maximumCharacters: 16000 }],
    starterProject: { files: [{ path: "robot.json", source: "[]" }] },
    reference: [{ name: "moveForward", signature: "moveForward()", description: "Move one clear square in the facing direction.", example: "moveForward();" }],
    missions: Array.from({ length: 6 }, (_, index) => ({
      id: `maze-mission-${index + 1}`, title: `Rescue challenge ${index + 1}`,
      concepts: ["sequence"], estimatedMinutes: 60,
      goals: [`Reach checkpoint ${index + 1} without entering a wall.`],
      assessmentId: `maze-assessment-${index + 1}`,
      stages: LEARNING_COURSE_STAGE_ORDER.map(kind => ({
        id: `maze-mission-${index + 1}-${kind}`, kind, title: `Rescue ${kind}`,
        instruction: `Use the route evidence to ${kind} the rescue program for checkpoint ${index + 1}.`,
        help: "Trace the robot's facing direction before choosing its next movement.",
      })),
      extension: "Find a different valid route and compare its movement count.",
    })),
    completionBadge: { id: "maze-complete", title: "Maze Rescuer" },
  };
}
