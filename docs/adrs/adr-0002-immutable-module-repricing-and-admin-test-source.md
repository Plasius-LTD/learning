# ADR 0002: Immutable module repricing and administrator test source

- Status: Accepted
- Date: 2026-07-28
- Task: `Plasius-LTD/learning#11`
- Parent Story: `Plasius-LTD/plasius-ltd-site#1736`

## Context

The published Junior Coder `1.0.0` modules carry different pilot shadow
prices. The product decision is now one £5-equivalent price for each course.
The published economy reference rate assigns a nominal 10p value to one Token,
so the module price is 50 Tokens or 50,000 Token subunits.

Administrators also need unrestricted testing access. Representing that access
as an infinite wallet or Module Allowance would violate bounded amount,
double-entry and reconciliation invariants.

## Decision

Keep the complete `1.0.0` path unchanged and add a `1.1.0` successor. Every
module in the new path:

- is independently versioned as `1.1.0`;
- costs 50,000 Token subunits;
- records 500 GBP minor units as a nominal, non-redeemable reference price;
- retains the existing pilot-only commercial state and safeguards.

Reference metadata remains infrastructure-neutral and creates no dependency on
`@plasius/economy`.

Add `admin-test-grant` as a distinct entitlement source. A consuming service
may use it only for server-authorised testing and must not bind it to a wallet,
ledger transaction or paid receipt.

## Consequences

- Existing entitlements and citations to `1.0.0` remain stable.
- Consumers choose explicitly between the old version, the `1.1.0` version or
  the `CURRENT` release-following alias.
- Public checkout remains disabled by the commercial state and consuming
  service rollout controls.
- Administrator testing can be audited without manufacturing economic value.
- Future price changes require another immutable module and path version.
