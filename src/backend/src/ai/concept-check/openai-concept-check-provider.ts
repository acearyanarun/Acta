import type {
  ConceptCheckProvider,
  ConceptCheckProviderRequest,
  ConceptCheckProviderResult,
  GeneratedQuestion,
} from "./types.js";

const DEFAULT_MODEL = "gpt-4o-mini";
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

export type OpenAiConceptCheckProviderOptions = {
  apiKey: string;
  model?: string;
  fetchFn?: typeof fetch;
};

type ChatCompletion = {
  choices?: Array<{ message?: { content?: string | null } }>;
};

function parseQuestions(raw: unknown, expectedCount: number): GeneratedQuestion[] {
  if (!raw || typeof raw !== "object") {
    throw new Error("OpenAI concept-check response missing object root.");
  }
  const obj = raw as { questions?: unknown };
  if (!Array.isArray(obj.questions)) {
    throw new Error("OpenAI concept-check response missing 'questions' array.");
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
    throw new Error("OpenAI concept-check response yielded zero valid questions.");
  }
  return out;
}

export function createOpenAiConceptCheckProvider(
  opts: OpenAiConceptCheckProviderOptions,
): ConceptCheckProvider {
  const apiKey = opts.apiKey;
  const model = opts.model && opts.model.trim().length > 0 ? opts.model : DEFAULT_MODEL;
  const doFetch = opts.fetchFn ?? fetch;

  return {
    name: "openai",
    model,
    async generate(req: ConceptCheckProviderRequest): Promise<ConceptCheckProviderResult> {
      const res = await doFetch(OPENAI_CHAT_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: req.systemPrompt },
            {
              role: "user",
              content: `Generate exactly ${req.questionCount} concept-check question${
                req.questionCount === 1 ? "" : "s"
              } now. Output JSON only.`,
            },
          ],
          max_tokens: 2048,
          temperature: 0,
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) {
        throw new Error(`OpenAI concept-check failed: ${res.status} ${res.statusText}`);
      }
      const body = (await res.json()) as ChatCompletion;
      const text = body.choices?.[0]?.message?.content ?? "";
      // response_format=json_object guarantees the message is parseable JSON.
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch (_) {
        throw new Error("OpenAI concept-check response was not parseable JSON.");
      }
      const questions = parseQuestions(parsed, req.questionCount);
      return { questions };
    },
  };
}
