import type { FastifyInstance } from "fastify";

const BOOT_TIME = Date.now();
const GIT_SHA = (process.env.GIT_SHA ?? "unknown").slice(0, 12);

export async function healthzRoute(app: FastifyInstance): Promise<void> {
  app.get("/healthz", async () => ({
    status: "ok" as const,
    service: "acta-backend",
    foundation: true,
    gitSha: GIT_SHA,
    uptimeSeconds: Math.floor((Date.now() - BOOT_TIME) / 1000),
  }));
}
