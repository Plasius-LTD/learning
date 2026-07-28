# Junior Coder uniform module pricing

## Work definition

- Epic: `Plasius-LTD/plasius-ltd-site#1701`
- Feature: `Plasius-LTD/plasius-ltd-site#1703`
- Story: `Plasius-LTD/plasius-ltd-site#1736`
- Task: `Plasius-LTD/learning#11`
- Rollout flag owned by the consuming site:
  `learning.junior-coder.purchase.enabled`

## Contract

`JUNIOR_CODER_ROBOT_RESCUE_PATH_V1` remains the initial `1.0.0` publication.
`JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1` is its uniformly priced successor.

Every `1.1.0` module binds:

```text
50 Tokens = 50,000 Token subunits = £5 nominal reference value
```

The GBP value has `cashRedemptionAllowed: false`. It describes product value
under the economy reference rate; it is not money, stored value or a promise
that Tokens can be exchanged for cash.

## Administrator testing boundary

The package names `admin-test-grant` so adapters can distinguish test access
from:

- administrative pilot grants;
- customer-support grants; and
- settled Module Allowance purchases.

The package does not grant access or mutate balances. Consuming services must
authenticate administrators, evaluate rollout flags, prevent the source from
entering economic settlement, and expose test state honestly.

## Validation

- all nineteen new modules have version `1.1.0`;
- every new price is exactly 50,000 subunits;
- every reference price is canonical GBP metadata for 500 minor units;
- malformed reference values fail catalog validation;
- the `1.0.0` module versions and price list remain unchanged;
- category counts, materials, rubrics, agents and hardware rules continue to
  pass the complete package validator.
