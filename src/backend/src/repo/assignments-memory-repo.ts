import { ulid } from "ulid";
import { computePolicyHash } from "../lib/policy-hash.js";
import type {
  Assignment,
  AssignmentPolicyVersion,
  AuthContext,
  CreateAssignmentInput,
} from "../lib/types.js";
import type { AssignmentsRepo } from "./assignments-repo.js";

// In-memory repo for tests and DB-down dev fallback. Same invariants as the
// Postgres repo: no version row is ever mutated or removed (D-018).
type AssignmentRecord = {
  id: string;
  tenantId: string;
  instructorId: string;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
};

export function createMemoryAssignmentsRepo(): AssignmentsRepo {
  const assignments = new Map<string, AssignmentRecord>();
  const versions = new Map<string, AssignmentPolicyVersion[]>(); // assignmentId → versions[]

  function ownsTenant(rec: AssignmentRecord | undefined, auth: AuthContext): boolean {
    return !!rec && rec.tenantId === auth.tenantId;
  }

  function findVersion(
    list: AssignmentPolicyVersion[],
    version: number,
  ): AssignmentPolicyVersion | undefined {
    return list.find((v) => v.version === version);
  }

  return {
    async list(auth) {
      const out: Assignment[] = [];
      for (const rec of assignments.values()) {
        if (rec.tenantId !== auth.tenantId || rec.instructorId !== auth.instructorId) continue;
        const versionList = versions.get(rec.id);
        if (!versionList) continue;
        const current = findVersion(versionList, rec.currentVersion);
        if (!current) continue;
        out.push({ ...rec, policy: current });
      }
      out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      return out;
    },

    async create(auth, input) {
      const id = ulid();
      const nowIso = new Date().toISOString();
      const versionId = ulid();
      const version = 1;
      const rubric = input.rubric ?? null;
      // D-047: default master toggle to true when the caller omits it.
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

      const versionRow: AssignmentPolicyVersion = {
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
        createdAt: nowIso,
      };

      const rec: AssignmentRecord = {
        id,
        tenantId: auth.tenantId,
        instructorId: auth.instructorId,
        currentVersion: version,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      assignments.set(id, rec);
      versions.set(id, [versionRow]);

      return { ...rec, policy: versionRow };
    },

    async get(auth, id, version) {
      const rec = assignments.get(id);
      if (!ownsTenant(rec, auth) || !rec) return null;
      const list = versions.get(id);
      if (!list) return null;
      const wanted = version ?? rec.currentVersion;
      const policy = findVersion(list, wanted);
      if (!policy) return null;
      return { ...rec, policy };
    },

    async listVersions(auth, id) {
      const rec = assignments.get(id);
      if (!ownsTenant(rec, auth) || !rec) return null;
      const list = versions.get(id);
      if (!list) return null;
      return [...list].sort((a, b) => b.version - a.version);
    },

    async listByTenant(tenantId) {
      const out: Assignment[] = [];
      for (const rec of assignments.values()) {
        if (rec.tenantId !== tenantId) continue;
        const versionList = versions.get(rec.id);
        if (!versionList) continue;
        const current = findVersion(versionList, rec.currentVersion);
        if (!current) continue;
        out.push({ ...rec, policy: current });
      }
      out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      return out;
    },

    async getByTenantId(tenantId, id) {
      const rec = assignments.get(id);
      if (!rec || rec.tenantId !== tenantId) return null;
      const list = versions.get(id);
      if (!list) return null;
      const policy = findVersion(list, rec.currentVersion);
      if (!policy) return null;
      return { ...rec, policy };
    },

    async getByTenantIdVersion(tenantId, id, version) {
      const rec = assignments.get(id);
      if (!rec || rec.tenantId !== tenantId) return null;
      const list = versions.get(id);
      if (!list) return null;
      const policy = findVersion(list, version);
      if (!policy) return null;
      return { ...rec, policy };
    },

    async update(auth, id, input) {
      const rec = assignments.get(id);
      if (!ownsTenant(rec, auth) || !rec) return null;
      const list = versions.get(id);
      if (!list) return null;

      const nextVersion = rec.currentVersion + 1;
      const nowIso = new Date().toISOString();
      const rubric = input.rubric ?? null;
      const versionId = ulid();
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

      const newVersion: AssignmentPolicyVersion = {
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
        createdAt: nowIso,
      };

      // D-018: append-only — never mutate or remove existing version rows.
      list.push(newVersion);
      rec.currentVersion = nextVersion;
      rec.updatedAt = nowIso;

      return { ...rec, policy: newVersion };
    },
  };
}
