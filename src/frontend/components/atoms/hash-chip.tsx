"use client";

import { useEffect, useRef } from "react";

type Props = {
  /** Full SHA-256 (or any opaque hash) — surfaced verbatim via the title attribute. */
  hash: string;
  /** Chars to show before truncating. Default 7. */
  prefix?: number;
  /** Optional eyebrow label rendered before the chip (e.g. "policy"). */
  label?: string;
};

/**
 * Acta HashChip atom (Deliverable 2 §3.7).
 * Mount-flash animation: on first render the chip briefly fills with
 * --signal, then fades over 400ms ease-linear back to baseline. Reinforces
 * "this hash was just signed." Reduced motion: skips the flash via the
 * tokens.css reduced-motion override (transitions collapse to instant).
 */
export function HashChip({ hash, prefix = 7, label }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.add("hash-chip--flash");
    const timer = window.setTimeout(() => {
      el.classList.remove("hash-chip--flash");
    }, 420);
    return () => window.clearTimeout(timer);
  }, []);

  const truncated = `#${hash.slice(0, prefix)}`;

  return (
    <span ref={ref} className="hash-chip" title={hash}>
      {label ? <span className="hash-chip__label">{label}</span> : null}
      <span className="hash-chip__value">{truncated}</span>
    </span>
  );
}
