import type { Assignment, CreateSubmissionInput, Submission } from "../lib/types.js";

// Append-only by design (D-027). The interface intentionally omits update/delete
// so callers cannot mutate or remove submission history.
export type SubmissionsRepo = {
  /**
   * Insert a new submission row. The caller passes the resolved assignment so the repo
   * can snapshot policy fields (`policyVersionId`, `policyVersion`, `policyHash`) from
   * the assignment's current policy version at write time.
   */
  create(input: {
    assignment: Assignment;
    studentId: string;
    body: CreateSubmissionInput;
  }): Promise<Submission>;

  /**
   * List submissions for an assignment within a tenant.
   * - When `studentId` is undefined → instructor view (all submissions in tenant)
   * - When `studentId` is set → student view (only their own)
   * Sorted by submittedAt DESC.
   */
  listForAssignment(input: {
    tenantId: string;
    assignmentId: string;
    studentId?: string;
  }): Promise<Submission[]>;

  /**
   * Read a single submission.
   * - When `studentId` is undefined → instructor read (any in tenant)
   * - When `studentId` is set → student read (must own the row)
   * Returns null on unknown id, cross-tenant, or non-owner student.
   */
  getById(input: {
    tenantId: string;
    id: string;
    studentId?: string;
  }): Promise<Submission | null>;

  /**
   * Tenant-wide read across all assignments (D-045). Instructor-context only —
   * the route layer is responsible for requiring instructor auth before calling.
   * No studentId parameter. Sorted by submittedAt DESC.
   */
  listByTenantAcrossAssignments(input: {
    tenantId: string;
    limit?: number;
  }): Promise<Submission[]>;
};
