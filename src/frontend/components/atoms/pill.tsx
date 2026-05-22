"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type PillProps = {
  /** "span" (static label, default) | "button" (toggle) | "link" (navigation). */
  as?: "span" | "button" | "link";
  /** When `as="button"` and active, sets aria-pressed + .pill--active. */
  active?: boolean;
  /** When `as="link"`. */
  href?: string;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
  className?: string;
  children: ReactNode;
};

/**
 * Acta Pill atom (Deliverable 2 §3.5).
 * Polymorphic — renders as span/button/link based on `as`.
 * For status enums use <StatusPill> instead.
 */
export function Pill({
  as = "span",
  active = false,
  href,
  disabled = false,
  onClick,
  title,
  className,
  children,
}: PillProps) {
  const classes = [
    "pill",
    active ? "pill--active" : null,
    disabled ? "pill--disabled" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (as === "button") {
    return (
      <button
        type="button"
        className={classes}
        aria-pressed={active}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        onClick={onClick}
        title={title}
      >
        {children}
      </button>
    );
  }

  if (as === "link" && href) {
    return (
      <Link href={href} className={classes} title={title}>
        {children}
      </Link>
    );
  }

  return (
    <span className={classes} title={title}>
      {children}
    </span>
  );
}
