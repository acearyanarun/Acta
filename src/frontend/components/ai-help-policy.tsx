"use client";

import { AI_HELP_LABELS, type AiHelpPolicy } from "../lib/types/assignment";

type Props = {
  value: AiHelpPolicy;
  onChange: (next: AiHelpPolicy) => void;
  /**
   * When true, all per-type checkboxes are visually + functionally disabled.
   * Used by the assignment form when the master AI-help toggle is off.
   */
  disabled?: boolean;
};

const ORDER: (keyof AiHelpPolicy)[] = [
  "conceptExplanation",
  "hints",
  "examples",
  "debuggingGuidance",
  "restrictFinalAnswer",
];

export function AiHelpPolicyControl({ value, onChange, disabled = false }: Props) {
  return (
    <div className="ai-help-grid">
      {ORDER.map((key) => {
        const meta = AI_HELP_LABELS[key];
        const isHard = key === "restrictFinalAnswer";
        return (
          <label key={key} className={`ai-help-row${isHard ? " ai-help-row--hard" : ""}`}>
            <input
              type="checkbox"
              checked={value[key]}
              onChange={(e) => onChange({ ...value, [key]: e.target.checked })}
              disabled={disabled}
            />
            <span>
              <span className="ai-help-row__label">
                {meta.label}
                {isHard ? <span className="ai-help-row__pill">hard rule</span> : null}
              </span>
              <span className="ai-help-row__helper">{meta.helper}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
