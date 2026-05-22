import type {
  PerQuestionFeedback,
  VerificationResult,
  VerificationStatus,
} from "../../lib/types.js";
import type {
  VerificationProvider,
  VerificationProviderRequest,
  VerificationProviderResult,
} from "./types.js";

const DEFAULT_MODEL = "gpt-4o-mini";
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

const VALID_RESULTS = new Set<VerificationResult>(["pass", "needs_review", "fail"]);
const VALID_STATUSES = new Set<VerificationStatus>(["sufficient", "partial", "insufficient"]);

export type OpenAiVerificationProviderOptions = {
  apiKey: string;
  model?: string;
  fetchFn?: typeof fetch;
};

type ChatCompletion = {
  choices?: Array<{ message?: { content?: string | null } }>;
};

function asString(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
}

function asStatus(v: unknown): VerificationStatus {
  if (typeof v === "string" && VALID_STATUSES.has(v as VerificationStatus)) {
    return v as VerificationStatus;
  }
  return "partial"; // D-036: conservative fallback
}

function downgrade(result: VerificationResult): VerificationResult {
  // D-036: never silently upgrade past needs_review on incomplete output.
  return result === "pass" ? "needs_review" : result;
}

export function createOpenAiVerificationProvider(
  opts: OpenAiVerificationProviderOptions,
): VerificationProvider {
  const apiKey = opts.apiKey;
  const model = opts.model && opts.model.trim().length > 0 ? opts.model : DEFAULT_MODEL;
  const doFetch = opts.fetchFn ?? fetch;

  return {
    name: "openai",
    model,
    async evaluate(req: VerificationProviderRequest): Promise<VerificationProviderResult> {
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
            { role: "user", content: "Evaluate now. Output JSON only in the approved shape." },
          ],
          max_tokens: 2048,
          temperature: 0,
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) {
        throw new Error(`OpenAI verification failed: ${res.status} ${res.statusText}`);
      }
      const body = (await res.json()) as ChatCompletion;
      const text = body.choices?.[0]?.message?.content ?? "";

      let raw: { result?: unknown; overallFeedback?: unknown; perQuestionFeedback?: unknown };
      try {
        raw = JSON.parse(text) as typeof raw;
      } catch (_) {
        throw new Error("OpenAI verification response was not parseable JSON.");
      }

      if (typeof raw.result !== "string" || !VALID_RESULTS.has(raw.result as VerificationResult)) {
        throw new Error(
          `OpenAI verification returned invalid result: ${JSON.stringify(raw.result)}`,
        );
      }
      let result = raw.result as VerificationResult;

      const overallFeedback = asString(raw.overallFeedback, 2_000) || "(no overall feedback)";

      const incoming = Array.isArray(raw.perQuestionFeedback) ? raw.perQuestionFeedback : [];
      const byId = new Map<string, { status: VerificationStatus; feedback: string }>();
      for (const row of incoming) {
        if (!row || typeof row !== "object") continue;
        const r = row as { questionId?: unknown; status?: unknown; feedback?: unknown };
        if (typeof r.questionId !== "string") continue;
        byId.set(r.questionId, {
          status: asStatus(r.status),
          feedback: asString(r.feedback, 1_000) || "(no feedback)",
        });
      }

      let missing = 0;
      const perQuestion: PerQuestionFeedback[] = req.questions.map((q) => {
        const found = byId.get(q.id);
        if (found) return { questionId: q.id, status: found.status, feedback: found.feedback };
        missing += 1;
        return {
          questionId: q.id,
          status: "partial" as const,
          feedback: "no response in evaluator output",
        };
      });

      if (missing > 0) {
        result = downgrade(result);
      }

      return { result, overallFeedback, perQuestionFeedback: perQuestion };
    },
  };
}
