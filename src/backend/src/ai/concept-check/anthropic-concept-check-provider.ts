import Anthropic from "@anthropic-ai/sdk";
import type {
  ConceptCheckProvider,
  ConceptCheckProviderRequest,
  ConceptCheckProviderResult,
  GeneratedQuestion,
} from "./types.js";

const DEFAULT_MODEL = "claude-haiku-4-5-20251001"; // D-026

export type AnthropicConceptCheckProviderOptions = {
  apiKey: string;
  model?: string;
};

function extractJsonObject(text: string): unknown {
  // Strip code fences if present.
  const trimmed = text.trim();
  const fenced = trimmed.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  // Find first { and last } to be lenient on prose around JSON.
  const start = fenced.indexOf("{");
  const end = fenced.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Anthropic concept-check response was not JSON.");
  }
  return JSON.parse(fenced.slice(start, end + 1));
}

function parseQuestions(raw: unknown, expectedCount: number): GeneratedQuestion[] {
  if (!raw || typeof raw !== "object") {
    throw new Error("Anthropic concept-check response missing object root.");
  }
  const obj = raw as { questions?: unknown };
  if (!Array.isArray(obj.questions)) {
    throw new Error("Anthropic concept-check response missing 'questions' array.");
  }
  const out: GeneratedQuestion[] = [];
  for (const q of obj.questions) {
    if (!q || typeof q !== "object") continue;
    const rec = q as { prompt?: unknown; conceptTag?: unknown };
    if (typeof rec.prompt !== "string") continue;
    const prompt = rec.prompt.trim();
    if (prompt.length < 5 || prompt.length > 400) continue;
    const conceptTag =
      typeof rec.conceptTag === "string" && rec.conceptTag.trim().length > 0
        ? rec.conceptTag.trim().slice(0, 40)
        : undefined;
    out.push(conceptTag ? { prompt, conceptTag } : { prompt });
    if (out.length >= expectedCount) break;
  }
  if (out.length === 0) {
    throw new Error("Anthropic concept-check response yielded zero valid questions.");
  }
  return out;
}

export function createAnthropicConceptCheckProvider(
  opts: AnthropicConceptCheckProviderOptions,
): ConceptCheckProvider {
  const client = new Anthropic({ apiKey: opts.apiKey });
  const model = opts.model && opts.model.trim().length > 0 ? opts.model : DEFAULT_MODEL;

  return {
    name: "anthropic",
    model,
    async generate(req: ConceptCheckProviderRequest): Promise<ConceptCheckProviderResult> {
      const result = await client.messages.create({
        model,
        max_tokens: 2048,
        system: req.systemPrompt,
        messages: [
          {
            role: "user",
            content: `Generate exactly ${req.questionCount} concept-check question${req.questionCount === 1 ? "" : "s"} now. Output JSON only.`,
          },
        ],
      });

      const text = result.content
        .filter((b): b is { type: "text"; text: string } => b.type === "text")
        .map((b) => b.text)
        .join("\n");

      const raw = extractJsonObject(text);
      const questions = parseQuestions(raw, req.questionCount);
      return { questions };
    },
  };
}
