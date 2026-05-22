"use client";

import { BrainAssistant, type BrainAssistantState } from "../brain-assistant";

const STATE_CAPTION: Record<BrainAssistantState, string> = {
  idle: "Idle",
  listening: "Listening…",
  transcribing: "Transcribing…",
  thinking: "Thinking…",
  responding: "Responding",
  speaking: "Reading reply…",
  disabled: "AI guided help is disabled",
  error: "Something went wrong",
};

type Props = {
  state: BrainAssistantState;
  aiHelpEnabled: boolean;
};

export function TaLabStage({ state }: Props) {
  return (
    <section className="ta-lab__stage" aria-label="Acta TA visualization">
      <div className={`ta-lab__orbit-field ta-lab__orbit-field--${state}`} aria-hidden="true">
        <span className="ta-lab__ring ta-lab__ring--a" />
        <span className="ta-lab__ring ta-lab__ring--b" />
        <span className="ta-lab__ring ta-lab__ring--c" />
      </div>
      <div className="ta-lab__orb">
        <BrainAssistant state={state} ariaLabel="Acta TA" style={{ width: 240, height: 240 }} />
      </div>
      <output className="ta-lab__caption" aria-live="polite">
        {STATE_CAPTION[state]}
      </output>
    </section>
  );
}
