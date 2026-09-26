import { describe, expect, it } from "vitest";
import { validateLearningCourse } from "../src/course-contracts.js";
import { parseLearningCourseSuggestion } from "../src/course-suggestions.js";
import { course, practice, suggestions } from "../src/courses/vibe-game-remix-lab.js";
import { course as detective, practice as detectivePractice, suggestions as detectiveSuggestions } from "../src/courses/vibe-bug-detective.js";
import { course as idea, practice as ideaPractice, suggestions as ideaSuggestions } from "../src/courses/vibe-idea-studio.js";

describe("Vibe Game Remix Lab complete course", () => {
  it("replaces settings-only exercises with baseline, intent, implementation, real diff and regression work", () => {
    expect(validateLearningCourse(course)).toEqual([]);
    expect(course.category).toBe("vibe");
    expect(course.missions.map(mission => mission.title)).toEqual([
      "Know the starting game", "Give the remix a purpose", "One change with clear limits", "Read what the diff changes", "Protect the working rules", "Your rescue remix",
    ]);
    expect(new Set(course.missions.flatMap(mission => mission.stages.map(stage => stage.instruction))).size).toBe(54);
    expect(practice).toHaveLength(18);
    expect(course.starterProject.files[0]!.source).toContain("function update(state, input)");
    expect(course.reference.map(reference => reference.name)).toEqual(expect.arrayContaining(["rules", "describeState", "requestedStride", "acceptanceCases"]));
    const content = course.missions.flatMap(mission => mission.stages.map(stage => `${stage.instruction} ${stage.help}`)).join(" ");
    for (const term of ["baseline", "diff", "intermediate", "regression", "keyboard", "authored"]) expect(content).toContain(term);
  });
  it("ships actual bounded source proposals without automatic application or live AI", () => {
    expect(suggestions).toHaveLength(2);
    for (const suggestion of suggestions) {
      expect(parseLearningCourseSuggestion(course, suggestion)).toEqual(suggestion);
      expect(suggestion.proposal.originalSnippet).not.toBe(suggestion.proposal.replacementSnippet);
      expect(suggestion.proposal.learnerApprovalRequired).toBe(true);
    }
    expect(new Set(suggestions.map(item => item.proposal.id)).size).toBe(2);
  });
});

describe("Vibe Idea Studio complete course", () => {
  it("turns a bounded idea into an interactive budgeted mission board with executable success cases", () => {
    expect(validateLearningCourse(idea)).toEqual([]);
    expect(idea.category).toBe("vibe");
    expect(idea.missions.map(mission => mission.title)).toEqual([
      "Give the idea an audience", "Make success executable", "Build the smallest useful board", "Review a reversible change", "Explore the trade-offs", "Show the working idea",
    ]);
    expect(new Set(idea.missions.flatMap(mission => mission.stages.map(stage => stage.instruction))).size).toBe(54);
    expect(ideaPractice).toHaveLength(18);
    expect(idea.projectFiles.map(file => file.path)).toEqual(["app.js", "brief.json"]);
    expect(idea.starterProject.files[0]!.source).toContain("function update(state, input)");
    for (const suggestion of ideaSuggestions) expect(parseLearningCourseSuggestion(idea, suggestion)).toEqual(suggestion);
    const content = idea.missions.flatMap(mission => mission.stages.map(stage => `${stage.instruction} ${stage.help}`)).join(" ");
    for (const term of ["audience", "acceptance", "undo", "budget", "keyboard", "authored"]) expect(content).toContain(term);
  });
});

describe("Vibe Bug Detective complete course", () => {
  it("teaches a cumulative repair of executable movement, boundaries, accounting and terminal behaviour", () => {
    expect(validateLearningCourse(detective)).toEqual([]);
    expect(detective.category).toBe("vibe");
    expect(detective.missions.map(mission => mission.title)).toEqual([
      "Reproduce the wrong turn", "Shrink the failing example", "Compare two explanations", "Repair the duplicate rescue", "Keep the repairs working", "The detective's casebook",
    ]);
    expect(new Set(detective.missions.flatMap(mission => mission.stages.map(stage => stage.instruction))).size).toBe(54);
    expect(detectivePractice).toHaveLength(18);
    expect(detective.starterProject.files.map(file => file.path)).toEqual(["game.js", "evidence.json"]);
    expect(detective.starterProject.files[0]!.source).toContain("function update(state, input)");
    for (const suggestion of detectiveSuggestions) expect(parseLearningCourseSuggestion(detective, suggestion)).toEqual(suggestion);
    const content = detective.missions.flatMap(mission => mission.stages.map(stage => `${stage.instruction} ${stage.help}`)).join(" ");
    for (const term of ["hypothesis", "duplicate", "regression", "restart", "keyboard", "authored"]) expect(content).toContain(term);
  });
});
