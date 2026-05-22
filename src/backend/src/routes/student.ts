import type { FastifyInstance } from "fastify";
import type { AssignmentsRepo } from "../repo/assignments-repo.js";

function notAuthed(reply: import("fastify").FastifyReply) {
  reply.code(401).send({
    error: "unauthorized",
    message: "Missing tenant or student/instructor header.",
  });
}

function notFound(reply: import("fastify").FastifyReply) {
  reply.code(404).send({ error: "not_found", message: "Assignment not found." });
}

export function buildStudentRoutes(repo: AssignmentsRepo) {
  return async function studentRoutes(app: FastifyInstance) {
    app.get("/v1/student/assignments", async (req, reply) => {
      if (!req.studentAuth) return notAuthed(reply);
      const items = await repo.listByTenant(req.studentAuth.tenantId);
      return { items };
    });

    app.get<{ Params: { id: string } }>("/v1/student/assignments/:id", async (req, reply) => {
      if (!req.studentAuth) return notAuthed(reply);
      const result = await repo.getByTenantId(req.studentAuth.tenantId, req.params.id);
      if (!result) return notFound(reply);
      return result;
    });
  };
}
