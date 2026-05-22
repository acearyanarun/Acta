import type { FastifyInstance } from "fastify";

export async function checksRoutes(app: FastifyInstance): Promise<void> {
  app.all("/v1/checks", async (_req, reply) => {
    reply.code(501).send({
      error: "not_implemented",
      message: "Submission-grounded concept checks are not implemented in the foundation.",
    });
  });
  app.all("/v1/checks/*", async (_req, reply) => {
    reply.code(501).send({
      error: "not_implemented",
      message: "Submission-grounded concept checks are not implemented in the foundation.",
    });
  });
}
