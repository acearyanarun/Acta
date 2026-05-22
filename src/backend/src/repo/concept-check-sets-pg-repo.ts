import { and, desc, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { ulid } from "ulid";
import { conceptCheckSets } from "../db/schema.js";
import type { ConceptCheckQuestion, ConceptCheckSet } from "../lib/types.js";
import type { ConceptCheckSetsRepo } from "./concept-check-sets-repo.js";

// biome-ignore lint/suspicious/noExplicitAny: drizzle DB generic
type Db = PostgresJsDatabase<any>;

function toConceptCheckSet(row: typeof conceptCheckSets.$inferSelect): ConceptCheckSet {
  return {
    id: row.id,
    tenantId: row.tenantId,
    assignmentId: row.assignmentId,
    submissionId: row.submissionId,
    studentId: row.studentId,
    policyVersionId: row.policyVersionId,
    policyVersion: row.policyVersion,
    policyHash: row.policyHash,
    submissionContentHash: row.submissionContentHash,
    questions: row.questions as ConceptCheckQuestion[],
    questionCount: row.questionCount,
    provider: row.provider as ConceptCheckSet["provider"],
    model: row.model,
    generatedAt: row.generatedAt.toISOString(),
    referenceSolutionId: row.referenceSolutionId,
    referenceVersion: row.referenceVersion,
    referenceHash: row.referenceHash,
  };
}

export function createPgConceptCheckSetsRepo(db: Db): ConceptCheckSetsRepo {
  return {
    async create({ submission, questions, provider, model, referencePin }) {
      const id = ulid();
      const inserted = await db
        .insert(conceptCheckSets)
        .values({
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
          referenceSolutionId: referencePin.referenceSolutionId,
          referenceVersion: referencePin.referenceVersion,
          referenceHash: referencePin.referenceHash,
        })
        .returning();
      const row = inserted[0];
      if (!row) throw new Error("concept-check-set insert returned no rows");
      return toConceptCheckSet(row);
    },

    async listForSubmission({ tenantId, submissionId, studentId }) {
      const conditions = [
        eq(conceptCheckSets.tenantId, tenantId),
        eq(conceptCheckSets.submissionId, submissionId),
      ];
      if (studentId !== undefined) {
        conditions.push(eq(conceptCheckSets.studentId, studentId));
      }
      const rows = await db
        .select()
        .from(conceptCheckSets)
        .where(and(...conditions))
        .orderBy(desc(conceptCheckSets.generatedAt));
      return rows.map(toConceptCheckSet);
    },

    async getById({ tenantId, id, studentId }) {
      const conditions = [eq(conceptCheckSets.id, id), eq(conceptCheckSets.tenantId, tenantId)];
      if (studentId !== undefined) {
        conditions.push(eq(conceptCheckSets.studentId, studentId));
      }
      const [row] = await db
        .select()
        .from(conceptCheckSets)
        .where(and(...conditions))
        .limit(1);
      if (!row) return null;
      return toConceptCheckSet(row);
    },

    async listByTenantAcrossSubmissions({ tenantId, limit }) {
      const q = db
        .select()
        .from(conceptCheckSets)
        .where(eq(conceptCheckSets.tenantId, tenantId))
        .orderBy(desc(conceptCheckSets.generatedAt));
      const rows = typeof limit === "number" ? await q.limit(limit) : await q;
      return rows.map(toConceptCheckSet);
    },
  };
}
