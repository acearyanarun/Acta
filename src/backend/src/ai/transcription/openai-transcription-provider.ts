import type {
  TranscriptionProvider,
  TranscriptionProviderRequest,
  TranscriptionProviderResult,
} from "./types.js";

const DEFAULT_MODEL = "gpt-4o-mini-transcribe";
const OPENAI_TRANSCRIPTION_URL = "https://api.openai.com/v1/audio/transcriptions";

export type OpenAiTranscriptionProviderOptions = {
  apiKey: string;
  model?: string;
  /** Override for tests. Defaults to global fetch. */
  fetchFn?: typeof fetch;
};

type OpenAiTranscriptionResponse = {
  text?: string;
  duration?: number | string | null;
};

function fileExtensionFor(mimeType: TranscriptionProviderRequest["mimeType"]): string {
  switch (mimeType) {
    case "audio/webm":
      return "webm";
    case "audio/mp4":
      return "mp4";
    case "audio/ogg":
      return "ogg";
    case "audio/wav":
      return "wav";
  }
}

/**
 * D-048: OpenAI transcription provider. Posts the in-memory audio Buffer
 * directly to /v1/audio/transcriptions via multipart/form-data. The Buffer is
 * never spooled to disk and goes out of scope after this function returns.
 *
 * OpenAI documents that /v1/audio/transcriptions has Zero Data Retention
 * enabled by default. We never opt in to model training.
 */
export function createOpenAiTranscriptionProvider(
  opts: OpenAiTranscriptionProviderOptions,
): TranscriptionProvider {
  const apiKey = opts.apiKey;
  const model = opts.model && opts.model.trim().length > 0 ? opts.model : DEFAULT_MODEL;
  const doFetch = opts.fetchFn ?? fetch;

  return {
    name: "openai",
    model,
    async transcribe(req: TranscriptionProviderRequest): Promise<TranscriptionProviderResult> {
      const form = new FormData();
      const ext = fileExtensionFor(req.mimeType);
      // Web FormData + Blob is available natively in Node 20+. The Blob view
      // is constructed from the in-memory Buffer; no disk write happens.
      const blob = new Blob([new Uint8Array(req.audio)], { type: req.mimeType });
      form.append("file", blob, `answer.${ext}`);
      form.append("model", model);
      form.append("response_format", "verbose_json");
      if (req.languageHint) {
        form.append("language", req.languageHint);
      }

      const res = await doFetch(OPENAI_TRANSCRIPTION_URL, {
        method: "POST",
        headers: {
          // Do NOT set Content-Type — let fetch set the multipart boundary.
          Authorization: `Bearer ${apiKey}`,
        },
        body: form,
      });

      if (!res.ok) {
        // Capture the upstream body for diagnostics, but strip anything that
        // looks like a key/token before re-throwing. The route logs this; we
        // never echo it back to the client.
        let upstreamDetail = "";
        try {
          const raw = await res.text();
          upstreamDetail = raw
            .replace(/sk-[A-Za-z0-9_-]{6,}/g, "<redacted-key>")
            .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer <redacted>")
            .slice(0, 500);
        } catch {
          /* ignore */
        }
        throw new Error(
          `OpenAI transcription failed: ${res.status} ${res.statusText}${
            upstreamDetail ? ` :: ${upstreamDetail}` : ""
          }`,
        );
      }

      const body = (await res.json()) as OpenAiTranscriptionResponse;
      const transcript = (body.text ?? "").trim();
      const durationSec =
        typeof body.duration === "number"
          ? body.duration
          : typeof body.duration === "string"
            ? Number.parseFloat(body.duration) || null
            : null;

      return { transcript: transcript || "(no transcript)", durationSec };
    },
  };
}
