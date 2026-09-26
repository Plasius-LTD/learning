import { authorCourse } from "./course-authoring.js";
import type { LearningCourseSuggestionV1 } from "../course-suggestions.js";

export const { course, practice } = authorCourse({
  slug: "vibe-bug-detective", title: "Vibe Bug Detective", category: "vibe",
  summary: "Repair an intentionally broken rescue game using reproducible evidence. Investigate direction, board boundaries, energy accounting and duplicate rescues, then protect the repairs with terminal-state and restart tests. Review authored suggestions and finish an evidence-backed casebook. Live AI is not required.",
  projectFiles: [{ path: "game.js", language: "javascript", maximumCharacters: 32000 }, { path: "evidence.json", language: "json", maximumCharacters: 12000 }],
  starterProject: { files: [{ path: "game.js", source: `function initialState() {
  return { player: { x: 1, y: 2 }, beacons: [{ id: "copper", x: 3, y: 2 }, { id: "silver", x: 7, y: 4 }],
    rescued: [], energy: 24, status: "ready" };
}

function canEnter(x, y) {
  return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x <= 10 && y >= 0 && y <= 6
    && !(x === 5 && y >= 1 && y <= 3);
}

function update(state, input) {
  if (input.type === "restart") return { ...initialState(), rescued: state.rescued };
  const next = JSON.parse(JSON.stringify(state));
  if (input.type === "start" && next.status === "ready") next.status = "playing";
  if (input.type !== "move" || next.status === "ready") return next;
  const directions = { up: [0,-1], right: [-1,0], down: [0,1], left: [1,0] };
  if (!Object.hasOwn(directions, input.direction)) return next;
  const [dx, dy] = directions[input.direction];
  const x = next.player.x + dx;
  const y = next.player.y + dy;
  next.energy -= 1;
  if (canEnter(x, y)) next.player = { x, y };
  for (const beacon of next.beacons) {
    if (beacon.x === next.player.x && beacon.y === next.player.y) next.rescued.push(beacon.id);
  }
  if (next.rescued.length >= 2) next.status = "won";
  else if (next.energy === 0) next.status = "tired";
  return next;
}

function acceptanceCases() { return []; }
` }, { path: "evidence.json", source: '{\n  "cases": []\n}\n' }] },
  reference: [
    { name: "documented world", signature: "10 columns × 6 rows", description: "Valid coordinates are x=0–9 and y=0–5. Start at (1,2) with 24 energy. Copper is at (3,2), silver at (7,4), and the exit at (8,2). Wall cells are (5,1), (5,2), (5,3). The starter deliberately violates some rules; use this reference as the expected contract.", example: "const inBounds = x >= 0 && x < 10 && y >= 0 && y < 6;" },
    { name: "update", signature: "update(state, input) → next state", description: "Actions are start, move with up/right/down/left, and restart. Right adds one to x, left subtracts one, down adds one to y and up subtracts one. Unknown actions or directions preserve values. Return detached state without mutating input; movement is permitted only while playing.", example: 'update(state, { type: "move", direction: "right" });' },
    { name: "movement accounting", signature: "one energy per valid entered cell", description: "Check bounds and walls before committing position or energy. Blocked movement leaves all state values unchanged. A valid move costs one energy and can collect a beacon on its destination. No dash or automatic multi-cell movement exists in this project.", example: "if (!canEnter(x, y)) return next;" },
    { name: "rescue identity", signature: "rescued: unique beacon ID array", description: "Collect copper and silver once each when entering their cells. Return visits do not append another ID or erase the earlier rescue. Preserve first-collection order. Repeated collection cannot substitute for finding the other beacon.", example: "if (!next.rescued.includes(beacon.id)) next.rescued.push(beacon.id);" },
    { name: "terminal and restart", signature: 'status: "ready" | "playing" | "won" | "tired"', description: "Win only with both distinct rescues and player at the exit (8,2). Check win before zero-energy tired, so a final-energy exit wins. Won and tired freeze all later actions except restart. Restart returns a fresh ready state, 24 energy and no rescues or shared nested state.", example: 'if (input.type === "restart") return initialState();' },
    { name: "evidence.json", signature: "{ cases: [{ name, expected, observed, hypothesis, change, regression }] }", description: "Keep one concise fictional record for each of the five investigations. Each field is text from 10–400 characters except name, which is 3–60. Distinguish the rule, observed failure, proposed explanation, actual edit and later check. These notes explain reasoning; independent execution remains assessment authority.", example: '{ "name": "Right moves left", "expected": "From x=1 a right move reaches x=2", "observed": "The supplied programme reached x=0", "hypothesis": "The right direction vector has a reversed sign", "change": "Correct the right vector and check the paired left vector", "regression": "Replay right and left from a fresh state" }' },
    { name: "acceptanceCases", signature: "acceptanceCases() → 6–8 named replay cases", description: "Each case has name, actions and expected {x,y,energy,rescued,status}, starting from initialState. Names are 3–60 characters, each action list contains 1–80 documented actions and rescued is an ordered ID array. Exercise directions, board bounds, blocked energy, a return visit, terminal freeze and fresh restart.", example: '{ name: "Right direction", actions: [{type:"start"},{type:"move",direction:"right"}], expected: {x:2,y:2,energy:23,rescued:[],status:"playing"} }' },
  ],
}, [
  {
    title: "Reproduce the wrong turn", concepts: ["Expected versus observed", "Minimal reproduction", "Direction vectors"],
    goals: ["Reproduce the incorrect horizontal movement from a fresh state.", "Repair direction signs and record a focused evidence trail."],
    extension: "Compare the direction convention with a paper grid whose y axis points upward. Explain why using one documented convention consistently matters more than assuming all grids share it.",
    activities: {
      learn: ["The starter contains deliberate defects. Begin with a single claim: right from (1,2) should reach (2,2). Record the expected coordinate before running start and right, then compare the observed result. A reproducible difference is more useful than a vague report that movement feels wrong.", "Later missions investigate other defects; concentrate this first repair on the horizontal direction rule."],
      predict: ["Read the supplied direction map and predict the result of right and left from separate fresh states. Compare those predictions with the documented coordinate convention and identify the sign mismatch.", "A prediction of what the current code does can differ from what the specification says it should do."],
      build: ["Correct the right and left vectors while preserving up and down. Add the first evidence.json case with expected result, actual failure, hypothesis, specific change and a regression sequence. Keep unrelated accounting and collection edits for their investigations.", "The casebook is a reasoning record, not a place to paste personal information or a claim of automatic completion."],
      run: ["Replay start/right and start/left from fresh states, then check up and down. Use keyboard and onscreen controls and compare numeric coordinates after each action.", "Restart between independent examples so one test's position does not affect the next."],
      assess: ["Check all four direction vectors, unknown directions and input-state preservation. Verify that the evidence record distinguishes the original observed failure from the repaired result.", "Passing the direction mission does not claim that the other deliberate starter defects are repaired yet."],
      inspect: ["If only right works, inspect the paired left entry. If vertical movement changed, inspect the actual diff for an unrelated edit. If tests depend on their order, inspect fresh-state setup and mutation.", "Use the smallest failing sequence that still demonstrates the discrepancy."],
      fix: ["Repair the direction map and replay all four one-step cases. Save the current source and update the regression note with what the new evidence demonstrates, retaining the earlier failure description.", "Do not rewrite the observed history as if the first run had always passed."],
      explain: ["Choose the hypothesis supported by the one-step evidence and explain why changing a beacon position would conceal rather than repair the wrong direction.", "Fix the rule that caused the discrepancy instead of moving the goal to match the defect."],
      reward: ["Save Correct directions. You have completed a small investigation from observation through repair. Next you will shrink a board-edge failure into an exact boundary case.", "Keep the four direction cases for every later source change."],
    },
    questions: {
      learn: { question: "What is the smallest useful reproduction of the right-direction defect?", choices: ["Fresh state, start, one right move", "An unrecorded long play session", "Changing every direction at once"], correctChoice: 0, feedback: "A one-step sequence from a known state isolates the direction rule and gives another learner an exact reproduction." },
      predict: { question: "The starter maps right to [-1,0]; from x=1 where does it move?", choices: ["x=2", "x=0", "x=10"], correctChoice: 1, feedback: "Adding the supplied negative horizontal delta moves from one to zero, contrary to the documented rightward convention." },
      explain: { question: "Why would moving the beacon left fail to repair the direction rule?", choices: ["Because beacons have no coordinates", "Because left can never be valid", "Because it changes the goal instead of correcting the wrong movement"], correctChoice: 2, feedback: "Changing the destination can hide one symptom while the incorrect direction continues affecting every other route." },
    },
  },
  {
    title: "Shrink the failing example", concepts: ["Boundary cases", "Isolation", "Off-by-one errors"],
    goals: ["Identify the difference between board dimensions and valid coordinate limits.", "Repair edge validation without weakening wall or integer-coordinate checks."],
    extension: "Construct the corresponding upper and lower y-boundary cases. Explain why testing only the right edge would leave another off-by-one defect undiscovered.",
    activities: {
      learn: ["A board with ten columns has x coordinates 0–9, not 0–10. The starter accepts an extra column and row. Isolate canEnter with exact boundary values before debugging a long route that happens to leave the board.", "Shrinking a failure means removing irrelevant actions while preserving the rule violation."],
      predict: ["Predict canEnter results for (9,0), (10,0), (0,5), (0,6), (-1,0) and (1.5,0). Then compare the valid edge with wall cell (5,2), which is inside the board but not enterable.", "Inside the rectangular range and free of a wall are separate requirements."],
      build: ["Correct the upper comparisons to x<10 and y<6. Preserve nonnegative integer validation and the wall condition. Add a boundary investigation record explaining the dimensions, observed extra coordinate and repaired rule.", "Do not remove the wall test merely because a coordinate lies inside the board."],
      run: ["Probe the exact edge and outside values, then play toward the right edge through a clear row. Confirm the last valid cell is reachable and the next move stays inside the board.", "A clear row isolates bounds from the central wall, helping you tell which condition caused a refusal."],
      assess: ["Check all four edges, outside coordinates, fractional coordinates and wall cells. The direction repairs must remain valid. Resource accounting is investigated next; this mission isolates where movement is permitted.", "Each mission builds on earlier verified behaviour while naming the new condition it is testing."],
      inspect: ["If valid edge cells are rejected, inspect whether you subtracted one twice. If an extra row remains, inspect the y comparison separately. If walls become passable, inspect a dropped conjunction in canEnter.", "Record expected and actual booleans for each coordinate before changing another part of update."],
      fix: ["Repair the range predicate and replay valid-edge, just-outside and wall cases. Then rerun the four direction examples to ensure the focused boundary edit preserved movement mapping.", "A good boundary repair accepts the final valid coordinate and rejects the immediately adjacent invalid one."],
      explain: ["Choose why dimensions and maximum indices differ. Explain how testing canEnter directly reduced the failing example while a later gameplay replay still checked integration.", "A small helper test and a full action sequence provide complementary evidence."],
      reward: ["Save Correct boundaries. Your rover now remains inside its documented board. Next you will investigate energy loss on a blocked move and compare competing explanations for the symptom.", "Keep both x and y edge examples in your casebook."],
    },
    questions: {
      learn: { question: "What is the largest valid x coordinate on this ten-column board?", choices: ["x=10", "x=9", "x=11"], correctChoice: 1, feedback: "Coordinates start at zero, so ten columns occupy indices zero through nine." },
      predict: { question: "How should canEnter treat the in-bounds wall coordinate (5,2)?", choices: ["Always accept it", "Move it to the nearest free square", "Reject it because the wall also matters"], correctChoice: 2, feedback: "Being inside the rectangular board is necessary but not sufficient; a wall still prevents entry." },
      explain: { question: "Why test the boundary helper before replaying a long route?", choices: ["It isolates the faulty condition with fewer unrelated actions", "It removes the need for any integration check", "It makes outside coordinates acceptable"], correctChoice: 0, feedback: "Direct boundary examples reduce the failure to one predicate, while later route tests confirm the repaired helper is used correctly." },
    },
  },
  {
    title: "Compare two explanations", concepts: ["Hypotheses", "Control experiments", "Resource accounting"],
    goals: ["Explain energy loss from a blocked action using source and a controlled comparison.", "Reject a symptom-hiding proposal and charge only completed movement."],
    extension: "Compare an out-of-bounds block with a wall block. Explain why both should preserve energy even though different conditions reject their destination.",
    activities: {
      learn: ["A blocked move should change no state, but the starter spends energy before checking the destination. Compare two hypotheses: every action is intentionally charged, or the decrement happens before successful movement is known. Use the documented rule and a clear/blocked pair to distinguish them.", "A hypothesis is an explanation to test, not a conclusion established by confident wording."],
      predict: ["From x=4,y=2 facing the wall, predict position and energy after right. Compare with a valid left from the same state. Then predict what the authored refill-energy proposal would do on several valid moves.", "Refilling to 24 hides one loss while breaking the rule that valid cells cost one energy each."],
      build: ["Reject the refill proposal with a valid-move counterexample. Return unchanged when canEnter rejects the destination, then commit position and subtract one only for an entered cell. Record the competing hypotheses, the discriminating experiment and the actual repair.", "Keep collection after a valid move; a blocked action should not revisit collection logic or alter any other state."],
      run: ["Run a clear move and a blocked move from comparable states. Inspect energy and complete state before and after. Repeat at an outer edge, then send an unknown direction to check it remains a no-op too.", "Compare all state fields rather than declaring success from the player staying in place."],
      assess: ["Check one energy per valid cell, no cost for either kind of block, unknown-input preservation and input immutability. Recheck direction and boundary fixes and the reason for rejecting the refill suggestion.", "The assessment distinguishes correcting accounting from setting energy to a constant that happens to look favourable."],
      inspect: ["If energy is still spent, inspect the early return relative to decrement. If energy never falls, inspect whether the rejected refill was used. If a blocked action changes rescued IDs, inspect whether collection executes after refusal.", "A complete unchanged-state comparison can reveal effects hidden by a stationary player image."],
      fix: ["Repair the accounting order and replay valid, wall-blocked and edge-blocked moves. Update your casebook with the evidence that separated the two hypotheses and rerun earlier direction and boundary examples.", "Do not redefine blocked movement to justify the defect; repair the implementation to match the established contract."],
      explain: ["Choose which experiment distinguishes the hypotheses and explain why a refill is a symptom treatment rather than a minimal accounting repair.", "A useful repair explains both the failing case and the ordinary behaviour that must remain valid."],
      reward: ["Save Correct accounting. You have used a controlled comparison to choose a repair over a tempting shortcut. Next you will investigate a repeated visit that incorrectly counts as another rescue.", "Keep the clear/blocked pair as a regression for later control-flow changes."],
    },
    questions: {
      learn: { question: "What evidence helps distinguish two explanations for blocked-move energy loss?", choices: ["The length of each explanation", "A clear move and a blocked move compared against the rule", "Repeating the same claim more confidently"], correctChoice: 1, feedback: "A controlled comparison exercises the different conditions and reveals which explanation matches both the requirement and observed effects." },
      predict: { question: "What is wrong with setting energy to 24 on every move?", choices: ["It makes walls visible", "It changes the board dimensions", "It removes the required cost of valid movement"], correctChoice: 2, feedback: "Refilling hides the blocked-move loss but also prevents valid cell movement from consuming its documented energy cost." },
      explain: { question: "Where does the energy decrement belong?", choices: ["After destination validation, for a committed entered cell", "Before every input is inspected", "Inside the state-summary display"], correctChoice: 0, feedback: "Charging after a successful movement decision accounts only for the cell transition that actually occurred." },
    },
  },
  {
    title: "Repair the duplicate rescue", concepts: ["Identity", "Idempotence", "Focused source review"],
    goals: ["Count each distinct beacon once while preserving earlier rescues.", "Review and verify a minimal duplicate-collection guard."],
    extension: "Compare preventing duplicates when collecting with removing duplicates only in the display. Explain which approach keeps the underlying state truthful for later win checks.",
    activities: {
      learn: ["The starter appends a beacon ID whenever its cell is visited. Returning to copper can therefore make two entries that look like two rescues. The correct state records distinct identities in first-collection order; another visit is not another target.", "A count derived from duplicate records can cause a false victory even if the visible route looks plausible."],
      predict: ["From a fresh game, enter copper, leave its cell and return. Predict the starter's rescued array and the correct array. Then visit silver and decide which earlier record must remain.", "Clearing the whole array before every collection avoids duplicates by losing valid history, which is another defect."],
      build: ["Inspect the authored unique-rescue diff and its exact source context. Accept it only after checking the once-only and preservation constraints, or implement the equivalent focused guard in your current source after review. Record the original duplicate evidence and the chosen repair.", "The proposal changes a real push operation; it does not award progress or apply itself without your decision."],
      run: ["Replay first copper visit, departure, return and later silver collection. Compare ordered ID arrays, energy and position. Keep the full trace so a later terminal-state problem can be investigated separately.", "A display showing two icons is not enough; inspect which two target identities the underlying state actually contains."],
      assess: ["Check first collection, repeated visit, first-collection order and preservation of another rescued target. Verify that blocked movement does not collect again and that the source-review explanation names the intended guarded effect.", "This repair addresses identity; the full exit and terminal rules are the next investigation."],
      inspect: ["If copper appears twice, inspect the membership test before push. If silver replaces copper, inspect destructive array assignment. If a proposal cannot match exactly once, compare it against your current source instead of forcing an approximate replacement.", "A stale diff is a source-version mismatch to review, not permission to overwrite unrelated edits."],
      fix: ["Repair collection and repeat first visit, return visit and second distinct target. Recheck movement accounting and the once-only record after a blocked action while standing on a beacon cell.", "Preserve evidence of legitimate earlier rescues and reject only the duplicate event."],
      explain: ["Choose why unique identity matters more than array length alone. Explain which regression would catch a return to the old unconditional push behaviour.", "A repeated observation of one target is not a second distinct achievement."],
      reward: ["Save Distinct rescues. Your casebook now includes an identity defect and a reviewed focused patch. Next you will finish exit, terminal and restart behaviour while protecting every earlier repair.", "Keep the return-visit sequence as a small, memorable regression case."],
    },
    questions: {
      learn: { question: "What should a second visit to copper add to rescued?", choices: ["Another copper entry", "A made-up silver entry", "Nothing, because copper is already recorded"], correctChoice: 2, feedback: "The record tracks distinct targets, so another visit to the same target contributes no new rescue identity." },
      predict: { question: "Copper is rescued, revisited, then silver is rescued; which ordered array is correct?", choices: ['["copper","silver"]', '["copper","copper","silver"]', '["silver"]'], correctChoice: 0, feedback: "The first copper record is retained, its duplicate is skipped and the first silver record is appended afterwards." },
      explain: { question: "Why is hiding duplicate icons insufficient as a repair?", choices: ["Icons cannot have labels", "The underlying duplicate state could still corrupt the win decision", "Every visit must count twice"], correctChoice: 1, feedback: "Correcting only presentation leaves false records available to other logic, including progress and terminal checks." },
    },
  },
  {
    title: "Keep the repairs working", concepts: ["Terminal state", "Fresh restart", "Regression suite"],
    goals: ["Require both rescues and the exit for victory, then freeze terminal state.", "Restore a genuinely fresh game on restart and exercise earlier repairs with executable cases."],
    extension: "Prepare a direct update example with one energy and both rescues beside the exit. Explain why the final movement must evaluate victory before exhaustion.",
    activities: {
      learn: ["The finished game wins only with copper, silver and the exit at (8,2). Won and tired freeze all actions except restart. The starter wins from count alone, permits later movement and carries rescued records through restart. Repair these related lifecycle decisions while retaining earlier fixes.", "Restart means a fresh state with fresh nested values, not a new player position attached to old rescue history."],
      predict: ["Predict status immediately after collecting silver away from the exit, then at the exit with both IDs. Compare an extra move after victory with restart, including energy and rescued records in the expected result.", "Complete collection is necessary but the documented exit condition is also required."],
      build: ["Require both distinct IDs and exit coordinates for victory. Check victory before zero-energy tired and allow movement only while playing. Return initialState on restart. Implement six to eight acceptanceCases covering directions, bounds, blocked cost, repeat collection, terminal freeze and restart.", "Write expected projections from the contract before executing each replay; the current programme's output is not its own oracle."],
      run: ["Complete a rescue-and-exit route, press movement after victory and restart. Exhaust a separate run and repeat the same checks. Run your earlier regression cases and compare fresh states to ensure arrays are not shared between sessions.", "Use the case names and actual action sequences together to see what each regression really exercises."],
      assess: ["Check exit requirements, final-energy priority, both terminal states, unknown actions, fresh restart and bounded replay cases. Independent scenarios retest every earlier direction, edge, energy and identity repair.", "A new lifecycle fix must preserve previously verified behaviour; a passing final screen alone does not establish that."],
      inspect: ["If collection wins early, inspect the exit condition. If terminal movement continues, inspect the playing guard. If restart retains rescues, inspect its return value and shared nested arrays. Trace the earliest failing replay action.", "Separate the failed rule from its visible symptom before choosing a change."],
      fix: ["Repair the lifecycle and run the focused failing case plus the complete regression set. Add the fifth investigation record with the original defects, corrected transitions and evidence from both won and tired restarts.", "Do not remove a regression merely because a later edit makes it fail; investigate the new discrepancy."],
      explain: ["Choose what makes restart genuinely fresh and explain one regression that protected an earlier repair during this mission. Describe why terminal freeze is a behaviour requirement rather than a decorative label.", "The state must enforce the finished round, including input that arrives after its visible ending."],
      reward: ["Save Stable lifecycle. Your game now has truthful rescues, a complete objective and a fresh restart. The final mission closes the casebook with an integrated investigation and verified project.", "Keep the full passing replay set alongside your final source version."],
    },
    questions: {
      learn: { question: "What is required for victory in the repaired game?", choices: ["Both distinct rescues and the exit position", "Any two array entries", "Visiting the exit without rescues"], correctChoice: 0, feedback: "The documented objective combines both target identities with arrival at the exit, rather than using count or position alone." },
      predict: { question: "What should restart after victory contain?", choices: ["Old rescues and zero energy", "A fresh ready state with 24 energy and no rescues", "A shared rescued array from the previous round"], correctChoice: 1, feedback: "Restart resets the play session completely and creates fresh nested state, preserving no earlier round's rescue records." },
      explain: { question: "Why rerun earlier cases after a terminal-state repair?", choices: ["Because prior fixes never worked", "To replace the requirements with new ones", "To catch regressions caused by the later change"], correctChoice: 2, feedback: "A later control-flow edit can affect earlier behaviours, so their existing cases check that the repaired rules remain intact." },
    },
  },
  {
    title: "The detective's casebook", concepts: ["Integrated evidence", "Review", "Limits of testing"],
    goals: ["Finish the repaired playable game and an honest five-investigation casebook.", "Demonstrate the result with current-source tests and explain what each repair changed."],
    extension: "Create a deliberately faulty variant in a separate save and ask which existing case detects it. If none does, add a justified example without weakening the completed source.",
    activities: {
      learn: ["A complete casebook connects five investigations: direction, bounds, blocked accounting, duplicate identity and lifecycle. Keep expected and observed results distinct, state your tested hypothesis and name the repair and regression. The finished game must support those explanations with current executable behaviour.", "Authored suggestions support the investigation but never replace your review decision or independent tests."],
      predict: ["Choose one earlier defect and predict the first regression that would fail if it returned. Plan a complete copper-silver-exit route and calculate its expected final coordinates, energy and ordered rescue list before playing.", "Make your prediction specific enough that another learner can replay the same actions and compare results."],
      build: ["Complete the five evidence records and six-to-eight executable cases. Keep the minimal repairs readable and remove unrelated experiments from the final game. Preserve a named earlier version if you want to demonstrate the difference honestly.", "A casebook describes fictional project observations; it does not need personal details or claims that all possible bugs are gone."],
      run: ["Play the repaired route with keyboard controls and repeat with onscreen controls. Test victory, exhaustion, unknown input and restart. Review coordinates and event records with reduced motion so the evidence remains accessible without animation.", "Compare the saved source version used by the preview and assessment before interpreting a discrepancy."],
      assess: ["Run final independent checks for direction, valid cells, unchanged blocked state, energy, distinct collection, exit requirements, terminal priority, mutation and restart. Verify bounded casebook and replay records alongside the complete mission sequence.", "The notes explain reasoning; they cannot manufacture a passing game result or course completion."],
      inspect: ["For any remaining failure, return to expected versus observed and shrink the sequence. Compare plausible hypotheses with a discriminating example, then inspect the actual source difference rather than making several unrelated edits.", "A regression is another investigation with evidence, not a reason to discard the earlier standard."],
      fix: ["Repair the responsible rule and replay its minimal case and the complete set. Save the current version in a named slot, run the final assessment again and keep the original failure evidence in the casebook.", "A passing result for an older source digest cannot prove that a later edit works."],
      explain: ["Choose what the finished casebook demonstrates and explain one rejected hypothesis or proposal. Describe a limitation of your test set and how another scenario could reveal a defect that these cases do not cover.", "Careful evidence supports specific conclusions without pretending that testing proves universal correctness."],
      reward: ["Save Detective casebook and finish the final assessment. You have repaired a real project through reproducible examples, focused review and regression checks. Replay an investigation or investigate another saved variant while retaining earned completion.", "The private course uses authored teaching material and ordinary account-bound saving; a live AI service is unnecessary."],
    },
    questions: {
      learn: { question: "What connects an evidence-backed repair from start to finish?", choices: ["A confident claim with no replay", "Expected rule, observed failure, tested explanation, edit and regression", "Only the number of changed lines"], correctChoice: 1, feedback: "The full chain connects a requirement to a reproduced discrepancy, an evidence-tested cause and a verified implementation change." },
      predict: { question: "If unconditional rescue push returns, which case should expose it first?", choices: ["A title-only check", "A route that never reaches a beacon", "A first visit followed by departure and return"], correctChoice: 2, feedback: "The return-visit sequence exercises repeated collection of the same identity and reveals the unwanted duplicate entry." },
      explain: { question: "What can passing the recorded cases establish?", choices: ["Evidence for the behaviours those scenarios exercise", "Proof that no possible bug remains", "Permission to skip future regression checks"], correctChoice: 0, feedback: "Tests support conclusions about exercised scenarios, while new inputs and future changes can still reveal other defects." },
    },
  },
]);

export const suggestions: LearningCourseSuggestionV1[] = [
  { stageId: "vibe-bug-detective.m3.build", proposal: {
    id: "detective-refill-energy", source: "authored-fallback", intent: "Prevent energy falling when a movement is blocked.",
    constraints: ["Valid entered cells must still cost one energy.", "Blocked movement must preserve all state values."],
    permittedArtifactId: "game.js", originalSnippet: "next.energy -= 1;", replacementSnippet: "next.energy = 24;",
    explanationPrompt: "Does refilling every move repair blocked accounting while preserving valid movement cost?",
    aiOptional: false, learnerApprovalRequired: true, alternatives: ["accept", "reject"],
  } },
  { stageId: "vibe-bug-detective.m4.build", proposal: {
    id: "detective-unique-rescue", source: "authored-fallback", intent: "Keep each beacon's first rescue without appending duplicate visits.",
    constraints: ["Preserve first-collection order.", "Keep earlier distinct rescues when visiting another beacon."],
    permittedArtifactId: "game.js", originalSnippet: "next.rescued.push(beacon.id);",
    replacementSnippet: "if (!next.rescued.includes(beacon.id)) next.rescued.push(beacon.id);",
    explanationPrompt: "Which first-visit, return-visit and second-beacon cases verify the proposed guard?",
    aiOptional: false, learnerApprovalRequired: true, alternatives: ["accept", "reject"],
  } },
];
