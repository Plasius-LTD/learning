# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

- **Added**
  - (placeholder)

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)

## [0.2.0] - 2026-07-28

- **Added**
  - Added an immutable `1.1.0` Junior Coder path containing nineteen
    independently versioned modules at a uniform 50 Token / non-redeemable £5
    reference price.
  - Added canonical GBP reference-price metadata and an explicit
    `admin-test-grant` entitlement source that is distinct from economic
    purchases.

- **Changed**
  - Exposed `JUNIOR_CODER_ROBOT_RESCUE_PATH_CURRENT` for server adapters that
    deliberately follow published catalog successors while preserving the
    original `1.0.0` manifest unchanged.

- **Fixed**
  - Routed public-repository release preparation and npm publication explicitly
    through the quarantined self-hosted runner group while retaining its
    workflow and repository allowlists.
  - Selected the verified current release-branch HEAD for publication so a
    `bump=none` recovery cannot check out workflow tooling from an older package
    metadata commit.
  - Installed a checksum-pinned GitHub CLI in both self-hosted release jobs so
    tag and GitHub Release finalization do not depend on runner image state.
  - Finalized workflow-bearing version tags and GitHub Releases with a
    current-repository GitHub App token that has explicit Contents and
    Workflows write permissions, while keeping npm publication on
    `NPM_TOKEN`.

- **Security**
  - (placeholder)

## [0.1.0] - 2026-07-26

### Added

- Initial versioned learning-domain contracts and deterministic assessment model.
- Validated Robot Rescue Arcade path containing 19 self-contained pilot modules.
- Hardware, course-material, agent, entitlement, evidence, badge, and publishing snapshot contracts.
- Architecture, technical direction, design, legal, security, and delivery documentation.

### Fixed

- Routed release preparation and npm publication through configurable trusted
  self-hosted runners, retaining LCOV and SBOM evidence while avoiding
  unsupported npm/private-repository provenance paths.
- Kept reusable release preparation outside the publication environment so
  inherited organisation GitHub App credentials remain available.
- Declared and mapped the release-prep GitHub App key explicitly at the
  reusable-workflow boundary so missing credentials fail during validation.


[0.1.0]: https://github.com/Plasius-LTD/learning/releases/tag/v0.1.0
[0.2.0]: https://github.com/Plasius-LTD/learning/releases/tag/v0.2.0
