import { beforeEach, describe, expect, it } from "vitest";
import { computePolicyHash } from "../src/backend/src/lib/policy-hash.js";
import type { AiHelpPolicy, CreateAssignmentInput } from "../src/backend/src/lib/types.js";
import { createAssignmentInputSchema } from "../src/backend/src/lib/validators/assignment-policy.js";
import { createMemoryAssignmentsRepo } from "../src/backend/src/repo/assignments-memory-repo.js";
import { buildServer } from "../src/backend/src/server.js";

const TENANT_A = "tenant-a";
const TENANT_B = "tenant-b";
const INSTRUCTOR_1 = "instructor-1";
const INSTRUCTOR_2 = "instructor-2";

const ai: AiHelpPolicy = {
  conceptExplanation: true,
  hints: true,
  examples: true,
  debuggingGuidance: false,
  restrictFinalAnswer: true,
};

const baseInput: CreateAssignmentInput = {
  title: "Sample assignment",
  instructions: "Write a short essay analyzing the case.",
  rubric: null,
  aiHelp: ai,
  verificationMode: "score",
};

function authHeaders(tenantId: string, instructorId: string) {
  return {
    "x-acta-tenant-id": tenantId,
    "x-acta-instructor-id": instructorId,
    "content-type": "application/json",
  };
}

describe("policy-hash", () => {
  it("is order-independent for the canonical body", () => {
    const a = computePolicyHash({
      assignmentId: "id-1",
      tenantId: TENANT_A,
      instructorId: INSTRUCTOR_1,
      version: 1,
      title: "t",
      instructions: "i",
      rubric: null,
      aiHelp: ai,
      verificationMode: "score",
    });
    // Same logical content with object literal keys in a different order
    const reordered = {
      verificationMode: "score" as const,
      aiHelp: {
        restrictFinalAnswer: true,
        debuggingGuidance: false,
        examples: true,
        hints: true,
        conceptExplanation: true,
      },
      rubric: null,
      instructions: "i",
      title: "t",
      version: 1,
      instructorId: INSTRUCTOR_1,
      tenantId: TENANT_A,
      assignmentId: "id-1",
    };
    const b = computePolicyHash(reordered);
    expect(a).toEqual(b);
  });

  it("changes when any field changes", () => {
    const base = computePolicyHash({
      assignmentId: "id-1",
      tenantId: TENANT_A,
      instructorId: INSTRUCTOR_1,
      version: 1,
      title: "t",
      instructions: "i",
      rubric: null,
      aiHelp: ai,
      verificationMode: "score",
    });
    const titleChanged = computePolicyHash({
      assignmentId: "id-1",
      tenantId: TENANT_A,
      instructorId: INSTRUCTOR_1,
      version: 1,
      title: "t2",
      instructions: "i",
      rubric: null,
      aiHelp: ai,
      verificationMode: "score",
    });
    expect(base).not.toEqual(titleChanged);
  });
});

describe("validators", () => {
  it("rejects empty title", () => {
    const r = createAssignmentInputSchema.safeParse({ ...baseInput, title: "  " });
    expect(r.success).toBe(false);
  });
  it("rejects oversize instructions", () => {
    const r = createAssignmentInputSchema.safeParse({
      ...baseInput,
      instructions: "x".repeat(20_001),
    });
    expect(r.success).toBe(false);
  });
  it("rejects invalid mode", () => {
    const r = createAssignmentInputSchema.safeParse({
      ...baseInput,
      verificationMode: "weird-mode",
    });
    expect(r.success).toBe(false);
  });
  it("rejects missing aiHelp field", () => {
    const { hints: _h, ...withoutHints } = ai;
    void _h;
    const r = createAssignmentInputSchema.safeParse({ ...baseInput, aiHelp: withoutHints });
    expect(r.success).toBe(false);
  });
  it("accepts null rubric and omitted rubric (transforms to null)", () => {
    expect(createAssignmentInputSchema.safeParse({ ...baseInput, rubric: null }).success).toBe(
      true,
    );
    const { rubric: _r, ...withoutRubric } = baseInput;
    void _r;
    const parsed = createAssignmentInputSchema.parse(withoutRubric);
    expect(parsed.rubric).toBeNull();
  });
});

describe("assignments API (HTTP)", () => {
  let appCloser: { close: () => Promise<void> };
  let inject: ReturnType<typeof makeInject>;

  function makeInject(app: Awaited<ReturnType<typeof buildServer>>["app"]) {
    return app.inject.bind(app);
  }

  beforeEach(async () => {
    const repo = createMemoryAssignmentsRepo();
    const { app } = await buildServer({ repo });
    inject = makeInject(app);
    appCloser = { close: async () => app.close() };
    return async () => appCloser.close();
  });

  it("401 when auth headers are missing", async () => {
    const res = await inject({ method: "GET", url: "/v1/assignments" });
    expect(res.statusCode).toBe(401);
  });

  it("POST then GET roundtrips identical content; current version returned by default", async () => {
    const create = await inject({
      method: "POST",
      url: "/v1/assignments",
      headers: authHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify(baseInput),
    });
    expect(create.statusCode).toBe(201);
    const created = create.json();
    expect(created.currentVersion).toBe(1);
    expect(created.policy.version).toBe(1);
    expect(created.policy.title).toBe(baseInput.title);
    expect(typeof created.policy.policyHash).toBe("string");
    expect(created.policy.policyHash).toHaveLength(64);

    const get = await inject({
      method: "GET",
      url: `/v1/assignments/${created.id}`,
      headers: authHeaders(TENANT_A, INSTRUCTOR_1),
    });
    expect(get.statusCode).toBe(200);
    const fetched = get.json();
    expect(fetched.policy.version).toBe(1);
    expect(fetched.policy.policyHash).toBe(created.policy.policyHash);
  });

  it("PUT creates a new policy version, preserves previous, bumps current_version", async () => {
    const create = await inject({
      method: "POST",
      url: "/v1/assignments",
      headers: authHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify(baseInput),
    });
    const created = create.json();

    const update = await inject({
      method: "PUT",
      url: `/v1/assignments/${created.id}`,
      headers: authHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify({ ...baseInput, title: "Sample assignment v2" }),
    });
    expect(update.statusCode).toBe(200);
    const updated = update.json();
    expect(updated.currentVersion).toBe(2);
    expect(updated.policy.version).toBe(2);
    expect(updated.policy.title).toBe("Sample assignment v2");
    expect(updated.policy.policyHash).not.toBe(created.policy.policyHash);

    // Default GET returns current (v2).
    const getCurrent = await inject({
      method: "GET",
      url: `/v1/assignments/${created.id}`,
      headers: authHeaders(TENANT_A, INSTRUCTOR_1),
    });
    expect(getCurrent.json().policy.version).toBe(2);

    // Historical GET (v1) still works.
    const getV1 = await inject({
      method: "GET",
      url: `/v1/assignments/${created.id}?version=1`,
      headers: authHeaders(TENANT_A, INSTRUCTOR_1),
    });
    expect(getV1.statusCode).toBe(200);
    expect(getV1.json().policy.version).toBe(1);
    expect(getV1.json().policy.title).toBe(baseInput.title);
    expect(getV1.json().policy.policyHash).toBe(created.policy.policyHash);

    // listVersions returns both.
    const versions = await inject({
      method: "GET",
      url: `/v1/assignments/${created.id}/versions`,
      headers: authHeaders(TENANT_A, INSTRUCTOR_1),
    });
    expect(versions.statusCode).toBe(200);
    const list = versions.json().items;
    expect(list).toHaveLength(2);
    expect(list[0].version).toBe(2);
    expect(list[1].version).toBe(1);
  });

  it("list filters by tenant+instructor; cross-tenant data is invisible", async () => {
    const a = await inject({
      method: "POST",
      url: "/v1/assignments",
      headers: authHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify(baseInput),
    });
    const b = await inject({
      method: "POST",
      url: "/v1/assignments",
      headers: authHeaders(TENANT_B, INSTRUCTOR_2),
      payload: JSON.stringify({ ...baseInput, title: "Other tenant" }),
    });
    expect(a.statusCode).toBe(201);
    expect(b.statusCode).toBe(201);

    const listA = await inject({
      method: "GET",
      url: "/v1/assignments",
      headers: authHeaders(TENANT_A, INSTRUCTOR_1),
    });
    const itemsA = listA.json().items;
    expect(itemsA).toHaveLength(1);
    expect(itemsA[0].tenantId).toBe(TENANT_A);
  });

  it("cross-tenant GET returns 404, not 403", async () => {
    const a = await inject({
      method: "POST",
      url: "/v1/assignments",
      headers: authHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify(baseInput),
    });
    const created = a.json();

    const cross = await inject({
      method: "GET",
      url: `/v1/assignments/${created.id}`,
      headers: authHeaders(TENANT_B, INSTRUCTOR_2),
    });
    expect(cross.statusCode).toBe(404);

    const crossVersions = await inject({
      method: "GET",
      url: `/v1/assignments/${created.id}/versions`,
      headers: authHeaders(TENANT_B, INSTRUCTOR_2),
    });
    expect(crossVersions.statusCode).toBe(404);

    const crossHistoricalVersion = await inject({
      method: "GET",
      url: `/v1/assignments/${created.id}?version=1`,
      headers: authHeaders(TENANT_B, INSTRUCTOR_2),
    });
    expect(crossHistoricalVersion.statusCode).toBe(404);
  });

  it("body tenantId/instructorId cannot override header auth", async () => {
    const res = await inject({
      method: "POST",
      url: "/v1/assignments",
      headers: authHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify({
        ...baseInput,
        tenantId: TENANT_B,
        instructorId: INSTRUCTOR_2,
      }),
    });
    expect(res.statusCode).toBe(201);
    const created = res.json();
    expect(created.tenantId).toBe(TENANT_A);
    expect(created.instructorId).toBe(INSTRUCTOR_1);
  });

  it("400 on invalid verificationMode", async () => {
    const res = await inject({
      method: "POST",
      url: "/v1/assignments",
      headers: authHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify({ ...baseInput, verificationMode: "bogus" }),
    });
    expect(res.statusCode).toBe(400);
  });

  it("unknown id returns 404 from /:id and /:id/versions", async () => {
    const a = await inject({
      method: "GET",
      url: "/v1/assignments/01HXYZNONEXISTENT",
      headers: authHeaders(TENANT_A, INSTRUCTOR_1),
    });
    expect(a.statusCode).toBe(404);
    const b = await inject({
      method: "GET",
      url: "/v1/assignments/01HXYZNONEXISTENT/versions",
      headers: authHeaders(TENANT_A, INSTRUCTOR_1),
    });
    expect(b.statusCode).toBe(404);
  });

  it("unknown historical version returns 404", async () => {
    const a = await inject({
      method: "POST",
      url: "/v1/assignments",
      headers: authHeaders(TENANT_A, INSTRUCTOR_1),
      payload: JSON.stringify(baseInput),
    });
    const created = a.json();
    const r = await inject({
      method: "GET",
      url: `/v1/assignments/${created.id}?version=99`,
      headers: authHeaders(TENANT_A, INSTRUCTOR_1),
    });
    expect(r.statusCode).toBe(404);
  });
});
