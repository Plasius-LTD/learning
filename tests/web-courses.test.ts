import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { LEARNING_COURSE_STAGE_ORDER, validateLearningCourse } from "../src/course-contracts.js";
import { course as planner, practice as plannerPractice } from "../src/courses/adventure-mission-planner.js";
import { course as creature, practice as creaturePractice } from "../src/courses/creature-care-dashboard.js";
import { course as control, practice as controlPractice } from "../src/courses/robot-mission-control.js";

describe("complete editable web curricula", () => {
  for (const [course, practice] of [[planner, plannerPractice], [creature, creaturePractice], [control, controlPractice]] as const) {
    it(`${course.slug} supplies distinct cumulative instruction and all three editable web files`, () => {
      expect(validateLearningCourse(course)).toEqual([]);
      expect(course.category).toBe("web-app");
      expect(course.moduleVersion).toBe("2.0.0");
      expect(course.projectFiles).toEqual([
        { path: "index.html", language: "html", maximumCharacters: 24000 },
        { path: "app.css", language: "css", maximumCharacters: 16000 },
        { path: "app.js", language: "javascript", maximumCharacters: 32000 },
      ]);
      expect(course.missions).toHaveLength(6);
      const stages = course.missions.flatMap(mission => mission.stages);
      expect(new Set(stages.map(stage => stage.instruction)).size).toBe(54);
      expect(new Set(stages.map(stage => stage.help)).size).toBe(54);
      for (const mission of course.missions) expect(mission.stages.map(stage => stage.kind)).toEqual(LEARNING_COURSE_STAGE_ORDER);
      expect(practice).toHaveLength(18);
      expect(new Set(practice.map(question => question.question)).size).toBe(18);
      expect(practice.map(question => question.stageId)).toEqual(stages.filter(stage => ["learn", "predict", "explain"].includes(stage.kind)).map(stage => stage.id));
      const files = Object.fromEntries(course.starterProject.files.map(file => [file.path, file.source]));
      expect(files["index.html"]).toContain("<main");
      expect(files["index.html"]).toContain("<h1");
      expect(files["index.html"]).toContain('role="status"');
      expect(files["index.html"]).not.toMatch(/<(?:script|iframe|link|img)\b|\bonclick\s*=/iu);
      expect(files["app.css"]).toContain(":focus-visible");
      expect(files["app.css"]).toContain("prefers-reduced-motion");
      expect(files["app.css"]).toContain("prefers-color-scheme");
      const content = stages.map(stage => `${stage.instruction} ${stage.help}`).join(" ");
      for (const term of ["keyboard", "320", "focus", "reset", "current source"]) expect(content).toContain(term);
    });

    it(`${course.slug} starts with bounded, detached, truthful display data`, () => {
      // Only version-controlled teaching examples run here, never submitted learner code.
      const source = course.starterProject.files.find(file => file.path === "app.js")!.source;
      const result = runInNewContext(`${source}\n(() => {
        const state = initialState(); const before = JSON.stringify(state);
        const display = view(state); const afterView = JSON.stringify(state);
        const unchanged = update(state, { type: "unknown" });
        const reset = update(state, { type: "reset" });
        return JSON.stringify({ state, display, unchanged, reset, unchangedInput: before === JSON.stringify(state), pureView: before === afterView, fresh: state !== reset && state !== unchanged });
      })()`, Object.create(null), { timeout: 100 });
      const actual = JSON.parse(result as string) as Record<string, unknown>;
      expect(actual.unchangedInput).toBe(true);
      expect(actual.pureView).toBe(true);
      expect(actual.fresh).toBe(true);
      expect(actual.reset).toEqual(actual.state);
      expect(actual.unchanged).toEqual(actual.state);
      expect(JSON.stringify(actual.display).length).toBeLessThan(64000);
      expect(actual.display).toMatchObject({ message: expect.any(String) });
    });
  }

  it("gives the planner a complete validation, identity and recovery journey", () => {
    expect(planner.missions.map(mission => mission.title)).toEqual([
      "A page with a purpose", "A form that explains itself", "Turn entries into missions", "Revise without losing the plan", "Recover a saved plan", "Your complete adventure planner",
    ]);
    expect(planner.reference.map(item => item.name)).toEqual(expect.arrayContaining(["validateDraft", "snapshot", "restoreSnapshot", "view"]));
    const text = JSON.stringify(planner);
    for (const term of ["20 missions", "duplicate", "corrupt", "simulated", "aria-invalid"]) expect(text).toContain(term);
  });

  it("gives creature care bounded time, meaningful actions and readable history", () => {
    expect(creature.missions.map(mission => mission.title)).toEqual([
      "Meet the creature in data", "Make care actions matter", "Let simulated time pass", "Rest, pause and recover", "Explain the care history", "A dashboard worth caring for",
    ]);
    expect(creature.reference.map(item => item.name)).toEqual(expect.arrayContaining(["care rules", "tick", "history", "view"]));
    const text = JSON.stringify(creature);
    for (const term of ["3600", "0–100", "paused", "20 entries", "reduced motion"]) expect(text).toContain(term);
  });

  it("gives robot control independent STOP, freshness and deliberate recovery", () => {
    expect(control.missions.map(mission => mission.title)).toEqual([
      "An honest control panel", "Connect before commanding", "Arm a bounded command", "Make STOP dependable", "Trust only fresh telemetry", "Demonstrate safe mission control",
    ]);
    expect(control.reference.map(item => item.name)).toEqual(expect.arrayContaining(["telemetry", "command", "STOP", "view"]));
    const text = JSON.stringify(control);
    for (const term of ["500", "sequence", "deliberate", "simulator", "disarm"]) expect(text).toContain(term);
  });
});
