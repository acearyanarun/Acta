import Anthropic from "@anthropic-ai/sdk";
import { messageAsksForFinalAnswer } from "../../lib/prompt-builder.js";
import type { AiProvider, AiProviderRequest, AiProviderResult } from "./types.js";

const DEFAULT_MODEL = "claude-haiku-4-5-20251001"; // D-026

export type AnthropicProviderOptions = {
  apiKey: string;
  model?: string;
};

export function createAnthropicProvider(opts: AnthropicProviderOptions): AiProvider {
  const client = new Anthropic({ apiKey: opts.apiKey });
  const model = opts.model && opts.model.trim().length > 0 ? opts.model : DEFAULT_MODEL;

  return {
    name: "anthropic",
    async respond(req: AiProviderRequest): Promise<AiProviderResult> {
      const last = req.messages[req.messages.length - 1];
      const lastStudentText = last && last.role === "student" ? last.content : "";

      // Defense in depth (mirrors stub behavior): if the rule is on and the most
      // recent student message asks for the final answer, refuse without an API call.
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

      const messages = req.messages.map((m) => ({
        role: m.role === "student" ? ("user" as const) : ("assistant" as const),
        content: m.content,
      }));

      const result = await client.messages.create({
        model,
        max_tokens: 1024,
        system: req.systemPrompt,
        messages,
      });

      const text = result.content
        .filter((block): block is { type: "text"; text: string } => block.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();

      return { content: text || "(no response)", outcome: "answered" };
    },
  };
}
