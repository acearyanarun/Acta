import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { createStubConceptCheckProvider } from "../src/backend/src/ai/concept-check/stub-concept-check-provider.js";
import type { ConceptCheckProvider } from "../src/backend/src/ai/concept-check/types.js";
import { createStubProvider } from "../src/backend/src/ai/providers/stub-provider.js";
import type { AiProvider } from "../src/backend/src/ai/providers/types.js";
import { createStubVerificationProvider } from "../src/backend/src/ai/verification/stub-verification-provider.js";
import type { VerificationProvider } from "../src/backend/src/ai/verification/types.js";
import { buildEvidenceReport } from "../src/backend/src/lib/evidence-report-builder.js";
import { computePolicyHash } from "../src/backend/src/lib/policy-hash.js";
import type {
  AiHelpPolicy,
  Assignment,
  ConceptCheckSet,
  ConceptCheckVerification,
  CreateAssignmentInput,
  Submission,
} from "../src/backend/src/lib/types.js";
import { createAssignmentInputSchema } from "../src/backend/src/lib/validators/assignment-policy.js";
import { createMemoryAssignmentsRepo } from "../src/backend/src/repo/assignments-memory-repo.js";
import { createMemoryConceptCheckSetsRepo } from "../src/backend/src/repo/concept-check-sets-memory-repo.js";
import { createMemoryConceptCheckVerificationsRepo } from "../src/backend/src/repo/concept-check-verifications-memory-repo.js";
import { createMemoryReferenceSolutionsRepo } from "../src/backend/src/repo/reference-solutions-memory-repo.js";
import { createMemorySubmissionsRepo } from "../src/backend/src/repo/submissions-memory-repo.js";
import { buildServer } from "../src/backend/src/server.js";

const TENANT_A = "tenant-a";
const INSTRUCTOR_1 = "instructor-1";
const STUDENT_1 = "student-1";

const ALL_AI: AiHelpPolicy = {
  conceptExplanation: true,
  hints: true,
  examples: true,
  debuggingGuidance: true,
  restrictFinalAnswer: true,
};

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

function baseAssignmentInput(
  overrides: Partial<CreateAssignmentInput> = {},
): CreateAssignmentInput {
  return {
    title: "AI master toggle",
    instructions: "Explain the trade-offs.",
    rubric: null,
    aiHelp: ALL_AI,
    verificationMode: "score",
    ...overrides,
  };
}

// ---------- Validator ----------

describe("createAssignmentInputSchema — aiHelpEnabled (D-047)", () => {
  const validBase = {
    title: "T",
    instructions: "I",
    aiHelp: ALL_AI,
    verificationMode: "score" as const,
  };

  it("defaults aiHelpEnabled to true when omitted", () => {
    const r = createAssignmentInputSchema.safeParse(validBase);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.aiHelpEnabled).toBe(true);
  });

  it("accepts explicit aiHelpEnabled: true", () => {
    const r = createAssignmentInputSchema.safeParse({ ...validBase, aiHelpEnabled: true });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.aiHelpEnabled).toBe(true);
  });

  it("accepts explicit aiHelpEnabled: false", () => {
    const r = createAssignmentInputSchema.safeParse({ ...validBase, aiHelpEnabled: false });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.aiHelpEnabled).toBe(false);
  });

  it("rejects non-boolean aiHelpEnabled", () => {
    const r = createAssignmentInputSchema.safeParse({
      ...validBase,
      aiHelpEnabled: "yes",
    });
    expect(r.success).toBe(false);
  });
});

// ---------- Policy hash ----------

describe("computePolicyHash — aiHelpEnabled is hash-included (D-047)", () => {
  const base = {
    assignmentId: "a-1",
    tenantId: TENANT_A,
    instructorId: INSTRUCTOR_1,
    version: 1,
    title: "T",
    instructions: "I",
    rubric: null,
    aiHelp: ALL_AI,
    verificationMode: "score" as const,
  };

  it("produces different hashes for aiHelpEnabled=true vs false", () => {
    const h1 = computePolicyHash({ ...base, aiHelpEnabled: true });
    const h2 = computePolicyHash({ ...base, aiHelpEnabled: false });
    expect(h1).not.toBe(h2);
  });

  it("is deterministic for the same input", () => {
    const h1 = computePolicyHash({ ...base, aiHelpEnabled: false });
    const h2 = computePolicyHash({ ...base, aiHelpEnabled: false });
    expect(h1).toBe(h2);
  });
});

// ---------- HTTP routes (create, help, evidence) ----------

describe("ai-help master toggle HTTP", () => {
  let helpCalls = 0;
  let conceptCheckCalls = 0;
  let verificationCalls = 0;

  async function build() {
    helpCalls = 0;
    conceptCheckCalls = 0;
    verificationCalls = 0;
    const stubCC = createStubConceptCheckProvider();
    const stubV = createStubVerificationProvider();
    const stubHelp = createStubProvider();
    const conceptCheckProvider: ConceptCheckProvider = {
      name: "stub",
      model: null,
      generate: vi.fn(async (req) => {
        conceptCheckCalls += 1;
        return stubCC.generate(req);
      }),
    };
    const verificationProvider: VerificationProvider = {
      name: "stub",
      model: null,
      evaluate: vi.fn(async (req) => {
        verificationCalls += 1;
        return stubV.evaluate(req);
      }),
    };
    const helpProvider: AiProvider = {
      name: "stub",
      model: null,
      respond: vi.fn(async (req) => {
        helpCalls += 1;
        return stubHelp.respond(req);
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
    });
    return { app, inject: app.inject.bind(app) };
  }

  it("POST /v1/assignments defaults aiHelpEnabled to true when omitted", async () => {
    const { app, inject } = await build();
    const res = await inject({
      method: "POST",
      url: "/v1/assignments",
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify(baseAssignmentInput()),
    });
    expect(res.statusCode).toBe(201);
    const body = res.json() as Assignment;
    expect(body.policy.aiHelpEnabled).toBe(true);
    await app.close();
  });

  it("POST /v1/assignments persists aiHelpEnabled=false", async () => {
    const { app, inject } = await build();
    const res = await inject({
      method: "POST",
      url: "/v1/assignments",
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify(baseAssignmentInput({ aiHelpEnabled: false })),
    });
    expect(res.statusCode).toBe(201);
    const body = res.json() as Assignment;
    expect(body.policy.aiHelpEnabled).toBe(false);
    await app.close();
  });

  it("POST /v1/assignments persists aiHelpEnabled=true explicitly", async () => {
    const { app, inject } = await build();
    const res = await inject({
      method: "POST",
      url: "/v1/assignments",
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify(baseAssignmentInput({ aiHelpEnabled: true })),
    });
    expect(res.statusCode).toBe(201);
    expect((res.json() as Assignment).policy.aiHelpEnabled).toBe(true);
    await app.close();
  });

  it("policy hash differs when only aiHelpEnabled differs across two assignments", async () => {
    const { app, inject } = await build();
    const r1 = await inject({
      method: "POST",
      url: "/v1/assignments",
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify(baseAssignmentInput({ aiHelpEnabled: true })),
    });
    const r2 = await inject({
      method: "POST",
      url: "/v1/assignments",
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify(baseAssignmentInput({ aiHelpEnabled: false })),
    });
    expect(r1.statusCode).toBe(201);
    expect(r2.statusCode).toBe(201);
    const h1 = (r1.json() as Assignment).policy.policyHash;
    const h2 = (r2.json() as Assignment).policy.policyHash;
    // Two assignments have different assignment ids, so the hashes will already
    // differ. Compare the canonical hash directly via the helper to isolate the
    // aiHelpEnabled effect.
    const policy1 = (r1.json() as Assignment).policy;
    const policy2 = (r2.json() as Assignment).policy;
    const sameInput = {
      assignmentId: "FIXED",
      tenantId: TENANT_A,
      instructorId: INSTRUCTOR_1,
      version: 1,
      title: policy1.title,
      instructions: policy1.instructions,
      rubric: null,
      aiHelp: ALL_AI,
      verificationMode: "score" as const,
    };
    const canonical1 = computePolicyHash({ ...sameInput, aiHelpEnabled: true });
    const canonical2 = computePolicyHash({ ...sameInput, aiHelpEnabled: false });
    expect(canonical1).not.toBe(canonical2);
    // And the live two policy hashes don't accidentally collide either.
    expect(h1).not.toBe(h2);
    await app.close();
  });

  it("policy versioning still works (PUT bumps version and preserves prior row)", async () => {
    const { app, inject } = await build();
    const created = await inject({
      method: "POST",
      url: "/v1/assignments",
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify(baseAssignmentInput({ aiHelpEnabled: true })),
    });
    const a = created.json() as Assignment;
    expect(a.policy.version).toBe(1);
    expect(a.policy.aiHelpEnabled).toBe(true);

    const updated = await inject({
      method: "PUT",
      url: `/v1/assignments/${a.id}`,
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify(baseAssignmentInput({ aiHelpEnabled: false })),
    });
    expect(updated.statusCode).toBe(200);
    const after = updated.json() as Assignment;
    expect(after.policy.version).toBe(2);
    expect(after.policy.aiHelpEnabled).toBe(false);
    expect(after.policy.policyHash).not.toBe(a.policy.policyHash);

    // Prior version still retrievable via ?version=1
    const versions = await inject({
      method: "GET",
      url: `/v1/assignments/${a.id}/versions`,
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
    });
    const items = (versions.json() as { items: { version: number; aiHelpEnabled: boolean }[] })
      .items;
    expect(items.find((v) => v.version === 1)?.aiHelpEnabled).toBe(true);
    expect(items.find((v) => v.version === 2)?.aiHelpEnabled).toBe(false);

    await app.close();
  });

  it("help route returns 400 ai_help_disabled when toggle is off (no requestType)", async () => {
    const { app, inject } = await build();
    const created = await inject({
      method: "POST",
      url: "/v1/assignments",
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify(baseAssignmentInput({ aiHelpEnabled: false })),
    });
    const a = created.json() as Assignment;
    const res = await inject({
      method: "POST",
      url: `/v1/assignments/${a.id}/help`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
      payload: JSON.stringify({ messages: [{ role: "student", content: "Hello?" }] }),
    });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error).toBe("ai_help_disabled");
    expect(body.policyHash).toBe(a.policy.policyHash);
    expect(helpCalls).toBe(0);
    await app.close();
  });

  it("requestType=general cannot bypass aiHelpEnabled=false", async () => {
    const { app, inject } = await build();
    const created = await inject({
      method: "POST",
      url: "/v1/assignments",
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify(baseAssignmentInput({ aiHelpEnabled: false })),
    });
    const a = created.json() as Assignment;
    const res = await inject({
      method: "POST",
      url: `/v1/assignments/${a.id}/help`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
      payload: JSON.stringify({
        messages: [{ role: "student", content: "Help me." }],
        requestType: "general",
      }),
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("ai_help_disabled");
    expect(helpCalls).toBe(0);
    await app.close();
  });

  it("requestType=hint also cannot bypass aiHelpEnabled=false (master overrides per-type)", async () => {
    const { app, inject } = await build();
    const created = await inject({
      method: "POST",
      url: "/v1/assignments",
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify(
        baseAssignmentInput({
          aiHelpEnabled: false,
          // hints would be allowed if master were on
          aiHelp: { ...ALL_AI, hints: true },
        }),
      ),
    });
    const a = created.json() as Assignment;
    const res = await inject({
      method: "POST",
      url: `/v1/assignments/${a.id}/help`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
      payload: JSON.stringify({
        messages: [{ role: "student", content: "Give me a hint." }],
        requestType: "hint",
      }),
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("ai_help_disabled");
    expect(helpCalls).toBe(0);
    await app.close();
  });

  it("regression: when aiHelpEnabled=true, per-type help_type_not_allowed still fires for blocked types", async () => {
    const { app, inject } = await build();
    const created = await inject({
      method: "POST",
      url: "/v1/assignments",
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify(
        baseAssignmentInput({
          aiHelpEnabled: true,
          aiHelp: { ...ALL_AI, hints: false }, // hints blocked
        }),
      ),
    });
    const a = created.json() as Assignment;
    const res = await inject({
      method: "POST",
      url: `/v1/assignments/${a.id}/help`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
      payload: JSON.stringify({
        messages: [{ role: "student", content: "Give me a hint." }],
        requestType: "hint",
      }),
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("help_type_not_allowed");
    expect(helpCalls).toBe(0);
    await app.close();
  });

  it("regression: when aiHelpEnabled=true, restrictFinalAnswer still triggers refused outcome on final-answer asks", async () => {
    const { app, inject } = await build();
    const created = await inject({
      method: "POST",
      url: "/v1/assignments",
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify(baseAssignmentInput({ aiHelpEnabled: true })),
    });
    const a = created.json() as Assignment;
    const res = await inject({
      method: "POST",
      url: `/v1/assignments/${a.id}/help`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
      payload: JSON.stringify({
        messages: [{ role: "student", content: "Just give me the answer please." }],
        requestType: "hint",
      }),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.outcome).toBe("refused");
    expect(helpCalls).toBe(1);
    await app.close();
  });

  it("regression: when aiHelpEnabled=true, an allowed help request returns 200 (no master-toggle interference)", async () => {
    const { app, inject } = await build();
    const created = await inject({
      method: "POST",
      url: "/v1/assignments",
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify(baseAssignmentInput({ aiHelpEnabled: true })),
    });
    const a = created.json() as Assignment;
    const res = await inject({
      method: "POST",
      url: `/v1/assignments/${a.id}/help`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
      payload: JSON.stringify({
        messages: [{ role: "student", content: "Walk me through the concept." }],
        requestType: "explanation",
      }),
    });
    expect(res.statusCode).toBe(200);
    expect(helpCalls).toBe(1);
    await app.close();
  });

  it("evidence report includes aiHelpEnabled in the policy snapshot", async () => {
    const { app, inject } = await build();
    const created = await inject({
      method: "POST",
      url: "/v1/assignments",
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify(baseAssignmentInput({ aiHelpEnabled: false })),
    });
    const a = created.json() as Assignment;
    const s = await inject({
      method: "POST",
      url: `/v1/assignments/${a.id}/submissions`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
      payload: JSON.stringify({ content: "My take on the trade-offs." }),
    });
    const submission = s.json();
    const report = await inject({
      method: "GET",
      url: `/v1/submissions/${submission.id}/evidence-report`,
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
    });
    expect(report.statusCode).toBe(200);
    const body = report.json();
    expect(body.policy.aiHelpEnabled).toBe(false);
    expect(body.policy.aiHelp).toBeDefined();
    await app.close();
  });
});

// ---------- Builder smoke: shape preserved with new field ----------

describe("buildEvidenceReport — aiHelpEnabled flow-through", () => {
  it("preserves the master toggle on the snapshot", () => {
    const policy: Assignment = {
      id: "a-1",
      tenantId: TENANT_A,
      instructorId: INSTRUCTOR_1,
      currentVersion: 1,
      policy: {
        id: "pv-1",
        assignmentId: "a-1",
        tenantId: TENANT_A,
        instructorId: INSTRUCTOR_1,
        version: 1,
        title: "T",
        instructions: "I",
        rubric: null,
        aiHelp: ALL_AI,
        aiHelpEnabled: false,
        verificationMode: "score",
        policyHash: "f".repeat(64),
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const submission: Submission = {
      id: "sub-1",
      tenantId: TENANT_A,
      assignmentId: "a-1",
      studentId: STUDENT_1,
      policyVersionId: "pv-1",
      policyVersion: 1,
      policyHash: "f".repeat(64),
      content: "x",
      contentHash: "c".repeat(64),
      submittedAt: "2026-01-02T00:00:00.000Z",
    };
    const sets: ConceptCheckSet[] = [];
    const verifications: ConceptCheckVerification[] = [];
    const r = buildEvidenceReport({
      assignment: policy,
      submission,
      referenceSolution: null,
      conceptCheckSets: sets,
      verifications,
    });
    expect(r.policy.aiHelpEnabled).toBe(false);
  });
});

// ---------- Frontend static text guards ----------

describe("frontend gating — student page text guards", () => {
  function read(p: string): string {
    return readFileSync(p, "utf8");
  }
  const STUDENT_PAGE = "src/frontend/app/student/[id]/page.tsx";
  const FORM = "src/frontend/components/assignment-form.tsx";
  const BANNER = "src/frontend/components/policy-banner.tsx";

  it("student page renders disabled-message when aiHelpEnabled is false", () => {
    const src = read(STUDENT_PAGE);
    expect(src).toContain("AI guided help is disabled for this assignment");
    expect(src).toContain("policy.aiHelpEnabled");
  });

  it("assignment form exposes the master Student AI help toggle", () => {
    const src = read(FORM);
    expect(src).toContain("Student AI help");
    expect(src).toContain("aiHelpEnabled");
  });

  it("policy banner has a disabled-state render path", () => {
    const src = read(BANNER);
    expect(src).toContain("Disabled for this assignment");
    expect(src).toContain("aiHelpEnabled");
  });
});
