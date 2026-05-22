"use client";

import type { CSSProperties } from "react";

/**
 * D-048 / Sprint-brain: realistic neural-glow brain visual that reacts to
 * the system state. Pure CSS + SVG — no image dependency, no Lottie, no
 * Canvas, no new npm package. Respects `prefers-reduced-motion` (animations
 * collapse to static glow).
 *
 * To swap in a real image asset later, drop a PNG/SVG at
 * `src/frontend/public/brain-assistant.png` and pass
 * `<BrainAssistant imageSrc="/brain-assistant.png" state={...} />` — the
 * component will overlay the same animated glow underneath.
 */

export type BrainAssistantState =
  | "idle"
  | "listening"
  | "transcribing"
  | "thinking"
  | "responding"
  | "speaking"
  | "disabled"
  | "error";

type Props = {
  state: BrainAssistantState;
  /** Optional image override. When set, renders as a background under the glow. */
  imageSrc?: string;
  /** Optional inline-style override for placement / size. */
  style?: CSSProperties;
  /** Optional label override for assistive tech. */
  ariaLabel?: string;
};

const STATE_LABEL: Record<BrainAssistantState, string> = {
  idle: "Idle",
  listening: "Listening",
  transcribing: "Transcribing",
  thinking: "Thinking",
  responding: "Responding",
  speaking: "Speaking",
  disabled: "Voice unavailable",
  error: "Error",
};

export function BrainAssistant({ state, imageSrc, style, ariaLabel }: Props) {
  const label = ariaLabel ?? "Acta AI assistant visual";
  return (
    <div
      className={`brain-assistant brain-assistant--${state}`}
      style={style}
      role="img"
      aria-label={`${label} — ${STATE_LABEL[state]}`}
    >
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="brain-assistant__image" src={imageSrc} alt="" />
      ) : (
        <svg
          className="brain-assistant__svg"
          viewBox="0 0 200 200"
          aria-hidden="true"
          focusable="false"
        >
          {/* Outer halo — muted neutral, tuned for vellum (no blue/violet). */}
          <defs>
            <radialGradient id="brain-halo" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor="rgba(26, 24, 20, 0.10)" />
              <stop offset="55%" stopColor="rgba(26, 24, 20, 0.04)" />
              <stop offset="100%" stopColor="rgba(26, 24, 20, 0)" />
            </radialGradient>
            <radialGradient id="brain-core" cx="50%" cy="50%" r="35%">
              <stop offset="0%" stopColor="rgba(26, 24, 20, 0.18)" />
              <stop offset="100%" stopColor="rgba(26, 24, 20, 0)" />
            </radialGradient>
          </defs>
          {/* Halo */}
          <circle
            className="brain-assistant__halo"
            cx="100"
            cy="100"
            r="92"
            fill="url(#brain-halo)"
          />
          {/* Brain silhouette — simplified two-hemisphere shape with sulci accents */}
          <g
            className="brain-assistant__body"
            fill="none"
            stroke="rgba(26, 24, 20, 0.45)"
            strokeWidth="1.2"
          >
            <path d="M50 105 C 50 60, 100 50, 100 80 C 100 50, 150 60, 150 105 C 150 145, 115 160, 100 150 C 85 160, 50 145, 50 105 Z" />
            {/* Inner sulci */}
            <path d="M65 90 C 75 80, 90 80, 100 95" />
            <path d="M100 95 C 110 80, 125 80, 135 90" />
            <path d="M70 115 C 85 125, 100 120, 100 130" />
            <path d="M100 130 C 100 120, 115 125, 130 115" />
            <path d="M82 100 C 92 105, 100 105, 100 115" />
            <path d="M100 115 C 100 105, 108 105, 118 100" />
            {/* Brain-stem hint */}
            <path d="M95 150 C 95 165, 105 165, 105 150" />
          </g>
          {/* Neural-spark points (animated via CSS) */}
          <g className="brain-assistant__sparks" fill="rgba(26, 24, 20, 0.55)">
            <circle cx="78" cy="92" r="1.8" />
            <circle cx="122" cy="92" r="1.8" />
            <circle cx="100" cy="108" r="1.8" />
            <circle cx="92" cy="120" r="1.5" />
            <circle cx="115" cy="125" r="1.5" />
            <circle cx="68" cy="110" r="1.3" />
            <circle cx="132" cy="110" r="1.3" />
          </g>
          {/* Center core glow */}
          <circle
            className="brain-assistant__core"
            cx="100"
            cy="100"
            r="55"
            fill="url(#brain-core)"
          />
        </svg>
      )}
    </div>
  );
}
