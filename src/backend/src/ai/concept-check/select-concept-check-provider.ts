import { createAnthropicConceptCheckProvider } from "./anthropic-concept-check-provider.js";
import { createOpenAiConceptCheckProvider } from "./openai-concept-check-provider.js";
import { createStubConceptCheckProvider } from "./stub-concept-check-provider.js";
import type { ConceptCheckProvider } from "./types.js";

export type SelectConceptCheckProviderInput = {
  anthropicApiKey: string;
  anthropicModel?: string;
  useRealLlm?: boolean;
  openaiApiKey?: string;
  openaiModel?: string;
};

export type SelectConceptCheckProviderResult = {
  provider: ConceptCheckProvider;
  reason: string;
};

export function selectConceptCheckProvider(
  input: SelectConceptCheckProviderInput,
): SelectConceptCheckProviderResult {
  if (input.anthropicApiKey.trim().length > 0) {
    return {
      provider: createAnthropicConceptCheckProvider({
        apiKey: input.anthropicApiKey,
        model: input.anthropicModel,
      }),
      reason: `ANTHROPIC_API_KEY set — using Anthropic concept-check provider (model: ${input.anthropicModel ?? "claude-haiku-4-5-20251001"}).`,
    };
  }
  if (input.useRealLlm && input.openaiApiKey && input.openaiApiKey.trim().length > 0) {
    return {
      provider: createOpenAiConceptCheckProvider({
        apiKey: input.openaiApiKey,
        model: input.openaiModel,
      }),
      reason: `USE_REAL_LLM=true + OPENAI_API_KEY set — using OpenAI concept-check provider (model: ${input.openaiModel ?? "gpt-4o-mini"}).`,
    };
  }
  return {
    provider: createStubConceptCheckProvider(),
    reason:
      "No LLM key + kill-switch combination — using deterministic stub concept-check provider (D-022/D-032).",
  };
}
