import type { FastifyInstance, FastifyReply } from "fastify";
import { ZodError } from "zod";
import type { VerificationProvider } from "../ai/verification/types.js";
import { computeContentHash } from "../lib/content-hash.js";
import type {
  ConceptCheckQuestion,
  ConceptCheckSet,
  PerQuestionFeedback,
  VerificationAnswer,
} from "../lib/types.js";
import { createConceptCheckVerificationInputSchema } from "../lib/validators/concept-check-verification.js";
import { buildVerificationSystemPrompt } from "../lib/verification-prompt-builder.js";
import type { AssignmentsRepo } from "../repo/assignments-repo.js";
import type { ConceptCheckSetsRepo } from "../repo/concept-check-sets-repo.js";
import type { ConceptCheckVerificationsRepo } from "../repo/concept-check-verifications-repo.js";
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

type CrossCheckError =
  | { kind: "duplicate_question_id"; questionId: string }
  | { kind: "unknown_question_id"; questionId: string }
  | { kind: "missing_answers"; missing: string[] };

function crossCheckAnswers(
  answers: VerificationAnswer[],
  questions: ConceptCheckQuestion[],
): CrossCheckError | null {
  const setIds = new Set(questions.map((q) => q.id));
  const seen = new Set<string>();
  for (const a of answers) {
    if (seen.has(a.questionId)) {
      return { kind: "duplicate_question_id", questionId: a.questionId };
    }
    seen.add(a.questionId);
    if (!setIds.has(a.questionId)) {
      return { kind: "unknown_question_id", questionId: a.questionId };
    }
  }
  const missing = questions.filter((q) => !seen.has(q.id)).map((q) => q.id);
  if (missing.length > 0) {
    return { kind: "missing_answers", missing };
  }
  return null;
}

export function buildConceptCheckVerificationRoutes(
  assignmentsRepo: AssignmentsRepo,
  submissionsRepo: SubmissionsRepo,
  conceptCheckSetsRepo: ConceptCheckSetsRepo,
  verificationsRepo: ConceptCheckVerificationsRepo,
  referenceSolutionsRepo: ReferenceSolutionsRepo,
  provider: VerificationProvider,
) {
  return async function conceptCheckVerificationRoutes(app: FastifyInstance) {
    // POST /v1/concept-check-sets/:id/verifications — student-only and owner-only
    app.post<{ Params: { id: string } }>(
      "/v1/concept-check-sets/:id/verifications",
      async (req, reply) => {
        if (!req.studentAuth) return notAuthed(reply);
        // Privacy semantics (D-019): student-only. 404, not 403.
        if (!req.studentAuth.studentId) return notFound(reply);

        let parsed: ReturnType<typeof createConceptCheckVerificationInputSchema.parse>;
        try {
          parsed = createConceptCheckVerificationInputSchema.parse(req.body);
        } catch (err) {
          if (err instanceof ZodError) {
            reply.code(400).send({
              error: "validation_failed",
              message: "Invalid verification submission.",
              issues: err.issues,
            });
            return;
          }
          throw err;
        }

        // Caller must own the set.
        const set: ConceptCheckSet | null = await conceptCheckSetsRepo.getById({
          tenantId: req.studentAuth.tenantId,
          id: req.params.id,
          studentId: req.studentAuth.studentId,
        });
        if (!set) return notFound(reply);

        // D-048: re-verify transcriptHash for any voice-modality answer.
        // Defense-in-depth against client tampering between transcribe + submit.
        for (const a of parsed.answers) {
          if (a.modality === "voice") {
            const computed = computeContentHash(a.answer);
            if (a.transcriptHash !== computed) {
              reply.code(400).send({
                error: "transcript_hash_mismatch",
                message:
                  "transcriptHash does not match sha256(answer). Re-transcribe or submit as text.",
                questionId: a.questionId,
              });
              return;
            }
          }
        }

        // Cross-check answers against the set's question IDs.
        const crossErr = crossCheckAnswers(parsed.answers, set.questions);
        if (crossErr) {
          reply.code(400).send({
            error: crossErr.kind,
            message:
              crossErr.kind === "missing_answers"
                ? `Missing answers for ${crossErr.missing.length} question(s).`
                : crossErr.kind === "unknown_question_id"
                  ? "Answer references a questionId not in the set."
                  : "Duplicate questionId in answers.",
            details: crossErr,
          });
          return;
        }

        // Resolve the SUBMISSION (for content) and the pinned policy version
        // (for prompt context). Both must succeed within the set's tenant.
        const submission = await submissionsRepo.getById({
          tenantId: set.tenantId,
          id: set.submissionId,
          studentId: req.studentAuth.studentId,
        });
        if (!submission) return notFound(reply);

        const pinned = await assignmentsRepo.getByTenantIdVersion(
          set.tenantId,
          set.assignmentId,
          set.policyVersion,
        );
        if (!pinned) return notFound(reply);

        // D-041 retrieval: fetch the current Instructor Solution Guide if one exists.
        // null is the strictly-additive fallback (D-043).
        const referenceSolution = await referenceSolutionsRepo.getCurrentByAssignment({
          tenantId: set.tenantId,
          assignmentId: set.assignmentId,
        });

        const systemPrompt = buildVerificationSystemPrompt({
          policy: pinned.policy,
          submission,
          questions: set.questions,
          answers: parsed.answers,
          referenceSolution,
        });

        const result = await provider.evaluate({
          policy: pinned.policy,
          submission,
          questions: set.questions,
          answers: parsed.answers,
          systemPrompt,
          referenceSolution,
        });

        // Normalize per-question feedback ordering to match the set's question order.
        const fbById = new Map<string, PerQuestionFeedback>(
          result.perQuestionFeedback.map((f) => [f.questionId, f]),
        );
        const normalizedFeedback: PerQuestionFeedback[] = set.questions.map((q) => {
          const found = fbById.get(q.id);
          if (found) return found;
          return {
            questionId: q.id,
            status: "partial",
            feedback: "no response in evaluator output",
          };
        });

        const hasVoiceAnswers = parsed.answers.some((a) => a.modality === "voice");

        const row = await verificationsRepo.create({
          set,
          answers: parsed.answers,
          result: result.result,
          overallFeedback: result.overallFeedback,
          perQuestionFeedback: normalizedFeedback,
          provider: provider.name,
          model: provider.model,
          referencePin: {
            referenceSolutionId: referenceSolution?.id ?? null,
            referenceVersion: referenceSolution?.version ?? null,
            referenceHash: referenceSolution?.referenceHash ?? null,
          },
          hasVoiceAnswers,
        });
        reply.code(201).send(row);
      },
    );

    // GET /v1/concept-check-sets/:id/verifications
    app.get<{ Params: { id: string } }>(
      "/v1/concept-check-sets/:id/verifications",
      async (req, reply) => {
        if (!req.studentAuth) return notAuthed(reply);
        const isInstructor = !!req.studentAuth.instructorId;
        const filterStudentId = isInstructor ? undefined : req.studentAuth.studentId;

        // Verify the set is visible.
        const set = await conceptCheckSetsRepo.getById({
          tenantId: req.studentAuth.tenantId,
          id: req.params.id,
          studentId: filterStudentId,
        });
        if (!set) return notFound(reply);

        const items = await verificationsRepo.listForSet({
          tenantId: req.studentAuth.tenantId,
          conceptCheckSetId: set.id,
          studentId: filterStudentId,
        });
        return { items };
      },
    );

    // GET /v1/verifications/:id
    app.get<{ Params: { id: string } }>("/v1/verifications/:id", async (req, reply) => {
      if (!req.studentAuth) return notAuthed(reply);
      const isInstructor = !!req.studentAuth.instructorId;
      const row = await verificationsRepo.getById({
        tenantId: req.studentAuth.tenantId,
        id: req.params.id,
        studentId: isInstructor ? undefined : req.studentAuth.studentId,
      });
      if (!row) return notFound(reply);
      return row;
    });
  };
}
