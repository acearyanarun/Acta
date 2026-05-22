"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { transcribeAnswer } from "../lib/api-client";
import type { TranscribeResponse } from "../lib/types/assignment";

type Props = {
  conceptCheckSetId: string;
  questionId: string;
  /** Caller-provided max recording duration (seconds). Defaults to 180. */
  maxSeconds?: number;
  /** Fires while recording / uploading / transcribing so the brain animation can update. */
  onStateChange?: (state: VoiceCaptureState) => void;
  /** Fires when transcription completes. Caller writes transcript into the textarea. */
  onTranscript: (r: TranscribeResponse) => void;
  /** Optional error sink. */
  onError?: (err: Error) => void;
};

export type VoiceCaptureState =
  | "unsupported"
  | "idle"
  | "recording"
  | "stopping"
  | "transcribing"
  | "done"
  | "error";

function isMediaRecorderSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.MediaRecorder !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

export function VoiceCapture({
  conceptCheckSetId,
  questionId,
  maxSeconds = 180,
  onStateChange,
  onTranscript,
  onError,
}: Props) {
  const [state, setState] = useState<VoiceCaptureState>(
    isMediaRecorderSupported() ? "idle" : "unsupported",
  );
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setSt = useCallback(
    (next: VoiceCaptureState) => {
      setState(next);
      onStateChange?.(next);
    },
    [onStateChange],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        try {
          recorderRef.current.stop();
        } catch {
          /* ignore */
        }
      }
      for (const t of streamRef.current?.getTracks() ?? []) t.stop();
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (!isMediaRecorderSupported()) {
      setSt("unsupported");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      // Prefer webm/opus; fall back to default if unsupported.
      const candidate = "audio/webm;codecs=opus";
      const mimeType = MediaRecorder.isTypeSupported?.(candidate) ? candidate : undefined;
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        // Tear down the mic immediately — no audio retained beyond this scope.
        for (const t of streamRef.current?.getTracks() ?? []) t.stop();
        streamRef.current = null;
        if (tickRef.current) {
          clearInterval(tickRef.current);
          tickRef.current = null;
        }
        const blob = new Blob(chunksRef.current, {
          type: chunksRef.current[0]?.type || "audio/webm",
        });
        chunksRef.current = [];
        if (blob.size === 0) {
          setSt("idle");
          return;
        }
        setSt("transcribing");
        try {
          const r = await transcribeAnswer(conceptCheckSetId, questionId, blob);
          onTranscript(r);
          setSt("done");
        } catch (err) {
          const e = err instanceof Error ? err : new Error(String(err));
          onError?.(e);
          setSt("error");
        }
      };
      recorder.start();
      setElapsed(0);
      setSt("recording");
      tickRef.current = setInterval(() => {
        setElapsed((s) => {
          const next = s + 1;
          if (next >= maxSeconds) {
            // Auto-stop at the cap.
            try {
              recorder.stop();
            } catch {
              /* ignore */
            }
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      onError?.(e);
      setSt("error");
    }
  }, [conceptCheckSetId, questionId, maxSeconds, onTranscript, onError, setSt]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      setSt("stopping");
      try {
        recorderRef.current.stop();
      } catch {
        /* will surface via onstop or error state */
      }
    }
  }, [setSt]);

  if (state === "unsupported") {
    return (
      <p className="voice-capture__unsupported">
        Voice recording isn't supported in this browser. Type your answer below instead.
      </p>
    );
  }

  return (
    <div className="voice-capture">
      <div className="voice-capture__controls">
        {state === "recording" || state === "stopping" ? (
          <button
            type="button"
            className="btn btn--ghost voice-capture__stop"
            onClick={stopRecording}
            disabled={state === "stopping"}
          >
            ⏹ Stop ({Math.max(0, maxSeconds - elapsed)}s left)
          </button>
        ) : state === "transcribing" ? (
          <button type="button" className="btn btn--ghost" disabled>
            Transcribing…
          </button>
        ) : (
          <button
            type="button"
            className="btn btn--ghost voice-capture__record"
            onClick={startRecording}
          >
            {state === "done" || state === "error" ? "🎤 Re-record" : "🎤 Record answer"}
          </button>
        )}
      </div>
      <p className="voice-capture__consent">
        Your audio is sent to OpenAI for transcription and is not retained by Acta.
      </p>
      {state === "error" ? (
        <p className="form-error">Couldn't transcribe. Try again, or type your answer below.</p>
      ) : null}
    </div>
  );
}
