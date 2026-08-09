# Junior Coder static project publishing contracts

## Purpose

Provide one infrastructure-neutral contract boundary for creating a private,
scanned snapshot, reviewing its exact digest, and representing an unlisted
public pointer. The package does not implement hosting.

## Lifecycle

`completed assessment → safe scan → immutable snapshot → adult exact-hash approval → publication → renewal, expiry or unpublish`

Snapshot validation requires:

- a current contract and scanner version;
- a supported web-project module and matching render kind;
- canonical SHA-256 source and snapshot digests;
- a source size from 1 to 8,000 characters;
- a deterministic score from 80 to 100;
- mandatory safety success;
- all eight named scanner checks; and
- one complete allow-listed render model.

Approval records the adult actor, exact snapshot identifier and digest,
statement version and timestamp. Publication records the immutable bindings,
random slug, HTTPS URL, state and expiry. Renewal and unpublish timestamps are
optional lifecycle evidence and may not change the snapshot binding.

## Exclusions

The package contains no HTTP routes, cookies, accounts, family relationships,
database client, cloud SDK, HTML renderer, analytics or search index. Those
belong to consuming applications and must fail closed independently.
