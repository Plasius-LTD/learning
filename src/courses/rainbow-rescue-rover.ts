import { authorCourse } from "./course-authoring.js";

export const { course, practice } = authorCourse({
  slug: "rainbow-rescue-rover", title: "Rainbow Rescue Rover", category: "robot",
  summary: "Build a simulated rescue rover from supplied colour and position observations. Turn uncertain recognition into careful decisions, send commands with explicit identities and stop when observations or communication expire. Finish three target rescues with repeat-safe arrival evidence. No camera, serial port or physical rover is required.",
  projectFiles: [{ path: "robot.cpp", language: "cpp", maximumCharacters: 24000 }],
  starterProject: { files: [{ path: "robot.cpp", source: `bool armed = false;
bool wasEnabled = false;
int sequence = 0;
int lastSent = -100;
string lastCommand = "";
int lastFrameId = -1;
int arrivalCount = 0;
bool redRescued = false;
bool greenRescued = false;
bool blueRescued = false;

void setup() {
  sequence += 1;
  sendCommand("stop", sequence);
  lastCommand = "stop";
  setTargetLabel("unknown");
}

void loop() {
  setTargetLabel("unknown");
}
` }] },
  reference: [
    { name: "recognition", signature: 'textSensor("colour"); numberSensor("confidence"); textSensor("targetId");', description: "Supplied colours are red, green, blue or unknown. Accept only red, green or blue with confidence from 0.8 through 1 inclusive and matching target IDs red-beacon, green-beacon or blue-beacon. Confidence outside 0–1 is invalid. A valid but uncertain observation still cannot permit movement.", example: 'bool confident = numberSensor("confidence") >= 0.8 && numberSensor("confidence") <= 1;' },
    { name: "setTargetLabel", signature: "setTargetLabel(string colour)", description: "Display red, green, blue or unknown as both text and a visual marker. The label describes accepted recognition; it does not move the rover, rescue a target or grant permission.", example: 'setTargetLabel("unknown");' },
    { name: "position", signature: 'numberSensor("targetX"); numberSensor("distanceCm");', description: "targetX is normalised from -1 (left) to 1 (right), with centre at zero. Distance is 0–400 cm. Values outside either range stop the controller. Steer left below -0.2, right above 0.2, forward inside that band while farther than 15 cm, otherwise stop.", example: 'if (numberSensor("targetX") < -0.2) { return "left"; }' },
    { name: "sendCommand", signature: "sendCommand(string command, int sequence)", description: "Emit one simulated command frame with command stop, left, right or forward and a positive increasing sequence. The receiver maps forward to (20,20), left to (10,25), right to (25,10), stop to (0,0). Repeated identical frames are ignored; reuse of one sequence for different content is rejected. No real serial write occurs.", example: 'sequence += 1; sendCommand("stop", sequence);' },
    { name: "command timing", signature: "millis() - lastSent >= 100", description: "Emit movement frames no more often than once per 100 ms, including unchanged movement as a keepalive. A required stop bypasses that delay when the previous command was moving. While already stopped, do not emit repeated stop frames. A sent stop updates lastSent too; never reset sequence during an attempt or recovery.", example: 'if (lastCommand != "stop") { sequence += 1; sendCommand("stop", sequence); lastCommand = "stop"; lastSent = millis(); }' },
    { name: "fresh observations", signature: 'numberSensor("frameId"); numberSensor("frameAgeMs"); numberSensor("heartbeatAgeMs");', description: "frameId is a nonnegative integer that cannot decrease; repeated IDs are one observation. Frame age is valid from 0–250 ms; heartbeat age from 0–300 ms. Read every loop. Expiry or invalid input stops and disarms. The receiver independently zeros motors if no movement frame arrives for more than 250 ms.", example: 'bool fresh = numberSensor("frameAgeMs") <= 250 && numberSensor("heartbeatAgeMs") <= 300;' },
    { name: "permission", signature: 'boolSensor("enabled"); boolSensor("stop");', description: "Arm on a fresh false-to-true enable while all data is valid and the target is unrescued. Record that target ID. Loss of recognition, invalid or stale data, explicit stop, disable or target change stops and disarms. Clearing the cause while enable stays held does not restart. Update enable history while blocked.", example: 'bool enabled = boolSensor("enabled"); bool rising = enabled && !wasEnabled; wasEnabled = enabled;' },
    { name: "arrival", signature: "markRescued(string targetId)", description: "For the armed target, require two distinct increasing frames centred inside -0.2 through 0.2 and within 15 cm. A new non-arrival frame resets the count. Stop while in arrival range; after the second frame, mark that target once and disarm. Track the three fixed targets with separate booleans. All rescued remains stopped until simulator restart.", example: 'if (target == "red-beacon" && !redRescued) { markRescued(target); redRescued = true; }' },
  ],
}, [
  {
    title: "A colour with evidence", concepts: ["Classification", "Confidence", "Unknown state"],
    goals: ["Distinguish a recognised target from uncertain or malformed observations.", "Expose accepted colour as text without claiming to control a real camera."],
    extension: "Create a table of colour, confidence and target ID cases. Include an unfamiliar colour and a high-confidence colour paired with the wrong target ID.",
    activities: {
      learn: ["Recognition arrives as supplied observations. Accept red, green or blue only at confidence 0.8–1 with the matching red-beacon, green-beacon or blue-beacon ID. Anything uncertain or inconsistent displays unknown. A label alone never moves the rover.", "The simulator supplies observations; this lesson does not access a camera or collect pictures."],
      predict: ["Compare red at confidence 0.79, red at 0.8 and red at 1.2. Then pair confident red with green-beacon. Predict the displayed label in each case before running the project.", "High confidence cannot repair an invalid range or a contradictory target identity."],
      build: ["Write a string recognisedColour helper that validates colour, confidence and matching ID. Return unknown for unsupported or inconsistent input, then pass the result to setTargetLabel in loop. Keep motors stopped throughout this first mission.", "Name the accepted cases explicitly rather than treating every nonempty string as a colour."],
      run: ["Use the recognition controls to switch colours and cross the confidence threshold. Compare the visible marker with its text label, then try the mismatch cases from your prediction.", "Use the text label as equivalent evidence when distinguishing the displayed colours is difficult."],
      assess: ["Check all three accepted colours, unknown, the exact confidence boundary, values outside 0–1 and mismatched target IDs. Recognition must remain independent from movement and arrival output.", "A cheerful marker is not proof that the input was valid; the supplied observation and accepted label are checked together."],
      inspect: ["If unknown becomes a valid colour, inspect the allowlist. If confidence 1.2 is accepted, inspect both bounds. If a mismatched ID passes, inspect the relationship between the colour and the target name.", "Compare the actual input tuple with the accepted case rather than repairing only the visible label."],
      fix: ["Repair recognition and replay a valid red, green and blue observation plus the failing case. Preserve the safe unknown result and make sure no movement command was added to the classification helper.", "A useful classifier accepts the documented good cases while refusing the ambiguous ones."],
      explain: ["Choose why a confidence threshold is evidence rather than certainty. Explain why an explicit unknown result is useful to a controller that must sometimes decide not to move.", "The controller needs a safe meaning for uncertainty instead of silently choosing a favourite colour."],
      reward: ["Save Colour evidence. Your rover now reports what its supplied recognition data supports. Next you will use target position to choose a direction without mixing recognition and movement permission.", "Keep one colour/ID mismatch as a regression case for the final project."],
    },
    questions: {
      learn: { question: "Which observation supports a red target label?", choices: ["Red, confidence 0.8, target red-beacon", "Red, confidence 1.2, target red-beacon", "Red, confidence 0.9, target blue-beacon"], correctChoice: 0, feedback: "The accepted observation meets the confidence range and has a target identity matching its colour." },
      predict: { question: "What label should red at confidence 0.79 produce?", choices: ["Green", "Unknown", "Red with movement permission"], correctChoice: 1, feedback: "0.79 is below the acceptance threshold, so the observation remains uncertain and must display unknown." },
      explain: { question: "Why keep an explicit unknown recognition result?", choices: ["To hide every sensor value", "To grant permission from any colour", "To represent uncertainty without inventing a confident target"], correctChoice: 2, feedback: "An unknown result lets later control logic refuse action when the available recognition evidence is insufficient." },
    },
  },
  {
    title: "Where is the target?", concepts: ["Normalised coordinates", "Deadband", "Decision functions"],
    goals: ["Map recognised target position to a documented steering decision.", "Use a centre band and an arrival distance while validating coordinate ranges."],
    extension: "Plot targetX values -1, -0.2, 0, 0.2 and 1 on a line. Add distance values 14, 15 and 16 to show when centre alignment requests forward versus stop.",
    activities: {
      learn: ["targetX spans -1 to 1. Below -0.2 choose left, above 0.2 choose right. Inside the inclusive centre band, choose forward only when distance exceeds 15 cm; otherwise stop. Invalid coordinates, distance outside 0–400 or unknown recognition always choose stop.", "The centre band avoids steering back and forth for tiny position changes near zero."],
      predict: ["Predict direction at x=-0.2 and distance=16, then x=0.21 and distance=15. Finally try x=2 with an apparently confident target. State which condition determines each result.", "Steering aligns an off-centre target first; arrival requires both centre alignment and sufficient proximity."],
      build: ["Create a string directionForTarget helper that returns stop, left, right or forward. Validate observations before coordinate decisions and reuse recognisedColour. Keep this helper free of commands so it can be tested independently.", "Return decisions as data; a later permission and timing layer will decide whether a command may be sent."],
      run: ["Move the supplied target left, centre and right using onscreen controls and keyboard controls. Cross each band boundary and compare the predicted direction text. Try a near but off-centre target.", "The numeric coordinate and direction label describe the same decision as the target marker."],
      assess: ["Check both inclusive centre boundaries, near distance, off-centre priority, invalid coordinates and unknown recognition. Confirm no direct command or rescue output occurs just from calling the decision helper.", "Separating decisions from effects makes edge cases easier to inspect and reuse."],
      inspect: ["If an edge value turns unexpectedly, inspect strict versus inclusive comparisons. If a near off-centre target is treated as arrived, inspect the order of alignment and distance. If invalid x moves, inspect range validation first.", "Use exact supplied values when investigating a boundary rather than the approximate visual position."],
      fix: ["Repair the helper and repeat left, right, centred-far and centred-near cases. Recheck invalid recognition so a direction calculation cannot accidentally override unknown evidence.", "Do not widen the accepted input range just to make an invalid test look like a valid target."],
      explain: ["Choose why the centre band helps stable steering. Explain how a pure direction helper can serve both a preview label and a later command sender without duplicating the decision rules.", "The same rule can be observed before it is permitted to cause movement."],
      reward: ["Save Target direction. You can now turn valid observations into a clear decision. Next you will send that decision through command frames with identities and a bounded sending rate.", "Keep exact centre boundaries in your regression examples."],
    },
    questions: {
      learn: { question: "What is the valid normalised horizontal target range?", choices: ["Any positive number", "-1 through 1", "Only zero"], correctChoice: 1, feedback: "Normalised targetX uses -1 for the left edge and 1 for the right edge, with zero at the centre." },
      predict: { question: "At x=-0.2 and distance=16 cm with valid recognition, which decision is selected?", choices: ["Left", "Stop", "Forward"], correctChoice: 2, feedback: "-0.2 is inside the inclusive centre band, and 16 cm is farther than the 15 cm arrival distance." },
      explain: { question: "Why return a direction before sending a command?", choices: ["So permission and timing can be applied separately to the same decision", "So validation becomes unnecessary", "So every recognised target moves immediately"], correctChoice: 0, feedback: "A decision helper can be inspected independently, while another layer controls whether and when its result may cause movement." },
    },
  },
  {
    title: "A command with an identity", concepts: ["Protocol", "Sequence numbers", "Rate limits"],
    goals: ["Send bounded simulated command frames with increasing sequence numbers.", "Give stop priority over ordinary sending intervals without flooding repeated stops."],
    extension: "Write a receiver trace containing a new command, an exact duplicate and conflicting content with the same sequence. Explain the different outcomes without accessing a real serial port.",
    activities: {
      learn: ["sendCommand accepts stop, left, right or forward plus a positive increasing sequence. Movement frames are at least 100 ms apart, even when direction changes. Send unchanged movement as keepalive at that interval. A needed stop bypasses the interval, while already-stopped observations emit no repeated stop.", "The simulated receiver ignores exact duplicate frames and rejects conflicting reuse. New commands need new identities."],
      predict: ["Send forward at 1000 ms, request left at 1050 and press stop at 1060. Predict which frames are emitted. After that stop, choose the earliest time an ordinary movement frame could be sent.", "A sent stop updates lastSent too. Priority changes whether stop must wait, not whether elapsed time is remembered."],
      build: ["Add one command helper that increments sequence only when sending, records lastCommand and lastSent, and enforces the movement interval. Call stop immediately on disable or explicit stop. Use a fresh safe enable edge to arm, recording the current target identity.", "Keep sequence across recovery; resetting it to one while the receiver remembers older frames creates duplicate identities."],
      run: ["Observe the frame list while holding a steady target, changing direction quickly and pressing stop between send times. Replay an exact frame using the simulator's receiver test and compare it with a conflicting duplicate.", "Commands are simulated protocol data. This course does not open a serial port or send messages to physical hardware."],
      assess: ["Check increasing identities, the 100 ms boundary, keepalives, stop priority, repeated-stop suppression and no movement while disarmed. A rapid direction change must not bypass the ordinary rate limit.", "One sending path should own sequence and timing so different branches cannot reuse an identity accidentally."],
      inspect: ["If a command disappears, inspect its sequence relative to earlier frames. If movement floods, inspect lastSent updates. If stop waits, inspect whether it incorrectly shares the ordinary delay guard.", "Compare requested direction with emitted frames; not every new request should produce an immediate transmission."],
      fix: ["Repair command ownership and replay movement, quick changes, stop and deliberate restart. Check that ordinary timing resumes from the last actual send and sequence continues increasing.", "Do not repair duplicates by clearing receiver history; preserve the protocol and correct the sender."],
      explain: ["Choose what a sequence number establishes and what it does not. Explain why an exact duplicate can be ignored safely while different content under the same identity indicates an invalid command stream.", "An identity enables repeat handling; it does not prove that a requested movement is safe."],
      reward: ["Save Identified commands. Your direction decisions now travel through a predictable simulated protocol. Next you will make communication loss stop the rover even when its last command requested motion.", "Keep the between-interval stop case for the connection-loss mission."],
    },
    questions: {
      learn: { question: "Which sender state should persist across a deliberate recovery?", choices: ["A permanently armed flag", "An old nonzero motor command", "The increasing command sequence"], correctChoice: 2, feedback: "Keeping sequence monotonic prevents new recovery commands from colliding with identities already seen by the receiver." },
      predict: { question: "Forward was sent at 1000 ms and stop is requested at 1060; when should stop be sent?", choices: ["At 1060 ms immediately", "Only after 1100 ms", "After another movement frame"], correctChoice: 0, feedback: "Stop bypasses the ordinary movement interval when the previous command was moving, so it is sent immediately." },
      explain: { question: "Why reject different commands using one sequence number?", choices: ["Because commands cannot contain text", "Because one identity must not describe conflicting effects", "Because stop is never allowed"], correctChoice: 1, feedback: "Repeat-safe processing requires one identity to have one meaning; conflicting content cannot be treated as a harmless duplicate." },
    },
  },
  {
    title: "Keep the connection alive", concepts: ["Heartbeat", "Freshness", "Independent watchdog"],
    goals: ["Stop and disarm when observations or heartbeat information expire.", "Recognise the receiver watchdog as a separate last line of simulated protection."],
    extension: "Construct a timeline with a fresh camera frame but an expired heartbeat, then reverse the situation. Explain why checking only one age is insufficient.",
    activities: {
      learn: ["Validate frame age at 0–250 ms and heartbeat age at 0–300 ms every loop. Frame IDs are nonnegative integers that may repeat but cannot decrease. Expiry, invalid input or lost recognition stops and disarms. Separately, the receiver zeros motors after more than 250 ms without a movement frame.", "The receiver watchdog protects a stopped sender, but it does not excuse the programme from promptly issuing a stop when it detects a fault."],
      predict: ["Keep frame age at 10 ms while heartbeat age crosses 300 to 301 ms. Then keep heartbeat fresh while frame age crosses 250 to 251. Predict both outputs and the permission needed after fresh data returns.", "Different data streams have different freshness limits; a good value from one cannot replace evidence from the other."],
      build: ["Create a shared validity guard before arming or movement. On failed age, identity, range or recognition checks, stop and disarm, clear arrival evidence and update enable history. Require release and a new safe enable after the cause clears.", "Read fresh observations on every loop instead of retaining the first good heartbeat forever."],
      run: ["Freeze frames during travel, expire the heartbeat during steering and pause the command stream to inspect receiver expiry. Compare the programme's immediate stop with the independent receiver timeout.", "The simulator makes each timeline visible without making any claim about a real wireless or serial connection."],
      assess: ["Check exact age boundaries, negative values, decreasing or malformed frame IDs, stale input, lost recognition and held enable after recovery. Programme execution or malformed input failure must stop virtual outputs too.", "Freshness, identity and recognition must all hold; passing one check cannot bypass the others."],
      inspect: ["If stale data keeps motion alive, inspect guard placement before sending. If a recovered heartbeat restarts automatically, inspect armed state and enable history. If the receiver never expires, inspect the independent time since its last movement frame.", "A continuous animation is not evidence that the observation stream or command stream is healthy."],
      fix: ["Repair the relevant guard and replay expiry, continued held enable, fresh input, release and re-enable. Check ordinary keepalive delivery so correctly functioning communication remains usable.", "Do not enlarge a timeout to hide missed keepalives; fix the sending schedule or the elapsed-time calculation."],
      explain: ["Choose why the receiver needs an independent watchdog. Explain why command delivery, fresh observations and explicit permission are three separate conditions for continued movement.", "No single heartbeat or status icon proves that every part of the controller is working correctly."],
      reward: ["Save Observable connection. Your rover now has clear behaviour when data or commands stop arriving. Next you will make target arrival a once-only, evidence-based event.", "Keep both frame expiry and heartbeat expiry cases for the final integrated check."],
    },
    questions: {
      learn: { question: "What does the receiver do after more than 250 ms without a movement frame?", choices: ["Repeat the last movement forever", "Zero its simulated motor outputs", "Mark every target rescued"], correctChoice: 1, feedback: "The independent receiver watchdog stops virtual motors when its movement command stream is no longer current." },
      predict: { question: "Frame age is 10 ms but heartbeat age is 301 ms; what is required?", choices: ["Continue because one stream is fresh", "Turn toward a new target", "Stop and disarm"], correctChoice: 2, feedback: "Heartbeat age exceeds its own 300 ms limit, and a fresh frame cannot compensate for that expired stream." },
      explain: { question: "Why is the receiver watchdog separate from the sender's checks?", choices: ["It can stop motors even when the sender no longer produces commands", "It makes sensor validation unnecessary", "It grants automatic permission after a fault"], correctChoice: 0, feedback: "An independent expiry rule remains effective when the sender itself stops running or its command stream disappears." },
    },
  },
  {
    title: "Arrive once, stop clearly", concepts: ["Evidence across frames", "Deduplication", "Target ownership"],
    goals: ["Confirm arrival with two distinct aligned near frames for the armed target.", "Record each of three fixed targets once and stop between rescue attempts."],
    extension: "Create a trace with an arrival frame, a duplicate and a new off-centre frame. Compare it with two distinct valid arrival frames and explain the count reset.",
    activities: {
      learn: ["Arrival needs the armed target, valid recognition, x inside -0.2 through 0.2 and distance≤15 cm on two distinct increasing frames. Stop while in this arrival range. A new non-arrival frame resets the count. After the second arrival frame, markRescued once and disarm.", "Use redRescued, greenRescued and blueRescued for the fixed three targets; duplicate observations cannot earn another rescue."],
      predict: ["Observe red-beacon centred at 14 cm on frame 12, repeat frame 12, then observe frame 13 in the same position. Predict arrivalCount, movement and markRescued calls. Then keep observing the already rescued target.", "A repeated frame is not a second confirmation, and a rescued target cannot be armed for another award."],
      build: ["Track the target captured when arming and reject a change during that attempt. Count only distinct valid arrival frames for it. Set its rescued boolean when reporting the rescue, clear permission and stop; all three rescued leaves the rover stopped until simulator restart.", "Do not reset target booleans or command sequence when beginning the next attempt."],
      run: ["Rescue red, release enable, select green and enable for a new attempt, then repeat for blue. Try duplicate frames, an off-centre near target and a target change during travel. Inspect rescue records and stopped reasons.", "Arrival is both a visible destination and an explicit event with a target identity."],
      assess: ["Check two distinct confirmations, duplicate handling, evidence reset, changed target, once-only records, stop on arrival and the all-rescued state. A rescue event cannot be emitted from uncertain or stale evidence.", "The course assessment is separate from these simulated rescue events and still evaluates the saved current source."],
      inspect: ["If one frame rescues a target, inspect novelty before incrementing. If switching targets combines evidence, inspect armed target ownership. If a target rescues twice, inspect when its boolean is stored relative to the event.", "Trace frame ID, active target, arrival count and rescued flag together to find the first inconsistent step."],
      fix: ["Repair arrival and replay a duplicate, a broken confirmation sequence and a successful two-frame arrival. Complete all three targets again and check that a still-held enable never begins another attempt.", "Preserve already recorded rescues during interruption; only simulator restart creates a fresh rescue session."],
      explain: ["Choose why arrival requires target identity as well as distance. Explain how a once-only record prevents repeated observations from turning one real simulated event into several awards.", "Repeated delivery of evidence is different from another distinct rescue happening."],
      reward: ["Save Confirmed arrivals. Your rover can complete three separate rescue attempts with understandable endings. The final mission combines recognition, direction, command timing and communication recovery into one project.", "Keep a duplicate arrival trace and a target-switch trace for regression checks."],
    },
    questions: {
      learn: { question: "Which evidence can confirm one target's arrival?", choices: ["One near frame repeated twice", "Two frames for different targets", "Two distinct valid centred near frames for the armed target"], correctChoice: 2, feedback: "Arrival needs new evidence for one consistent target, with recognition, alignment and distance all valid." },
      predict: { question: "Frame 12 is repeated at the same valid arrival position; how many confirmations does it provide?", choices: ["One", "Two", "Three"], correctChoice: 0, feedback: "Both deliveries describe the same frame, so only the first contributes a distinct arrival confirmation." },
      explain: { question: "Why retain a rescued boolean for each fixed target?", choices: ["To avoid stopping on arrival", "To prevent duplicate observations from recording the same rescue again", "To ignore target identity"], correctChoice: 1, feedback: "A persistent once-only record distinguishes a newly completed target from repeated evidence about one already rescued." },
    },
  },
  {
    title: "The rainbow rescue", concepts: ["Integration", "Protocol evidence", "Accessible feedback"],
    goals: ["Complete a three-target simulated rescue using the saved learner programme.", "Explain decisions and interruptions from recognition, commands and arrival evidence."],
    extension: "Design another target layout in a separate experiment. Keep the three documented IDs and replay uncertainty, communication loss and repeated arrival before comparing the route.",
    activities: {
      learn: ["The full controller validates observations, records enable history, handles stop and target guards, recognises a fresh safe start, selects direction, updates distinct arrival evidence and sends bounded command frames. Every decision must preserve once-only rescues and increasing command identity.", "Recognition, permission, command delivery and rescue evidence are related but remain separate responsibilities."],
      predict: ["Predict a second arrival frame that coincides with heartbeat expiry and a held enable. Then consider a new target appearing during active travel. Identify which condition prevents an otherwise plausible rescue or movement command.", "Freshness and target ownership are checked before interpreting the frame as valid arrival evidence."],
      build: ["Combine the verified helpers with one clear control order. Keep stop immediate, frame sending bounded and recovery deliberate. Preserve rescued targets across attempts, and show unknown recognition without inventing a replacement target.", "Use one sender for every movement and stop frame so timing and sequence ownership cannot drift between branches."],
      run: ["Complete red, green and blue rescue attempts using keyboard and onscreen controls. Interrupt recognition and communication, then recover deliberately. Compare labels, command history and arrival records in reduced-motion mode.", "The same result must be understandable through text and numeric evidence without depending on colour or animation."],
      assess: ["Run final saved-source scenarios for valid rescues, uncertain colours, coordinate boundaries, rapid steering, duplicate frames, expired heartbeat, receiver timeout, target switches and completed-session restart.", "A single successful route is only one part of the evidence; the final project must also stop and recover correctly."],
      inspect: ["Find the earliest wrong result and identify whether it came from recognition, permission, direction, command identity, freshness or arrival. Compare the decision request with the frame actually emitted before editing.", "A final stopped rover can hide a wrong command or duplicate rescue earlier in the trace."],
      fix: ["Repair the responsible helper and rerun its focused case plus the full three-target journey. Save and assess the current source, then keep a named final version before experimenting with different layouts.", "A new edit needs new assessment evidence; the result for older source cannot establish that the current programme behaves correctly."],
      explain: ["Choose what this completed simulation demonstrates and describe a limitation of supplied recognition data. Explain why it does not establish camera accuracy or grant permission for real serial hardware.", "Free account-bound learning, saved completion and separate guardian or hardware protections retain their own roles."],
      reward: ["Save Rainbow rescue and finish the final assessment. You have connected cautious recognition to an observable command protocol and repeat-safe arrivals. Replay a mission or explore another layout while retaining your earned completion and tested project.", "Keep evidence of an interrupted journey alongside the successful rescue; both explain the controller you built."],
    },
    questions: {
      learn: { question: "Why should every emitted command use the same sender helper?", choices: ["To give timing and sequence identity one consistent owner", "To bypass stop from some branches", "To make every frame immediately move"], correctChoice: 0, feedback: "One sending path keeps the protocol's timing, stop priority and identity rules consistent across all control decisions." },
      predict: { question: "Heartbeat expires on a possible second arrival frame; what result is correct?", choices: ["Record the rescue before looking at freshness", "Stop and disarm without awarding that arrival", "Send a faster forward command"], correctChoice: 1, feedback: "Expired communication fails the shared validity guard, so that frame cannot supply accepted arrival evidence." },
      explain: { question: "What does the completed course's assessment establish?", choices: ["Guaranteed recognition from a real camera", "Permission to control any physical rover", "Evidence for the saved programme and supplied simulated scenarios"], correctChoice: 2, feedback: "The assessment exercises the documented simulated inputs and programme; real equipment and recognition accuracy require separate verification." },
    },
  },
]);
