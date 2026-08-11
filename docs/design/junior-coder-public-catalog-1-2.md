# Junior Coder public catalog 1.2.0

## Contract

Catalog 1.2.0 is the public successor to the 1.1.0 pilot. It contains the same
nineteen independently purchasable modules and gives each module a new 1.2.0
identity with a fixed price of 50 Tokens.

The catalog package only publishes immutable learning metadata. A host must
authenticate the purchasing adult, debit a purpose-bound Module Allowance in an
ACID transaction, create an immutable child entitlement, and authorize the
child launch against that exact entitlement.

## Compatibility

Versions 1.0.0 and 1.1.0 remain exported. Consumers that require reproducible
behavior pin an exact version; consumers that intentionally follow publication
decisions may use `JUNIOR_CODER_ROBOT_RESCUE_PATH_CURRENT`.
