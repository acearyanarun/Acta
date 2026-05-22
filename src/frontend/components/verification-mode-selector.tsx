"use client";

import { VERIFICATION_MODE_LABELS, type VerificationMode } from "../lib/types/assignment";

type Props = {
  value: VerificationMode;
  onChange: (mode: VerificationMode) => void;
};

const ORDER: VerificationMode[] = ["score", "gate", "fail_only"];

export function VerificationModeSelector({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Verification mode" className="mode-grid">
      {ORDER.map((mode) => {
        const meta = VERIFICATION_MODE_LABELS[mode];
        const selected = value === mode;
        return (
          <label key={mode} className={`mode-card${selected ? " mode-card--selected" : ""}`}>
            <input
              type="radio"
              name="verificationMode"
              value={mode}
              checked={selected}
              onChange={() => onChange(mode)}
              className="mode-card__radio"
            />
            <div className="mode-card__label">{meta.label}</div>
            <div className="mode-card__subtitle">{meta.subtitle}</div>
          </label>
        );
      })}
    </div>
  );
}
