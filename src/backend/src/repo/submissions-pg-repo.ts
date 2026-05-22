import { and, desc, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { ulid } from "ulid";
import { submissions } from "../db/schema.js";
import { computeContentHash } from "../lib/content-hash.js";
import type { Submission } from "../lib/types.js";
import type { SubmissionsRepo } from "./submissions-repo.js";

// biome-ignore lint/suspicious/noExplicitAny: drizzle DB generic
type Db = PostgresJsDatabase<any>;

function toSubmission(row: typeof submissions.$inferSelect): Submission {
  return {
    id: row.id,
    tenantId: row.tenantId,
    assignmentId: row.assignmentId,
    studentId: row.studentId,
    policyVersionId: row.policyVersionId,
    policyVersion: row.policyVersion,
    policyHash: row.policyHash,
    content: row.content,
    contentHash: row.contentHash,
    submittedAt: row.submittedAt.toISOString(),
  };
}

export function createPgSubmissionsRepo(db: Db): SubmissionsRepo {
  return {
    async create({ assignment, studentId, body }) {
      const id = ulid();
      const contentHash = computeContentHash(body.content);
      const inserted = await db
        .insert(submissions)
        .values({
          id,
          tenantId: assignment.tenantId,
          assignmentId: assignment.id,
          studentId,
          policyVersionId: assignment.policy.id,
          policyVersion: assignment.policy.version,
          policyHash: assignment.policy.policyHash,
          content: body.content,
          contentHash,
        })
        .returning();
      const row = inserted[0];
      if (!row) throw new Error("submission insert returned no rows");
      return toSubmission(row);
    },

    async listForAssignment({ tenantId, assignmentId, studentId }) {
      const conditions = [
        eq(submissions.tenantId, tenantId),
        eq(submissions.assignmentId, assignmentId),
      ];
      if (studentId !== undefined) {
        conditions.push(eq(submissions.studentId, studentId));
      }
      const rows = await db
        .select()
        .from(submissions)
        .where(and(...conditions))
        .orderBy(desc(submissions.submittedAt));
      return rows.map(toSubmission);
    },

    async getById({ tenantId, id, studentId }) {
      const conditions = [eq(submissions.id, id), eq(submissions.tenantId, tenantId)];
      if (studentId !== undefined) {
        conditions.push(eq(submissions.studentId, studentId));
      }
      const [row] = await db
        .select()
        .from(submissions)
        .where(and(...conditions))
        .limit(1);
      if (!row) return null;
      return toSubmission(row);
    },

    async listByTenantAcrossAssignments({ tenantId, limit }) {
      const q = db
        .select()
        .from(submissions)
        .where(eq(submissions.tenantId, tenantId))
        .orderBy(desc(submissions.submittedAt));
      const rows = typeof limit === "number" ? await q.limit(limit) : await q;
      return rows.map(toSubmission);
    },
  };
}
