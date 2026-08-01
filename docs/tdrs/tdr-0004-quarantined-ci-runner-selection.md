# TDR 0004: Quarantined CI runner selection

- Status: Accepted
- Date: 2026-08-01

The public `learning` repository's pull-request and main CI explicitly selects
the governed `Public CI - Quarantined` runner group as well as the existing
`self-hosted`, `Linux` and `X64` labels. `CI_RUNNER_GROUP` and
`CI_RUNNER_LABELS` allow governed operator configuration while preserving the
quarantined defaults.

During the delivery incident, the label-only selector did not identify which
governed group GitHub was expected to use while pull-request runs remained
queued. Explicit group selection makes the intended trust boundary part of the
workflow contract and matches the established release-job pattern. Runner
listener health and GitHub scheduling remain separate operational concerns.

The group remains restricted to selected repositories and allowlisted workflow
paths. CI keeps its existing least-privilege permissions, lint, typecheck,
runtime dependency audit, build, unit coverage, retained LCOV and best-effort
Codecov behavior. No GitHub-hosted fallback is permitted.
