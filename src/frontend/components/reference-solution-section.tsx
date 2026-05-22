"use client";

import { useEffect, useState } from "react";
import {
  getReferenceSolution,
  listReferenceSolutionVersions,
  saveReferenceSolution,
} from "../lib/api-client";
import type { CreateReferenceSolutionInput, ReferenceSolution } from "../lib/types/assignment";

type Props = {
  assignmentId: string;
};

type DraftState = {
  expectedSolution: string;
  keyConcepts: string;
  requiredReasoningSteps: string;
  commonMistakes: string;
  correctnessCriteria: string;
  optionalNotes: string;
};

const EMPTY_DRAFT: DraftState = {
  expectedSolution: "",
  keyConcepts: "",
  requiredReasoningSteps: "",
  commonMistakes: "",
  correctnessCriteria: "",
  optionalNotes: "",
};

function shortHash(hash: string): string {
  return `${hash.slice(0, 8)}…`;
}

function linesToList(s: string): string[] {
  return s
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

function listToLines(list: string[]): string {
  return list.join("\n");
}

function draftFromVersion(v: ReferenceSolution): DraftState {
  return {
    expectedSolution: v.expectedSolution,
    keyConcepts: listToLines(v.keyConcepts),
    requiredReasoningSteps: listToLines(v.requiredReasoningSteps),
    commonMistakes: listToLines(v.commonMistakes),
    correctnessCriteria: v.correctnessCriteria,
    optionalNotes: v.optionalNotes ?? "",
  };
}

function buildInput(draft: DraftState): CreateReferenceSolutionInput {
  const opt = draft.optionalNotes.trim();
  return {
    expectedSolution: draft.expectedSolution,
    keyConcepts: linesToList(draft.keyConcepts),
    requiredReasoningSteps: linesToList(draft.requiredReasoningSteps),
    commonMistakes: linesToList(draft.commonMistakes),
    correctnessCriteria: draft.correctnessCriteria,
    optionalNotes: opt.length === 0 ? null : opt,
  };
}

export function ReferenceSolutionSection({ assignmentId }: Props) {
  const [current, setCurrent] = useState<ReferenceSolution | null>(null);
  const [versions, setVersions] = useState<ReferenceSolution[]>([]);
  const [viewing, setViewing] = useState<ReferenceSolution | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getReferenceSolution(assignmentId),
      listReferenceSolutionVersions(assignmentId).catch(() => []),
    ])
      .then(([cur, vs]) => {
        if (cancelled) return;
        setCurrent(cur);
        setVersions(vs);
        setViewing(cur);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [assignmentId]);

  function startCreate() {
    setDraft(EMPTY_DRAFT);
    setEditing(true);
    setError(null);
  }

  function startEdit() {
    if (!current) return;
    setDraft(draftFromVersion(current));
    setEditing(true);
    setError(null);
  }

  function cancelEdit() {
    setEditing(false);
    setError(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const saved = await saveReferenceSolution(assignmentId, buildInput(draft));
      setCurrent(saved);
      setVersions((prev) => [saved, ...prev]);
      setViewing(saved);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }

  if (loading) return <p style={{ color: "var(--muted)" }}>Loading reference solution…</p>;

  if (editing) {
    return (
      <form onSubmit={save} className="reference-solution-form">
        <p style={{ color: "var(--muted)", fontSize: 13 }}>
          Saving creates a new immutable version. Prior versions remain on record.
        </p>
        <label className="field">
          <span>Expected solution</span>
          <textarea
            value={draft.expectedSolution}
            onChange={(e) => setDraft((d) => ({ ...d, expectedSolution: e.target.value }))}
            rows={8}
            maxLength={50_000}
            placeholder="Outline of the ideal answer or solution path."
            disabled={pending}
            required
          />
        </label>
        <label className="field">
          <span>Key concepts</span>
          <textarea
            value={draft.keyConcepts}
            onChange={(e) => setDraft((d) => ({ ...d, keyConcepts: e.target.value }))}
            rows={4}
            placeholder={"One concept per line.\nUp to 50 entries, each ≤ 200 chars."}
            disabled={pending}
          />
        </label>
        <label className="field">
          <span>Required reasoning steps</span>
          <textarea
            value={draft.requiredReasoningSteps}
            onChange={(e) => setDraft((d) => ({ ...d, requiredReasoningSteps: e.target.value }))}
            rows={4}
            placeholder={"One step per line.\nUp to 50 entries, each ≤ 400 chars."}
            disabled={pending}
          />
        </label>
        <label className="field">
          <span>Common mistakes</span>
          <textarea
            value={draft.commonMistakes}
            onChange={(e) => setDraft((d) => ({ ...d, commonMistakes: e.target.value }))}
            rows={4}
            placeholder="One mistake per line."
            disabled={pending}
          />
        </label>
        <label className="field">
          <span>Correctness criteria</span>
          <textarea
            value={draft.correctnessCriteria}
            onChange={(e) => setDraft((d) => ({ ...d, correctnessCriteria: e.target.value }))}
            rows={5}
            maxLength={10_000}
            placeholder="What makes the answer correct, partially correct, or incorrect."
            disabled={pending}
            required
          />
        </label>
        <label className="field">
          <span>Optional notes (instructor-only)</span>
          <textarea
            value={draft.optionalNotes}
            onChange={(e) => setDraft((d) => ({ ...d, optionalNotes: e.target.value }))}
            rows={3}
            maxLength={10_000}
            placeholder="Internal notes for evaluation. Not shown to students."
            disabled={pending}
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="form-footer">
          <button type="button" className="btn btn--ghost" onClick={cancelEdit}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={pending}>
            {pending ? "Saving…" : "Save new version"}
          </button>
        </div>
      </form>
    );
  }

  if (!current) {
    return (
      <div>
        {error ? <p className="form-error">{error}</p> : null}
        <p style={{ color: "var(--muted)" }}>
          Adds trusted context for concept-check generation and grading.
        </p>
        <button type="button" className="btn btn--primary" onClick={startCreate}>
          Add Instructor Solution Guide
        </button>
      </div>
    );
  }

  const v = viewing ?? current;
  const isCurrent = v.version === current.version;

  return (
    <div className="reference-solution-display">
      <div className="reference-solution__header">
        <span className="placeholder-tag">
          v{v.version}
          {isCurrent ? " current" : " archived"}
        </span>
        <span style={{ color: "var(--muted)" }} title={v.referenceHash}>
          referenceHash {shortHash(v.referenceHash)}
        </span>
        <span style={{ color: "var(--muted)" }}>{new Date(v.createdAt).toLocaleString()}</span>
        {isCurrent ? (
          <button type="button" className="btn btn--primary" onClick={startEdit}>
            Edit Guide (creates new version)
          </button>
        ) : (
          <button type="button" className="btn btn--ghost" onClick={() => setViewing(current)}>
            View current
          </button>
        )}
      </div>

      <details className="disclosure">
        <summary>
          Expected solution
          <span className="disclosure__hint">ideal answer outline</span>
        </summary>
        <div className="disclosure__body">
          <pre className="prewrap">{v.expectedSolution}</pre>
        </div>
      </details>

      {v.keyConcepts.length > 0 ? (
        <details className="disclosure">
          <summary>
            Key concepts
            <span className="disclosure__hint">{v.keyConcepts.length}</span>
          </summary>
          <div className="disclosure__body">
            <ol className="reference-solution__list">
              {v.keyConcepts.map((c, i) => (
                <li key={`kc-${v.id}-${i}`}>{c}</li>
              ))}
            </ol>
          </div>
        </details>
      ) : null}

      {v.requiredReasoningSteps.length > 0 ? (
        <details className="disclosure">
          <summary>
            Required reasoning steps
            <span className="disclosure__hint">{v.requiredReasoningSteps.length}</span>
          </summary>
          <div className="disclosure__body">
            <ol className="reference-solution__list">
              {v.requiredReasoningSteps.map((c, i) => (
                <li key={`rrs-${v.id}-${i}`}>{c}</li>
              ))}
            </ol>
          </div>
        </details>
      ) : null}

      {v.commonMistakes.length > 0 ? (
        <details className="disclosure">
          <summary>
            Common mistakes
            <span className="disclosure__hint">{v.commonMistakes.length}</span>
          </summary>
          <div className="disclosure__body">
            <ol className="reference-solution__list">
              {v.commonMistakes.map((c, i) => (
                <li key={`cm-${v.id}-${i}`}>{c}</li>
              ))}
            </ol>
          </div>
        </details>
      ) : null}

      <details className="disclosure">
        <summary>Correctness criteria</summary>
        <div className="disclosure__body">
          <pre className="prewrap">{v.correctnessCriteria}</pre>
        </div>
      </details>

      {v.optionalNotes ? (
        <details className="disclosure">
          <summary>Instructor-only notes</summary>
          <div className="disclosure__body">
            <pre className="prewrap">{v.optionalNotes}</pre>
          </div>
        </details>
      ) : null}

      {versions.length > 1 ? (
        <section>
          <h3>Version history</h3>
          <ul className="reference-solution__history">
            {versions.map((ver) => (
              <li key={ver.id}>
                <button
                  type="button"
                  className="reference-solution__history-link"
                  onClick={() => setViewing(ver)}
                >
                  v{ver.version}
                </button>
                {" — "}
                <span style={{ color: "var(--muted)" }}>
                  {new Date(ver.createdAt).toLocaleString()}
                </span>
                {ver.version === current.version ? (
                  <span className="placeholder-tag" style={{ marginLeft: 8 }}>
                    current
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
