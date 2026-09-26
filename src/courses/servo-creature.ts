import { authorCourse } from "./course-authoring.js";

export const { course, practice } = authorCourse({
  slug: "servo-creature", title: "Servo Creature", category: "robot",
  summary: "Give a simulated creature a moving joint and a personality. Begin with safe angle limits, add smooth motion and reusable pose sequences, then respond to mood requests and touch. Finish a small creature show whose stop and proximity rules remain effective throughout. Physical hardware is not required.",
  projectFiles: [{ path: "robot.cpp", language: "cpp", maximumCharacters: 24000 }],
  starterProject: { files: [{ path: "robot.cpp", source: `double angle = 90;
int lastTime = 0;

void setup() {
  setServoEnabled(false);
  setCreatureMood("calm");
  lastTime = millis();
}

void loop() {
  lastTime = millis();
  setServoEnabled(false);
}
` }] },
  reference: [
    { name: "setServoEnabled", signature: "setServoEnabled(bool enabled)", description: "Enable or disable the simulated joint. Disabled holds the last actual angle; do not send angle commands while disabled. Stop or an unsafe proximity reading must disable the joint before other movement decisions.", example: 'if (boolSensor("stop")) { setServoEnabled(false); return; }' },
    { name: "setServoAngle", signature: "setServoAngle(double degrees)", description: "Request an enabled joint angle from 30 through 150 degrees. The joint starts at 90. The simulator rejects out-of-range commands; later missions also require the learner's source to limit movement to 45 degrees per simulated second.", example: "double bounded = max(30.0, min(150.0, requested));" },
    { name: "millis", signature: "int millis()", description: "Read supplied simulated time. Derive elapsed seconds with division by 1000.0 and cap a control step at 0.1 seconds. Update lastTime even while stopped so resuming does not accumulate an old delay into a sudden jump.", example: "double dt = min(0.1, (millis() - lastTime) / 1000.0); lastTime = millis();" },
    { name: "approach", signature: "double approach(double current, double target, double step)", description: "A learner-authored helper moves toward the target by at most step and stops exactly on arrival. It must work from above or below without overshooting or changing the permitted angle range.", example: "if (current < target) return min(target, current + step); return max(target, current - step);" },
    { name: "setCreatureMood", signature: "setCreatureMood(string mood)", description: "Choose calm, curious or happy, presented with text and a distinct symbol. The mood affects the chosen target pose, not the angle bounds or stop protections. Unknown requests use calm.", example: 'setCreatureMood("curious");' },
    { name: "mood requests", signature: 'textSensor("requestedMood"); numberSensor("moodRequestId");', description: "A supplied integer request id identifies a new mood selection. Handle a new request once; repeated observations of its id must not override later touch-driven changes. A new request takes priority over a simultaneous touch edge.", example: 'int requestId = numberSensor("moodRequestId"); if (requestId != lastRequestId) { lastRequestId = requestId; }' },
    { name: "touch and proximity", signature: 'boolSensor("touch"); numberSensor("distanceCm");', description: "Use a rising touch edge to cycle moods once. A distance below 10 cm, below zero or above 400 is unsafe for this simulator and disables motion. Read these observations freshly; update touch history while stopped.", example: 'bool touched = boolSensor("touch"); bool rising = touched && !wasTouched; wasTouched = touched;' },
    { name: "pose sequence", signature: "double poseForPhase(int phase)", description: "The sequence uses 60, 120 and 90 degrees for phases zero, one and two, with 2000 ms between phase changes. Smoothing approaches each target. Stop holds the phase and refreshes its clock; restarting the simulator starts the sequence again.", example: "phase = (phase + 1) % 3;" },
  ],
}, [
  {
    title: "A pose inside the limits", concepts: ["Angles", "Bounds", "Enabled state"],
    goals: ["Move an enabled simulated joint only within its 30–150 degree range.", "Keep startup disabled and make stop hold the joint's current angle."],
    extension: "Sketch three poses inside the permitted range and label their angles. Explain why a more dramatic pose cannot justify sending an out-of-range command.",
    activities: {
      learn: ["The creature's joint starts at 90 degrees and may move from 30 to 150. A requested pose and permission to move are separate decisions. Keep setup disabled; while active enable the joint before setting an angle. Stop disables it and holds the last actual pose.", "This is a simulator. These teaching limits are not instructions for attaching or powering a real servo."],
      predict: ["Predict which requests among 20, 30, 90, 150 and 170 degrees are permitted. Then stop the creature at 120 and decide whether stop should force a sudden move back to 90.", "Disabling holds the current angle. Neutral position is a target pose, not an automatic consequence of stop."],
      build: ["Keep the safe setup and edit loop to check stop first. Otherwise enable the joint and request a bounded 120-degree pose. Use min and max to express the allowed range if the target comes from a variable.", "Do not set an angle after disabling. An early return makes the priority stop branch explicit."],
      run: ["Run the creature and inspect its angle and enabled state. Stop it at the selected pose using keyboard and onscreen controls. Compare the joint picture with the numeric angle and status label.", "The text state explains enabled and disabled without relying on movement alone."],
      assess: ["Check disabled startup, valid boundary angles, rejected out-of-range requests and stop priority. The evaluator distinguishes an enabled angle command from one sent while the joint should be held.", "A clamped display cannot repair unsafe source commands. The project itself must request values within the documented range."],
      inspect: ["If the creature moves during stop, inspect command order and early return. If it refuses a pose, inspect bounds and whether enabling happened first. If the label changes but the joint does not, compare emitted commands with the enabled state.", "Treat the command trace as evidence of what the programme requested, separate from the picture's presentation."],
      fix: ["Repair enabling or bounds, then test 30, 90 and 150 as valid values and a stopped observation. Preserve the stopped actual angle and verify the next active observation can still select a valid pose.", "Do not remove stop handling to make the joint move; repair the valid active path."],
      explain: ["Choose why permission to move is separate from the requested angle. Explain why holding the last pose can be a clearer stopped behaviour than unexpectedly jumping to a neutral position.", "A safe state transition should have one documented meaning that remains visible in the status text."],
      reward: ["Save Bounded pose. You have a clear joint range and a priority stop path. Next you will approach a target gradually so the creature moves smoothly rather than jumping between poses.", "Keep these boundary-angle cases for every later movement change."],
    },
    questions: {
      learn: { question: "Which range is permitted for this simulated joint?", choices: ["Any angle at all", "30 through 150 degrees", "Only values above 180"], correctChoice: 1, feedback: "The documented teaching range includes both endpoints, with 90 degrees as the initial pose." },
      predict: { question: "Stop is pressed while the joint is at 120 degrees; what should happen?", choices: ["Jump immediately to zero", "Keep moving to the next phase", "Disable and hold the current angle"], correctChoice: 2, feedback: "Stop disables motion and preserves the actual pose instead of introducing an unexpected movement." },
      explain: { question: "Why track enabled state separately from target angle?", choices: ["A valid pose is not itself permission to move", "It removes the need for angle bounds", "It changes the device into a real robot"], correctChoice: 0, feedback: "The project must satisfy both the movement permission and the range rule before applying a pose." },
    },
  },
  {
    title: "Move a little at a time", concepts: ["Rate limits", "Floating arithmetic", "Arrival clamping"],
    goals: ["Approach a target at no more than 45 degrees per simulated second.", "Avoid overshoot and accumulated movement after a long stopped interval."],
    extension: "Compare approach speeds 20 and 45 using the same target and observations. Explain how speed affects travel time while the final pose remains unchanged.",
    activities: {
      learn: ["Smooth motion changes angle by a bounded amount each observation. Compute dt=(now-lastTime)/1000.0, cap dt at 0.1 and use step=45×dt. Move toward the target by at most that step, clamping at arrival. Store angle and lastTime globally.", "The decimal 1000.0 matters: integer division could make short elapsed intervals become zero."],
      predict: ["At 45 degrees per second and dt=0.02, predict the maximum change. If the remaining gap is only 0.3 degrees, decide whether to apply the whole normal step. Consider a long stopped interval before resuming.", "The ordinary step is 0.9 degrees, but a closer target needs only its remaining gap. Refresh time while stopped to prevent a large resume step."],
      build: ["Write approach(current,target,step) as a double helper using min below the target and max above it. Update lastTime on every observation, including stop. While enabled, update the global angle through approach and emit that bounded value.", "Calculate elapsed time before replacing lastTime; replacing it first would make every dt zero."],
      run: ["Step from 90 toward 120, then toward 60. Inspect consecutive angle differences and the final short arrival step. Stop for several observations, resume and confirm there is no sudden catch-up jump.", "Use the numeric trace to inspect smoothness even when reduced motion keeps the preview still."],
      assess: ["Check both directions, exact arrival, small and large elapsed intervals, int-versus-double division and stop/resume timing. Requested angle changes must obey the 45-degree rate and remain within bounds.", "A slow-looking animation cannot prove correct rate limiting; the checks compare successive commanded values and simulated time."],
      inspect: ["If nothing moves, inspect integer division and timestamp order. If it overshoots, inspect arrival clamping. If resuming jumps, inspect whether stopped observations still refresh lastTime.", "Separate current angle, target, elapsed seconds and allowed step while debugging the calculation."],
      fix: ["Repair the calculation and replay the short-gap, reverse-direction and stopped-interval cases. Recheck enabled state and angle limits from the first mission so smoothing cannot bypass them.", "A new target does not permit a larger instantaneous step; the same approach rule applies in either direction."],
      explain: ["Choose why the final step must be clamped to the target even when the rate is correct. Explain why simulated seconds and floating arithmetic belong together in this control loop.", "A rate describes how far movement may progress, not a requirement to overshoot a nearby destination."],
      reward: ["Save Gentle movement. Your creature now reaches poses smoothly and resumes predictably. Next you will organise several target poses into a reusable timed sequence.", "Keep the 0.3-degree arrival case because it exposes a subtle overshoot error."],
    },
    questions: {
      learn: { question: "Why divide elapsed milliseconds by 1000.0 rather than integer 1000?", choices: ["To make every interval ten seconds", "To ignore elapsed time", "To retain fractional seconds in short updates"], correctChoice: 2, feedback: "Floating division preserves small intervals such as 0.02 seconds instead of truncating them to zero." },
      predict: { question: "At 45 degrees per second, what is the maximum change in 0.02 seconds?", choices: ["0.9 degrees", "45 degrees", "900 degrees"], correctChoice: 0, feedback: "The rate multiplied by elapsed seconds is 45 × 0.02 = 0.9 degrees." },
      explain: { question: "Why refresh lastTime even during a stopped observation?", choices: ["To secretly move while stopped", "To prevent old stopped time becoming a large resume movement", "To erase the target"], correctChoice: 1, feedback: "The timestamp tracks the latest observation, so resuming does not treat the whole stopped period as one movement step." },
    },
  },
  {
    title: "A sequence of poses", concepts: ["Parameters", "Timed phases", "Separation of concerns"],
    goals: ["Map three timed phases to target poses through one reusable helper.", "Keep target selection separate from the smooth movement and stop rules."],
    extension: "Design a second sequence by changing only its target mapping. Keep the movement rate and phase interval unchanged so the comparison has one clear cause.",
    activities: {
      learn: ["A sequence selects targets; the approach helper moves toward them. Define poseForPhase with 60, 120 and 90 degrees for phases zero, one and two. Advance the phase every 2000 ms using modulo three. Each target still passes through the same smooth movement rule.", "Do not send the new target directly on a phase change, or the sequence will bypass smoothing exactly when it matters."],
      predict: ["Starting at phase two, predict the next phase and target. Then compare changing a target to 120 with instantly commanding angle 120 while the current pose is 60.", "The target can change immediately while the actual angle approaches it over several observations."],
      build: ["Add a phase variable, phase timestamp and poseForPhase helper. Update the phase only when the two-second interval elapses. During stop hold the phase and refresh its clock, then feed the current target to approach while active.", "Keep phase time distinct from lastTime used for movement steps; the two clocks represent different intervals."],
      run: ["Step through two full sequences, pausing at a phase boundary. Watch target and current angle separately. Stop during the middle phase and resume to confirm the sequence does not skip ahead through the stopped time.", "A trace with phase, target and angle explains the sequence even without watching an animated joint."],
      assess: ["Check all target mappings, wraparound, phase interval, held phase during stop and bounded movement on target changes. An unexpected phase should return the neutral 90-degree target.", "The helper must use its parameter so it can be checked independently of the live global phase."],
      inspect: ["If target changes move instantly, inspect where approach is bypassed. If phases skip after stop, inspect the phase timestamp. If every phase uses one pose, inspect the helper's parameter comparisons.", "Test target selection separately from movement to find which part of the sequence is wrong."],
      fix: ["Repair phase selection or timing and replay a full cycle plus a stop at a boundary. Preserve the movement-rate and enabled-state checks from earlier missions.", "Changing a sequence should not require rewriting the safe movement calculation."],
      explain: ["Choose why target selection and movement belong in separate helpers. Explain how the same approach rule can support another sequence without repeating its safety logic.", "Separate responsibilities let one function decide where to go and another decide how far it may move now."],
      reward: ["Save Living sequence. Your creature can perform a repeated set of smooth poses. Next you will give different target choices meaningful mood names and symbols.", "Keep the neutral fallback case when adding any new pose mappings."],
    },
    questions: {
      learn: { question: "What should a phase change alter immediately?", choices: ["The selected target, while movement still approaches it", "Every safety limit", "The actual angle regardless of distance"], correctChoice: 0, feedback: "Selecting another target does not bypass the bounded approach used to move the joint." },
      predict: { question: "Which phase and target follow phase two in the documented sequence?", choices: ["Phase three at 180", "Phase zero at 60", "Phase two forever"], correctChoice: 1, feedback: "Modulo three wraps the next phase back to zero, whose target is 60 degrees." },
      explain: { question: "Why keep phase timing separate from the movement-step timestamp?", choices: ["To prevent all timing", "To make stop delay longer", "They measure different intervals and responsibilities"], correctChoice: 2, feedback: "One clock schedules target changes, while the other limits movement during each individual observation." },
    },
  },
  {
    title: "Give the creature a mood", concepts: ["Named modes", "Input identity", "Fallbacks"],
    goals: ["Map calm, curious and happy requests to clear mood labels and target poses.", "Handle each new request once and use a safe fallback for unknown mood text."],
    extension: "Propose another mood with a text label, symbol and bounded target. Explain how it would fit the existing mapping and which checks would need extending.",
    activities: {
      learn: ["A mood names a mode of behaviour. Map calm to a 90-degree target, curious to 120 and happy to 60, and emit the matching mood label. A moodRequestId identifies a new selection; repeated observations of the same request are not new instructions. Unknown mood text falls back to calm.", "The mode changes the target choice, not the angle bounds, movement rate or stop priority."],
      predict: ["A curious request with id four arrives twice. Predict how many selection events it represents. Then an unknown mood arrives with id five; choose the target and label that should follow.", "Identity distinguishes a repeated observation from a new request, while validation decides whether the requested value is supported."],
      build: ["Store mood and lastRequestId globally. On a new request id, validate requestedMood and select calm, curious or happy once. Add a helper that returns the mood target and pass that target through approach. Keep the sequence helper available as a separate exercise.", "Do not replace the current mood on every repeated observation, because a later touch event will also be able to change it."],
      run: ["Select each mood with keyboard and onscreen controls. Inspect its label, symbol, target and actual approach. Repeat a request id and send an unknown value to compare identity handling with fallback handling.", "Meaning should remain clear from words and symbols even when the joint is paused or disabled."],
      assess: ["Check all three mappings, repeated ids, a new invalid request and smooth movement toward a changed target. Tests require the unknown request to use calm without losing the safe control state.", "A new id is not proof that its text is valid. Apply both checks."],
      inspect: ["If a repeated request keeps undoing another change, inspect lastRequestId. If a mood changes safety bounds, separate the mapping from control limits. If unknown text causes an arbitrary pose, inspect the fallback branch.", "Trace request id, requested text and accepted mood as three distinct values."],
      fix: ["Repair request handling or mapping and repeat valid, duplicate and unknown selections. Recheck movement rate during a large target change and stop while a request arrives.", "A safe fallback should still leave the creature usable and explain which supported mood was selected."],
      explain: ["Choose why a named mood can change expression without changing safety rules. Explain why repeated sensor records need identity when several kinds of interaction can change the same state.", "The interface describes intent; the control loop still enforces what motion is permitted."],
      reward: ["Save Expressive creature. Your joint now has understandable modes driven by explicit requests. Next it will react once to touch and stop when a proximity observation makes movement unsafe.", "Keep a repeated request as a regression case when adding another input source."],
    },
    questions: {
      learn: { question: "What should remain unchanged when the creature's mood changes?", choices: ["Only its text label", "Angle, movement-rate and stop protections", "The previous request id forever"], correctChoice: 1, feedback: "Mood chooses an expression target; the shared control limits and stop priority remain in force." },
      predict: { question: "A new request contains an unknown mood; which documented fallback is used?", choices: ["An angle outside the range", "A random mood each frame", "Calm with a 90-degree target"], correctChoice: 2, feedback: "Unknown text has a predictable supported fallback, keeping both presentation and movement understandable." },
      explain: { question: "Why remember the last mood request id?", choices: ["To process one request once instead of replaying the same observation", "To remove touch support", "To bypass text validation"], correctChoice: 0, feedback: "Identity prevents repeated observations from continually reapplying an old selection after other interactions." },
    },
  },
  {
    title: "A gentle response to touch", concepts: ["Input edges", "Safety priority", "Fresh observations"],
    goals: ["Cycle moods once for each new touch while handling held input predictably.", "Disable movement for unsafe proximity and preserve input/time history through stop."],
    extension: "Build a timeline of touch, hold, release and a nearby obstacle. Explain which observations change mood and which require holding the joint still.",
    activities: {
      learn: ["A new touch is touched&&!wasTouched, so a held sensor does not cycle moods repeatedly. Read distance fresh: values below 10 cm, below zero or above 400 disable the joint. Update touch history and timestamps even when movement is disabled, then return before sending angles.", "A sensor's reading is an observation, not a permanent promise that the space will remain clear."],
      predict: ["Predict mood changes for false, true, true, false, true touch observations. Then hold touch while distance falls to five centimetres and later becomes clear: decide whether clearing the obstacle alone should create another touch event.", "Only a real false-to-true transition creates a new touch. Safety recovery must not invent an input edge."],
      build: ["Add wasTouched and edge detection. Cycle calm to curious to happy to calm on a valid new touch. Give a new explicit mood request priority over a simultaneous edge. Apply stop and proximity guards before enabling or commanding the joint.", "Consume observation history while disabled, but do not move or apply a delayed old touch on resume."],
      run: ["Use touch controls, hold through several observations and then release. Introduce near, invalid and clear distance readings while stepping. Inspect enabled state, actual angle, mood and previous-touch history together.", "The simulator offers supplied distance values; it does not request a physical sensor or camera connection."],
      assess: ["Check touch edges, long holds, simultaneous request priority, stop, near and invalid distances, and safe recovery. Failed or mistyped sensor input must result in a stopped simulation rather than continued motion.", "A correct normal touch response does not establish that the priority safety branches work."],
      inspect: ["If a hold changes mood repeatedly, inspect edge history. If a nearby obstacle is ignored, inspect fresh sensor reads and branch order. If resume jumps, inspect time updates during disabled observations.", "Look for the earliest observation where accepted input or enabled state differs from the documented rule."],
      fix: ["Repair the input or safety branch and replay hold-through-stop and hold-through-near-obstacle cases. Confirm a later genuine new touch still works and every commanded angle remains bounded and smooth.", "Keep old input from replaying, while preserving useful future interaction after the space becomes clear."],
      explain: ["Choose why safety observations take priority over expression. Explain how updating input history while disabled supports a predictable recovery without secretly moving the joint.", "Maintaining state and commanding movement are separate operations; the first can continue while the second is disabled."],
      reward: ["Save Gentle reactions. Your creature now responds to deliberate touch and fresh safety observations. The final show integrates its expression, smooth motion and priority stop behaviour.", "Keep the simultaneous-request-and-touch case because it makes interaction priority explicit."],
    },
    questions: {
      learn: { question: "What should happen when the supplied distance is five centimetres?", choices: ["Continue the show unchanged", "Speed up to move away blindly", "Disable the joint and hold its current pose"], correctChoice: 2, feedback: "The simulator's near-object rule stops motion before expression logic can issue another angle command." },
      predict: { question: "Touch stays held while an obstacle appears and clears; does clearing create a new touch?", choices: ["No, the touch state never made a new rising edge", "Yes, every clear reading is a touch", "Yes, stop erases all input history"], correctChoice: 0, feedback: "Maintained touch history distinguishes a continuing hold from a new intentional press after release." },
      explain: { question: "Which input wins when a new mood request and a touch edge arrive together?", choices: ["Both in an unspecified order", "The new explicit mood request", "Neither, and the joint must jump"], correctChoice: 1, feedback: "The documented priority applies the explicit selection once, avoiding two conflicting changes in one observation." },
    },
  },
  {
    title: "The creature show", concepts: ["Integration", "Interaction priority", "Regression evidence"],
    goals: ["Present a complete responsive creature with named expression and smooth bounded movement.", "Preserve stop, proximity, request identity and touch-edge rules throughout the show and restart."],
    extension: "Design a new expression sequence in a separate save. State its intended mood and replay the existing range, rate, stop and input-boundary checks before comparing it with the finished show.",
    activities: {
      learn: ["A finished creature combines understandable expression with a reliable controller. Keep one order: read fresh inputs, update time and touch history, apply safety guards, accept a new request or touch edge, choose a target and approach it. The sequence exercise can reuse the same movement helper.", "The same safety controller should support both a pose sequence and an interactive mood demonstration."],
      predict: ["Predict a show observation with a new happy request, a touch edge and stop true. Then release stop without releasing touch and consider a later genuine new request. Identify which state may update and which movement is forbidden.", "Stop prevents movement regardless of expression input. Updated history prevents an old held touch from replaying on recovery."],
      build: ["Combine the verified helpers into the interactive show, retaining a separately named sequence helper for replay. Keep control state explicit and use one bounded movement path. Restart with a fresh session at 90 degrees, disabled, calm and with fresh timing history.", "Do not let a new feature issue angle commands through another path that bypasses the shared checks."],
      run: ["Demonstrate each mood using keyboard and touch controls, then run the pose sequence exercise. Pause, stop, introduce a near reading, recover and restart. Compare status text, symbols, target and actual angle in reduced-motion mode.", "A complete demonstration should remain understandable without watching every movement."],
      assess: ["Assess the saved final project across target changes, short and delayed observations, duplicate requests, held touch, simultaneous inputs, proximity and stop. Check the earlier pose helper as well as the interactive controller.", "The capstone verifies the integrated rules, not merely whether the creature reaches one attractive final pose."],
      inspect: ["Locate the first incorrect command in a failing trace and identify which priority or bound allowed it. Separate target-selection errors from motion-rate errors and input-history errors before choosing a repair.", "A correct final angle can hide an unsafe intermediate jump; inspect the full commanded sequence."],
      fix: ["Repair the controller and rerun the focused failure plus earlier bounds, arrival, sequence and touch cases. Save and assess the exact new source before finishing, keeping a stable named version for later experiments.", "Do not hide an overspeed command by slowing only the animation. Repair the values the programme emits."],
      explain: ["Choose what makes the creature show predictable and describe how one extension could affect existing rules. Explain the distinction between this supplied-input simulator and an independently approved physical build.", "The project demonstrates programming evidence; it does not grant permission to connect or operate equipment."],
      reward: ["Save Creature show and complete the final assessment. You have built a responsive simulated character with reusable functions, smooth motion and explicit input priorities. Replay missions or experiment in another named save while retaining earned completion.", "Keep the tested version before extending the show. Existing guardian and hardware protections remain separate from completing the simulator."],
    },
    questions: {
      learn: { question: "Where should every angle command pass before reaching the simulated joint?", choices: ["Through the shared safety and bounded movement rules", "Through whichever mood branch runs last", "Directly from any unvalidated sensor string"], correctChoice: 0, feedback: "A single shared control path keeps new expressions from bypassing range, rate and stop requirements." },
      predict: { question: "A happy request and touch arrive while stop is true; may the joint move?", choices: ["Yes, because two inputs arrived", "No, stop retains priority over expression", "Only beyond the normal angle limits"], correctChoice: 1, feedback: "Expression inputs do not override the movement guard. The stopped controller holds its actual pose." },
      explain: { question: "What does passing the creature simulator's final checks establish?", choices: ["Automatic approval for any real servo build", "That future source changes need no checks", "Evidence that the documented simulated controller behaves correctly"], correctChoice: 2, feedback: "The assessment covers the supplied simulator scenarios; physical equipment and future changes require their own appropriate checks." },
    },
  },
]);
