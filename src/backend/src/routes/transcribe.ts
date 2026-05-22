import type { FastifyInstance, FastifyReply } from "fastify";
import type { TranscriptionProvider } from "../ai/transcription/types.js";
import { ACCEPTED_MIME_TYPES, type TranscriptionMimeType } from "../ai/transcription/types.js";
import { computeContentHash } from "../lib/content-hash.js";
import type { ConceptCheckSetsRepo } from "../repo/concept-check-sets-repo.js";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25 MB
const MIN_AUDIO_BYTES = 1024; // tiny clips are just codec headers; reject before OpenAI does
const RATE_LIMIT_PER_HOUR = 30;

function notAuthed(reply: FastifyReply) {
  reply.code(401).send({
    error: "unauthorized",
    message: "Missing tenant or student/instructor header.",
  });
}

function notFound(reply: FastifyReply) {
  reply.code(404).send({ error: "not_found", message: "Not found." });
}

function isAcceptedMime(mime: string): mime is TranscriptionMimeType {
  return ACCEPTED_MIME_TYPES.includes(mime as TranscriptionMimeType);
}

/**
 * D-048: POST /v1/concept-check-sets/:id/transcribe
 *
 * Student-only, owner-only. Body is the raw audio Buffer with
 * Content-Type: audio/{webm|mp4|ogg|wav}. Returns the transcript + sha256
 * hash + provider/model metadata. The audio Buffer is in-memory only and goes
 * out of scope after the response — no disk write, no audio column, ever.
 *
 * Rate limit (D-048-7): 30 transcribe calls/hour per student (in-memory only;
 * resets on backend restart).
 */
export function buildTranscribeRoutes(
  conceptCheckSetsRepo: ConceptCheckSetsRepo,
  transcriptionProvider: TranscriptionProvider,
) {
  // Per-student rate limit, in-memory (NOT persistent across restarts).
  const recentCalls = new Map<string, number[]>();

  function rateLimited(key: string): boolean {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const arr = (recentCalls.get(key) ?? []).filter((t) => t > oneHourAgo);
    if (arr.length >= RATE_LIMIT_PER_HOUR) {
      recentCalls.set(key, arr);
      return true;
    }
    arr.push(now);
    recentCalls.set(key, arr);
    return false;
  }

  return async function transcribeRoutes(app: FastifyInstance) {
    // Fastify body parsers for raw audio. Each handler receives a Buffer.
    // No spooling to disk; the parser uses parseAs: "buffer".
    for (const mime of ACCEPTED_MIME_TYPES) {
      app.addContentTypeParser(
        mime,
        { parseAs: "buffer", bodyLimit: MAX_AUDIO_BYTES + 1024 },
        (_req, body, done) => {
          done(null, body);
        },
      );
    }

    app.post<{ Params: { id: string }; Querystring: { questionId?: string } }>(
      "/v1/concept-check-sets/:id/transcribe",
      {
        bodyLimit: MAX_AUDIO_BYTES + 1024,
      },
      async (req, reply) => {
        if (!req.studentAuth) return notAuthed(reply);
        // Student-only. Instructor + cross-tenant + non-owner all collapse to 404
        // (D-019 privacy semantics — never reveal existence).
        if (!req.studentAuth.studentId) return notFound(reply);

        const questionId = (req.query.questionId ?? "").trim();
        if (questionId.length === 0 || questionId.length > 64) {
          reply.code(400).send({
            error: "validation_failed",
            message: "questionId query parameter is required (≤ 64 chars).",
          });
          return;
        }

        const contentType = (req.headers["content-type"] ?? "").split(";")[0]?.trim() ?? "";
        if (!isAcceptedMime(contentType)) {
          reply.code(415).send({
            error: "unsupported_media_type",
            message: `Content-Type must be one of: ${ACCEPTED_MIME_TYPES.join(", ")}`,
          });
          return;
        }

        const audio = req.body;
        if (!Buffer.isBuffer(audio) || audio.length === 0) {
          reply.code(400).send({
            error: "validation_failed",
            message: "Empty audio body.",
          });
          return;
        }
        if (audio.length > MAX_AUDIO_BYTES) {
          reply.code(413).send({
            error: "payload_too_large",
            message: `Audio exceeds the ${MAX_AUDIO_BYTES}-byte cap.`,
          });
          return;
        }
        if (audio.length < MIN_AUDIO_BYTES) {
          reply.code(400).send({
            error: "audio_too_short",
            message: "Recording was too short to transcribe. Hold the mic for at least a second.",
          });
          return;
        }

        // Owner-only: the set must belong to the student.
        const set = await conceptCheckSetsRepo.getById({
          tenantId: req.studentAuth.tenantId,
          id: req.params.id,
          studentId: req.studentAuth.studentId,
        });
        if (!set) return notFound(reply);

        // Question must be part of the set.
        if (!set.questions.some((q) => q.id === questionId)) {
          reply.code(400).send({
            error: "unknown_question_id",
            message: "questionId is not part of this concept-check set.",
          });
          return;
        }

        // Per-student rate limit.
        const rateKey = `${req.studentAuth.tenantId}:${req.studentAuth.studentId}`;
        if (rateLimited(rateKey)) {
          reply.code(429).send({
            error: "rate_limited",
            message: `Too many transcription requests. Limit: ${RATE_LIMIT_PER_HOUR}/hour.`,
          });
          return;
        }

        // Transcribe. Buffer goes out of scope after this call returns; the
        // provider may not retain or persist it.
        let transcript: string;
        let durationSec: number | null = null;
        try {
          const result = await transcriptionProvider.transcribe({
            audio,
            mimeType: contentType,
            conceptCheckSetId: set.id,
            questionId,
          });
          transcript = result.transcript;
          durationSec = result.durationSec;
        } catch (err) {
          req.log.error(
            { err: err instanceof Error ? err.message : String(err) },
            "Transcription failed.",
          );
          reply.code(502).send({
            error: "transcription_failed",
            message: "Transcription provider failed. Try again or submit by text.",
          });
          return;
        }

        const transcriptHash = computeContentHash(transcript);
        reply.code(201).send({
          transcript,
          transcriptHash,
          provider: transcriptionProvider.name,
          model: transcriptionProvider.model,
          durationSec,
        });
      },
    );
  };
}
