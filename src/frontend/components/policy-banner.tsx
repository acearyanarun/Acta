import { AI_HELP_LABELS, type AiHelpPolicy } from "../lib/types/assignment";

type Props = {
  policy: AiHelpPolicy;
  /**
   * D-047 master toggle. When false, all per-type rules are inactive and the
   * banner renders a single prominent "AI help disabled" row instead.
   * Optional for backwards compatibility — defaults to true.
   */
  aiHelpEnabled?: boolean;
};

const SOFT_KEYS: (keyof AiHelpPolicy)[] = [
  "conceptExplanation",
  "hints",
  "examples",
  "debuggingGuidance",
];

export function PolicyBanner({ policy, aiHelpEnabled = true }: Props) {
  if (!aiHelpEnabled) {
    return (
      <div className="policy-banner policy-banner--disabled">
        <div className="policy-banner__row">
          <strong>AI help:</strong>
          <span>Disabled for this assignment</span>
          <span className="ai-help-row__pill">Off</span>
        </div>
      </div>
    );
  }
  const allowed = SOFT_KEYS.filter((k) => policy[k]).map((k) => AI_HELP_LABELS[k].label);
  const notAllowed = SOFT_KEYS.filter((k) => !policy[k]).map((k) => AI_HELP_LABELS[k].label);
  return (
    <div className="policy-banner">
      <div className="policy-banner__row">
        <strong>AI help allowed:</strong>
        <span>{allowed.length === 0 ? "(none)" : allowed.join(", ")}</span>
      </div>
      {notAllowed.length > 0 ? (
        <div className="policy-banner__row policy-banner__row--muted">
          <strong>Not allowed:</strong>
          <span>{notAllowed.join(", ")}</span>
        </div>
      ) : null}
      <div className="policy-banner__row policy-banner__row--hard">
        <strong>Restrict final answer:</strong>
        <span>{policy.restrictFinalAnswer ? "Enabled" : "Disabled"}</span>
        {policy.restrictFinalAnswer ? <span className="ai-help-row__pill">Hard rule</span> : null}
      </div>
    </div>
  );
}
