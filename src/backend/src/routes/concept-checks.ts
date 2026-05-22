import type { FastifyInstance, FastifyReply } from "fastify";
import { ulid } from "ulid";
import { ZodError } from "zod";
import type { ConceptCheckProvider } from "../ai/concept-check/types.js";
import { buildConceptCheckSystemPrompt } from "../lib/concept-check-prompt-builder.js";
import type { ConceptCheckQuestion } from "../lib/types.js";
import {
  DEFAULT_QUESTION_COUNT,
  generateConceptChecksInputSchema,
} from "../lib/validators/concept-check.js";
import type { AssignmentsRepo } from "../repo/assignments-repo.js";
import type { ConceptCheckSetsRepo } from "../repo/concept-check-sets-repo.js";
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

export function buildConceptCheckRoutes(
  assignmentsRepo: AssignmentsRepo,
  submissionsRepo: SubmissionsRepo,
  conceptCheckSetsRepo: ConceptCheckSetsRepo,
  referenceSolutionsRepo: ReferenceSolutionsRepo,
  provider: ConceptCheckProvider,
) {
  return async function conceptCheckRoutes(app: FastifyInstance) {
    // POST /v1/submissions/:id/concept-checks
    app.post<{ Params: { id: string } }>(
      "/v1/submissions/:id/concept-checks",
      async (req, reply) => {
        if (!req.studentAuth) return notAuthed(reply);

        // Privacy semantics (D-019): student-only AND must own the submission.
        // We use 404 (not 403) to avoid leaking existence.
        if (!req.studentAuth.studentId) return notFound(reply);

        let parsed: ReturnType<typeof generateConceptChecksInputSchema.parse>;
        try {
          parsed = generateConceptChecksInputSchema.parse(req.body ?? {});
        } catch (err) {
          if (err instanceof ZodError) {
            reply.code(400).send({
              error: "validation_failed",
              message: "Invalid request body.",
              issues: err.issues,
            });
            return;
          }
          throw err;
        }
        const questionCount = parsed.questionCount ?? DEFAULT_QUESTION_COUNT;

        // Student must own the submission. Owner-only read returns null for non-owner.
        const submission = await submissionsRepo.getById({
          tenantId: req.studentAuth.tenantId,
          id: req.params.id,
          studentId: req.studentAuth.studentId,
        });
        if (!submission) return notFound(reply);

        // Fetch the SUBMISSION's pinned policy version (not the current one) so the
        // prompt is grounded in the exact policy text that was active at submit time.
        const pinned = await assignmentsRepo.getByTenantIdVersion(
          submission.tenantId,
          submission.assignmentId,
          submission.policyVersion,
        );
        if (!pinned) return notFound(reply);

        // D-041 retrieval: fetch the current Instructor Solution Guide if one exists.
        // null is the strictly-additive fallback (D-043).
        const referenceSolution = await referenceSolutionsRepo.getCurrentByAssignment({
          tenantId: submission.tenantId,
          assignmentId: submission.assignmentId,
        });

        const systemPrompt = buildConceptCheckSystemPrompt({
          policy: pinned.policy,
          submission,
          questionCount,
          referenceSolution,
        });

        const result = await provider.generate({
          policy: pinned.policy,
          submission,
          questionCount,
          systemPrompt,
          referenceSolution,
        });

        const finalCount = Math.min(result.questions.length, questionCount);
        const questions: ConceptCheckQuestion[] = result.questions
          .slice(0, finalCount)
          .map((q, idx) => ({
            id: ulid(),
            ordinal: idx + 1,
            prompt: q.prompt,
            ...(q.conceptTag ? { conceptTag: q.conceptTag } : {}),
          }));

        const set = await conceptCheckSetsRepo.create({
          submission,
          questions,
          provider: provider.name,
          model: provider.model,
          referencePin: {
            referenceSolutionId: referenceSolution?.id ?? null,
            referenceVersion: referenceSolution?.version ?? null,
            referenceHash: referenceSolution?.referenceHash ?? null,
          },
        });
        reply.code(201).send(set);
      },
    );

    // GET /v1/submissions/:id/concept-checks
    app.get<{ Params: { id: string } }>(
      "/v1/submissions/:id/concept-checks",
      async (req, reply) => {
        if (!req.studentAuth) return notAuthed(reply);

        const isInstructor = !!req.studentAuth.instructorId;
        const filterStudentId = isInstructor ? undefined : req.studentAuth.studentId;

        // Verify the submission is visible to this caller. We reuse the submissions repo
        // role-scoped getter (instructor: any in tenant; student: own only).
        const submission = await submissionsRepo.getById({
          tenantId: req.studentAuth.tenantId,
          id: req.params.id,
          studentId: filterStudentId,
        });
        if (!submission) return notFound(reply);

        const items = await conceptCheckSetsRepo.listForSubmission({
          tenantId: req.studentAuth.tenantId,
          submissionId: submission.id,
          studentId: filterStudentId,
        });
        return { items };
      },
    );

    // GET /v1/concept-check-sets/:id
    app.get<{ Params: { id: string } }>("/v1/concept-check-sets/:id", async (req, reply) => {
      if (!req.studentAuth) return notAuthed(reply);
      const isInstructor = !!req.studentAuth.instructorId;
      const set = await conceptCheckSetsRepo.getById({
        tenantId: req.studentAuth.tenantId,
        id: req.params.id,
        studentId: isInstructor ? undefined : req.studentAuth.studentId,
      });
      if (!set) return notFound(reply);
      return set;
    });
  };
}
