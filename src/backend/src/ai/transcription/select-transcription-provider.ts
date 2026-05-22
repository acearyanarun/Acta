import { createOpenAiTranscriptionProvider } from "./openai-transcription-provider.js";
import { createStubTranscriptionProvider } from "./stub-transcription-provider.js";
import type { TranscriptionProvider } from "./types.js";

export type SelectTranscriptionProviderInput = {
  /** Master kill-switch for ALL real LLM calls (D-003). */
  useRealLlm: boolean;
  /** Master kill-switch for real transcription specifically (D-048). */
  useRealVoice: boolean;
  openaiApiKey: string;
  openaiTranscribeModel: string;
};

export type SelectTranscriptionProviderResult = {
  provider: TranscriptionProvider;
  reason: string;
};

/**
 * D-048 selector. Real OpenAI transcription only activates when ALL THREE
 * conditions hold:
 *   1. USE_REAL_LLM=true (the global LLM kill-switch)
 *   2. USE_REAL_VOICE=true (the voice-specific kill-switch)
 *   3. OPENAI_API_KEY is set
 * Otherwise the deterministic stub is used. Tests never trigger real calls.
 */
export function selectTranscriptionProvider(
  input: SelectTranscriptionProviderInput,
): SelectTranscriptionProviderResult {
  if (input.useRealLlm && input.useRealVoice && input.openaiApiKey.trim().length > 0) {
    return {
      provider: createOpenAiTranscriptionProvider({
        apiKey: input.openaiApiKey,
        model: input.openaiTranscribeModel,
      }),
      reason: `USE_REAL_LLM=true + USE_REAL_VOICE=true + OPENAI_API_KEY set — using OpenAI transcription (model: ${input.openaiTranscribeModel}).`,
    };
  }
  return {
    provider: createStubTranscriptionProvider(),
    reason:
      "Voice kill-switch off or OPENAI_API_KEY missing — using deterministic stub transcription provider (D-048).",
  };
}
