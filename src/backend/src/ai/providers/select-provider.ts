import { createAnthropicProvider } from "./anthropic-provider.js";
import { createOpenAiProvider } from "./openai-provider.js";
import { createStubProvider } from "./stub-provider.js";
import type { AiProvider } from "./types.js";

export type SelectProviderInput = {
  anthropicApiKey: string;
  anthropicModel?: string;
  /** D-003 master kill-switch. Real LLM calls only happen when this is true. */
  useRealLlm?: boolean;
  openaiApiKey?: string;
  openaiModel?: string;
};

export type SelectProviderResult = {
  provider: AiProvider;
  reason: string;
};

/**
 * Selection priority (D-003):
 *   1. ANTHROPIC_API_KEY set      → Anthropic (existing D-022 behavior unchanged).
 *   2. USE_REAL_LLM=true + OPENAI_API_KEY set → OpenAI.
 *   3. Otherwise                  → deterministic stub.
 *
 * The stub is the safe default. A key present in .env alone never produces a
 * network call; OPENAI_API_KEY only activates when USE_REAL_LLM=true is also
 * set, so demo data + tests stay deterministic.
 */
export function selectProvider(input: SelectProviderInput): SelectProviderResult {
  if (input.anthropicApiKey.trim().length > 0) {
    return {
      provider: createAnthropicProvider({
        apiKey: input.anthropicApiKey,
        model: input.anthropicModel,
      }),
      reason: `ANTHROPIC_API_KEY set — using Anthropic provider (model: ${input.anthropicModel ?? "claude-haiku-4-5-20251001"}).`,
    };
  }
  if (input.useRealLlm && input.openaiApiKey && input.openaiApiKey.trim().length > 0) {
    return {
      provider: createOpenAiProvider({
        apiKey: input.openaiApiKey,
        model: input.openaiModel,
      }),
      reason: `USE_REAL_LLM=true + OPENAI_API_KEY set — using OpenAI provider (model: ${input.openaiModel ?? "gpt-4o-mini"}).`,
    };
  }
  return {
    provider: createStubProvider(),
    reason: "No LLM key + kill-switch combination — using deterministic stub provider (D-022).",
  };
}
