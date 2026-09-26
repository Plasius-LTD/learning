import { authorCourse } from "./course-authoring.js";

export const { course, practice } = authorCourse({
  slug: "obstacle-explorer", title: "Obstacle Explorer", category: "robot",
  summary: "Programme a simulated rover to explore a course using distance observations. Build a controller that remembers its decisions, turns for a bounded time and recognises stale data. Finish with deliberate recovery, a clear arrival state and evidence from both successful and interrupted journeys. No physical equipment is required.",
  projectFiles: [{ path: "robot.cpp", language: "cpp", maximumCharacters: 24000 }],
  starterProject: { files: [{ path: "robot.cpp", source: `bool armed = false;
bool wasEnabled = false;
int mode = 0;
int attempts = 0;
int clearCount = 0;
int lastSampleId = -1;
int turnStart = 0;

void setup() { stopMotors(); }

void loop() {
  stopMotors();
}
` }] },
  reference: [
    { name: "distance observation", signature: 'numberSensor("distanceCm"); numberSensor("sampleAgeMs"); numberSensor("sampleId");', description: "Distance is valid from 0 through 400 cm, age from 0 through 250 ms and sampleId is a nonnegative integer. A repeated ID is the same observation; a decreasing ID is invalid. Read supplied values on every loop. Missing or malformed input stops the host simulation.", example: 'double distance = numberSensor("distanceCm");' },
    { name: "stopMotors", signature: "stopMotors()", description: "Immediately set both simulated wheel powers to zero. Use at startup, explicit stop, disable, bumper, invalid or stale observation, turn deadline and arrival. A stop branch must return before another movement command.", example: 'if (boolSensor("stop")) { armed = false; stopMotors(); return; }' },
    { name: "setMotorPower", signature: "setMotorPower(double left, double right)", description: "Each simulated output must stay from -25 through 25. Use (20,20) for driving and (-15,15) for a left turn on the spot. The simplified differential model has 120 mm wheel spacing and 5 mm/s per power unit. These outputs have no physical device connection.", example: "setMotorPower(-15, 15);" },
    { name: "clearance state", signature: "mode: 0 driving, 1 halted, 2 turning", description: "At distance at or below 20 cm, stop driving and enter halted. Resuming drive requires two distinct increasing sample IDs at or above 30 cm; another distinct sample below 30 resets clearCount. The 20–30 cm band preserves driving but cannot establish clearance while halted or turning.", example: "if (distance >= 30) { clearCount += 1; } else { clearCount = 0; }" },
    { name: "turn deadline", signature: "millis() - turnStart >= 600", description: "After entering halted, emit a stopped observation before considering a turn on the next loop. With no confirmed clearance, begin a left turn and increment attempts. Stop at 600 ms; the deadline wins over clearance on that observation. After the first two expired turns, a later halted observation may drive if clear or try another turn. The third expired turn disarms even if clearance arrives at its deadline.", example: "if (millis() - turnStart >= 600) { mode = 1; stopMotors(); return; }" },
    { name: "permission and recovery", signature: 'boolSensor("enabled"); boolSensor("stop"); boolSensor("bumper");', description: "A fresh safe enable edge arms in halted mode, resets attempts and clearCount, and stops for that observation. Stop, disable, bumper, invalid or stale data disarm immediately. Track enable history even while blocked. After interruption or three failed turns, release and enable again; fault clearance alone never starts movement.", example: 'bool enabled = boolSensor("enabled"); bool rising = enabled && !wasEnabled; wasEnabled = enabled;' },
    { name: "arrival", signature: 'boolSensor("goal")', description: "The simulator supplies goal when the rover reaches the course destination. Goal disarms and stops before movement. It does not award course completion, and a still-true goal prevents rearming. Restarting the simulator creates fresh programme state and a fresh course position.", example: 'if (boolSensor("goal")) { armed = false; stopMotors(); return; }' },
  ],
}, [
  {
    title: "A distance you can trust", concepts: ["Sensor observations", "Ranges", "Safe default"],
    goals: ["Read the current distance and reject values outside its stated range.", "Command bounded forward motion only with permission and adequate clearance."],
    extension: "Draw a distance number line including -1, 0, 20, 21, 400 and 401. Annotate invalid, too near and usable readings before testing them.",
    activities: {
      learn: ["A distance is an observation, not a promise of safety. In this simulator valid readings span 0–400 cm. Begin stopped; while enabled and not stopped or touching a bumper, drive at (20,20) only above 20 cm. Otherwise stop immediately.", "A negative reading or a value beyond the stated maximum is invalid, not a conveniently large empty space."],
      predict: ["Predict the output for distances 19, 20, 21 and 401 with enable on. Then keep a clear reading but press stop. Identify the condition that must win before a motor command is emitted.", "At the 20 cm boundary the rover stops. The stop input has priority even when distance appears clear."],
      build: ["Read distanceCm in loop and validate its range before using it. Add guards for disabled input, stop and bumper. Return after stopMotors on the stopped path; use setMotorPower(20,20) only on the valid clear path.", "Keep one movement command at the end so a later statement cannot accidentally undo the stop."],
      run: ["Use the simulator's distance controls to cross the 20 cm threshold. Try an invalid reading and a bumper event while moving. Inspect the numeric wheel outputs and stopped reason alongside the rover picture.", "Pause and step through observations when continuous motion makes the first incorrect decision hard to find."],
      assess: ["Check clear travel, the exact near boundary, both invalid range ends, disable, stop and bumper. All wheel outputs must remain within -25 through 25, including during awkward input combinations.", "The host checks emitted commands, so moving slowly on screen cannot conceal an out-of-range output."],
      inspect: ["If 401 permits motion, inspect range validation before clearance. If stop appears briefly then motion returns on the same observation, inspect code after stopMotors. If 20 moves, inspect the comparison boundary.", "Find the earliest wrong command rather than relying on the final displayed position."],
      fix: ["Repair the responsible comparison or control branch. Replay the failing boundary and a valid forward journey, then stop during movement to ensure the correction preserves ordinary control.", "Replacing every output with stop passes no genuine travel check; the project needs useful motion as well as safe refusal."],
      explain: ["Choose why an invalid large distance must stop the controller. Explain the difference between an observation being inside its valid range and that observation providing enough clearance to drive.", "Validity and clearance answer different questions and deserve separate conditions."],
      reward: ["Save Trusted distance. Your rover can make a simple decision from a valid current observation. Next you will add memory so small changes near the boundary do not make it repeatedly start and stop.", "Keep the exact 20 cm case as a regression example for later state changes."],
    },
    questions: {
      learn: { question: "How should this controller treat a distance of 401 cm?", choices: ["As invalid and stop", "As guaranteed open space", "As a command to turn faster"], correctChoice: 0, feedback: "401 exceeds the documented sensor range, so it cannot be used as trustworthy evidence of clearance." },
      predict: { question: "With permission active and distance exactly 20 cm, which output is required?", choices: ["Forward at full power", "Both wheels stopped", "Reverse until the reading changes"], correctChoice: 1, feedback: "The near boundary includes 20 cm, so the forward path must stop at that exact value." },
      explain: { question: "Why validate range separately from available clearance?", choices: ["To avoid reading the sensor", "To make every valid reading move", "Because a valid reading can still describe an obstacle"], correctChoice: 2, feedback: "A reading such as 10 cm is valid sensor data but provides too little clearance for forward movement." },
    },
  },
  {
    title: "Remember the last decision", concepts: ["State", "Hysteresis", "Distinct observations"],
    goals: ["Use separate stop and resume thresholds to avoid repeated switching.", "Confirm clearance from two distinct samples instead of counting duplicate observations."],
    extension: "Write two traces containing the same distances but different sample IDs. Explain why only the trace with new observations can confirm clearance.",
    activities: {
      learn: ["Use mode=0 for driving and mode=1 for halted. Driving stops at distance≤20. A halted rover resumes only after two distinct increasing sample IDs with distance≥30. A new sample below 30 resets clearCount. Repeating one ID must not increase it.", "The gap between stop and resume thresholds is hysteresis: the decision depends on both distance and previous state."],
      predict: ["While halted, observe (ID 7,35 cm), repeat ID 7, then observe (ID 8,32 cm). Predict clearCount after each. Compare a driving rover and a halted rover seeing 25 cm.", "A duplicate supplies no new evidence. In the 20–30 band, driving continues but a halted rover has not established clearance."],
      build: ["Store mode, clearCount and lastSampleId. Update clearance only when sampleId increases; copy that ID after processing. Stop and reset clearance on the transition from driving to halted. Return to driving once two new clear samples confirm the path.", "Reset the counter for a new below-30 sample even if it is not close enough to trigger the driving stop threshold."],
      run: ["Play a noisy sequence around 20 cm, then a clear sequence above 30 cm. Pause on a duplicated ID and compare the counter before and after. Inspect state text and the distance chart together.", "Use sample identity and value as two separate columns in your trace."],
      assess: ["Check both threshold boundaries, the middle band, interrupted clearance and repeated IDs. The controller must neither chatter on every distance change nor restart from a single duplicated sample.", "An increasing display time does not automatically make an unchanged sensor ID a fresh sample."],
      inspect: ["If a repeated reading resumes travel, inspect the ID comparison. If 25 cm restarts a halted rover, inspect the resume threshold. If it stops a driving rover, inspect which threshold applies to that state.", "Trace mode before the decision; the same distance can correctly produce different outcomes in different states."],
      fix: ["Repair state or counter handling and replay duplicate-clear-clear and clear-near-clear sequences. Confirm the rover can still resume after two genuinely new clear samples.", "Do not count the near sample that caused the stop as evidence that the path is now clear."],
      explain: ["Choose why two observations with one repeated ID count as one sample. Explain how hysteresis gives the controller a stable decision around a noisy boundary.", "Memory is useful when a decision needs evidence across time rather than one isolated reading."],
      reward: ["Save Stable clearance. Your rover now distinguishes new evidence from repeated data. Next it will try a short turn when a halted route does not become clear.", "Keep a trace through the middle band to verify that the turn state uses the same clearance rule."],
    },
    questions: {
      learn: { question: "What allows a halted rover to confirm clearance?", choices: ["One sample copied repeatedly", "Two distinct increasing IDs with distance at least 30 cm", "Any reading above zero"], correctChoice: 1, feedback: "Two genuinely new clear observations establish clearance; copies of one observation do not add evidence." },
      predict: { question: "A halted rover sees ID 7 twice at 35 cm; how many clear samples has it counted?", choices: ["Zero", "Two", "One"], correctChoice: 2, feedback: "The repeated ID describes the same observation, so the clearance counter remains one." },
      explain: { question: "Why use different stop and resume thresholds?", choices: ["To avoid repeated switching near one noisy boundary", "To ignore state entirely", "To allow invalid distances"], correctChoice: 0, feedback: "The gap between thresholds prevents a small fluctuation from repeatedly reversing the previous decision." },
    },
  },
  {
    title: "Turn with a deadline", concepts: ["Finite state machine", "Non-blocking time", "Bounded attempts"],
    goals: ["Try a short left turn without blocking fresh observations.", "Stop each turn at its deadline and bound the number of attempts."],
    extension: "Compare a 300 ms and a 600 ms turn in a separate saved experiment. Keep the same power and explain which property changes and which limits must remain.",
    activities: {
      learn: ["Add mode=2 for turning. After a stopped halted observation, an uncleared route may begin a left turn at (-15,15). Record turnStart and increment attempts once. At 600 ms stop and return to halted. Try at most three turns before waiting for deliberate recovery.", "Do not wait inside a loop for time to pass. Each observation must return so stop and sensor updates remain responsive."],
      predict: ["A turn starts at 1000 ms. Predict outputs at 1599 and 1600 ms, then consider confirmed clearance arriving exactly at 1600. Decide which rule wins on the deadline observation.", "The turn deadline requires a stopped observation even when another decision could otherwise permit movement."],
      build: ["Add a timed turning branch using millis. Evaluate the deadline before clearance in that branch. A turn may end earlier by returning to drive after confirmed clearance; reset attempts on that successful drive. Otherwise stop at the deadline and try again from halted on a later observation.", "Increment attempts on entry to turning, not on every loop that remains in the turning state."],
      run: ["Step through stopped, turning and deadline observations. Present fresh clear samples during one turn and a permanently blocked distance during another. Check the turn counter and complete command trace.", "The controller makes bounded attempts; it is not a general solver for every possible maze."],
      assess: ["Check motor direction, exact deadline, early confirmed clearance, one increment per turn, three-attempt bound and stop priority during turning. A fourth automatic turn must not start.", "A successful ordinary turn does not replace checking the persistent-obstacle case."],
      inspect: ["If a turn never ends, inspect elapsed simulated time. If attempts rise too quickly, inspect the entry transition. If a deadline emits forward movement, inspect the order of the time and clearance branches.", "Inspect every command in the observation, including a movement command accidentally emitted after a stop."],
      fix: ["Repair the transition and replay the deadline with simultaneous clearance, followed by a persistent obstacle. Keep a normal early-clearance turn as a regression case.", "Do not extend the turn indefinitely to force a favourable scene outcome; the documented deadline is part of the controller."],
      explain: ["Choose why timed states are more responsive than a busy wait. Explain how a bounded attempt gives the rover an understandable failure state when its simple strategy cannot find a route.", "An honest stopped outcome is better evidence than silently repeating an action without a limit."],
      reward: ["Save Bounded turn. Your rover can try a different heading while still accepting fresh input. Next you will handle the case where the distance stream itself stops providing usable observations.", "Preserve the third-turn deadline trace for later recovery checks."],
    },
    questions: {
      learn: { question: "When should the turn attempt counter increase?", choices: ["On every displayed frame", "Whenever the distance is repeated", "Once on entry to the turning state"], correctChoice: 2, feedback: "The counter measures attempted turns, so each state entry adds one regardless of how many observations the turn spans." },
      predict: { question: "A turn began at 1000 ms; what must happen at 1600 ms?", choices: ["Emit a stop before any later movement decision", "Always begin another turn immediately", "Ignore new stop input"], correctChoice: 0, feedback: "The 600 ms deadline is inclusive and takes priority over clearance on that observation." },
      explain: { question: "Why return from loop while waiting for a turn deadline?", choices: ["To remove timing entirely", "So new stop and sensor observations can be processed", "To make the turn last forever"], correctChoice: 1, feedback: "A non-blocking timed state allows each new observation to apply safety and control decisions promptly." },
    },
  },
  {
    title: "Notice a missing observation", concepts: ["Freshness", "Watchdog", "Fail-safe state"],
    goals: ["Stop on stale, malformed or out-of-order sensor observations.", "Prevent old clear data from continuing a moving command."],
    extension: "Build a trace where distance remains 100 cm but sample age increases past 250 ms. Explain why unchanged distance is not evidence that the route stayed clear.",
    activities: {
      learn: ["A sensor watchdog checks freshness before movement. Valid sampleAgeMs is 0–250 inclusive. sampleId must be a nonnegative integer and may repeat but must not decrease. Invalid range, age or identity stops and disarms, even if the last distance looked clear.", "A duplicate within its age limit may preserve state, but it cannot add a new clearance sample."],
      predict: ["Keep distance at 100 cm while age changes from 250 to 251 ms. Then supply a lower sample ID with age zero. Predict armed state and outputs for both failures.", "A recent timestamp cannot make an out-of-order identity valid, and a large distance cannot make an old sample fresh."],
      build: ["Validate distance, age and identity before updating counters or emitting movement. On failure stop, disarm and reset clearance. Keep current enable history updated so a fault clearing under a held enable cannot create a false new start.", "Store the last accepted sample ID; do not replace it with a malformed or backwards observation."],
      run: ["Freeze the distance stream during forward travel and during a turn. Watch age cross the limit. Try a backwards ID, a fractional ID and an invalid distance. Inspect the first stopped observation and the reason shown.", "The simulator supplies these fault cases; no physical sensor connection or permission is needed."],
      assess: ["Check exact age boundaries, negative age, malformed identity, backwards identity, frozen samples and errors during turning. Programme or input failure must leave the host's virtual motors stopped.", "Passing the ordinary movement path does not establish a working watchdog; the missing-data paths are checked separately."],
      inspect: ["If motion persists after expiry, inspect whether validation happens only at startup. If clearing a fault resumes movement, inspect armed state and enable history. If duplicate IDs increase clearCount, inspect the freshness and novelty checks separately.", "Fresh enough and genuinely new are different properties of an observation."],
      fix: ["Repair validation order and replay clear travel, frozen input, expiry, fresh input and a still-held enable. The new valid sample removes the fault but must not itself restart the disarmed rover.", "Never replace missing data with a favourable distance just to keep the animation moving."],
      explain: ["Choose why a watchdog uses the age of the observation rather than the age of the page. Explain why input freshness must be checked during every moving state.", "The browser can continue rendering normally while its simulated sensor stream has stopped."],
      reward: ["Save Fresh observations. Your controller now recognises when its evidence is no longer usable. Next you will make starting again a clear, deliberate and testable action.", "Keep the 250/251 ms boundary to check later refactors."],
    },
    questions: {
      learn: { question: "Which sample age is the first whole millisecond outside the allowed window?", choices: ["250 ms", "251 ms", "0 ms"], correctChoice: 1, feedback: "The valid range includes 250 ms; 251 ms exceeds it and must stop and disarm the controller." },
      predict: { question: "A lower sample ID arrives with age zero; how should the controller respond?", choices: ["Treat it as two clear samples", "Ignore its identity and move", "Stop because the identity moved backwards"], correctChoice: 2, feedback: "Freshness does not repair an out-of-order sample identity; both validity requirements must hold." },
      explain: { question: "Why check observation age while the preview still animates?", choices: ["Rendering can continue while sensor evidence becomes stale", "Animation guarantees fresh observations", "Only stopped robots need sensors"], correctChoice: 0, feedback: "The display and the observation stream are separate, so visible animation cannot prove that control data is current." },
    },
  },
  {
    title: "Try again deliberately", concepts: ["Enable edges", "Recovery", "State reset"],
    goals: ["Require a fresh safe enable after interruption or exhausted turns.", "Reset one attempt coherently without erasing the learner's saved work."],
    extension: "Draw the difference between clearing a bumper and asking the rover to explore again. Include a held enable and the later release/new-enable action.",
    activities: {
      learn: ["Detect rising=enabled&&!wasEnabled and update wasEnabled on every observation. A safe rising edge arms in halted mode, clears attempts and clearance, and emits a stop for that observation. Fault clearance, a held enable and completed turns do not create new permission.", "Disabling, stop, bumper and invalid observations clear armed immediately. Three unsuccessful turns also leave it disarmed."],
      predict: ["After a bumper event, clear the bumper while enable remains true. Predict the result, then release and enable with valid fresh distance. Identify which observation resets attempts and which later observations can confirm clearance.", "The new enable observation begins from halted and stopped; it does not jump directly into movement."],
      build: ["Add the explicit arming path before the state machine. On a safe edge initialise halted state and counters, stop and return. After the third unsuccessful turn, remain stopped; permit no new automatic turn until a fresh safe edge begins another attempt.", "Keep accepted sample history coherent across attempts so an old ID cannot masquerade as a new observation."],
      run: ["Use keyboard and onscreen controls through start, obstacle, bumper, clearance, release and new enable. Repeat after exhausted turns and after watchdog expiry. Read the waiting reason at each stopped stage.", "The next required action should be stated in text instead of leaving apparently unresponsive controls unexplained."],
      assess: ["Check held-enable interruption, deliberate recovery, stale input on a new edge, counter reset and the initially stopped arming observation. Repeated identical enable values must never create extra attempts.", "A request to begin is necessary but does not override unsafe current observations."],
      inspect: ["If the rover resumes immediately on clearance, inspect rising versus enabled. If it cannot start after a release, inspect wasEnabled updates in stopped branches. If attempts remain exhausted, inspect the arming reset as one coherent transition.", "Trace permission separately from mode; a halted but armed rover and a disarmed rover have different next actions."],
      fix: ["Repair recovery and run the full interrupted timeline. Confirm a fresh safe enable works, while a fresh enable during an active fault remains stopped and needs another deliberate edge after the fault clears.", "Update input history even when permission is refused, preventing a held unsafe request from later becoming an accidental start."],
      explain: ["Choose why clearing a fault and starting another attempt are separate actions. Explain why resetting simulator state does not mean deleting course progress or named saves.", "Control state belongs to the current attempt; saved source and earned learning progress have a different lifetime."],
      reward: ["Save Deliberate recovery. Your rover now communicates why it is waiting and how to begin again. The final mission combines distance, state, bounded turns and recovery on a complete exploration course.", "Keep a stopped recovery trace beside a successful journey for the final assessment."],
    },
    questions: {
      learn: { question: "What output belongs to a successful fresh arming observation?", choices: ["Maximum forward motion", "An immediate repeated turn", "A stop with reset halted state"], correctChoice: 2, feedback: "Arming establishes a fresh attempt but emits a stopped observation before subsequent state-machine movement." },
      predict: { question: "A bumper clears while enable remains held; what happens next?", choices: ["The rover waits for release and a new safe enable", "The old movement resumes", "The turn counter increases forever"], correctChoice: 0, feedback: "Fault clearance removes one barrier but supplies no fresh enable edge, so the interrupted rover stays disarmed." },
      explain: { question: "Why update enable history while a fault blocks starting?", choices: ["To erase sensor history", "To avoid turning a held unsafe request into a later automatic start", "To ignore future enable changes"], correctChoice: 1, feedback: "Recording the held value prevents fault clearance from being misread as a new user invitation." },
    },
  },
  {
    title: "The exploration course", concepts: ["Integration", "Arrival", "Evidence and limitations"],
    goals: ["Complete a simulated route with a clear stopped arrival state.", "Explain successful, blocked and interrupted journeys using the actual control trace."],
    extension: "Design a route where a left-turn strategy gets stuck and keep the stopped result. Explain what extra sensing or planning another design would need rather than weakening the attempt limit.",
    activities: {
      learn: ["The finished controller reads inputs, updates enable history, validates observations, applies stop and goal, recognises safe arming, then runs one bounded state transition. goal is supplied on arrival and stops and disarms before any movement; it cannot directly award learning completion.", "This simple left-turn strategy succeeds on the supplied practice routes, not on every maze or real-world obstacle."],
      predict: ["Predict a goal observation arriving at the same time as a new enable and confirmed clearance. Compare a persistent blocked route with a reachable one. Identify the legitimate terminal behaviour in each case.", "Goal and safety guards precede arming and movement; a route need not succeed to produce a correct safe outcome."],
      build: ["Combine the verified distance, clearance, timed-turn, watchdog and recovery helpers. Add goal priority and preserve the motor bounds. Keep one readable decision order and ensure every stopped branch returns before another command.", "Avoid separate copies of safety checks in each movement mode; one shared guard prevents them drifting."],
      run: ["Explore the complete course with keyboard controls and repeat using onscreen controls. Reach the goal, interrupt a turn and try a blocked route. Compare state, distance, sample age, attempts and path text with reduced motion enabled.", "The trace and status text must explain the journey without requiring continuous animation or colour recognition."],
      assess: ["Run the final saved-source checks across reachable routes, persistent obstacles, noisy boundaries, duplicate data, stale sensors, simultaneous goal and stop, and fresh restart. Completion requires the integrated controller, not just visiting this lesson.", "The assessment executes the saved current source; save changes before expecting them to alter the result."],
      inspect: ["Locate the earliest wrong transition and classify it as permission, observation, state, timing or output. Compare a failing route with a passing trace and select a focused change that explains both.", "A correct final stopped picture can hide an earlier incorrect command; inspect the full sequence."],
      fix: ["Repair that decision and replay its scenario plus a complete normal route. Save and assess the corrected source. Keep a named final version before extending the strategy or changing the course layout.", "A later experiment may fail without removing already earned completion, but its new source still needs its own evidence."],
      explain: ["Choose what the final assessment establishes and describe a limitation of the supplied observation model. Explain why the free account-bound simulator does not grant access to physical motors or replace separate guardian protections.", "Distinguish demonstrated programme behaviour from claims about equipment or environments you have not tested."],
      reward: ["Save Exploration controller and finish the final assessment. You have built an observable rover with bounded decisions and deliberate recovery. Replay a mission or compare another route while keeping your earned progress and tested project.", "Use the final trace as the starting point for future design changes, including cases where stopping is the correct result."],
    },
    questions: {
      learn: { question: "Where should the goal stop be checked in the controller?", choices: ["After every movement command", "Before arming and movement decisions", "Only after a long turn finishes"], correctChoice: 1, feedback: "Arrival must stop and disarm before another action can command movement or grant fresh permission." },
      predict: { question: "What is correct after three unsuccessful turns on a blocked route?", choices: ["A fourth automatic attempt", "A claim that every maze is solved", "A stopped state awaiting deliberate recovery"], correctChoice: 2, feedback: "The strategy has a bounded failure outcome, so persistent obstruction leads to a clear stopped state instead of endless attempts." },
      explain: { question: "What does the final assessment provide evidence for?", choices: ["The saved controller's documented simulated behaviour", "Guaranteed performance with any real sensor", "Automatic permission to drive physical hardware"], correctChoice: 0, feedback: "Its evidence applies to the saved source and documented simulated scenarios, with physical operation requiring separate protections and verification." },
    },
  },
]);
