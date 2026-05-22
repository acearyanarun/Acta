import { createAnthropicVerificationProvider } from "./anthropic-verification-provider.js";
import { createOpenAiVerificationProvider } from "./openai-verification-provider.js";
import { createStubVerificationProvider } from "./stub-verification-provider.js";
import type { VerificationProvider } from "./types.js";

export type SelectVerificationProviderInput = {
  anthropicApiKey: string;
  anthropicModel?: string;
  useRealLlm?: boolean;
  openaiApiKey?: string;
  openaiModel?: string;
};

export type SelectVerificationProviderResult = {
  provider: VerificationProvider;
  reason: string;
};

export function selectVerificationProvider(
  input: SelectVerificationProviderInput,
): SelectVerificationProviderResult {
  if (input.anthropicApiKey.trim().length > 0) {
    return {
      provider: createAnthropicVerificationProvider({
        apiKey: input.anthropicApiKey,
        model: input.anthropicModel,
      }),
      reason: `ANTHROPIC_API_KEY set — using Anthropic verification provider (model: ${input.anthropicModel ?? "claude-haiku-4-5-20251001"}).`,
    };
  }
  if (input.useRealLlm && input.openaiApiKey && input.openaiApiKey.trim().length > 0) {
    return {
      provider: createOpenAiVerificationProvider({
        apiKey: input.openaiApiKey,
        model: input.openaiModel,
      }),
      reason: `USE_REAL_LLM=true + OPENAI_API_KEY set — using OpenAI verification provider (model: ${input.openaiModel ?? "gpt-4o-mini"}).`,
    };
  }
  return {
    provider: createStubVerificationProvider(),
    reason:
      "No LLM key + kill-switch combination — using deterministic stub verification provider (D-022/D-035).",
  };
}
