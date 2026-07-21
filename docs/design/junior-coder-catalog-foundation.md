# Junior Coder catalog foundation

## Status

Approved implementation design for `Plasius-LTD/learning#1`, under `plasius-ltd-site#1710`, Feature `plasius-ltd-site#1702`, and Epic `plasius-ltd-site#1701`.

## Outcome

Provide a reusable contract authority for the Project: Junior Coder catalog without coupling learning rules to the site, economy, storage, identity, AI-provider, or sandbox implementations.

## Boundary

The package owns:

- immutable path and module-version shapes;
- course-material and pre-purchase hardware disclosures;
- missions, goals, side adventures, rubrics, results, evidence, agents, badges, and entitlements;
- validation of catalog-wide and module-local invariants;
- deterministic score calculation;
- the initial 19-module pilot manifest.

Consuming applications own authentication, Guardian/child relationship authority, capabilities, feature flags, Token accounting, persistence, HTTP, telemetry, OpenAI calls, sandbox execution, adult approval, and static hosting.

## Catalog invariants

1. Every published module is self-contained and has no paid prerequisite.
2. Every module has an immutable semantic version and content revision.
3. Every module has separate learner and facilitator material manifests.
4. Every module declares hardware mode, inclusion status, simulator availability, and preparation details before a quote is created.
5. Every rubric totals 100 points and reserves the approved 20/50/20/10 dimensions.
6. Completion requires at least 80 points and all mandatory checks.
7. AI-facing agents never own the score, completion, badges, publishing, or hardware approval.
8. The public launch is outside this package and remains disabled until all release gates pass.

## AI safety contract

Agent definitions are capability descriptions, not provider prompts. They constrain feedback to assessment evidence and one next step. Provider adapters must independently require Guardian consent, current relationship and age assurance, privacy review, safety evaluations, and an approved Zero Data Retention project before processing child data. This reflects [OpenAI's Under 18 API Guidance](https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance) and [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data#data-retention-controls-for-abuse-monitoring).

## Commercial state

The initial manifest uses ordinary Token subunits and per-module pilot shadow prices. Its `pilot-grant-only` state deliberately prevents a consumer from treating the manifest as public-checkout authorization. Module Allowance settlement belongs to `@plasius/economy` and the site transaction coordinator.

## Verification

- Contract tests validate every invariant and category count.
- Assessment tests cover thresholds, partial credit, unknown criteria, and mandatory safety failures.
- The package must meet the repository coverage threshold and pass public-package inspection.
