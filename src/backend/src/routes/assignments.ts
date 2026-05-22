import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { createAssignmentInputSchema } from "../lib/validators/assignment-policy.js";
import type { AssignmentsRepo } from "../repo/assignments-repo.js";

function notFound(reply: import("fastify").FastifyReply) {
  reply.code(404).send({ error: "not_found", message: "Assignment not found." });
}

function notAuthed(reply: import("fastify").FastifyReply) {
  reply.code(401).send({
    error: "unauthorized",
    message: "Missing tenant or instructor header.",
  });
}

function parseVersionQuery(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number.parseInt(String(value), 10);
  if (!Number.isFinite(n) || n < 1) return Number.NaN;
  return n;
}

export function buildAssignmentsRoutes(repo: AssignmentsRepo) {
  return async function assignmentsRoutes(app: FastifyInstance) {
    app.get("/v1/assignments", async (req, reply) => {
      if (!req.auth) return notAuthed(reply);
      const items = await repo.list(req.auth);
      return { items };
    });

    app.post("/v1/assignments", async (req, reply) => {
      if (!req.auth) return notAuthed(reply);
      try {
        const input = createAssignmentInputSchema.parse(req.body);
        const result = await repo.create(req.auth, input);
        reply.code(201).send(result);
      } catch (err) {
        if (err instanceof ZodError) {
          reply.code(400).send({
            error: "validation_failed",
            message: "Invalid assignment policy.",
            issues: err.issues,
          });
          return;
        }
        throw err;
      }
    });

    app.get<{
      Params: { id: string };
      Querystring: { version?: string };
    }>("/v1/assignments/:id", async (req, reply) => {
      if (!req.auth) return notAuthed(reply);
      const version = parseVersionQuery(req.query.version);
      if (Number.isNaN(version)) return notFound(reply);
      const result = await repo.get(req.auth, req.params.id, version);
      if (!result) return notFound(reply);
      return result;
    });

    app.get<{ Params: { id: string } }>("/v1/assignments/:id/versions", async (req, reply) => {
      if (!req.auth) return notAuthed(reply);
      const items = await repo.listVersions(req.auth, req.params.id);
      if (!items) return notFound(reply);
      return { items };
    });

    app.put<{ Params: { id: string } }>("/v1/assignments/:id", async (req, reply) => {
      if (!req.auth) return notAuthed(reply);
      try {
        const input = createAssignmentInputSchema.parse(req.body);
        const result = await repo.update(req.auth, req.params.id, input);
        if (!result) return notFound(reply);
        return result;
      } catch (err) {
        if (err instanceof ZodError) {
          reply.code(400).send({
            error: "validation_failed",
            message: "Invalid assignment policy.",
            issues: err.issues,
          });
          return;
        }
        throw err;
      }
    });
  };
}
