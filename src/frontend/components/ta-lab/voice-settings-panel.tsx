"use client";

import { useEffect, useState } from "react";

export type VoiceSettings = {
  /** Web Speech API voice URI; null = browser default. */
  voiceURI: string | null;
  /** Utterance rate (0.5 — 2.0). */
  speed: number;
  /** Utterance volume (0 — 1). */
  volume: number;
};

type Props = {
  value: VoiceSettings;
  onChange: (next: VoiceSettings) => void;
  onClose: () => void;
  disabled?: boolean;
};

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  return window.speechSynthesis.getVoices();
}

export function VoiceSettingsPanel({ value, onChange, onClose, disabled = false }: Props) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    setVoices(loadVoices());
    const handler = () => setVoices(loadVoices());
    window.speechSynthesis.addEventListener?.("voiceschanged", handler);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", handler);
  }, []);

  function testVoice() {
    if (disabled) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(
        "This is your Acta TA. I guide your learning, but I will not give final answers when restricted.",
      );
      u.rate = value.speed;
      u.volume = value.volume;
      if (value.voiceURI) {
        const match = voices.find((v) => v.voiceURI === value.voiceURI);
        if (match) u.voice = match;
      }
      window.speechSynthesis.speak(u);
    } catch {
      /* ignore */
    }
  }

  return (
    <aside
      className="ta-lab__voice-panel"
      aria-label="Voice settings"
      data-testid="voice-settings-panel"
    >
      <div className="ta-lab__voice-header">
        <span className="ta-lab__voice-title">VOICE SETTINGS</span>
        <button
          type="button"
          className="ta-lab__voice-close"
          onClick={onClose}
          aria-label="Close voice settings"
        >
          ✕
        </button>
      </div>

      <label className="ta-lab__voice-row">
        <span className="ta-lab__voice-label">VOICE</span>
        <select
          className="ta-lab__voice-select"
          value={value.voiceURI ?? ""}
          onChange={(e) => onChange({ ...value, voiceURI: e.target.value || null })}
          disabled={disabled}
        >
          <option value="">Browser default</option>
          {voices.map((v) => (
            <option key={v.voiceURI} value={v.voiceURI}>
              {v.name} ({v.lang})
            </option>
          ))}
        </select>
      </label>

      <label className="ta-lab__voice-row">
        <span className="ta-lab__voice-label">
          SPEED <span className="ta-lab__voice-readout">{value.speed.toFixed(2)}×</span>
        </span>
        <input
          type="range"
          min={0.5}
          max={2}
          step={0.05}
          value={value.speed}
          onChange={(e) => onChange({ ...value, speed: Number.parseFloat(e.target.value) })}
          disabled={disabled}
          aria-label="Speech speed"
        />
      </label>

      <label className="ta-lab__voice-row">
        <span className="ta-lab__voice-label">
          VOLUME <span className="ta-lab__voice-readout">{Math.round(value.volume * 100)}%</span>
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={value.volume}
          onChange={(e) => onChange({ ...value, volume: Number.parseFloat(e.target.value) })}
          disabled={disabled}
          aria-label="Speech volume"
        />
      </label>

      <button type="button" className="ta-lab__voice-test" onClick={testVoice} disabled={disabled}>
        ▶ TEST VOICE
      </button>

      <p className="ta-lab__voice-note">
        Audio is used for transcription and is not retained by Acta.
      </p>
    </aside>
  );
}
