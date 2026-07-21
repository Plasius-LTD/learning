# @plasius/learning

`@plasius/learning` is the framework- and infrastructure-neutral contract package for versioned Plasius learning products. It defines learning paths, sellable module versions, course-material and hardware disclosures, deterministic assessment, bounded module-agent roles, evidence, and rewards.

The package does **not** provide HTTP handlers, persistence, authentication, Token accounting, model-provider calls, code execution, or UI components. Those concerns belong in consuming adapters.

## Junior Coder catalog

The initial catalog is exported as `JUNIOR_CODER_ROBOT_RESCUE_PATH_V1`. It contains 19 independently sellable, self-contained project modules:

- 8 original arcade game modules;
- 5 simulator-backed robotics modules;
- 3 constrained Vibe Coding modules;
- 3 web application modules.

The catalog is in `pilot-grant-only` commercial state. Its prices are shadow prices for pilot measurement and are not authorization to enable public checkout.

## Install

```bash
npm install @plasius/learning
```

## Validate a catalog

```ts
import {
  JUNIOR_CODER_ROBOT_RESCUE_PATH_V1,
  assertValidLearningPath,
} from "@plasius/learning";

assertValidLearningPath(JUNIOR_CODER_ROBOT_RESCUE_PATH_V1);
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
- A module entitlement must bind to an exact module version.
- Learner material never contains facilitator-only solutions or protected tests.
- Rubric criteria total exactly 100 points.
- Completion requires a score of at least 80 and every mandatory criterion.
- Module agents may explain evidence and propose a bounded next step, but cannot assign scores or rewards.
- Physical requirements are disclosed by a versioned manifest before purchase.

See [the foundation design](docs/design/junior-coder-catalog-foundation.md) and [ADR 0001](docs/adrs/adr-0001-learning-domain-and-catalog-boundary.md).

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
service is unavailable.
