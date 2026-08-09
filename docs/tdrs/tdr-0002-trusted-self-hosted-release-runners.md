# TDR-0002: Trusted self-hosted release runners

## Status

Superseded — 2026-08-09 by
[ADR-0006](../adrs/adr-0006-hosted-oidc-package-publication.md)

This document records the former self-hosted, token-authenticated publication
design. It is retained as decision history and is not the current release
policy.

## Decision

Both release preparation and npm publication run on the configurable
`CD_RUNNER_LABELS` repository variable, defaulting to
`["self-hosted", "Linux", "X64"]`. Publication remains bound to the protected
production environment. The reusable preparation job stays outside an
environment boundary. The caller explicitly maps the required organisation-owned
release-prep GitHub App key into the reusable workflow so GitHub validates the
credential contract before starting the job; that job cannot access the npm
publication token. The publication job mints a second installation token scoped
to the current repository with explicit Contents and Workflows write
permissions. That token is used only for checkout, immutable tag creation, and
GitHub Release finalization; npm publication remains authenticated solely by
the protected `NPM_TOKEN`.
Package validation and the coverage gate remain unchanged.

Both self-hosted release jobs install GitHub CLI 2.96.0 into `RUNNER_TEMP` from
the official Linux AMD64 archive and verify its published SHA-256 checksum
before adding it to the job path. Release correctness therefore does not depend
on mutable, system-wide runner tooling.

Release preparation returns the verified current release-branch HEAD as the
publication commit after version and changelog checks pass. This keeps
`bump=none` recovery attached to the current reviewed workflow tooling rather
than the historical commit that last changed `package.json`.

The release retains LCOV for 30 days and its CycloneDX SBOM for 90 days. npm's
provenance service currently requires a cloud-hosted runner. The workflow
therefore requests npm provenance only on a GitHub-hosted runner; a self-hosted
release uses the protected `NPM_TOKEN` and records a workflow notice. The public
repository still receives a GitHub SBOM artifact attestation through the
existing attestation step.

## Consequences

- Release execution no longer depends on GitHub-hosted runner billing.
- Only workflow-dispatch and reusable workflow-call entry points can reach the
  trusted production runners; pull-request code cannot invoke release jobs.
- The release-prep GitHub App remains the only credential allowed to write
  version metadata, tags, and GitHub Releases. Its publication-job token is
  restricted to the current repository and revoked when the job finishes,
  while npm publication remains protected by the production environment.
- GitHub CLI upgrades require an explicit version and checksum review in the
  repository rather than an untracked runner-image change.
- Recovery releases include the reviewed workflow and installer files present
  on the verified release branch.
- The repository preserves validation, retained evidence and GitHub SBOM
  attestation without making an unsupported npm provenance claim.
- If npm adds self-hosted trusted publishing later, the conditional publication
  branch can be removed after a separately reviewed release test.
