import { ulid } from "ulid";
import { computeReferenceHash } from "../lib/reference-hash.js";
import type { ReferenceSolution } from "../lib/types.js";
import type { ReferenceSolutionsRepo } from "./reference-solutions-repo.js";

export function createMemoryReferenceSolutionsRepo(): ReferenceSolutionsRepo {
  const rows = new Map<string, ReferenceSolution>();

  function filter(tenantId: string, assignmentId: string): ReferenceSolution[] {
    const out: ReferenceSolution[] = [];
    for (const r of rows.values()) {
      if (r.tenantId === tenantId && r.assignmentId === assignmentId) out.push(r);
    }
    return out;
  }

  return {
    async createNextVersion({ tenantId, assignmentId, instructorId, body }) {
      const existing = filter(tenantId, assignmentId);
      const nextVersion = existing.reduce((max, r) => (r.version > max ? r.version : max), 0) + 1;

      const id = ulid();
      const createdAt = new Date().toISOString();
      const optionalNotes = body.optionalNotes ?? null;
      const keyConcepts = [...body.keyConcepts];
      const requiredReasoningSteps = [...body.requiredReasoningSteps];
      const commonMistakes = [...body.commonMistakes];
      const referenceHash = computeReferenceHash({
        assignmentId,
        tenantId,
        instructorId,
        version: nextVersion,
        expectedSolution: body.expectedSolution,
        keyConcepts,
        requiredReasoningSteps,
        commonMistakes,
        correctnessCriteria: body.correctnessCriteria,
        optionalNotes,
      });

      const row: ReferenceSolution = {
        id,
        tenantId,
        assignmentId,
        instructorId,
        version: nextVersion,
        expectedSolution: body.expectedSolution,
        keyConcepts,
        requiredReasoningSteps,
        commonMistakes,
        correctnessCriteria: body.correctnessCriteria,
        optionalNotes,
        referenceHash,
        createdAt,
      };
      rows.set(id, row);
      return row;
    },

    async getCurrentByAssignment({ tenantId, assignmentId }) {
      const list = filter(tenantId, assignmentId);
      if (list.length === 0) return null;
      list.sort((a, b) => b.version - a.version);
      return list[0] ?? null;
    },

    async getByVersion({ tenantId, assignmentId, version }) {
      const list = filter(tenantId, assignmentId);
      return list.find((r) => r.version === version) ?? null;
    },

    async listVersionsByAssignment({ tenantId, assignmentId }) {
      const list = filter(tenantId, assignmentId);
      list.sort((a, b) => b.version - a.version);
      return list;
    },
  };
}
