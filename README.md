# @plasius/learning

`@plasius/learning` is the framework- and infrastructure-neutral contract package for versioned Plasius learning products. It defines learning paths, sellable module versions, course-material and hardware disclosures, deterministic assessment, bounded module-agent roles, evidence, and rewards.

The package does **not** provide HTTP handlers, persistence, authentication, Token accounting, model-provider calls, code execution, or UI components. Those concerns belong in consuming adapters.

## Junior Coder catalog

The initial immutable catalog is exported as
`JUNIOR_CODER_ROBOT_RESCUE_PATH_V1`. The current uniformly priced pilot
catalog is exported as `JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1`, with
`JUNIOR_CODER_ROBOT_RESCUE_PATH_CURRENT` available to adapters that
intentionally follow published successors. Each contains 19 independently
sellable, self-contained project modules:

- 8 original arcade game modules;
- 5 simulator-backed robotics modules;
- 3 constrained Vibe Coding modules;
- 3 web application modules.

Both catalogs remain in `pilot-grant-only` commercial state. The immutable
`1.1.0` modules each cost 50 Tokens (50,000 subunits), carrying a
non-redeemable £5 reference value. Price metadata is not authorization to
enable public checkout.

## Install

```bash
npm install @plasius/learning
```

## Validate a catalog

```ts
import {
  JUNIOR_CODER_ROBOT_RESCUE_PATH_CURRENT,
  assertValidLearningPath,
} from "@plasius/learning";

assertValidLearningPath(JUNIOR_CODER_ROBOT_RESCUE_PATH_CURRENT);
```

## Calculate an assessment

```ts
import { calculateAssessment } from "@plasius/learning";

const result = calculateAssessment(rubric, [
  { criterionId: "build", passed: true },
  { criterionId: "safety", passed: false },
]);

// A mandatory safety failure prevents completion regardless of total score.
console.log(result.score, result.completed);
```

## Contract rules

- Published IDs and versions are immutable.
- Reference prices are product-copy metadata and never create cash redemption
  rights.
- A module entitlement must bind to an exact module version.
- `admin-test-grant` is distinct from pilot, support and paid purchase sources;
  consuming services must not attach an economy transaction to it.
- Learner material never contains facilitator-only solutions or protected tests.
- Rubric criteria total exactly 100 points.
- Completion requires a score of at least 80 and every mandatory criterion.
- Module agents may explain evidence and propose a bounded next step, but cannot assign scores or rewards.
- Physical requirements are disclosed by a versioned manifest before purchase.

See [the foundation design](docs/design/junior-coder-catalog-foundation.md),
[the uniform pricing design](docs/design/junior-coder-uniform-pricing.md),
[ADR 0001](docs/adrs/adr-0001-learning-domain-and-catalog-boundary.md), and
[ADR 0002](docs/adrs/adr-0002-immutable-module-repricing-and-admin-test-source.md).

## Development

```bash
npm ci
npm run lint
npm run typecheck
npm run test:coverage
npm run build
npm run pack:check
```

Node.js 24 is required. Releases are published only through the approved GitHub
CD workflow on configurable trusted self-hosted runners. Release coverage and
the CycloneDX SBOM are retained even when an external coverage or provenance
service is unavailable. Release tags and GitHub Releases use a current-repository
GitHub App token with explicit Contents and Workflows write permissions; npm
publication continues to use only the protected `NPM_TOKEN`. Both release jobs
install a checksum-pinned GitHub CLI under `RUNNER_TEMP`, so runner images do
not need a mutable system-wide `gh` installation. Publication checks out the
verified current release-branch HEAD, including the workflow tooling used by a
`bump=none` recovery.
