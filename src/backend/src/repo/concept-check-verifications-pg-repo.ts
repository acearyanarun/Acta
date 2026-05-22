import { and, desc, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { ulid } from "ulid";
import { conceptCheckVerifications } from "../db/schema.js";
import type {
  ConceptCheckVerification,
  PerQuestionFeedback,
  VerificationAnswer,
} from "../lib/types.js";
import type { ConceptCheckVerificationsRepo } from "./concept-check-verifications-repo.js";

// biome-ignore lint/suspicious/noExplicitAny: drizzle DB generic
type Db = PostgresJsDatabase<any>;

function toVerification(
  row: typeof conceptCheckVerifications.$inferSelect,
): ConceptCheckVerification {
  return {
    id: row.id,
    tenantId: row.tenantId,
    assignmentId: row.assignmentId,
    submissionId: row.submissionId,
    conceptCheckSetId: row.conceptCheckSetId,
    studentId: row.studentId,
    policyVersionId: row.policyVersionId,
    policyVersion: row.policyVersion,
    policyHash: row.policyHash,
    submissionContentHash: row.submissionContentHash,
    answers: row.answers as VerificationAnswer[],
    result: row.result as ConceptCheckVerification["result"],
    overallFeedback: row.overallFeedback,
    perQuestionFeedback: row.perQuestionFeedback as PerQuestionFeedback[],
    provider: row.provider as ConceptCheckVerification["provider"],
    model: row.model,
    evaluatedAt: row.evaluatedAt.toISOString(),
    referenceSolutionId: row.referenceSolutionId,
    referenceVersion: row.referenceVersion,
    referenceHash: row.referenceHash,
    hasVoiceAnswers: row.hasVoiceAnswers ?? false,
  };
}

export function createPgConceptCheckVerificationsRepo(db: Db): ConceptCheckVerificationsRepo {
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
      const inserted = await db
        .insert(conceptCheckVerifications)
        .values({
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
          referenceSolutionId: referencePin.referenceSolutionId,
          referenceVersion: referencePin.referenceVersion,
          referenceHash: referencePin.referenceHash,
          hasVoiceAnswers,
        })
        .returning();
      const row = inserted[0];
      if (!row) throw new Error("verification insert returned no rows");
      return toVerification(row);
    },

    async listForSet({ tenantId, conceptCheckSetId, studentId }) {
      const conditions = [
        eq(conceptCheckVerifications.tenantId, tenantId),
        eq(conceptCheckVerifications.conceptCheckSetId, conceptCheckSetId),
      ];
      if (studentId !== undefined) {
        conditions.push(eq(conceptCheckVerifications.studentId, studentId));
      }
      const rows = await db
        .select()
        .from(conceptCheckVerifications)
        .where(and(...conditions))
        .orderBy(desc(conceptCheckVerifications.evaluatedAt));
      return rows.map(toVerification);
    },

    async getById({ tenantId, id, studentId }) {
      const conditions = [
        eq(conceptCheckVerifications.id, id),
        eq(conceptCheckVerifications.tenantId, tenantId),
      ];
      if (studentId !== undefined) {
        conditions.push(eq(conceptCheckVerifications.studentId, studentId));
      }
      const [row] = await db
        .select()
        .from(conceptCheckVerifications)
        .where(and(...conditions))
        .limit(1);
      if (!row) return null;
      return toVerification(row);
    },

    async listByTenantAcrossSets({ tenantId, limit }) {
      const q = db
        .select()
        .from(conceptCheckVerifications)
        .where(eq(conceptCheckVerifications.tenantId, tenantId))
        .orderBy(desc(conceptCheckVerifications.evaluatedAt));
      const rows = typeof limit === "number" ? await q.limit(limit) : await q;
      return rows.map(toVerification);
    },
  };
}
