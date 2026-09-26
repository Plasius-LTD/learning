import { authorCourse } from "./course-authoring.js";
import { webProjectFiles, webReferences, webStarterCss } from "./web-course-authoring.js";

export const { course, practice } = authorCourse({
  slug: "creature-care-dashboard", title: "Creature Care Dashboard", category: "web-app",
  summary: "Create an accessible dashboard for a fictional creature. Connect labelled care actions to bounded state, model time without browser timers, distinguish rest from pause and show an honest activity history. Finish a responsive three-file application with readable status, safe reset and evidence for its edge cases.",
  projectFiles: webProjectFiles,
  starterProject: { files: [
    { path: "index.html", source: `<main>
  <h1>Creature Care Dashboard</h1><p>Care for a fictional creature in a simulated habitat.</p>
  <section aria-labelledby="creature-heading"><h2 id="creature-heading" data-text="name"></h2>
    <p data-text="modeText"></p><p data-text="clockText"></p>
    <label for="food">Food</label><meter id="food" min="0" max="100" data-value="food" data-label="foodLabel"></meter><p data-text="foodLabel"></p>
    <label for="energy">Energy</label><meter id="energy" min="0" max="100" data-value="energy" data-label="energyLabel"></meter><p data-text="energyLabel"></p>
    <label for="joy">Joy</label><meter id="joy" min="0" max="100" data-value="joy" data-label="joyLabel"></meter><p data-text="joyLabel"></p>
    <div class="actions"><button type="button" data-action="feed" data-disabled="feedDisabled">Feed</button><button type="button" data-action="play" data-disabled="playDisabled">Play</button><button type="button" data-action="rest" data-disabled="restDisabled">Rest</button><button type="button" data-action="wake" data-disabled="wakeDisabled">Wake</button></div>
  </section>
  <div class="actions"><button type="button" data-action="resume">Resume simulation</button><button type="button" data-action="pause">Pause simulation</button><button type="button" data-action="reset">Reset habitat</button></div>
  <section aria-labelledby="history-heading"><h2 id="history-heading">Care history</h2><p data-text="historySummary"></p><ol><li data-repeat="history" data-text="text"></li></ol></section>
  <p role="status" data-text="message"></p>
</main>` },
    { path: "app.css", source: webStarterCss },
    { path: "app.js", source: `function initialState() {
  return { name: "Moss", draftName: "Moss", nameError: "", food: 60, energy: 70, joy: 50,
    mode: "awake", paused: true, elapsed: 0, history: [], nextEventId: 1, message: "Resume when you are ready to care for Moss." };
}
function update(state, input) {
  if (input.type === "reset") return initialState();
  return JSON.parse(JSON.stringify(state));
}
function view(state) {
  return { name: state.name, draftName: state.draftName, nameError: state.nameError, nameInvalid: state.nameError !== "",
    food: state.food, energy: state.energy, joy: state.joy,
    foodLabel: "Food " + Math.round(state.food) + " of 100", energyLabel: "Energy " + Math.round(state.energy) + " of 100",
    joyLabel: "Joy " + Math.round(state.joy) + " of 100", modeText: state.mode + (state.paused ? ", paused" : ", running"),
    clockText: Math.floor(state.elapsed) + " seconds simulated", feedDisabled: true, playDisabled: true, restDisabled: true,
    wakeDisabled: true, resumeDisabled: false, pauseDisabled: true, history: [], historySummary: "No care actions yet.", message: state.message };
}
` },
  ] },
  reference: [...webReferences,
    { name: "initialState", signature: "initialState() → fresh habitat", description: "Start with name/draftName='Moss', nameError='', food=60, energy=70, joy=50, mode='awake', paused=true, elapsed=0, history=[], nextEventId=1 and useful message. Food, energy and joy always remain within 0–100. The model is fictional game behaviour, not advice about real animals.", example: '{ food: 60, energy: 70, joy: 50, mode: "awake", paused: true }' },
    { name: "care rules", signature: "feed/play/rest/wake", description: "Successful actions require !paused. Feed also requires awake and food<100; add 20 food capped at 100. Play requires awake, food>=10, energy>=15 and joy<100; subtract 10 food and 15 energy, add 20 joy capped at 100. Rest changes awake to asleep; wake changes asleep to awake. Refused/repeated ineligible actions change only message. Each successful care/mode action records exactly one history event; no action mutates input state.", example: 'if (next.paused || next.mode !== "awake" || next.energy < 15 || next.food < 10 || next.joy >= 100) return { ...next, message: "Play needs an awake, running creature with enough food and energy." };' },
    { name: "tick", signature: '{ type: "tick", dt: seconds }', description: "The host supplies finite dt from 0 to 1 inclusive; invalid/negative/oversized values preserve state. When running, advance by min(dt,3600-elapsed); decrease food by 1/second and joy by 0.5/second, and change energy by -0.75/second awake or +3/second asleep. Clamp all needs to 0–100. At elapsed=3600 pause and explain that reset starts another session. Ignore ticks while paused. No Date, setInterval or device-clock access is used.", example: 'const seconds = Math.min(input.dt, 3600 - next.elapsed); next.food = Math.max(0, next.food - seconds);' },
    { name: "pause and reset", signature: "resume/pause/reset", description: "resume clears paused only when elapsed<3600; pause sets it immediately without changing mode, needs or history. Repeating either action changes only feedback. Pause freezes both time and care actions; rest allows time to continue while energy recovers. reset creates a fresh paused habitat with empty history and original values, independently of course completion or account source saves.", example: 'if (input.type === "pause") return { ...next, paused: true, message: "Simulation paused." };' },
    { name: "history", signature: "[{id,action,at}] newest first", description: "Append one event only after a successful feed/play/rest/wake transition, using id='care-'+nextEventId, action and at=elapsed; then increment nextEventId. Store newest first and keep the latest 20 entries. nextEventId is an integer 1–1000000; refuse a care action if no ID remains. Ticks, naming, pause and refused actions do not create entries. IDs are never reused when old entries leave the list.", example: 'next.history = [{ id: "care-" + next.nextEventId, action: input.type, at: next.elapsed }, ...next.history].slice(0, 20); next.nextEventId += 1;' },
    { name: "name", signature: 'field{name:"name",value} then rename', description: "A string name field updates only draftName, at most 30 characters, and clears nameError. rename trims it and accepts 2–30 characters without control characters; success changes name, normalises draftName and clears errors, while failure keeps name and draft and sets useful error text. Naming is allowed while paused and makes no care-history entry. Use fictional names without personal information.", example: '<input id="name" name="name" type="text" maxlength="30" aria-describedby="name-error" data-value="draftName" data-invalid="nameInvalid">' },
    { name: "view", signature: "view(state) → needs, permissions and readable history", description: "Return name/draftName/nameError/nameInvalid, numeric food/energy/joy plus rounded text labels, modeText and clockText, feedDisabled/playDisabled/restDisabled/wakeDisabled/resumeDisabled/pauseDisabled reflecting actual guards, history [{id,text}], historySummary and message. Read state without mutation. Include mode and paused in text; numeric meters need labels. Do not put every tick in a live region; announce explicit actions and failures instead.", example: 'const foodLabel = "Food " + Math.round(state.food) + " of 100";' },
  ],
}, [
  {
    title: "Meet the creature in data", concepts: ["State modelling", "Semantic meters", "Responsive styling"],
    goals: ["Present the creature's initial needs truthfully with text and labelled meters.", "Make a readable three-file dashboard before implementing care actions."],
    extension: "Try an alternative habitat theme in a separate save. Preserve the numeric meanings and readable labels while changing its visual character.",
    activities: {
      learn: ["The creature is a fictional model with food, energy and joy from 0–100. JavaScript owns those values, HTML names their meaning and CSS arranges them. A meter needs an accessible name and nearby text so its meaning is not conveyed only by colour or length.", "The initial paused state gives people time to understand the page before the simulation begins."],
      predict: ["Predict the three initial meter values and their rounded text labels from food 60, energy 70 and joy 50. Then predict whether simply calling view should change any need or elapsed time.", "Reading the dashboard is a projection of state, not an event that feeds or tires the creature."],
      build: ["Review the semantic main/heading/section structure and complete truthful initial view data. Style the habitat and need indicators for 320px, large text and both themes, keeping meter values and readable labels connected to the same state.", "Keep all important status visible in words; a green bar by itself cannot explain whether it represents food, energy or joy."],
      run: ["Inspect the paused habitat with keyboard navigation, zoom and a screen reader. Compare each meter's accessible label with its value and the visible text, then reset and confirm the same starting values.", "The care controls are intentionally unfinished while this first mission establishes an honest initial dashboard."],
      assess: ["Check fresh initial state, bounded needs, truthful labels, one main landmark and nonmutating view. Confirm controls have meaningful names and the layout remains readable without depending on motion.", "This milestone does not require later time or care mechanics, but it does require an accurate representation of the initial model."],
      inspect: ["If text and meters disagree, inspect whether both derive from the same field. If an indicator has no announced name, inspect its label association instead of adding another colour cue.", "A visually attractive indicator can still be ambiguous when read without its surrounding layout."],
      fix: ["Repair the projection, label or responsive rule and repeat the initial-state checks at 320px. Preserve visible focus outlines and avoid fixed heights that clip text when zoomed.", "Let content determine the height of panels so readable text is not traded away for a rigid card shape."],
      explain: ["Explain why a meter needs both a numeric model and a meaningful name. Choose the design that communicates the same state to people using different ways of reading the page.", "Accessible presentation describes the underlying model clearly rather than adding a separate inconsistent version of it."],
      reward: ["Save Honest habitat. Your creature's state can now be understood through labelled values and a readable page. Next you will make its care actions change that model.", "Keep this paused baseline for comparing changes caused by each later action."],
    },
    questions: {
      learn: { question: "What does a labelled meter communicate beyond a coloured bar?", choices: ["Which need the value represents", "A hidden timer", "A new care action"], correctChoice: 0, feedback: "A meaningful label explains the quantity being displayed even when colour or visual position is unavailable." },
      predict: { question: "What should calling view do to energy=70?", choices: ["Reduce it automatically", "Leave it at 70", "Reset it to 100"], correctChoice: 1, feedback: "The display function reads state without advancing time or performing actions, so viewing the dashboard preserves energy." },
      explain: { question: "Which display avoids relying only on colour?", choices: ["Three unnamed coloured blocks", "An unlabeled animation", "Named meters with readable values and status text"], correctChoice: 2, feedback: "Labels, values and status text communicate the model through more than a single visual signal." },
    },
  },
  {
    title: "Make care actions matter", concepts: ["Guarded actions", "Clamping", "Detached updates"],
    goals: ["Implement meaningful feed and play transitions with explicit prerequisites.", "Refuse unavailable actions without partial effects and keep control states truthful."],
    extension: "Write a short explanation of why the creature cannot play in each refused case. Keep messages useful without changing the resource rules.",
    activities: {
      learn: ["Feed and play spend or replenish specific resources. Feed adds 20 food up to 100. Play spends 10 food and 15 energy to add 20 joy up to 100. Both need an awake running creature, and checking prerequisites before any change prevents a refused action from partially spending resources.", "A disabled button helps explain availability, but update must enforce the same guard even if an action arrives directly."],
      predict: ["Predict feed at food 90 and play at food 10, energy 15, joy 90. Compare the exact-boundary play with energy 14 and explain which fields may change in the refused case.", "Clamping the gain and checking the costs are separate operations; a generous reward must not permit a negative resource balance."],
      build: ["Implement resume and pause guards, then feed/play using detached next state and exact prerequisites. Derive feedDisabled and playDisabled from the same rules. Add useful success/refusal messages while keeping history for a later mission.", "At this milestone the host assesses resource behaviour; the later history lesson adds receipt tracking without changing these care rules."],
      run: ["Resume, feed near the maximum and play until a resource prevents another turn. Pause and try care again. Compare enabled controls, messages and resource changes with the predictions.", "Use the same action sequence with keyboard and touch so both input paths exercise the same state transition."],
      assess: ["Check gains, costs, upper and lower bounds, exact eligibility thresholds, paused/asleep guards, unknown actions and input immutability. Confirm refused actions change only feedback and never partially spend food or energy.", "Direct-action scenarios verify guards independently from whatever the current button appearance suggests."],
      inspect: ["If a rejected play drains energy, inspect the order of mutation and guard checks. If a full food meter still accepts feeding, inspect the food<100 condition in both update and view.", "The interface and transition function must agree on availability; neither should have an unrelated copy of the rule."],
      fix: ["Repair the earliest wrong resource transition and replay threshold cases on each side of eligibility. Verify that repeated requests cannot push values outside 0–100 and that the current source preserves input objects.", "Clone nested state before changing it so previous states remain useful for comparison and later evidence."],
      explain: ["Explain why resource costs are checked before applying any effect and why a disabled button is not the sole guard. Choose the result for a play request with insufficient energy.", "The transition function is responsible for correctness even when an event does not originate from the visible control."],
      reward: ["Save Meaningful care. Feeding and play now have bounded, understandable consequences. Next you will make the fictional habitat evolve through supplied simulated time.", "Keep the exact-threshold case because small comparison mistakes often hide at resource boundaries."],
    },
    questions: {
      learn: { question: "Where must care prerequisites be enforced?", choices: ["Only in CSS", "In update as well as truthful control state", "Only in the button label"], correctChoice: 1, feedback: "The model must reject invalid direct actions while the interface accurately explains which actions are currently available." },
      predict: { question: "What is food after feeding from 90?", choices: ["110", "90", "100"], correctChoice: 2, feedback: "Feeding adds twenty but clamps the result to the documented maximum of one hundred." },
      explain: { question: "What should play do with energy 14?", choices: ["Preserve needs and explain refusal", "Spend food anyway", "Set energy to -1"], correctChoice: 0, feedback: "Insufficient energy makes the whole action ineligible, so resources stay unchanged and feedback explains the refusal." },
    },
  },
  {
    title: "Let simulated time pass", concepts: ["Time steps", "Rates", "Deterministic simulation"],
    goals: ["Advance needs using bounded supplied time steps rather than browser timers.", "Clamp values and stop the session at its exact duration limit."],
    extension: "Compare one one-second tick with two half-second ticks away from boundaries. Explain why the same elapsed time should produce the same resource changes.",
    activities: {
      learn: ["The host supplies tick actions with finite dt between 0 and 1 seconds. While running, food falls by 1 per second, joy by 0.5 and awake energy by 0.75. Multiply each rate by dt, clamp needs and cap total elapsed time at 3600 seconds.", "No browser timer or Date call is needed; supplied time makes the same action sequence repeatable in assessment."],
      predict: ["Predict food, joy and energy after half a second awake from the initial needs. Then predict a tick of 2 seconds, a negative tick and a tick while paused.", "Invalid time inputs preserve the model; a large delayed frame is not permission to bypass the bounded tick contract."],
      build: ["Implement tick validation and elapsed advancement, limiting the last step to the remaining session time. Apply awake decay rates and clamp needs. At 3600 pause and show a reset instruction, with resumeDisabled remaining true until reset.", "Use the same effective seconds for elapsed and every rate so the final partial step remains coherent."],
      run: ["Resume and compare a recorded sequence of half-second and one-second ticks. Pause between ticks, then use the near-session-end scenario to check the final fractional step and automatic pause.", "The host controls simulation pace; changing real browser frame timing must not alter the meaning of one supplied tick."],
      assess: ["Check finite dt boundaries, rejected oversized/negative inputs, paused preservation, decay rates, zero clamps, partitioned time and the exact 3600-second stop. Confirm ticks never create care-history records.", "The timer display may round elapsed time, but assessment checks the underlying numeric state."],
      inspect: ["If decay depends on frame count, look for subtracting a fixed amount instead of rate times dt. If the last step overshoots, compare effective seconds used for elapsed and needs.", "A visible whole-second clock can hide fractional errors; inspect the underlying values when a prediction differs."],
      fix: ["Repair time scaling or boundary handling and replay the same deterministic tick sequence. Verify that zero time has no effects and that repeated ticks after automatic pause leave the finished session unchanged.", "Stopping the clock is a state rule, not just hiding its visible number."],
      explain: ["Explain why supplied dt supports repeatable tests and why elapsed time has a finite cap. Distinguish simulated time from how long someone leaves the browser tab open.", "The model advances only through accepted actions, making its behaviour independent of an uncontrolled device clock."],
      reward: ["Save Measured time. The habitat now evolves predictably within fixed limits. Next you will combine time with rest and deliberate pause/recovery behaviour.", "Keep the fractional final-step case for later changes to energy recovery and status feedback."],
    },
    questions: {
      learn: { question: "How much food is lost during an accepted half-second tick?", choices: ["One unit regardless of dt", "Two units", "Half a unit"], correctChoice: 2, feedback: "Food decays at one unit per second, so multiplying by half a second gives a loss of one half." },
      predict: { question: "What should a tick with dt=2 do?", choices: ["Preserve state because it exceeds the allowed step", "Advance two seconds anyway", "Reset the habitat"], correctChoice: 0, feedback: "The input contract allows steps only up to one second, so an oversized tick is rejected without effects." },
      explain: { question: "Why supply time as an input instead of reading Date?", choices: ["To hide elapsed time", "To make replay and assessment deterministic", "To make every action random"], correctChoice: 1, feedback: "Explicit time inputs let the same initial state and action sequence produce reproducible results across hosts." },
    },
  },
  {
    title: "Rest, pause and recover", concepts: ["State machines", "Independent modes", "Fresh reset"],
    goals: ["Distinguish sleeping recovery from pausing the whole simulation.", "Implement guarded mode changes and fresh reset without losing course progress."],
    extension: "Sketch a state diagram for awake/asleep crossed with running/paused. Explain which transitions affect mode and which affect the simulation clock.",
    activities: {
      learn: ["Rest changes awake to asleep while the simulation keeps running. Asleep energy recovers by 3 per second; food and joy still decay. Pause freezes all time and care actions without changing awake/asleep mode. Reset starts a fresh paused habitat independently of earned course completion.", "Two independent state fields express these different ideas more clearly than one ambiguous status word."],
      predict: ["Predict energy after two accepted one-second ticks asleep from 70. Compare that with the same ticks paused asleep, then predict wake while paused and resume afterwards.", "A paused creature cannot change care mode until resumed; resuming preserves whichever mode was already selected."],
      build: ["Implement rest/wake guards, asleep energy recovery and truthful control permissions. Preserve needs and mode when pausing, preserve mode when resuming, and reset all preview state through a new initialState result.", "Refused repeated rest or wake changes only feedback; it must not manufacture a second successful transition."],
      run: ["Resume, rest, advance time, pause, advance attempted time, resume and wake. Compare energy, food, joy and elapsed after each action. Reset and verify original values, empty history and paused mode.", "A visible status should say both asleep/awake and running/paused so a frozen clock is understandable."],
      assess: ["Check sleep recovery clamping, continued food/joy decay, pause freezing, refused mode changes while paused, retained mode on resume and detached reset. Verify the session-end pause cannot be resumed without reset.", "The correct final meter value alone is insufficient if invalid intermediate transitions were accepted."],
      inspect: ["If rest freezes food, inspect whether sleep was incorrectly treated as pause. If resume wakes the creature, inspect coupled assignments. If reset leaves old values, inspect shared nested objects or partial reset logic.", "Fresh initial state should be created each time rather than reusing a previously mutated object."],
      fix: ["Separate the mode and pause rules, then replay the complete rest/pause/resume/wake sequence. Recheck awake decay from the previous mission so recovery changes do not replace its rates accidentally.", "Use a focused transition table to keep the two independent state dimensions understandable."],
      explain: ["Explain why pause and rest cannot share one meaning and describe what reset affects. Choose the sequence that allows energy recovery while time advances.", "Course progress records learning evidence separately, so resetting the fictional habitat is safe for experimentation."],
      reward: ["Save Restful recovery. Your creature can recover energy, pause safely and start again without confusing those operations. Next you will explain successful actions through a bounded history.", "Keep the transition table beside your code as a reference for clear controls and feedback."],
    },
    questions: {
      learn: { question: "What is the difference between rest and pause?", choices: ["Rest changes mode; pause freezes the simulation", "Both delete the habitat", "Pause always wakes the creature"], correctChoice: 0, feedback: "Rest lets simulated time continue with different energy behaviour, while pause preserves the whole model without advancing it." },
      predict: { question: "Energy starts at 70 asleep and running; after two one-second ticks it is what?", choices: ["70", "76", "68.5"], correctChoice: 1, feedback: "Sleeping energy gains three units per second, so two seconds add six before applying the upper bound." },
      explain: { question: "What should reset do to earned course completion?", choices: ["Delete it", "Replace it with a meter value", "Leave it intact while resetting the preview habitat"], correctChoice: 2, feedback: "Simulation state and verified learning progress are separate records, allowing safe replay after completion." },
    },
  },
  {
    title: "Explain the care history", concepts: ["Event records", "Bounded history", "Accessible feedback"],
    goals: ["Record successful care transitions once using stable event identities.", "Make naming, history and feedback understandable without excessive announcements."],
    extension: "Compare a newest-first history with a chronological explanation of the same actions. State which task each ordering helps without changing the stored event contract.",
    activities: {
      learn: ["History records what actually happened: one event after each successful feed, play, rest or wake. Give events increasing IDs, keep the newest 20 entries and never record refused actions as successes. A fictional name can personalise the view without changing care rules or creating history events.", "Ticks can arrive frequently, so history and live announcements should not be flooded with every numerical change."],
      predict: ["Predict history after feed succeeds, play is refused, rest succeeds and time advances. Then predict its length and IDs after more than twenty successful actions, and what happens when the event counter is exhausted.", "Discarding the oldest display entry does not make its identity available for reuse."],
      build: ["Add bounded event recording after successful care transitions and project readable id/text history. Add a labelled naming form with bounded draft input, trim validation, linked errors and aria-invalid. Announce explicit actions and failures through the status message, keeping per-tick need text outside live regions.", "Check event-ID availability before committing a care effect so an exhausted counter cannot leave an unrecorded success."],
      run: ["Perform successful and refused care actions and compare each history entry with its resource transition. Rename with valid and invalid fictional text while paused. Read the page with a screen reader while simulated time runs.", "A useful announcement conveys a meaningful change; repeated tick chatter can hide the result of the user's actual action."],
      assess: ["Check one event per success, none for refused/tick/name/pause actions, stable IDs, newest-first order, 20-entry bound and counter exhaustion. Check naming validation, retained failed draft, inert text and truthful history summaries.", "History is explanatory data, not the authority that awards course completion or replaces protected assessment."],
      inspect: ["If history claims a refused play succeeded, inspect whether recording occurs before guards. If entries repeat after trimming, inspect ID reuse. If naming changes needs, inspect accidental state replacement.", "A display label should never become a command or an identity just because the learner typed it."],
      fix: ["Repair event placement, bounds or naming feedback and replay a mixed success/refusal sequence. Verify that errors remain linked to their field and repeated render updates preserve input focus.", "Keep the original name until a valid rename commits; the editable draft and accepted name serve different purposes."],
      explain: ["Explain why history contains successful transitions instead of every attempted click or tick. Describe how useful feedback differs from repeatedly announcing the same changing meter.", "The person needs a clear account of meaningful actions without losing the ability to read and operate the rest of the page."],
      reward: ["Save Understandable care. The dashboard now explains successful actions and lets learners personalise a fictional creature accessibly. The final mission tests the complete model and interface together.", "Keep a history containing both resource and mode changes as a useful final demonstration."],
    },
    questions: {
      learn: { question: "Which action should create a care-history event?", choices: ["Every tick", "A successful rest transition", "A refused play request"], correctChoice: 1, feedback: "History records committed care or mode changes, while ticks and refused requests do not claim an action succeeded." },
      predict: { question: "After 21 successful care actions, how many entries should remain?", choices: ["21", "One", "20"], correctChoice: 2, feedback: "The history retains the newest twenty entries while keeping its allocation counter increasing so identities are not reused." },
      explain: { question: "Why keep per-tick values outside a live region?", choices: ["To avoid overwhelming meaningful user-action feedback", "To hide all need values", "To prevent keyboard operation"], correctChoice: 0, feedback: "Frequent automatic announcements can interrupt reading and obscure the result of deliberate actions or useful errors." },
    },
  },
  {
    title: "A dashboard worth caring for", concepts: ["Integrated simulation", "Accessible interaction", "Capstone"],
    goals: ["Deliver a coherent dashboard with care, time, recovery and truthful history.", "Verify the exact source across normal, refused, boundary and accessible-use scenarios."],
    extension: "Propose another fictional care action in a separate project save, defining its resource costs, timing, history event and accessible feedback before coding it.",
    activities: {
      learn: ["The complete dashboard joins model, controls, time, recovery and explanation. Its theme should make the fictional habitat inviting while labels, bounded rules and useful feedback make it understandable. The final assessment tests the current source, including mistakes and edge cases.", "A lively visual scene is useful only when the displayed state and actual action rules continue to agree."],
      predict: ["Plan a demonstration that resumes, feeds, plays, rests, advances time, pauses, renames, resumes, wakes and resets. Predict needs, modes and history entries, including an intentionally refused action.", "Use supplied time steps so another person can replay the same demonstration and compare exact results."],
      build: ["Finish the three-file application, review every button permission and label, and keep mode/time/history projections truthful. Add any final theme refinements while preserving readable text, focus and reduced motion preferences.", "Do not add automatic browser timers or external services to make the demonstration seem more complete; the host supplies the bounded simulation clock."],
      run: ["Perform the sequence with keyboard and touch, at 320px and enlarged text, in both themes and reduced motion. Check the name form, meter labels, history and announcements with a screen reader. Save/reload the project source and replay.", "Keep controls large enough to operate and allow action groups to wrap without changing the meaning of their labels."],
      assess: ["Run final checks for initial values, action guards, resource accounting, deterministic ticks, session expiry, sleep/pause separation, history bounds, naming, nonmutation and reset. Obtain evidence for the saved current source after the whole accessible journey is verified.", "Every earlier mission contributes rules to this final application; later polish does not replace their required behaviour."],
      inspect: ["Compare a failure with its earliest divergent state: action eligibility, time rate, mode, history or view. If controls and rules disagree, inspect both the projection and transition rather than changing only the visible disabled state.", "A useful reproduction names the starting state and input sequence, not just a screenshot of the eventual mismatch."],
      fix: ["Repair the responsible rule, repeat its boundary case and rerun the full demonstration. Save a named final version and obtain a fresh assessment after the last source change.", "Use the earlier exact-threshold and fractional-time examples to protect behaviour during final styling work."],
      explain: ["Explain the difference between rest and pause, why the history is bounded, and how supplied time makes the model testable. Describe one accessibility decision using evidence from your demonstration.", "Be precise about the limits of this fictional simulation and avoid suggesting its numeric needs describe real creature care."],
      reward: ["Save Caring dashboard and finish the final assessment. You have built an editable web application that connects interactive controls, deterministic time and understandable feedback. Replay a mission or extend another save while keeping earned completion.", "Resetting Moss is a fresh simulation start; your account-bound source and course evidence remain separate."],
    },
    questions: {
      learn: { question: "What should final visual polish preserve?", choices: ["Only the background colour", "Only the newest control", "Truthful state, readable access and all established rules"], correctChoice: 2, feedback: "A coherent final interface improves presentation while preserving the working model and accessible interaction paths." },
      predict: { question: "What makes another learner's replay comparable with yours?", choices: ["The same initial state and supplied action/time sequence", "An unknown browser frame rate", "Different random timer delays"], correctChoice: 0, feedback: "Explicit starting conditions and deterministic inputs let both runs be compared against the same expected transitions." },
      explain: { question: "Which evidence supports an accessibility claim?", choices: ["A decorative icon alone", "A verified keyboard, label and announcement journey", "A promise to test later"], correctChoice: 1, feedback: "Accessibility claims need observed operation through the relevant controls and assistive presentation, not appearance alone." },
    },
  },
]);
