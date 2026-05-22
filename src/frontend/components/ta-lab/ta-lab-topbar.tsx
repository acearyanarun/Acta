"use client";

import Link from "next/link";
import type { Assignment, HelpRequestType } from "../../lib/types/assignment";
import {
  HELP_REQUEST_LABELS,
  HELP_REQUEST_TYPES,
  helpTypeAllowedFlag,
} from "../../lib/types/assignment";

type Props = {
  assignment: Assignment;
  aiHelpEnabled: boolean;
  requestType: HelpRequestType;
  onRequestTypeChange: (t: HelpRequestType) => void;
  speechSupported: boolean;
  speakReplies: boolean;
  onToggleSpeakReplies: () => void;
  voiceSettingsOpen: boolean;
  onToggleVoiceSettings: () => void;
  onClear: () => void;
};

export function TaLabTopbar({
  assignment,
  aiHelpEnabled,
  requestType,
  onRequestTypeChange,
  speechSupported,
  speakReplies,
  onToggleSpeakReplies,
  voiceSettingsOpen,
  onToggleVoiceSettings,
  onClear,
}: Props) {
  const policy = assignment.policy;

  return (
    <header className="ta-lab__topbar">
      <div className="ta-lab__brand">
        <span className="ta-lab__wordmark">ACTA</span>
        <span className="ta-lab__role">TA LAB</span>
      </div>

      {/*
       * UI cleanup: assignment title, policy hash chip, and the
       * "final answers restricted" chip are hidden from the topbar.
       * The values still live in `policy` (driving the helper-tab disabled
       * logic) and on every wire payload — we just no longer surface them
       * here. Policy enforcement happens server-side regardless of whether
       * the chip renders.
       */}

      <div className="ta-lab__help-types" role="tablist" aria-label="Help type">
        {HELP_REQUEST_TYPES.map((t) => {
          const flag = helpTypeAllowedFlag(t);
          const allowed = flag === null ? true : policy.aiHelp[flag] !== false;
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={requestType === t}
              aria-pressed={requestType === t}
              disabled={!aiHelpEnabled || !allowed}
              className={`ta-lab__pill ${requestType === t ? "ta-lab__pill--active" : ""}`}
              onClick={() => onRequestTypeChange(t)}
              title={allowed ? HELP_REQUEST_LABELS[t] : "Not allowed by instructor policy"}
            >
              {HELP_REQUEST_LABELS[t].toUpperCase()}
            </button>
          );
        })}
      </div>

      <div className="ta-lab__controls">
        <span
          className={`ta-lab__chip ${aiHelpEnabled ? "ta-lab__chip--live" : "ta-lab__chip--off"}`}
          aria-live="polite"
        >
          {aiHelpEnabled ? "● SESSION ACTIVE" : "○ HELP OFF"}
        </span>
        {speechSupported ? (
          <button
            type="button"
            className={`ta-lab__pill ${speakReplies ? "ta-lab__pill--active" : ""}`}
            onClick={onToggleSpeakReplies}
            disabled={!aiHelpEnabled}
            aria-pressed={speakReplies}
            title="Read TA replies aloud using your browser's speech synthesizer"
          >
            READ {speakReplies ? "ON" : "OFF"}
          </button>
        ) : null}
        <button
          type="button"
          className={`ta-lab__pill ${voiceSettingsOpen ? "ta-lab__pill--active" : ""}`}
          onClick={onToggleVoiceSettings}
          disabled={!aiHelpEnabled || !speechSupported}
          aria-pressed={voiceSettingsOpen}
          aria-label="Open voice settings"
          title={
            speechSupported
              ? "Voice settings (browser voice, speed, volume)"
              : "Browser speech synthesis is not available"
          }
        >
          ⚙ VOICE
        </button>
        <button
          type="button"
          className="ta-lab__pill"
          onClick={onClear}
          aria-label="Clear transcript"
          title="Clear the conversation locally"
        >
          CLEAR
        </button>
        <Link href={`/student/${assignment.id}`} className="ta-lab__back">
          ← BACK
        </Link>
      </div>
    </header>
  );
}
