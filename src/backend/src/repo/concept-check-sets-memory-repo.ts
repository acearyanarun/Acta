import { ulid } from "ulid";
import type { ConceptCheckSet } from "../lib/types.js";
import type { ConceptCheckSetsRepo } from "./concept-check-sets-repo.js";

export function createMemoryConceptCheckSetsRepo(): ConceptCheckSetsRepo {
  const rows = new Map<string, ConceptCheckSet>();

  return {
    async create({ submission, questions, provider, model, referencePin }) {
      const id = ulid();
      const generatedAt = new Date().toISOString();
      const set: ConceptCheckSet = {
        id,
        tenantId: submission.tenantId,
        assignmentId: submission.assignmentId,
        submissionId: submission.id,
        studentId: submission.studentId,
        policyVersionId: submission.policyVersionId,
        policyVersion: submission.policyVersion,
        policyHash: submission.policyHash,
        submissionContentHash: submission.contentHash,
        questions,
        questionCount: questions.length,
        provider,
        model,
        generatedAt,
        referenceSolutionId: referencePin.referenceSolutionId,
        referenceVersion: referencePin.referenceVersion,
        referenceHash: referencePin.referenceHash,
      };
      rows.set(id, set);
      return set;
    },

    async listForSubmission({ tenantId, submissionId, studentId }) {
      const out: ConceptCheckSet[] = [];
      for (const r of rows.values()) {
        if (r.tenantId !== tenantId) continue;
        if (r.submissionId !== submissionId) continue;
        if (studentId !== undefined && r.studentId !== studentId) continue;
        out.push(r);
      }
      out.sort((a, b) => (a.generatedAt < b.generatedAt ? 1 : -1));
      return out;
    },

    async getById({ tenantId, id, studentId }) {
      const r = rows.get(id);
      if (!r) return null;
      if (r.tenantId !== tenantId) return null;
      if (studentId !== undefined && r.studentId !== studentId) return null;
      return r;
    },

    async listByTenantAcrossSubmissions({ tenantId, limit }) {
      const out: ConceptCheckSet[] = [];
      for (const r of rows.values()) {
        if (r.tenantId === tenantId) out.push(r);
      }
      out.sort((a, b) => (a.generatedAt < b.generatedAt ? 1 : -1));
      return typeof limit === "number" ? out.slice(0, limit) : out;
    },
  };
}
