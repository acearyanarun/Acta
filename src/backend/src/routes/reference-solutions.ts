import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { createReferenceSolutionInputSchema } from "../lib/validators/reference-solution.js";
import type { AssignmentsRepo } from "../repo/assignments-repo.js";
import type { ReferenceSolutionsRepo } from "../repo/reference-solutions-repo.js";

function notAuthed(reply: FastifyReply) {
  reply.code(401).send({
    error: "unauthorized",
    message: "Missing tenant or student/instructor header.",
  });
}

function notFound(reply: FastifyReply) {
  reply.code(404).send({ error: "not_found", message: "Not found." });
}

// Instructor-only across all three routes. Privacy semantics (D-019): students get 404,
// not 403. We rely on the existing `req.auth` (instructor placeholder header).
function requireInstructor(
  req: FastifyRequest,
  reply: FastifyReply,
): {
  tenantId: string;
  instructorId: string;
} | null {
  if (!req.studentAuth) {
    notAuthed(reply);
    return null;
  }
  if (!req.auth?.instructorId) {
    notFound(reply);
    return null;
  }
  return { tenantId: req.auth.tenantId, instructorId: req.auth.instructorId };
}

function parseVersionQuery(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number.parseInt(String(value), 10);
  if (!Number.isFinite(n) || n < 1) return Number.NaN;
  return n;
}

export function buildReferenceSolutionRoutes(
  assignmentsRepo: AssignmentsRepo,
  referenceSolutionsRepo: ReferenceSolutionsRepo,
) {
  return async function referenceSolutionRoutes(app: FastifyInstance) {
    // GET /v1/assignments/:id/reference-solution — current version
    app.get<{ Params: { id: string } }>(
      "/v1/assignments/:id/reference-solution",
      async (req, reply) => {
        const auth = requireInstructor(req, reply);
        if (!auth) return;

        const assignment = await assignmentsRepo.getByTenantId(auth.tenantId, req.params.id);
        if (!assignment) return notFound(reply);

        const current = await referenceSolutionsRepo.getCurrentByAssignment({
          tenantId: auth.tenantId,
          assignmentId: req.params.id,
        });
        if (!current) return notFound(reply);
        return current;
      },
    );

    // POST /v1/assignments/:id/reference-solution — create new version
    app.post<{ Params: { id: string } }>(
      "/v1/assignments/:id/reference-solution",
      async (req, reply) => {
        const auth = requireInstructor(req, reply);
        if (!auth) return;

        let parsed: ReturnType<typeof createReferenceSolutionInputSchema.parse>;
        try {
          parsed = createReferenceSolutionInputSchema.parse(req.body);
        } catch (err) {
          if (err instanceof ZodError) {
            reply.code(400).send({
              error: "validation_failed",
              message: "Invalid reference solution.",
              issues: err.issues,
            });
            return;
          }
          throw err;
        }

        const assignment = await assignmentsRepo.getByTenantId(auth.tenantId, req.params.id);
        if (!assignment) return notFound(reply);

        const row = await referenceSolutionsRepo.createNextVersion({
          tenantId: auth.tenantId,
          assignmentId: req.params.id,
          instructorId: auth.instructorId,
          body: parsed,
        });
        reply.code(201).send(row);
      },
    );

    // GET /v1/assignments/:id/reference-solution/versions[?version=N]
    app.get<{ Params: { id: string }; Querystring: { version?: string } }>(
      "/v1/assignments/:id/reference-solution/versions",
      async (req, reply) => {
        const auth = requireInstructor(req, reply);
        if (!auth) return;

        const assignment = await assignmentsRepo.getByTenantId(auth.tenantId, req.params.id);
        if (!assignment) return notFound(reply);

        const v = parseVersionQuery(req.query.version);
        if (Number.isNaN(v)) return notFound(reply);
        if (v !== undefined) {
          const row = await referenceSolutionsRepo.getByVersion({
            tenantId: auth.tenantId,
            assignmentId: req.params.id,
            version: v,
          });
          if (!row) return notFound(reply);
          return row;
        }

        const items = await referenceSolutionsRepo.listVersionsByAssignment({
          tenantId: auth.tenantId,
          assignmentId: req.params.id,
        });
        return { items };
      },
    );
  };
}
