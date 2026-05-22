"use client";

import { forwardRef } from "react";
import type { ChatMessage, HelpOutcome, HelpResponse } from "../../lib/types/assignment";

export type TaLabTurn = {
  policyVersionId: string;
  policyVersion: number;
  outcome: HelpOutcome;
  outcomeReason?: string;
  provider: HelpResponse["provider"];
};

type Props = {
  messages: ChatMessage[];
  turns: Record<number, TaLabTurn>;
  error: string | null;
};

export const TaLabTranscript = forwardRef<HTMLDivElement, Props>(function TaLabTranscript(
  { messages, turns, error },
  ref,
) {
  return (
    <section className="ta-lab__transcript" aria-label="Conversation transcript" ref={ref}>
      {messages.length === 0 ? (
        <p className="ta-lab__transcript-empty">
          {"> Ask the TA for guidance. Type below, or use the mic."}
        </p>
      ) : null}
      {messages.map((m, i) => {
        const turn = turns[i];
        const role = m.role === "student" ? "YOU" : "TA";
        const refusal = turn?.outcome && turn.outcome !== "answered";
        return (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: append-only chat
            key={i}
            className={`ta-lab__row ta-lab__row--${m.role}${refusal ? " ta-lab__row--refusal" : ""}`}
          >
            <span className="ta-lab__row-prefix">
              {m.role === "student" ? ">" : "◆"} {role}
            </span>
            <div className="ta-lab__row-body">
              <div className="ta-lab__row-content">{m.content}</div>
              {turn?.outcomeReason ? (
                <div className="ta-lab__row-reason">{turn.outcomeReason}</div>
              ) : null}
              {turn ? (
                <div className="ta-lab__row-meta">
                  {refusal ? <span className="ta-lab__refusal-tag">{turn.outcome}</span> : null}
                  <span>policy v{turn.policyVersion}</span>
                  <span>provider {turn.provider}</span>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
      {error ? <div className="ta-lab__row ta-lab__row--error">{error}</div> : null}
    </section>
  );
});
