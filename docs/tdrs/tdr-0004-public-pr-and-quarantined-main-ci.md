# TDR 0004: Public PR and quarantined main CI

- Status: Accepted
- Date: 2026-08-01

Public pull-request code runs on an isolated GitHub-hosted Linux runner with
read-only workflow permissions. Main-branch CI explicitly selects the governed
`Public CI - Quarantined` group and the existing `self-hosted`, `Linux` and
`X64` labels. `CI_RUNNER_GROUP` and `CI_RUNNER_LABELS` allow governed operator
configuration while preserving those main-branch defaults.

The quarantined group allowlists workflow paths at `main`. A `pull_request`
workflow executes from its PR ref, so sending it to that restricted group leaves
the run ineligible even while listeners are idle. Weakening the allowlist or
executing mutable public PR code on trusted infrastructure would undermine the
runner boundary. GitHub-hosted PR isolation preserves validation without
granting the PR access to the release-bearing runner.

Both event paths share one anchored step list, retaining lint, typecheck,
runtime dependency audit, build, unit coverage, retained LCOV and best-effort
Codecov behavior. Main CI remains on the approved quarantined self-hosted path;
final npm publication moved to hosted OIDC under
[ADR-0008](../adrs/adr-0008-hosted-oidc-package-publication.md).
