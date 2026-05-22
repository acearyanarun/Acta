import type {
  TranscriptionProvider,
  TranscriptionProviderRequest,
  TranscriptionProviderResult,
} from "./types.js";

/**
 * Deterministic stub. Output is a function of (questionId, audio.length) so
 * tests can assert byte-sensitivity without ever calling a real ASR service.
 *
 * The transcript is intentionally written to be classifiable by the existing
 * verification calibration tests (contains reasoning connectives + length).
 */
export function createStubTranscriptionProvider(): TranscriptionProvider {
  return {
    name: "stub",
    model: null,
    async transcribe(req: TranscriptionProviderRequest): Promise<TranscriptionProviderResult> {
      const bytes = req.audio.length;
      const transcript = `This is a stub transcript for question ${req.questionId}. I am answering by voice because the assignment allows it, and I want to demonstrate that I understand my own submission. The recording was ${bytes} bytes long.`;
      // Rough duration estimate: webm/opus averages ~16 KB/s at 32 kbps. Don't
      // expose a misleading number in tests — return null for the stub.
      return { transcript, durationSec: null };
    },
  };
}
