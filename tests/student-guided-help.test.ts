import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStubProvider } from "../src/backend/src/ai/providers/stub-provider.js";
import type { AiProvider } from "../src/backend/src/ai/providers/types.js";
import { buildSystemPrompt } from "../src/backend/src/lib/prompt-builder.js";
import type {
  AiHelpPolicy,
  AssignmentPolicyVersion,
  CreateAssignmentInput,
} from "../src/backend/src/lib/types.js";
import { createMemoryAssignmentsRepo } from "../src/backend/src/repo/assignments-memory-repo.js";
import { buildServer } from "../src/backend/src/server.js";

const TENANT_A = "tenant-a";
const TENANT_B = "tenant-b";
const INSTRUCTOR_1 = "instructor-1";
const STUDENT_1 = "student-1";

const ALL_AI: AiHelpPolicy = {
  conceptExplanation: true,
  hints: true,
  examples: true,
  debuggingGuidance: true,
  restrictFinalAnswer: true,
};

function baseInput(overrides: Partial<CreateAssignmentInput> = {}): CreateAssignmentInput {
  return {
    title: "Sample assignment",
    instructions: "Explain the concept and apply it.",
    rubric: null,
    aiHelp: ALL_AI,
    verificationMode: "score",
    ...overrides,
  };
}

function instructorHeaders(tenantId: string, instructorId: string) {
  return {
    "x-acta-tenant-id": tenantId,
    "x-acta-instructor-id": instructorId,
    "content-type": "application/json",
  };
}

function studentHeaders(tenantId: string, studentId: string) {
  return {
    "x-acta-tenant-id": tenantId,
    "x-acta-student-id": studentId,
    "content-type": "application/json",
  };
}

// ---------- Prompt builder ----------

const samplePolicy: AssignmentPolicyVersion = {
  id: "pv-1",
  assignmentId: "a-1",
  tenantId: TENANT_A,
  instructorId: INSTRUCTOR_1,
  version: 1,
  title: "Linear regression case study",
  instructions: "Read the dataset summary and answer the analysis questions.",
  rubric: "Show your work. Cite assumptions.",
  aiHelp: ALL_AI,
  aiHelpEnabled: true,
  verificationMode: "score",
  policyHash: "f".repeat(64),
  createdAt: new Date().toISOString(),
};

describe("prompt-builder", () => {
  it("includes assignment title and instructions verbatim", () => {
    const prompt = buildSystemPrompt({ policy: samplePolicy });
    expect(prompt).toContain("Linear regression case study");
    expect(prompt).toContain("Read the dataset summary and answer the analysis questions.");
  });

  it("includes rubric when set, omits the rubric section when null", () => {
    const withRubric = buildSystemPrompt({ policy: samplePolicy });
    expect(withRubric).toContain("RUBRIC THE INSTRUCTOR SET:");
    expect(withRubric).toContain("Show your work. Cite assumptions.");

    const noRubric = buildSystemPrompt({
      policy: { ...samplePolicy, rubric: null },
    });
    expect(noRubric).not.toContain("RUBRIC THE INSTRUCTOR SET:");
  });

  it("includes the hard-rule sentence when restrictFinalAnswer is true", () => {
    const prompt = buildSystemPrompt({ policy: samplePolicy });
    expect(prompt).toContain("Restrict final answer: ENABLED");
    expect(prompt).toMatch(/refuse and redirect/i);
  });

  it("omits the hard-rule sentence when restrictFinalAnswer is false", () => {
    const prompt = buildSystemPrompt({
      policy: { ...samplePolicy, aiHelp: { ...ALL_AI, restrictFinalAnswer: false } },
    });
    expect(prompt).toContain('"Restrict final answer" is disabled');
    expect(prompt).not.toMatch(/refuse and redirect/i);
  });

  it("renders each AI help toggle as allowed / not allowed matching the policy", () => {
    const partial: AiHelpPolicy = {
      conceptExplanation: true,
      hints: false,
      examples: true,
      debuggingGuidance: false,
      restrictFinalAnswer: true,
    };
    const prompt = buildSystemPrompt({
      policy: { ...samplePolicy, aiHelp: partial },
    });
    expect(prompt).toContain("Concept explanation: allowed");
    expect(prompt).toContain("Hints: not allowed");
    expect(prompt).toContain("Examples: allowed");
    expect(prompt).toContain("Debugging guidance: not allowed");
  });

  it("includes the no-detection rule", () => {
    const prompt = buildSystemPrompt({ policy: samplePolicy });
    expect(prompt).toContain("Never claim to detect AI usage");
    expect(prompt).toContain("verifies understanding");
  });
});

// ---------- Stub provider ----------

describe("stub-provider", () => {
  const provider = createStubProvider();
  const prompt = buildSystemPrompt({ policy: samplePolicy });

  it("returns canned response per requestType when allowed", async () => {
    for (const t of ["hint", "explanation", "example", "debugging"] as const) {
      const r = await provider.respond({
        policy: samplePolicy,
        requestType: t,
        systemPrompt: prompt,
        messages: [{ role: "student", content: "I'm stuck on the third step." }],
      });
      expect(r.outcome).toBe("answered");
      expect(r.content.length).toBeGreaterThan(0);
    }
  });

  it("refuses with outcomeReason when restrictFinalAnswer is on and student asks for the answer", async () => {
    const r = await provider.respond({
      policy: samplePolicy,
      requestType: "general",
      systemPrompt: prompt,
      messages: [{ role: "student", content: "Just give me the answer please." }],
    });
    expect(r.outcome).toBe("refused");
    expect(r.outcomeReason).toMatch(/Final-answer request blocked/i);
  });

  it("requestType=general is not a loophole when policy restrictFinalAnswer is on", async () => {
    const r = await provider.respond({
      policy: samplePolicy,
      requestType: "general",
      systemPrompt: prompt,
      messages: [{ role: "student", content: "write the solution for me" }],
    });
    expect(r.outcome).toBe("refused");
  });

  it("answers normally when restrictFinalAnswer is off and student asks directly", async () => {
    const policy = {
      ...samplePolicy,
      aiHelp: { ...ALL_AI, restrictFinalAnswer: false },
    };
    const r = await provider.respond({
      policy,
      requestType: "general",
      systemPrompt: buildSystemPrompt({ policy }),
      messages: [{ role: "student", content: "give me the answer" }],
    });
    expect(r.outcome).toBe("answered");
  });
});

// ---------- HTTP routes ----------

describe("student-guided-help HTTP", () => {
  let inject: ReturnType<typeof makeInject>;
  let aiCallCount = 0;
  let provider: AiProvider;
  let appCloser: { close: () => Promise<void> };

  function makeInject(app: Awaited<ReturnType<typeof buildServer>>["app"]) {
    return app.inject.bind(app);
  }

  beforeEach(async () => {
    aiCallCount = 0;
    const stub = createStubProvider();
    provider = {
      name: "stub",
      respond: vi.fn(async (req) => {
        aiCallCount += 1;
        return stub.respond(req);
      }),
    };
    const repo = createMemoryAssignmentsRepo();
    const { app } = await buildServer({ repo, provider });
    inject = makeInject(app);
    appCloser = { close: async () => app.close() };
    return async () => appCloser.close();
  });

  async function seedAssignment(
    overrides: Partial<CreateAssignmentInput> = {},
  ): Promise<{ id: string; policyVersionId: string; policyHash: string }> {
    const res = await inject({
      method: "POST",
      url: "/v1/assignments",
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify(baseInput(overrides)),
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    return {
      id: body.id,
      policyVersionId: body.policy.id,
      policyHash: body.policy.policyHash,
    };
  }

  it("401 when no auth headers", async () => {
    const res = await inject({
      method: "POST",
      url: "/v1/assignments/anything/help",
      headers: { "content-type": "application/json" },
      payload: JSON.stringify({ messages: [{ role: "student", content: "hi" }] }),
    });
    expect(res.statusCode).toBe(401);
  });

  it("401 with only tenant header (no student or instructor)", async () => {
    const seeded = await seedAssignment();
    const res = await inject({
      method: "POST",
      url: `/v1/assignments/${seeded.id}/help`,
      headers: { "content-type": "application/json", "x-acta-tenant-id": TENANT_A },
      payload: JSON.stringify({ messages: [{ role: "student", content: "hi" }] }),
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns policyVersionId + policyHash on success (student auth)", async () => {
    const seeded = await seedAssignment();
    const res = await inject({
      method: "POST",
      url: `/v1/assignments/${seeded.id}/help`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
      payload: JSON.stringify({
        messages: [{ role: "student", content: "I need a hint." }],
        requestType: "hint",
      }),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.policyVersionId).toBe(seeded.policyVersionId);
    expect(body.policyHash).toBe(seeded.policyHash);
    expect(body.policyVersion).toBe(1);
    expect(body.outcome).toBe("answered");
    expect(body.outcomeReason).toBeUndefined();
    expect(body.provider).toBe("stub");
    expect(aiCallCount).toBe(1);
  });

  it("instructor auth header also satisfies help route", async () => {
    const seeded = await seedAssignment();
    const res = await inject({
      method: "POST",
      url: `/v1/assignments/${seeded.id}/help`,
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify({
        messages: [{ role: "student", content: "hint please" }],
        requestType: "hint",
      }),
    });
    expect(res.statusCode).toBe(200);
  });

  it("disallowed requestType returns 400 help_type_not_allowed AND does not call provider", async () => {
    const seeded = await seedAssignment({
      aiHelp: { ...ALL_AI, hints: false },
    });
    const res = await inject({
      method: "POST",
      url: `/v1/assignments/${seeded.id}/help`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
      payload: JSON.stringify({
        messages: [{ role: "student", content: "hint please" }],
        requestType: "hint",
      }),
    });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error).toBe("help_type_not_allowed");
    expect(body.policyVersionId).toBe(seeded.policyVersionId);
    expect(aiCallCount).toBe(0);
  });

  it("requestType=general with final-answer trigger refuses with outcomeReason", async () => {
    const seeded = await seedAssignment();
    const res = await inject({
      method: "POST",
      url: `/v1/assignments/${seeded.id}/help`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
      payload: JSON.stringify({
        messages: [{ role: "student", content: "just give me the answer please" }],
        requestType: "general",
      }),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.outcome).toBe("refused");
    expect(body.outcomeReason).toMatch(/Final-answer request blocked/i);
  });

  it("400 on validation error (empty messages)", async () => {
    const seeded = await seedAssignment();
    const res = await inject({
      method: "POST",
      url: `/v1/assignments/${seeded.id}/help`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
      payload: JSON.stringify({ messages: [] }),
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("validation_failed");
  });

  it("404 on unknown assignment id", async () => {
    const res = await inject({
      method: "POST",
      url: "/v1/assignments/01HXYZNONEXISTENT/help",
      headers: studentHeaders(TENANT_A, STUDENT_1),
      payload: JSON.stringify({ messages: [{ role: "student", content: "hi" }] }),
    });
    expect(res.statusCode).toBe(404);
  });

  it("404 on cross-tenant access", async () => {
    const seeded = await seedAssignment();
    const res = await inject({
      method: "POST",
      url: `/v1/assignments/${seeded.id}/help`,
      headers: studentHeaders(TENANT_B, STUDENT_1),
      payload: JSON.stringify({ messages: [{ role: "student", content: "hi" }] }),
    });
    expect(res.statusCode).toBe(404);
  });

  it("after instructor PUT to v2, subsequent help returns new policyVersionId (drift signal)", async () => {
    const seeded = await seedAssignment();

    const r1 = await inject({
      method: "POST",
      url: `/v1/assignments/${seeded.id}/help`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
      payload: JSON.stringify({
        messages: [{ role: "student", content: "concept please" }],
        requestType: "explanation",
      }),
    });
    expect(r1.statusCode).toBe(200);
    expect(r1.json().policyVersion).toBe(1);

    const upd = await inject({
      method: "PUT",
      url: `/v1/assignments/${seeded.id}`,
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify(baseInput({ title: "Sample assignment v2" })),
    });
    expect(upd.statusCode).toBe(200);

    const r2 = await inject({
      method: "POST",
      url: `/v1/assignments/${seeded.id}/help`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
      payload: JSON.stringify({
        messages: [{ role: "student", content: "concept please" }],
        requestType: "explanation",
      }),
    });
    expect(r2.statusCode).toBe(200);
    expect(r2.json().policyVersion).toBe(2);
    expect(r2.json().policyVersionId).not.toBe(r1.json().policyVersionId);
  });
});

// ---------- Student list routes ----------

describe("student list routes", () => {
  let inject: ReturnType<
    ReturnType<typeof buildServer> extends Promise<infer R>
      ? R extends { app: { inject: infer I } }
        ? () => I
        : never
      : never
  >;
  let appCloser: { close: () => Promise<void> };

  beforeEach(async () => {
    const repo = createMemoryAssignmentsRepo();
    const { app } = await buildServer({ repo, provider: createStubProvider() });
    inject = app.inject.bind(app) as typeof inject;
    appCloser = { close: async () => app.close() };
    return async () => appCloser.close();
  });

  async function seed(tenantId: string, instructorId: string, title: string): Promise<string> {
    const r = await inject({
      method: "POST",
      url: "/v1/assignments",
      headers: instructorHeaders(tenantId, instructorId),
      payload: JSON.stringify(baseInput({ title })),
    });
    return r.json().id;
  }

  it("/v1/student/assignments returns all tenant assignments regardless of instructor", async () => {
    await seed(TENANT_A, INSTRUCTOR_1, "A1");
    await seed(TENANT_A, "instructor-2", "A2");
    await seed(TENANT_B, INSTRUCTOR_1, "Other");

    const res = await inject({
      method: "GET",
      url: "/v1/student/assignments",
      headers: studentHeaders(TENANT_A, STUDENT_1),
    });
    expect(res.statusCode).toBe(200);
    const items = res.json().items;
    expect(items).toHaveLength(2);
    const titles = items.map((a: { policy: { title: string } }) => a.policy.title).sort();
    expect(titles).toEqual(["A1", "A2"]);
  });

  it("foreign tenant returns empty list (not 401/403)", async () => {
    await seed(TENANT_A, INSTRUCTOR_1, "A1");
    const res = await inject({
      method: "GET",
      url: "/v1/student/assignments",
      headers: studentHeaders(TENANT_B, STUDENT_1),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().items).toEqual([]);
  });

  it("/v1/student/assignments/:id returns current policy; cross-tenant → 404", async () => {
    const id = await seed(TENANT_A, INSTRUCTOR_1, "A1");

    const ok = await inject({
      method: "GET",
      url: `/v1/student/assignments/${id}`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
    });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().policy.version).toBe(1);

    const cross = await inject({
      method: "GET",
      url: `/v1/student/assignments/${id}`,
      headers: studentHeaders(TENANT_B, STUDENT_1),
    });
    expect(cross.statusCode).toBe(404);
  });
});
