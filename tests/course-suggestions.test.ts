import { describe, expect, it } from "vitest";
import { course } from "../src/courses/skywing-sprint.js";
import { applyLearningCourseSuggestion, parseLearningCourseSuggestion } from "../src/course-suggestions.js";

const suggestion = () => ({ stageId: course.missions[0]!.stages[2]!.id, proposal: {
  id: "change-start-state", source: "authored-fallback", intent: "Start a clearly labelled practice round.",
  constraints: ["Preserve the update function and other game rules."], permittedArtifactId: "game.js",
  originalSnippet: 'status: "ready"', replacementSnippet: 'status: "playing"',
  explanationPrompt: "Which observed change follows from accepting this proposal?",
  aiOptional: false, learnerApprovalRequired: true, alternatives: ["accept", "reject"],
} });

describe("explicit course change previews", () => {
  it("validates a bounded proposal against actual course stages and files without changing source", () => {
    const input = suggestion();
    const parsed = parseLearningCourseSuggestion(course, input);
    expect(parsed).toEqual(input);
    input.proposal.constraints[0] = "Changed later";
    expect(parsed.proposal.constraints[0]).not.toBe("Changed later");
    expect(course.starterProject.files[0]!.source).toContain('status: "ready"');
  });
  it("produces a new validated project replacing exactly one literal occurrence", () => {
    const original = structuredClone(course.starterProject);
    const changed = applyLearningCourseSuggestion(course, original, suggestion());
    expect(changed.files[0]!.source).toBe(original.files[0]!.source.replace('status: "ready"', 'status: "playing"'));
    expect(original).toEqual(course.starterProject);
  });
  it("refuses stale or ambiguous source rather than guessing where to apply a proposal", () => {
    const missing = structuredClone(course.starterProject);
    missing.files[0]!.source = "function initialState() { return {}; }";
    expect(() => applyLearningCourseSuggestion(course, missing, suggestion())).toThrow("Suggestion does not match exactly one source location.");
    missing.files[0]!.source = 'status: "ready"; status: "ready"';
    expect(() => applyLearningCourseSuggestion(course, missing, suggestion())).toThrow("Suggestion does not match exactly one source location.");
    const overlap = suggestion();
    overlap.proposal.originalSnippet = "aa";
    missing.files[0]!.source = "aaa";
    expect(() => applyLearningCourseSuggestion(course, missing, overlap)).toThrow("Suggestion does not match exactly one source location.");
  });
  it("does not interpret replacement syntax and preserves other declared files", () => {
    const multi = { ...course, projectFiles: [...course.projectFiles, { path: "extra.js", language: "javascript" as const, maximumCharacters: 20 }] };
    const project = { files: [...course.starterProject.files, { path: "extra.js", source: "const kept = true;" }] };
    const input = suggestion(); input.proposal.replacementSnippet = "$& $` $' $$";
    const result = applyLearningCourseSuggestion(multi, project, input);
    expect(result.files[0]!.source).toContain("$& $` $' $$");
    expect(result.files[1]!.source).toBe("const kept = true;");
  });
  it("enforces project limits again after a change", () => {
    const small = { ...course, projectFiles: [{ ...course.projectFiles[0]!, maximumCharacters: 20 }] };
    const input = suggestion(); input.proposal.originalSnippet = "short"; input.proposal.replacementSnippet = "a".repeat(21);
    expect(() => applyLearningCourseSuggestion(small, { files: [{ path: "game.js", source: "short" }] }, input)).toThrow();
  });
  it.each([
    (value: ReturnType<typeof suggestion>) => { value.stageId = "missing"; },
    (value: ReturnType<typeof suggestion>) => { value.proposal.permittedArtifactId = "../other.js"; },
    (value: ReturnType<typeof suggestion>) => { value.proposal.constraints = []; },
    (value: ReturnType<typeof suggestion>) => { value.proposal.constraints = Array(9).fill("constraint"); },
    (value: ReturnType<typeof suggestion>) => { value.proposal.originalSnippet = " "; },
    (value: ReturnType<typeof suggestion>) => { value.proposal.replacementSnippet = value.proposal.originalSnippet; },
    (value: ReturnType<typeof suggestion>) => { value.proposal.replacementSnippet = "x".repeat(8001); },
    (value: ReturnType<typeof suggestion>) => { value.proposal.intent = "bad\0intent"; },
    (value: ReturnType<typeof suggestion>) => { value.proposal.learnerApprovalRequired = false; },
    (value: ReturnType<typeof suggestion>) => { value.proposal.aiOptional = true; },
    (value: ReturnType<typeof suggestion>) => { value.proposal.source = "live-model"; },
    (value: ReturnType<typeof suggestion>) => { value.proposal.alternatives = ["reject", "accept"]; },
  ])("refuses invalid, oversized or unapproved proposal contracts", mutate => {
    const input = suggestion(); mutate(input);
    expect(() => parseLearningCourseSuggestion(course, input)).toThrow("Invalid course suggestion.");
  });
  it("rejects unknown fields and malformed container values", () => {
    for (const value of [null, [], {}, { ...suggestion(), approval: true }, { ...suggestion(), proposal: { ...suggestion().proposal, score: 100 } }]) {
      expect(() => parseLearningCourseSuggestion(course, value)).toThrow("Invalid course suggestion.");
    }
  });
});
