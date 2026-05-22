"use client";

import type { ReactNode } from "react";
import {
  type HelpOutcome,
  VERIFICATION_RESULT_LABELS,
  type VerificationResult,
  type VerificationStatus,
} from "../../lib/types/assignment";

type VerificationKind = "verification";
type HelpKind = "help";
type PerQuestionKind = "perQuestion";

type Props =
  | {
      kind: VerificationKind;
      value: VerificationResult;
      children?: ReactNode;
    }
  | {
      kind: HelpKind;
      value: HelpOutcome;
      children?: ReactNode;
    }
  | {
      kind: PerQuestionKind;
      value: VerificationStatus;
      children?: ReactNode;
    };

const HELP_LABELS: Record<HelpOutcome, string> = {
  answered: "Answered",
  refused: "Refused",
  redirected: "Redirected",
};

const PER_Q_LABELS: Record<VerificationStatus, string> = {
  sufficient: "Sufficient",
  partial: "Partial",
  insufficient: "Insufficient",
};

function variantClass(props: Props): string {
  return `status-pill--${props.value.replace("_", "-")}`;
}

function displayLabel(props: Props): string {
  switch (props.kind) {
    case "verification":
      return VERIFICATION_RESULT_LABELS[props.value];
    case "help":
      return HELP_LABELS[props.value];
    case "perQuestion":
      return PER_Q_LABELS[props.value];
  }
}

/**
 * Acta StatusPill atom (Deliverable 2 §3.6).
 * Maps a status enum to its chip variant; label is derived unless
 * children are passed explicitly. ARIA: role=status + semantic label.
 */
export function StatusPill(props: Props) {
  const label = props.children ?? displayLabel(props);
  const classes = ["status-pill", variantClass(props)].join(" ");
  const ariaLabel = `${props.kind === "perQuestion" ? "Per-question" : props.kind}: ${displayLabel(props)}`;

  // <output> carries an implicit role="status" — preferred over a span+role.
  return (
    <output className={classes} aria-label={ariaLabel}>
      {label}
    </output>
  );
}
