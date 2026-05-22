import Fastify, { type FastifyInstance } from "fastify";
import { selectConceptCheckProvider } from "./ai/concept-check/select-concept-check-provider.js";
import type { ConceptCheckProvider } from "./ai/concept-check/types.js";
import { selectProvider } from "./ai/providers/select-provider.js";
import type { AiProvider } from "./ai/providers/types.js";
import { selectTranscriptionProvider } from "./ai/transcription/select-transcription-provider.js";
import type { TranscriptionProvider } from "./ai/transcription/types.js";
import { selectVerificationProvider } from "./ai/verification/select-verification-provider.js";
import type { VerificationProvider } from "./ai/verification/types.js";
import { tryConnectDatabase } from "./db/client.js";
import { requireAuth } from "./lib/auth-placeholder.js";
import { loadEnv } from "./lib/env.js";
import { seedDemoData } from "./lib/seed-demo.js";
import { assertSyntheticDataGuard } from "./lib/synthetic-data-guard.js";
import { createMemoryAssignmentsRepo } from "./repo/assignments-memory-repo.js";
import { createPgAssignmentsRepo } from "./repo/assignments-pg-repo.js";
import type { AssignmentsRepo } from "./repo/assignments-repo.js";
import { createMemoryConceptCheckSetsRepo } from "./repo/concept-check-sets-memory-repo.js";
import { createPgConceptCheckSetsRepo } from "./repo/concept-check-sets-pg-repo.js";
import type { ConceptCheckSetsRepo } from "./repo/concept-check-sets-repo.js";
import { createMemoryConceptCheckVerificationsRepo } from "./repo/concept-check-verifications-memory-repo.js";
import { createPgConceptCheckVerificationsRepo } from "./repo/concept-check-verifications-pg-repo.js";
import type { ConceptCheckVerificationsRepo } from "./repo/concept-check-verifications-repo.js";
import { createMemoryReferenceSolutionsRepo } from "./repo/reference-solutions-memory-repo.js";
import { createPgReferenceSolutionsRepo } from "./repo/reference-solutions-pg-repo.js";
import type { ReferenceSolutionsRepo } from "./repo/reference-solutions-repo.js";
import { createMemorySubmissionsRepo } from "./repo/submissions-memory-repo.js";
import { createPgSubmissionsRepo } from "./repo/submissions-pg-repo.js";
import type { SubmissionsRepo } from "./repo/submissions-repo.js";
import { buildAssignmentsRoutes } from "./routes/assignments.js";
import { checksRoutes } from "./routes/checks.js";
import { buildConceptCheckVerificationRoutes } from "./routes/concept-check-verifications.js";
import { buildConceptCheckRoutes } from "./routes/concept-checks.js";
import { buildEvidenceReportRoutes } from "./routes/evidence-report.js";
import { healthzRoute } from "./routes/healthz.js";
import { buildHelpTranscribeRoutes } from "./routes/help-transcribe.js";
import { buildHelpRoutes } from "./routes/help.js";
import { buildInstructorDashboardRoutes } from "./routes/instructor-dashboard.js";
import { ledgerRoutes } from "./routes/ledger.js";
import { buildReferenceSolutionRoutes } from "./routes/reference-solutions.js";
import { buildStudentRoutes } from "./routes/student.js";
import { buildSubmissionsRoutes } from "./routes/submissions.js";
import { buildTranscribeRoutes } from "./routes/transcribe.js";

export type BuildOptions = {
  repo?: AssignmentsRepo;
  submissionsRepo?: SubmissionsRepo;
  conceptCheckSetsRepo?: ConceptCheckSetsRepo;
  conceptCheckVerificationsRepo?: ConceptCheckVerificationsRepo;
  referenceSolutionsRepo?: ReferenceSolutionsRepo;
  provider?: AiProvider;
  conceptCheckProvider?: ConceptCheckProvider;
  verificationProvider?: VerificationProvider;
  transcriptionProvider?: TranscriptionProvider;
};

export async function buildServer(
  opts: BuildOptions = {},
): Promise<{ app: FastifyInstance; env: ReturnType<typeof loadEnv> }> {
  const env = loadEnv();
  assertSyntheticDataGuard({
    allowRealStudentData: env.ALLOW_REAL_STUDENT_DATA,
    ferpaDpaReference: env.FERPA_DPA_REFERENCE,
  });

  const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? "info" } });

  // Dev-only permissive CORS so the local Next.js frontend (:3000) can talk to the
  // backend (:4000). Production CORS posture is a DEFERRED L3 decision.
  app.addHook("onRequest", async (req, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header(
      "Access-Control-Allow-Headers",
      "Content-Type, X-Acta-Tenant-Id, X-Acta-Instructor-Id, X-Acta-Student-Id",
    );
    reply.header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
    if (req.method === "OPTIONS") {
      reply.code(204).send();
    }
  });

  // Determine repos. All share the same DB probe; if Postgres is reachable we use the
  // PG impls, otherwise we fall back to in-memory (dev convenience).
  let repo: AssignmentsRepo;
  let submissionsRepo: SubmissionsRepo;
  let conceptCheckSetsRepo: ConceptCheckSetsRepo;
  let conceptCheckVerificationsRepo: ConceptCheckVerificationsRepo;
  let referenceSolutionsRepo: ReferenceSolutionsRepo;
  // Track whether we're running on in-memory repos. The boot-time demo seed
  // (SEED_DEMO_DATA) only runs in memory mode so it never writes into a real DB.
  let usingMemoryRepos = false;
  if (
    opts.repo &&
    opts.submissionsRepo &&
    opts.conceptCheckSetsRepo &&
    opts.conceptCheckVerificationsRepo &&
    opts.referenceSolutionsRepo
  ) {
    repo = opts.repo;
    submissionsRepo = opts.submissionsRepo;
    conceptCheckSetsRepo = opts.conceptCheckSetsRepo;
    conceptCheckVerificationsRepo = opts.conceptCheckVerificationsRepo;
    referenceSolutionsRepo = opts.referenceSolutionsRepo;
  } else {
    const conn = await tryConnectDatabase(env.DATABASE_URL);
    if (conn.ok) {
      app.log.info("Connected to Postgres. Using PG repos.");
      repo = opts.repo ?? createPgAssignmentsRepo(conn.db);
      submissionsRepo = opts.submissionsRepo ?? createPgSubmissionsRepo(conn.db);
      conceptCheckSetsRepo = opts.conceptCheckSetsRepo ?? createPgConceptCheckSetsRepo(conn.db);
      conceptCheckVerificationsRepo =
        opts.conceptCheckVerificationsRepo ?? createPgConceptCheckVerificationsRepo(conn.db);
      referenceSolutionsRepo =
        opts.referenceSolutionsRepo ?? createPgReferenceSolutionsRepo(conn.db);
    } else {
      app.log.warn(
        { reason: conn.reason },
        "Database unreachable. Falling back to in-memory repos (dev only). Data will not persist across restarts.",
      );
      repo = opts.repo ?? createMemoryAssignmentsRepo();
      submissionsRepo = opts.submissionsRepo ?? createMemorySubmissionsRepo();
      conceptCheckSetsRepo = opts.conceptCheckSetsRepo ?? createMemoryConceptCheckSetsRepo();
      conceptCheckVerificationsRepo =
        opts.conceptCheckVerificationsRepo ?? createMemoryConceptCheckVerificationsRepo();
      referenceSolutionsRepo = opts.referenceSolutionsRepo ?? createMemoryReferenceSolutionsRepo();
      usingMemoryRepos = true;
    }
  }

  // Determine the AI providers (D-022, D-022+D-032 for concept checks; OpenAI
  // activation gated by USE_REAL_LLM + OPENAI_API_KEY).
  const providerEnv = {
    anthropicApiKey: env.ANTHROPIC_API_KEY,
    anthropicModel: env.ANTHROPIC_MODEL || undefined,
    useRealLlm: env.USE_REAL_LLM,
    openaiApiKey: env.OPENAI_API_KEY || undefined,
    openaiModel: env.OPENAI_MODEL || undefined,
  };

  let provider: AiProvider;
  if (opts.provider) {
    provider = opts.provider;
  } else {
    const selection = selectProvider(providerEnv);
    provider = selection.provider;
    app.log.info({ provider: provider.name }, selection.reason);
  }

  let conceptCheckProvider: ConceptCheckProvider;
  if (opts.conceptCheckProvider) {
    conceptCheckProvider = opts.conceptCheckProvider;
  } else {
    const selection = selectConceptCheckProvider(providerEnv);
    conceptCheckProvider = selection.provider;
    app.log.info({ conceptCheckProvider: conceptCheckProvider.name }, selection.reason);
  }

  let verificationProvider: VerificationProvider;
  if (opts.verificationProvider) {
    verificationProvider = opts.verificationProvider;
  } else {
    const selection = selectVerificationProvider(providerEnv);
    verificationProvider = selection.provider;
    app.log.info({ verificationProvider: verificationProvider.name }, selection.reason);
  }

  // D-048: transcription provider. Real OpenAI only when USE_REAL_LLM=true AND
  // USE_REAL_VOICE=true AND OPENAI_API_KEY set. Stub otherwise.
  let transcriptionProvider: TranscriptionProvider;
  if (opts.transcriptionProvider) {
    transcriptionProvider = opts.transcriptionProvider;
  } else {
    const selection = selectTranscriptionProvider({
      useRealLlm: env.USE_REAL_LLM,
      useRealVoice: env.USE_REAL_VOICE,
      openaiApiKey: env.OPENAI_API_KEY,
      openaiTranscribeModel: env.OPENAI_TRANSCRIBE_MODEL,
    });
    transcriptionProvider = selection.provider;
    app.log.info({ transcriptionProvider: transcriptionProvider.name }, selection.reason);
  }

  // Placeholder auth — foundation only (D-020/D-024). Real auth is a DEFERRED L3 decision.
  app.addHook("onRequest", requireAuth);

  await app.register(healthzRoute);
  await app.register(buildAssignmentsRoutes(repo));
  await app.register(buildStudentRoutes(repo));
  await app.register(buildHelpRoutes(repo, provider));
  await app.register(buildSubmissionsRoutes(repo, submissionsRepo));
  await app.register(buildReferenceSolutionRoutes(repo, referenceSolutionsRepo));
  await app.register(
    buildConceptCheckRoutes(
      repo,
      submissionsRepo,
      conceptCheckSetsRepo,
      referenceSolutionsRepo,
      conceptCheckProvider,
    ),
  );
  await app.register(
    buildConceptCheckVerificationRoutes(
      repo,
      submissionsRepo,
      conceptCheckSetsRepo,
      conceptCheckVerificationsRepo,
      referenceSolutionsRepo,
      verificationProvider,
    ),
  );
  // D-048: voice transcription. Registered in its own plugin scope so the
  // raw-audio body parsers don't affect any other route's body parsing.
  await app.register(async (scoped) => {
    await scoped.register(buildTranscribeRoutes(conceptCheckSetsRepo, transcriptionProvider));
  });
  // Conversational TA voice input. Same isolation pattern as above so the
  // raw-audio body parser is scoped to this route only.
  await app.register(async (scoped) => {
    await scoped.register(buildHelpTranscribeRoutes(repo, transcriptionProvider));
  });
  await app.register(
    buildInstructorDashboardRoutes(
      repo,
      submissionsRepo,
      conceptCheckSetsRepo,
      conceptCheckVerificationsRepo,
    ),
  );
  await app.register(
    buildEvidenceReportRoutes(
      repo,
      submissionsRepo,
      conceptCheckSetsRepo,
      conceptCheckVerificationsRepo,
      referenceSolutionsRepo,
    ),
  );
  await app.register(checksRoutes);
  await app.register(ledgerRoutes);

  // Sprint C: optional boot-time demo seed. Only when SEED_DEMO_DATA=true AND
  // memory repos are in use, so a real DB is never written by this path.
  if (env.SEED_DEMO_DATA && usingMemoryRepos) {
    try {
      const ids = await seedDemoData({
        assignmentsRepo: repo,
        referenceSolutionsRepo,
        submissionsRepo,
        conceptCheckSetsRepo,
        conceptCheckVerificationsRepo,
      });
      app.log.info(
        { seed: ids },
        "SEED_DEMO_DATA=true — seeded demo tenant with one assignment + reference + submission + concept-check + verification.",
      );
    } catch (err) {
      app.log.error(
        { err: err instanceof Error ? err.message : String(err) },
        "SEED_DEMO_DATA was set but seeding failed.",
      );
    }
  } else if (env.SEED_DEMO_DATA && !usingMemoryRepos) {
    app.log.warn(
      "SEED_DEMO_DATA=true was ignored because a real database is in use. The seed only runs against in-memory repos.",
    );
  }

  return { app, env };
}

const isDirectRun = import.meta.url === `file://${process.argv[1]}`;
if (isDirectRun) {
  const { app, env } = await buildServer();
  try {
    await app.listen({ port: env.BACKEND_PORT, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
