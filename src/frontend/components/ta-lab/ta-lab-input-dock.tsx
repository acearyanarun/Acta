"use client";

import type { Assignment } from "../../lib/types/assignment";
import { VoiceChatInput, type VoiceChatInputState } from "../voice-chat-input";

type Props = {
  assignment: Assignment;
  aiHelpEnabled: boolean;
  pending: boolean;
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onVoiceState: (s: VoiceChatInputState) => void;
  onTranscript: (t: string) => void;
  onVoiceError: (e: Error) => void;
};

export function TaLabInputDock({
  assignment,
  aiHelpEnabled,
  pending,
  input,
  onInputChange,
  onSend,
  onVoiceState,
  onTranscript,
  onVoiceError,
}: Props) {
  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <footer className="ta-lab__dock">
      <span className="ta-lab__dock-caret" aria-hidden="true">
        {">"}
      </span>
      <textarea
        className="ta-lab__dock-input"
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder={
          aiHelpEnabled
            ? "Ask the TA — Cmd/Ctrl+Enter to send"
            : "AI guided help is disabled for this assignment."
        }
        rows={2}
        maxLength={20_000}
        disabled={pending || !aiHelpEnabled}
        aria-label="Message the TA"
      />
      <div className="ta-lab__dock-actions">
        <VoiceChatInput
          assignmentId={assignment.id}
          disabled={pending || !aiHelpEnabled}
          onStateChange={onVoiceState}
          onTranscript={onTranscript}
          onError={onVoiceError}
        />
        <button
          type="button"
          className="ta-lab__dock-send"
          onClick={onSend}
          disabled={pending || !aiHelpEnabled || input.trim().length === 0}
          aria-label="Send"
        >
          {pending ? "…" : "SEND"}
        </button>
      </div>
    </footer>
  );
}
