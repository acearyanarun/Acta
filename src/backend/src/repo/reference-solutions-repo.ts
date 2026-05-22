import type { CreateReferenceSolutionInput, ReferenceSolution } from "../lib/types.js";

// Append-only (D-038). Interface intentionally omits update/delete AND does not
// accept a studentId anywhere — students must never reach this data.
export type ReferenceSolutionsRepo = {
  /**
   * Insert a new immutable reference-solution row with `version = max(prev) + 1`
   * (or 1 if no prior version exists). The repo computes the next version inside
   * the same logical operation (transactionally on Postgres; atomically in memory).
   */
  createNextVersion(input: {
    tenantId: string;
    assignmentId: string;
    instructorId: string;
    body: CreateReferenceSolutionInput;
  }): Promise<ReferenceSolution>;

  /**
   * Current version = ORDER BY version DESC LIMIT 1. Returns null when no version exists.
   */
  getCurrentByAssignment(input: {
    tenantId: string;
    assignmentId: string;
  }): Promise<ReferenceSolution | null>;

  /**
   * Specific historical version. Returns null on unknown.
   */
  getByVersion(input: {
    tenantId: string;
    assignmentId: string;
    version: number;
  }): Promise<ReferenceSolution | null>;

  /**
   * Full version list, sorted version DESC. Returns [] when no version exists.
   */
  listVersionsByAssignment(input: {
    tenantId: string;
    assignmentId: string;
  }): Promise<ReferenceSolution[]>;
};
