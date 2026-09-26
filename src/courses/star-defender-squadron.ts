import { authorCourse } from "./course-authoring.js";

export const { course, practice } = authorCourse({
  slug: "star-defender-squadron", title: "Star Defender Squadron", category: "game",
  summary: "Create an arcade defence game with a controllable ship, moving formations, projectiles and shields. Learn how object identity, collision order and cooldowns make a crowded scene behave fairly. Finish three repeatable waves with explicit victory, defeat and restart rules.",
  projectFiles: [{ path: "game.js", language: "javascript", maximumCharacters: 32000 }],
  starterProject: { files: [{ path: "game.js", source: `function initialState() {
  return {
    ship: { x: 240, y: 330, radius: 12 }, direction: 0,
    enemies: [], bullets: [], seenEnemyIds: [], seenShotIds: [],
    lives: 3, score: 0, elapsed: 0, wave: 1, nextId: 1,
    fireCooldown: 0, invulnerability: 0, shieldTime: 0, shieldCooldown: 0,
    status: "ready"
  };
}

function update(state, input) {
  return state;
}
` }] },
  reference: [
    { name: "update", signature: "update(state, input) -> state", description: "Handle start, move, fire, shield, tick and restart. Move supplies direction -1, 0 or 1; tick supplies dt=0.02 simulated seconds. The world measures 480 by 360 logical pixels.", example: 'if (input.action === "restart") return initialState();' },
    { name: "ship", signature: "{ x, y: 330, radius: 12 }", description: "Move horizontally at 180 pixels per second while playing. Clamp its centre between radius and world width minus radius, so the complete ship remains inside the world.", example: "state.ship.x = Math.max(12, Math.min(468, state.ship.x + state.direction * 180 * input.dt));" },
    { name: "input.spawns", signature: "Array<{ id, x, y, vx, vy, radius, health }>", description: "The host supplies up to 24 unique enemies per wave, at most four per tick. Record seen ids until the wave changes, including destroyed enemies. Move by supplied velocity, reverse horizontal velocity on edge contact and keep each enemy's identity.", example: "enemy.x += enemy.vx * input.dt; enemy.y += enemy.vy * input.dt;" },
    { name: "bullets", signature: 'Array<{ id, x, y, radius, side: "player" | "enemy" }>', description: "Player bullets have radius 3 and move up at 260 pixels per second; hostile bullets have radius 4 and move down at 120. Remove offscreen bullets. A bullet can apply at most one hit, with touching circles counted as collision.", example: "const hit = Math.hypot(a.x - b.x, a.y - b.y) <= a.radius + b.radius;" },
    { name: "input.enemyShots", signature: "Array<{ id, x, y }>", description: "Seeded hostile shots arrive through ticks, at most four per tick and 64 per wave. Deduplicate using seenShotIds before adding enemy bullets. Clear seen ids only when the supplied wave advances.", example: 'state.bullets.push({ ...shot, radius: 4, side: "enemy" });' },
    { name: "fireCooldown", signature: "seconds until another shot", description: "Fire creates one player bullet only if playing and the cooldown is zero, then sets it to 0.25 seconds. Playing ticks decrease it to a minimum of zero. Repeated fire inputs cannot bypass the wait.", example: "state.fireCooldown = Math.max(0, state.fireCooldown - input.dt);" },
    { name: "protection", signature: "invulnerability, shieldTime, shieldCooldown", description: "Damage costs one life and gives one second of invulnerability. Shield activation lasts two seconds and starts a six-second cooldown. Protected contacts still remove incoming threats but do not cost lives. All timers decrease only on playing ticks.", example: "const protectedNow = state.invulnerability > 0 || state.shieldTime > 0;" },
    { name: "waveComplete", signature: "input.wave, input.waveComplete", description: "Each tick declares the current wave and whether its last arrivals have been supplied. Enemy contact with the ship or crossing the bottom line removes that enemy and attempts damage. Lose at zero lives; win after completed wave three with no enemies or hostile bullets.", example: 'const dangerRemains = state.enemies.length > 0 || state.bullets.some(b => b.side === "enemy");' },
  ],
}, [
  {
    title: "A ship under control", concepts: ["Continuous input", "Bounds", "Simulated time"],
    goals: ["Move the entire ship inside the playfield at a consistent speed.", "Stop on release, preserve ready state and create a clean restart."],
    extension: "Compare two ship speeds using the same simulated travel time. Explain how speed affects control without changing the boundary rule.",
    activities: {
      learn: ["A movement event sets direction, while a tick applies movement. Use -1 for left, 0 for release and 1 for right. Multiply 180 pixels per second by dt, then clamp the centre so the ship's radius also fits inside the 480-pixel world.", "Input and time are separate: pressing right does not itself advance the simulation."],
      predict: ["From x=240, predict a rightward move over a 0.02-second tick. Then start at x=467 and apply the same step. Decide whether the ship's centre may reach the world edge at x=480.", "The full ship must fit, so its largest permitted centre coordinate is 480 minus radius 12."],
      build: ["Handle start, move and restart. Store only directions -1, 0 or 1. During playing ticks update ship.x and elapsed; clamp x between 12 and 468. Leave ready and terminal states still.", "A release event must set direction to zero, including when a pointer leaves an onscreen control."],
      run: ["Move left and right with keyboard and onscreen controls, release at mid-screen, then hold against each edge. Pause and step to compare the displayed coordinates with the movement calculation.", "Use the coordinate text to see a boundary accurately without judging a small visual gap."],
      assess: ["Check one-tick movement, release, both edge clamps, invalid directions and a fresh restart. Movement must depend on simulated seconds rather than how often the screen redraws.", "A clamp applied before movement still permits the final step to leave the world; inspect the order."],
      inspect: ["If the ship drifts after release, inspect direction updates. If it clips the edge, include radius in the bounds. If it moves too fast, check the dt multiplication rather than slowing the display.", "Separate the requested direction, proposed x and clamped x in your reasoning."],
      fix: ["Repair the input or position rule and rerun both ordinary movement and edge holds. Restart after moving to verify that direction returns to zero and no old input carries into the next attempt.", "A correct boundary fix must still allow movement away from the edge."],
      explain: ["Choose why movement should occur on ticks rather than directly inside a key event. Explain how separating state from drawing makes stepping and pausing predictable.", "The same direction can remain held across many ticks without generating more input events."],
      reward: ["Save Controlled ship. You have responsive input and bounded movement. Next you will add a formation whose members keep stable identities while moving and disappearing.", "Retain a release-and-restart case for later regression testing."],
    },
    questions: {
      learn: { question: "Which direction value should a released movement control set?", choices: ["Zero", "One", "The previous nonzero direction forever"], correctChoice: 0, feedback: "Zero means no horizontal movement on subsequent ticks, so release stops the ship." },
      predict: { question: "A right step from x=467 proposes x=470.6; where should the centre finish?", choices: ["480", "468", "470.6"], correctChoice: 1, feedback: "The right boundary for the centre is 480 minus the ship's 12-pixel radius, giving 468." },
      explain: { question: "Why use ticks to apply movement rather than the number of key events?", choices: ["To ignore release events", "To prevent pausing", "To tie displacement to simulated time"], correctChoice: 2, feedback: "Input event frequency varies; simulated seconds provide a consistent basis for movement." },
    },
  },
  {
    title: "A formation with identity", concepts: ["Collections", "Stable identifiers", "Boundary reflection"],
    goals: ["Insert each supplied enemy once and update its own motion and health.", "Reflect horizontal movement at world edges while preserving enemy identity."],
    extension: "Compare a formation with alternating horizontal velocities to one moving together. Keep the same enemy count and vertical speed to isolate the pattern.",
    activities: {
      learn: ["Each enemy carries its id, position, velocity, radius and health. Copy new arrivals from input.spawns once and remember seenEnemyIds for the whole wave. A destroyed enemy must not return if its arrival message repeats later.", "Array indices can change after removal. Ids attach history and damage to the correct enemy."],
      predict: ["An enemy is removed, then another tick repeats its id. Predict whether it should reappear. Separately, an enemy reaches the right boundary with positive vx: predict the new sign and the permitted centre position.", "Seen ids include past arrivals, not just currently living enemies. Reflection changes direction without creating a new identity."],
      build: ["Deduplicate spawns using seenEnemyIds, copy accepted enemies and update their positions with dt. Clamp horizontal edge contact using radius and reverse vx. Keep health and ids unchanged during movement; reset seen ids only when the wave advances.", "Do not filter seen ids when enemies are destroyed. Their arrival has still been processed."],
      run: ["Step a formation toward an edge, inspect its reflected direction and follow one id across several ticks. Compare a repeated arrival before and after removal to verify that it does not create another enemy.", "The enemy list helps track one moving object when several share the same appearance."],
      assess: ["Check independent movement, reflection at both edges, health preservation and duplicate arrivals. Cases include a repeated id after destruction, which an active-array-only duplicate check would miss.", "The test asks whether the arrival was ever accepted in this wave, not whether the object is currently visible."],
      inspect: ["If a destroyed enemy returns, inspect the seen-id lifecycle. If reflected motion sticks to the wall, inspect whether vx is reversed repeatedly without moving away. If damage moves to another enemy, inspect index-based identity.", "Clamp at the boundary and point velocity inward; the next tick should move back into the world."],
      fix: ["Repair the formation update and rerun a full out-and-back movement. Preserve unique ids and health through array cleanup, then repeat the prior ship-control cases to catch unrelated state changes.", "Changing an enemy's position should never change the player's direction or reset the wave."],
      explain: ["Choose why a separate seen-id collection is useful even after an enemy disappears. Explain how object identity differs from its current array position.", "Removal ends the enemy's active life; it does not make its earlier arrival a new event."],
      reward: ["Save Living formation. Your scene now manages independent moving objects without resurrecting duplicates. Next the ship's projectiles will interact with those objects and apply damage once.", "Keep an edge-reflection example for collision testing near the sides of the world."],
    },
    questions: {
      learn: { question: "What should tie health and event history to a moving enemy?", choices: ["Its array index only", "Its stable id", "Its current x coordinate"], correctChoice: 1, feedback: "An id remains the same while positions and array indices change, keeping history attached to the right object." },
      predict: { question: "A destroyed enemy's id is repeated later in the same wave; what should happen?", choices: ["Create a fresh copy with full health", "Award another score immediately", "Ignore the already processed arrival"], correctChoice: 2, feedback: "The seen-id record persists through destruction, preventing duplicate messages from reviving an enemy." },
      explain: { question: "Why should reflection preserve the enemy's id?", choices: ["Changing direction is still the same object's movement", "Reflection creates another wave", "Every frame needs a new identity"], correctChoice: 0, feedback: "Reflection changes velocity and position, not which enemy is being simulated or how much health it has." },
    },
  },
  {
    title: "One shot, one hit", concepts: ["Cooldown", "Collision ownership", "Removal order"],
    goals: ["Create rate-limited shots that travel and leave the world cleanly.", "Consume each shot on its first hit and score each enemy destruction once."],
    extension: "Compare two fire cooldown values with the same enemy wave. Observe how projectile count and difficulty change without altering collision rules.",
    activities: {
      learn: ["A fire event creates a player bullet only when fireCooldown is zero, then starts a 0.25-second wait. Ticks reduce that timer. Bullets move upward and collide using both radii. Consume a bullet after its first enemy hit so it cannot damage several overlapping enemies.", "One projectile owns at most one hit. Enemy health can require several separate projectiles, but one destruction scores only once."],
      predict: ["Two fire events arrive without a tick between them. Predict the number of bullets. Then consider one bullet overlapping two enemies in array order: decide whether both should lose health.", "The first accepted fire sets the cooldown immediately. Resolve a bullet against the first still-living target it hits, then mark it consumed."],
      build: ["Add fire handling, unique local bullet ids and cooldown countdown. Move player bullets upward at 260 pixels per second and hostile bullets downward at 120. Filter offscreen bullets. Resolve player hits in stable enemy order, decrement health and award one point when health reaches zero.", "Collect removals or build new arrays instead of splicing forward through the array you are iterating."],
      run: ["Fire rapidly, pause between cooldown ticks and inspect the bullet count. Step through a multi-health enemy and an overlapping pair. Confirm a shot disappears on contact and a destroyed enemy stops receiving later hits.", "A bullet that remains after collision can apply damage repeatedly while its circle overlaps the target."],
      assess: ["Check fire timing, both bullet directions, offscreen cleanup, radius contact and overlapping targets. Tests include two bullets reaching a one-health enemy in one tick; its destruction must award only one point.", "Keep collision order explicit so simultaneous events are reproducible instead of depending on accidental array mutation."],
      inspect: ["If enemies vanish too quickly, trace each bullet id and the number of hits it applies. If score doubles, inspect whether already destroyed targets remain eligible. If rapid fire bypasses the wait, inspect when cooldown is set.", "A set of consumed ids can make event ownership clear while you build the next collections."],
      fix: ["Repair projectile ownership or timer handling and rerun overlapping-target and repeated-fire cases. Check that healthy enemies retain the correct remaining health and that bullet cleanup cannot remove unrelated projectiles.", "Do not solve double hits by disabling all collisions. Keep the single valid hit and reject only later reuse."],
      explain: ["Choose why stable event order and one-hit consumption matter in a crowded scene. Explain why decrementing health and awarding destruction score are separate decisions.", "A hit can damage without destroying, while a destruction can happen only once for that enemy."],
      reward: ["Save Reliable fire. The ship now interacts with formations through bounded projectiles and fair scoring. Next you will protect the player with lives, a damage grace period and a limited shield.", "Keep the simultaneous-hit examples to check any future weapon experiments."],
    },
    questions: {
      learn: { question: "What should happen immediately after a valid fire event creates a bullet?", choices: ["Create unlimited extra bullets", "Reset all enemy health", "Set the fire cooldown"], correctChoice: 2, feedback: "Starting the cooldown immediately prevents another event in the same instant from bypassing the firing interval." },
      predict: { question: "One bullet overlaps two enemies; how many targets may that bullet damage?", choices: ["One", "Both every frame", "Every enemy in the wave"], correctChoice: 0, feedback: "The first hit consumes the projectile. It cannot be reused against a second target." },
      explain: { question: "Why is a hit different from a scored destruction?", choices: ["Hits never change health", "A multi-health enemy can survive hits but can be destroyed only once", "Every hit must award ten points"], correctChoice: 1, feedback: "Damage reduces health; score is awarded on the single transition from living to destroyed." },
    },
  },
  {
    title: "A second chance", concepts: ["Invulnerability", "Timer boundaries", "Damage aggregation"],
    goals: ["Apply one life loss with a one-second grace period after damage.", "Activate a timed shield with a separate recharge delay and consume contacting threats safely."],
    extension: "Try a longer grace period in another save and explain its effect on fairness. Keep the shield recharge rule unchanged to compare one parameter at a time.",
    activities: {
      learn: ["Damage costs one life and starts one second of invulnerability. During that grace period or an active shield, contacting threats are removed without more life loss. Shield activation lasts two seconds and starts a six-second recharge timer; those are different clocks.", "Resolve damage events in order and set invulnerability immediately after the first accepted hit, protecting against later contacts in the same tick."],
      predict: ["Two hostile bullets touch an unprotected ship during one tick. Predict lives lost and which bullets remain. Then activate a shield and compare when protection ends with when another activation becomes available.", "The first damage starts the grace period for the second contact. Shield duration is shorter than shield cooldown."],
      build: ["Accept unique input.enemyShots using seenShotIds. Add hostile bullet and enemy contact damage, including enemies crossing the bottom line. Remove each contacting threat, apply damage only when unprotected and clamp lives at zero. Add shield activation and decrement all protection timers with dt.", "Keep a protected ship's threat removal separate from life loss. Otherwise absorbed bullets can linger until protection expires."],
      run: ["Step into one hostile contact, then another within the grace period. Activate a shield, watch it expire and try to activate it during recharge. Use the timer text and life count rather than colour alone.", "Pause freezes all these timers because they represent game time, not real-world waiting."],
      assess: ["Check simultaneous contacts, exact timer expiry, protected absorption, cooldown rejection and damage after protection ends. A zero-life ship must enter over and stop responding to play actions.", "Tests also check that protection does not become permanent because a timer is reset on every tick."],
      inspect: ["If one crowded tick removes several lives, inspect when invulnerability is assigned. If absorbed bullets later cause damage, inspect removal. If shields can reactivate immediately, distinguish remaining duration from remaining recharge.", "List shieldTime, shieldCooldown and invulnerability separately; they answer three different questions."],
      fix: ["Repair the damage or timer rule, then repeat both protected and unprotected contact. Preserve hostile-shot deduplication and verify that a restart restores three lives with every timer at zero.", "Recheck a legitimate hit after timers expire so the fix cannot accidentally make the ship invincible."],
      explain: ["Choose why a grace period improves fairness without making collision detection unnecessary. Explain why an absorbed threat must still complete its lifecycle.", "Protection changes the consequence of contact; it does not mean the contact never occurred."],
      reward: ["Save Second chance. Your game now gives the player clear, limited protection and stable damage rules. Next you will combine the mechanics into waves with honest completion conditions.", "Keep a two-contact scenario as evidence when adjusting any protection timings."],
    },
    questions: {
      learn: { question: "What is the purpose of invulnerability after an accepted hit?", choices: ["Prevent immediate repeated life loss during a short grace period", "Skip all future tests", "Keep bullets forever inside the ship"], correctChoice: 0, feedback: "A short grace period prevents one cluster of contacts from removing every life before the player can react." },
      predict: { question: "Two bullets contact an initially unprotected ship in one tick; what is the life loss?", choices: ["Two lives", "One life, with both threats removed", "No lives forever"], correctChoice: 1, feedback: "The first accepted hit immediately grants invulnerability, so the second contact is absorbed in the same tick." },
      explain: { question: "Why remove a hostile bullet even when the shield absorbs its contact?", choices: ["To award another enemy wave", "To reset the whole campaign", "To stop that same threat waiting inside the ship until protection ends"], correctChoice: 2, feedback: "Absorption is the bullet's terminal event. Leaving it active would let the already handled threat cause later damage." },
    },
  },
  {
    title: "Waves with a finish", concepts: ["Completion conditions", "Reproducible scenarios", "Terminal state"],
    goals: ["Follow the supplied wave sequence without premature victory during empty intervals.", "Wait for all final threats to clear and preserve either victory or defeat until restart."],
    extension: "Design a practice wave with slower arrivals but unchanged projectile and damage rules. Explain why easier timing should not change what counts as a hit.",
    activities: {
      learn: ["A wave can be temporarily empty before more arrivals are supplied. input.waveComplete marks its final arrivals. Win only after completed wave three has no enemies and no hostile bullets, with lives remaining. A projectile still descending after the last enemy is a real threat.", "Resolve movement, collisions and damage before evaluating the terminal result for that tick."],
      predict: ["Wave three is complete and the last enemy is destroyed, but one hostile bullet remains above the ship. Predict whether the game should declare victory immediately. Then consider the bullet leaving the world without a hit.", "An empty enemy array is only one part of the final condition. Inspect the hostile side of the bullet collection too."],
      build: ["Track the supplied wave, clear per-wave seen-id records when it advances and evaluate completion after events. Set over at zero lives; otherwise set won only when final wave completion and both threat collections agree. Freeze play actions after either outcome.", "Do not award victory from score or elapsed time alone. Those counters do not prove all scheduled threats are resolved."],
      run: ["Play a fixed seed through an empty interval and a final trailing shot. Pause at the last enemy's destruction and inspect remaining danger. Restart after both a win and a loss and replay the same starting inputs.", "Use the wave status text to distinguish waiting for arrivals from a completed campaign."],
      assess: ["Check intermediate empty states, final hostile bullets, simultaneous last-life loss and last-enemy destruction, and repeated actions after terminal outcomes. Defeat takes precedence when no lives remain.", "A visible victory message must correspond to a stable won state, not be inferred by the renderer from score."],
      inspect: ["If wins arrive early, inspect waveComplete and hostile-bullet filtering. If the final result changes later, inspect terminal guards. If a new wave ignores valid arrivals, inspect which seen-id records were cleared and when.", "Reset per-wave history on an actual advancing wave, not whenever an empty input array arrives."],
      fix: ["Repair completion ordering and replay the trailing-shot and last-life cases. Verify a legitimate completed campaign still wins and that restart clears all wave, timer and identity history.", "Use a repeatable seed to compare the same final events before and after your repair."],
      explain: ["Choose why final victory needs both a no-more-arrivals signal and empty threat collections. Explain why the player's remaining lives must be considered after the tick's damage events.", "Completion describes the resulting simulated world, not a hopeful prediction before unresolved events."],
      reward: ["Save Complete waves. Your game now has a whole campaign with explicit outcomes. The capstone will check its controls, projectiles, protection and end conditions together.", "Keep a named save of this stable campaign before adjusting difficulty."],
    },
    questions: {
      learn: { question: "Which signal means the current wave will supply no further arrivals?", choices: ["Score greater than zero", "input.waveComplete", "An empty array on one tick"], correctChoice: 1, feedback: "The explicit completion signal describes the arrival schedule; an empty current array does not establish that schedule has ended." },
      predict: { question: "The final enemy is gone but one hostile bullet remains; should victory be declared?", choices: ["Yes, ignore every bullet", "Only if a key is held", "No, the remaining hostile threat must resolve"], correctChoice: 2, feedback: "The final condition includes hostile bullets because they can still damage the player after their source enemy disappears." },
      explain: { question: "Why evaluate the result after collision and damage resolution?", choices: ["So the outcome reflects the complete current tick", "So zero lives can be ignored", "So old arrays never need cleanup"], correctChoice: 0, feedback: "The final events can change both remaining threats and lives, so the result must use the state after those effects." },
    },
  },
  {
    title: "The squadron challenge", concepts: ["Integration", "Regression testing", "Accessible feedback"],
    goals: ["Complete a three-wave arcade game with reliable entity and event lifecycles.", "Keep play, pause, protection feedback and restart usable with keyboard and touch controls."],
    extension: "Build a separate practice mode, documenting its intended change and the existing collision, cooldown and terminal-state tests that must still pass.",
    activities: {
      learn: ["A finished squadron game keeps one coherent order for input, timers, movement, hits and final outcomes. Crowded scenes test that order most strongly. Preserve stable ids, bounded collections and clear status text while combining all six mission concepts.", "The renderer can animate the result, but the project state remains the source of truth for health, score and protection."],
      predict: ["Predict one tick containing an edge reflection, two player hits, two hostile contacts and final-wave completion. Identify which decisions consume an object, which change health and which must wait until the other events finish.", "Follow ids through terminal events and apply the protection rule immediately after the first accepted damage."],
      build: ["Organise the final update into small operations with explicit data. Keep timers bounded at zero, collections filtered after their events and terminal checks last. Preserve the published state contract rather than adding a separate display-only win flag.", "A helper should do one clear job; sharing mutable arrays invisibly between helpers makes event order harder to understand."],
      run: ["Play with keyboard controls, then onscreen movement, fire and shield controls. Pause a crowded scene and inspect the text state. Test release, restart and reduced motion, and load a named project save before another attempt.", "A shield should be understandable from timer/status text as well as a visual effect. Do not rely on flashing colour alone."],
      assess: ["Run the final saved-source checks across seeded formations, duplicate arrivals, edge contacts, simultaneous hits, protection boundaries and final-wave conditions. Each rule must hold when combined with the others.", "Passing a quiet opening screen is not enough; the capstone includes the busy and terminal states."],
      inspect: ["Find the first incorrect event in the failing trace and identify its owning bullet or enemy. Compare the state before that event with its mission rule, then inspect later changes only after the first discrepancy is understood.", "The final wrong score may be a symptom of duplicate arrivals or repeated hits much earlier in the run."],
      fix: ["Repair the failing behaviour and rerun its focused case plus the previous movement, projectile, protection and restart cases. Save and assess the new source, keeping a named stable version before further experiments.", "Do not hard-code responses to one seed. The project must implement the same rules for every supplied formation."],
      explain: ["Choose what the combined checks establish and describe one remaining limitation of the simplified simulation. Explain how deterministic scenarios and accessible text feedback helped you diagnose a crowded event.", "Tests support specific behaviours; they do not justify claiming that future changes require no verification."],
      reward: ["Save Squadron challenge and complete the final assessment. You have built a playable arcade campaign with fair damage, owned events and repeatable outcomes. Replay a mission or experiment in another save while retaining your earned completion.", "Use the finished version as a baseline for your next weapon or formation idea."],
    },
    questions: {
      learn: { question: "What should remain the source of truth for score, protection and outcome?", choices: ["Only the animation colour", "An unrelated display counter", "The validated game state"], correctChoice: 2, feedback: "Rendering presents the state; it must not invent a different score or outcome that the simulation has not produced." },
      predict: { question: "When should final-wave victory be considered during a busy tick?", choices: ["After movement, hit and damage effects resolve", "Before any bullet moves", "Whenever the first enemy disappears"], correctChoice: 0, feedback: "The final result depends on all remaining threats and lives after the current tick's events are processed." },
      explain: { question: "Why replay the same seed when verifying a fix?", choices: ["It guarantees no untested case exists", "It makes before-and-after behaviour comparable", "It makes source changes unnecessary"], correctChoice: 1, feedback: "A stable scenario isolates the effect of the code change instead of mixing it with a different formation or timing sequence." },
    },
  },
]);
