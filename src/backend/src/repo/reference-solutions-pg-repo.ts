import { and, desc, max as drizzleMax, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { ulid } from "ulid";
import { assignmentReferenceSolutions } from "../db/schema.js";
import { computeReferenceHash } from "../lib/reference-hash.js";
import type { ReferenceSolution } from "../lib/types.js";
import type { ReferenceSolutionsRepo } from "./reference-solutions-repo.js";

// biome-ignore lint/suspicious/noExplicitAny: drizzle DB generic
type Db = PostgresJsDatabase<any>;

function toReferenceSolution(
  row: typeof assignmentReferenceSolutions.$inferSelect,
): ReferenceSolution {
  return {
    id: row.id,
    tenantId: row.tenantId,
    assignmentId: row.assignmentId,
    instructorId: row.instructorId,
    version: row.version,
    expectedSolution: row.expectedSolution,
    keyConcepts: row.keyConcepts as string[],
    requiredReasoningSteps: row.requiredReasoningSteps as string[],
    commonMistakes: row.commonMistakes as string[],
    correctnessCriteria: row.correctnessCriteria,
    optionalNotes: row.optionalNotes,
    referenceHash: row.referenceHash,
    createdAt: row.createdAt.toISOString(),
  };
}

export function createPgReferenceSolutionsRepo(db: Db): ReferenceSolutionsRepo {
  return {
    async createNextVersion({ tenantId, assignmentId, instructorId, body }) {
      // biome-ignore lint/suspicious/noExplicitAny: drizzle transaction generic
      return await (db as any).transaction(async (tx: Db) => {
        const [maxRow] = await tx
          .select({ v: drizzleMax(assignmentReferenceSolutions.version) })
          .from(assignmentReferenceSolutions)
          .where(
            and(
              eq(assignmentReferenceSolutions.assignmentId, assignmentId),
              eq(assignmentReferenceSolutions.tenantId, tenantId),
            ),
          );
        const nextVersion = (maxRow?.v ?? 0) + 1;
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

        const id = ulid();
        const inserted = await tx
          .insert(assignmentReferenceSolutions)
          .values({
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
          })
          .returning();
        const row = inserted[0];
        if (!row) throw new Error("reference-solution insert returned no rows");
        return toReferenceSolution(row);
      });
    },

    async getCurrentByAssignment({ tenantId, assignmentId }) {
      const [row] = await db
        .select()
        .from(assignmentReferenceSolutions)
        .where(
          and(
            eq(assignmentReferenceSolutions.assignmentId, assignmentId),
            eq(assignmentReferenceSolutions.tenantId, tenantId),
          ),
        )
        .orderBy(desc(assignmentReferenceSolutions.version))
        .limit(1);
      if (!row) return null;
      return toReferenceSolution(row);
    },

    async getByVersion({ tenantId, assignmentId, version }) {
      const [row] = await db
        .select()
        .from(assignmentReferenceSolutions)
        .where(
          and(
            eq(assignmentReferenceSolutions.assignmentId, assignmentId),
            eq(assignmentReferenceSolutions.tenantId, tenantId),
            eq(assignmentReferenceSolutions.version, version),
          ),
        )
        .limit(1);
      if (!row) return null;
      return toReferenceSolution(row);
    },

    async listVersionsByAssignment({ tenantId, assignmentId }) {
      const rows = await db
        .select()
        .from(assignmentReferenceSolutions)
        .where(
          and(
            eq(assignmentReferenceSolutions.assignmentId, assignmentId),
            eq(assignmentReferenceSolutions.tenantId, tenantId),
          ),
        )
        .orderBy(desc(assignmentReferenceSolutions.version));
      return rows.map(toReferenceSolution);
    },
  };
}
