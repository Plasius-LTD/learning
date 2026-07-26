# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

- **Added**
  - (placeholder)

- **Changed**
  - (placeholder)

- **Fixed**
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
