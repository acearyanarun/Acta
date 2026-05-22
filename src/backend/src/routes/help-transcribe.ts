import type { FastifyInstance, FastifyReply } from "fastify";
import type { TranscriptionProvider } from "../ai/transcription/types.js";
import { ACCEPTED_MIME_TYPES, type TranscriptionMimeType } from "../ai/transcription/types.js";
import { computeContentHash } from "../lib/content-hash.js";
import type { AssignmentsRepo } from "../repo/assignments-repo.js";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const RATE_LIMIT_PER_HOUR = 30;
// Below this size the upload is almost always just a codec header with no
// audio frames (MediaRecorder stopped within a few hundred ms of starting).
// OpenAI rejects these with a generic "file corrupted" 400 — we reject earlier
// with a clearer message.
const MIN_AUDIO_BYTES = 1024;

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
 * Conversational TA voice input: POST /v1/assignments/:id/help/transcribe
 *
 * Student-only, assignment-scoped. Body is the raw audio Buffer. Returns the
 * transcript + sha256 hash + provider/model metadata. Reuses the same
 * TranscriptionProvider as the concept-check voice path; the audio Buffer is
 * in-memory only and discarded after the response — no disk, no DB column,
 * no ledger event, no verification attempt.
 *
 * Refuses (400 ai_help_disabled) when the assignment's current policy has
 * aiHelpEnabled=false, so the brain TA never transcribes when guided help is
 * off (same gate as the help route).
 */
export function buildHelpTranscribeRoutes(
  repo: AssignmentsRepo,
  transcriptionProvider: TranscriptionProvider,
) {
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

  return async function helpTranscribeRoutes(app: FastifyInstance) {
    for (const mime of ACCEPTED_MIME_TYPES) {
      app.addContentTypeParser(
        mime,
        { parseAs: "buffer", bodyLimit: MAX_AUDIO_BYTES + 1024 },
        (_req, body, done) => {
          done(null, body);
        },
      );
    }

    app.post<{ Params: { id: string } }>(
      "/v1/assignments/:id/help/transcribe",
      { bodyLimit: MAX_AUDIO_BYTES + 1024 },
      async (req, reply) => {
        if (!req.studentAuth) return notAuthed(reply);
        // Student-only. Instructor + missing-student collapse to 404 (D-019).
        if (!req.studentAuth.studentId) return notFound(reply);

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

        const assignment = await repo.getByTenantId(req.studentAuth.tenantId, req.params.id);
        if (!assignment) return notFound(reply);

        // Same master-toggle gate as POST /help: when AI guided help is off,
        // the brain TA must not transcribe either.
        if (assignment.policy.aiHelpEnabled === false) {
          reply.code(400).send({
            error: "ai_help_disabled",
            message: "AI guided help is disabled for this assignment.",
          });
          return;
        }

        const rateKey = `${req.studentAuth.tenantId}:${req.studentAuth.studentId}`;
        if (rateLimited(rateKey)) {
          reply.code(429).send({
            error: "rate_limited",
            message: `Too many transcription requests. Limit: ${RATE_LIMIT_PER_HOUR}/hour.`,
          });
          return;
        }

        let transcript: string;
        let durationSec: number | null = null;
        try {
          const result = await transcriptionProvider.transcribe({
            audio,
            mimeType: contentType,
            // Context for logging only — never persisted as part of the transcript.
            // We reuse the same provider signature; the conceptCheckSetId/questionId
            // fields are repurposed as opaque context strings for the help path.
            conceptCheckSetId: `help:${assignment.id}`,
            questionId: "help-chat",
          });
          transcript = result.transcript;
          durationSec = result.durationSec;
        } catch (err) {
          req.log.error(
            { err: err instanceof Error ? err.message : String(err) },
            "Help transcription failed.",
          );
          reply.code(502).send({
            error: "transcription_failed",
            message: "Transcription provider failed. Try again or type your question.",
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
