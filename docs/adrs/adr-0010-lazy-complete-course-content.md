# ADR 0010: Lazy complete-course learner content

Status: Accepted. Date: 2026-09-20. Task: #79.

Complete courses need detailed teaching content without making the catalogue or
every landing page download all lessons. Publish each as a distinct package
subpath containing the versioned course manifest and formative practice questions.
The root contracts entry does not import these curricula. Start with Robot Maze
Dash 2.0.0 and preserve its existing junior-coder module identity and immutable
legacy catalogue versions.

The authoring helper shares only stable identifiers and activity framing. Each
mission supplies its own nine instructions/help texts, goals, concepts, extension
and three formative checks for learning, prediction and reflection. Formative
answers are intentionally learner-visible for explanatory feedback; they never
replace protected project checks or award account progress by themselves.

The package remains infrastructure-neutral and free of execution dependencies.
Browser/server hosts consume a separately released bounded runtime, verify actual
project behaviour, and own protected scenarios, evidence and persistence. No
runtime solution, learner state or host-only assessment fixture is exported here.

Structural tests verify six missions, canonical activities, distinct authored
instructions, references, starter project and complete formative questions. These
checks are necessary but insufficient: each host must also demonstrate runnable
projects, passing reference solutions and failing wrong/edge cases, saved journeys
and accessibility before calling a course complete or enabling rollout.

The three complete web curricula use the same lazy boundary and module version
2.0.0. A small internal authoring module shares the three editable-file limits,
readable responsive starter styles and binding reference. Lesson content, model
rules and formative checks remain independently authored. The public package
contains no DOM renderer or runtime dependency; hosts compose the released
bounded web compiler and isolated JavaScript execution. The planner's simulated
snapshot data is distinct from account source persistence, and the control panel
has no physical hardware entitlement. See TDR 0014 for progressive host checks.
