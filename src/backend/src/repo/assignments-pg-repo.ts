import { and, desc, eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { ulid } from "ulid";
import { assignmentPolicyVersions, assignments } from "../db/schema.js";
import { computePolicyHash } from "../lib/policy-hash.js";
import type {
  Assignment,
  AssignmentPolicyVersion,
  AuthContext,
  CreateAssignmentInput,
} from "../lib/types.js";
import type { AssignmentsRepo } from "./assignments-repo.js";

// biome-ignore lint/suspicious/noExplicitAny: drizzle DB generic
type Db = PostgresJsDatabase<any>;

function toAssignmentPolicyVersion(
  row: typeof assignmentPolicyVersions.$inferSelect,
): AssignmentPolicyVersion {
  return {
    id: row.id,
    assignmentId: row.assignmentId,
    tenantId: row.tenantId,
    instructorId: row.instructorId,
    version: row.version,
    title: row.title,
    instructions: row.instructions,
    rubric: row.rubric,
    aiHelp: row.aiHelp as AssignmentPolicyVersion["aiHelp"],
    // D-047: master toggle. Defaults to true if older rows lack the column
    // (defense-in-depth — the DB column has DEFAULT true too).
    aiHelpEnabled: row.aiHelpEnabled ?? true,
    verificationMode: row.verificationMode as AssignmentPolicyVersion["verificationMode"],
    policyHash: row.policyHash,
    createdAt: row.createdAt.toISOString(),
  };
}

export function createPgAssignmentsRepo(db: Db): AssignmentsRepo {
  return {
    async list(auth) {
      const assignmentRows = await db
        .select()
        .from(assignments)
        .where(
          and(
            eq(assignments.tenantId, auth.tenantId),
            eq(assignments.instructorId, auth.instructorId),
          ),
        )
        .orderBy(desc(assignments.createdAt));

      const out: Assignment[] = [];
      for (const a of assignmentRows) {
        const [v] = await db
          .select()
          .from(assignmentPolicyVersions)
          .where(
            and(
              eq(assignmentPolicyVersions.assignmentId, a.id),
              eq(assignmentPolicyVersions.version, a.currentVersion),
            ),
          )
          .limit(1);
        if (!v) continue;
        out.push({
          id: a.id,
          tenantId: a.tenantId,
          instructorId: a.instructorId,
          currentVersion: a.currentVersion,
          createdAt: a.createdAt.toISOString(),
          updatedAt: a.updatedAt.toISOString(),
          policy: toAssignmentPolicyVersion(v),
        });
      }
      return out;
    },

    async create(auth, input) {
      const id = ulid();
      const versionId = ulid();
      const version = 1;
      const rubric = input.rubric ?? null;
      const aiHelpEnabled = input.aiHelpEnabled ?? true;
      const policyHash = computePolicyHash({
        assignmentId: id,
        tenantId: auth.tenantId,
        instructorId: auth.instructorId,
        version,
        title: input.title,
        instructions: input.instructions,
        rubric,
        aiHelp: input.aiHelp,
        aiHelpEnabled,
        verificationMode: input.verificationMode,
      });

      // biome-ignore lint/suspicious/noExplicitAny: drizzle transaction generic across drivers
      return await (db as any).transaction(async (tx: Db) => {
        const insertedA = await tx
          .insert(assignments)
          .values({
            id,
            tenantId: auth.tenantId,
            instructorId: auth.instructorId,
            currentVersion: version,
          })
          .returning();
        const insertedV = await tx
          .insert(assignmentPolicyVersions)
          .values({
            id: versionId,
            assignmentId: id,
            tenantId: auth.tenantId,
            instructorId: auth.instructorId,
            version,
            title: input.title,
            instructions: input.instructions,
            rubric,
            aiHelp: input.aiHelp,
            aiHelpEnabled,
            verificationMode: input.verificationMode,
            policyHash,
          })
          .returning();
        const a = insertedA[0];
        const v = insertedV[0];
        if (!a || !v) throw new Error("insert returned no rows");
        return {
          id: a.id,
          tenantId: a.tenantId,
          instructorId: a.instructorId,
          currentVersion: a.currentVersion,
          createdAt: a.createdAt.toISOString(),
          updatedAt: a.updatedAt.toISOString(),
          policy: toAssignmentPolicyVersion(v),
        };
      });
    },

    async get(auth, id, version) {
      const [a] = await db
        .select()
        .from(assignments)
        .where(and(eq(assignments.id, id), eq(assignments.tenantId, auth.tenantId)))
        .limit(1);
      if (!a) return null;

      const wanted = version ?? a.currentVersion;
      const [v] = await db
        .select()
        .from(assignmentPolicyVersions)
        .where(
          and(
            eq(assignmentPolicyVersions.assignmentId, id),
            eq(assignmentPolicyVersions.version, wanted),
            eq(assignmentPolicyVersions.tenantId, auth.tenantId),
          ),
        )
        .limit(1);
      if (!v) return null;

      return {
        id: a.id,
        tenantId: a.tenantId,
        instructorId: a.instructorId,
        currentVersion: a.currentVersion,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
        policy: toAssignmentPolicyVersion(v),
      };
    },

    async listVersions(auth, id) {
      const [a] = await db
        .select()
        .from(assignments)
        .where(and(eq(assignments.id, id), eq(assignments.tenantId, auth.tenantId)))
        .limit(1);
      if (!a) return null;

      const rows = await db
        .select()
        .from(assignmentPolicyVersions)
        .where(
          and(
            eq(assignmentPolicyVersions.assignmentId, id),
            eq(assignmentPolicyVersions.tenantId, auth.tenantId),
          ),
        )
        .orderBy(desc(assignmentPolicyVersions.version));
      return rows.map(toAssignmentPolicyVersion);
    },

    async listByTenant(tenantId) {
      const assignmentRows = await db
        .select()
        .from(assignments)
        .where(eq(assignments.tenantId, tenantId))
        .orderBy(desc(assignments.createdAt));

      const out: Assignment[] = [];
      for (const a of assignmentRows) {
        const [v] = await db
          .select()
          .from(assignmentPolicyVersions)
          .where(
            and(
              eq(assignmentPolicyVersions.assignmentId, a.id),
              eq(assignmentPolicyVersions.version, a.currentVersion),
            ),
          )
          .limit(1);
        if (!v) continue;
        out.push({
          id: a.id,
          tenantId: a.tenantId,
          instructorId: a.instructorId,
          currentVersion: a.currentVersion,
          createdAt: a.createdAt.toISOString(),
          updatedAt: a.updatedAt.toISOString(),
          policy: toAssignmentPolicyVersion(v),
        });
      }
      return out;
    },

    async getByTenantId(tenantId, id) {
      const [a] = await db
        .select()
        .from(assignments)
        .where(and(eq(assignments.id, id), eq(assignments.tenantId, tenantId)))
        .limit(1);
      if (!a) return null;

      const [v] = await db
        .select()
        .from(assignmentPolicyVersions)
        .where(
          and(
            eq(assignmentPolicyVersions.assignmentId, id),
            eq(assignmentPolicyVersions.version, a.currentVersion),
            eq(assignmentPolicyVersions.tenantId, tenantId),
          ),
        )
        .limit(1);
      if (!v) return null;

      return {
        id: a.id,
        tenantId: a.tenantId,
        instructorId: a.instructorId,
        currentVersion: a.currentVersion,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
        policy: toAssignmentPolicyVersion(v),
      };
    },

    async getByTenantIdVersion(tenantId, id, version) {
      const [a] = await db
        .select()
        .from(assignments)
        .where(and(eq(assignments.id, id), eq(assignments.tenantId, tenantId)))
        .limit(1);
      if (!a) return null;

      const [v] = await db
        .select()
        .from(assignmentPolicyVersions)
        .where(
          and(
            eq(assignmentPolicyVersions.assignmentId, id),
            eq(assignmentPolicyVersions.version, version),
            eq(assignmentPolicyVersions.tenantId, tenantId),
          ),
        )
        .limit(1);
      if (!v) return null;

      return {
        id: a.id,
        tenantId: a.tenantId,
        instructorId: a.instructorId,
        currentVersion: a.currentVersion,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
        policy: toAssignmentPolicyVersion(v),
      };
    },

    async update(auth, id, input) {
      // biome-ignore lint/suspicious/noExplicitAny: drizzle transaction generic across drivers
      return await (db as any).transaction(async (tx: Db) => {
        const [a] = await tx
          .select()
          .from(assignments)
          .where(and(eq(assignments.id, id), eq(assignments.tenantId, auth.tenantId)))
          .limit(1);
        if (!a) return null;

        const nextVersion = a.currentVersion + 1;
        const versionId = ulid();
        const rubric = input.rubric ?? null;
        const aiHelpEnabled = input.aiHelpEnabled ?? true;
        const policyHash = computePolicyHash({
          assignmentId: id,
          tenantId: auth.tenantId,
          instructorId: auth.instructorId,
          version: nextVersion,
          title: input.title,
          instructions: input.instructions,
          rubric,
          aiHelp: input.aiHelp,
          aiHelpEnabled,
          verificationMode: input.verificationMode,
        });

        const insertedV = await tx
          .insert(assignmentPolicyVersions)
          .values({
            id: versionId,
            assignmentId: id,
            tenantId: auth.tenantId,
            instructorId: auth.instructorId,
            version: nextVersion,
            title: input.title,
            instructions: input.instructions,
            rubric,
            aiHelp: input.aiHelp,
            aiHelpEnabled,
            verificationMode: input.verificationMode,
            policyHash,
          })
          .returning();

        const updatedRows = await tx
          .update(assignments)
          .set({ currentVersion: nextVersion, updatedAt: sql`now()` })
          .where(and(eq(assignments.id, id), eq(assignments.tenantId, auth.tenantId)))
          .returning();

        const v = insertedV[0];
        const updated = updatedRows[0];
        if (!v || !updated) throw new Error("update returned no rows");

        return {
          id: updated.id,
          tenantId: updated.tenantId,
          instructorId: updated.instructorId,
          currentVersion: updated.currentVersion,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
          policy: toAssignmentPolicyVersion(v),
        };
      });
    },
  };
}
