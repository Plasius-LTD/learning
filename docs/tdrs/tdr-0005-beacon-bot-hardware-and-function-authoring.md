# TDR 0005: Beacon Bot hardware and function authoring

- Status: Accepted
- Date: 2026-08-09

Beacon Bot publishes four learner-safe C++-style simulator functions. Each
reference contains a signature, parameter descriptions, an observable effect
and one example. The functions describe a bounded simulator surface only; they
do not grant DOM, network, storage, browser or physical-hardware access.

The hardware projection mirrors every catalog item and quantity, marks the LED,
resistor and IR additions as incremental, and keeps all items pending bench
test. Compatibility claims and physical-completion eligibility are explicit
false values rather than inferred from copy. The validator rejects missing or
duplicated items, version drift, unsafe verification claims, hardware-control
authority and badge/evidence mismatches.

The site adapter may render these contracts, but adult acknowledgement,
entitlement, artifact generation and bench-test evidence remain application or
operations responsibilities outside this package.
