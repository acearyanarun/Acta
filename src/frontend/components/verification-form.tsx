"use client";

import { useState } from "react";
import { submitVerification } from "../lib/api-client";
import type {
  ConceptCheckQuestion,
  ConceptCheckVerification,
  TranscribeResponse,
  TranscriptionProviderName,
  VerificationAnswer,
} from "../lib/types/assignment";
import { BrainAssistant, type BrainAssistantState } from "./brain-assistant";
import { VoiceCapture, type VoiceCaptureState } from "./voice-capture";

type Props = {
  conceptCheckSetId: string;
  questions: ConceptCheckQuestion[];
  onSubmitted: (attempt: ConceptCheckVerification) => void;
};

type VoiceMeta = {
  transcriptHash: string;
  transcriptionProvider: TranscriptionProviderName;
  transcriptionModel: string | null;
  /** True after the student edited the transcript. */
  transcriptEdited: boolean;
  /** The exact transcript text we received from the server. */
  originalTranscript: string;
};

export function VerificationForm({ conceptCheckSetId, questions, onSubmitted }: Props) {
  const [answersById, setAnswersById] = useState<Record<string, string>>(() =>
    Object.fromEntries(questions.map((q) => [q.id, ""])),
  );
  const [voiceMetaById, setVoiceMetaById] = useState<Record<string, VoiceMeta | undefined>>({});
  const [voiceUiOpen, setVoiceUiOpen] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brainState, setBrainState] = useState<BrainAssistantState>("idle");

  const allAnswered = questions.every((q) => (answersById[q.id] ?? "").trim().length > 0);
  const canSubmit = allAnswered && !pending;

  function handleVoiceState(qid: string, s: VoiceCaptureState) {
    if (s === "recording") setBrainState("listening");
    else if (s === "transcribing" || s === "stopping") setBrainState("transcribing");
    else if (s === "error") setBrainState("error");
    else if (s === "unsupported") setBrainState("disabled");
    else if (s === "done") {
      setBrainState("responding");
      // Settle back to idle after a brief responding pulse.
      setTimeout(() => setBrainState("idle"), 1200);
    } else if (s === "idle") setBrainState("idle");
    // qid included so callers see per-question transitions if needed in future.
    void qid;
  }

  function handleTranscript(qid: string, r: TranscribeResponse) {
    setAnswersById((prev) => ({ ...prev, [qid]: r.transcript }));
    setVoiceMetaById((prev) => ({
      ...prev,
      [qid]: {
        transcriptHash: r.transcriptHash,
        transcriptionProvider: r.provider,
        transcriptionModel: r.model,
        transcriptEdited: false,
        originalTranscript: r.transcript,
      },
    }));
  }

  function handleAnswerChange(qid: string, next: string) {
    setAnswersById((prev) => ({ ...prev, [qid]: next }));
    setVoiceMetaById((prev) => {
      const existing = prev[qid];
      if (!existing) return prev; // text path — nothing to track
      const edited = next !== existing.originalTranscript;
      if (existing.transcriptEdited === edited) return prev;
      return { ...prev, [qid]: { ...existing, transcriptEdited: edited } };
    });
  }

  async function computeSha256Hex(text: string): Promise<string> {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    const bytes = Array.from(new Uint8Array(buf));
    return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setPending(true);
    setError(null);
    setBrainState("thinking");
    try {
      const answers: VerificationAnswer[] = [];
      for (const q of questions) {
        const text = answersById[q.id] ?? "";
        const meta = voiceMetaById[q.id];
        if (meta) {
          // If the student edited the transcript, recompute transcriptHash to
          // match the new text — the backend re-verifies sha256(answer).
          const hash = meta.transcriptEdited ? await computeSha256Hex(text) : meta.transcriptHash;
          answers.push({
            questionId: q.id,
            answer: text,
            modality: "voice",
            transcriptHash: hash,
            transcriptionProvider: meta.transcriptionProvider,
            transcriptionModel: meta.transcriptionModel,
            transcriptEdited: meta.transcriptEdited,
          });
        } else {
          answers.push({ questionId: q.id, answer: text });
        }
      }
      const result = await submitVerification(conceptCheckSetId, { answers });
      onSubmitted(result);
      setBrainState("responding");
      setTimeout(() => setBrainState("idle"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBrainState("error");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="verification-form">
      <div className="verification-form__assistant">
        <BrainAssistant state={brainState} />
      </div>
      <ol className="verification-form__questions">
        {questions.map((q) => {
          const meta = voiceMetaById[q.id];
          const showingVoice = voiceUiOpen[q.id] ?? false;
          return (
            <li key={q.id}>
              <div className="verification-form__prompt">
                {q.prompt}
                {q.conceptTag ? (
                  <span className="verification-form__tag">[{q.conceptTag}]</span>
                ) : null}
              </div>
              <div className="verification-form__answer-toggle">
                <button
                  type="button"
                  className={`verification-form__toggle ${showingVoice ? "" : "verification-form__toggle--active"}`}
                  onClick={() => setVoiceUiOpen((prev) => ({ ...prev, [q.id]: false }))}
                  disabled={pending}
                >
                  Type
                </button>
                <button
                  type="button"
                  className={`verification-form__toggle ${showingVoice ? "verification-form__toggle--active" : ""}`}
                  onClick={() => setVoiceUiOpen((prev) => ({ ...prev, [q.id]: true }))}
                  disabled={pending}
                >
                  🎤 Voice
                </button>
                {meta ? (
                  <span
                    className="verification-form__voice-chip"
                    title={`Transcribed by ${meta.transcriptionModel ?? meta.transcriptionProvider}`}
                  >
                    voice{meta.transcriptEdited ? " · edited" : ""}
                  </span>
                ) : null}
              </div>
              {showingVoice ? (
                <VoiceCapture
                  conceptCheckSetId={conceptCheckSetId}
                  questionId={q.id}
                  onStateChange={(s) => handleVoiceState(q.id, s)}
                  onTranscript={(r) => handleTranscript(q.id, r)}
                  onError={() => setBrainState("error")}
                />
              ) : null}
              <label className="field">
                <span className="visually-hidden">Your answer</span>
                <textarea
                  value={answersById[q.id] ?? ""}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  rows={4}
                  maxLength={5_000}
                  placeholder="Answer in your own words (5,000 chars max)."
                  disabled={pending}
                />
              </label>
            </li>
          );
        })}
      </ol>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="form-footer">
        <button type="submit" className="btn btn--primary" disabled={!canSubmit}>
          {pending ? "Submitting…" : "Submit verification"}
        </button>
      </div>
    </form>
  );
}
