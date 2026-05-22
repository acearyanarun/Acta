import type { FastifyInstance, FastifyReply } from "fastify";
import {
  NEEDS_ATTENTION_CAP,
  RECENT_SUBMISSIONS_CAP,
  RECENT_VERIFICATIONS_CAP,
  aggregateInstructorDashboard,
} from "../lib/dashboard-aggregator.js";
import type { AssignmentsRepo } from "../repo/assignments-repo.js";
import type { ConceptCheckSetsRepo } from "../repo/concept-check-sets-repo.js";
import type { ConceptCheckVerificationsRepo } from "../repo/concept-check-verifications-repo.js";
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

export function buildInstructorDashboardRoutes(
  assignmentsRepo: AssignmentsRepo,
  submissionsRepo: SubmissionsRepo,
  conceptCheckSetsRepo: ConceptCheckSetsRepo,
  verificationsRepo: ConceptCheckVerificationsRepo,
) {
  return async function instructorDashboardRoutes(app: FastifyInstance) {
    // GET /v1/instructor/dashboard — instructor-only; D-046 privacy semantics.
    app.get("/v1/instructor/dashboard", async (req, reply) => {
      // 401 when no auth context at all.
      if (!req.studentAuth) return notAuthed(reply);
      // 404 when only student auth is present (D-019 privacy pattern).
      if (!req.auth?.instructorId) return notFound(reply);

      const tenantId = req.auth.tenantId;

      // We bound each source list so the aggregator stays fast even with large tenants.
      // The caps are generous relative to the per-section output caps.
      const [assignments, submissions, sets, verifications] = await Promise.all([
        assignmentsRepo.listByTenant(tenantId),
        submissionsRepo.listByTenantAcrossAssignments({ tenantId, limit: 500 }),
        conceptCheckSetsRepo.listByTenantAcrossSubmissions({ tenantId, limit: 1000 }),
        verificationsRepo.listByTenantAcrossSets({ tenantId, limit: 1000 }),
      ]);

      const dashboard = aggregateInstructorDashboard({
        assignments,
        submissions,
        sets,
        verifications,
      });
      return dashboard;
    });
  };
}

export const DASHBOARD_CAPS = {
  needsAttention: NEEDS_ATTENTION_CAP,
  recentSubmissions: RECENT_SUBMISSIONS_CAP,
  recentVerifications: RECENT_VERIFICATIONS_CAP,
};
