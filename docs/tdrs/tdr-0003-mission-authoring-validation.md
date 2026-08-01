# TDR 0003: Mission authoring validation

- Status: Accepted
- Date: 2026-08-01

Mission authoring uses a pure validator that receives one authoring bundle and
its immutable catalog module, then derives rubric, mission and badge authority
from that module. It returns structured issues for all detected failures so
authoring tools can highlight every problem in one pass. An assertion wrapper
is reserved for CI and package initialization.

The canonical stage order is data, not UI behavior. Completion authority comes
only from known deterministic rubric criteria. AI-required goals, missing
mandatory safety evidence, inaccessible single-mode interactions, answer
leakage, personal-data-bearing evidence and non-deterministic rewards fail
validation.

This keeps authoring reproducible and framework-independent while allowing site,
sandbox, printable and facilitator adapters to choose their own presentation.
