import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readWorkflow = (name: string): string =>
  readFileSync(new URL(`../.github/workflows/${name}.yml`, import.meta.url), "utf8");

const cdWorkflow = readWorkflow("cd");
const ciWorkflow = readWorkflow("ci");
const releasePrepareWorkflow = readWorkflow("release-prepare");
const installGithubCliScript = readFileSync(
  new URL("../.github/scripts/install-github-cli.sh", import.meta.url),
  "utf8",
);
const trustedProductionRunnerGroup =
  "group: ${{ vars.CD_RUNNER_GROUP || 'Public CI - Quarantined' }}";
const trustedProductionRunnerLabels =
  "labels: ${{ fromJSON(vars.CD_RUNNER_LABELS || '[\"self-hosted\",\"Linux\",\"X64\"]') }}";
const trustedCiRunnerGroup =
  "group: ${{ vars.CI_RUNNER_GROUP || 'Public CI - Quarantined' }}";
const trustedCiRunnerLabels =
  "labels: ${{ fromJSON(vars.CI_RUNNER_LABELS || '[\"self-hosted\",\"Linux\",\"X64\"]') }}";

describe("continuous integration workflow policy", () => {
  it("isolates public PR code and reserves quarantined runners for main CI", () => {
    expect(ciWorkflow).toMatch(
      /pull-request-build-test:\s*\n\s+if: github\.event_name == 'pull_request'\s*\n\s+runs-on: ubuntu-latest/u,
    );
    expect(ciWorkflow).toMatch(
      /main-build-test:\s*\n\s+if: github\.event_name == 'push'\s*\n\s+runs-on:\s*\n/u,
    );
    expect(ciWorkflow).toContain(trustedCiRunnerGroup);
    expect(ciWorkflow).toContain(trustedCiRunnerLabels);
    expect(ciWorkflow).not.toContain("runs-on: [self-hosted, Linux, X64]");
    expect(ciWorkflow).toMatch(/pull_request:\s*\n\s+branches: \[main\]/u);
    expect(ciWorkflow).toMatch(/push:\s*\n\s+branches: \[main\]/u);
    expect(ciWorkflow).toContain("steps: &ci_steps");
    expect(ciWorkflow).toContain("steps: *ci_steps");
  });
});

describe("production release workflow policy", () => {
  it("runs release preparation and publication on configurable trusted runners", () => {
    expect(cdWorkflow).toContain(trustedProductionRunnerGroup);
    expect(cdWorkflow).toContain(trustedProductionRunnerLabels);
    expect(releasePrepareWorkflow).toContain(trustedProductionRunnerGroup);
    expect(releasePrepareWorkflow).toContain(trustedProductionRunnerLabels);
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

  it("uses a least-privilege App token for workflow-bearing release tags", () => {
    expect(cdWorkflow).toContain(
      "name: Create release-finalization GitHub App token",
    );
    expect(cdWorkflow).toContain("permission-contents: write");
    expect(cdWorkflow).toContain("permission-workflows: write");
    expect(cdWorkflow).toContain(
      "token: ${{ steps.release_finalization_app_token.outputs.token }}",
    );
    expect(
      cdWorkflow.match(
        /GH_TOKEN: \$\{\{ steps\.release_finalization_app_token\.outputs\.token \}\}/gu,
      ),
    ).toHaveLength(3);
    expect(cdWorkflow).not.toContain(
      "GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}",
    );
  });

  it("installs a checksum-pinned GitHub CLI for every self-hosted release job", () => {
    expect(cdWorkflow).toContain("name: Install pinned GitHub CLI");
    expect(releasePrepareWorkflow).toContain(
      "name: Install pinned GitHub CLI",
    );
    expect(cdWorkflow).toContain(
      "run: .github/scripts/install-github-cli.sh",
    );
    expect(releasePrepareWorkflow).toContain(
      "run: .github/scripts/install-github-cli.sh",
    );
    expect(installGithubCliScript).toContain(
      'readonly GH_CLI_VERSION="2.96.0"',
    );
    expect(installGithubCliScript).toContain(
      'readonly GH_CLI_SHA256="83d5c2ccad5498f58bf6368acb1ab32588cf43ab3a4b1c301bf36328b1c8bd60"',
    );
    expect(installGithubCliScript).toContain(
      'actual_sha256="$(sha256sum "${GH_CLI_ARCHIVE}"',
    );
    expect(installGithubCliScript).toContain(
      '[[ "${actual_sha256}" != "${GH_CLI_SHA256}" ]]',
    );
    expect(installGithubCliScript).toContain('"${RUNNER_TEMP:?');
    expect(installGithubCliScript).toContain('"${GITHUB_PATH:?');
  });

  it("publishes from the verified current release branch head", () => {
    expect(releasePrepareWorkflow).toContain(
      'COMMIT_SHA=$(git rev-parse HEAD)',
    );
    expect(releasePrepareWorkflow).not.toContain(
      'git log -n 1 --format=%H -- "${PACKAGE_JSON}"',
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
    expect(cdWorkflow).toContain(
      "npm publish ${FLAGS} --provenance --registry",
    );
    expect(cdWorkflow).toContain(
      "npm publish ${FLAGS} --provenance=false --registry",
    );
  });

  it("does not request unsupported GitHub attestations for a private repository", () => {
    expect(cdWorkflow).toContain("github.event.repository.private == false");
    expect(cdWorkflow).toContain(
      "Report private-repository attestation limitation",
    );
  });
});
