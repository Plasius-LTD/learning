import { describe, expect, it } from "vitest";

import {
  CONTEXTUAL_HELP_CONTRACT_VERSION_V1,
  CONTEXTUAL_HELP_KINDS_V1,
  CONTEXTUAL_VOICE_INTENTS_V1,
  assertValidCanonicalSpokenHelpDescriptor,
  assertValidContextualHelpIdentifier,
  assertValidContextualVoiceQuestionResult,
  assertValidContextualVoiceQuestionMetadata,
  assertValidGuardianVoiceConsent,
  assertValidVoiceHelpAvailability,
  type CanonicalSpokenHelpDescriptorV1,
  type ContextualHelpIdentifierV1,
  type ContextualVoiceQuestionResultV1,
  type GuardianVoiceConsentV1,
  type VoiceHelpAvailabilityV1,
} from "../src/index.js";

const help: ContextualHelpIdentifierV1 = {
  schemaVersion: "1",
  contractVersion: CONTEXTUAL_HELP_CONTRACT_VERSION_V1,
  kind: "command",
  moduleId: "junior-coder.road-hopper-rally",
  moduleVersion: "1.1.0",
  manifestVersion: "1.0.0",
  helpId: "command.draw-lane",
};

describe("Junior Coder contextual-help contracts", () => {
  it("exports the closed help kinds and bounded voice intents", () => {
    expect(CONTEXTUAL_HELP_KINDS_V1).toEqual([
      "command",
      "visual-block",
      "generated-code",
      "assessment-diagnostic",
    ]);
    expect(CONTEXTUAL_VOICE_INTENTS_V1).toEqual([
      "describe-command",
      "describe-inputs",
      "show-example",
      "explain-assessment-failure",
      "suggest-next-experiment",
      "repeat",
      "stop",
      "unresolved",
    ]);
  });

  it("accepts only manifest-bound opaque help identifiers", () => {
    expect(() => assertValidContextualHelpIdentifier(help)).not.toThrow();
    expect(() => assertValidContextualHelpIdentifier({
      ...help,
      helpId: "Tell me whatever the child typed\n<script>",
    })).toThrow(/helpId/u);
    expect(() => assertValidContextualHelpIdentifier({
      ...help,
      moduleVersion: "latest",
    })).toThrow(/moduleVersion/u);
  });

  it("keeps voice consent separate, versioned and private-edge-only", () => {
    const consent: GuardianVoiceConsentV1 = {
      schemaVersion: "1",
      actorAccountId: "guardian-account-1",
      subjectAccountId: "managed-child-account-1",
      policyVersion: "1.0.0",
      state: "granted",
      permittedProcessingRoute: "private-edge-only",
      recordedAt: "2026-08-09T11:00:00.000Z",
    };

    expect(() => assertValidGuardianVoiceConsent(consent)).not.toThrow();
    expect(() => assertValidGuardianVoiceConsent({
      ...consent,
      permittedProcessingRoute: "cloud-transcription" as "private-edge-only",
    })).toThrow(/permittedProcessingRoute/u);
    expect(() => assertValidGuardianVoiceConsent({
      ...consent,
      recordedAt: "sometime",
    })).toThrow(/recordedAt/u);
  });

  it("describes canonical exact-cache audio without carrying speech text", () => {
    const descriptor: CanonicalSpokenHelpDescriptorV1 = {
      schemaVersion: "1",
      help,
      canonicalTextId: "help.command.draw-lane.summary",
      authoritativeTextDigest: `sha256:${"a".repeat(64)}`,
      locale: "en-GB",
      voiceProfile: "junior-coder-help-neutral",
      pronunciationVersion: "1.0.0",
      utteranceClass: "system-generic",
      sharingScope: "global",
      reuse: "exact-only",
      containsPersonalData: false,
      containsLearnerContent: false,
    };

    expect(() => assertValidCanonicalSpokenHelpDescriptor(descriptor)).not.toThrow();
    expect(descriptor).not.toHaveProperty("text");
    expect(() => assertValidCanonicalSpokenHelpDescriptor({
      ...descriptor,
      authoritativeTextDigest: "sha256:not-a-digest",
    })).toThrow(/authoritativeTextDigest/u);
  });

  it("marks recognised text as transient and denies score or reward authority", () => {
    const result: ContextualVoiceQuestionResultV1 = {
      schemaVersion: "1",
      help,
      intent: "show-example",
      status: "resolved",
      transientTranscript: "Show me an example",
      transcriptRetention: "request-memory-only",
      answer: {
        helpId: "command.draw-lane.example",
        source: "module-documentation",
        text: "Try the learner-safe example shown in the help card.",
      },
      suggestedActions: ["insert-example", "repeat", "stop"],
      mayAssignScore: false,
      mayAwardReward: false,
      mayPublish: false,
      mayControlHardware: false,
    };

    expect(() => assertValidContextualVoiceQuestionResult(result)).not.toThrow();
    expect(() => assertValidContextualVoiceQuestionResult({
      ...result,
      mayAssignScore: true as false,
    })).toThrow(/mayAssignScore/u);
  });

  it("fixes the microphone boundary at ten seconds, two MiB and private edge", () => {
    const availability: VoiceHelpAvailabilityV1 = {
      schemaVersion: "1",
      readAloudAvailable: true,
      microphoneAvailable: false,
      microphoneReason: "guardian-consent-required",
      questionProcessingRoute: "private-edge-only",
      guardianVoiceConsentRequired: true,
      maximumRecordingDurationMs: 10_000,
      maximumAudioBytes: 2_097_152,
      rawAudioRetention: "request-memory-only",
      transcriptRetention: "request-memory-only",
    };

    expect(() => assertValidVoiceHelpAvailability(availability)).not.toThrow();
    expect(() => assertValidVoiceHelpAvailability({
      ...availability,
      microphoneAvailable: true,
    })).toThrow(/microphoneReason/u);

    expect(() => assertValidContextualVoiceQuestionMetadata({
      schemaVersion: "1",
      help,
      locale: "en-GB",
      mediaType: "audio/webm",
      durationMs: 9_999,
      audioBytes: 2_097_152,
      assessmentEvidenceId: "criterion.lane-spacing",
    })).not.toThrow();
    expect(() => assertValidContextualVoiceQuestionMetadata({
      schemaVersion: "1",
      help,
      locale: "en-GB",
      mediaType: "audio/webm",
      durationMs: 10_001,
      audioBytes: 2_097_152,
    })).toThrow(/durationMs/u);
  });

  it("fails closed for unsupported versions, routes, limits and authorities", () => {
    expect(() => assertValidContextualHelpIdentifier({
      ...help,
      schemaVersion: "2" as "1",
    })).toThrow(/schemaVersion/u);
    expect(() => assertValidContextualHelpIdentifier({
      ...help,
      contractVersion: "2.0.0" as "1.0.0",
    })).toThrow(/contractVersion/u);
    expect(() => assertValidContextualHelpIdentifier({
      ...help,
      kind: "open-chat" as "command",
    })).toThrow(/kind/u);

    const consent: GuardianVoiceConsentV1 = {
      schemaVersion: "1",
      actorAccountId: "guardian-account-1",
      subjectAccountId: "managed-child-account-1",
      policyVersion: "1.0.0",
      state: "withdrawn",
      permittedProcessingRoute: "private-edge-only",
      recordedAt: "2026-08-09T11:00:00.000Z",
    };
    expect(() => assertValidGuardianVoiceConsent({
      ...consent,
      state: "expired" as "withdrawn",
    })).toThrow(/state/u);

    const metadata = {
      schemaVersion: "1" as const,
      help,
      locale: "en-GB",
      mediaType: "audio/webm",
      durationMs: 1_000,
      audioBytes: 1_024,
    };
    expect(() => assertValidContextualVoiceQuestionMetadata({
      ...metadata,
      mediaType: "text/plain",
    })).toThrow(/mediaType/u);
    expect(() => assertValidContextualVoiceQuestionMetadata({
      ...metadata,
      audioBytes: 2_097_153,
    })).toThrow(/audioBytes/u);

    const availability: VoiceHelpAvailabilityV1 = {
      schemaVersion: "1",
      readAloudAvailable: true,
      microphoneAvailable: true,
      microphoneReason: "available",
      questionProcessingRoute: "private-edge-only",
      guardianVoiceConsentRequired: true,
      maximumRecordingDurationMs: 10_000,
      maximumAudioBytes: 2_097_152,
      rawAudioRetention: "request-memory-only",
      transcriptRetention: "request-memory-only",
    };
    expect(() => assertValidVoiceHelpAvailability({
      ...availability,
      maximumAudioBytes: 1 as 2_097_152,
    })).toThrow(/limits/u);

    const descriptor: CanonicalSpokenHelpDescriptorV1 = {
      schemaVersion: "1",
      help,
      canonicalTextId: "help.command.draw-lane.summary",
      authoritativeTextDigest: `sha256:${"b".repeat(64)}`,
      locale: "en-GB",
      voiceProfile: "junior-coder-help-neutral",
      pronunciationVersion: "1.0.0",
      utteranceClass: "system-generic",
      sharingScope: "global",
      reuse: "exact-only",
      containsPersonalData: false,
      containsLearnerContent: false,
    };
    expect(() => assertValidCanonicalSpokenHelpDescriptor({
      ...descriptor,
      containsLearnerContent: true as false,
    })).toThrow(/exact-only/u);

    const result: ContextualVoiceQuestionResultV1 = {
      schemaVersion: "1",
      help,
      intent: "unresolved",
      status: "suggestions",
      transientTranscript: "Could you help?",
      transcriptRetention: "request-memory-only",
      suggestedActions: ["open-help"],
      mayAssignScore: false,
      mayAwardReward: false,
      mayPublish: false,
      mayControlHardware: false,
    };
    expect(() => assertValidContextualVoiceQuestionResult({
      ...result,
      status: "open-chat" as "suggestions",
    })).toThrow(/status/u);
    expect(() => assertValidContextualVoiceQuestionResult({
      ...result,
      suggestedActions: ["browse-web" as "open-help"],
    })).toThrow(/suggestedActions/u);
  });
});
