import type { ConceptCheckQuestion, ConceptCheckSet, Submission } from "../lib/types.js";

// Append-only (D-031). Interface intentionally omits update/delete.
export type ConceptCheckSetsRepo = {
  /**
   * Insert a new immutable concept-check set. The caller passes the resolved submission
   * so the repo can snapshot policy + content-hash anchors from it at write time.
   */
  create(input: {
    submission: Submission;
    questions: ConceptCheckQuestion[];
    provider: "stub" | "anthropic" | "openai";
    model: string | null;
    /** D-041: nullable reference pin for the Instructor Solution Guide in effect at generation time. */
    referencePin: {
      referenceSolutionId: string | null;
      referenceVersion: number | null;
      referenceHash: string | null;
    };
  }): Promise<ConceptCheckSet>;

  /**
   * List sets for a submission within a tenant.
   * - When `studentId` is undefined → instructor view (any submission's sets in tenant)
   * - When `studentId` is set → student view (must own the row's studentId)
   * Sorted by generatedAt DESC.
   */
  listForSubmission(input: {
    tenantId: string;
    submissionId: string;
    studentId?: string;
  }): Promise<ConceptCheckSet[]>;

  /**
   * Read a single set. Same role semantics as listForSubmission. Returns null on
   * unknown id, cross-tenant, or non-owner student.
   */
  getById(input: {
    tenantId: string;
    id: string;
    studentId?: string;
  }): Promise<ConceptCheckSet | null>;

  /**
   * Tenant-wide read across all submissions (D-045). Instructor-context only —
   * the route layer is responsible for requiring instructor auth before calling.
   * No studentId parameter. Sorted by generatedAt DESC.
   */
  listByTenantAcrossSubmissions(input: {
    tenantId: string;
    limit?: number;
  }): Promise<ConceptCheckSet[]>;
};
