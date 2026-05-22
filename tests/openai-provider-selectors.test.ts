import { describe, expect, it, vi } from "vitest";
import { createOpenAiConceptCheckProvider } from "../src/backend/src/ai/concept-check/openai-concept-check-provider.js";
import { selectConceptCheckProvider } from "../src/backend/src/ai/concept-check/select-concept-check-provider.js";
import type {
  ConceptCheckProviderRequest,
  GeneratedQuestion,
} from "../src/backend/src/ai/concept-check/types.js";
import { createOpenAiProvider } from "../src/backend/src/ai/providers/openai-provider.js";
import { selectProvider } from "../src/backend/src/ai/providers/select-provider.js";
import type { AiProviderRequest } from "../src/backend/src/ai/providers/types.js";
import { createOpenAiVerificationProvider } from "../src/backend/src/ai/verification/openai-verification-provider.js";
import { selectVerificationProvider } from "../src/backend/src/ai/verification/select-verification-provider.js";
import type { VerificationProviderRequest } from "../src/backend/src/ai/verification/types.js";
import type {
  AiHelpPolicy,
  AssignmentPolicyVersion,
  Submission,
} from "../src/backend/src/lib/types.js";

const ALL_AI: AiHelpPolicy = {
  conceptExplanation: true,
  hints: true,
  examples: true,
  debuggingGuidance: true,
  restrictFinalAnswer: true,
};

const SAMPLE_POLICY: AssignmentPolicyVersion = {
  id: "pv-1",
  assignmentId: "a-1",
  tenantId: "t",
  instructorId: "i",
  version: 1,
  title: "T",
  instructions: "I",
  rubric: null,
  aiHelp: ALL_AI,
  aiHelpEnabled: true,
  verificationMode: "score",
  policyHash: "f".repeat(64),
  createdAt: new Date().toISOString(),
};

const SAMPLE_SUBMISSION: Submission = {
  id: "sub-1",
  tenantId: "t",
  assignmentId: "a-1",
  studentId: "s",
  policyVersionId: "pv-1",
  policyVersion: 1,
  policyHash: "f".repeat(64),
  content: "I argue the relationship is linear because the residuals are Gaussian.",
  contentHash: "c".repeat(64),
  submittedAt: new Date().toISOString(),
};

function mockChatResponse(content: string, ok = true, status = 200): Response {
  return new Response(
    JSON.stringify({
      choices: [{ message: { role: "assistant", content } }],
    }),
    { status, statusText: ok ? "OK" : "Error", headers: { "content-type": "application/json" } },
  );
}

// ---------- Selectors ----------

describe("selectProvider (D-003 priority)", () => {
  it("picks stub when neither key is set", () => {
    const r = selectProvider({ anthropicApiKey: "" });
    expect(r.provider.name).toBe("stub");
  });
  it("picks anthropic when ANTHROPIC_API_KEY is set (USE_REAL_LLM irrelevant)", () => {
    const r = selectProvider({ anthropicApiKey: "sk-ant-test", useRealLlm: false });
    expect(r.provider.name).toBe("anthropic");
  });
  it("picks openai when ANTHROPIC is empty + USE_REAL_LLM=true + OPENAI_API_KEY set", () => {
    const r = selectProvider({
      anthropicApiKey: "",
      useRealLlm: true,
      openaiApiKey: "sk-proj-test",
    });
    expect(r.provider.name).toBe("openai");
  });
  it("falls back to stub when OPENAI_API_KEY set but USE_REAL_LLM=false (safe default)", () => {
    const r = selectProvider({
      anthropicApiKey: "",
      useRealLlm: false,
      openaiApiKey: "sk-proj-test",
    });
    expect(r.provider.name).toBe("stub");
  });
  it("falls back to stub when USE_REAL_LLM=true but OPENAI_API_KEY empty", () => {
    const r = selectProvider({ anthropicApiKey: "", useRealLlm: true, openaiApiKey: "" });
    expect(r.provider.name).toBe("stub");
  });
  it("Anthropic wins over OpenAI when both are set", () => {
    const r = selectProvider({
      anthropicApiKey: "sk-ant-test",
      useRealLlm: true,
      openaiApiKey: "sk-proj-test",
    });
    expect(r.provider.name).toBe("anthropic");
  });
});

describe("selectConceptCheckProvider (D-003 priority)", () => {
  it("stub default", () => {
    expect(selectConceptCheckProvider({ anthropicApiKey: "" }).provider.name).toBe("stub");
  });
  it("openai when only OPENAI set + kill-switch on", () => {
    const r = selectConceptCheckProvider({
      anthropicApiKey: "",
      useRealLlm: true,
      openaiApiKey: "sk-proj-test",
    });
    expect(r.provider.name).toBe("openai");
  });
  it("anthropic wins over openai", () => {
    const r = selectConceptCheckProvider({
      anthropicApiKey: "sk-ant-test",
      useRealLlm: true,
      openaiApiKey: "sk-proj-test",
    });
    expect(r.provider.name).toBe("anthropic");
  });
});

describe("selectVerificationProvider (D-003 priority)", () => {
  it("stub default", () => {
    expect(selectVerificationProvider({ anthropicApiKey: "" }).provider.name).toBe("stub");
  });
  it("openai when only OPENAI set + kill-switch on", () => {
    const r = selectVerificationProvider({
      anthropicApiKey: "",
      useRealLlm: true,
      openaiApiKey: "sk-proj-test",
    });
    expect(r.provider.name).toBe("openai");
  });
  it("anthropic wins over openai", () => {
    const r = selectVerificationProvider({
      anthropicApiKey: "sk-ant-test",
      useRealLlm: true,
      openaiApiKey: "sk-proj-test",
    });
    expect(r.provider.name).toBe("anthropic");
  });
});

// ---------- Help provider behavior (with mocked fetch) ----------

describe("createOpenAiProvider", () => {
  it("posts to /v1/chat/completions with bearer auth + correct model", async () => {
    const fetchFn = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(String(url)).toBe("https://api.openai.com/v1/chat/completions");
      expect(init?.method).toBe("POST");
      const headers = init?.headers as Record<string, string>;
      expect(headers.Authorization).toBe("Bearer sk-proj-test");
      const body = JSON.parse(init?.body as string);
      expect(body.model).toBe("gpt-4o-mini");
      return mockChatResponse("Sure — here's a hint.");
    });
    const provider = createOpenAiProvider({ apiKey: "sk-proj-test", fetchFn });
    const req: AiProviderRequest = {
      policy: SAMPLE_POLICY,
      systemPrompt: "(system)",
      messages: [{ role: "student", content: "How do I start?" }],
    };
    const r = await provider.respond(req);
    expect(r.outcome).toBe("answered");
    expect(r.content).toBe("Sure — here's a hint.");
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("refuses final-answer asks WITHOUT calling fetch when restrictFinalAnswer is on", async () => {
    const fetchFn = vi.fn();
    const provider = createOpenAiProvider({ apiKey: "sk-proj-test", fetchFn });
    const r = await provider.respond({
      policy: SAMPLE_POLICY,
      systemPrompt: "(system)",
      messages: [{ role: "student", content: "Just give me the answer please" }],
    });
    expect(r.outcome).toBe("refused");
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("throws on non-2xx response", async () => {
    const fetchFn = vi.fn(async () => mockChatResponse("nope", false, 401));
    const provider = createOpenAiProvider({ apiKey: "bad-key", fetchFn });
    await expect(
      provider.respond({
        policy: SAMPLE_POLICY,
        systemPrompt: "(system)",
        messages: [{ role: "student", content: "x" }],
      }),
    ).rejects.toThrow(/401/);
  });

  it("honors a custom model", async () => {
    const fetchFn = vi.fn(async (_url, init?: RequestInit) => {
      const body = JSON.parse(init?.body as string);
      expect(body.model).toBe("gpt-4o");
      return mockChatResponse("hi");
    });
    const provider = createOpenAiProvider({ apiKey: "x", model: "gpt-4o", fetchFn });
    await provider.respond({
      policy: SAMPLE_POLICY,
      systemPrompt: "s",
      messages: [{ role: "student", content: "hi" }],
    });
    expect(fetchFn).toHaveBeenCalled();
  });

  it("never leaks the API key into the response shape", async () => {
    const secret = "sk-proj-NEVER-IN-RESPONSE";
    const fetchFn = vi.fn(async () => mockChatResponse("ok"));
    const provider = createOpenAiProvider({ apiKey: secret, fetchFn });
    const r = await provider.respond({
      policy: SAMPLE_POLICY,
      systemPrompt: "s",
      messages: [{ role: "student", content: "hi" }],
    });
    expect(JSON.stringify(r)).not.toContain(secret);
  });
});

// ---------- Concept-check provider behavior ----------

describe("createOpenAiConceptCheckProvider", () => {
  function ccReq(): ConceptCheckProviderRequest {
    return {
      policy: SAMPLE_POLICY,
      submission: SAMPLE_SUBMISSION,
      questionCount: 2,
      systemPrompt: "(system)",
    };
  }

  it("requests response_format json_object", async () => {
    const fetchFn = vi.fn(async (_url, init?: RequestInit) => {
      const body = JSON.parse(init?.body as string);
      expect(body.response_format).toEqual({ type: "json_object" });
      expect(body.model).toBe("gpt-4o-mini");
      return mockChatResponse(
        JSON.stringify({
          questions: [
            { prompt: "Why did you choose linear regression?", conceptTag: "linearity" },
            { prompt: "What assumptions justify least squares here?" },
          ],
        }),
      );
    });
    const provider = createOpenAiConceptCheckProvider({ apiKey: "k", fetchFn });
    const r = await provider.generate(ccReq());
    expect(r.questions).toHaveLength(2);
    const q0 = r.questions[0] as GeneratedQuestion;
    expect(q0.prompt).toContain("linear");
  });

  it("rejects non-JSON content", async () => {
    const fetchFn = vi.fn(async () => mockChatResponse("not json at all"));
    const provider = createOpenAiConceptCheckProvider({ apiKey: "k", fetchFn });
    await expect(provider.generate(ccReq())).rejects.toThrow(/parseable JSON/);
  });

  it("rejects when questions array missing", async () => {
    const fetchFn = vi.fn(async () => mockChatResponse(JSON.stringify({ foo: 1 })));
    const provider = createOpenAiConceptCheckProvider({ apiKey: "k", fetchFn });
    await expect(provider.generate(ccReq())).rejects.toThrow(/questions/);
  });
});

// ---------- Verification provider behavior ----------

describe("createOpenAiVerificationProvider", () => {
  const questions = [
    { id: "q1", ordinal: 1, prompt: "Explain your approach." },
    { id: "q2", ordinal: 2, prompt: "What assumptions did you make?" },
  ];

  function vReq(): VerificationProviderRequest {
    return {
      policy: SAMPLE_POLICY,
      submission: SAMPLE_SUBMISSION,
      questions,
      answers: [
        { questionId: "q1", answer: "Because residuals were Gaussian." },
        { questionId: "q2", answer: "I assumed independence and constant noise." },
      ],
      systemPrompt: "(system)",
    };
  }

  it("parses a well-formed pass response", async () => {
    const fetchFn = vi.fn(async () =>
      mockChatResponse(
        JSON.stringify({
          result: "pass",
          overallFeedback: "Solid reasoning.",
          perQuestionFeedback: [
            { questionId: "q1", status: "sufficient", feedback: "Good." },
            { questionId: "q2", status: "sufficient", feedback: "Good." },
          ],
        }),
      ),
    );
    const provider = createOpenAiVerificationProvider({ apiKey: "k", fetchFn });
    const r = await provider.evaluate(vReq());
    expect(r.result).toBe("pass");
    expect(r.perQuestionFeedback).toHaveLength(2);
  });

  it("D-036 downgrades pass→needs_review when a question is missing in the evaluator output", async () => {
    const fetchFn = vi.fn(async () =>
      mockChatResponse(
        JSON.stringify({
          result: "pass",
          overallFeedback: "ok",
          perQuestionFeedback: [
            { questionId: "q1", status: "sufficient", feedback: "good" },
            // q2 missing
          ],
        }),
      ),
    );
    const provider = createOpenAiVerificationProvider({ apiKey: "k", fetchFn });
    const r = await provider.evaluate(vReq());
    expect(r.result).toBe("needs_review");
    expect(r.perQuestionFeedback.find((f) => f.questionId === "q2")?.feedback).toBe(
      "no response in evaluator output",
    );
  });

  it("throws on invalid result value", async () => {
    const fetchFn = vi.fn(async () =>
      mockChatResponse(
        JSON.stringify({
          result: "definitely_not_a_real_enum",
          overallFeedback: "x",
          perQuestionFeedback: [],
        }),
      ),
    );
    const provider = createOpenAiVerificationProvider({ apiKey: "k", fetchFn });
    await expect(provider.evaluate(vReq())).rejects.toThrow(/invalid result/);
  });
});
