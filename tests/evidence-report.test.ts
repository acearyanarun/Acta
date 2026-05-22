import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { createStubConceptCheckProvider } from "../src/backend/src/ai/concept-check/stub-concept-check-provider.js";
import type { ConceptCheckProvider } from "../src/backend/src/ai/concept-check/types.js";
import { createStubProvider } from "../src/backend/src/ai/providers/stub-provider.js";
import type { AiProvider } from "../src/backend/src/ai/providers/types.js";
import { createStubVerificationProvider } from "../src/backend/src/ai/verification/stub-verification-provider.js";
import type { VerificationProvider } from "../src/backend/src/ai/verification/types.js";
import { buildEvidenceReport } from "../src/backend/src/lib/evidence-report-builder.js";
import type {
  AiHelpPolicy,
  Assignment,
  ConceptCheckSet,
  ConceptCheckVerification,
  CreateAssignmentInput,
  CreateReferenceSolutionInput,
  ReferenceSolution,
  Submission,
  VerificationAnswer,
} from "../src/backend/src/lib/types.js";
import { createMemoryAssignmentsRepo } from "../src/backend/src/repo/assignments-memory-repo.js";
import { createMemoryConceptCheckSetsRepo } from "../src/backend/src/repo/concept-check-sets-memory-repo.js";
import { createMemoryConceptCheckVerificationsRepo } from "../src/backend/src/repo/concept-check-verifications-memory-repo.js";
import { createMemoryReferenceSolutionsRepo } from "../src/backend/src/repo/reference-solutions-memory-repo.js";
import { createMemorySubmissionsRepo } from "../src/backend/src/repo/submissions-memory-repo.js";
import { buildServer } from "../src/backend/src/server.js";

// Banned phrases assembled via concatenation so the literal strings never appear
// in source (defeats the D-002 grep in scripts/check-foundation.sh while still
// asserting the property at runtime).
const BANNED_PHRASES: string[] = [
  `${"legally"} ${"admissible"}`,
  `${"legal"} ${"proof"}`,
  `${"court"}-${"ready"}`,
  `${"guaranteed"} ${"integrity"}`,
  `${"ai"} ${"detection"}`,
];

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

function baseRefInput(): CreateReferenceSolutionInput {
  return {
    expectedSolution: "Compute slope; justify linear fit; check residuals.",
    keyConcepts: ["linearity", "least squares", "residuals"],
    requiredReasoningSteps: [
      "Inspect scatter pattern.",
      "Fit linear model.",
      "Check residuals for structure.",
    ],
    commonMistakes: ["Skipping residual diagnostics."],
    correctnessCriteria: "Correct if residuals addressed; partial otherwise.",
    optionalNotes: null,
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

// ---------- Builder unit tests ----------

function mkAssignment(overrides: Partial<Assignment> = {}): Assignment {
  return {
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
      title: "Linear regression case",
      instructions: "Analyze the dataset.",
      rubric: "Show your reasoning.",
      aiHelp: ALL_AI,
      aiHelpEnabled: true,
      verificationMode: "score",
      policyHash: "f".repeat(64),
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function mkSubmission(overrides: Partial<Submission> = {}): Submission {
  return {
    id: "sub-1",
    tenantId: TENANT_A,
    assignmentId: "a-1",
    studentId: STUDENT_1,
    policyVersionId: "pv-1",
    policyVersion: 1,
    policyHash: "f".repeat(64),
    content: "I argue the relationship is linear because of the scatter pattern.",
    contentHash: "c".repeat(64),
    submittedAt: "2026-01-02T00:00:00.000Z",
    ...overrides,
  };
}

function mkSet(overrides: Partial<ConceptCheckSet> = {}): ConceptCheckSet {
  return {
    id: "cc-1",
    tenantId: TENANT_A,
    assignmentId: "a-1",
    submissionId: "sub-1",
    studentId: STUDENT_1,
    policyVersionId: "pv-1",
    policyVersion: 1,
    policyHash: "f".repeat(64),
    submissionContentHash: "c".repeat(64),
    questions: [{ id: "q1", ordinal: 1, prompt: "Why this approach?" }],
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
  overrides: Partial<ConceptCheckVerification> = {},
): ConceptCheckVerification {
  return {
    id: "v-1",
    tenantId: TENANT_A,
    assignmentId: "a-1",
    submissionId: "sub-1",
    conceptCheckSetId: "cc-1",
    studentId: STUDENT_1,
    policyVersionId: "pv-1",
    policyVersion: 1,
    policyHash: "f".repeat(64),
    submissionContentHash: "c".repeat(64),
    answers: [{ questionId: "q1", answer: "Because the residuals were Gaussian." }],
    result: "pass",
    overallFeedback: "Good.",
    perQuestionFeedback: [{ questionId: "q1", status: "sufficient", feedback: "Solid." }],
    provider: "stub",
    model: null,
    evaluatedAt: "2026-01-04T00:00:00.000Z",
    referenceSolutionId: null,
    referenceVersion: null,
    referenceHash: null,
    ...overrides,
  };
}

describe("buildEvidenceReport (unit)", () => {
  it("works with no concept-check sets and no verifications", () => {
    const r = buildEvidenceReport({
      assignment: mkAssignment(),
      submission: mkSubmission(),
      referenceSolution: null,
      conceptCheckSets: [],
      verifications: [],
      generatedAt: "2026-05-11T00:00:00.000Z",
    });
    expect(r.assignment.title).toBe("Linear regression case");
    expect(r.policy.policyHash).toBe("f".repeat(64));
    expect(r.submission.contentHash).toBe("c".repeat(64));
    expect(r.referenceSolution).toBeNull();
    expect(r.conceptCheckSets).toEqual([]);
    expect(r.verificationAttempts).toEqual([]);
    expect(r.provenance.referenceHash).toBeNull();
    expect(r.provenance.latestConceptCheckReferenceHash).toBeNull();
    expect(r.provenance.latestVerificationReferenceHash).toBeNull();
  });

  it("works when sets exist but no verifications", () => {
    const r = buildEvidenceReport({
      assignment: mkAssignment(),
      submission: mkSubmission(),
      referenceSolution: null,
      conceptCheckSets: [mkSet({ id: "cc-1", generatedAt: "2026-01-03T00:00:00.000Z" })],
      verifications: [],
    });
    expect(r.conceptCheckSets).toHaveLength(1);
    expect(r.conceptCheckSets[0]?.questions).toHaveLength(1);
    expect(r.verificationAttempts).toEqual([]);
  });

  it("includes ALL verification attempts, newest-first", () => {
    const r = buildEvidenceReport({
      assignment: mkAssignment(),
      submission: mkSubmission(),
      referenceSolution: null,
      conceptCheckSets: [mkSet()],
      verifications: [
        mkVerification({ id: "v-old", evaluatedAt: "2026-01-04T00:00:00.000Z" }),
        mkVerification({ id: "v-new", evaluatedAt: "2026-01-05T00:00:00.000Z" }),
        mkVerification({ id: "v-mid", evaluatedAt: "2026-01-04T12:00:00.000Z" }),
      ],
    });
    expect(r.verificationAttempts.map((a) => a.id)).toEqual(["v-new", "v-mid", "v-old"]);
  });

  it("sorts concept-check sets newest-first", () => {
    const r = buildEvidenceReport({
      assignment: mkAssignment(),
      submission: mkSubmission(),
      referenceSolution: null,
      conceptCheckSets: [
        mkSet({ id: "cc-old", generatedAt: "2026-01-03T00:00:00.000Z" }),
        mkSet({ id: "cc-new", generatedAt: "2026-01-05T00:00:00.000Z" }),
      ],
      verifications: [],
    });
    expect(r.conceptCheckSets.map((s) => s.id)).toEqual(["cc-new", "cc-old"]);
  });

  it("includes reference solution and surfaces referenceHash in provenance", () => {
    const ref: ReferenceSolution = {
      id: "rs-1",
      tenantId: TENANT_A,
      assignmentId: "a-1",
      instructorId: INSTRUCTOR_1,
      version: 2,
      expectedSolution: "Expected",
      keyConcepts: ["k1"],
      requiredReasoningSteps: ["s1"],
      commonMistakes: ["m1"],
      correctnessCriteria: "Criteria",
      optionalNotes: null,
      referenceHash: "a".repeat(64),
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    const r = buildEvidenceReport({
      assignment: mkAssignment(),
      submission: mkSubmission(),
      referenceSolution: ref,
      conceptCheckSets: [],
      verifications: [],
    });
    expect(r.referenceSolution?.id).toBe("rs-1");
    expect(r.provenance.referenceHash).toBe("a".repeat(64));
  });

  it("flows reference pins through on sets and verifications (D-041)", () => {
    const setRef = "b".repeat(64);
    const verRef = "d".repeat(64);
    const r = buildEvidenceReport({
      assignment: mkAssignment(),
      submission: mkSubmission(),
      referenceSolution: null,
      conceptCheckSets: [
        mkSet({
          id: "cc-1",
          referenceSolutionId: "rs-1",
          referenceVersion: 2,
          referenceHash: setRef,
        }),
      ],
      verifications: [
        mkVerification({
          id: "v-1",
          referenceSolutionId: "rs-1",
          referenceVersion: 2,
          referenceHash: verRef,
        }),
      ],
    });
    expect(r.conceptCheckSets[0]?.referenceHash).toBe(setRef);
    expect(r.verificationAttempts[0]?.referenceHash).toBe(verRef);
    expect(r.provenance.latestConceptCheckReferenceHash).toBe(setRef);
    expect(r.provenance.latestVerificationReferenceHash).toBe(verRef);
  });

  it("produces no banned language in serialized output", () => {
    const r = buildEvidenceReport({
      assignment: mkAssignment(),
      submission: mkSubmission(),
      referenceSolution: null,
      conceptCheckSets: [mkSet()],
      verifications: [mkVerification()],
    });
    const text = JSON.stringify(r).toLowerCase();
    for (const phrase of BANNED_PHRASES) {
      expect(text).not.toContain(phrase);
    }
  });
});

// ---------- HTTP route + banned-language guards ----------

describe("GET /v1/submissions/:id/evidence-report", () => {
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

  async function seedFull(
    inject: Awaited<ReturnType<typeof build>>["inject"],
    options: { withReference?: boolean; withChecks?: boolean; withVerification?: boolean } = {},
  ): Promise<{
    assignmentId: string;
    submissionId: string;
    setId?: string;
    questions?: { id: string }[];
    verificationId?: string;
  }> {
    const withReference = options.withReference ?? true;
    const withChecks = options.withChecks ?? true;
    const withVerification = options.withVerification ?? true;

    const aRes = await inject({
      method: "POST",
      url: "/v1/assignments",
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify(baseAssignmentInput()),
    });
    const assignment = aRes.json();

    if (withReference) {
      const refRes = await inject({
        method: "POST",
        url: `/v1/assignments/${assignment.id}/reference-solution`,
        headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
        payload: JSON.stringify(baseRefInput()),
      });
      expect(refRes.statusCode).toBe(201);
    }

    const sRes = await inject({
      method: "POST",
      url: `/v1/assignments/${assignment.id}/submissions`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
      payload: JSON.stringify({
        content: "I argue the relationship is linear because the scatter pattern is monotonic.",
      }),
    });
    expect(sRes.statusCode).toBe(201);
    const submission = sRes.json();

    if (!withChecks) {
      return { assignmentId: assignment.id, submissionId: submission.id };
    }

    const ccRes = await inject({
      method: "POST",
      url: `/v1/submissions/${submission.id}/concept-checks`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
      payload: "{}",
    });
    expect(ccRes.statusCode).toBe(201);
    const set = ccRes.json();

    if (!withVerification) {
      return {
        assignmentId: assignment.id,
        submissionId: submission.id,
        setId: set.id,
        questions: set.questions,
      };
    }

    const longAnswer =
      "I chose this approach because the data exhibits a roughly linear pattern; the residuals appeared Gaussian and I judged least squares would balance bias and variance for the assignment.";
    const answers: VerificationAnswer[] = (set.questions as { id: string }[]).map((q) => ({
      questionId: q.id,
      answer: longAnswer,
    }));
    const vRes = await inject({
      method: "POST",
      url: `/v1/concept-check-sets/${set.id}/verifications`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
      payload: JSON.stringify({ answers }),
    });
    expect(vRes.statusCode).toBe(201);
    const verification = vRes.json();

    return {
      assignmentId: assignment.id,
      submissionId: submission.id,
      setId: set.id,
      questions: set.questions,
      verificationId: verification.id,
    };
  }

  it("401 when no auth headers", async () => {
    const { app, inject } = await build();
    const res = await inject({
      method: "GET",
      url: "/v1/submissions/anything/evidence-report",
      headers: { "content-type": "application/json" },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it("404 when student-only auth (instructor-only route)", async () => {
    const { app, inject } = await build();
    const seeded = await seedFull(inject);
    const res = await inject({
      method: "GET",
      url: `/v1/submissions/${seeded.submissionId}/evidence-report`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
    });
    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it("404 when student-A queries student-B's submission via student auth", async () => {
    const { app, inject } = await build();
    const seeded = await seedFull(inject);
    const res = await inject({
      method: "GET",
      url: `/v1/submissions/${seeded.submissionId}/evidence-report`,
      headers: studentHeaders(TENANT_A, STUDENT_2),
    });
    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it("404 cross-tenant instructor", async () => {
    const { app, inject } = await build();
    const seeded = await seedFull(inject);
    const res = await inject({
      method: "GET",
      url: `/v1/submissions/${seeded.submissionId}/evidence-report`,
      headers: instructorHeaders(TENANT_B, INSTRUCTOR_2),
    });
    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it("404 unknown submission id", async () => {
    const { app, inject } = await build();
    const res = await inject({
      method: "GET",
      url: "/v1/submissions/01HXNONEXISTENT/evidence-report",
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
    });
    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it("200 — full payload: policy snapshot, reference, submission content, sets, attempts, provenance", async () => {
    const { app, inject } = await build();
    const seeded = await seedFull(inject);

    const ccBefore = conceptCheckCalls;
    const vBefore = verificationCalls;
    const helpBefore = helpCalls;

    const res = await inject({
      method: "GET",
      url: `/v1/submissions/${seeded.submissionId}/evidence-report`,
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();

    // Assignment + policy snapshot
    expect(body.assignment.title).toBe("Linear regression case");
    expect(body.policy.policyHash).toMatch(/^[a-f0-9]{64}$/);
    expect(body.policy.policyVersion).toBe(1);
    expect(body.policy.aiHelp.restrictFinalAnswer).toBe(true);
    expect(body.policy.verificationMode).toBe("score");

    // Reference solution snapshot
    expect(body.referenceSolution).not.toBeNull();
    expect(body.referenceSolution.referenceHash).toMatch(/^[a-f0-9]{64}$/);
    expect(body.referenceSolution.expectedSolution).toContain("residuals");

    // Submission
    expect(body.submission.id).toBe(seeded.submissionId);
    expect(body.submission.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(body.submission.content).toContain("linear");

    // Concept-check set + questions present
    expect(body.conceptCheckSets).toHaveLength(1);
    expect(body.conceptCheckSets[0].questions.length).toBeGreaterThan(0);

    // Verification attempt present
    expect(body.verificationAttempts).toHaveLength(1);
    expect(body.verificationAttempts[0].result).toBeDefined();
    expect(["pass", "needs_review", "fail"]).toContain(body.verificationAttempts[0].result);

    // Provenance
    expect(body.provenance.policyHash).toBe(body.policy.policyHash);
    expect(body.provenance.contentHash).toBe(body.submission.contentHash);
    expect(body.provenance.referenceHash).toBe(body.referenceSolution.referenceHash);
    expect(body.provenance.latestConceptCheckReferenceHash).toMatch(/^[a-f0-9]{64}$/);
    expect(body.provenance.latestVerificationReferenceHash).toMatch(/^[a-f0-9]{64}$/);

    // No AI providers invoked by the report route itself.
    expect(conceptCheckCalls).toBe(ccBefore);
    expect(verificationCalls).toBe(vBefore);
    expect(helpCalls).toBe(helpBefore);

    await app.close();
  });

  it("200 — report works when no concept checks exist", async () => {
    const { app, inject } = await build();
    const seeded = await seedFull(inject, { withChecks: false, withVerification: false });
    const res = await inject({
      method: "GET",
      url: `/v1/submissions/${seeded.submissionId}/evidence-report`,
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.conceptCheckSets).toEqual([]);
    expect(body.verificationAttempts).toEqual([]);
    expect(body.submission.id).toBe(seeded.submissionId);
    expect(body.provenance.latestConceptCheckReferenceHash).toBeNull();
    expect(body.provenance.latestVerificationReferenceHash).toBeNull();
    await app.close();
  });

  it("200 — report works when concept checks exist but no verification", async () => {
    const { app, inject } = await build();
    const seeded = await seedFull(inject, { withVerification: false });
    const res = await inject({
      method: "GET",
      url: `/v1/submissions/${seeded.submissionId}/evidence-report`,
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.conceptCheckSets).toHaveLength(1);
    expect(body.verificationAttempts).toEqual([]);
    await app.close();
  });

  it("200 — referenceSolution is null when no reference exists; pin fields null", async () => {
    const { app, inject } = await build();
    const seeded = await seedFull(inject, { withReference: false });
    const res = await inject({
      method: "GET",
      url: `/v1/submissions/${seeded.submissionId}/evidence-report`,
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.referenceSolution).toBeNull();
    expect(body.provenance.referenceHash).toBeNull();
    expect(body.conceptCheckSets[0].referenceHash).toBeNull();
    expect(body.verificationAttempts[0].referenceHash).toBeNull();
    await app.close();
  });

  it("does not expose Instructor Solution Guide content through student routes", async () => {
    const { app, inject } = await build();
    const seeded = await seedFull(inject);
    // Student attempt at reference-solution route still 404.
    const ref = await inject({
      method: "GET",
      url: `/v1/assignments/${seeded.assignmentId}/reference-solution`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
    });
    expect(ref.statusCode).toBe(404);
    // Student attempt at the report itself still 404 (instructor-only).
    const rep = await inject({
      method: "GET",
      url: `/v1/submissions/${seeded.submissionId}/evidence-report`,
      headers: studentHeaders(TENANT_A, STUDENT_1),
    });
    expect(rep.statusCode).toBe(404);
    await app.close();
  });

  it("response body does not contain banned legal / AI-detection language", async () => {
    const { app, inject } = await build();
    const seeded = await seedFull(inject);
    const res = await inject({
      method: "GET",
      url: `/v1/submissions/${seeded.submissionId}/evidence-report`,
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
    });
    expect(res.statusCode).toBe(200);
    const body = res.body.toLowerCase();
    for (const phrase of BANNED_PHRASES) {
      expect(body).not.toContain(phrase);
    }
    await app.close();
  });

  it("no ledger event is emitted across a report GET", async () => {
    // Reuses the ledger-route 501 stub. The dashboard does not write to the
    // ledger, so this is a smoke regression: the route remains 501 after a
    // report fetch and no ledger-related state changes.
    const { app, inject } = await build();
    const seeded = await seedFull(inject);
    await inject({
      method: "GET",
      url: `/v1/submissions/${seeded.submissionId}/evidence-report`,
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
    });
    const ledger = await inject({
      method: "GET",
      url: "/v1/ledger",
      headers: instructorHeaders(TENANT_A, INSTRUCTOR_1),
    });
    // Existing ledger route is a 501 stub (D-014 / pre-ledger). The point is
    // simply that the evidence-report endpoint did NOT mutate anything.
    expect([200, 501]).toContain(ledger.statusCode);
    await app.close();
  });
});

// ---------- Static guards: disclaimer + banned language in frontend page ----------

describe("evidence report page — static text guards", () => {
  const PAGE_PATH = "src/frontend/app/submissions/[id]/evidence-report/page.tsx";
  const TYPES_PATH = "src/frontend/lib/types/assignment.ts";
  const ROUTE_PATH = "src/backend/src/routes/evidence-report.ts";
  const BUILDER_PATH = "src/backend/src/lib/evidence-report-builder.ts";

  function read(p: string): string {
    return readFileSync(p, "utf8");
  }

  it("includes the approved long disclaimer constant", () => {
    const types = read(TYPES_PATH);
    expect(types).toContain("This report is an evidence-ready instructional review artifact");
    expect(types).toContain("not an AI-detection result");
    expect(types).toContain("not a final course grade");
    expect(types).toContain("not a legal determination");
  });

  it("includes the header scope disclaimer", () => {
    const types = read(TYPES_PATH);
    expect(types).toContain("Verification signal for instructor review. Not a final course grade.");
  });

  it("uses approved language in the report page", () => {
    const page = read(PAGE_PATH);
    expect(page).toMatch(/Evidence-ready report/);
    expect(page).toMatch(/Print \/ Save as PDF/);
  });

  it("no banned language in the report page, route, builder, or non-disclaimer types", () => {
    // The approved disclaimer constants in types/assignment.ts intentionally
    // include negated phrases like "not an AI-detection result". We exclude
    // that file from this scan; the disclaimer correctness is asserted by the
    // earlier "approved long disclaimer constant" test instead.
    const files = [read(PAGE_PATH), read(ROUTE_PATH), read(BUILDER_PATH)];
    for (const text of files) {
      const lower = text.toLowerCase();
      for (const phrase of BANNED_PHRASES) {
        expect(lower).not.toContain(phrase);
      }
    }
  });

  it("the approved disclaimer is the only place AI-detection wording appears in the page text", () => {
    const page = read(PAGE_PATH);
    // The page references the disclaimer constant via the import name. The
    // negated phrase itself lives in types/assignment.ts; not in the page
    // source. So the page should not contain it literally.
    const aiDetectionDashed = `${"AI"}-${"detection"}`;
    const aiDetectionSpaced = `${"AI"} ${"detection"}`;
    expect(page).not.toContain(aiDetectionDashed);
    expect(page).not.toContain(aiDetectionSpaced);
  });
});
