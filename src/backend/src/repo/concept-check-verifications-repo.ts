import type {
  ConceptCheckSet,
  ConceptCheckVerification,
  PerQuestionFeedback,
  VerificationAnswer,
  VerificationResult,
} from "../lib/types.js";

// Append-only (D-033). Interface intentionally omits update/delete.
export type ConceptCheckVerificationsRepo = {
  /**
   * Insert a new immutable verification row. The caller passes the resolved set so
   * the repo can snapshot policy + content-hash anchors at write time.
   */
  create(input: {
    set: ConceptCheckSet;
    answers: VerificationAnswer[];
    result: VerificationResult;
    overallFeedback: string;
    perQuestionFeedback: PerQuestionFeedback[];
    provider: "stub" | "anthropic" | "openai";
    model: string | null;
    /** D-041: nullable reference pin in effect at evaluation time. */
    referencePin: {
      referenceSolutionId: string | null;
      referenceVersion: number | null;
      referenceHash: string | null;
    };
    /** D-048: true if any answer has modality === "voice". */
    hasVoiceAnswers: boolean;
  }): Promise<ConceptCheckVerification>;

  /**
   * List verification attempts for a concept-check set within a tenant.
   * - When `studentId` is undefined → instructor view (all attempts in tenant)
   * - When `studentId` is set → student view (must own the row)
   * Sorted by evaluatedAt DESC.
   */
  listForSet(input: {
    tenantId: string;
    conceptCheckSetId: string;
    studentId?: string;
  }): Promise<ConceptCheckVerification[]>;

  /**
   * Read a single verification.
   * - When `studentId` is undefined → instructor read (any in tenant)
   * - When `studentId` is set → student read (must own the row)
   * Returns null on unknown id, cross-tenant, or non-owner student.
   */
  getById(input: {
    tenantId: string;
    id: string;
    studentId?: string;
  }): Promise<ConceptCheckVerification | null>;

  /**
   * Tenant-wide read across all sets (D-045). Instructor-context only —
   * the route layer is responsible for requiring instructor auth before calling.
   * No studentId parameter. Sorted by evaluatedAt DESC.
   */
  listByTenantAcrossSets(input: {
    tenantId: string;
    limit?: number;
  }): Promise<ConceptCheckVerification[]>;
};
