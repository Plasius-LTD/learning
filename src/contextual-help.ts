/** Additive contract version for touch-first and spoken contextual help. */
export const CONTEXTUAL_HELP_CONTRACT_VERSION_V1 = "1.0.0" as const;

export const CONTEXTUAL_HELP_KINDS_V1 = Object.freeze([
  "command",
  "visual-block",
  "generated-code",
  "assessment-diagnostic",
] as const);

export type ContextualHelpKindV1 = (typeof CONTEXTUAL_HELP_KINDS_V1)[number];

/**
 * Opaque, manifest-bound identifier. It contains no source, transcript,
 * learner identity or arbitrary synthesis text.
 */
export interface ContextualHelpIdentifierV1 {
  readonly schemaVersion: "1";
  readonly contractVersion: typeof CONTEXTUAL_HELP_CONTRACT_VERSION_V1;
  readonly kind: ContextualHelpKindV1;
  readonly moduleId: string;
  readonly moduleVersion: string;
  readonly manifestVersion: string;
  readonly helpId: string;
}

export type GuardianVoiceConsentStateV1 = "granted" | "withdrawn";
export type GuardianVoiceProcessingRouteV1 = "private-edge-only";

/** Voice consent is deliberately separate from general AI consent. */
export interface GuardianVoiceConsentV1 {
  readonly schemaVersion: "1";
  readonly actorAccountId: string;
  readonly subjectAccountId: string;
  readonly policyVersion: string;
  readonly state: GuardianVoiceConsentStateV1;
  readonly permittedProcessingRoute: GuardianVoiceProcessingRouteV1;
  readonly recordedAt: string;
}

export type VoiceHelpAvailabilityReasonV1 =
  | "available"
  | "module-access-required"
  | "guardian-consent-required"
  | "guardian-consent-withdrawn"
  | "age-or-safeguarding-gate"
  | "capability-disabled"
  | "rollout-disabled"
  | "private-edge-unavailable";

/** Read-aloud and microphone availability are evaluated independently. */
export interface VoiceHelpAvailabilityV1 {
  readonly schemaVersion: "1";
  readonly readAloudAvailable: boolean;
  readonly microphoneAvailable: boolean;
  readonly microphoneReason: VoiceHelpAvailabilityReasonV1;
  readonly questionProcessingRoute: GuardianVoiceProcessingRouteV1;
  readonly guardianVoiceConsentRequired: true;
  readonly maximumRecordingDurationMs: 10_000;
  readonly maximumAudioBytes: 2_097_152;
  readonly rawAudioRetention: "request-memory-only";
  readonly transcriptRetention: "request-memory-only";
}

/** Metadata accepted beside an authenticated multipart audio upload. */
export interface ContextualVoiceQuestionMetadataV1 {
  readonly schemaVersion: "1";
  readonly help: ContextualHelpIdentifierV1;
  readonly locale: string;
  readonly mediaType: string;
  readonly durationMs: number;
  readonly audioBytes: number;
  readonly assessmentEvidenceId?: string;
}

export const CONTEXTUAL_VOICE_INTENTS_V1 = Object.freeze([
  "describe-command",
  "describe-inputs",
  "show-example",
  "explain-assessment-failure",
  "suggest-next-experiment",
  "repeat",
  "stop",
  "unresolved",
] as const);

export type ContextualVoiceIntentV1 =
  (typeof CONTEXTUAL_VOICE_INTENTS_V1)[number];

export type ContextualVoiceSuggestedActionV1 =
  | "open-help"
  | "insert-example"
  | "show-inputs"
  | "show-assessment-evidence"
  | "try-next-experiment"
  | "repeat"
  | "stop"
  | "type-question";

export const CONTEXTUAL_VOICE_SUGGESTED_ACTIONS_V1 = Object.freeze([
  "open-help",
  "insert-example",
  "show-inputs",
  "show-assessment-evidence",
  "try-next-experiment",
  "repeat",
  "stop",
  "type-question",
] as const satisfies readonly ContextualVoiceSuggestedActionV1[]);

export interface ContextualVoiceAnswerV1 {
  readonly helpId: string;
  readonly source:
    | "module-documentation"
    | "assessment-evidence"
    | "authored-fallback";
  /** Server-resolved visible answer; never a model-authored open response. */
  readonly text: string;
}

/**
 * The transcript is returned only so the learner can verify recognition. The
 * request boundary must use no-store and discard it after the current view.
 */
export interface ContextualVoiceQuestionResultV1 {
  readonly schemaVersion: "1";
  readonly help: ContextualHelpIdentifierV1;
  readonly intent: ContextualVoiceIntentV1;
  readonly status: "resolved" | "suggestions" | "stopped";
  readonly transientTranscript: string;
  readonly transcriptRetention: "request-memory-only";
  readonly answer?: ContextualVoiceAnswerV1;
  readonly suggestedActions: ContextualVoiceSuggestedActionV1[];
  readonly mayAssignScore: false;
  readonly mayAwardReward: false;
  readonly mayPublish: false;
  readonly mayControlHardware: false;
}

/** Canonical audio lookup metadata. Authoritative speech text stays server-side. */
export interface CanonicalSpokenHelpDescriptorV1 {
  readonly schemaVersion: "1";
  readonly help: ContextualHelpIdentifierV1;
  readonly canonicalTextId: string;
  readonly authoritativeTextDigest: `sha256:${string}`;
  readonly locale: string;
  readonly voiceProfile: string;
  readonly pronunciationVersion: string;
  readonly utteranceClass: "system-generic";
  readonly sharingScope: "global";
  readonly reuse: "exact-only";
  readonly containsPersonalData: false;
  readonly containsLearnerContent: false;
}

const OPAQUE_ID = /^[a-z0-9]+(?:[._:-][a-z0-9]+)*$/u;
const SEMVER = /^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][A-Za-z0-9.-]+)?$/u;
const SHA_256 = /^sha256:[a-f0-9]{64}$/u;
const LOCALE = /^[a-z]{2,3}(?:-[A-Z]{2})?$/u;
const MEDIA_TYPE = /^audio\/[a-z0-9.+-]+$/u;

function containsDisallowedControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const code = character.codePointAt(0) ?? 0;
    return code <= 8 || code === 11 || code === 12
      || (code >= 14 && code <= 31) || code === 127;
  });
}

function requireOpaqueId(value: string, label: string, maximum = 160): void {
  if (value.length === 0 || value.length > maximum || !OPAQUE_ID.test(value)) {
    throw new Error(`${label} must be a bounded opaque identifier.`);
  }
}

function requireSemver(value: string, label: string): void {
  if (!SEMVER.test(value)) {
    throw new Error(`${label} must be an immutable semantic version.`);
  }
}

function requireIsoTimestamp(value: string, label: string): void {
  if (!/^\d{4}-\d{2}-\d{2}T/u.test(value) || !Number.isFinite(Date.parse(value))) {
    throw new Error(`${label} must be an ISO-8601 timestamp.`);
  }
}

export function assertValidContextualHelpIdentifier(
  value: ContextualHelpIdentifierV1,
): void {
  if (value.schemaVersion !== "1") {
    throw new Error("schemaVersion must be 1.");
  }
  if (value.contractVersion !== CONTEXTUAL_HELP_CONTRACT_VERSION_V1) {
    throw new Error("contractVersion is unsupported.");
  }
  if (!CONTEXTUAL_HELP_KINDS_V1.includes(value.kind)) {
    throw new Error("kind is unsupported.");
  }
  requireOpaqueId(value.moduleId, "moduleId");
  requireSemver(value.moduleVersion, "moduleVersion");
  requireSemver(value.manifestVersion, "manifestVersion");
  requireOpaqueId(value.helpId, "helpId");
}

export function assertValidGuardianVoiceConsent(
  value: GuardianVoiceConsentV1,
): void {
  if (value.schemaVersion !== "1") {
    throw new Error("schemaVersion must be 1.");
  }
  requireOpaqueId(value.actorAccountId, "actorAccountId");
  requireOpaqueId(value.subjectAccountId, "subjectAccountId");
  requireSemver(value.policyVersion, "policyVersion");
  if (value.state !== "granted" && value.state !== "withdrawn") {
    throw new Error("state must be granted or withdrawn.");
  }
  if (value.permittedProcessingRoute !== "private-edge-only") {
    throw new Error("permittedProcessingRoute must be private-edge-only.");
  }
  requireIsoTimestamp(value.recordedAt, "recordedAt");
}

export function assertValidContextualVoiceQuestionMetadata(
  value: ContextualVoiceQuestionMetadataV1,
): void {
  assertValidContextualHelpIdentifier(value.help);
  if (!LOCALE.test(value.locale)) throw new Error("locale is invalid.");
  if (!MEDIA_TYPE.test(value.mediaType)) throw new Error("mediaType is invalid.");
  if (!Number.isInteger(value.durationMs) || value.durationMs < 1 || value.durationMs > 10_000) {
    throw new Error("durationMs must be between 1 and 10000.");
  }
  if (!Number.isInteger(value.audioBytes) || value.audioBytes < 1 || value.audioBytes > 2_097_152) {
    throw new Error("audioBytes must be between 1 and 2097152.");
  }
  if (value.assessmentEvidenceId !== undefined) {
    requireOpaqueId(value.assessmentEvidenceId, "assessmentEvidenceId");
  }
}

export function assertValidVoiceHelpAvailability(
  value: VoiceHelpAvailabilityV1,
): void {
  if (value.schemaVersion !== "1") throw new Error("schemaVersion must be 1.");
  if (value.questionProcessingRoute !== "private-edge-only") {
    throw new Error("questionProcessingRoute must be private-edge-only.");
  }
  if (value.guardianVoiceConsentRequired !== true) {
    throw new Error("guardianVoiceConsentRequired must remain true.");
  }
  if (
    value.maximumRecordingDurationMs !== 10_000
    || value.maximumAudioBytes !== 2_097_152
    || value.rawAudioRetention !== "request-memory-only"
    || value.transcriptRetention !== "request-memory-only"
  ) {
    throw new Error("Voice limits and transient retention are immutable in version one.");
  }
  if (value.microphoneAvailable !== (value.microphoneReason === "available")) {
    throw new Error("microphoneReason must match microphone availability.");
  }
}

export function assertValidCanonicalSpokenHelpDescriptor(
  value: CanonicalSpokenHelpDescriptorV1,
): void {
  if (value.schemaVersion !== "1") throw new Error("schemaVersion must be 1.");
  assertValidContextualHelpIdentifier(value.help);
  requireOpaqueId(value.canonicalTextId, "canonicalTextId");
  if (!SHA_256.test(value.authoritativeTextDigest)) {
    throw new Error("authoritativeTextDigest must be a SHA-256 digest.");
  }
  if (!LOCALE.test(value.locale)) throw new Error("locale is invalid.");
  requireOpaqueId(value.voiceProfile, "voiceProfile");
  requireSemver(value.pronunciationVersion, "pronunciationVersion");
  if (
    value.utteranceClass !== "system-generic"
    || value.sharingScope !== "global"
    || value.reuse !== "exact-only"
    || value.containsPersonalData !== false
    || value.containsLearnerContent !== false
  ) {
    throw new Error("Canonical spoken help must use global system-generic exact-only reuse.");
  }
}

export function assertValidContextualVoiceQuestionResult(
  value: ContextualVoiceQuestionResultV1,
): void {
  if (value.schemaVersion !== "1") throw new Error("schemaVersion must be 1.");
  assertValidContextualHelpIdentifier(value.help);
  if (!CONTEXTUAL_VOICE_INTENTS_V1.includes(value.intent)) {
    throw new Error("intent is unsupported.");
  }
  if (value.transcriptRetention !== "request-memory-only") {
    throw new Error("transcriptRetention must be request-memory-only.");
  }
  if (value.status !== "resolved" && value.status !== "suggestions" && value.status !== "stopped") {
    throw new Error("status is unsupported.");
  }
  if (
    value.transientTranscript.length > 500
    || containsDisallowedControlCharacter(value.transientTranscript)
  ) {
    throw new Error("transientTranscript is invalid.");
  }
  if (value.answer) {
    requireOpaqueId(value.answer.helpId, "answer.helpId");
    if (
      (value.answer.source !== "module-documentation"
        && value.answer.source !== "assessment-evidence"
        && value.answer.source !== "authored-fallback")
      ||
      value.answer.text.length === 0
      || value.answer.text.length > 800
      || containsDisallowedControlCharacter(value.answer.text)
    ) {
      throw new Error("answer.text is invalid.");
    }
  }
  if (value.suggestedActions.some(
    (action) => !CONTEXTUAL_VOICE_SUGGESTED_ACTIONS_V1.includes(action),
  )) {
    throw new Error("suggestedActions contains an unsupported action.");
  }
  if (
    value.mayAssignScore !== false
    || value.mayAwardReward !== false
    || value.mayPublish !== false
    || value.mayControlHardware !== false
  ) {
    throw new Error("mayAssignScore, reward, publish and hardware authority must remain false.");
  }
}
