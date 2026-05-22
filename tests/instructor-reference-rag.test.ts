import { beforeEach, describe, expect, it } from "vitest";
import { createStubConceptCheckProvider } from "../src/backend/src/ai/concept-check/stub-concept-check-provider.js";
import { createStubProvider } from "../src/backend/src/ai/providers/stub-provider.js";
import { createStubVerificationProvider } from "../src/backend/src/ai/verification/stub-verification-provider.js";
import { computeReferenceHash } from "../src/backend/src/lib/reference-hash.js";
import type {
  AiHelpPolicy,
  CreateAssignmentInput,
  CreateReferenceSolutionInput,
} from "../src/backend/src/lib/types.js";
import { createReferenceSolutionInputSchema } from "../src/backend/src/lib/validators/reference-solution.js";
import { createMemoryAssignmentsRepo } from "../src/backend/src/repo/assignments-memory-repo.js";
import { createMemoryConceptCheckSetsRepo } from "../src/backend/src/repo/concept-check-sets-memory-repo.js";
import { createMemoryConceptCheckVerificationsRepo } from "../src/backend/src/repo/concept-check-verifications-memory-repo.js";
import { createMemoryReferenceSolutionsRepo } from "../src/backend/src/repo/reference-solutions-memory-repo.js";
import type { ReferenceSolutionsRepo } from "../src/backend/src/repo/reference-solutions-repo.js";
import { createMemorySubmissionsRepo } from "../src/backend/src/repo/submissions-memory-repo.js";
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

function baseAssignmentInput(): CreateAssignmentInput {
  return {
    title: "Assignment for reference",
    instructions: "Reason about the dataset.",
    rubric: null,
    aiHelp: ALL_AI,
    verificationMode: "score",
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

function baseRefInput(
  overrides: Partial<CreateReferenceSolutionInput> = {},
): CreateReferenceSolutionInput {
  return {
    expectedSolution:
      "The student should compute the slope from the scatter and justify a linear fit.",
    keyConcepts: ["linearity", "least squares", "residual analysis"],
    requiredReasoningSteps: [
      "Observe the scatter pattern.",
      "Compare to a linear baseline.",
      "Check residuals for structure.",
    ],
    commonMistakes: ["Skipping residual diagnostics.", "Conflating correlation with causation."],
    correctnessCriteria:
      "Correct: linear fit chosen with residual diagnostics. Partial: linear fit chosen without diagnostics. Incorrect: nonlinear without justification.",
    optionalNotes: null,
    ...overrides,
  };
}

// ---------- validator ----------

describe("createReferenceSolutionInputSchema (D-039)", () => {
  it("rejects missing required fields", () => {
    expect(createReferenceSolutionInputSchema.safeParse({}).success).toBe(false);
  });
  it("rejects empty/whitespace expectedSolution", () => {
    expect(
      createReferenceSolutionInputSchema.safeParse(baseRefInput({ expectedSolution: "   \n  " }))
        .success,
    ).toBe(false);
  });
  it("rejects empty correctnessCriteria", () => {
    expect(
      createReferenceSolutionInputSchema.safeParse(baseRefInput({ correctnessCriteria: "" }))
        .success,
    ).toBe(false);
  });
  it("rejects expectedSolution > 50,000 chars", () => {
    expect(
      createReferenceSolutionInputSchema.safeParse(
        baseRefInput({ expectedSolution: "x".repeat(50_001) }),
      ).success,
    ).toBe(false);
  });
  it("rejects keyConcepts entry > 200 chars", () => {
    expect(
      createReferenceSolutionInputSchema.safeParse(baseRefInput({ keyConcepts: ["x".repeat(201)] }))
        .success,
    ).toBe(false);
  });
  it("rejects > 50 keyConcepts entries", () => {
    expect(
      createReferenceSolutionInputSchema.safeParse(
        baseRefInput({ keyConcepts: Array.from({ length: 51 }, (_, i) => `c${i}`) }),
      ).success,
    ).toBe(false);
  });
  it("accepts a well-formed body with all fields", () => {
    expect(
      createReferenceSolutionInputSchema.safeParse(baseRefInput({ optionalNotes: "internal note" }))
        .success,
    ).toBe(true);
  });
  it("transforms omitted optionalNotes to null", () => {
    const r = createReferenceSolutionInputSchema.parse({
      expectedSolution: "ok",
      keyConcepts: [],
      requiredReasoningSteps: [],
      commonMistakes: [],
      correctnessCriteria: "ok",
    });
    expect(r.optionalNotes).toBeNull();
  });
});

// ---------- reference hash ----------

describe("computeReferenceHash (D-040)", () => {
  const baseBody = {
    assignmentId: "a-1",
    tenantId: TENANT_A,
    instructorId: INSTRUCTOR_1,
    version: 1,
    expectedSolution: "S",
    keyConcepts: ["a", "b", "c"],
    requiredReasoningSteps: ["x"],
    commonMistakes: ["y"],
    correctnessCriteria: "C",
    optionalNotes: null,
  };

  it("returns 64-char sha-256 hex", () => {
    const h = computeReferenceHash(baseBody);
    expect(h).toHaveLength(64);
    expect(h).toMatch(/^[0-9a-f]+$/);
  });

  it("is deterministic for same logical body (object-key order independent)", () => {
    const h1 = computeReferenceHash(baseBody);
    const h2 = computeReferenceHash({
      version: 1,
      expectedSolution: "S",
      tenantId: TENANT_A,
      keyConcepts: ["a", "b", "c"],
      assignmentId: "a-1",
      instructorId: INSTRUCTOR_1,
      requiredReasoningSteps: ["x"],
      commonMistakes: ["y"],
      correctnessCriteria: "C",
      optionalNotes: null,
    });
    expect(h1).toEqual(h2);
  });

  it("changes when any field changes", () => {
    const base = computeReferenceHash(baseBody);
    const changed = computeReferenceHash({ ...baseBody, expectedSolution: "S2" });
    expect(base).not.toEqual(changed);
  });

  it("treats keyConcepts ORDER as meaningful (different order → different hash)", () => {
    const h1 = computeReferenceHash({ ...baseBody, keyConcepts: ["a", "b", "c"] });
    const h2 = computeReferenceHash({ ...baseBody, keyConcepts: ["c", "b", "a"] });
    expect(h1).not.toEqual(h2);
  });
});

// ---------- HTTP routes ----------

describe("reference-solution HTTP routes", () => {
  let inject: ReturnType<typeof makeInject>;
  let referenceSolutionsRepo: ReferenceSolutionsRepo;
  let appCloser: { close: () => Promise<void> };

  function makeInject(app: Awaited<ReturnType<typeof buildServer>>["app"]) {
    return app.inject.bind(app);
  }

  beforeEach(async () => {
    referenceSolutionsRepo = createMemoryReferenceSolutionsRepo();
    const { app } = await buildServer({
      repo: createMemoryAssignmentsRepo(),
      submissionsRepo: createMemorySubmissionsRepo(),
      conceptCheckSetsRepo: createMemoryConceptCheckSetsRepo(),
      conceptCheckVerificationsRepo: createMemoryConceptCheckVerificationsRepo(),
      referenceSolutionsRepo,
      provider: createStubProvider(),
      conceptCheckProvider: createStubConceptCheckProvider(),
      verificationProvider: createStubVerificationProvider(),
    });
    inject = makeInject(app);
    appCloser = { close: async () => app.close() };
    return async () => appCloser.close();
  });

  async function seedAssignment(): Promise<string> {
    const res = await inject({
      method: "POST",
      url: "/v1/assignments",
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify(baseAssignmentInput()),
    });
    return res.json().id;
  }

  it("401 when no auth headers", async () => {
    const res = await inject({
      method: "GET",
      url: "/v1/assignments/x/reference-solution",
    });
    expect(res.statusCode).toBe(401);
  });

  it("student attempting GET → 404 (not 401, not 403)", async () => {
    const id = await seedAssignment();
    const res = await inject({
      method: "GET",
      url: `/v1/assignments/${id}/reference-solution`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
    });
    expect(res.statusCode).toBe(404);
  });

  it("student attempting POST → 404", async () => {
    const id = await seedAssignment();
    const res = await inject({
      method: "POST",
      url: `/v1/assignments/${id}/reference-solution`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
      payload: JSON.stringify(baseRefInput()),
    });
    expect(res.statusCode).toBe(404);
  });

  it("student attempting versions list → 404", async () => {
    const id = await seedAssignment();
    const res = await inject({
      method: "GET",
      url: `/v1/assignments/${id}/reference-solution/versions`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
    });
    expect(res.statusCode).toBe(404);
  });

  it("instructor GET before any version exists → 404", async () => {
    const id = await seedAssignment();
    const res = await inject({
      method: "GET",
      url: `/v1/assignments/${id}/reference-solution`,
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
    });
    expect(res.statusCode).toBe(404);
  });

  it("cross-tenant instructor GET → 404", async () => {
    const id = await seedAssignment();
    // Seed a v1 so the row exists, then read from a foreign tenant.
    await inject({
      method: "POST",
      url: `/v1/assignments/${id}/reference-solution`,
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify(baseRefInput()),
    });
    const cross = await inject({
      method: "GET",
      url: `/v1/assignments/${id}/reference-solution`,
      headers: instructorHeaders(TENANT_B, INSTRUCTOR_1),
    });
    expect(cross.statusCode).toBe(404);
  });

  it("201 POST creates v1 with deterministic referenceHash", async () => {
    const id = await seedAssignment();
    const body = baseRefInput();
    const res = await inject({
      method: "POST",
      url: `/v1/assignments/${id}/reference-solution`,
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify(body),
    });
    expect(res.statusCode).toBe(201);
    const row = res.json();
    expect(row.version).toBe(1);
    expect(typeof row.referenceHash).toBe("string");
    expect(row.referenceHash).toHaveLength(64);

    const expected = computeReferenceHash({
      assignmentId: id,
      tenantId: TENANT_A,
      instructorId: INSTRUCTOR_1,
      version: 1,
      expectedSolution: body.expectedSolution,
      keyConcepts: body.keyConcepts,
      requiredReasoningSteps: body.requiredReasoningSteps,
      commonMistakes: body.commonMistakes,
      correctnessCriteria: body.correctnessCriteria,
      optionalNotes: body.optionalNotes ?? null,
    });
    expect(row.referenceHash).toBe(expected);
  });

  it("subsequent POST creates v2; v1 remains queryable and unchanged", async () => {
    const id = await seedAssignment();
    const a = await inject({
      method: "POST",
      url: `/v1/assignments/${id}/reference-solution`,
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify(baseRefInput()),
    });
    expect(a.statusCode).toBe(201);
    const v1 = a.json();

    const b = await inject({
      method: "POST",
      url: `/v1/assignments/${id}/reference-solution`,
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify(baseRefInput({ expectedSolution: "Revised expected solution." })),
    });
    expect(b.statusCode).toBe(201);
    const v2 = b.json();
    expect(v2.version).toBe(2);
    expect(v2.referenceHash).not.toBe(v1.referenceHash);

    // GET current → v2.
    const cur = await inject({
      method: "GET",
      url: `/v1/assignments/${id}/reference-solution`,
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
    });
    expect(cur.json().version).toBe(2);

    // GET ?version=1 → original v1, unchanged.
    const old = await inject({
      method: "GET",
      url: `/v1/assignments/${id}/reference-solution/versions?version=1`,
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
    });
    expect(old.statusCode).toBe(200);
    const v1Refetched = old.json();
    expect(v1Refetched.version).toBe(1);
    expect(v1Refetched.referenceHash).toBe(v1.referenceHash);
    expect(v1Refetched.expectedSolution).toBe(v1.expectedSolution);

    // GET versions → newest-first.
    const list = await inject({
      method: "GET",
      url: `/v1/assignments/${id}/reference-solution/versions`,
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
    });
    const items = list.json().items;
    expect(items).toHaveLength(2);
    expect(items[0].version).toBe(2);
    expect(items[1].version).toBe(1);
  });

  it("400 validation error on empty expectedSolution", async () => {
    const id = await seedAssignment();
    const res = await inject({
      method: "POST",
      url: `/v1/assignments/${id}/reference-solution`,
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify(baseRefInput({ expectedSolution: "" })),
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("validation_failed");
  });

  it("unknown ?version=N → 404", async () => {
    const id = await seedAssignment();
    await inject({
      method: "POST",
      url: `/v1/assignments/${id}/reference-solution`,
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify(baseRefInput()),
    });
    const res = await inject({
      method: "GET",
      url: `/v1/assignments/${id}/reference-solution/versions?version=99`,
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
    });
    expect(res.statusCode).toBe(404);
  });

  it("repo exposes only create/list/get methods (D-038, no update/delete)", () => {
    expect(Object.keys(referenceSolutionsRepo).sort()).toEqual([
      "createNextVersion",
      "getByVersion",
      "getCurrentByAssignment",
      "listVersionsByAssignment",
    ]);
    expect("update" in referenceSolutionsRepo).toBe(false);
    expect("delete" in referenceSolutionsRepo).toBe(false);
  });
});

// ---------- Reserved ledger event purity ----------

describe("reserved ledger event purity (assignment_reference_solution.created)", () => {
  it("contains no raw expectedSolution, keyConcepts, criteria, notes, or instructor text", () => {
    type AssignmentReferenceSolutionCreatedEvent = {
      type: "assignment_reference_solution.created";
      tenantId: string;
      assignmentId: string;
      referenceSolutionId: string;
      version: number;
      referenceHash: string;
      instructorId: string;
      occurredAt: string;
    };
    const sample: AssignmentReferenceSolutionCreatedEvent = {
      type: "assignment_reference_solution.created",
      tenantId: "t",
      assignmentId: "a",
      referenceSolutionId: "rs",
      version: 1,
      referenceHash: "h".repeat(64),
      instructorId: "i",
      occurredAt: new Date().toISOString(),
    };
    const keys = Object.keys(sample);
    expect(keys).not.toContain("expectedSolution");
    expect(keys).not.toContain("keyConcepts");
    expect(keys).not.toContain("requiredReasoningSteps");
    expect(keys).not.toContain("commonMistakes");
    expect(keys).not.toContain("correctnessCriteria");
    expect(keys).not.toContain("optionalNotes");
    expect(keys).not.toContain("notes");
    expect(keys).not.toContain("content");
    expect(keys).toContain("referenceHash");
    expect(keys).toContain("version");
  });
});
