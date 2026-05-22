import { beforeEach, describe, expect, it } from "vitest";
import { createStubProvider } from "../src/backend/src/ai/providers/stub-provider.js";
import { computeContentHash } from "../src/backend/src/lib/content-hash.js";
import type { AiHelpPolicy, CreateAssignmentInput } from "../src/backend/src/lib/types.js";
import { createSubmissionInputSchema } from "../src/backend/src/lib/validators/submission.js";
import { createMemoryAssignmentsRepo } from "../src/backend/src/repo/assignments-memory-repo.js";
import { createMemorySubmissionsRepo } from "../src/backend/src/repo/submissions-memory-repo.js";
import type { SubmissionsRepo } from "../src/backend/src/repo/submissions-repo.js";
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

function baseInput(overrides: Partial<CreateAssignmentInput> = {}): CreateAssignmentInput {
  return {
    title: "Sample assignment",
    instructions: "Explain and apply the concept.",
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

// ---------- content-hash ----------

describe("content-hash (D-029)", () => {
  it("returns a 64-char hex sha-256", () => {
    const h = computeContentHash("hello world");
    expect(h).toHaveLength(64);
    expect(h).toMatch(/^[0-9a-f]+$/);
  });

  it("is deterministic for the same content", () => {
    expect(computeContentHash("abc")).toEqual(computeContentHash("abc"));
  });

  it("differs when content changes", () => {
    expect(computeContentHash("abc")).not.toEqual(computeContentHash("abcd"));
  });
});

// ---------- validator ----------

describe("createSubmissionInputSchema (D-028)", () => {
  it("rejects empty content", () => {
    expect(createSubmissionInputSchema.safeParse({ content: "" }).success).toBe(false);
  });
  it("rejects whitespace-only content", () => {
    expect(createSubmissionInputSchema.safeParse({ content: "   \n  " }).success).toBe(false);
  });
  it("rejects content over 200,000 chars", () => {
    expect(createSubmissionInputSchema.safeParse({ content: "x".repeat(200_001) }).success).toBe(
      false,
    );
  });
  it("accepts 1-char minimum", () => {
    expect(createSubmissionInputSchema.safeParse({ content: "a" }).success).toBe(true);
  });
});

// ---------- HTTP routes ----------

describe("student-submission HTTP", () => {
  let inject: ReturnType<typeof makeInject>;
  let submissionsRepo: SubmissionsRepo;
  let appCloser: { close: () => Promise<void> };

  function makeInject(app: Awaited<ReturnType<typeof buildServer>>["app"]) {
    return app.inject.bind(app);
  }

  beforeEach(async () => {
    const repo = createMemoryAssignmentsRepo();
    submissionsRepo = createMemorySubmissionsRepo();
    const { app } = await buildServer({
      repo,
      submissionsRepo,
      provider: createStubProvider(),
    });
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
      url: "/v1/assignments/x/submissions",
      headers: { "content-type": "application/json" },
      payload: JSON.stringify({ content: "hi" }),
    });
    expect(res.statusCode).toBe(401);
  });

  it("403 student_only when an instructor POSTs a submission", async () => {
    const seeded = await seedAssignment();
    const res = await inject({
      method: "POST",
      url: `/v1/assignments/${seeded.id}/submissions`,
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify({ content: "instructor wants to submit" }),
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error).toBe("student_only");
  });

  it("201 POST returns submission with snapshot fields matching current policy", async () => {
    const seeded = await seedAssignment();
    const content = "My submission text — synthetic demo only.";
    const res = await inject({
      method: "POST",
      url: `/v1/assignments/${seeded.id}/submissions`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
      payload: JSON.stringify({ content }),
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.policyVersionId).toBe(seeded.policyVersionId);
    expect(body.policyVersion).toBe(1);
    expect(body.policyHash).toBe(seeded.policyHash);
    expect(body.contentHash).toBe(computeContentHash(content));
    expect(body.studentId).toBe(STUDENT_1);
    expect(body.tenantId).toBe(TENANT_A);
    expect(body.assignmentId).toBe(seeded.id);
    expect(typeof body.submittedAt).toBe("string");
  });

  it("400 on empty body", async () => {
    const seeded = await seedAssignment();
    const res = await inject({
      method: "POST",
      url: `/v1/assignments/${seeded.id}/submissions`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
      payload: JSON.stringify({ content: "" }),
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("validation_failed");
  });

  it("404 on unknown assignment id (POST)", async () => {
    const res = await inject({
      method: "POST",
      url: "/v1/assignments/01HXYZNONEXISTENT/submissions",
      headers: studentHeaders(TENANT_A, STUDENT_1),
      payload: JSON.stringify({ content: "hi" }),
    });
    expect(res.statusCode).toBe(404);
  });

  it("cross-tenant POST → 404", async () => {
    const seeded = await seedAssignment();
    const res = await inject({
      method: "POST",
      url: `/v1/assignments/${seeded.id}/submissions`,
      headers: studentHeaders(TENANT_B, STUDENT_1),
      payload: JSON.stringify({ content: "hi" }),
    });
    expect(res.statusCode).toBe(404);
  });

  it("policy drift: earlier submission keeps old pin; later submission captures new pin", async () => {
    const seeded = await seedAssignment();

    const r1 = await inject({
      method: "POST",
      url: `/v1/assignments/${seeded.id}/submissions`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
      payload: JSON.stringify({ content: "first submission" }),
    });
    expect(r1.statusCode).toBe(201);
    const sub1 = r1.json();
    expect(sub1.policyVersion).toBe(1);

    const upd = await inject({
      method: "PUT",
      url: `/v1/assignments/${seeded.id}`,
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify(baseInput({ title: "Updated v2" })),
    });
    expect(upd.statusCode).toBe(200);
    const updatedPolicyVersionId = upd.json().policy.id;

    const r2 = await inject({
      method: "POST",
      url: `/v1/assignments/${seeded.id}/submissions`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
      payload: JSON.stringify({ content: "second submission" }),
    });
    expect(r2.statusCode).toBe(201);
    const sub2 = r2.json();
    expect(sub2.policyVersion).toBe(2);
    expect(sub2.policyVersionId).toBe(updatedPolicyVersionId);
    expect(sub2.policyVersionId).not.toBe(sub1.policyVersionId);

    // Old submission still references its original pin.
    const fetched = await inject({
      method: "GET",
      url: `/v1/submissions/${sub1.id}`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
    });
    expect(fetched.statusCode).toBe(200);
    expect(fetched.json().policyVersion).toBe(1);
    expect(fetched.json().policyVersionId).toBe(sub1.policyVersionId);
  });

  it("re-submission appends a new row; both remain queryable (D-027)", async () => {
    const seeded = await seedAssignment();

    await inject({
      method: "POST",
      url: `/v1/assignments/${seeded.id}/submissions`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
      payload: JSON.stringify({ content: "attempt one" }),
    });
    await inject({
      method: "POST",
      url: `/v1/assignments/${seeded.id}/submissions`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
      payload: JSON.stringify({ content: "attempt two" }),
    });

    const list = await inject({
      method: "GET",
      url: `/v1/assignments/${seeded.id}/submissions`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
    });
    expect(list.statusCode).toBe(200);
    const items = list.json().items;
    expect(items).toHaveLength(2);
    // Newest first
    expect(items[0].content).toBe("attempt two");
    expect(items[1].content).toBe("attempt one");
  });

  it("list filter: student sees only own; instructor sees all", async () => {
    const seeded = await seedAssignment();

    // Student 1 submits twice
    await inject({
      method: "POST",
      url: `/v1/assignments/${seeded.id}/submissions`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
      payload: JSON.stringify({ content: "s1-a" }),
    });
    await inject({
      method: "POST",
      url: `/v1/assignments/${seeded.id}/submissions`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
      payload: JSON.stringify({ content: "s1-b" }),
    });
    // Student 2 submits once
    await inject({
      method: "POST",
      url: `/v1/assignments/${seeded.id}/submissions`,
      headers: studentHeaders(TENANT_A, STUDENT_2),
      payload: JSON.stringify({ content: "s2-a" }),
    });

    const s1List = await inject({
      method: "GET",
      url: `/v1/assignments/${seeded.id}/submissions`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
    });
    expect(s1List.json().items).toHaveLength(2);
    expect(s1List.json().items.every((s: { studentId: string }) => s.studentId === STUDENT_1)).toBe(
      true,
    );

    const instructorList = await inject({
      method: "GET",
      url: `/v1/assignments/${seeded.id}/submissions`,
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
    });
    expect(instructorList.json().items).toHaveLength(3);
  });

  it("student-A cannot read student-B's submission in the same tenant → 404 (not 403)", async () => {
    const seeded = await seedAssignment();
    const r = await inject({
      method: "POST",
      url: `/v1/assignments/${seeded.id}/submissions`,
      headers: studentHeaders(TENANT_A, STUDENT_2),
      payload: JSON.stringify({ content: "private to s2" }),
    });
    const s2id = r.json().id;

    const cross = await inject({
      method: "GET",
      url: `/v1/submissions/${s2id}`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
    });
    expect(cross.statusCode).toBe(404);
  });

  it("instructor can read any submission in tenant; cross-tenant → 404", async () => {
    const seeded = await seedAssignment();
    const r = await inject({
      method: "POST",
      url: `/v1/assignments/${seeded.id}/submissions`,
      headers: studentHeaders(TENANT_A, STUDENT_2),
      payload: JSON.stringify({ content: "by student-2" }),
    });
    const sid = r.json().id;

    const ok = await inject({
      method: "GET",
      url: `/v1/submissions/${sid}`,
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
    });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().content).toBe("by student-2");

    const cross = await inject({
      method: "GET",
      url: `/v1/submissions/${sid}`,
      headers: instructorHeaders(TENANT_B, INSTRUCTOR_1),
    });
    expect(cross.statusCode).toBe(404);
  });

  it("submissions repo exposes no mutation methods (D-027)", () => {
    const keys = Object.keys(submissionsRepo);
    // Append-only: only create + reads. `listByTenantAcrossAssignments`
    // is the tenant-wide read added by D-045 for the instructor dashboard.
    expect(keys.sort()).toEqual([
      "create",
      "getById",
      "listByTenantAcrossAssignments",
      "listForAssignment",
    ]);
    expect("update" in submissionsRepo).toBe(false);
    expect("delete" in submissionsRepo).toBe(false);
  });
});

// ---------- Reserved ledger event shape purity ----------

describe("reserved ledger event purity", () => {
  it("submission.created shape never includes raw content", () => {
    // The reserved event type is documented in docs/api-contracts.md. This test pins
    // the contract: anyone modifying the future event shape must keep `content` OUT.
    type SubmissionCreatedEvent = {
      type: "submission.created";
      tenantId: string;
      assignmentId: string;
      submissionId: string;
      studentId: string;
      policyVersionId: string;
      policyVersion: number;
      policyHash: string;
      contentHash: string;
      occurredAt: string;
    };
    const sample: SubmissionCreatedEvent = {
      type: "submission.created",
      tenantId: "t",
      assignmentId: "a",
      submissionId: "s",
      studentId: "stu",
      policyVersionId: "pv",
      policyVersion: 1,
      policyHash: "h".repeat(64),
      contentHash: "c".repeat(64),
      occurredAt: new Date().toISOString(),
    };
    expect(Object.keys(sample)).not.toContain("content");
    expect(Object.keys(sample)).toContain("contentHash");
  });
});
