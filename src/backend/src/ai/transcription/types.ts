import type { TranscriptionProviderName } from "../../lib/types.js";

export type TranscriptionMimeType = "audio/webm" | "audio/mp4" | "audio/ogg" | "audio/wav";

export const ACCEPTED_MIME_TYPES: readonly TranscriptionMimeType[] = [
  "audio/webm",
  "audio/mp4",
  "audio/ogg",
  "audio/wav",
] as const;

export type TranscriptionProviderRequest = {
  /** In-memory only. Never persisted. Discarded after the response. */
  audio: Buffer;
  mimeType: TranscriptionMimeType;
  /** Optional locale hint. Default "en" inside the provider. */
  languageHint?: string;
  /** Context for logging only — never persisted as part of the transcript. */
  conceptCheckSetId: string;
  questionId: string;
};

export type TranscriptionProviderResult = {
  transcript: string;
  durationSec: number | null;
};

export type TranscriptionProvider = {
  readonly name: TranscriptionProviderName;
  readonly model: string | null;
  transcribe(req: TranscriptionProviderRequest): Promise<TranscriptionProviderResult>;
};
