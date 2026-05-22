"use client";

import { useState } from "react";
import type {
  AiHelpPolicy,
  CreateAssignmentInput,
  VerificationMode,
} from "../lib/types/assignment";
import { AiHelpPolicyControl } from "./ai-help-policy";
import { VerificationModeSelector } from "./verification-mode-selector";

type Props = {
  initial?: Partial<CreateAssignmentInput>;
  submitLabel: string;
  onSubmit: (input: CreateAssignmentInput) => Promise<void>;
  onCancel?: () => void;
  note?: string;
};

const DEFAULT_AI_HELP: AiHelpPolicy = {
  conceptExplanation: true,
  hints: true,
  examples: true,
  debuggingGuidance: false,
  restrictFinalAnswer: true,
};

const DEFAULT_MODE: VerificationMode = "score";

export function AssignmentForm({ initial, submitLabel, onSubmit, onCancel, note }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");
  const [rubric, setRubric] = useState(initial?.rubric ?? "");
  const [aiHelp, setAiHelp] = useState<AiHelpPolicy>(initial?.aiHelp ?? DEFAULT_AI_HELP);
  // D-047: master AI-help toggle. Defaults to true. When false, all per-type
  // checkboxes are still kept but visually disabled so the instructor sees what
  // they would have allowed if the master toggle flipped back on.
  const [aiHelpEnabled, setAiHelpEnabled] = useState<boolean>(initial?.aiHelpEnabled ?? true);
  const [mode, setMode] = useState<VerificationMode>(initial?.verificationMode ?? DEFAULT_MODE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleTrimmed = title.trim();
  const instructionsTrimmed = instructions.trim();
  const canSave = titleTrimmed.length > 0 && instructionsTrimmed.length > 0 && !saving;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        title: titleTrimmed,
        instructions: instructionsTrimmed,
        rubric: rubric.trim() === "" ? null : rubric,
        aiHelp,
        aiHelpEnabled,
        verificationMode: mode,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="assignment-form">
      {/* Sprint B: verification mode is the product thesis — promoted to hero position. */}
      <section className="placeholder-card placeholder-card--hero">
        <h2>Verification mode</h2>
        <p className="section-helper">How Acta&apos;s signal affects credit for this assignment.</p>
        <VerificationModeSelector value={mode} onChange={setMode} />
      </section>

      <section className="placeholder-card">
        <h2>Basics</h2>
        <label className="field">
          <span>Title</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
          />
        </label>
        <label className="field">
          <span>Instructions</span>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={6}
            maxLength={20_000}
            required
          />
        </label>
      </section>

      <section className="placeholder-card">
        <h2>Rubric (optional)</h2>
        <label className="field">
          <textarea
            value={rubric ?? ""}
            onChange={(e) => setRubric(e.target.value)}
            rows={4}
            maxLength={20_000}
            placeholder="Optional grading criteria or policy text"
          />
        </label>
      </section>

      <section className="placeholder-card">
        <h2>AI help policy</h2>

        {/* D-047: master toggle. Sits above the per-type checkboxes. */}
        <fieldset className="ai-help-master">
          <legend>Student AI help</legend>
          <label className="ai-help-master__option">
            <input
              type="radio"
              name="ai-help-enabled"
              checked={aiHelpEnabled}
              onChange={() => setAiHelpEnabled(true)}
            />
            <span>
              <strong>Enabled</strong>
              <span className="ai-help-master__hint">
                Students can use guided help within the rules below.
              </span>
            </span>
          </label>
          <label className="ai-help-master__option">
            <input
              type="radio"
              name="ai-help-enabled"
              checked={!aiHelpEnabled}
              onChange={() => setAiHelpEnabled(false)}
            />
            <span>
              <strong>Disabled</strong>
              <span className="ai-help-master__hint">
                Students cannot use the chat for this assignment.
              </span>
            </span>
          </label>
        </fieldset>

        <p style={{ color: "var(--muted)", marginTop: 8 }}>
          {aiHelpEnabled
            ? "Pick which AI help types students may use."
            : "AI help is disabled — these per-type rules are inactive."}
        </p>
        <div
          className={aiHelpEnabled ? undefined : "ai-help-inactive"}
          aria-disabled={!aiHelpEnabled}
        >
          <AiHelpPolicyControl value={aiHelp} onChange={setAiHelp} disabled={!aiHelpEnabled} />
        </div>
      </section>

      {note ? <p className="form-note">{note}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <div className="form-footer">
        {onCancel ? (
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
        <button type="submit" className="btn btn--primary" disabled={!canSave}>
          {saving ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
