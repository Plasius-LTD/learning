# ADR 0009: Complete course project and progress contracts

Status: Accepted for implementation; release pending.
Date: 2026-09-20.
Tracking: learning #79; site Story #2236, Feature #1704, Epic #1701.

## Context

Seventeen Junior Coder modules provide a first interactive mission but need full
courses and the account-saving experience of the Paddle Pulse reference. Copying
its persistence service into every module would create inconsistent boundaries.
Published legacy curricula and account records must remain immutable.

## Decision

Add infrastructure-neutral, versioned course/project/progression contracts. A
complete course declares six missions with the existing nine ordered activities,
specific instruction/help, learner goals, function references and a declared set
of bounded project files. Structural validation rejects incomplete/reordered
manifests and undeclared fields. Runtime and editorial acceptance remain separate
requirements: 54 records alone never prove course completeness.

A browser draft contains only schema/content version, declared project files and
navigation. It cannot contain an account, score, progress or completion claim.
File order is canonical, paths have no directories/traversal, and both per-file
and total source are bounded. The host computes a canonical SHA-256 digest.

Progress is a distinct storage-owned contract. Only sequential verified activity
events advance it. Failed assessments may be inspected; repair and mission reward
require a passing assessment bound to the current source digest. Deterministic
scoring reuses the existing rubric calculator. Course completion additionally
requires all six missions and a passing capstone covering the accumulated project.
Replays and failed later attempts preserve earned completion. A saved navigation
cursor can revisit earned work but cannot unlock later activities.

The verified-activity and assessment-authority types are trusted host interfaces,
not request DTOs. Adapters must validate activity input, execute their own protected
checks, bind evidence to the authenticated account/version/source, and persist
conditional/idempotent transactions. Parsing storage records is shape validation,
not proof of their authorship. No browser-supplied proof may call the reducer
without host verification. Nine manual slots and an autosave have bounded IDs.

## Consequences and rollout

This package still has no HTTP, authentication, storage, execution or network
dependencies. No event collection is introduced, so the event producer NFR is
not applicable to these pure contracts. Hosts retain erasure, privacy, transaction,
timeout, execution and accessibility obligations.

The host Feature inherits `learning.junior-coder.workspace.enabled` and composed
catalogue/category/capability controls. A new-course version gate remains disabled
until the complete implementation is verified. Package publication uses approved
CI/CD before consumption; rollout never rewrites the old manifests or deletes
existing saves. A foundation release does not complete any of the seventeen
courses without their authored content, runtime, persistence and journey evidence.
