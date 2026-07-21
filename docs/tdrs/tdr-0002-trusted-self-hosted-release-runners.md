# TDR-0002: Trusted self-hosted release runners

## Status

Accepted — 2026-07-21

## Decision

Both release preparation and npm publication run on the configurable
`CD_RUNNER_LABELS` repository variable, defaulting to
`["self-hosted", "Linux", "X64"]`. The production environment, release-prep
GitHub App, package validation, coverage gate, immutable tag, GitHub Release and
protected npm token remain unchanged.

The release retains LCOV for 30 days and its CycloneDX SBOM for 90 days. npm's
provenance service currently requires a cloud-hosted runner and does not support
private source repositories. The workflow therefore requests npm provenance
only for a public repository on a GitHub-hosted runner; a self-hosted or private
release uses the protected `NPM_TOKEN` and records a workflow notice. GitHub
artifact attestation is likewise skipped for this private repository on the
organisation's current plan, while the SBOM itself remains retained.

## Consequences

- Release execution no longer depends on GitHub-hosted runner billing.
- Only workflow-dispatch and reusable workflow-call entry points can reach the
  trusted production runners; pull-request code cannot invoke release jobs.
- The repository preserves validation and durable evidence, but cannot claim
  unsupported npm or GitHub provenance.
- If npm adds self-hosted trusted publishing later, the conditional publication
  branch can be removed after a separately reviewed release test.
