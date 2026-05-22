import { messageAsksForFinalAnswer } from "../../lib/prompt-builder.js";
import type { AiProvider, AiProviderRequest, AiProviderResult } from "./types.js";

const DEFAULT_MODEL = "gpt-4o-mini";
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

export type OpenAiProviderOptions = {
  apiKey: string;
  model?: string;
  /** Override for tests. Defaults to global fetch. */
  fetchFn?: typeof fetch;
};

type ChatCompletion = {
  choices?: Array<{ message?: { content?: string | null } }>;
};

/**
 * D-047-adjacent / D-003: OpenAI provider for student guided-help chat. Reads
 * the API key from the caller (which reads it from process.env via the env
 * loader). The key value never appears in source. Activated via the selector
 * only when `USE_REAL_LLM=true` AND `OPENAI_API_KEY` is set.
 *
 * Defense in depth: even when "restrict final answer" is on, the same client-side
 * refusal heuristic as the stub / Anthropic providers runs FIRST, so the API
 * call is skipped for obvious final-answer requests.
 */
export function createOpenAiProvider(opts: OpenAiProviderOptions): AiProvider {
  const apiKey = opts.apiKey;
  const model = opts.model && opts.model.trim().length > 0 ? opts.model : DEFAULT_MODEL;
  const doFetch = opts.fetchFn ?? fetch;

  return {
    name: "openai",
    async respond(req: AiProviderRequest): Promise<AiProviderResult> {
      const last = req.messages[req.messages.length - 1];
      const lastStudentText = last && last.role === "student" ? last.content : "";

      if (req.policy.aiHelp.restrictFinalAnswer && messageAsksForFinalAnswer(lastStudentText)) {
        return {
          content:
            "I can't give you the final answer for this assignment — the instructor " +
            'has the "Restrict final answer" rule on. I can offer a hint, a concept ' +
            "explanation, an analogous example, or debugging guidance — whichever the " +
            "policy permits. Which would help?",
          outcome: "refused",
          outcomeReason: "Final-answer request blocked by instructor policy.",
        };
      }

      // OpenAI uses {role: "system" | "user" | "assistant"}. Map student→user.
      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: req.systemPrompt },
        ...req.messages.map((m) => ({
          role: (m.role === "student" ? "user" : "assistant") as "user" | "assistant",
          content: m.content,
        })),
      ];

      const res = await doFetch(OPENAI_CHAT_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 1024,
          temperature: 0,
        }),
      });

      if (!res.ok) {
        throw new Error(`OpenAI chat completion failed: ${res.status} ${res.statusText}`);
      }
      const body = (await res.json()) as ChatCompletion;
      const text = (body.choices?.[0]?.message?.content ?? "").trim();
      return { content: text || "(no response)", outcome: "answered" };
    },
  };
}
