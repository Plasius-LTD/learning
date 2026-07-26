import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readWorkflow = (name: string): string =>
  readFileSync(new URL(`../.github/workflows/${name}.yml`, import.meta.url), "utf8");

const cdWorkflow = readWorkflow("cd");
const releasePrepareWorkflow = readWorkflow("release-prepare");
const trustedProductionRunner =
  "runs-on: ${{ fromJSON(vars.CD_RUNNER_LABELS || '[\"self-hosted\",\"Linux\",\"X64\"]') }}";

describe("production release workflow policy", () => {
  it("runs release preparation and publication on configurable trusted runners", () => {
    expect(cdWorkflow).toContain(trustedProductionRunner);
    expect(releasePrepareWorkflow).toContain(trustedProductionRunner);
    expect(cdWorkflow).not.toContain("runs-on: ubuntu-latest");
    expect(releasePrepareWorkflow).not.toContain("runs-on: ubuntu-latest");
  });

  it("keeps inherited release-preparation secrets outside environment shadowing", () => {
    expect(cdWorkflow).toContain("environment: production");
    expect(releasePrepareWorkflow).not.toContain("environment: production");
    expect(cdWorkflow).toContain(
      "RELEASE_PREP_APP_PRIVATE_KEY: ${{ secrets.RELEASE_PREP_APP_PRIVATE_KEY }}",
    );
    expect(releasePrepareWorkflow).toMatch(
      /secrets:\s*\n\s+RELEASE_PREP_APP_PRIVATE_KEY:[\s\S]*?\n\s+required: true\s*\n\s+outputs:/u,
    );
    expect(releasePrepareWorkflow).toContain(
      "private-key: ${{ secrets.RELEASE_PREP_APP_PRIVATE_KEY }}",
    );
  });

  it("keeps release workflows off pull-request triggers", () => {
    expect(cdWorkflow).toMatch(/on:\s*\n\s+workflow_dispatch:/u);
    expect(releasePrepareWorkflow).toMatch(/on:\s*\n\s+workflow_call:/u);
    expect(cdWorkflow).not.toMatch(/\n\s+pull_request(?:_target)?:/u);
    expect(releasePrepareWorkflow).not.toMatch(/\n\s+pull_request(?:_target)?:/u);
  });

  it("retains release evidence and only requests npm provenance when supported", () => {
    expect(cdWorkflow).toContain("name: release-coverage-lcov");
    expect(cdWorkflow).toContain("name: release-sbom");
    expect(cdWorkflow).toContain('RUNNER_ENVIRONMENT: ${{ runner.environment }}');
    expect(cdWorkflow).toContain('REPOSITORY_PRIVATE: ${{ github.event.repository.private }}');
    expect(cdWorkflow).toContain("npm publish ${FLAGS} --provenance");
    expect(cdWorkflow).toContain("npm publish ${FLAGS} --registry");
  });

  it("does not request unsupported GitHub attestations for a private repository", () => {
    expect(cdWorkflow).toContain("github.event.repository.private == false");
    expect(cdWorkflow).toContain(
      "Report private-repository attestation limitation",
    );
  });
});
