import Anthropic from "@anthropic-ai/sdk";
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

const DEFAULT_MODEL = "claude-haiku-4-5-20251001"; // D-026

const VALID_RESULTS = new Set<VerificationResult>(["pass", "needs_review", "fail"]);
const VALID_STATUSES = new Set<VerificationStatus>(["sufficient", "partial", "insufficient"]);

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  const start = fenced.indexOf("{");
  const end = fenced.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Anthropic verification response was not JSON.");
  }
  return JSON.parse(fenced.slice(start, end + 1));
}

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

export type AnthropicVerificationProviderOptions = {
  apiKey: string;
  model?: string;
};

export function createAnthropicVerificationProvider(
  opts: AnthropicVerificationProviderOptions,
): VerificationProvider {
  const client = new Anthropic({ apiKey: opts.apiKey });
  const model = opts.model && opts.model.trim().length > 0 ? opts.model : DEFAULT_MODEL;

  return {
    name: "anthropic",
    model,
    async evaluate(req: VerificationProviderRequest): Promise<VerificationProviderResult> {
      const completion = await client.messages.create({
        model,
        max_tokens: 2048,
        system: req.systemPrompt,
        messages: [
          {
            role: "user",
            content: "Evaluate now. Output JSON only in the approved shape.",
          },
        ],
      });

      const text = completion.content
        .filter((b): b is { type: "text"; text: string } => b.type === "text")
        .map((b) => b.text)
        .join("\n");

      const raw = extractJsonObject(text) as {
        result?: unknown;
        overallFeedback?: unknown;
        perQuestionFeedback?: unknown;
      };

      // D-036: strict result validation — throw on unknown.
      if (typeof raw.result !== "string" || !VALID_RESULTS.has(raw.result as VerificationResult)) {
        throw new Error(
          `Anthropic verification returned invalid result: ${JSON.stringify(raw.result)}`,
        );
      }
      let result = raw.result as VerificationResult;

      const overallFeedback = asString(raw.overallFeedback, 2_000) || "(no overall feedback)";

      // Build per-question feedback aligned to the set's questions. Missing rows are
      // filled with partial + diagnostic note (D-036), and the overall result is
      // conservatively downgraded if any are missing.
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
