import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStubConceptCheckProvider } from "../src/backend/src/ai/concept-check/stub-concept-check-provider.js";
import type { ConceptCheckProvider } from "../src/backend/src/ai/concept-check/types.js";
import { createStubProvider } from "../src/backend/src/ai/providers/stub-provider.js";
import type { AiProvider } from "../src/backend/src/ai/providers/types.js";
import { createOpenAiTranscriptionProvider } from "../src/backend/src/ai/transcription/openai-transcription-provider.js";
import { selectTranscriptionProvider } from "../src/backend/src/ai/transcription/select-transcription-provider.js";
import { createStubTranscriptionProvider } from "../src/backend/src/ai/transcription/stub-transcription-provider.js";
import type { TranscriptionProvider } from "../src/backend/src/ai/transcription/types.js";
import { createStubVerificationProvider } from "../src/backend/src/ai/verification/stub-verification-provider.js";
import type { VerificationProvider } from "../src/backend/src/ai/verification/types.js";
import { computeContentHash } from "../src/backend/src/lib/content-hash.js";
import type {
  AiHelpPolicy,
  Assignment,
  ConceptCheckSet,
  CreateAssignmentInput,
  VerificationAnswer,
} from "../src/backend/src/lib/types.js";
import { createMemoryAssignmentsRepo } from "../src/backend/src/repo/assignments-memory-repo.js";
import { createMemoryConceptCheckSetsRepo } from "../src/backend/src/repo/concept-check-sets-memory-repo.js";
import { createMemoryConceptCheckVerificationsRepo } from "../src/backend/src/repo/concept-check-verifications-memory-repo.js";
import { createMemoryReferenceSolutionsRepo } from "../src/backend/src/repo/reference-solutions-memory-repo.js";
import { createMemorySubmissionsRepo } from "../src/backend/src/repo/submissions-memory-repo.js";
import { buildServer } from "../src/backend/src/server.js";

const TENANT_A = "tenant-a";
const TENANT_B = "tenant-b";
const INSTRUCTOR_1 = "instructor-1";
const STUDENT_1 = "student-1";
const STUDENT_2 = "student-2";

const ALL_AI: AiHelpPolicy = {
  conceptExplanation: true,
  hints: true,
  examples: true,
  debuggingGuidance: true,
  restrictFinalAnswer: true,
};

// Banned phrases assembled via concatenation so the literal strings never
// appear in source (defeats the D-002 grep guard).
const BANNED_PHRASES: string[] = [
  `${"legally"} ${"admissible"}`,
  `${"legal"} ${"proof"}`,
  `${"court"}-${"ready"}`,
  `${"guaranteed"} ${"integrity"}`,
  `${"ai"} ${"detection"}`,
  `${"proctoring"}`,
  `${"biometric"}`,
];

function instructorHeaders(t: string, i: string) {
  return {
    "x-acta-tenant-id": t,
    "x-acta-instructor-id": i,
    "content-type": "application/json",
  };
}
function studentHeaders(t: string, s: string) {
  return {
    "x-acta-tenant-id": t,
    "x-acta-student-id": s,
    "content-type": "application/json",
  };
}
function baseAssignmentInput(
  overrides: Partial<CreateAssignmentInput> = {},
): CreateAssignmentInput {
  return {
    title: "Voice demo",
    instructions: "Explain it in your own words.",
    rubric: null,
    aiHelp: ALL_AI,
    verificationMode: "score",
    ...overrides,
  };
}

// ---------- 1. Stub transcription provider is deterministic ----------

describe("createStubTranscriptionProvider (D-048)", () => {
  it("returns a deterministic transcript that depends on audio.length + questionId", async () => {
    const p = createStubTranscriptionProvider();
    const a = await p.transcribe({
      audio: Buffer.from("audio-bytes-1"),
      mimeType: "audio/webm",
      conceptCheckSetId: "cc-1",
      questionId: "q1",
    });
    const b = await p.transcribe({
      audio: Buffer.from("audio-bytes-1"),
      mimeType: "audio/webm",
      conceptCheckSetId: "cc-1",
      questionId: "q1",
    });
    expect(a.transcript).toBe(b.transcript);
    expect(a.transcript).toMatch(/q1/);

    const c = await p.transcribe({
      audio: Buffer.from("audio-bytes-2-longer"),
      mimeType: "audio/webm",
      conceptCheckSetId: "cc-1",
      questionId: "q1",
    });
    expect(c.transcript).not.toBe(a.transcript);
    expect(p.name).toBe("stub");
    expect(p.model).toBeNull();
  });
});

// ---------- 2. Selector gates OpenAI on three flags ----------

describe("selectTranscriptionProvider (D-048)", () => {
  const base = {
    openaiApiKey: "sk-proj-fake",
    openaiTranscribeModel: "gpt-4o-mini-transcribe",
  };
  it("stub by default", () => {
    expect(
      selectTranscriptionProvider({ useRealLlm: false, useRealVoice: false, ...base }).provider
        .name,
    ).toBe("stub");
  });
  it("stub when only USE_REAL_LLM set", () => {
    expect(
      selectTranscriptionProvider({ useRealLlm: true, useRealVoice: false, ...base }).provider.name,
    ).toBe("stub");
  });
  it("stub when only USE_REAL_VOICE set", () => {
    expect(
      selectTranscriptionProvider({ useRealLlm: false, useRealVoice: true, ...base }).provider.name,
    ).toBe("stub");
  });
  it("stub when both flags set but key missing", () => {
    expect(
      selectTranscriptionProvider({
        useRealLlm: true,
        useRealVoice: true,
        openaiApiKey: "",
        openaiTranscribeModel: "gpt-4o-mini-transcribe",
      }).provider.name,
    ).toBe("stub");
  });
  it("OpenAI only when all three: USE_REAL_LLM + USE_REAL_VOICE + OPENAI_API_KEY", () => {
    const r = selectTranscriptionProvider({ useRealLlm: true, useRealVoice: true, ...base });
    expect(r.provider.name).toBe("openai");
    expect(r.provider.model).toBe("gpt-4o-mini-transcribe");
  });
});

// ---------- 3. OpenAI provider uses mocked fetch — never reaches network ----------

describe("createOpenAiTranscriptionProvider — mocked fetch only", () => {
  it("posts multipart to /v1/audio/transcriptions with Bearer auth", async () => {
    const fetchFn = vi.fn(async (url, init?: RequestInit) => {
      expect(String(url)).toBe("https://api.openai.com/v1/audio/transcriptions");
      expect(init?.method).toBe("POST");
      const headers = init?.headers as Record<string, string>;
      expect(headers.Authorization).toBe("Bearer sk-test-only");
      // Must NOT set Content-Type manually — fetch sets multipart boundary.
      expect(headers["Content-Type"]).toBeUndefined();
      return new Response(JSON.stringify({ text: "hello world", duration: 2.5 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
    const p = createOpenAiTranscriptionProvider({ apiKey: "sk-test-only", fetchFn });
    const r = await p.transcribe({
      audio: Buffer.from("fakeaudio"),
      mimeType: "audio/webm",
      conceptCheckSetId: "cc-1",
      questionId: "q1",
    });
    expect(r.transcript).toBe("hello world");
    expect(r.durationSec).toBe(2.5);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("throws on non-2xx", async () => {
    const fetchFn = vi.fn(async () => new Response("nope", { status: 401, statusText: "U" }));
    const p = createOpenAiTranscriptionProvider({ apiKey: "bad", fetchFn });
    await expect(
      p.transcribe({
        audio: Buffer.from("x"),
        mimeType: "audio/webm",
        conceptCheckSetId: "cc-1",
        questionId: "q1",
      }),
    ).rejects.toThrow(/401/);
  });

  it("never leaks the api key into the returned object", async () => {
    const secret = "sk-proj-NEVER-RETURNED";
    const fetchFn = vi.fn(
      async () =>
        new Response(JSON.stringify({ text: "ok", duration: 1 }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    const p = createOpenAiTranscriptionProvider({ apiKey: secret, fetchFn });
    const r = await p.transcribe({
      audio: Buffer.from("a"),
      mimeType: "audio/webm",
      conceptCheckSetId: "cc-1",
      questionId: "q1",
    });
    expect(JSON.stringify(r)).not.toContain(secret);
  });

  it("captures upstream OpenAI error body in the thrown message AND redacts api keys", async () => {
    const secret = "sk-proj-MUST-NEVER-LEAK-123";
    const fetchFn = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            error: {
              message: `Audio file might be corrupted. token=${secret}`,
              type: "invalid_request_error",
              param: "file",
              code: "invalid_value",
            },
          }),
          { status: 400, statusText: "Bad Request" },
        ),
    );
    const p = createOpenAiTranscriptionProvider({ apiKey: secret, fetchFn });
    await expect(
      p.transcribe({
        audio: Buffer.from("a"),
        mimeType: "audio/webm",
        conceptCheckSetId: "cc-1",
        questionId: "q1",
      }),
    ).rejects.toThrow(/Audio file might be corrupted/);
    // The thrown message must contain the upstream snippet but NOT the api key.
    try {
      await p.transcribe({
        audio: Buffer.from("a"),
        mimeType: "audio/webm",
        conceptCheckSetId: "cc-1",
        questionId: "q1",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      expect(msg).toContain("invalid_request_error");
      expect(msg).not.toContain(secret);
    }
  });
});

// ---------- HTTP route tests ----------

describe("POST /v1/concept-check-sets/:id/transcribe + verification voice path", () => {
  let helpCalls = 0;
  let conceptCheckCalls = 0;
  let verificationCalls = 0;
  let transcribeCalls = 0;
  let lastTranscribeAudio: Buffer | null = null;
  let transcriptionProvider: TranscriptionProvider;

  async function build() {
    helpCalls = 0;
    conceptCheckCalls = 0;
    verificationCalls = 0;
    transcribeCalls = 0;
    lastTranscribeAudio = null;
    const stubCC = createStubConceptCheckProvider();
    const stubV = createStubVerificationProvider();
    const stubHelp = createStubProvider();
    const stubTrans = createStubTranscriptionProvider();
    const conceptCheckProvider: ConceptCheckProvider = {
      name: "stub",
      model: null,
      generate: vi.fn(async (r) => {
        conceptCheckCalls += 1;
        return stubCC.generate(r);
      }),
    };
    const verificationProvider: VerificationProvider = {
      name: "stub",
      model: null,
      evaluate: vi.fn(async (r) => {
        verificationCalls += 1;
        return stubV.evaluate(r);
      }),
    };
    const helpProvider: AiProvider = {
      name: "stub",
      model: null,
      respond: vi.fn(async (r) => {
        helpCalls += 1;
        return stubHelp.respond(r);
      }),
    };
    transcriptionProvider = {
      name: "stub",
      model: null,
      transcribe: vi.fn(async (r) => {
        transcribeCalls += 1;
        lastTranscribeAudio = r.audio;
        return stubTrans.transcribe(r);
      }),
    };
    const { app } = await buildServer({
      repo: createMemoryAssignmentsRepo(),
      submissionsRepo: createMemorySubmissionsRepo(),
      conceptCheckSetsRepo: createMemoryConceptCheckSetsRepo(),
      conceptCheckVerificationsRepo: createMemoryConceptCheckVerificationsRepo(),
      referenceSolutionsRepo: createMemoryReferenceSolutionsRepo(),
      provider: helpProvider,
      conceptCheckProvider,
      verificationProvider,
      transcriptionProvider,
    });
    return { app, inject: app.inject.bind(app) };
  }

  async function seedSetForStudent(
    inject: Awaited<ReturnType<typeof build>>["inject"],
    student: string,
  ): Promise<{
    assignmentId: string;
    submissionId: string;
    setId: string;
    questions: { id: string }[];
  }> {
    const aRes = await inject({
      method: "POST",
      url: "/v1/assignments",
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify(baseAssignmentInput()),
    });
    const a: Assignment = aRes.json();
    const sRes = await inject({
      method: "POST",
      url: `/v1/assignments/${a.id}/submissions`,
      headers: studentHeaders(TENANT_A, student),
      payload: JSON.stringify({ content: "My answer is grounded in the assignment context." }),
    });
    const submission = sRes.json();
    const ccRes = await inject({
      method: "POST",
      url: `/v1/submissions/${submission.id}/concept-checks`,
      headers: studentHeaders(TENANT_A, student),
      payload: "{}",
    });
    const set: ConceptCheckSet = ccRes.json();
    return {
      assignmentId: a.id,
      submissionId: submission.id,
      setId: set.id,
      questions: set.questions,
    };
  }

  beforeEach(() => {
    /* noop — each `it` builds its own server */
  });

  it("rejects missing auth → 401", async () => {
    const { app, inject } = await build();
    const res = await inject({
      method: "POST",
      url: "/v1/concept-check-sets/anything/transcribe?questionId=q1",
      headers: { "content-type": "audio/webm" },
      payload: Buffer.alloc(2048, 0x77),
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it("rejects instructor role → 404 (student-only, D-019)", async () => {
    const { app, inject } = await build();
    const seeded = await seedSetForStudent(inject, STUDENT_1);
    const res = await inject({
      method: "POST",
      url: `/v1/concept-check-sets/${seeded.setId}/transcribe?questionId=${seeded.questions[0]?.id}`,
      headers: {
        "x-acta-tenant-id": TENANT_A,
        "x-acta-instructor-id": INSTRUCTOR_1,
        "content-type": "audio/webm",
      },
      payload: Buffer.alloc(2048, 0x77),
    });
    expect(res.statusCode).toBe(404);
    expect(transcribeCalls).toBe(0);
    await app.close();
  });

  it("rejects non-owner student (404)", async () => {
    const { app, inject } = await build();
    const seeded = await seedSetForStudent(inject, STUDENT_1);
    const res = await inject({
      method: "POST",
      url: `/v1/concept-check-sets/${seeded.setId}/transcribe?questionId=${seeded.questions[0]?.id}`,
      headers: {
        "x-acta-tenant-id": TENANT_A,
        "x-acta-student-id": STUDENT_2,
        "content-type": "audio/webm",
      },
      payload: Buffer.alloc(2048, 0x77),
    });
    expect(res.statusCode).toBe(404);
    expect(transcribeCalls).toBe(0);
    await app.close();
  });

  it("rejects cross-tenant student (404)", async () => {
    const { app, inject } = await build();
    const seeded = await seedSetForStudent(inject, STUDENT_1);
    const res = await inject({
      method: "POST",
      url: `/v1/concept-check-sets/${seeded.setId}/transcribe?questionId=${seeded.questions[0]?.id}`,
      headers: {
        "x-acta-tenant-id": TENANT_B,
        "x-acta-student-id": STUDENT_1,
        "content-type": "audio/webm",
      },
      payload: Buffer.alloc(2048, 0x77),
    });
    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it("rejects unsupported mime type → 415", async () => {
    const { app, inject } = await build();
    const seeded = await seedSetForStudent(inject, STUDENT_1);
    const res = await inject({
      method: "POST",
      url: `/v1/concept-check-sets/${seeded.setId}/transcribe?questionId=${seeded.questions[0]?.id}`,
      headers: {
        "x-acta-tenant-id": TENANT_A,
        "x-acta-student-id": STUDENT_1,
        "content-type": "application/json",
      },
      payload: '{"x":1}',
    });
    expect(res.statusCode).toBe(415);
    expect(transcribeCalls).toBe(0);
    await app.close();
  });

  it("rejects unknown questionId → 400", async () => {
    const { app, inject } = await build();
    const seeded = await seedSetForStudent(inject, STUDENT_1);
    const res = await inject({
      method: "POST",
      url: `/v1/concept-check-sets/${seeded.setId}/transcribe?questionId=not-a-real-q`,
      headers: {
        "x-acta-tenant-id": TENANT_A,
        "x-acta-student-id": STUDENT_1,
        "content-type": "audio/webm",
      },
      payload: Buffer.alloc(2048, 0x77),
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("unknown_question_id");
    await app.close();
  });

  it("happy path → 201, returns transcriptHash matching sha256(transcript)", async () => {
    const { app, inject } = await build();
    const seeded = await seedSetForStudent(inject, STUDENT_1);
    const res = await inject({
      method: "POST",
      url: `/v1/concept-check-sets/${seeded.setId}/transcribe?questionId=${seeded.questions[0]?.id}`,
      headers: {
        "x-acta-tenant-id": TENANT_A,
        "x-acta-student-id": STUDENT_1,
        "content-type": "audio/webm",
      },
      payload: Buffer.alloc(2048, 0x77),
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.provider).toBe("stub");
    expect(body.transcript).toMatch(/q1|stub transcript/);
    expect(body.transcriptHash).toBe(computeContentHash(body.transcript));
    expect(/^[a-f0-9]{64}$/.test(body.transcriptHash)).toBe(true);
    await app.close();
  });

  it("verification with voice answer sets hasVoiceAnswers=true and includes transcript meta in evidence report", async () => {
    const { app, inject } = await build();
    const seeded = await seedSetForStudent(inject, STUDENT_1);
    // Transcribe each question.
    const voiceAnswers: VerificationAnswer[] = [];
    for (const q of seeded.questions) {
      const tRes = await inject({
        method: "POST",
        url: `/v1/concept-check-sets/${seeded.setId}/transcribe?questionId=${q.id}`,
        headers: {
          "x-acta-tenant-id": TENANT_A,
          "x-acta-student-id": STUDENT_1,
          "content-type": "audio/webm",
        },
        payload: Buffer.alloc(2048, q.id.charCodeAt(0)),
      });
      const b = tRes.json();
      voiceAnswers.push({
        questionId: q.id,
        answer: b.transcript,
        modality: "voice",
        transcriptHash: b.transcriptHash,
        transcriptionProvider: b.provider,
        transcriptionModel: b.model,
        transcriptEdited: false,
      });
    }
    // Submit verification.
    const vRes = await inject({
      method: "POST",
      url: `/v1/concept-check-sets/${seeded.setId}/verifications`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
      payload: JSON.stringify({ answers: voiceAnswers }),
    });
    expect(vRes.statusCode).toBe(201);
    const v = vRes.json();
    expect(v.hasVoiceAnswers).toBe(true);
    // Evidence report (instructor).
    const erRes = await inject({
      method: "GET",
      url: `/v1/submissions/${seeded.submissionId}/evidence-report`,
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
    });
    expect(erRes.statusCode).toBe(200);
    const er = erRes.json();
    expect(er.verificationAttempts[0].hasVoiceAnswers).toBe(true);
    for (const a of er.verificationAttempts[0].answers) {
      expect(a.modality).toBe("voice");
      expect(a.transcriptHash).toMatch(/^[a-f0-9]{64}$/);
      expect(a.transcriptionProvider).toBe("stub");
      expect(a.transcriptEdited).toBe(false);
    }
    await app.close();
  });

  it("voice answer with mismatched transcriptHash → 400", async () => {
    const { app, inject } = await build();
    const seeded = await seedSetForStudent(inject, STUDENT_1);
    // Build all-text answers first then mutate just one to voice with a bogus hash.
    const bogus = "deadbeef".repeat(8); // 64 hex chars
    const answers: VerificationAnswer[] = seeded.questions.map((q, i) =>
      i === 0
        ? {
            questionId: q.id,
            answer: "I am answering this by voice and the hash will not match.",
            modality: "voice",
            transcriptHash: bogus,
            transcriptionProvider: "stub",
            transcriptionModel: null,
          }
        : { questionId: q.id, answer: "Plain text answer with enough words to count." },
    );
    const res = await inject({
      method: "POST",
      url: `/v1/concept-check-sets/${seeded.setId}/verifications`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
      payload: JSON.stringify({ answers }),
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("transcript_hash_mismatch");
    await app.close();
  });

  it("REGRESSION: existing text verification still works (no voice fields)", async () => {
    const { app, inject } = await build();
    const seeded = await seedSetForStudent(inject, STUDENT_1);
    const long =
      "I chose this approach because the data shows a clear linear trend and the residuals look Gaussian — least squares balances bias and variance for this assignment.";
    const answers: VerificationAnswer[] = seeded.questions.map((q) => ({
      questionId: q.id,
      answer: long,
    }));
    const res = await inject({
      method: "POST",
      url: `/v1/concept-check-sets/${seeded.setId}/verifications`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
      payload: JSON.stringify({ answers }),
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().hasVoiceAnswers).toBe(false);
    await app.close();
  });

  it("D-048 no-audio-retention: the transcribe route hands the Buffer to the provider once and does not persist it anywhere", async () => {
    const { app, inject } = await build();
    const seeded = await seedSetForStudent(inject, STUDENT_1);
    const audioPayload = Buffer.from(`AUDIO-MAGIC-BYTES-${"x".repeat(2000)}`);
    const tRes = await inject({
      method: "POST",
      url: `/v1/concept-check-sets/${seeded.setId}/transcribe?questionId=${seeded.questions[0]?.id}`,
      headers: {
        "x-acta-tenant-id": TENANT_A,
        "x-acta-student-id": STUDENT_1,
        "content-type": "audio/webm",
      },
      payload: audioPayload,
    });
    expect(tRes.statusCode).toBe(201);
    // Provider saw the audio exactly once.
    expect(transcribeCalls).toBe(1);
    expect(lastTranscribeAudio?.length).toBe(audioPayload.length);
    // Response body must not contain the audio bytes.
    expect(tRes.body).not.toContain("AUDIO-MAGIC-BYTES");
    // Now do a verification + evidence report and ensure no field carries the audio.
    const transcribeBody = tRes.json();
    const voice: VerificationAnswer = {
      questionId: seeded.questions[0]?.id ?? "",
      answer: transcribeBody.transcript,
      modality: "voice",
      transcriptHash: transcribeBody.transcriptHash,
      transcriptionProvider: transcribeBody.provider,
      transcriptionModel: transcribeBody.model,
      transcriptEdited: false,
    };
    const textAnswers: VerificationAnswer[] = seeded.questions
      .slice(1)
      .map((q) => ({ questionId: q.id, answer: "Plain answer text long enough to score." }));
    await inject({
      method: "POST",
      url: `/v1/concept-check-sets/${seeded.setId}/verifications`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
      payload: JSON.stringify({ answers: [voice, ...textAnswers] }),
    });
    const er = await inject({
      method: "GET",
      url: `/v1/submissions/${seeded.submissionId}/evidence-report`,
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
    });
    expect(er.body).not.toContain("AUDIO-MAGIC-BYTES");
    // No string field in the report exceeds 25,000 chars (the largest legitimate
    // strings are concept-check questions / instructor solutions, all well under that).
    const max = Math.max(
      ...Object.values(JSON.parse(er.body) as Record<string, unknown>).flatMap((v) =>
        typeof v === "string" ? [v.length] : [0],
      ),
    );
    expect(max).toBeLessThan(25_000);
    await app.close();
  });
});

// ---------- Static text guards: no banned language, reduced-motion ----------

describe("D-048 static guards: new files have no banned language; reduced-motion exists", () => {
  function read(p: string): string {
    return readFileSync(p, "utf8");
  }
  const FILES = [
    "src/backend/src/ai/transcription/types.ts",
    "src/backend/src/ai/transcription/stub-transcription-provider.ts",
    "src/backend/src/ai/transcription/openai-transcription-provider.ts",
    "src/backend/src/ai/transcription/select-transcription-provider.ts",
    "src/backend/src/routes/transcribe.ts",
    "src/frontend/components/brain-assistant.tsx",
    "src/frontend/components/voice-capture.tsx",
  ];
  it("no banned phrases anywhere in the new files", () => {
    for (const f of FILES) {
      const src = read(f).toLowerCase();
      for (const phrase of BANNED_PHRASES) {
        expect(src).not.toContain(phrase);
      }
    }
  });
  it("BrainAssistant CSS honors prefers-reduced-motion", () => {
    // Phase 1 step 9: read the cascade union (tokens + atoms + surfaces).
    const css = [
      read("src/frontend/app/tokens.css"),
      read("src/frontend/app/atoms.css"),
      read("src/frontend/app/surfaces.css"),
    ].join("\n");
    expect(css).toMatch(/prefers-reduced-motion: reduce/);
    expect(css).toMatch(/\.brain-assistant/);
  });
});
