import { authorCourse } from "./course-authoring.js";

export const { course, practice } = authorCourse({
  slug: "dance-rover", title: "Dance Rover", category: "robot",
  summary: "Choreograph a simulated two-wheel rover. Start with an explicit stop and enable sequence, explore differential movement, ramp motor power and build reusable timed dance steps. Finish a bounded performance that stops promptly and needs a fresh invitation after interruption. No physical rover is required.",
  projectFiles: [{ path: "robot.cpp", language: "cpp", maximumCharacters: 24000 }],
  starterProject: { files: [{ path: "robot.cpp", source: `bool armed = false;
bool wasEnabled = false;
double leftPower = 0;
double rightPower = 0;
int lastTime = 0;

void setup() {
  stopMotors();
  lastTime = millis();
}

void loop() {
  lastTime = millis();
  stopMotors();
}
` }] },
  reference: [
    { name: "stopMotors", signature: "stopMotors()", description: "Set both simulated wheel powers to zero immediately. Call at startup, when disabled, on stop, after a safety interruption and at the end of a performance. Stop overrides ordinary acceleration smoothing.", example: 'if (boolSensor("stop")) { armed = false; stopMotors(); return; }' },
    { name: "setMotorPower", signature: "setMotorPower(double left, double right)", description: "Command wheel power from -40 through 40 in the simulator. Equal positive values drive forward, equal negative values reverse, and different values turn. Inputs outside the permitted output range must be clamped by the learner's programme.", example: "double bounded = max(-40.0, min(40.0, requested));" },
    { name: "differential movement", signature: "two wheel speeds determine one body motion", description: "The simulated wheels are 120 mm apart and each power unit gives 5 mm/s wheel speed. Body speed is their average; unequal wheel speed changes heading. A faster right wheel curves left. Opposite equal powers rotate around the midpoint.", example: "double average = (leftPower + rightPower) / 2.0; double difference = rightPower - leftPower;" },
    { name: "enable edge", signature: 'boolSensor("enabled"); boolSensor("stop");', description: "Arm on a new false-to-true enable transition while safe. Stop or disabling clears armed. After any interruption, a still-held enable does not restart motion; release and enable again to begin a fresh attempt.", example: 'bool enabled = boolSensor("enabled"); bool rising = enabled && !wasEnabled; wasEnabled = enabled;' },
    { name: "power requests", signature: 'numberSensor("leftRequest"); numberSensor("rightRequest");', description: "Manual-mode controls supply target powers. Clamp targets to the permitted range and approach each at no more than 20 power units per simulated second. Keep left and right current power as separate globals.", example: "double step = 20.0 * dt;" },
    { name: "timing", signature: "millis(), lastTime and danceStart", description: "Calculate dt with division by 1000.0 and cap a control step at 0.1 seconds. Update lastTime while stopped. Dance phases last 2000 ms each and the four-phase performance ends at 8000 ms with an immediate stop.", example: "double dt = min(0.1, (millis() - lastTime) / 1000.0); lastTime = millis();" },
    { name: "mode and safety", signature: 'textSensor("mode"); boolSensor("obstacle"); numberSensor("battery");', description: "Modes are manual and dance. An obstacle, battery below 20 or above 100, negative battery, or unknown mode disarms and stops. Record mode on arming; changing it during motion requires a new enable edge. A programme/input error also stops the host simulation.", example: 'bool safeBattery = numberSensor("battery") >= 20 && numberSensor("battery") <= 100;' },
    { name: "dance helpers", signature: "double leftForPhase(int phase); double rightForPhase(int phase);", description: "Use four target pairs: (20,20), (0,20), (-20,-20), (20,0). Helpers select targets; the shared approach logic applies normal acceleration limits. An unexpected phase returns zero power.", example: "int phase = (millis() - danceStart) / 2000;" },
  ],
}, [
  {
    title: "Stopped until invited", concepts: ["Safe default", "Enable edge", "Latched state"],
    goals: ["Keep the simulated rover stopped until a deliberate enable transition.", "Stop immediately and require a fresh enable after an interruption."],
    extension: "Draw a small state diagram for stopped, armed and interrupted. Label which transitions need a fresh user action rather than simply a safe-looking sensor reading.",
    activities: {
      learn: ["The rover begins stopped. A new enable edge is enabled&&!wasEnabled. Record current enable on every observation, then arm only when that edge occurs and stop is false. Stop clears armed and returns immediately after stopMotors, so later movement cannot override it.", "An armed state remembers permission to perform; a currently true enable value alone does not prove a new invitation happened."],
      predict: ["Enable changes false to true, stop becomes true, then stop clears while enable stays true. Predict whether motion resumes. Finally release enable and turn it on again.", "Clearing a fault is different from asking for another attempt. A held input contains no new false-to-true edge."],
      build: ["Add fresh enable-edge detection and armed state to loop. Update wasEnabled even when stopped. While disarmed, disabled or stopped, clear stored wheel power and emit stopMotors; otherwise request a small equal pair such as (20,20).",
        "Keep the priority branch before every motor command. Stop is immediate and does not wait for a ramp or dance phase."],
      run: ["Use keyboard and onscreen enable controls, hold enable through a stop, then release and enable again. Inspect armed state and both wheel powers on each observation. Restart the simulator to confirm safe startup.", "The stopped text and zero-power readouts communicate the state without relying on visible wheel motion."],
      assess: ["Check startup, a valid enable edge, disabled input, stop priority and a held enable after stop clears. Only a fresh valid enable may begin another attempt.", "A successful ordinary start cannot establish that the interruption path is safe; both sequences are checked."],
      inspect: ["If stop release starts the rover automatically, inspect the difference between enabled and rising. If it never starts again, inspect updates when enable becomes false. If stop is overwritten, inspect commands after the guard.", "Trace enabled, wasEnabled and armed separately to see which state transition is wrong."],
      fix: ["Repair permission handling and replay the complete enable-stop-clear-release-enable sequence. Preserve valid starting behaviour while preventing a held input from restarting motion unexpectedly.", "Reset stored powers when stopping, so a later fresh start begins from zero rather than a hidden old command."],
      explain: ["Choose why recovery requires another enable edge. Explain why a priority stop is a state transition with explicit output rather than a decorative status label.", "The programme must both record that it is disarmed and command zero wheel power."],
      reward: ["Save Deliberate start. Your rover now has a clear permission and stop model. Next you will explore how two independent wheel powers create one rover's movement.", "Keep the held-enable interruption case for every later feature."],
    },
    questions: {
      learn: { question: "What should permit arming a stopped rover?", choices: ["A fresh safe enable edge", "An old held enable forever", "Any change to the display colour"], correctChoice: 0, feedback: "A new false-to-true transition while safe records a deliberate invitation to begin another attempt." },
      predict: { question: "Stop clears while enable remains held true; should motion restart?", choices: ["Yes, immediately", "No, release and enable again first", "Only at twice the old speed"], correctChoice: 1, feedback: "Clearing stop does not create a new enable edge, so the rover remains disarmed until a fresh user action." },
      explain: { question: "Why set stored wheel power to zero when stopping?", choices: ["To erase saved project source", "To make the wheels independent of stop", "To prevent a later start from reusing an old nonzero control value"], correctChoice: 2, feedback: "Resetting control state makes a future fresh attempt begin from zero instead of an invisible previous command." },
    },
  },
  {
    title: "Two wheels, one rover", concepts: ["Differential drive", "Signed values", "Coordinate reasoning"],
    goals: ["Relate left and right wheel targets to straight, curved and turning movement.", "Clamp both wheel outputs independently within the documented power range."],
    extension: "Predict four different wheel pairs on paper and compare their traces from the same initial position and heading. Include a reverse and a turn on the spot.",
    activities: {
      learn: ["A differential rover turns because its wheels travel different distances. Equal positive powers move forward and equal negative powers reverse. If the right wheel is faster, the rover curves left; equal opposite powers rotate around the midpoint. Clamp both wheel requests to -40 through 40.", "The sign gives wheel direction and the magnitude gives its requested speed. Left and right are independent values."],
      predict: ["Compare (20,20), (0,20), (-20,-20) and (-20,20). Predict which goes straight, curves, reverses and rotates. Then request left=80 and right=-60 and predict the bounded output pair.", "Do not clamp the average only. One unsafe wheel can be hidden by an opposite value on the other side."],
      build: ["Read leftRequest and rightRequest in manual mode and clamp each separately. Send the bounded pair only through the armed path. Retain immediate stop and the fresh-enable requirement from the previous mission.", "Keep named left and right variables so an accidental swap is easier to spot."],
      run: ["Try the four wheel pairs in the simulator using manual controls and inspect the path and heading trace. Compare equal powers with unequal powers, then test out-of-range requests and stop during a turn.", "The path's coordinate list provides the same directional evidence as the moving rover picture."],
      assess: ["Check independent clamping, signed directions and the commanded pairs that create the documented motions. Boundary cases include one oversized wheel request while the other's value is valid.", "A visually slow body does not prove safe wheel commands; each output is checked independently."],
      inspect: ["If turns go the wrong way, inspect which request controls which wheel. If reverse moves forward, inspect sign handling. If a wheel exceeds bounds, inspect whether clamping was applied to each value before output.", "Compare emitted left/right values before assuming the simulated motion model is wrong."],
      fix: ["Repair wheel mapping or bounds and repeat forward, reverse, curve and rotation cases. Verify stop immediately returns both powers to zero even when they have different signs.", "Do not use an absolute value that accidentally removes the distinction between forward and reverse."],
      explain: ["Choose why equal opposite wheel powers can turn the rover without moving its midpoint forward. Explain why safe body motion still requires checking both individual wheels.", "Average power and wheel difference describe different parts of differential movement."],
      reward: ["Save Differential movement. Your rover now expresses several movements with two numbers. Next you will approach requested powers gradually so normal changes are controlled rather than abrupt.", "Keep a mixed-sign wheel pair as a useful regression case for smoothing."],
    },
    questions: {
      learn: { question: "What does a faster right wheel do relative to the left wheel?", choices: ["Always reverse the whole rover", "Curve the rover left", "Leave the heading unchanged"], correctChoice: 1, feedback: "The faster right wheel travels farther, turning the rover toward its slower left side." },
      predict: { question: "Requests (80,-60) clamped independently to -40 through 40 produce which pair?", choices: ["(10,10)", "(80,-60)", "(40,-40)"], correctChoice: 2, feedback: "Each wheel is bounded separately: 80 becomes 40 and -60 becomes -40." },
      explain: { question: "Why can equal opposite wheel powers rotate around the midpoint?", choices: ["Their forward contributions cancel while their difference turns the body", "Both wheels become disabled", "Their signs are ignored"], correctChoice: 0, feedback: "Opposite equal motion gives zero average forward speed but a nonzero wheel-speed difference." },
    },
  },
  {
    title: "Build speed gently", concepts: ["Acceleration limit", "Elapsed time", "Priority exceptions"],
    goals: ["Approach each normal wheel target at no more than 20 power units per second.", "Keep stop immediate while preventing a large movement step after a paused or disabled interval."],
    extension: "Compare acceleration limits of 10 and 20 with the same target. Explain how the time to reach that target changes without changing the final power bound.",
    activities: {
      learn: ["Normal target changes use a ramp. Derive dt from simulated milliseconds with floating division, cap it at 0.1 seconds and approach each target by at most 20×dt. Stop is a deliberate exception: it commands zero immediately and clears stored ramp state.", "A gentle acceleration rule must never make emergency stopping wait for a slow ramp down."],
      predict: ["At dt=0.05 seconds, predict the maximum normal power change. Then start at leftPower=0.4 with target zero and compare a normal approach with an explicit stop request.", "The normal step is one power unit, but arrival clamps at the remaining 0.4. An explicit stop goes straight to zero regardless of the old power."],
      build: ["Add a reusable double approach helper and apply it independently to leftPower and rightPower. Update lastTime even while disabled. Clamp target requests first, ramp normal changes next and keep the priority stop branch before motor output.", "Use 1000.0 in the milliseconds conversion so short observation intervals do not truncate to zero."],
      run: ["Step through acceleration, deceleration and a sign reversal. Compare both wheels when their targets differ. Pause or disable for several observations, then request a fresh start and inspect the first ramp step.", "Numeric power traces make rate changes visible even with reduced animation."],
      assess: ["Check ramp rate, no overshoot, independent wheels, short elapsed values, capped long intervals and immediate stop. A fresh start after interruption must ramp from zero rather than reuse the old state.", "Tests distinguish normal deceleration from the explicit stop exception; both are intentional parts of the controller."],
      inspect: ["If one wheel jumps, inspect its own current value and target. If nothing ramps, inspect integer division. If stop takes several ticks, inspect whether it incorrectly passes through approach.", "Keep the safety path short and explicit, while normal movement uses the shared smoothing helper."],
      fix: ["Repair the ramp calculation and replay a reverse-direction change plus an immediate stop at nonzero power. Recheck target bounds and held-enable recovery so smoother motion does not weaken the existing rules.", "A target beyond the limit should be bounded before approach; otherwise the ramp can eventually reach an unsafe value."],
      explain: ["Choose why ordinary speed changes and a priority stop use different transitions. Explain how a consistent per-second ramp remains comparable across different observation intervals.", "The controller can prefer gentle normal motion while treating stop as an immediate requirement."],
      reward: ["Save Gentle power. You have a bounded, time-aware controller for both wheels. Next you will choose those targets from named dance steps without duplicating the controller.", "Keep a one-wheel reversal trace to test future choreography changes."],
    },
    questions: {
      learn: { question: "Which action bypasses normal acceleration smoothing?", choices: ["Any new target request", "A phase name change", "An explicit priority stop"], correctChoice: 2, feedback: "Stop sets both wheels to zero immediately; ordinary target changes remain rate-limited." },
      predict: { question: "At 20 power units per second and dt=0.05, what is the maximum normal change?", choices: ["One power unit", "Twenty power units", "Four hundred power units"], correctChoice: 0, feedback: "The rate multiplied by elapsed seconds is 20 × 0.05 = 1 power unit." },
      explain: { question: "Why update lastTime while the rover is disabled?", choices: ["To keep hidden nonzero motor commands", "To prevent accumulated disabled time causing a large first movement step", "To remove the need for a fresh enable"], correctChoice: 1, feedback: "Fresh timing history prevents the next valid start from treating an old gap as time that should have been spent accelerating." },
    },
  },
  {
    title: "Name the dance steps", concepts: ["Functions", "Choreography", "Bounded duration"],
    goals: ["Select four timed target pairs through reusable phase functions.", "End the performance after eight simulated seconds and require a new enable to start again."],
    extension: "Create another four-phase target mapping in a separate save. Keep each phase duration and the shared motor controller unchanged to compare choreography alone.",
    activities: {
      learn: ["A dance chooses targets while the controller applies safe movement. Use leftForPhase and rightForPhase for (20,20), (0,20), (-20,-20), (20,0). Each phase lasts 2000 ms. At 8000 ms stop, disarm and wait for a new invitation instead of looping forever.", "The phase functions should return target numbers; they should not issue their own motor commands or bypass the shared ramp."],
      predict: ["Predict the target pair at elapsed times 0, 2500 and 6500 ms, then the behaviour at 8000 ms. Consider enable still held when the performance ends.", "Integer division by 2000 gives phases zero through three. The end boundary is checked before using phase four."],
      build: ["Record danceStart when a safe enable edge arms dance mode. Add the two phase helpers and use them to choose targets before the normal ramp. Stop at the end, clear armed and stored powers, and require release/enable to restart from phase zero.", "Give unexpected phase values a zero target fallback, but keep the explicit performance-end condition too."],
      run: ["Step through the full eight-second performance, pausing at each phase transition. Compare target and actual powers, then hold enable after the end to verify it remains stopped. Re-enable deliberately for a fresh first phase.", "The trace can describe choreography without requiring you to follow continuous movement."],
      assess: ["Check phase boundaries, target mappings, shared ramp use, the finite end and fresh restarting. Unexpected phase values must not produce an arbitrary or unbounded command.", "A final stop only after a long busy loop is not responsive choreography; each observation must finish promptly."],
      inspect: ["If a phase jumps power, inspect direct commands inside its helper. If the dance repeats unexpectedly, inspect arming after the end. If phases begin at the wrong offset, inspect when danceStart is set.", "One clock tracks whole-performance elapsed time; the ramp timestamp tracks only the current control step."],
      fix: ["Repair mapping or duration and replay the first, middle and final boundaries. Recheck an ordinary manual-mode ramp to confirm the same controller still serves both target sources.", "Changing choreography should affect target selection, not require another copy of movement safety logic."],
      explain: ["Choose why naming phase functions helps reuse the controller. Explain why a finite performance with a deliberate restart is easier to reason about than an unbounded dance loop.", "A clear end state is part of a complete interactive project, alongside the visible movement."],
      reward: ["Save Named dance. Your rover can perform a complete timed sequence. Next you will interrupt it with obstacles, low battery and mode changes while preserving the explicit restart rule.", "Keep the exact end-time case as a regression test for later show changes."],
    },
    questions: {
      learn: { question: "What should the dance-phase helpers return?", choices: ["Target wheel powers for the shared controller", "Unrestricted direct device commands", "A new hidden acceleration limit"], correctChoice: 0, feedback: "Separating target selection lets manual and dance modes share the same bounded movement controller." },
      predict: { question: "Which target pair belongs to elapsed time 2500 ms?", choices: ["(20,20)", "(0,20)", "(-20,-20)"], correctChoice: 1, feedback: "2500 ms is in phase one, the second two-second phase, which selects (0,20)." },
      explain: { question: "What happens at the eight-second performance end while enable remains held?", choices: ["The dance restarts automatically", "The last wheel powers remain forever", "The rover stops and waits for a fresh enable edge"], correctChoice: 2, feedback: "The finite end disarms the rover. Holding enable does not constitute another invitation to perform." },
    },
  },
  {
    title: "An interrupted performance", concepts: ["Fresh safety input", "Latching", "Recovery"],
    goals: ["Stop and disarm on obstacles, unsafe battery readings or a mode change during motion.", "Recover only through a fresh safe enable, restarting the performance from its beginning."],
    extension: "Construct a timeline where an obstacle clears while enable stays held. Add a mode change and explain which later user action is required before movement may resume.",
    activities: {
      learn: ["A performance can become unsafe after it starts. Read obstacle and battery every observation. An obstacle or battery outside 20–100 stops and disarms. Record the selected mode when arming; changing it while active also stops. Clearing the cause does not automatically resume the old sequence.", "These are supplied simulator observations, not access to a real battery monitor or physical obstacle sensor."],
      predict: ["During phase two, battery falls to 15 and later returns to 80 while enable stays held. Predict power and armed state. Then release and re-enable with a clear obstacle sensor and choose the phase that begins.", "Recovery requires both safe conditions and a new edge. A new attempt resets danceStart rather than continuing halfway through an old move."],
      build: ["Add safety validation before all motor output. Store activeMode on arming and reject unknown or changed modes. On interruption call stopMotors, clear armed and both powers, keep enable/time observations current and require a fresh safe edge for another attempt.", "Do not treat an invalid battery above 100 as extra-safe charge; it is an out-of-range observation."],
      run: ["Introduce an obstacle, low battery, invalid battery and a mode change during different phases. Clear each while enable remains held, then restart deliberately. Inspect the reason text, armed state and zero outputs.", "A visible stopped reason explains why controls are waiting instead of leaving the learner with a silent failure."],
      assess: ["Check every interruption, exact battery boundaries, invalid modes, held enable after recovery and fresh phase-zero restart. Programme or input failure must stop the simulation rather than keep the last moving output active.", "Safe recovery is a sequence of observations, not just a single good sensor value."],
      inspect: ["If motion resumes on fault clearance, inspect the latched armed state. If an old dance phase continues, inspect danceStart reset. If one wheel keeps moving, inspect both stored powers and the emitted stop command.", "Use the first interrupted observation as the point where all movement permission must be removed."],
      fix: ["Repair interruption and replay fault, clearance, release and re-enable as one timeline. Confirm legitimate safe starts still work and stop remains immediate even during a power ramp.", "Do not hide invalid sensor data by substituting a favourable value. Keep the controller stopped and expose a useful explanation."],
      explain: ["Choose why a cleared obstacle is not itself a start command. Explain how latching the interrupted state prevents surprising motion after a temporary fault.", "Fresh observations establish safety; a separate deliberate action establishes permission to begin again."],
      reward: ["Save Recoverable performance. Your rover now handles interruptions without replaying hidden old motion. The final mission combines manual control, choreography and recovery into one understandable show.", "Keep a held-enable recovery timeline for the final integrated assessment."],
    },
    questions: {
      learn: { question: "Which battery observations permit arming under this simulator's rule?", choices: ["Any positive number, including 500", "Values from 20 through 100 with other conditions safe", "Only values below 20"], correctChoice: 1, feedback: "Both the low-charge threshold and the valid upper bound must hold, along with the other safety checks." },
      predict: { question: "After a low-battery stop clears while enable stays held, what should the rover do?", choices: ["Continue the old phase immediately", "Skip to the fastest phase", "Remain stopped until a fresh safe enable edge"], correctChoice: 2, feedback: "Fault clearance removes the cause but does not create another user invitation, so the latched disarmed state remains." },
      explain: { question: "Why restart choreography from phase zero after deliberate recovery?", choices: ["To make the new attempt predictable instead of resuming hidden old movement", "To erase course progress", "To ignore the selected mode"], correctChoice: 0, feedback: "A fresh attempt has a documented beginning, avoiding an unexpected continuation from wherever an interrupted sequence stopped." },
    },
  },
  {
    title: "The rover performance", concepts: ["Integration", "Priority reasoning", "Accessible operation"],
    goals: ["Deliver a complete bounded rover performance using one consistent controller.", "Support manual and dance operation, explicit stop, recovery and restart with understandable feedback."],
    extension: "Choreograph another routine in a separate save and describe its target changes. Replay power bounds, ramp, stop, fault and end-state tests before comparing the performance.",
    activities: {
      learn: ["The final rover has one control order: observe inputs, update history, apply safety and mode guards, recognise a new enable, select targets, ramp normal movement and emit bounded outputs. A performance end or stop takes the immediate zero-output path instead.", "Keep one shared controller so manual and dance modes cannot disagree about safety or acceleration limits."],
      predict: ["Predict an observation where a phase change, mode change and obstacle all coincide. Then consider the first safe enable after recovery. Identify which decision prevents motion and which state is reset for a new attempt.", "Safety and mode interruption precede target selection. A later phase calculation must never overwrite the stop decision."],
      build: ["Combine your verified helpers into the final manual/dance controller. Preserve explicit arming, per-wheel bounds, normal rate limits and finite choreography. Keep unknown modes and invalid inputs on the stopped path with no hidden fallback to movement.", "Use a clear early return after every disarming condition before the shared target and output path."],
      run: ["Operate the full show using keyboard controls, then onscreen controls. Try manual steering, a complete dance, pause, stop, faults and deliberate recovery. Compare the path, wheel powers and reason text in reduced-motion mode.", "The same actions should remain understandable without relying on the rover's animation or colour alone."],
      assess: ["Run final saved-source checks across manual requests, phase boundaries, ramps, simultaneous interruptions, repeated enable values and restart. Both normal operation and awkward input sequences must follow the documented rules.", "A pleasant-looking dance is only one scenario; the final assessment also exercises the moments when it must not move."],
      inspect: ["Find the earliest incorrect motor command and trace its armed state, mode, safety inputs and target source. Separate selection errors from rate errors and permission errors before making a focused repair.", "A final zero power can hide an earlier unsafe command, so inspect the complete observation trace."],
      fix: ["Repair the responsible decision and rerun its focused timeline plus a normal full performance. Save and assess the current source before finishing, and keep the final version in a named slot before experimenting.", "Do not slow the preview to hide an incorrect command rate. Repair the programme's emitted values and state transitions."],
      explain: ["Choose what makes the final controller predictable and explain one limitation of the simplified differential model. Distinguish simulator completion from the separate protections needed for any future physical build.", "The project demonstrates control logic with supplied observations; it does not grant device access or certify a real rover."],
      reward: ["Save Rover performance and complete the final assessment. You have combined differential movement, reusable choreography and explicit recovery into a complete simulated project. Replay a mission or explore another routine while retaining earned course completion.", "Keep the tested show before extending it. Existing guardian and hardware protections remain separate from free account-bound simulator access."],
    },
    questions: {
      learn: { question: "Why should manual and dance modes share one controller?", choices: ["So their power, timing and safety rules stay consistent", "So neither can ever start", "So modes can bypass stop independently"], correctChoice: 0, feedback: "Different target sources can reuse the same validated output and permission path, preventing duplicated rules from drifting." },
      predict: { question: "An obstacle appears on the same observation as a new dance phase; which result wins?", choices: ["The new phase's motor targets", "Immediate stop and disarming", "An average of stop and movement"], correctChoice: 1, feedback: "The safety guard is evaluated before phase targets, so choreography cannot override the stop decision." },
      explain: { question: "What does passing the final rover simulation establish?", choices: ["Unrestricted permission for real motor hardware", "A guarantee that future choreography needs no testing", "Evidence for the documented bounded controller and scenarios"], correctChoice: 2, feedback: "The assessment supports the simulated behaviour, while physical operation and future source changes require their own checks." },
    },
  },
]);
