import type { FastifyInstance, FastifyReply } from "fastify";
import { ZodError } from "zod";
import { createSubmissionInputSchema } from "../lib/validators/submission.js";
import type { AssignmentsRepo } from "../repo/assignments-repo.js";
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

export function buildSubmissionsRoutes(
  assignmentsRepo: AssignmentsRepo,
  submissionsRepo: SubmissionsRepo,
) {
  return async function submissionsRoutes(app: FastifyInstance) {
    // POST /v1/assignments/:id/submissions — student-only
    app.post<{ Params: { id: string } }>("/v1/assignments/:id/submissions", async (req, reply) => {
      if (!req.studentAuth) return notAuthed(reply);

      // Student-only: a request with ONLY instructor auth is forbidden here.
      if (!req.studentAuth.studentId) {
        reply.code(403).send({
          error: "student_only",
          message: "Only students can submit work for an assignment.",
        });
        return;
      }

      let parsed: ReturnType<typeof createSubmissionInputSchema.parse>;
      try {
        parsed = createSubmissionInputSchema.parse(req.body);
      } catch (err) {
        if (err instanceof ZodError) {
          reply.code(400).send({
            error: "validation_failed",
            message: "Invalid submission.",
            issues: err.issues,
          });
          return;
        }
        throw err;
      }

      const assignment = await assignmentsRepo.getByTenantId(
        req.studentAuth.tenantId,
        req.params.id,
      );
      if (!assignment) return notFound(reply);

      const submission = await submissionsRepo.create({
        assignment,
        studentId: req.studentAuth.studentId,
        body: parsed,
      });
      reply.code(201).send(submission);
    });

    // GET /v1/assignments/:id/submissions — student sees own; instructor sees all
    app.get<{ Params: { id: string } }>("/v1/assignments/:id/submissions", async (req, reply) => {
      if (!req.studentAuth) return notAuthed(reply);

      const assignment = await assignmentsRepo.getByTenantId(
        req.studentAuth.tenantId,
        req.params.id,
      );
      if (!assignment) return notFound(reply);

      const isInstructor = !!req.studentAuth.instructorId;
      const items = await submissionsRepo.listForAssignment({
        tenantId: req.studentAuth.tenantId,
        assignmentId: req.params.id,
        studentId: isInstructor ? undefined : req.studentAuth.studentId,
      });
      return { items };
    });

    // GET /v1/submissions/:id — student sees own; instructor sees any in tenant
    app.get<{ Params: { id: string } }>("/v1/submissions/:id", async (req, reply) => {
      if (!req.studentAuth) return notAuthed(reply);
      const isInstructor = !!req.studentAuth.instructorId;
      const submission = await submissionsRepo.getById({
        tenantId: req.studentAuth.tenantId,
        id: req.params.id,
        studentId: isInstructor ? undefined : req.studentAuth.studentId,
      });
      if (!submission) return notFound(reply);
      return submission;
    });
  };
}
