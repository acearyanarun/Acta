import type { FastifyInstance } from "fastify";

// Foundation: no real ledger writes occur here. The audit-ready, evidence-ready,
// provenance-backed ledger write path is built in a later /build-feature run after
// software-architect-agent locks the ledger design (C2).

export async function ledgerRoutes(app: FastifyInstance): Promise<void> {
  app.all("/v1/ledger", async (_req, reply) => {
    reply.code(501).send({
      error: "not_implemented",
      message: "Provenance-backed ledger is not implemented in the foundation.",
    });
  });
  app.all("/v1/ledger/*", async (_req, reply) => {
    reply.code(501).send({
      error: "not_implemented",
      message: "Provenance-backed ledger is not implemented in the foundation.",
    });
  });
}
