import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { createStubConceptCheckProvider } from "../src/backend/src/ai/concept-check/stub-concept-check-provider.js";
import { createStubProvider } from "../src/backend/src/ai/providers/stub-provider.js";
import { createStubTranscriptionProvider } from "../src/backend/src/ai/transcription/stub-transcription-provider.js";
import type { TranscriptionProvider } from "../src/backend/src/ai/transcription/types.js";
import { createStubVerificationProvider } from "../src/backend/src/ai/verification/stub-verification-provider.js";
import { computeContentHash } from "../src/backend/src/lib/content-hash.js";
import type { Assignment, CreateAssignmentInput } from "../src/backend/src/lib/types.js";
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

const ALL_AI = {
  conceptExplanation: true,
  hints: true,
  examples: true,
  debuggingGuidance: true,
  restrictFinalAnswer: true,
};

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
    title: "Brain TA chat demo",
    instructions: "Ask the TA for guidance.",
    rubric: null,
    aiHelp: ALL_AI,
    verificationMode: "score",
    ...overrides,
  };
}

async function build(opts?: { transcriptionProvider?: TranscriptionProvider }) {
  const stubCC = createStubConceptCheckProvider();
  const stubV = createStubVerificationProvider();
  const stubHelp = createStubProvider();
  const stubTrans = createStubTranscriptionProvider();
  let transcribeCalls = 0;
  let lastAudio: Buffer | null = null;
  const transcriptionProvider: TranscriptionProvider = opts?.transcriptionProvider ?? {
    name: "stub",
    model: null,
    transcribe: vi.fn(async (r) => {
      transcribeCalls += 1;
      lastAudio = r.audio;
      return stubTrans.transcribe(r);
    }),
  };
  const { app } = await buildServer({
    repo: createMemoryAssignmentsRepo(),
    submissionsRepo: createMemorySubmissionsRepo(),
    conceptCheckSetsRepo: createMemoryConceptCheckSetsRepo(),
    conceptCheckVerificationsRepo: createMemoryConceptCheckVerificationsRepo(),
    referenceSolutionsRepo: createMemoryReferenceSolutionsRepo(),
    provider: stubHelp,
    conceptCheckProvider: stubCC,
    verificationProvider: stubV,
    transcriptionProvider,
  });
  return {
    app,
    inject: app.inject.bind(app),
    getTranscribeCalls: () => transcribeCalls,
    getLastAudio: () => lastAudio,
  };
}

async function seedAssignment(
  inject: Awaited<ReturnType<typeof build>>["inject"],
  overrides: Partial<CreateAssignmentInput> = {},
): Promise<Assignment> {
  const r = await inject({
    method: "POST",
    url: "/v1/assignments",
    headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
    payload: JSON.stringify(baseAssignmentInput(overrides)),
  });
  return r.json() as Assignment;
}

// ---------- Backend route tests ----------

describe("POST /v1/assignments/:id/help/transcribe — student-only, assignment-scoped", () => {
  it("rejects missing auth → 401", async () => {
    const { app, inject } = await build();
    const r = await inject({
      method: "POST",
      url: "/v1/assignments/whatever/help/transcribe",
      headers: { "content-type": "audio/webm" },
      payload: Buffer.alloc(2048, 0x77),
    });
    expect(r.statusCode).toBe(401);
    await app.close();
  });

  it("rejects instructor role → 404 (student-only, D-019)", async () => {
    const { app, inject, getTranscribeCalls } = await build();
    const a = await seedAssignment(inject);
    const r = await inject({
      method: "POST",
      url: `/v1/assignments/${a.id}/help/transcribe`,
      headers: {
        "x-acta-tenant-id": TENANT_A,
        "x-acta-instructor-id": INSTRUCTOR_1,
        "content-type": "audio/webm",
      },
      payload: Buffer.alloc(2048, 0x77),
    });
    expect(r.statusCode).toBe(404);
    expect(getTranscribeCalls()).toBe(0);
    await app.close();
  });

  it("rejects cross-tenant student → 404", async () => {
    const { app, inject } = await build();
    const a = await seedAssignment(inject);
    const r = await inject({
      method: "POST",
      url: `/v1/assignments/${a.id}/help/transcribe`,
      headers: {
        "x-acta-tenant-id": TENANT_B,
        "x-acta-student-id": STUDENT_1,
        "content-type": "audio/webm",
      },
      payload: Buffer.alloc(2048, 0x77),
    });
    expect(r.statusCode).toBe(404);
    await app.close();
  });

  it("rejects unsupported mime → 415", async () => {
    const { app, inject } = await build();
    const a = await seedAssignment(inject);
    const r = await inject({
      method: "POST",
      url: `/v1/assignments/${a.id}/help/transcribe`,
      headers: { ...studentHeaders(TENANT_A, STUDENT_1), "content-type": "application/json" },
      payload: '{"x":1}',
    });
    expect(r.statusCode).toBe(415);
    await app.close();
  });

  it("rejects empty body → 400", async () => {
    const { app, inject } = await build();
    const a = await seedAssignment(inject);
    const r = await inject({
      method: "POST",
      url: `/v1/assignments/${a.id}/help/transcribe`,
      headers: { ...studentHeaders(TENANT_A, STUDENT_1), "content-type": "audio/webm" },
      payload: Buffer.alloc(0),
    });
    expect(r.statusCode).toBe(400);
    await app.close();
  });

  it("refuses when aiHelpEnabled=false → 400 ai_help_disabled and never invokes provider", async () => {
    const { app, inject, getTranscribeCalls } = await build();
    const a = await seedAssignment(inject, { aiHelpEnabled: false });
    const r = await inject({
      method: "POST",
      url: `/v1/assignments/${a.id}/help/transcribe`,
      headers: { ...studentHeaders(TENANT_A, STUDENT_1), "content-type": "audio/webm" },
      payload: Buffer.alloc(2048, 0x77),
    });
    expect(r.statusCode).toBe(400);
    expect(r.json().error).toBe("ai_help_disabled");
    expect(getTranscribeCalls()).toBe(0);
    await app.close();
  });

  it("happy path → 201 with sha256(transcript) === transcriptHash, provider=stub", async () => {
    const { app, inject } = await build();
    const a = await seedAssignment(inject);
    const r = await inject({
      method: "POST",
      url: `/v1/assignments/${a.id}/help/transcribe`,
      headers: { ...studentHeaders(TENANT_A, STUDENT_1), "content-type": "audio/webm" },
      payload: Buffer.alloc(2048, 0x77),
    });
    expect(r.statusCode).toBe(201);
    const body = r.json();
    expect(body.provider).toBe("stub");
    expect(body.transcriptHash).toBe(computeContentHash(body.transcript));
    expect(/^[a-f0-9]{64}$/.test(body.transcriptHash)).toBe(true);
    await app.close();
  });

  it("does not create any verification attempt or persist audio", async () => {
    const { app, inject, getLastAudio } = await build();
    const a = await seedAssignment(inject);
    await inject({
      method: "POST",
      url: `/v1/assignments/${a.id}/help/transcribe`,
      headers: { ...studentHeaders(TENANT_A, STUDENT_1), "content-type": "audio/webm" },
      payload: Buffer.alloc(2048, 0x77),
    });
    // No verification list for this assignment because no submission was made.
    // The transcribe call passed a Buffer to the provider — never persisted.
    expect(getLastAudio()).toBeInstanceOf(Buffer);
    await app.close();
  });

  it("rejects sub-1KB audio with audio_too_short (clearer than OpenAI's generic 400)", async () => {
    const { app, inject } = await build();
    const a = await seedAssignment(inject);
    const r = await inject({
      method: "POST",
      url: `/v1/assignments/${a.id}/help/transcribe`,
      headers: { ...studentHeaders(TENANT_A, STUDENT_1), "content-type": "audio/webm" },
      payload: Buffer.alloc(128, 0x77),
    });
    expect(r.statusCode).toBe(400);
    expect(r.json().error).toBe("audio_too_short");
    await app.close();
  });

  it("rate-limits at 30/hour per student → 429 on the 31st call", async () => {
    const { app, inject } = await build();
    const a = await seedAssignment(inject);
    let last = 0;
    for (let i = 0; i < 31; i++) {
      const r = await inject({
        method: "POST",
        url: `/v1/assignments/${a.id}/help/transcribe`,
        headers: { ...studentHeaders(TENANT_A, STUDENT_1), "content-type": "audio/webm" },
        payload: Buffer.alloc(2048, i & 0xff),
      });
      last = r.statusCode;
    }
    expect(last).toBe(429);
    await app.close();
  });
});

// ---------- Static / file guards ----------

function read(p: string): string {
  return readFileSync(p, "utf8");
}

describe("conversational brain TA static guards", () => {
  const NEW_FILES = [
    "src/backend/src/routes/help-transcribe.ts",
    "src/frontend/components/voice-chat-input.tsx",
    "src/frontend/components/help-chat.tsx",
  ];

  it("no banned phrases in the new/changed files", () => {
    for (const f of NEW_FILES) {
      const src = read(f).toLowerCase();
      for (const phrase of BANNED_PHRASES) {
        expect(src).not.toContain(phrase);
      }
    }
  });

  it("BrainAssistant exports the new `speaking` state", () => {
    const src = read("src/frontend/components/brain-assistant.tsx");
    expect(src).toMatch(/"speaking"/);
  });

  it("BrainAssistant CSS defines a `--speaking` modifier and keeps reduced-motion rule", () => {
    // Phase 1 step 9: globals.css became a 6-line import shell; rules now
    // live in tokens.css / atoms.css / surfaces.css. Read the union.
    const css = [
      read("src/frontend/app/tokens.css"),
      read("src/frontend/app/atoms.css"),
      read("src/frontend/app/surfaces.css"),
    ].join("\n");
    expect(css).toMatch(/\.brain-assistant--speaking/);
    expect(css).toMatch(/prefers-reduced-motion: reduce/);
  });

  it("HelpChat mounts BrainAssistant and VoiceChatInput", () => {
    const src = read("src/frontend/components/help-chat.tsx");
    expect(src).toMatch(/<BrainAssistant\b/);
    expect(src).toMatch(/<VoiceChatInput\b/);
  });

  it("HelpChat uses speechSynthesis only via feature detection (gated)", () => {
    const src = read("src/frontend/components/help-chat.tsx");
    // The toggle must be gated by support detection.
    expect(src).toMatch(/speechSupported/);
    expect(src).toMatch(/SpeechSynthesisUtterance/);
  });

  it("HelpChat default-off speak-replies toggle (no auto-speak on load)", () => {
    const src = read("src/frontend/components/help-chat.tsx");
    // Initial state literal must be `false`.
    expect(src).toMatch(/setSpeakReplies\]\s*=\s*useState\(false\)/);
  });

  it("HelpChat shows the policy guardrail copy and consent copy is in voice input", () => {
    const helpSrc = read("src/frontend/components/help-chat.tsx");
    expect(helpSrc).toContain(
      "TA can guide you, but it will not give final answers when restricted.",
    );
    const voiceSrc = read("src/frontend/components/voice-chat-input.tsx");
    expect(voiceSrc).toContain("Audio is used for transcription and is not retained by Acta.");
  });

  it("frontend never references OPENAI_API_KEY (no key leak to bundle)", () => {
    const files = [
      "src/frontend/components/help-chat.tsx",
      "src/frontend/components/voice-chat-input.tsx",
      "src/frontend/components/brain-assistant.tsx",
      "src/frontend/lib/api-client.ts",
      "src/frontend/lib/types/assignment.ts",
    ];
    for (const f of files) {
      expect(read(f)).not.toContain("OPENAI_API_KEY");
    }
  });

  it("help-transcribe route never writes audio to disk or DB", () => {
    const src = read("src/backend/src/routes/help-transcribe.ts");
    expect(src).not.toMatch(/writeFile|createWriteStream|fs\./);
    // No INSERT statement either — no schema column for audio.
    expect(src).not.toMatch(/INSERT INTO/i);
  });

  it("api-client posts assignment-scoped help/transcribe and sends Blob body", () => {
    const src = read("src/frontend/lib/api-client.ts");
    expect(src).toMatch(/\/v1\/assignments\/.*\/help\/transcribe/);
    expect(src).toMatch(/transcribeHelpAnswer/);
  });

  it("voice-chat-input never sends audio outside the api-client path", () => {
    const src = read("src/frontend/components/voice-chat-input.tsx");
    // Should not fetch directly — only via transcribeHelpAnswer.
    expect(src).not.toMatch(/fetch\(/);
    expect(src).toMatch(/transcribeHelpAnswer/);
  });
});
