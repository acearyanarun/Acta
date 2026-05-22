import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStubConceptCheckProvider } from "../src/backend/src/ai/concept-check/stub-concept-check-provider.js";
import type { ConceptCheckProvider } from "../src/backend/src/ai/concept-check/types.js";
import { createStubProvider } from "../src/backend/src/ai/providers/stub-provider.js";
import type { AiProvider } from "../src/backend/src/ai/providers/types.js";
import { createStubVerificationProvider } from "../src/backend/src/ai/verification/stub-verification-provider.js";
import type { VerificationProvider } from "../src/backend/src/ai/verification/types.js";
import {
  NEEDS_ATTENTION_CAP,
  RECENT_SUBMISSIONS_CAP,
  RECENT_VERIFICATIONS_CAP,
  aggregateInstructorDashboard,
} from "../src/backend/src/lib/dashboard-aggregator.js";
import type {
  AiHelpPolicy,
  Assignment,
  AssignmentPolicyVersion,
  ConceptCheckSet,
  ConceptCheckVerification,
  CreateAssignmentInput,
  Submission,
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
const INSTRUCTOR_2 = "instructor-2";
const STUDENT_1 = "student-1";
const STUDENT_2 = "student-2";

const ALL_AI: AiHelpPolicy = {
  conceptExplanation: true,
  hints: true,
  examples: true,
  debuggingGuidance: true,
  restrictFinalAnswer: true,
};

function baseAssignmentInput(
  overrides: Partial<CreateAssignmentInput> = {},
): CreateAssignmentInput {
  return {
    title: "Linear regression case",
    instructions: "Analyze the dataset and justify your model choice.",
    rubric: "Show your reasoning. Cite assumptions.",
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

// ---------- Aggregator unit tests ----------

function mkPolicy(
  assignmentId: string,
  overrides: Partial<AssignmentPolicyVersion> = {},
): AssignmentPolicyVersion {
  return {
    id: `pv-${assignmentId}`,
    assignmentId,
    tenantId: TENANT_A,
    instructorId: INSTRUCTOR_1,
    version: 1,
    title: `Title ${assignmentId}`,
    instructions: "Instructions",
    rubric: null,
    aiHelp: ALL_AI,
    aiHelpEnabled: true,
    verificationMode: "score",
    policyHash: "f".repeat(64),
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function mkAssignment(id: string, overrides: Partial<Assignment> = {}): Assignment {
  return {
    id,
    tenantId: TENANT_A,
    instructorId: INSTRUCTOR_1,
    currentVersion: 1,
    policy: mkPolicy(id),
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function mkSubmission(id: string, overrides: Partial<Submission> = {}): Submission {
  return {
    id,
    tenantId: TENANT_A,
    assignmentId: "a-1",
    studentId: STUDENT_1,
    policyVersionId: "pv-a-1",
    policyVersion: 1,
    policyHash: "f".repeat(64),
    content: "submission body",
    contentHash: "c".repeat(64),
    submittedAt: "2026-01-02T00:00:00.000Z",
    ...overrides,
  };
}

function mkSet(id: string, overrides: Partial<ConceptCheckSet> = {}): ConceptCheckSet {
  return {
    id,
    tenantId: TENANT_A,
    assignmentId: "a-1",
    submissionId: "s-1",
    studentId: STUDENT_1,
    policyVersionId: "pv-a-1",
    policyVersion: 1,
    policyHash: "f".repeat(64),
    submissionContentHash: "c".repeat(64),
    questions: [{ id: "q1", ordinal: 1, prompt: "Why?" }],
    questionCount: 1,
    provider: "stub",
    model: null,
    generatedAt: "2026-01-03T00:00:00.000Z",
    referenceSolutionId: null,
    referenceVersion: null,
    referenceHash: null,
    ...overrides,
  };
}

function mkVerification(
  id: string,
  overrides: Partial<ConceptCheckVerification> = {},
): ConceptCheckVerification {
  return {
    id,
    tenantId: TENANT_A,
    assignmentId: "a-1",
    submissionId: "s-1",
    conceptCheckSetId: "cc-1",
    studentId: STUDENT_1,
    policyVersionId: "pv-a-1",
    policyVersion: 1,
    policyHash: "f".repeat(64),
    submissionContentHash: "c".repeat(64),
    answers: [{ questionId: "q1", answer: "answer" }],
    result: "pass",
    overallFeedback: "ok",
    perQuestionFeedback: [{ questionId: "q1", status: "sufficient", feedback: "ok" }],
    provider: "stub",
    model: null,
    evaluatedAt: "2026-01-04T00:00:00.000Z",
    referenceSolutionId: null,
    referenceVersion: null,
    referenceHash: null,
    ...overrides,
  };
}

describe("aggregateInstructorDashboard (unit)", () => {
  it("returns zeros and empty arrays for empty inputs", () => {
    const out = aggregateInstructorDashboard({
      assignments: [],
      submissions: [],
      sets: [],
      verifications: [],
    });
    expect(out.summary).toEqual({
      totalAssignments: 0,
      totalSubmissions: 0,
      pendingConceptChecks: 0,
      pendingVerification: 0,
      passed: 0,
      needsReview: 0,
      failed: 0,
    });
    expect(out.needsAttention).toEqual([]);
    expect(out.recentSubmissions).toEqual([]);
    expect(out.recentVerifications).toEqual([]);
  });

  it("counts submitted_no_checks: submission with no sets surfaces in needs attention", () => {
    const out = aggregateInstructorDashboard({
      assignments: [mkAssignment("a-1")],
      submissions: [mkSubmission("s-1")],
      sets: [],
      verifications: [],
    });
    expect(out.summary.totalAssignments).toBe(1);
    expect(out.summary.totalSubmissions).toBe(1);
    expect(out.summary.pendingConceptChecks).toBe(1);
    expect(out.summary.pendingVerification).toBe(0);
    expect(out.needsAttention).toHaveLength(1);
    expect(out.needsAttention[0]?.status).toBe("submitted_no_checks");
    expect(out.needsAttention[0]?.latestVerificationResult).toBeNull();
    expect(out.needsAttention[0]?.reviewUrl).toBe("/submissions/s-1?role=instructor");
  });

  it("counts checks_no_verification: submission with sets but no attempts", () => {
    const out = aggregateInstructorDashboard({
      assignments: [mkAssignment("a-1")],
      submissions: [mkSubmission("s-1")],
      sets: [mkSet("cc-1")],
      verifications: [],
    });
    expect(out.summary.pendingConceptChecks).toBe(0);
    expect(out.summary.pendingVerification).toBe(1);
    expect(out.needsAttention[0]?.status).toBe("checks_no_verification");
  });

  it("counts pass / needs_review / fail from latest verification per submission", () => {
    const out = aggregateInstructorDashboard({
      assignments: [mkAssignment("a-1")],
      submissions: [mkSubmission("s-1"), mkSubmission("s-2"), mkSubmission("s-3")],
      sets: [
        mkSet("cc-1", { submissionId: "s-1" }),
        mkSet("cc-2", { submissionId: "s-2" }),
        mkSet("cc-3", { submissionId: "s-3" }),
      ],
      verifications: [
        mkVerification("v-1", { conceptCheckSetId: "cc-1", submissionId: "s-1", result: "pass" }),
        mkVerification("v-2", {
          conceptCheckSetId: "cc-2",
          submissionId: "s-2",
          result: "needs_review",
        }),
        mkVerification("v-3", { conceptCheckSetId: "cc-3", submissionId: "s-3", result: "fail" }),
      ],
    });
    expect(out.summary.passed).toBe(1);
    expect(out.summary.needsReview).toBe(1);
    expect(out.summary.failed).toBe(1);
    // pass should NOT appear in needs attention; needs_review and fail should.
    const statuses = out.needsAttention.map((r) => r.status).sort();
    expect(statuses).toEqual(["fail", "needs_review"]);
  });

  it("re-verification: latest attempt decides status (fail then pass → pass)", () => {
    const out = aggregateInstructorDashboard({
      assignments: [mkAssignment("a-1")],
      submissions: [mkSubmission("s-1")],
      sets: [mkSet("cc-1")],
      verifications: [
        mkVerification("v-old", {
          result: "fail",
          evaluatedAt: "2026-01-04T00:00:00.000Z",
        }),
        mkVerification("v-new", {
          result: "pass",
          evaluatedAt: "2026-01-05T00:00:00.000Z",
        }),
      ],
    });
    expect(out.summary.passed).toBe(1);
    expect(out.summary.failed).toBe(0);
    expect(out.needsAttention).toHaveLength(0);
  });

  it("multiple sets: latest set + its latest attempt decides status", () => {
    const out = aggregateInstructorDashboard({
      assignments: [mkAssignment("a-1")],
      submissions: [mkSubmission("s-1")],
      sets: [
        mkSet("cc-old", { generatedAt: "2026-01-03T00:00:00.000Z" }),
        mkSet("cc-new", { generatedAt: "2026-01-05T00:00:00.000Z" }),
      ],
      verifications: [
        // Old set has a pass; new set is unattempted. Status should be checks_no_verification.
        mkVerification("v-old", {
          conceptCheckSetId: "cc-old",
          result: "pass",
          evaluatedAt: "2026-01-04T00:00:00.000Z",
        }),
      ],
    });
    expect(out.summary.passed).toBe(0);
    expect(out.summary.pendingVerification).toBe(1);
    expect(out.needsAttention[0]?.status).toBe("checks_no_verification");
  });

  it("needsAttention sorted oldest-lastActivityAt first", () => {
    const out = aggregateInstructorDashboard({
      assignments: [mkAssignment("a-1")],
      submissions: [
        mkSubmission("s-newer", { submittedAt: "2026-02-10T00:00:00.000Z" }),
        mkSubmission("s-older", { submittedAt: "2026-02-01T00:00:00.000Z" }),
      ],
      sets: [],
      verifications: [],
    });
    expect(out.needsAttention.map((r) => r.submissionId)).toEqual(["s-older", "s-newer"]);
  });

  it("needsAttention is capped at NEEDS_ATTENTION_CAP", () => {
    const submissions: Submission[] = [];
    for (let i = 0; i < NEEDS_ATTENTION_CAP + 7; i++) {
      submissions.push(
        mkSubmission(`s-${i}`, {
          submittedAt: `2026-02-${String((i % 28) + 1).padStart(2, "0")}T00:00:00.000Z`,
        }),
      );
    }
    const out = aggregateInstructorDashboard({
      assignments: [mkAssignment("a-1")],
      submissions,
      sets: [],
      verifications: [],
    });
    expect(out.needsAttention).toHaveLength(NEEDS_ATTENTION_CAP);
  });

  it("recentSubmissions newest-first, capped at RECENT_SUBMISSIONS_CAP", () => {
    const submissions: Submission[] = [];
    for (let i = 0; i < RECENT_SUBMISSIONS_CAP + 5; i++) {
      const day = String(i + 1).padStart(2, "0");
      submissions.push(mkSubmission(`s-${i}`, { submittedAt: `2026-03-${day}T00:00:00.000Z` }));
    }
    const out = aggregateInstructorDashboard({
      assignments: [mkAssignment("a-1")],
      submissions,
      sets: [],
      verifications: [],
    });
    expect(out.recentSubmissions).toHaveLength(RECENT_SUBMISSIONS_CAP);
    // Newest first
    const dates = out.recentSubmissions.map((r) => r.submittedAt);
    const sorted = [...dates].sort().reverse();
    expect(dates).toEqual(sorted);
  });

  it("recentVerifications newest-first, capped at RECENT_VERIFICATIONS_CAP", () => {
    const verifications: ConceptCheckVerification[] = [];
    for (let i = 0; i < RECENT_VERIFICATIONS_CAP + 4; i++) {
      const day = String(i + 1).padStart(2, "0");
      verifications.push(mkVerification(`v-${i}`, { evaluatedAt: `2026-04-${day}T00:00:00.000Z` }));
    }
    const out = aggregateInstructorDashboard({
      assignments: [mkAssignment("a-1")],
      submissions: [mkSubmission("s-1")],
      sets: [mkSet("cc-1")],
      verifications,
    });
    expect(out.recentVerifications).toHaveLength(RECENT_VERIFICATIONS_CAP);
    const dates = out.recentVerifications.map((r) => r.evaluatedAt);
    const sorted = [...dates].sort().reverse();
    expect(dates).toEqual(sorted);
  });

  it("reviewUrl uses /submissions/<id>?role=instructor", () => {
    const out = aggregateInstructorDashboard({
      assignments: [mkAssignment("a-1")],
      submissions: [mkSubmission("s-xyz")],
      sets: [mkSet("cc-1", { submissionId: "s-xyz" })],
      verifications: [mkVerification("v-1", { conceptCheckSetId: "cc-1", submissionId: "s-xyz" })],
    });
    expect(out.recentSubmissions[0]?.reviewUrl).toBe("/submissions/s-xyz?role=instructor");
    expect(out.recentVerifications[0]?.reviewUrl).toBe("/submissions/s-xyz?role=instructor");
  });

  it("reference pin flows through to recentSubmissions (via latest set) and recentVerifications", () => {
    const refHash = "a".repeat(64);
    const out = aggregateInstructorDashboard({
      assignments: [mkAssignment("a-1")],
      submissions: [mkSubmission("s-1")],
      sets: [
        mkSet("cc-1", {
          referenceSolutionId: "rs-1",
          referenceVersion: 2,
          referenceHash: refHash,
        }),
      ],
      verifications: [
        mkVerification("v-1", {
          referenceSolutionId: "rs-1",
          referenceVersion: 2,
          referenceHash: refHash,
        }),
      ],
    });
    expect(out.recentSubmissions[0]?.referenceVersion).toBe(2);
    expect(out.recentSubmissions[0]?.referenceHash).toBe(refHash);
    expect(out.recentVerifications[0]?.referenceVersion).toBe(2);
    expect(out.recentVerifications[0]?.referenceHash).toBe(refHash);
  });

  it("defensively drops submissions whose assignment is missing from the input", () => {
    const out = aggregateInstructorDashboard({
      assignments: [mkAssignment("a-1")],
      submissions: [
        mkSubmission("s-good", { assignmentId: "a-1" }),
        mkSubmission("s-orphan", { assignmentId: "a-missing" }),
      ],
      sets: [],
      verifications: [],
    });
    expect(out.recentSubmissions.map((r) => r.submissionId)).toEqual(["s-good"]);
    expect(out.needsAttention.map((r) => r.submissionId)).toEqual(["s-good"]);
  });
});

// ---------- HTTP route tests ----------

describe("GET /v1/instructor/dashboard", () => {
  let inject: ReturnType<typeof makeInject>;
  let appCloser: { close: () => Promise<void> };
  let conceptCheckProvider: ConceptCheckProvider;
  let verificationProvider: VerificationProvider;
  let helpProvider: AiProvider;
  let conceptCheckCalls = 0;
  let verificationCalls = 0;
  let helpCalls = 0;

  function makeInject(app: Awaited<ReturnType<typeof buildServer>>["app"]) {
    return app.inject.bind(app);
  }

  beforeEach(async () => {
    conceptCheckCalls = 0;
    verificationCalls = 0;
    helpCalls = 0;
    const stubCC = createStubConceptCheckProvider();
    const stubV = createStubVerificationProvider();
    const stubHelp = createStubProvider();
    conceptCheckProvider = {
      name: "stub",
      model: null,
      generate: vi.fn(async (r) => {
        conceptCheckCalls += 1;
        return stubCC.generate(r);
      }),
    };
    verificationProvider = {
      name: "stub",
      model: null,
      evaluate: vi.fn(async (r) => {
        verificationCalls += 1;
        return stubV.evaluate(r);
      }),
    };
    helpProvider = {
      name: "stub",
      model: null,
      respond: vi.fn(async (r) => {
        helpCalls += 1;
        return stubHelp.respond(r);
      }),
    };

    const repo = createMemoryAssignmentsRepo();
    const submissionsRepo = createMemorySubmissionsRepo();
    const conceptCheckSetsRepo = createMemoryConceptCheckSetsRepo();
    const conceptCheckVerificationsRepo = createMemoryConceptCheckVerificationsRepo();
    const referenceSolutionsRepo = createMemoryReferenceSolutionsRepo();
    const { app } = await buildServer({
      repo,
      submissionsRepo,
      conceptCheckSetsRepo,
      conceptCheckVerificationsRepo,
      referenceSolutionsRepo,
      provider: helpProvider,
      conceptCheckProvider,
      verificationProvider,
    });
    inject = makeInject(app);
    appCloser = { close: async () => app.close() };
    return async () => appCloser.close();
  });

  async function createAssignment(tenantId: string, instructorId: string, title: string) {
    const r = await inject({
      method: "POST",
      url: "/v1/assignments",
      headers: instructorHeaders(tenantId, instructorId),
      payload: JSON.stringify(baseAssignmentInput({ title })),
    });
    expect(r.statusCode).toBe(201);
    return r.json() as Assignment;
  }

  async function createSubmission(
    tenantId: string,
    studentId: string,
    assignmentId: string,
    content = "I argue that the relationship is linear because of the scatter pattern observed.",
  ) {
    const r = await inject({
      method: "POST",
      url: `/v1/assignments/${assignmentId}/submissions`,
      headers: studentHeaders(tenantId, studentId),
      payload: JSON.stringify({ content }),
    });
    expect(r.statusCode).toBe(201);
    return r.json() as Submission;
  }

  async function generateChecks(tenantId: string, studentId: string, submissionId: string) {
    const r = await inject({
      method: "POST",
      url: `/v1/submissions/${submissionId}/concept-checks`,
      headers: studentHeaders(tenantId, studentId),
      payload: "{}",
    });
    expect(r.statusCode).toBe(201);
    return r.json() as ConceptCheckSet;
  }

  async function verify(
    tenantId: string,
    studentId: string,
    setId: string,
    questions: { id: string }[],
    longAnswers: boolean,
  ) {
    const longAnswer =
      "I chose this approach because the data exhibits a roughly linear pattern; the residuals appeared Gaussian and I judged that least squares would balance bias and variance for the assignment.";
    const answers: VerificationAnswer[] = questions.map((q) => ({
      questionId: q.id,
      answer: longAnswers ? longAnswer : "no",
    }));
    const r = await inject({
      method: "POST",
      url: `/v1/concept-check-sets/${setId}/verifications`,
      headers: studentHeaders(tenantId, studentId),
      payload: JSON.stringify({ answers }),
    });
    expect(r.statusCode).toBe(201);
    return r.json() as ConceptCheckVerification;
  }

  it("401 when no auth headers at all", async () => {
    const res = await inject({
      method: "GET",
      url: "/v1/instructor/dashboard",
      headers: { "content-type": "application/json" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("404 when student-only auth (instructor-only route)", async () => {
    const res = await inject({
      method: "GET",
      url: "/v1/instructor/dashboard",
      headers: studentHeaders(TENANT_A, STUDENT_1),
    });
    expect(res.statusCode).toBe(404);
  });

  it("200 + empty data for instructor on an empty tenant (D-046 privacy)", async () => {
    const res = await inject({
      method: "GET",
      url: "/v1/instructor/dashboard",
      headers: instructorHeaders(TENANT_B, INSTRUCTOR_2),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.summary).toEqual({
      totalAssignments: 0,
      totalSubmissions: 0,
      pendingConceptChecks: 0,
      pendingVerification: 0,
      passed: 0,
      needsReview: 0,
      failed: 0,
    });
    expect(body.needsAttention).toEqual([]);
    expect(body.recentSubmissions).toEqual([]);
    expect(body.recentVerifications).toEqual([]);
  });

  it("200 populated tenant: aggregates counts and rows; verification provider NOT called", async () => {
    // Seed tenant A
    const a1 = await createAssignment(TENANT_A, INSTRUCTOR_1, "A1");
    const a2 = await createAssignment(TENANT_A, INSTRUCTOR_1, "A2");

    // s-a: submission only (submitted_no_checks)
    await createSubmission(TENANT_A, STUDENT_1, a1.id);

    // s-b: submission + set, no verification (checks_no_verification)
    const sb = await createSubmission(TENANT_A, STUDENT_2, a1.id);
    await generateChecks(TENANT_A, STUDENT_2, sb.id);

    // s-c: full pass
    const sc = await createSubmission(TENANT_A, STUDENT_1, a2.id);
    const ccc = await generateChecks(TENANT_A, STUDENT_1, sc.id);
    await verify(TENANT_A, STUDENT_1, ccc.id, ccc.questions, true);

    // s-d: full fail
    const sd = await createSubmission(TENANT_A, STUDENT_2, a2.id);
    const ccd = await generateChecks(TENANT_A, STUDENT_2, sd.id);
    await verify(TENANT_A, STUDENT_2, ccd.id, ccd.questions, false);

    // Reset evaluation call counters BEFORE hitting the dashboard.
    const ccBefore = conceptCheckCalls;
    const vBefore = verificationCalls;
    const helpBefore = helpCalls;

    const res = await inject({
      method: "GET",
      url: "/v1/instructor/dashboard",
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.summary.totalAssignments).toBe(2);
    expect(body.summary.totalSubmissions).toBe(4);
    expect(body.summary.pendingConceptChecks).toBe(1);
    expect(body.summary.pendingVerification).toBe(1);
    expect(body.summary.passed).toBe(1);
    expect(body.summary.failed).toBe(1);
    expect(body.summary.needsReview).toBe(0);

    // The pass should NOT appear in needsAttention; the other three should.
    const statuses = body.needsAttention.map((r: { status: string }) => r.status).sort();
    expect(statuses).toEqual(["checks_no_verification", "fail", "submitted_no_checks"]);

    // Newest first ordering
    const subDates = body.recentSubmissions.map((r: { submittedAt: string }) => r.submittedAt);
    expect([...subDates].sort().reverse()).toEqual(subDates);

    const verDates = body.recentVerifications.map((r: { evaluatedAt: string }) => r.evaluatedAt);
    expect([...verDates].sort().reverse()).toEqual(verDates);

    // No AI providers invoked by the dashboard route itself.
    expect(conceptCheckCalls).toBe(ccBefore);
    expect(verificationCalls).toBe(vBefore);
    expect(helpCalls).toBe(helpBefore);
  });

  it("does not leak across tenants: tenant B sees its own empty view even after tenant A populates", async () => {
    const a = await createAssignment(TENANT_A, INSTRUCTOR_1, "Tenant A");
    await createSubmission(TENANT_A, STUDENT_1, a.id);

    const res = await inject({
      method: "GET",
      url: "/v1/instructor/dashboard",
      headers: instructorHeaders(TENANT_B, INSTRUCTOR_2),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.summary.totalAssignments).toBe(0);
    expect(body.summary.totalSubmissions).toBe(0);
    expect(body.recentSubmissions).toEqual([]);
  });

  it("reviewUrl in each row uses /submissions/<id>?role=instructor", async () => {
    const a = await createAssignment(TENANT_A, INSTRUCTOR_1, "A");
    const s = await createSubmission(TENANT_A, STUDENT_1, a.id);
    const cc = await generateChecks(TENANT_A, STUDENT_1, s.id);
    await verify(TENANT_A, STUDENT_1, cc.id, cc.questions, true);

    const res = await inject({
      method: "GET",
      url: "/v1/instructor/dashboard",
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
    });
    const body = res.json();
    const expected = `/submissions/${s.id}?role=instructor`;
    expect(body.recentSubmissions[0].reviewUrl).toBe(expected);
    expect(body.recentVerifications[0].reviewUrl).toBe(expected);
  });
});
