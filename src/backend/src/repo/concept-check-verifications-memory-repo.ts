import { ulid } from "ulid";
import type { ConceptCheckVerification } from "../lib/types.js";
import type { ConceptCheckVerificationsRepo } from "./concept-check-verifications-repo.js";

export function createMemoryConceptCheckVerificationsRepo(): ConceptCheckVerificationsRepo {
  const rows = new Map<string, ConceptCheckVerification>();

  return {
    async create({
      set,
      answers,
      result,
      overallFeedback,
      perQuestionFeedback,
      provider,
      model,
      referencePin,
      hasVoiceAnswers,
    }) {
      const id = ulid();
      const evaluatedAt = new Date().toISOString();
      const row: ConceptCheckVerification = {
        id,
        tenantId: set.tenantId,
        assignmentId: set.assignmentId,
        submissionId: set.submissionId,
        conceptCheckSetId: set.id,
        studentId: set.studentId,
        policyVersionId: set.policyVersionId,
        policyVersion: set.policyVersion,
        policyHash: set.policyHash,
        submissionContentHash: set.submissionContentHash,
        answers,
        result,
        overallFeedback,
        perQuestionFeedback,
        provider,
        model,
        evaluatedAt,
        hasVoiceAnswers,
        referenceSolutionId: referencePin.referenceSolutionId,
        referenceVersion: referencePin.referenceVersion,
        referenceHash: referencePin.referenceHash,
      };
      rows.set(id, row);
      return row;
    },

    async listForSet({ tenantId, conceptCheckSetId, studentId }) {
      const out: ConceptCheckVerification[] = [];
      for (const r of rows.values()) {
        if (r.tenantId !== tenantId) continue;
        if (r.conceptCheckSetId !== conceptCheckSetId) continue;
        if (studentId !== undefined && r.studentId !== studentId) continue;
        out.push(r);
      }
      out.sort((a, b) => (a.evaluatedAt < b.evaluatedAt ? 1 : -1));
      return out;
    },

    async getById({ tenantId, id, studentId }) {
      const r = rows.get(id);
      if (!r) return null;
      if (r.tenantId !== tenantId) return null;
      if (studentId !== undefined && r.studentId !== studentId) return null;
      return r;
    },

    async listByTenantAcrossSets({ tenantId, limit }) {
      const out: ConceptCheckVerification[] = [];
      for (const r of rows.values()) {
        if (r.tenantId === tenantId) out.push(r);
      }
      out.sort((a, b) => (a.evaluatedAt < b.evaluatedAt ? 1 : -1));
      return typeof limit === "number" ? out.slice(0, limit) : out;
    },
  };
}
