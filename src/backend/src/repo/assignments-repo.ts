import type {
  Assignment,
  AssignmentPolicyVersion,
  AuthContext,
  CreateAssignmentInput,
} from "../lib/types.js";

export type AssignmentsRepo = {
  list(auth: AuthContext): Promise<Assignment[]>;
  create(auth: AuthContext, input: CreateAssignmentInput): Promise<Assignment>;
  /**
   * Fetch an assignment with a specific (or current) policy version joined in.
   * Returns null if not found OR if the tenant doesn't match (D-019: 404 not 403).
   */
  get(auth: AuthContext, id: string, version?: number): Promise<Assignment | null>;
  listVersions(auth: AuthContext, id: string): Promise<AssignmentPolicyVersion[] | null>;
  /**
   * Insert a new immutable policy version row and bump the parent's current_version.
   * Returns the updated assignment with the new version as `.policy`, or null on 404.
   */
  update(auth: AuthContext, id: string, input: CreateAssignmentInput): Promise<Assignment | null>;
  /**
   * Tenant-scoped read: list all assignments for the tenant regardless of instructor.
   * Used by the student-facing routes (D-024).
   */
  listByTenant(tenantId: string): Promise<Assignment[]>;
  /**
   * Tenant-scoped read: fetch one assignment by id within the tenant.
   * Returns null on unknown OR cross-tenant.
   */
  getByTenantId(tenantId: string, id: string): Promise<Assignment | null>;
  /**
   * Tenant-scoped historical read: fetch one assignment by id with a SPECIFIC policy
   * version joined in. Used by features that need to render against the policy that
   * was active at some past moment (e.g., the pin on a submission). Returns null on
   * unknown id, cross-tenant, or unknown version.
   */
  getByTenantIdVersion(tenantId: string, id: string, version: number): Promise<Assignment | null>;
};
