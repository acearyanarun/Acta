"use client";

import type { ReactNode } from "react";

type ButtonVariant = "primary" | "ghost" | "danger";
type ButtonSize = "md" | "lg";

type Props = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  /** Renders the button in a loading state — disabled + "…" label + aria-busy. */
  loading?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Forwarded as `name` to the native button. */
  name?: string;
  /** Forwarded as `value` to the native button. */
  value?: string;
  /** ARIA label override; falls back to children when string-only. */
  ariaLabel?: string;
  /** ARIA-pressed for buttons used as toggles (Pill prefers <Pill> instead). */
  ariaPressed?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * Acta Button atom (Deliverable 2 §3.1).
 * State-bearing wrapper around the native <button>. Variants are visual
 * only; bracket framing (e.g. "[ SUBMIT ]") is decorative and passed in
 * via children, NOT injected by the wrapper.
 */
export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  loading = false,
  onClick,
  name,
  value,
  ariaLabel,
  ariaPressed,
  className,
  children,
}: Props) {
  const classes = ["btn", `btn--${variant}`, size === "lg" ? "btn--lg" : null, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      onClick={onClick}
      name={name}
      value={value}
    >
      {loading ? "…" : children}
    </button>
  );
}
