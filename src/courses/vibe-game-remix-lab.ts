import { authorCourse } from "./course-authoring.js";
import type { LearningCourseSuggestionV1 } from "../course-suggestions.js";

export const { course, practice } = authorCourse({
  slug: "vibe-game-remix-lab", title: "Vibe Game Remix Lab", category: "vibe",
  summary: "Remix a working rescue game by explaining its baseline, writing a bounded intent and implementing a purposeful change. Review real source differences, reject a tempting incorrect suggestion and protect the result with executable examples. Finish a playable three-beacon rescue with a two-cell dash. Authored suggestions make live AI unnecessary.",
  projectFiles: [{ path: "game.js", language: "javascript", maximumCharacters: 32000 }, { path: "brief.json", language: "json", maximumCharacters: 6000 }],
  starterProject: { files: [{ path: "game.js", source: `function rules() {
  return { title: "Pocket Rescue", targetCount: 1, stride: 1 };
}

function initialState() {
  const beacons = [{ id: "amber", x: 3, y: 3 }, { id: "mint", x: 8, y: 1 }, { id: "violet", x: 10, y: 6 }];
  return { player: { x: 1, y: 3 }, beacons: beacons.slice(0, rules().targetCount), rescued: [], energy: 40, status: "ready" };
}

function canEnter(x, y) {
  return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < 12 && y >= 0 && y < 8
    && !(x === 5 && y >= 2 && y <= 4);
}

function update(state, input) {
  if (input.type === "restart") return initialState();
  const next = JSON.parse(JSON.stringify(state));
  if (input.type === "start" && next.status === "ready") next.status = "playing";
  if (input.type !== "move" || next.status !== "playing") return next;
  const directions = { up: [0,-1], right: [1,0], down: [0,1], left: [-1,0] };
  if (!Object.hasOwn(directions, input.direction)) return next;
  const [dx, dy] = directions[input.direction];
  const x = next.player.x + dx;
  const y = next.player.y + dy;
  if (!canEnter(x, y)) return next;
  next.player = { x, y };
  next.energy -= 1;
  for (const beacon of next.beacons) {
    if (beacon.x === x && beacon.y === y && !next.rescued.includes(beacon.id)) next.rescued.push(beacon.id);
  }
  if (next.rescued.length === next.beacons.length) next.status = "won";
  else if (next.energy === 0) next.status = "tired";
  return next;
}

function describeState(state) { return {}; }
function acceptanceCases() { return []; }
` }, { path: "brief.json", source: '{\n  "audience": "",\n  "goal": "",\n  "constraints": []\n}\n' }] },
  reference: [
    { name: "rules", signature: "rules() → { title, targetCount, stride }", description: "The baseline has one beacon and stride one. The finished remix has targetCount=3 and stride=2, plus an authored title of 3–40 characters. These are the only rule fields. A fresh initialState uses current rules; an existing run is never silently resized.", example: 'return { title: "Three Beacon Rescue", targetCount: 3, stride: 2 };' },
    { name: "initialState", signature: "initialState() → rescue game state", description: "A 12×8 board starts at (1,3), energy 40 and ready status. A wall occupies (5,2), (5,3), (5,4). Beacons are amber (3,3), mint (8,1), violet (10,6), selected in that order by targetCount. A fresh state has a fresh beacons list and empty rescued IDs.", example: 'const fresh = initialState();' },
    { name: "update", signature: "update(state, input) → next state", description: "Actions are start, move with direction up/right/down/left and optional dash boolean, and restart. Unknown actions or directions preserve values. Each valid cell move costs one energy and rescues any beacon on that cell once. Blocked movement costs nothing. Do not mutate the input state.", example: 'update(state, { type: "move", direction: "right", dash: true });' },
    { name: "dash", signature: "visit each intermediate cell", description: "An ordinary move travels one cell. An explicit dash=true requests rules().stride cells, up to two. Check every intermediate cell and stop the dash on a wall, edge or terminal outcome. Collect before terminal checks; rescuing the last beacon on the last energy wins rather than becoming tired.", example: 'const stride = input.dash === true ? rules().stride : 1;' },
    { name: "describeState", signature: "describeState(state) → { status, x, y, rescued, remaining, energy }", description: "Return the current status, player coordinates, rescued count, remaining beacon count and energy as plain data. Read state without moving, scoring or changing it. The host can render an accessible text summary from this evidence.", example: 'const remaining = state.beacons.length - state.rescued.length;' },
    { name: "requestedStride", signature: "requestedStride(input) → 1 or 2", description: "The reviewed refactor extracts dash selection into this helper. Only dash===true requests configured stride; absent, false or other values select one. The update function must actually use the helper while preserving intermediate checks.", example: 'const stride = requestedStride(input);' },
    { name: "brief.json", signature: "{ audience, goal, constraints }", description: "Write a fictional audience and goal, each 10–160 characters, and three to six specific constraints of 10–160 characters. Keep personal information out. The brief records intent; executable behaviour and independent assessment supply evidence that the implementation meets the rules.", example: '{ "audience": "Players learning to plan a route", "goal": "Rescue three beacons with an optional dash", "constraints": ["Check each intermediate square", "Preserve ordinary one-cell movement", "Keep stop and restart behaviour predictable"] }' },
    { name: "acceptanceCases", signature: "acceptanceCases() → 4–8 named replay cases", description: "Each case has name (3–60 characters), actions (1–80 documented game actions from fresh state) and expected {x,y,energy,rescued,status}. rescued is an ordered ID array. Include wall, board-edge, dash and restart cases. The host executes cases against saved source and compares exact projections; learner-written cases cannot award completion alone.", example: '{ name: "Left edge", actions: [{type:"start"},{type:"move",direction:"left"},{type:"move",direction:"left"}], expected: {x:0,y:3,energy:39,rescued:[],status:"playing"} }' },
    { name: "terminal states", signature: 'status: "ready" | "playing" | "won" | "tired"', description: "Won means every selected beacon was rescued. Tired means zero energy without completing the rescue. Both preserve state for later actions except restart, which returns a fresh ready state and clears only this play session. Simulator state does not award course completion.", example: 'if (input.type === "restart") return initialState();' },
  ],
}, [
  {
    title: "Know the starting game", concepts: ["Baseline", "Reproduction", "Observable state"],
    goals: ["Reproduce the supplied game's behaviour before changing its rules.", "Implement a truthful state summary without mutating gameplay."],
    extension: "Record two different routes to the first beacon. Compare their energy cost and identify which observations explain the difference.",
    activities: {
      learn: ["The baseline is a working one-beacon game. Start at (1,3) with 40 energy; each valid cell costs one, walls cost nothing, and reaching amber at (3,3) wins. Before remixing, reproduce a short input sequence and record what it actually does.", "Knowing the original behaviour gives you something concrete to preserve or deliberately change."],
      predict: ["From a fresh state, start and move right twice. Predict position, rescued count, remaining count, energy and status after each action. Then send another move after victory.", "A completed round stays frozen until restart; an extra key press is not a new round."],
      build: ["Implement describeState to return status, x, y, rescued count, remaining count and energy. Derive the values from its argument without changing it. Keep update and rules unchanged while you make the baseline easier to inspect.", "The summary reports evidence; it must not manufacture a score or trigger another movement."],
      run: ["Play the predicted sequence with keyboard and onscreen controls. Compare the state summary after each action, test a board edge and restart for a fresh run. Save this known baseline before experimenting.", "A text summary provides the same evidence without depending on the moving player image."],
      assess: ["Check the summary on ready, moving, won and tired states, including remaining counts. Verify that reading the summary changes no source state and that the original movement, wall and restart rules still work.", "A correct-looking string is insufficient if producing it secretly changes the game."],
      inspect: ["If counts disagree, inspect the difference between rescued IDs and all beacon records. If reading status moves the player, inspect calls inside describeState. Compare one expected action with its actual state transition.", "Inspect the first disagreement rather than starting from a vague claim that the whole game is broken."],
      fix: ["Repair the summary and replay the short right-right sequence plus restart. Confirm baseline game behaviour remains unchanged and save the verified source as a named starting point.", "Keep your evidence small enough that another learner could reproduce it from the same fresh state."],
      explain: ["Choose what makes a baseline reproducible and describe one rule you observed. Distinguish a prediction written before running from a result recorded after the run.", "Predictions and observations can disagree; that disagreement is useful evidence for investigation."],
      reward: ["Save Known baseline. You can now explain the original game from observable state. Next you will define a remix whose purpose and limits are clear enough to test.", "Retain the baseline slot so future changes can be compared with a working version."],
    },
    questions: {
      learn: { question: "Why reproduce the baseline before changing it?", choices: ["To know which behaviour a change preserves or alters", "To avoid testing any later change", "To assume every suggestion is correct"], correctChoice: 0, feedback: "A recorded baseline establishes observable behaviour against which the effect of a proposed change can be compared." },
      predict: { question: "After start and two right moves in the baseline, what energy remains?", choices: ["40", "38", "Zero"], correctChoice: 1, feedback: "Both moves are valid cells and cost one energy each, taking the initial 40 to 38 when amber is rescued." },
      explain: { question: "What should describeState do to its input?", choices: ["Advance one extra movement", "Clear rescued IDs", "Read it without mutation"], correctChoice: 2, feedback: "An observation helper should report the current game rather than changing the thing it is meant to explain." },
    },
  },
  {
    title: "Give the remix a purpose", concepts: ["Audience", "Intent", "Acceptance criteria"],
    goals: ["Write a bounded brief for a three-beacon rescue game.", "Change the objective while preserving the baseline's movement and evidence rules."],
    extension: "Write an alternative audience for the same game and discuss which proposed change would serve it. Keep this as a separate idea rather than expanding the current task without a limit.",
    activities: {
      learn: ["A useful remix brief names an audience, a goal and constraints. This project grows the rescue from one beacon to three, then adds an optional two-cell dash. Preserve ordinary movement, intermediate wall checks, once-only rescues and a fresh restart throughout.", "A broad request such as make it better does not identify a result you can verify."],
      predict: ["With targetCount changed from one to three, predict what happens after the same right-right sequence. Identify which state fields change meaning and which movement and energy results remain the same.", "Amber is now one part of the objective; the same position no longer necessarily means the round is won."],
      build: ["Complete brief.json using fictional information and three to six concrete constraints. Give rules an authored title and targetCount=3, keeping stride=1 for now. Ensure initialState selects all three beacons and describeState reports the new remaining count.", "Changing the objective is this mission's focused implementation; keep the dash change for the next mission."],
      run: ["Restart after editing rules so the new round uses them. Rescue amber and inspect the remaining two targets. Plan a route around the wall to mint and violet, comparing energy and status along the way.", "Editing rules must not silently change the beacon list inside an already-running state."],
      assess: ["Check a fresh three-beacon state, authored title, bounded brief and once-only collection. The original movement, wall, energy and restart behaviour must still pass while victory now requires all selected beacons.", "The brief records intention; independent behaviour checks establish whether the implementation actually follows the course rules."],
      inspect: ["If amber still ends the round, inspect a hard-coded win condition. If remaining is wrong, inspect the summary's source values. If a running round changes unexpectedly, inspect whether update rebuilds objectives from rules mid-game.", "Follow the goal from configuration into fresh state and then into the terminal decision."],
      fix: ["Repair the objective flow and replay amber-only progress followed by a complete three-target route. Keep ordinary controls unchanged and compare the result against the baseline constraints in your brief.", "Avoid changing several unrelated rules while fixing the goal; a focused difference is easier to explain."],
      explain: ["Choose which brief describes an observable change and explain how one constraint protected existing behaviour. State which evidence demonstrates the three-target objective rather than merely repeating the title.", "A renamed heading does not prove that the playable rules changed."],
      reward: ["Save Three-beacon purpose. Your remix now has a distinct objective and a clear brief. Next you will implement the optional dash while protecting every intermediate movement rule.", "Keep the one-beacon baseline and the three-beacon version in separate named slots."],
    },
    questions: {
      learn: { question: "Which request gives a testable remix objective?", choices: ["Make everything more exciting", "Require three beacons while preserving ordinary movement", "Change whatever seems interesting"], correctChoice: 1, feedback: "The request names an observable objective and a preservation constraint, giving the implementation a clear scope." },
      predict: { question: "After rescuing amber in a fresh three-beacon game, how many remain?", choices: ["Zero", "Three", "Two"], correctChoice: 2, feedback: "One of the three selected beacons has been rescued, so two remain and the round is still playing." },
      explain: { question: "What proves that the objective changed beyond its title?", choices: ["The state and win condition require all three rescues", "The heading has more characters", "The brief says the idea is finished"], correctChoice: 0, feedback: "Observable state transitions and terminal behaviour provide evidence that the actual playable objective changed." },
    },
  },
  {
    title: "One change with clear limits", concepts: ["Incremental implementation", "Intermediate state", "Resource conservation"],
    goals: ["Implement an optional two-cell dash using the existing movement rules.", "Check and account for every intermediate cell instead of jumping directly to a destination."],
    extension: "Compare ordinary movement and a dash on the same route. Record their action counts and energy costs, explaining why fewer button presses should not mean free travel.",
    activities: {
      learn: ["A dash requests two cell moves in one action; it does not teleport. Set configured stride to two and use const stride = input.dash === true ? rules().stride : 1; to select one or two. Visit each cell in order, applying walls, energy, collection and terminal checks after each step.", "Only the explicit boolean true requests a dash. Missing, false or unrelated values preserve ordinary movement."],
      predict: ["Start at x=4,y=3 facing the wall at x=5. Predict a right dash. Then consider a dash whose first cell contains the final beacon with one energy remaining. Decide whether a second step may occur.", "A blocked intermediate cell ends the action, and a terminal result ends it immediately after a valid cell."],
      build: ["Refactor the one-cell movement into a loop bounded by selected stride. Compute each next cell from the latest state, stop on blocked or terminal outcomes, and charge energy only for cells actually entered. Keep collection before the tired check so a last-energy rescue wins.", "A loop bound of at most two makes the action finite and easy to trace. Do not loop until the game eventually succeeds."],
      run: ["Try a clear dash, a wall on the first cell, a wall on the second cell and a beacon on an intermediate cell. Compare ordinary movement with dash from the same saved source and initial state.", "Read the coordinate and energy trace step by step rather than judging only the final position."],
      assess: ["Check explicit dash selection, ordinary movement, intermediate walls and edges, energy per entered cell, once-only intermediate collection and terminal priority. The source must implement the movement sequence, not just change a display setting.", "A destination-only collision check misses obstacles between the start and end of a dash."],
      inspect: ["If a dash crosses a wall, inspect each next-cell check. If it charges two energy after moving once, inspect where decrement occurs. If victory becomes tired, inspect the order of collection and terminal decisions.", "Locate the first wrong intermediate state; a later correction cannot undo an invalid earlier move."],
      fix: ["Repair the specific step rule and replay its failing scenario plus a clear dash. Recheck a normal one-cell move and a complete rescue to confirm the new action preserves the constraints in your brief.", "Do not remove the dash or relax wall rules to make a failing case disappear."],
      explain: ["Choose why a multi-cell action needs intermediate checks. Explain how conserving energy per real cell preserves the game's rules even though a dash reduces the number of input actions.", "One user action can contain several valid state transitions, each with its own conditions and effects."],
      reward: ["Save Bounded dash. Your remix now has a purposeful new playable action. Next you will review two actual source proposals and distinguish a safe refactor from a tempting rule-breaking shortcut.", "Keep ordinary and dashed movement examples for the upcoming diff review."],
    },
    questions: {
      learn: { question: "How should a two-cell dash check collisions?", choices: ["Only at the final destination", "Only before the course begins", "Before entering each intermediate cell"], correctChoice: 2, feedback: "Each cell is a separate movement step, so a wall or edge on the way must stop the dash before it crosses that boundary." },
      predict: { question: "The first dash step rescues the final beacon using the last energy; what happens?", choices: ["The round wins and the dash ends", "A second step always occurs", "Victory is replaced by tired"], correctChoice: 0, feedback: "Collection and victory are resolved before exhaustion, and a terminal result prevents another dash step." },
      explain: { question: "Why charge energy for entered cells rather than requested stride?", choices: ["To make blocked travel free of all rules", "To account for actual movement when a dash stops early", "To ignore obstacles"], correctChoice: 1, feedback: "A blocked second step never occurs, so only completed cell transitions should consume the movement resource." },
    },
  },
  {
    title: "Read what the diff changes", concepts: ["Source diff", "Constraints", "Explicit review"],
    goals: ["Reject a proposed shortcut that violates ordinary movement.", "Apply a reviewed helper refactor only when its current-source context matches."],
    extension: "Write a short review of the rejected proposal without using the author's stated intent as proof. Cite the changed expression and one input that exposes its effect.",
    activities: {
      learn: ["A diff shows exact source before and after. One authored proposal replaces conditional stride with rules().stride, claiming to simplify movement. Another calls a named requestedStride helper. Inspect the changed behaviour and prerequisites; a suggestion's confident explanation is not evidence that it is correct.", "The suggestions are versioned teaching examples. No live AI service is needed, and neither proposal is applied automatically."],
      predict: ["For the unconditional-stride proposal, predict an ordinary move with dash=false and configured stride two. For the helper proposal, predict what happens if requestedStride has not been defined yet.", "One change breaks an existing rule; the other has a dependency that must be implemented and verified before acceptance."],
      build: ["Reject the unconditional-stride proposal with the ordinary-move counterexample. Define requestedStride using the explicit-boolean rule, then review and accept the helper-call proposal if its original snippet matches your current source exactly once. Otherwise reconcile your source and review again.", "Do not apply a stale proposal by guessing a location. A mismatch is a reason to inspect the current version, not overwrite unrelated work."],
      run: ["Compare before and after source, run an ordinary move and a dash, and call the helper with true, false and absent dash. Inspect the actual state changes after the accepted refactor and compare them with your prediction.", "The review panel should show removed and added text with labels, not rely on red and green colours alone."],
      assess: ["Check requestedStride independently and confirm update uses it while preserving all intermediate checks. Verify both source-review decisions and the current saved project's behaviour; accepting a proposal alone cannot award a passing result.", "An unused correct helper does not prove that the playable update function follows the reviewed rule."],
      inspect: ["If ordinary movement now dashes, inspect which proposal was accepted. If execution fails, inspect the helper definition and call. If the diff context is stale, compare the current source against its exact original snippet before changing anything.", "Keep the review reason separate from the execution result so both can be examined."],
      fix: ["Repair the refactor and rerun ordinary, dashed, blocked and terminal cases. Keep or restore the last known working save if needed, then save and assess the corrected current source.", "Rejecting a poor suggestion is a successful review decision when you can explain the violated requirement."],
      explain: ["Choose why a shorter diff can still be wrong. Explain one prerequisite you checked before accepting the helper proposal and the regression evidence that supports your decision.", "Reason from the changed expression and observed behaviour rather than the source or confidence of the suggestion."],
      reward: ["Save Reviewed refactor. You have practised both accepting and rejecting concrete source changes. Next you will encode important examples as repeatable regression cases for future edits.", "Keep a note of the ordinary-move counterexample; it is a useful test case as well as a review argument."],
    },
    questions: {
      learn: { question: "What should determine whether a proposal is accepted?", choices: ["Its actual change, constraints and observed evidence", "How confident its explanation sounds", "Whether it makes the file shorter"], correctChoice: 0, feedback: "Review depends on what the source change does and whether verified behaviour satisfies the stated requirements." },
      predict: { question: "Unconditional configured stride two is used for dash=false; what breaks?", choices: ["The title length", "Ordinary movement now travels two cells", "The existence of the board"], correctChoice: 1, feedback: "Removing the condition makes every movement use stride two, violating the requirement that ordinary input stays one cell." },
      explain: { question: "What should happen when a proposal's original snippet no longer matches once?", choices: ["Overwrite the whole project", "Apply it to every approximate match", "Review and reconcile the current source first"], correctChoice: 2, feedback: "A stale or ambiguous context cannot safely identify the intended change, so the current version needs another review." },
    },
  },
  {
    title: "Protect the working rules", concepts: ["Executable examples", "Regression", "Expected results"],
    goals: ["Write replay cases with independent expected results for important game rules.", "Use failing cases to repair behaviour without weakening the original requirements."],
    extension: "Add a regression for a last-energy final rescue. Work out the expected terminal state before running it and explain which order of operations the case protects.",
    activities: {
      learn: ["acceptanceCases returns four to eight named replays, each starting from initialState. Supply documented actions and an expected projection of x, y, energy, ordered rescued IDs and status. Include wall, edge, dash and restart cases, using at most 80 actions per case.", "Expected results are predictions of the requirement. Copying whatever a broken run produced would preserve the defect instead."],
      predict: ["For start, left, left from the final three-beacon game, predict x=0,y=3,energy=39,rescued=[] and playing status. Explain why the blocked second left consumes no energy and does not leave the board.", "This small edge case tests movement validity and resource accounting together."],
      build: ["Implement acceptanceCases with distinct useful names, bounded action lists and complete expected projections. Derive expectations before executing them. Include ordinary and dashed behaviour, a blocked intermediate step and restart after changes to state.", "A case called Wall check that never approaches a wall is not evidence for that rule; inspect what the actions actually exercise."],
      run: ["Run your cases against the saved project and compare each expected projection with the actual result. Temporarily introduce the reviewed unconditional-stride defect in a separate save and confirm a regression catches it.", "Keep the passing project safe while using a deliberately wrong variant to test whether the test can detect failure."],
      assess: ["Check case shape and limits, useful scenario coverage and exact expected outcomes. The independent assessment also runs scenarios beyond your examples, including terminal priority and repeat-safe collection.", "Learner-written tests help explain the project but cannot declare their own score or replace independent verification."],
      inspect: ["For a failing replay, find the first action that differs from the rule. Decide whether the implementation is wrong or your expected projection was calculated incorrectly, using the documented contract to distinguish them.", "Do not decide that the expected value is wrong merely because the current programme produced something else."],
      fix: ["Repair the code or an incorrectly reasoned expectation, then replay the focused case and the full set. Restore the correct version after the deliberate-defect experiment and verify every saved case again.", "Removing a failing case or relaxing a rule is not a repair of the underlying behaviour."],
      explain: ["Choose what makes a regression case useful and explain which real defect your case detects. Describe a scenario that your current examples do not cover and why independent checks remain necessary.", "A passing set is evidence for the cases it exercises, not proof that every possible input is correct."],
      reward: ["Save Protected rules. Your remix now carries executable examples that can challenge future edits. The final mission brings the brief, gameplay, diff review and tests together into a complete showcase.", "Keep your testable counterexample beside the reviewed source version."],
    },
    questions: {
      learn: { question: "How should an expected test result be chosen?", choices: ["Copy the current output without checking the rule", "Derive it from the requirement before running the case", "Use any value that makes the check pass"], correctChoice: 1, feedback: "An independent prediction tests whether the implementation meets the requirement instead of merely repeating its current behaviour." },
      predict: { question: "Start, left, left from (1,3) should leave which energy value?", choices: ["38", "40", "39"], correctChoice: 2, feedback: "Only the first left enters a valid new cell; the second is blocked at the edge and consumes no energy." },
      explain: { question: "What makes a regression case useful after a repair?", choices: ["It detects the earlier defect if that behaviour returns", "Its name sounds reassuring", "It never executes the changed path"], correctChoice: 0, feedback: "A useful regression exercises the protected behaviour and fails when the previously repaired defect is reintroduced." },
    },
  },
  {
    title: "Your rescue remix", concepts: ["Integration", "Evidence-based showcase", "Trade-offs"],
    goals: ["Finish a playable three-beacon rescue with a bounded optional dash.", "Explain the remix through its brief, reviewed source and verified behaviour."],
    extension: "Propose a further original rule in a separate saved experiment. State its intended benefit, preservation constraints and new tests before changing the completed version.",
    activities: {
      learn: ["A finished remix connects purpose to implementation and evidence. Your three-beacon objective, optional dash, once-only rescues, energy accounting and restart must work together. The brief explains the choices; state summaries, reviewed differences and regression cases let another person verify them.", "An attractive title or a confident proposal is not a substitute for a playable result."],
      predict: ["Plan a full route to all three beacons, marking ordinary moves, dashes and wall detours. Estimate energy before playing. Predict how the final state should respond to extra movement and then to restart.", "Treat each intermediate dash cell as part of the route when counting both travel and collection."],
      build: ["Finish the current source, title, brief and acceptance cases. Keep requestedStride, movement checks and describeState consistent. Remove abandoned experimental behaviour, preserving one clear implementation of the completed rules.", "An authored title can express your theme while the documented playable contract stays testable."],
      run: ["Play a full rescue with keyboard input, then onscreen movement and dash controls. Compare the same action sequence with reduced motion and inspect state summaries. Exercise victory, exhaustion, restart and a saved-version reload.", "The project must remain understandable without needing to follow animation or distinguish colours alone."],
      assess: ["Run final saved-source checks across objectives, ordinary and dashed movement, intermediate collisions, collection, energy, terminal priority, restart, bounded examples and the reviewed helper. Completion also requires the preceding six-mission activity sequence.", "Current-source evidence matters: a successful result from an older save cannot establish that new edits work."],
      inspect: ["Find the earliest mismatch between your stated constraint and a real replay. Classify it as goal, input, movement, accounting, summary or test error, then use the smallest evidence-backed change that repairs it.", "Inspect both the source difference and its effect; a small patch can still have a wide behavioural impact."],
      fix: ["Repair the failing rule and rerun its case plus a complete rescue. Save the final source in a named slot and assess it again before finishing. Keep baseline and final versions available for an honest comparison.", "Do not delete evidence of an earlier failure; use it to explain what the repair changed."],
      explain: ["Choose what demonstrates the remix is complete and explain one trade-off introduced by the dash. Describe the suggestion you rejected, the refactor you accepted and the evidence behind both decisions.", "You own the final review decision whether an idea came from authored teaching material, a person or an optional future assistant."],
      reward: ["Save Rescue remix and finish the final assessment. You have turned a bounded idea into a playable project, reviewed actual changes and protected important rules with tests. Replay a mission or begin another experiment while retaining earned completion.", "Authored suggestions, private play and assessment work without a live AI service. Keep your tested project before extending its rules."],
    },
    questions: {
      learn: { question: "Which combination supports a complete remix?", choices: ["A new title and no working controls", "An accepted suggestion without testing", "A clear goal, working source and verified behaviour"], correctChoice: 2, feedback: "Completion connects the intended change to an implemented project and evidence that its documented rules work together." },
      predict: { question: "After all three beacons are rescued, what should an extra move do?", choices: ["Preserve the won state until restart", "Spend hidden extra energy", "Start another round automatically"], correctChoice: 0, feedback: "Victory is terminal for the current round, so later movement preserves its result until an explicit restart." },
      explain: { question: "Who remains responsible for accepting a source change?", choices: ["The proposal's confident wording", "The learner reviewing constraints and evidence", "The number of lines removed"], correctChoice: 1, feedback: "The learner makes the review decision based on the actual change and evidence, regardless of where the suggestion originated." },
    },
  },
]);

export const suggestions: LearningCourseSuggestionV1[] = [
  { stageId: "vibe-game-remix-lab.m4.build", proposal: {
    id: "remix-always-dash", source: "authored-fallback", intent: "Simplify stride selection without changing ordinary movement.",
    constraints: ["Ordinary movement must remain one cell.", "Only explicit dash=true may select configured stride."],
    permittedArtifactId: "game.js", originalSnippet: "const stride = input.dash === true ? rules().stride : 1;",
    replacementSnippet: "const stride = rules().stride;",
    explanationPrompt: "Does this proposed simplification preserve the ordinary movement constraint?",
    aiOptional: false, learnerApprovalRequired: true, alternatives: ["accept", "reject"],
  } },
  { stageId: "vibe-game-remix-lab.m4.build", proposal: {
    id: "remix-named-stride", source: "authored-fallback", intent: "Use the reviewed requestedStride helper for the existing selection rule.",
    constraints: ["Define requestedStride first with the same explicit-boolean rule.", "Preserve each intermediate cell check and all terminal decisions."],
    permittedArtifactId: "game.js", originalSnippet: "const stride = input.dash === true ? rules().stride : 1;",
    replacementSnippet: "const stride = requestedStride(input);",
    explanationPrompt: "Which checks establish that the helper refactor preserves both ordinary and dashed movement?",
    aiOptional: false, learnerApprovalRequired: true, alternatives: ["accept", "reject"],
  } },
];
