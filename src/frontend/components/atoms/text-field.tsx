"use client";

import { useId } from "react";

type TextFieldType = "text" | "email" | "url" | "tel" | "search";

type Props = {
  name: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  hint?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  type?: TextFieldType;
  /** D1 allowlist — narrow native attrs that carry semantic value. */
  autoComplete?: string;
  autoFocus?: boolean;
  pattern?: string;
  inputMode?: "text" | "numeric" | "decimal" | "email" | "url" | "search" | "tel";
  min?: number;
  max?: number;
  step?: number;
  minLength?: number;
  maxLength?: number;
  readOnly?: boolean;
  spellCheck?: boolean;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

/**
 * Acta TextField atom (Deliverable 4 §A.1).
 * Single-line text input with the D1 narrow attribute allowlist.
 * Reuses the same `.field` / `.field__label` / `.field__wrap` /
 * `.field__control` cascade as `<TextArea>` — no element-specific
 * styling required for the input element. Cursor-blink pseudo-caret
 * scoped via :placeholder-shown per D3.
 *
 * No `inputProps` escape hatch. If a surface needs more, the wrapper
 * spec changes — not the surface.
 */
export function TextField({
  name,
  label,
  value,
  onChange,
  hint,
  error,
  required = false,
  placeholder,
  type = "text",
  autoComplete,
  autoFocus,
  pattern,
  inputMode,
  min,
  max,
  step,
  minLength,
  maxLength,
  readOnly,
  spellCheck,
  disabled,
  onKeyDown,
}: Props) {
  const reactId = useId();
  const inputId = `${name}-${reactId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  const fieldClasses = [
    "field",
    "field--text",
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
        <input
          id={inputId}
          name={name}
          type={type}
          className="field__control"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          // biome-ignore lint/a11y/noAutofocus: autoFocus is in the D1 allowlist for surfaces that opt in deliberately.
          autoFocus={autoFocus}
          pattern={pattern}
          inputMode={inputMode}
          min={min}
          max={max}
          step={step}
          minLength={minLength}
          maxLength={maxLength}
          readOnly={readOnly}
          spellCheck={spellCheck}
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
