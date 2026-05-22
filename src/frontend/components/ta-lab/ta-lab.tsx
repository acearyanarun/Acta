"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { type PostHelpError, getStudentAssignment, postHelp } from "../../lib/api-client";
import { DEMO_TA_LAB_TRANSCRIPT, shouldLoadDemoFixtures } from "../../lib/demo-fixtures";
import type {
  Assignment,
  ChatMessage,
  HelpRequestType,
  HelpResponse,
} from "../../lib/types/assignment";
import type { BrainAssistantState } from "../brain-assistant";
import type { VoiceChatInputState } from "../voice-chat-input";
import { TaLabInputDock } from "./ta-lab-input-dock";
import { TaLabStage } from "./ta-lab-stage";
import { TaLabTopbar } from "./ta-lab-topbar";
import { TaLabTranscript, type TaLabTurn } from "./ta-lab-transcript";
import { type VoiceSettings, VoiceSettingsPanel } from "./voice-settings-panel";

function isSpeechSynthesisAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.speechSynthesis !== "undefined" &&
    typeof window.SpeechSynthesisUtterance !== "undefined"
  );
}

type Props = { assignmentId: string };

export function TaLab({ assignmentId }: Props) {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [requestType, setRequestType] = useState<HelpRequestType>("general");
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [turns, setTurns] = useState<Record<number, TaLabTurn>>({});
  const [turnError, setTurnError] = useState<string | null>(null);

  const [brainState, setBrainState] = useState<BrainAssistantState>("idle");
  const [voiceSettingsOpen, setVoiceSettingsOpen] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speakReplies, setSpeakReplies] = useState(false);
  const [voice, setVoice] = useState<VoiceSettings>({
    voiceURI: null,
    speed: 1,
    volume: 1,
  });

  useEffect(() => {
    setSpeechSupported(isSpeechSynthesisAvailable());
    // FS2 demo fixture: load hand-written transcript when ?demo=1 or the
    // NEXT_PUBLIC_DEMO_FIXTURES build flag is on. No-op in production.
    if (shouldLoadDemoFixtures()) {
      setMessages(DEMO_TA_LAB_TRANSCRIPT.messages);
      setTurns(DEMO_TA_LAB_TRANSCRIPT.turns);
    }
  }, []);

  useEffect(() => {
    setLoadError(null);
    getStudentAssignment(assignmentId)
      .then(setAssignment)
      .catch((e) => setLoadError(e instanceof Error ? e.message : String(e)));
  }, [assignmentId]);

  const aiHelpEnabled = assignment?.policy.aiHelpEnabled !== false;

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
        u.rate = voice.speed;
        u.volume = voice.volume;
        if (voice.voiceURI) {
          const match = window.speechSynthesis
            .getVoices()
            .find((v) => v.voiceURI === voice.voiceURI);
          if (match) u.voice = match;
        }
        u.onstart = () => setBrainState("speaking");
        u.onend = () => setBrainState("idle");
        u.onerror = () => setBrainState("idle");
        window.speechSynthesis.speak(u);
      } catch {
        /* ignore */
      }
    },
    [speechSupported, speakReplies, voice.speed, voice.volume, voice.voiceURI],
  );

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
      window.setTimeout(() => setBrainState((prev) => (prev === "error" ? "idle" : prev)), 1500);
    } else if (s === "done" || s === "idle") {
      setBrainState((prev) => (prev === "listening" || prev === "transcribing" ? "idle" : prev));
    }
  }

  function appendTranscript(transcript: string) {
    setInput((current) => {
      if (current.trim().length === 0) return transcript;
      return `${current.trimEnd()} ${transcript}`;
    });
  }

  async function send() {
    if (!assignment) return;
    const text = input.trim();
    if (!text || pending || !aiHelpEnabled) return;
    setTurnError(null);

    const nextMessages: ChatMessage[] = [...messages, { role: "student", content: text }];
    setMessages(nextMessages);
    setInput("");
    setPending(true);
    setBrainState("thinking");

    try {
      const res = await postHelp(assignment.id, nextMessages, requestType);
      const assistantIndex = nextMessages.length;
      setMessages([...nextMessages, { role: "assistant", content: res.assistantMessage.content }]);
      const turn: TaLabTurn = {
        policyVersionId: res.policyVersionId,
        policyVersion: res.policyVersion,
        outcome: res.outcome,
        provider: res.provider,
      };
      if (res.outcomeReason) turn.outcomeReason = res.outcomeReason;
      setTurns((prev) => ({ ...prev, [assistantIndex]: turn }));
      setBrainState("responding");
      if (speakReplies && speechSupported) {
        speakLatest(res.assistantMessage.content);
      } else {
        window.setTimeout(
          () => setBrainState((prev) => (prev === "responding" ? "idle" : prev)),
          1200,
        );
      }
    } catch (err) {
      setMessages(messages);
      const e = err as PostHelpError | Error;
      if ("error" in e && e.error === "help_type_not_allowed") {
        setTurnError(
          `Instructor policy does not allow "${requestType}" help here. Pick another type.`,
        );
      } else {
        setTurnError(e instanceof Error ? e.message : (e as PostHelpError).message);
      }
      setBrainState("error");
      window.setTimeout(() => setBrainState((prev) => (prev === "error" ? "idle" : prev)), 1500);
    } finally {
      setPending(false);
    }
  }

  function clearTranscript() {
    setMessages([]);
    setTurns({});
    setTurnError(null);
    setBrainState((prev) => (prev === "disabled" ? "disabled" : "idle"));
  }

  // Auto-scroll the transcript when new messages arrive.
  const transcriptRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = transcriptRef.current;
    if (el && messages.length > 0) {
      el.scrollTo({ top: el.scrollHeight });
    }
  }, [messages.length]);

  if (loadError) {
    return (
      <div className="ta-lab-shell" data-theme="ta-lab">
        <p className="form-error">{loadError}</p>
        <Link href="/student" className="back-link">
          ← Back
        </Link>
      </div>
    );
  }
  if (!assignment) {
    return (
      <div className="ta-lab-shell" data-theme="ta-lab">
        <p className="ta-lab__muted">Booting TA Lab…</p>
      </div>
    );
  }

  return (
    <div className="ta-lab-shell" data-theme="ta-lab">
      <TaLabTopbar
        assignment={assignment}
        aiHelpEnabled={aiHelpEnabled}
        requestType={requestType}
        onRequestTypeChange={setRequestType}
        speechSupported={speechSupported}
        speakReplies={speakReplies}
        onToggleSpeakReplies={() => setSpeakReplies((v) => !v)}
        voiceSettingsOpen={voiceSettingsOpen}
        onToggleVoiceSettings={() => setVoiceSettingsOpen((v) => !v)}
        onClear={clearTranscript}
      />

      <div className="ta-lab__main">
        <TaLabStage state={brainState} aiHelpEnabled={aiHelpEnabled} />

        {voiceSettingsOpen && speechSupported ? (
          <VoiceSettingsPanel
            value={voice}
            onChange={setVoice}
            onClose={() => setVoiceSettingsOpen(false)}
            disabled={!aiHelpEnabled}
          />
        ) : null}
      </div>

      <TaLabTranscript ref={transcriptRef} messages={messages} turns={turns} error={turnError} />

      <TaLabInputDock
        assignment={assignment}
        aiHelpEnabled={aiHelpEnabled}
        pending={pending}
        input={input}
        onInputChange={setInput}
        onSend={send}
        onVoiceState={handleVoiceState}
        onTranscript={appendTranscript}
        onVoiceError={(e) => setTurnError(e.message)}
      />
    </div>
  );
}
