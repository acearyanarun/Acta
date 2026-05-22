"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { transcribeHelpAnswer } from "../lib/api-client";

export type VoiceChatInputState =
  | "unsupported"
  | "idle"
  | "recording"
  | "stopping"
  | "transcribing"
  | "done"
  | "error";

type Props = {
  assignmentId: string;
  /** Caller-provided max recording duration. Defaults to 120s for chat. */
  maxSeconds?: number;
  /** Disabled (e.g., aiHelpEnabled=false or send pending). */
  disabled?: boolean;
  /** Fires while recording / uploading / transcribing so the brain can update. */
  onStateChange?: (state: VoiceChatInputState) => void;
  /** Fires when transcription completes. Caller writes transcript into the input. */
  onTranscript: (transcript: string) => void;
  /** Optional error sink. */
  onError?: (err: Error) => void;
};

function isMediaRecorderSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.MediaRecorder !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

export function VoiceChatInput({
  assignmentId,
  maxSeconds = 120,
  disabled = false,
  onStateChange,
  onTranscript,
  onError,
}: Props) {
  const [state, setState] = useState<VoiceChatInputState>(
    isMediaRecorderSupported() ? "idle" : "unsupported",
  );
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setSt = useCallback(
    (next: VoiceChatInputState) => {
      setState(next);
      onStateChange?.(next);
    },
    [onStateChange],
  );

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
      const candidate = "audio/webm;codecs=opus";
      const mimeType = MediaRecorder.isTypeSupported?.(candidate) ? candidate : undefined;
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
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
          const r = await transcribeHelpAnswer(assignmentId, blob);
          onTranscript(r.transcript);
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
  }, [assignmentId, maxSeconds, onTranscript, onError, setSt]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      setSt("stopping");
      try {
        recorderRef.current.stop();
      } catch {
        /* surfaced via onstop or error state */
      }
    }
  }, [setSt]);

  if (state === "unsupported") {
    return null;
  }

  const isRecording = state === "recording" || state === "stopping";

  return (
    <div className="voice-chat-input">
      {isRecording ? (
        <button
          type="button"
          className="btn btn--ghost voice-chat-input__stop"
          onClick={stopRecording}
          disabled={state === "stopping"}
          aria-label="Stop recording"
        >
          ⏹ Stop ({Math.max(0, maxSeconds - elapsed)}s)
        </button>
      ) : state === "transcribing" ? (
        <button type="button" className="btn btn--ghost" disabled aria-label="Transcribing">
          Transcribing…
        </button>
      ) : (
        <button
          type="button"
          className="btn btn--ghost voice-chat-input__record"
          onClick={startRecording}
          disabled={disabled}
          aria-label="Speak to the TA"
        >
          🎤 Speak to TA
        </button>
      )}
      <span className="voice-chat-input__consent">
        Audio is used for transcription and is not retained by Acta.
      </span>
    </div>
  );
}
