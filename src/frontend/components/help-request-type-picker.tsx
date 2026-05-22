"use client";

import {
  type AiHelpPolicy,
  HELP_REQUEST_LABELS,
  HELP_REQUEST_TYPES,
  type HelpRequestType,
  helpTypeAllowedFlag,
} from "../lib/types/assignment";

type Props = {
  policy: AiHelpPolicy;
  value: HelpRequestType;
  onChange: (next: HelpRequestType) => void;
};

export function HelpRequestTypePicker({ policy, value, onChange }: Props) {
  return (
    <div className="chip-row" aria-label="Help type">
      {HELP_REQUEST_TYPES.map((type) => {
        const flag = helpTypeAllowedFlag(type);
        const disabled = flag !== null && policy[flag] === false;
        const selected = value === type;
        return (
          <button
            key={type}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            title={disabled ? "Disabled by instructor policy" : undefined}
            className={`chip${selected ? " chip--selected" : ""}${disabled ? " chip--disabled" : ""}`}
            onClick={() => {
              if (!disabled) onChange(type);
            }}
          >
            {HELP_REQUEST_LABELS[type]}
          </button>
        );
      })}
    </div>
  );
}
