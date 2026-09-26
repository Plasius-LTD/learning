import type { LearningCourseV1 } from "../course-contracts.js";

/** The web courses share file limits and a readable starting theme, not lesson content. */
export const webProjectFiles: LearningCourseV1["projectFiles"] = [
  { path: "index.html", language: "html", maximumCharacters: 24000 },
  { path: "app.css", language: "css", maximumCharacters: 16000 },
  { path: "app.js", language: "javascript", maximumCharacters: 32000 },
];

export const webStarterCss = `:root { color: #172a29; background-color: #f5f4ec; font-family: system-ui, sans-serif; line-height: 1.6; }
* { box-sizing: border-box; }
main { max-width: 60rem; margin-inline: auto; padding: 1rem; overflow-wrap: anywhere; }
h1, h2, p { margin-top: 0; }
section, article, fieldset { border: 1px solid #647874; border-radius: 0.5rem; padding: 1rem; margin-block: 1rem; min-width: 0; }
label { display: block; font-weight: 700; }
button, input, select, textarea { font-family: inherit; font-size: 1rem; line-height: 1.6; min-height: 2.75rem; max-width: 100%; border: 2px solid #465e59; border-radius: 0.25rem; padding: 0.5rem; color: inherit; background-color: #ffffff; }
button { cursor: pointer; }
button:disabled { cursor: default; border-style: dashed; }
:focus-visible { outline: 3px solid #075bab; outline-offset: 3px; }
[aria-invalid="true"] { border-color: #a11c25; }
.error { color: #a11c25; }
.actions { display: flex; flex-wrap: wrap; gap: 0.75rem; }
.cards { display: grid; gap: 1rem; padding: 0; list-style-type: none; }
progress, meter { width: 100%; }
@media (min-width: 48rem) { .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (prefers-reduced-motion: reduce) { * { transition-duration: 0s; } }
@media (prefers-color-scheme: dark) {
  :root { color: #edf4ef; background-color: #142623; }
  button, input, select, textarea { color: #edf4ef; background-color: #203a34; border-color: #b8cec5; }
  :focus-visible { outline-color: #a8d6ff; }
  .error { color: #ffb8bf; }
  [aria-invalid="true"] { border-color: #ffb8bf; }
}
`;

export const webReferences: LearningCourseV1["reference"] = [
  { name: "editable web files", signature: "index.html + app.css + app.js", description: "Write a semantic HTML fragment beginning with main, scoped responsive CSS and pure JavaScript initialState/update/view functions. The host compiles HTML/CSS and runs JavaScript separately. No document, DOM, imports, network, localStorage, timers, images or external resources are available. Fictional project data stays inside the preview; course source is saved through the bound account.", example: '<main><h1>My project</h1><p role="status" data-text="message"></p></main>' },
  { name: "bindings", signature: "view(state) → plain JSON display data", description: "data-text displays scalar text; data-value controls a native field; data-checked, data-disabled, data-pressed, data-invalid and data-if require booleans. data-label supplies a nonempty accessible label. data-repeat repeats its element for records with unique string id, resolving nested bindings within each record. Do not put static HTML IDs in repeated content. Paths use named fields up to four segments, without expressions.", example: '<li data-repeat="missions"><span data-text="title"></span><button type="button" data-action="toggle" data-id="id" data-pressed="done" data-label="toggleLabel">Toggle</button></li>' },
  { name: "native events", signature: '{ type: "field", name, value } or { type, id? }', description: "A named input, textarea or select emits field with its string value (checkboxes use booleans). A type=button with data-action emits that action and optional bound data-id. A form with data-action owns submission; its submit button has no separate action. Prevent network submission. Preserve native labels, focus and keyboard operation; input text is never executable markup.", example: '<form data-action="add" novalidate><label for="title">Mission</label><input id="title" name="title" data-value="draft.title"><button type="submit">Add mission</button></form>' },
];
