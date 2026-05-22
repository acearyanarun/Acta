import { ulid } from "ulid";
import { computeContentHash } from "../lib/content-hash.js";
import type { Submission } from "../lib/types.js";
import type { SubmissionsRepo } from "./submissions-repo.js";

// In-memory submissions repo. Same invariants as the Postgres repo:
// - append-only (no UPDATE/DELETE methods exposed)
// - policy snapshot frozen at write time
export function createMemorySubmissionsRepo(): SubmissionsRepo {
  const rows = new Map<string, Submission>();

  return {
    async create({ assignment, studentId, body }) {
      const id = ulid();
      const submittedAt = new Date().toISOString();
      const contentHash = computeContentHash(body.content);
      const row: Submission = {
        id,
        tenantId: assignment.tenantId,
        assignmentId: assignment.id,
        studentId,
        policyVersionId: assignment.policy.id,
        policyVersion: assignment.policy.version,
        policyHash: assignment.policy.policyHash,
        content: body.content,
        contentHash,
        submittedAt,
      };
      rows.set(id, row);
      return row;
    },

    async listForAssignment({ tenantId, assignmentId, studentId }) {
      const out: Submission[] = [];
      for (const r of rows.values()) {
        if (r.tenantId !== tenantId) continue;
        if (r.assignmentId !== assignmentId) continue;
        if (studentId !== undefined && r.studentId !== studentId) continue;
        out.push(r);
      }
      out.sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
      return out;
    },

    async getById({ tenantId, id, studentId }) {
      const r = rows.get(id);
      if (!r) return null;
      if (r.tenantId !== tenantId) return null;
      if (studentId !== undefined && r.studentId !== studentId) return null;
      return r;
    },

    async listByTenantAcrossAssignments({ tenantId, limit }) {
      const out: Submission[] = [];
      for (const r of rows.values()) {
        if (r.tenantId === tenantId) out.push(r);
      }
      out.sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
      return typeof limit === "number" ? out.slice(0, limit) : out;
    },
  };
}
