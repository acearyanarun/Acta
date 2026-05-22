import type { FastifyInstance, FastifyReply } from "fastify";
import { buildEvidenceReport } from "../lib/evidence-report-builder.js";
import type { AssignmentsRepo } from "../repo/assignments-repo.js";
import type { ConceptCheckSetsRepo } from "../repo/concept-check-sets-repo.js";
import type { ConceptCheckVerificationsRepo } from "../repo/concept-check-verifications-repo.js";
import type { ReferenceSolutionsRepo } from "../repo/reference-solutions-repo.js";
import type { SubmissionsRepo } from "../repo/submissions-repo.js";

function notAuthed(reply: FastifyReply) {
  reply.code(401).send({
    error: "unauthorized",
    message: "Missing tenant or student/instructor header.",
  });
}

function notFound(reply: FastifyReply) {
  reply.code(404).send({ error: "not_found", message: "Not found." });
}

export function buildEvidenceReportRoutes(
  assignmentsRepo: AssignmentsRepo,
  submissionsRepo: SubmissionsRepo,
  conceptCheckSetsRepo: ConceptCheckSetsRepo,
  verificationsRepo: ConceptCheckVerificationsRepo,
  referenceSolutionsRepo: ReferenceSolutionsRepo,
) {
  return async function evidenceReportRoutes(app: FastifyInstance) {
    // GET /v1/submissions/:id/evidence-report — instructor-only (D-046 pattern).
    // - No auth → 401
    // - Student-only auth → 404 (D-019: never reveal existence)
    // - Cross-tenant instructor → 404 (repo's tenant gate)
    // - Same-tenant instructor → 200
    // Pure read. No AI invocation. No ledger emission. No schema change.
    app.get<{ Params: { id: string } }>(
      "/v1/submissions/:id/evidence-report",
      async (req, reply) => {
        if (!req.studentAuth) return notAuthed(reply);
        if (!req.auth?.instructorId) return notFound(reply);

        const tenantId = req.auth.tenantId;

        // Resolve the submission first; tenant gate enforced by the repo.
        const submission = await submissionsRepo.getById({
          tenantId,
          id: req.params.id,
          // Omit studentId → instructor read (any submission in tenant).
        });
        if (!submission) return notFound(reply);

        // Resolve the assignment at the EXACT policy version pinned on the
        // submission. This ensures the report renders the policy text that was
        // in effect when the student submitted, not whatever is current.
        const assignment = await assignmentsRepo.getByTenantIdVersion(
          tenantId,
          submission.assignmentId,
          submission.policyVersion,
        );
        if (!assignment) return notFound(reply);

        // Reference solution snapshot at report-generation time. Per-set and
        // per-verification reference pins (D-041) on the child rows still carry
        // the EXACT reference used at generation/evaluation time.
        const referenceSolution = await referenceSolutionsRepo.getCurrentByAssignment({
          tenantId,
          assignmentId: submission.assignmentId,
        });

        // All concept-check sets for the submission, instructor view.
        const conceptCheckSets = await conceptCheckSetsRepo.listForSubmission({
          tenantId,
          submissionId: submission.id,
          // Omit studentId → instructor view.
        });

        // All verification attempts across all sets for this submission. We
        // gather them per-set; each list is already sorted DESC. The builder
        // resorts the union before slicing into the report.
        const verifications = (
          await Promise.all(
            conceptCheckSets.map((s) =>
              verificationsRepo.listForSet({
                tenantId,
                conceptCheckSetId: s.id,
              }),
            ),
          )
        ).flat();

        const report = buildEvidenceReport({
          assignment,
          submission,
          referenceSolution,
          conceptCheckSets,
          verifications,
        });
        return report;
      },
    );
  };
}
