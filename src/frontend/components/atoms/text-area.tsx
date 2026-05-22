"use client";

import { useId } from "react";

type Props = {
  name: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  hint?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  /** D1 allowlist — narrow native attrs that carry semantic value. */
  autoComplete?: string;
  autoFocus?: boolean;
  minLength?: number;
  maxLength?: number;
  readOnly?: boolean;
  spellCheck?: boolean;
  wrap?: "hard" | "soft" | "off";
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
};

/**
 * Acta TextArea atom (Deliverable 3 D1 — split from <Field>).
 * Native textarea with explicit narrow attribute allowlist. No
 * inputProps escape hatch; if a surface needs more, the wrapper
 * spec changes.
 */
export function TextArea({
  name,
  label,
  value,
  onChange,
  hint,
  error,
  required = false,
  placeholder,
  rows = 4,
  autoComplete,
  autoFocus,
  minLength,
  maxLength,
  readOnly,
  spellCheck,
  wrap,
  disabled,
  onKeyDown,
}: Props) {
  const reactId = useId();
  const inputId = `${name}-${reactId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  const fieldClasses = [
    "field",
    "field--textarea",
    error ? "field--invalid" : null,
    required ? "field--required" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={fieldClasses}>
      <label htmlFor={inputId} className="field__label">
        {label}
      </label>
      <div className="field__wrap">
        <textarea
          id={inputId}
          name={name}
          className="field__control"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          autoComplete={autoComplete}
          // biome-ignore lint/a11y/noAutofocus: autoFocus is in the D1 allowlist for surfaces that opt in deliberately (e.g. open-modal text-area).
          autoFocus={autoFocus}
          minLength={minLength}
          maxLength={maxLength}
          readOnly={readOnly}
          spellCheck={spellCheck}
          wrap={wrap}
          disabled={disabled}
          required={required}
          aria-required={required || undefined}
          aria-describedby={hintId}
          aria-errormessage={errorId}
          aria-invalid={error ? true : undefined}
          onKeyDown={onKeyDown}
        />
      </div>
      {hint ? (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="field__error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
