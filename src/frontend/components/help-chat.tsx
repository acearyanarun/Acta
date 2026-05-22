"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type PostHelpError, postHelp } from "../lib/api-client";
import type {
  Assignment,
  ChatMessage,
  HelpRequestType,
  HelpResponse,
} from "../lib/types/assignment";
import { BrainAssistant, type BrainAssistantState } from "./brain-assistant";
import { HelpRequestTypePicker } from "./help-request-type-picker";
import { VoiceChatInput, type VoiceChatInputState } from "./voice-chat-input";

type Props = {
  assignment: Assignment;
};

type ServerTurn = {
  policyVersionId: string;
  policyVersion: number;
  outcome: HelpResponse["outcome"];
  outcomeReason?: string;
  provider: HelpResponse["provider"];
};

function isSpeechSynthesisAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.speechSynthesis !== "undefined" &&
    typeof window.SpeechSynthesisUtterance !== "undefined"
  );
}

export function HelpChat({ assignment }: Props) {
  const aiHelpEnabled = assignment.policy.aiHelpEnabled !== false;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [requestType, setRequestType] = useState<HelpRequestType>("general");
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [helpTypeError, setHelpTypeError] = useState<string | null>(null);
  const [turns, setTurns] = useState<Record<number, ServerTurn>>({});
  const [pinnedPolicyVersionId, setPinnedPolicyVersionId] = useState<string | null>(null);
  const [drift, setDrift] = useState<{ from: number; to: number } | null>(null);

  // Brain TA visual state, driven by chat lifecycle + voice input + speech.
  const [brainState, setBrainState] = useState<BrainAssistantState>(
    aiHelpEnabled ? "idle" : "disabled",
  );

  // Speech-output toggle. Default off. Hidden when speechSynthesis isn't available.
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speakReplies, setSpeakReplies] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setSpeechSupported(isSpeechSynthesisAvailable());
  }, []);

  // If the instructor flips aiHelpEnabled off mid-session, mute the brain.
  useEffect(() => {
    if (!aiHelpEnabled) {
      setBrainState("disabled");
      if (isSpeechSynthesisAvailable()) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          /* ignore */
        }
      }
    } else {
      setBrainState((prev) => (prev === "disabled" ? "idle" : prev));
    }
  }, [aiHelpEnabled]);

  // Cancel any in-flight speech on unmount.
  useEffect(() => {
    return () => {
      if (isSpeechSynthesisAvailable()) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  const speakLatest = useCallback(
    (text: string) => {
      if (!speechSupported || !speakReplies || !text) return;
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        utteranceRef.current = u;
        u.onstart = () => setBrainState("speaking");
        u.onend = () => setBrainState("idle");
        u.onerror = () => setBrainState("idle");
        window.speechSynthesis.speak(u);
      } catch {
        /* ignore — fallback to silent display */
      }
    },
    [speechSupported, speakReplies],
  );

  // When user toggles speak-replies OFF, cancel any in-flight utterance.
  useEffect(() => {
    if (!speakReplies && speechSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
      setBrainState((prev) => (prev === "speaking" ? "idle" : prev));
    }
  }, [speakReplies, speechSupported]);

  function handleVoiceState(s: VoiceChatInputState) {
    if (!aiHelpEnabled) return;
    if (s === "recording") setBrainState("listening");
    else if (s === "transcribing" || s === "stopping") setBrainState("transcribing");
    else if (s === "error") {
      setBrainState("error");
      setTimeout(() => setBrainState((prev) => (prev === "error" ? "idle" : prev)), 1500);
    } else if (s === "done" || s === "idle") {
      // Return to idle once transcript is in the input.
      setBrainState((prev) => (prev === "listening" || prev === "transcribing" ? "idle" : prev));
    }
  }

  function handleVoiceTranscript(transcript: string) {
    // Append into the input so the student can edit before sending.
    setInput((current) => {
      if (current.trim().length === 0) return transcript;
      return `${current.trimEnd()} ${transcript}`;
    });
  }

  async function send() {
    const text = input.trim();
    if (!text || pending || !aiHelpEnabled) return;
    setError(null);
    setHelpTypeError(null);

    const nextMessages: ChatMessage[] = [...messages, { role: "student", content: text }];
    setMessages(nextMessages);
    setInput("");
    setPending(true);
    setBrainState("thinking");

    try {
      const res = await postHelp(assignment.id, nextMessages, requestType);
      const assistantIndex = nextMessages.length;
      const withAssistant: ChatMessage[] = [
        ...nextMessages,
        { role: "assistant", content: res.assistantMessage.content },
      ];
      setMessages(withAssistant);
      setTurns((prev) => ({
        ...prev,
        [assistantIndex]: {
          policyVersionId: res.policyVersionId,
          policyVersion: res.policyVersion,
          outcome: res.outcome,
          ...(res.outcomeReason ? { outcomeReason: res.outcomeReason } : {}),
          provider: res.provider,
        },
      }));
      if (pinnedPolicyVersionId === null) {
        setPinnedPolicyVersionId(res.policyVersionId);
      } else if (res.policyVersionId !== pinnedPolicyVersionId && !drift) {
        const prevTurnVersion =
          Object.values(turns)
            .map((t) => t.policyVersion)
            .pop() ?? assignment.currentVersion;
        setDrift({ from: prevTurnVersion, to: res.policyVersion });
        setPinnedPolicyVersionId(res.policyVersionId);
      }
      setBrainState("responding");
      // If speech is enabled, the utterance.onstart will move us to "speaking".
      // Otherwise drop back to idle after a short tick so the pulse is visible.
      if (speakReplies && speechSupported) {
        speakLatest(res.assistantMessage.content);
      } else {
        setTimeout(() => setBrainState((prev) => (prev === "responding" ? "idle" : prev)), 1200);
      }
    } catch (err) {
      setMessages(messages);
      const e = err as PostHelpError | Error;
      if ("error" in e && e.error === "help_type_not_allowed") {
        setHelpTypeError(
          `The instructor's current policy does not allow "${requestType}" help. Pick another help type.`,
        );
      } else {
        setError(e instanceof Error ? e.message : (e as PostHelpError).message);
      }
      setBrainState("error");
      setTimeout(() => setBrainState((prev) => (prev === "error" ? "idle" : prev)), 1500);
    } finally {
      setPending(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="help-chat" data-testid="help-chat">
      <div className="help-chat__header">
        <BrainAssistant state={brainState} ariaLabel="Acta TA" style={{ width: 64, height: 64 }} />
        <div className="help-chat__header-body">
          <div className="help-chat__title">Acta TA</div>
          <p className="help-chat__subtitle">
            TA can guide you, but it will not give final answers when restricted.
          </p>
        </div>
        {speechSupported ? (
          <label className="help-chat__speak-toggle">
            <input
              type="checkbox"
              checked={speakReplies}
              onChange={(e) => setSpeakReplies(e.target.checked)}
              disabled={!aiHelpEnabled}
              data-testid="speak-replies-toggle"
            />
            <span>Speak replies aloud</span>
          </label>
        ) : null}
      </div>

      {drift ? (
        <div className="historical-banner">
          The instructor updated the assignment policy mid-conversation. The current policy is now v
          {drift.to} (was v{drift.from}). Replies follow the new policy.
        </div>
      ) : null}

      {!aiHelpEnabled ? (
        <p className="form-error" data-testid="ai-help-disabled-notice">
          AI guided help is disabled for this assignment.
        </p>
      ) : null}

      <HelpRequestTypePicker
        policy={assignment.policy.aiHelp}
        value={requestType}
        onChange={setRequestType}
      />

      {helpTypeError ? <p className="form-error">{helpTypeError}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <div className="chat-thread">
        {messages.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>Ask the TA for guidance.</p>
        ) : null}
        {messages.map((m, i) => {
          const turn = turns[i];
          return (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: chat is append-only; index is stable
              key={i}
              className={`chat-bubble chat-bubble--${m.role}${
                turn?.outcome && turn.outcome !== "answered" ? ` chat-bubble--${turn.outcome}` : ""
              }`}
            >
              <div className="chat-bubble__role">
                {m.role === "student" ? "You" : "Acta"}
                {turn?.outcome && turn.outcome !== "answered" ? (
                  <span className="placeholder-tag" style={{ marginLeft: 8 }}>
                    {turn.outcome}
                  </span>
                ) : null}
              </div>
              <div className="chat-bubble__content">{m.content}</div>
              {turn?.outcomeReason ? (
                <div className="chat-bubble__reason">{turn.outcomeReason}</div>
              ) : null}
              {turn ? (
                <div className="chat-bubble__provenance">
                  policy v{turn.policyVersion} · provider {turn.provider}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="chat-input">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={
            aiHelpEnabled
              ? "Ask for guidance (Cmd/Ctrl+Enter to send)"
              : "AI guided help is disabled."
          }
          rows={3}
          maxLength={20_000}
          disabled={pending || !aiHelpEnabled}
          aria-label="Message the TA"
        />
        <div className="chat-input__actions">
          <VoiceChatInput
            assignmentId={assignment.id}
            disabled={pending || !aiHelpEnabled}
            onStateChange={handleVoiceState}
            onTranscript={handleVoiceTranscript}
            onError={(e) => setError(e.message)}
          />
          <button
            type="button"
            className="btn btn--primary"
            onClick={send}
            disabled={pending || input.trim().length === 0 || !aiHelpEnabled}
          >
            {pending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
