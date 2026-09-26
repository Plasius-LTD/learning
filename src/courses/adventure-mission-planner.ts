import { authorCourse } from "./course-authoring.js";
import { webProjectFiles, webReferences, webStarterCss } from "./web-course-authoring.js";

export const { course, practice } = authorCourse({
  slug: "adventure-mission-planner", title: "Adventure Mission Planner", category: "web-app",
  summary: "Build a real three-file web application for a fictional expedition. Structure a readable page, validate a labelled form, create and revise mission records, then recover a saved plan without accepting corrupt data. Finish an accessible planner with truthful counts and explicit feedback, using simulated storage inside the preview.",
  projectFiles: webProjectFiles,
  starterProject: { files: [
    { path: "index.html", source: `<main>
  <h1>Adventure Mission Planner</h1>
  <p>Plan a fictional expedition, one mission at a time.</p>
  <section aria-labelledby="entry-heading">
    <h2 id="entry-heading">New mission</h2>
    <form data-action="add" novalidate>
      <label for="title">Mission title</label>
      <input id="title" name="title" type="text" maxlength="80" aria-required="true" aria-describedby="title-error" data-value="draft.title" data-invalid="titleInvalid">
      <p id="title-error" class="error" role="alert" data-text="titleError"></p>
      <label for="minutes">Minutes, from 5 to 180</label>
      <input id="minutes" name="minutes" type="number" min="5" max="180" step="1" aria-required="true" aria-describedby="minutes-error" data-value="draft.minutes" data-invalid="minutesInvalid">
      <p id="minutes-error" class="error" role="alert" data-text="minutesError"></p>
      <label for="priority">Priority</label>
      <select id="priority" name="priority" data-value="draft.priority"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select>
      <button type="submit">Add mission</button>
    </form>
  </section>
  <section aria-labelledby="plan-heading"><h2 id="plan-heading">Your plan</h2>
    <p data-text="summary"></p><ul class="cards"><li data-repeat="missions"><strong data-text="title"></strong><p data-text="details"></p></li></ul>
  </section>
  <p role="status" data-text="message"></p>
  <button type="button" data-action="reset">Reset preview</button>
</main>` },
    { path: "app.css", source: webStarterCss },
    { path: "app.js", source: `function initialState() {
  return { missions: [], draft: { title: "", minutes: "15", priority: "normal" }, editingId: null,
    filter: "all", nextId: 1, savedSnapshot: null, titleError: "", minutesError: "", message: "Add a fictional mission to begin." };
}
function update(state, input) {
  if (input.type === "reset") return initialState();
  return JSON.parse(JSON.stringify(state));
}
function validateDraft(draft) { return { valid: false, titleError: "Check the title.", minutesError: "Check the minutes." }; }
function snapshot(state) { return ""; }
function restoreSnapshot(text) { return null; }
function view(state) {
  return { draft: { ...state.draft }, missions: [], totalCount: state.missions.length, completedCount: 0,
    totalMinutes: 0, summary: "No missions yet.", isCreating: state.editingId === null, isEditing: state.editingId !== null,
    titleError: state.titleError, minutesError: state.minutesError, titleInvalid: state.titleError !== "",
    minutesInvalid: state.minutesError !== "", hasSavedPlan: state.savedSnapshot !== null, message: state.message };
}
` },
  ] },
  reference: [...webReferences,
    { name: "initialState", signature: "initialState() → empty planner", description: "Fresh state has missions=[], draft {title:'',minutes:'15',priority:'normal'}, editingId=null, filter='all', nextId=1, savedSnapshot=null, empty titleError/minutesError and a useful message. Records have only id, title, minutes, priority and done. There are at most 20 missions. IDs are mission-N for integers N from 1 to 999999; nextId is an integer from 1 to 1000000 and always exceeds every allocated ID.", example: '{ id: "mission-1", title: "Find the beacon", minutes: 15, priority: "normal", done: false }' },
    { name: "validateDraft", signature: "validateDraft(draft) → {valid,titleError,minutesError}", description: "Title is trimmed, 1–80 characters; reject control characters. Minutes is a string of one to three decimal digits whose integer value is 5–180; reject blanks, signs, fractions and exponent notation. Priority must be low, normal or high. Return empty errors for valid fields and useful field errors otherwise. valid requires all three fields; an invalid priority also produces general feedback. Do not change the supplied draft.", example: 'const minutesValid = /^\\d{1,3}$/.test(draft.minutes) && Number(draft.minutes) >= 5 && Number(draft.minutes) <= 180;' },
    { name: "update", signature: "update(state, input) → detached next state", description: "field accepts string title/minutes/priority values bounded to 80/3/6 characters; unrecognised fields or invalid priorities preserve state. add requires creating mode, a valid draft, room below 20 and an available ID. Append one trimmed record, increment nextId, clear draft/errors, preserve existing records and give feedback. Failed add/save keeps records, nextId and draft intact while setting errors/message. Unknown actions preserve values.", example: 'update(state, { type: "field", name: "title", value: "Find the beacon" });' },
    { name: "revision actions", signature: "edit/save/cancel/toggle/remove/filter", description: "edit{id} copies an existing record into the draft and selects its ID; save validates then changes its title/minutes/priority while retaining ID/done; cancel clears draft and editingId. toggle{id} flips done once. remove{id} removes exactly that record, cancelling if it was being edited. Unknown IDs preserve state. filter is a named field whose value is all/open/done; it changes only filter and cancels editing. add never acts as save and save never acts as add.", example: 'update(state, { type: "edit", id: "mission-1" });' },
    { name: "view", signature: "view(state) → labelled display projection", description: "Return draft, filtered missions with id/title/done/details/toggleLabel/editLabel/removeLabel, totalCount/completedCount/totalMinutes from all records, summary, isCreating/isEditing, titleError/minutesError and matching titleInvalid/minutesInvalid booleans, hasSavedPlan and message. Include filter for a bound select. Render record actions with data-id and data-label; never use record text as HTML. Reading view changes no state.", example: 'const toggleLabel = (mission.done ? "Reopen " : "Complete ") + mission.title;' },
    { name: "snapshot", signature: "snapshot(state) → JSON string", description: "Serialize only {schemaVersion:1,nextId,missions}, at most 16000 characters. store sets savedSnapshot to that string and reports success. Preview storage is simulated in state: it is not localStorage, an account API or a cloud backup. reset clears the preview including this snapshot; account project saves remain separate.", example: 'JSON.stringify({ schemaVersion: 1, nextId: state.nextId, missions: state.missions });' },
    { name: "restoreSnapshot", signature: "restoreSnapshot(text) → validated snapshot | null", description: "Check string length, parse errors, exact object/record keys, version 1, 0–20 records, unique mission-N IDs, trimmed valid titles, bounded integer minutes, allowed priorities, boolean done and nextId greater than every record ID. Reject duplicate IDs, extra properties and corrupt data as null. reload validates savedSnapshot before replacing records/nextId; success clears draft/errors/editing and resets filter to all. Invalid/missing snapshots preserve working data and change only message. Retain savedSnapshot on either outcome.", example: 'const restored = restoreSnapshot(state.savedSnapshot); if (restored === null) return { ...state, message: "Saved plan could not be loaded." };' },
  ],
}, [
  {
    title: "A page with a purpose", concepts: ["Semantic HTML", "CSS layout", "Display data"],
    goals: ["Give a fictional planner a clear heading structure and readable responsive layout.", "Distinguish editable HTML, CSS and JavaScript responsibilities."],
    extension: "Create a second expedition theme in a named save while preserving semantic headings, readable text and the same data contract.",
    activities: {
      learn: ["The planner uses three editable files. HTML names the page, form and mission list; CSS controls readable layout; JavaScript produces state and display data. Start with one main landmark and an h1, then h2 headings for entering and reviewing missions.", "The preview accepts an HTML fragment. It supplies the surrounding document and loads app.css separately, so do not add script or link tags."],
      predict: ["Predict what changes when you edit only the heading text, only the main padding, or only the initial message. Identify which file owns each effect before running the starter.", "A visual change does not automatically change the mission records stored in JavaScript state."],
      build: ["Give the page a fictional expedition identity, retain visible field labels and organise the two sections. Adjust app.css so the form and list fit 320px without horizontal page scrolling and remain readable in both colour themes.", "Use flexible widths, wrapping text and min-width:0 for layout children. Keep visible focus outlines on controls."],
      run: ["Open the empty planner, move through its controls with the keyboard and inspect its heading order. Zoom the page and compare narrow and wide views. The initial summary should truthfully say there are no missions.", "The Add button is intentionally unfinished at this stage; later lessons connect its action to validated state changes."],
      assess: ["Check the main landmark, meaningful headings, visible control labels, empty-state projection and responsive style rules. Confirm view reads state without changing it and reset produces a fresh empty planner.", "This milestone assesses an honest starting interface; it does not require the later record-creation behaviour yet."],
      inspect: ["If a panel overflows, inspect widths and long text before shrinking the font. If a control is hard to find, inspect its label and focus styling rather than relying on a decorative icon.", "A narrow preview is a useful way to reveal assumptions that a wide desktop view hides."],
      fix: ["Repair the page structure or styles and repeat the keyboard, zoom and 320px checks. Keep the message bound through data-text so changing state updates actual text instead of executable markup.", "The same source should work at multiple widths; avoid separate narrow-page copies that drift apart."],
      explain: ["Explain why headings describe the document while colours and spacing belong in CSS. Choose the change that improves navigation for someone using a screen reader.", "A heading's meaning comes from its HTML level and text, not from making an ordinary paragraph look large."],
      reward: ["Save Readable expedition. Your planner now has a clear structure and a truthful empty view. The next mission gives the form useful validation and feedback.", "Keep this working three-file starting point so later changes can be compared with it."],
    },
    questions: {
      learn: { question: "Which file should describe the planner's heading structure?", choices: ["index.html", "app.css only", "The saved snapshot"], correctChoice: 0, feedback: "Semantic headings belong in HTML, while CSS styles their appearance and JavaScript supplies changing application data." },
      predict: { question: "What does changing only main padding normally affect?", choices: ["The mission IDs", "The space around page content", "The number of saved missions"], correctChoice: 1, feedback: "Padding is a layout property, so it changes spacing without changing the planner's records or identities." },
      explain: { question: "Which change helps heading-based screen-reader navigation?", choices: ["A larger paragraph font", "A decorative border", "Meaningful h1 and h2 elements"], correctChoice: 2, feedback: "Real heading elements expose document structure to assistive technology instead of communicating it only visually." },
    },
  },
  {
    title: "A form that explains itself", concepts: ["Native controls", "Validation", "Accessible errors"],
    goals: ["Handle bounded field input without changing mission records.", "Validate titles, minutes and priorities and explain invalid fields accessibly."],
    extension: "Compare error wording with a partner using fictional input. Revise the wording to describe how to recover while keeping the same validation rules.",
    activities: {
      learn: ["A form needs to explain what went wrong without losing the user's work. Native controls emit field actions. validateDraft checks trimmed title, decimal minutes and allowed priority. A labelled error linked with aria-describedby and a matching aria-invalid state makes the failure discoverable.", "The form uses novalidate so your own consistent feedback can run; JavaScript must still enforce every documented rule."],
      predict: ["Predict validation for a blank title, whitespace around Beacon walk, minutes 4, 15.5, 1e2 and 180. Separate the displayed draft from the normalised values you will eventually save.", "Number inputs still emit strings. Accepting Number(value) alone would also accept some formats the planner explicitly excludes."],
      build: ["Handle title, minutes and priority field actions using detached state. Implement validateDraft and make add report field errors for invalid input without creating records yet. Bind the error text and booleans, and clear a field's stale error when that field changes.", "Do not replace the draft with trimmed data while the user is typing. Normalise only when a valid submission is committed."],
      run: ["Submit empty and malformed drafts, then correct them using the keyboard. Verify visible errors, retained input, screen-reader associations and focus preservation while typing. Try the same form at 320px.", "A repeated render should not move focus to the page top or replace the active field's editing selection."],
      assess: ["Check accepted boundaries 5 and 180, rejected blank/fraction/exponent minutes, whitespace-only and overlong titles, forbidden control characters and invalid priorities. Verify errors match fields and validation has no mutation effects.", "Useful validation checks both the successful case and nearby inputs that look plausible but violate a documented rule."],
      inspect: ["If a rejected input disappears, inspect draft updates. If an error remains after correction, inspect error clearing. If the form reloads the preview, inspect submission ownership and remove any separate action on its submit button.", "One submission belongs to the form; two independent handlers can accidentally create duplicate transitions later."],
      fix: ["Repair validation and field feedback, then replay invalid-to-valid input. Confirm a valid draft reports empty field errors, invalid priority cannot slip through, and no attempt has changed missions or nextId.", "Form correction is separate from record creation; preserve that boundary until the next mission implements commit behaviour."],
      explain: ["Explain why the original draft is kept after failure and why aria-invalid alone is insufficient without useful text. Identify the format check that prevents exponent notation being accepted as ordinary minutes.", "A person needs both an indication of the problem and enough information to correct it."],
      reward: ["Save Helpful form. Your controls accept bounded input and explain validation failures. Next you will commit valid drafts into uniquely identified mission records.", "Retain the invalid-to-valid examples as regression cases for later editing and storage work."],
    },
    questions: {
      learn: { question: "What should a failed submission preserve for the user?", choices: ["Only the heading", "Their draft and existing mission records", "Only the invalid field's colour"], correctChoice: 1, feedback: "Keeping the draft and existing records lets the person correct the problem without losing their current or earlier work." },
      predict: { question: "Which minutes string satisfies the documented format and bounds?", choices: ["15.5", "1e2", "180"], correctChoice: 2, feedback: "The planner accepts one to three decimal digits with an integer value from five to one hundred and eighty." },
      explain: { question: "Why link an invalid input to a written error?", choices: ["To explain how to correct it beyond colour or a flag", "To submit twice", "To remove the field label"], correctChoice: 0, feedback: "A linked, useful error communicates the reason and recovery step to people who may not perceive the visual styling." },
    },
  },
  {
    title: "Turn entries into missions", concepts: ["Arrays and records", "Stable identity", "Atomic changes"],
    goals: ["Commit valid drafts as unique records with bounded storage.", "Project mission cards and summary counts from the same source of truth."],
    extension: "Show a total-time sentence that changes as missions are added. Keep the calculation derived from records rather than maintaining a second editable total.",
    activities: {
      learn: ["A mission is a record with a stable ID, title, minutes, priority and done flag. Valid add commits one record and increments nextId together. Keep at most 20 missions and never reuse IDs after removal; summaries are calculated from records rather than separately counted clicks.", "Stable identity matters even when two fictional missions share the same title."],
      predict: ["Predict IDs and totals after adding two valid missions with an invalid submission between them. Then predict an attempt to add a twenty-first mission and whether its failure should consume an ID.", "A refused operation must not partly update the list or counter before checking all prerequisites."],
      build: ["Complete add in creating mode: validate, check capacity and ID availability, append one trimmed record, increment nextId and clear the successful draft. Implement view with repeated mission records, total/completed counts, total minutes and a truthful summary.", "Use data-repeat with unique id values and data-text for mission text. Keep HTML IDs out of repeated card content."],
      run: ["Create two missions, compare their labels, IDs and minute total, then attempt an invalid third. Check that typing text resembling HTML displays as text and cannot create elements in the page.", "The renderer's text boundary and your app's record validation serve different purposes; both must remain intact."],
      assess: ["Check single-record commits, trimmed titles, numeric minutes, unique increasing IDs, 20-record capacity, exhausted IDs, unchanged records on refusal and nonmutating display projection. Verify summaries describe the complete list.", "An attractive card cannot establish that the underlying record or identity was committed correctly."],
      inspect: ["If duplicates appear, inspect whether the form submits twice or nextId increments separately from insertion. If totals drift after refusal, replace independent counters with calculations over the current records.", "Look for the first state transition that differs from your prediction, not just the last visible symptom."],
      fix: ["Repair the commit boundary and rerun valid-invalid-valid submissions. Confirm the failed attempt leaves no partial record, the successful draft clears, and the next record receives the next unused ID.", "Prepare a detached next state, then return the coherent result only after all required conditions are known."],
      explain: ["Explain why a title is a poor identifier and why a failed add should leave nextId unchanged. Choose the implementation that keeps list and count changes coherent.", "Identity lets later edits target a record even when its title or displayed position changes."],
      reward: ["Save Mission maker. Your planner now turns valid input into meaningful records and honest summaries. The next mission adds editing, completion and focused views.", "Keep a two-record example with different priorities for exercising revision without confusing identity with position."],
    },
    questions: {
      learn: { question: "Why does each mission need an ID separate from its title?", choices: ["Titles can never change", "Titles must be secret", "A record must remain identifiable after edits or reordering"], correctChoice: 2, feedback: "Stable identity keeps later actions attached to the intended record even when its human-readable title changes." },
      predict: { question: "Two valid adds with one refused add between them produce which IDs?", choices: ["mission-1 and mission-2", "mission-1 and mission-3", "Two copies of mission-1"], correctChoice: 0, feedback: "The refused add commits neither a record nor an ID increment, so the next successful record receives mission-2." },
      explain: { question: "Where should totalMinutes come from?", choices: ["The number of Add clicks", "The current complete mission list", "The last typed minutes field"], correctChoice: 1, feedback: "Deriving the summary from current records prevents rejected attempts and later edits from drifting a separate total." },
    },
  },
  {
    title: "Revise without losing the plan", concepts: ["Editing state", "Record actions", "Filtering"],
    goals: ["Edit, complete and remove exactly the intended record.", "Separate filtered presentation from stored data and keep editing modes explicit."],
    extension: "Add a visible explanation of the current filter. Check that global totals remain understandable when only one part of the plan is visible.",
    activities: {
      learn: ["Editing copies a record into a draft while preserving its ID and done status until save. Toggle and remove also target IDs. Filtering changes what view returns, never what missions contains. Cancelling or changing filter clears editing so a hidden record is not accidentally modified.", "Creating and editing are distinct modes: add must not become save merely because a draft happens to contain existing text."],
      predict: ["Predict a plan after completing its first record, filtering to open, editing the second and cancelling. Compare visible cards with global counts, then predict removing the record currently being edited.", "The total count describes all records even when the filtered list is smaller."],
      build: ["Add labelled per-record edit/toggle/remove buttons using data-id and data-label. Implement edit, save, cancel, toggle, remove and the filter field. Show the correct Add or Save controls for each mode, retain ID/done on save and clear editing when removal targets it.", "Use data-if for mode-specific controls and data-pressed for completion state, with readable labels that do not rely on colour."],
      run: ["Use the keyboard to edit one of two similarly titled missions, submit an invalid edit, correct it, cancel another edit and change filters. Remove one record and add a new one to check that its ID is not reused.", "Follow focus through the interaction; when a clicked record disappears, the host should restore focus to a sensible surviving control."],
      assess: ["Check exact-ID targeting, invalid-edit preservation, retained completion state, cancel without effects, unknown IDs, filter preservation and no ID reuse. Check that save cannot create a record and add cannot overwrite one.", "These cases cross several features, so include them alongside the earlier creation and validation checks."],
      inspect: ["If the wrong card changes, inspect index-based targeting. If completed work vanishes after filtering, inspect whether a filtered array replaced the source list. If an edit becomes a duplicate, inspect mode guards.", "A display index is temporary and should never become the record's long-term identity."],
      fix: ["Repair the responsible transition and replay edit, filter, remove and add with two similar titles. Recheck summaries and focus, including the case where no visible missions remain.", "An empty filtered list needs an understandable message while preserving the hidden records."],
      explain: ["Explain the difference between filtering records and deleting them. Choose which fields a successful edit must retain and describe why separate modes protect the plan.", "Useful editing changes the intended content while preserving the record's identity and established completion state."],
      reward: ["Save Revisable plan. Your planner can change its mind without losing records or confusing identities. Next you will store and safely restore a complete plan.", "Keep the mixed completed/open example as a useful snapshot recovery fixture."],
    },
    questions: {
      learn: { question: "What should filtering change in the stored mission list?", choices: ["Nothing; it changes the view", "It deletes hidden records", "It replaces every ID"], correctChoice: 0, feedback: "Filtering selects a presentation of the existing records, so switching back can reveal the same intact plan." },
      predict: { question: "What survives a successful title-and-minutes edit?", choices: ["Only the old title", "The record's ID and done flag", "No part of the existing record"], correctChoice: 1, feedback: "An edit changes the draft-owned fields while retaining stable identity and the record's completion state." },
      explain: { question: "Why should add refuse to run during editing mode?", choices: ["To disable all keyboard controls", "To hide field errors", "To prevent an edit from accidentally becoming a duplicate record"], correctChoice: 2, feedback: "Explicit operation modes prevent one user intention from silently creating a different kind of state change." },
    },
  },
  {
    title: "Recover a saved plan", concepts: ["Serialization", "Untrusted data", "Recovery"],
    goals: ["Serialize only the plan data needed for recovery.", "Validate a whole snapshot before replacing working state and explain recovery failures."],
    extension: "Design a recovery message for an unsupported future snapshot version. Explain why guessing at its meaning could damage an otherwise valid current plan.",
    activities: {
      learn: ["Saved text is input that must be checked again. snapshot writes version, nextId and missions; restoreSnapshot validates the full shape and every record before returning data. The exercise uses simulated storage in preview state, separate from account saves of the source project.", "A snapshot does not include errors, active editing or filters, because recovery should reopen a stable plan rather than a half-finished interaction."],
      predict: ["Predict recovery for valid data, truncated JSON, duplicate IDs, a wrong version and nextId equal to an existing record number. Decide which state should survive when restoreSnapshot returns null.", "Successful JSON parsing proves syntax only; it does not establish that the data describes a valid plan."],
      build: ["Implement bounded snapshot and restoreSnapshot, checking exact keys, types, record limits, identity uniqueness and nextId ordering. Add Store plan and Reload plan controls. On valid reload replace records/nextId together and reset interaction state; on failure preserve the working plan and report a useful message.", "Validate before replacement. A try/catch around JSON.parse is necessary but insufficient for record and identity rules."],
      run: ["Store a mixed plan, edit it, then reload the stored version. Use the supplied corrupt-snapshot scenarios and confirm current records survive each refusal. Try reload before any snapshot exists and compare the feedback.", "The saved snapshot lives only in this preview session; the course's account-bound source saves are a separate feature."],
      assess: ["Check round-trip equality, version and exact-key rules, malformed/oversized input, invalid record fields, duplicate identities and invalid nextId. Verify corrupt reload has no partial effects and successful reload resets filter, draft and editing consistently.", "Restoring valid records one at a time before the whole snapshot passes can leave a mixed old-and-new plan."],
      inspect: ["If restore accepts broken data, identify the first missing validation rule. If failure destroys the current plan, inspect assignment order. If a later add duplicates an ID, inspect nextId against the greatest restored record number.", "A saved counter and its records form one coherent data set; checking them separately is not enough."],
      fix: ["Repair the validator or replacement boundary and replay valid-corrupt-valid recovery. Confirm the snapshot itself remains available, recovery errors are readable, and the current source still passes earlier editing and creation checks.", "Keep rejected data from altering either working records or the snapshot that the user deliberately stored."],
      explain: ["Explain why syntactically valid JSON can still be invalid application data. Describe the difference between storing a preview plan and saving this three-file project to your Plasius account.", "One preserves simulated application data for the exercise; the other preserves authored source and learning progress."],
      reward: ["Save Recoverable plan. Your planner can recover known data and refuse corrupt input without losing current work. The final mission combines the whole journey into a complete accessible application.", "Retain the duplicate-ID and wrong-version cases because they test different recovery boundaries."],
    },
    questions: {
      learn: { question: "What does successful JSON.parse establish?", choices: ["All mission IDs are unique", "The text has valid JSON syntax", "The nextId counter is safe"], correctChoice: 1, feedback: "Parsing checks representation syntax; application rules such as uniqueness, versions and counter ordering still need validation." },
      predict: { question: "What should remain after reloading a corrupt snapshot?", choices: ["An empty planner", "Half of the snapshot's records", "The current working plan with useful failure feedback"], correctChoice: 2, feedback: "Validation must finish before replacement, so a rejected snapshot cannot partially overwrite or erase the working plan." },
      explain: { question: "Why must restored nextId exceed every existing mission number?", choices: ["To prevent the next add reusing an existing identity", "To make JSON prettier", "To change all old mission titles"], correctChoice: 0, feedback: "The allocation counter must agree with restored records or a future add could create an ambiguous duplicate identity." },
    },
  },
  {
    title: "Your complete adventure planner", concepts: ["Integrated behaviour", "Accessibility evidence", "Capstone"],
    goals: ["Deliver a coherent planner with validation, revision, summaries and recoverable data.", "Demonstrate the complete keyboard journey and assess the exact saved source."],
    extension: "Propose a new planning feature in a separate save, naming its data invariants, accessible interactions and recovery implications before implementing it.",
    activities: {
      learn: ["A complete planner connects structure, validation, record identity, revision and recovery into one understandable task. Its visual theme supports that task, while readable errors and stable focus help people recover from mistakes. The capstone checks the whole current source.", "A previous successful assessment cannot prove a later edit still works; final evidence must match the saved project."],
      predict: ["Plan a demonstration that adds two missions, rejects an invalid edit, completes one, filters the list, stores a snapshot, removes a record and reloads. Predict counts, minutes, identities and editing mode at each step.", "Include a refusal and a recovery so the demonstration covers more than the easiest successful path."],
      build: ["Finish the authored page, labels, summaries and status messages. Review the three files together, remove abandoned controls, keep Store/Reload clearly described as simulated preview storage and ensure reset is separate from account saving.", "Consistency means a visible action, its JavaScript rule and its explanatory text describe the same operation."],
      run: ["Perform the demonstration with keyboard and touch, then at 320px, with zoom, both colour themes and reduced motion. Check headings, errors and status with a screen reader. Save and reload the project source, then repeat the same plan.", "Avoid announcing every keystroke as a status update; announce completed actions and useful failures without duplicating field errors."],
      assess: ["Run the final validation, creation, edit/cancel, toggle/remove, filter, identity, capacity, serialization and corrupt-recovery scenarios. Verify detached state, inert text and responsive accessible controls, then obtain current-source evidence for the final project.", "The reference scenarios check actual behaviour; a filled-out page alone does not complete this module."],
      inspect: ["For any failure, locate the earliest incorrect state transition and its owning file. Compare the saved source with the tested source, especially if a recent style or label edit changed bindings.", "A renamed binding can break data flow even when the page still looks convincing."],
      fix: ["Repair the smallest responsible rule, rerun its focused scenario and then the complete demonstration. Save a named final project and assess it again before completing the course.", "Keep successful earlier scenarios in the final regression set so a local repair does not undo another mission's work."],
      explain: ["Explain how validation and stable identity protect the plan, why recovery checks untrusted data, and how semantic controls make the same workflow usable through different input methods.", "Use one concrete example from your own tested project for each claim rather than relying on a general statement that it works."],
      reward: ["Save Expedition ready and finish the final assessment. You have built a real editable web planner from semantic structure through recoverable application state. Replay a mission or extend a separate save while retaining earned completion.", "Your source project remains account-bound; the simulated plan can be reset independently for another demonstration."],
    },
    questions: {
      learn: { question: "What establishes the final planner's behaviour?", choices: ["A screenshot of the title", "A previous assessment of different source", "Verified scenarios against the current saved source"], correctChoice: 2, feedback: "Evidence must exercise the implemented behaviour and match the exact source being submitted for completion." },
      predict: { question: "Which demonstration best covers recovery as well as normal use?", choices: ["Create, edit, store, change and reload a plan", "Open the heading once", "Change only the background colour"], correctChoice: 0, feedback: "A sequence spanning creation, revision and recovery exposes interactions that an isolated visual check cannot establish." },
      explain: { question: "What should a later extension preserve?", choices: ["Only the theme colours", "Existing invariants, accessible operation and recovery behaviour", "Only the newest feature"], correctChoice: 1, feedback: "Extending a useful application means retaining the working rules and access paths that its current users already depend on." },
    },
  },
]);
